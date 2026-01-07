from typing import Optional

import os
import re

import requests
from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import extract, or_
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Movie

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatRequest(BaseModel):
    question: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def normalize(text: str):
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return " ".join(text.split())


RATING_KEYWORDS = ("rating", "diem", "điểm", "sao")
MOVIE_KEYWORDS = (
    "movie",
    "movies",
    "phim",
    "recommend",
    "suggest",
    "gợi ý",
    "goi y",
    "rating",
    "imdb",
    "genre",
    "actor",
    "director",
    "cast",
)
GENERAL_KEYWORDS = (
    "hi",
    "hello",
    "hey",
    "xin chao",
    "chao",
    "how are you",
    "what's up",
    "tell me",
    "joke",
    "weather",
    "time",
    "date",
    "help",
)
GENERAL_FALLBACK = "Sorry, I'm having trouble right now."


class GeneralPrompt(list):
    is_general = True


def looks_like_movie_query(question: str) -> bool:
    normalized = normalize(question)
    if re.search(r"\b(19|20)\d{2}\b", normalized):
        return True
    if re.search(r"(>=|>|<=|<)\s*\d+(\.\d+)?", normalized):
        return True
    return any(keyword in normalized for keyword in MOVIE_KEYWORDS)


def is_general_query(question: str) -> bool:
    normalized = normalize(question)
    if looks_like_movie_query(normalized):
        return False
    return any(keyword in normalized for keyword in GENERAL_KEYWORDS)


def extract_filters(question: str):
    normalized = normalize(question)
    year_match = re.search(r"\b(19|20)\d{2}\b", normalized)
    extracted_year = int(year_match.group()) if year_match else None

    raw = question.lower()
    keyword_pattern = r"(?:rating|diem|điểm|sao)"
    rating_match = re.search(
        rf"(?P<keyword>{keyword_pattern})\s*(?P<op>>=|>|<=|<)?\s*(?P<val>\d+(\.\d+)?)",
        raw,
    )
    if not rating_match:
        rating_match = re.search(
            rf"(?P<op>>=|>|<=|<)?\s*(?P<val>\d+(\.\d+)?)\s*(?P<keyword>{keyword_pattern})",
            raw,
        )

    rating_filter = None
    if rating_match:
        op = rating_match.group("op") or ">="
        rating_filter = (op, float(rating_match.group("val")))

    tokens = [
        token
        for token in normalized.split()
        if not token.isdigit() and token not in RATING_KEYWORDS
    ]

    return tokens, extracted_year, rating_filter


def search_movies(db: Session, question: str):
    tokens, extracted_year, rating_filter = extract_filters(question)

    query = db.query(Movie)
    if extracted_year:
        query = query.filter(extract("year", Movie.release_date) == extracted_year)
    if rating_filter:
        op, val = rating_filter
        if op == ">=":
            query = query.filter(Movie.imdb_score >= val)
        elif op == ">":
            query = query.filter(Movie.imdb_score > val)
        elif op == "<=":
            query = query.filter(Movie.imdb_score <= val)
        elif op == "<":
            query = query.filter(Movie.imdb_score < val)

    if tokens:
        token_filters = []
        for token in tokens:
            token_filters.append(Movie.title.ilike(f"%{token}%"))
            token_filters.append(Movie.description.ilike(f"%{token}%"))
            token_filters.append(Movie.storyline.ilike(f"%{token}%"))
        query = query.filter(or_(*token_filters))

    return query.limit(25).all()


def build_llm_messages(question: str, movies):
    movie_lines = []
    for movie in movies:
        year = movie.release_date.year if movie.release_date else "—"
        imdb = movie.imdb_score or "—"
        movie_lines.append(f"- {movie.title} ({year}) | IMDb: {imdb}")

    catalog = "\n".join(movie_lines) if movie_lines else "(no matches)"
    return [
        {
            "role": "system",
            "content": (
                "You are a helpful movie assistant. Answer in English. "
                "Only use the provided movie list. Do not invent titles."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Question: {question}\n\n"
                "Movie list:\n"
                f"{catalog}\n\n"
                "Respond with a concise, friendly answer."
            ),
        },
    ]


def build_general_messages(question: str):
    return [
        {
            "role": "system",
            "content": (
                "You are a helpful assistant for general conversation. "
                "Answer in English."
            ),
        },
        {
            "role": "user",
            "content": question,
        },
    ]


def generate_llm_answer(question: str, movies):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY")

    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    if getattr(movies, "is_general", False):
        messages = build_general_messages(question)
    else:
        messages = build_llm_messages(question, movies)
    system_text = messages[0]["content"]
    user_text = messages[-1]["content"]
    payload = {
        "contents": [{"role": "user", "parts": [{"text": user_text}]}],
        "systemInstruction": {"parts": [{"text": system_text}]},
        "generationConfig": {"temperature": 0.4},
    }
    headers = {"Content-Type": "application/json"}
    res = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        json=payload,
        headers=headers,
        timeout=12,
    )
    if not res.ok:
        raise RuntimeError(f"Gemini request failed ({res.status_code})")
    data = res.json()
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        return ""
    return parts[0].get("text", "")


def format_fallback_answer(movies):
    if not movies:
        return "🤖 Sorry, I could not find any matching movies."

    lines = []
    for movie in movies:
        year = movie.release_date.year if movie.release_date else "—"
        imdb = movie.imdb_score or "—"
        lines.append(f"🎬 **{movie.title}** ({year}) • IMDb: {imdb}")

    return "🤖 Found these movies:\n\n" + "\n".join(lines)


@router.post("/chat")
def chat(
    question: Optional[str] = None,
    payload: Optional[ChatRequest] = Body(None),
    db: Session = Depends(get_db),
):
    question_text = payload.question if payload and payload.question is not None else question
    question_text = question_text.strip() if question_text else None
    if not question_text:
        raise HTTPException(status_code=400, detail="Vui lòng nhập câu hỏi")

    cleaned = question_text
    if is_general_query(cleaned):
        try:
            answer = generate_llm_answer(cleaned, GeneralPrompt())
        except Exception:
            answer = ""

        if not answer or not answer.strip():
            return {"answer": GENERAL_FALLBACK}
        return {"answer": answer.strip()}

    results = search_movies(db, cleaned)
    prompt_movies = results[:10]
    try:
        answer = generate_llm_answer(cleaned, prompt_movies)
    except Exception:
        answer = ""

    if not answer or not answer.strip():
        return {"answer": format_fallback_answer(results)}

    return {"answer": answer.strip()}
