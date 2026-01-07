from datetime import date
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from main import app
from routers import chatbot as chatbot_router


def make_movie(title, year=None, score=None):
    return SimpleNamespace(
        title=title,
        release_date=date(year, 1, 1) if year else None,
        imdb_score=score,
        description="desc",
        storyline="story",
    )


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def override_db():
    def _override():
        yield None

    app.dependency_overrides[chatbot_router.get_db] = _override
    yield
    app.dependency_overrides.clear()


def test_normalize_strips_punctuation_and_spaces():
    assert chatbot_router.normalize("  Interstellar!!! ") == "interstellar"


def test_extract_filters_year_rating_and_tokens():
    tokens, year, rating = chatbot_router.extract_filters("Inception 2010 rating >= 8")
    assert year == 2010
    assert rating == (">=", 8.0)
    assert "inception" in tokens
    assert "rating" not in tokens


def test_extract_filters_default_operator_for_rating_keyword():
    tokens, year, rating = chatbot_router.extract_filters("8 diem")
    assert rating == (">=", 8.0)
    assert tokens == []


def test_extract_filters_supports_diacritic_rating_keyword():
    question = "8 \u0111i\u1ec3m"
    tokens, year, rating = chatbot_router.extract_filters(question)
    assert rating == (">=", 8.0)
    assert tokens == []


def test_extract_filters_first_year_wins_when_multiple_years_present():
    tokens, year, rating = chatbot_router.extract_filters("1999 2010 the matrix")
    assert year == 1999
    assert "matrix" in tokens


def test_build_llm_messages_includes_question_and_movie_list():
    movies = [make_movie("Inception", 2010, 8.8)]
    messages = chatbot_router.build_llm_messages("inception", movies)
    assert messages[0]["role"] == "system"
    assert "Answer in English" in messages[0]["content"]
    assert "Only use the provided movie list" in messages[0]["content"]
    assert "Do not invent titles" in messages[0]["content"]
    assert "Inception" in messages[-1]["content"]
    assert "2010" in messages[-1]["content"]


def test_build_general_messages_includes_question():
    messages = chatbot_router.build_general_messages("hi")
    assert messages[0]["role"] == "system"
    assert "Answer in English" in messages[0]["content"]
    assert "general conversation" in messages[0]["content"].lower()
    assert "hi" in messages[-1]["content"]


def test_format_fallback_answer_lists_movies():
    movies = [make_movie("Inception", 2010, 8.8), make_movie("Heat", 1995, None)]
    text = chatbot_router.format_fallback_answer(movies)
    assert "Inception" in text
    assert "Heat" in text
    assert "IMDb" in text


def test_chat_accepts_json_body(client, monkeypatch):
    movies = [make_movie("Inception", 2010, 8.8)]
    captured = {}

    def fake_search(_db, question):
        captured["question"] = question
        return movies

    def fake_generate(question, prompt_movies):
        captured["llm_question"] = question
        captured["llm_movies"] = prompt_movies
        return "ok"

    monkeypatch.setattr(chatbot_router, "search_movies", fake_search)
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", fake_generate)

    resp = client.post("/chatbot/chat", json={"question": "inception"})
    assert resp.status_code == 200
    assert resp.json()["answer"] == "ok"
    assert captured["question"] == "inception"
    assert captured["llm_question"] == "inception"
    assert captured["llm_movies"] == movies


def test_chat_accepts_query_param(client, monkeypatch):
    movies = [make_movie("Interstellar", 2014, 8.6)]

    monkeypatch.setattr(chatbot_router, "search_movies", lambda _db, _q: movies)
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", lambda _q, _m: "ok")

    resp = client.post("/chatbot/chat?question=interstellar")
    assert resp.status_code == 200
    assert resp.json()["answer"] == "ok"


def test_chat_body_takes_precedence_over_query_param(client, monkeypatch):
    captured = {}

    def fake_search(_db, question):
        captured["question"] = question
        return [make_movie("Inception", 2010, 8.8)]

    monkeypatch.setattr(chatbot_router, "search_movies", fake_search)
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", lambda _q, _m: "ok")

    resp = client.post("/chatbot/chat?question=query", json={"question": "body"})
    assert resp.status_code == 200
    assert captured["question"] == "body"


def test_chat_trims_question_before_search(client, monkeypatch):
    captured = {}

    def fake_search(_db, question):
        captured["question"] = question
        return [make_movie("Inception", 2010, 8.8)]

    monkeypatch.setattr(chatbot_router, "search_movies", fake_search)
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", lambda _q, _m: "ok")

    resp = client.post("/chatbot/chat", json={"question": "  inception  "})
    assert resp.status_code == 200
    assert captured["question"] == "inception"


def test_chat_returns_400_on_empty_question(client):
    resp = client.post("/chatbot/chat", json={"question": "   "})
    assert resp.status_code == 400
    assert "detail" in resp.json()


def test_chat_general_query_calls_llm_without_search(client, monkeypatch):
    def fake_search(_db, _q):
        raise AssertionError("search should not be called for general queries")

    def fake_generate(_q, prompt_movies):
        assert prompt_movies == []
        return "ok"

    monkeypatch.setattr(chatbot_router, "search_movies", fake_search)
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", fake_generate)

    resp = client.post("/chatbot/chat", json={"question": "hi"})
    assert resp.status_code == 200
    assert resp.json()["answer"] == "ok"


def test_chat_no_results_calls_llm(client, monkeypatch):
    called = {"llm": False}

    def fake_generate(_q, _m):
        called["llm"] = True
        return "ok"

    monkeypatch.setattr(chatbot_router, "search_movies", lambda _db, _q: [])
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", fake_generate)

    resp = client.post("/chatbot/chat", json={"question": "recommend movies 2020"})
    assert resp.status_code == 200
    assert called["llm"] is True
    assert resp.json()["answer"] == "ok"


def test_chat_openai_failure_falls_back_to_local_answer(client, monkeypatch):
    movies = [make_movie("Inception", 2010, 8.8)]

    monkeypatch.setattr(chatbot_router, "search_movies", lambda _db, _q: movies)

    def fake_generate(_q, _m):
        raise RuntimeError("boom")

    monkeypatch.setattr(chatbot_router, "generate_llm_answer", fake_generate)

    resp = client.post("/chatbot/chat", json={"question": "inception"})
    assert resp.status_code == 200
    assert "Inception" in resp.json()["answer"]


def test_chat_openai_empty_response_falls_back(client, monkeypatch):
    movies = [make_movie("Inception", 2010, 8.8)]

    monkeypatch.setattr(chatbot_router, "search_movies", lambda _db, _q: movies)
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", lambda _q, _m: "   ")

    resp = client.post("/chatbot/chat", json={"question": "inception"})
    assert resp.status_code == 200
    assert "Inception" in resp.json()["answer"]


def test_chat_general_llm_failure_returns_generic_message(client, monkeypatch):
    def fake_generate(_q, _m):
        raise RuntimeError("boom")

    monkeypatch.setattr(chatbot_router, "generate_llm_answer", fake_generate)
    monkeypatch.setattr(chatbot_router, "search_movies", lambda _db, _q: [])

    resp = client.post("/chatbot/chat", json={"question": "hi"})
    assert resp.status_code == 200
    assert resp.json()["answer"] == "Sorry, I'm having trouble right now."


def test_chat_general_llm_empty_response_returns_generic_message(client, monkeypatch):
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", lambda _q, _m: "   ")
    monkeypatch.setattr(chatbot_router, "search_movies", lambda _db, _q: [])

    resp = client.post("/chatbot/chat", json={"question": "hello"})
    assert resp.status_code == 200
    assert resp.json()["answer"] == "Sorry, I'm having trouble right now."


def test_chat_limits_movie_count_sent_to_llm(client, monkeypatch):
    movies = [make_movie(f"Movie {i}", 2000 + i, 7.0) for i in range(15)]
    captured = {}

    monkeypatch.setattr(chatbot_router, "search_movies", lambda _db, _q: movies)

    def fake_generate(_q, prompt_movies):
        captured["count"] = len(prompt_movies)
        return "ok"

    monkeypatch.setattr(chatbot_router, "generate_llm_answer", fake_generate)

    resp = client.post("/chatbot/chat", json={"question": "recommend movies"})
    assert resp.status_code == 200
    assert captured["count"] <= 10


def test_chat_ambiguous_movie_query_uses_db(client, monkeypatch):
    called = {"search": False}

    def fake_search(_db, _q):
        called["search"] = True
        return [make_movie("Heat", 1995, 8.2)]

    monkeypatch.setattr(chatbot_router, "search_movies", fake_search)
    monkeypatch.setattr(chatbot_router, "generate_llm_answer", lambda _q, _m: "ok")

    resp = client.post("/chatbot/chat", json={"question": "movie tickets price"})
    assert resp.status_code == 200
    assert called["search"] is True
