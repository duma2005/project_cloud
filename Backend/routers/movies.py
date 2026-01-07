from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from deps import get_db, get_current_admin
from models import Favorite, Genre, Movie, MovieCast, MovieGenre, Person, Rating
from schemas import CastCreate, CastDelete, MovieCreate, MovieUpdate

router = APIRouter(prefix="/movies", tags=["Movies"])


def _normalize_genres(genres: list[str] | None):
    if not genres:
        return []
    normalized = []
    seen = set()
    for name in genres:
        cleaned = name.strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(cleaned)
    return normalized


@router.get("")
def list_movies(
    query: str | None = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    safe_page = max(1, page)
    safe_limit = min(max(1, limit), 50)
    offset = (safe_page - 1) * safe_limit

    base_query = db.query(Movie)
    if query:
        base_query = base_query.filter(Movie.title.ilike(f"%{query}%"))

    total = base_query.count()
    results = (
        base_query
        .order_by(Movie.title.asc())
        .offset(offset)
        .limit(safe_limit)
        .all()
    )
    return {
        "query": query or "",
        "page": safe_page,
        "limit": safe_limit,
        "total_results": total,
        "results": [
            {
                "movie_id": m.movie_id,
                "title": m.title,
                "release_date": m.release_date,
                "imdb_score": m.imdb_score,
            }
            for m in results
        ],
    }


@router.get("/search")
def search_movies(query: str, page: int = 1, limit: int = 20, db: Session = Depends(get_db)):
    safe_page = max(1, page)
    safe_limit = min(max(1, limit), 50)
    offset = (safe_page - 1) * safe_limit

    base_query = db.query(Movie).filter(Movie.title.ilike(f"%{query}%"))
    total_results = base_query.count()
    results = (
        base_query
        .order_by(Movie.title.asc())
        .offset(offset)
        .limit(safe_limit)
        .all()
    )
    return {
        "query": query,
        "page": safe_page,
        "limit": safe_limit,
        "total_results": total_results,
        "results": [
            {
                "movie_id": m.movie_id,
                "title": m.title,
                "release_date": m.release_date,
                "imdb_score": m.imdb_score,
                "poster_url": m.poster_url,
            }
            for m in results
        ],
    }


@router.get("/{movie_id}")
def movie_detail(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    genres = (
        db.query(Genre)
        .join(MovieGenre, MovieGenre.genre_id == Genre.genre_id)
        .filter(MovieGenre.movie_id == movie_id)
        .order_by(Genre.name.asc())
        .all()
    )
    return {
        "movie_id": movie.movie_id,
        "title": movie.title,
        "original_title": movie.original_title,
        "release_date": movie.release_date,
        "duration_minutes": movie.duration_minutes,
        "age_rating": movie.age_rating,
        "description": movie.description,
        "storyline": movie.storyline,
        "imdb_score": movie.imdb_score,
        "imdb_vote_count": movie.imdb_vote_count,
        "poster_url": movie.poster_url,
        "cover_url": movie.cover_url,
        "trailer_url": movie.trailer_url,
        "genres": [g.name for g in genres],
    }


@router.post("/", status_code=201)
def create_movie(
    data: MovieCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    movie = Movie(
        title=data.title.strip(),
        original_title=data.original_title.strip() if data.original_title else None,
        release_date=data.release_date,
        duration_minutes=data.duration_minutes,
        age_rating=data.age_rating.strip() if data.age_rating else None,
        description=data.description.strip() if data.description else None,
        storyline=data.storyline.strip() if data.storyline else None,
        imdb_score=data.imdb_score,
        imdb_vote_count=data.imdb_vote_count,
        poster_url=data.poster_url.strip() if data.poster_url else None,
        cover_url=data.cover_url.strip() if data.cover_url else None,
        trailer_url=data.trailer_url.strip() if data.trailer_url else None,
    )
    db.add(movie)
    db.flush()

    for name in _normalize_genres(data.genres):
        genre = db.query(Genre).filter(func.lower(Genre.name) == name.lower()).first()
        if not genre:
            genre = Genre(name=name)
            db.add(genre)
            db.flush()
        db.add(MovieGenre(movie_id=movie.movie_id, genre_id=genre.genre_id))

    db.commit()
    db.refresh(movie)
    return {"movie_id": movie.movie_id, "title": movie.title}


@router.put("/{movie_id}")
def update_movie(
    movie_id: int,
    data: MovieUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    payload = data.dict(exclude_unset=True)
    if "title" in payload and payload["title"] is not None:
        movie.title = payload["title"].strip()
    if "original_title" in payload:
        movie.original_title = payload["original_title"].strip() if payload["original_title"] else None
    if "release_date" in payload:
        movie.release_date = payload["release_date"]
    if "duration_minutes" in payload:
        movie.duration_minutes = payload["duration_minutes"]
    if "age_rating" in payload:
        movie.age_rating = payload["age_rating"].strip() if payload["age_rating"] else None
    if "description" in payload:
        movie.description = payload["description"].strip() if payload["description"] else None
    if "storyline" in payload:
        movie.storyline = payload["storyline"].strip() if payload["storyline"] else None
    if "imdb_score" in payload:
        movie.imdb_score = payload["imdb_score"]
    if "imdb_vote_count" in payload:
        movie.imdb_vote_count = payload["imdb_vote_count"]
    if "poster_url" in payload:
        movie.poster_url = payload["poster_url"].strip() if payload["poster_url"] else None
    if "cover_url" in payload:
        movie.cover_url = payload["cover_url"].strip() if payload["cover_url"] else None
    if "trailer_url" in payload:
        movie.trailer_url = payload["trailer_url"].strip() if payload["trailer_url"] else None

    if "genres" in payload:
        db.query(MovieGenre).filter(MovieGenre.movie_id == movie_id).delete()
        for name in _normalize_genres(payload["genres"]):
            genre = db.query(Genre).filter(func.lower(Genre.name) == name.lower()).first()
            if not genre:
                genre = Genre(name=name)
                db.add(genre)
                db.flush()
            db.add(MovieGenre(movie_id=movie.movie_id, genre_id=genre.genre_id))

    db.commit()
    db.refresh(movie)
    return {"movie_id": movie.movie_id, "title": movie.title}


@router.delete("/{movie_id}")
def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    db.query(MovieCast).filter(MovieCast.movie_id == movie_id).delete()
    db.query(MovieGenre).filter(MovieGenre.movie_id == movie_id).delete()
    db.query(Favorite).filter(Favorite.movie_id == movie_id).delete()
    db.query(Rating).filter(Rating.movie_id == movie_id).delete()
    db.delete(movie)
    db.commit()
    return {"ok": True}


@router.get("/{movie_id}/genres")
def list_movie_genres(
    movie_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    genres = (
        db.query(Genre)
        .join(MovieGenre, MovieGenre.genre_id == Genre.genre_id)
        .filter(MovieGenre.movie_id == movie_id)
        .order_by(Genre.name.asc())
        .all()
    )
    return [{"genre_id": g.genre_id, "name": g.name} for g in genres]


@router.get("/{movie_id}/cast")
def list_movie_cast(
    movie_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    cast = (
        db.query(MovieCast, Person)
        .join(Person, Person.person_id == MovieCast.person_id)
        .filter(MovieCast.movie_id == movie_id)
        .order_by(MovieCast.role.asc(), Person.full_name.asc())
        .all()
    )
    return [
        {
            "person_id": person.person_id,
            "full_name": person.full_name,
            "role": movie_cast.role.value,
            "character_name": movie_cast.character_name,
        }
        for movie_cast, person in cast
    ]


@router.post("/{movie_id}/cast", status_code=201)
def add_movie_cast(
    movie_id: int,
    data: CastCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    person = db.query(Person).filter(Person.person_id == data.person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    existing = (
        db.query(MovieCast)
        .filter(
            MovieCast.movie_id == movie_id,
            MovieCast.person_id == data.person_id,
            MovieCast.role == data.role
        )
        .first()
    )
    if existing:
        return {"message": "Cast already exists"}

    entry = MovieCast(
        movie_id=movie_id,
        person_id=data.person_id,
        role=data.role,
        character_name=data.character_name.strip() if data.character_name else None
    )
    db.add(entry)
    db.commit()
    return {"ok": True}


@router.delete("/{movie_id}/cast")
def remove_movie_cast(
    movie_id: int,
    data: CastDelete,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    deleted = (
        db.query(MovieCast)
        .filter(
            MovieCast.movie_id == movie_id,
            MovieCast.person_id == data.person_id,
            MovieCast.role == data.role
        )
        .delete()
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Cast entry not found")
    db.commit()
    return {"ok": True}
