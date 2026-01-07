from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models import Movie, Rating
from schemas import RatingCreate

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.post("/")
def rate_movie(
    payload: RatingCreate,
    user_id=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    movie = db.query(Movie).filter(Movie.movie_id == payload.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    existing = (
        db.query(Rating)
        .filter(Rating.user_id == user_id, Rating.movie_id == payload.movie_id)
        .first()
    )
    if existing:
        existing.rating = payload.rating
    else:
        db.add(Rating(user_id=user_id, movie_id=payload.movie_id, rating=payload.rating))
    db.commit()

    avg, count = (
        db.query(func.avg(Rating.rating), func.count(Rating.user_id))
        .filter(Rating.movie_id == payload.movie_id)
        .first()
    )
    user_rating = (
        db.query(Rating.rating)
        .filter(Rating.user_id == user_id, Rating.movie_id == payload.movie_id)
        .scalar()
    )

    return {
        "movie_id": payload.movie_id,
        "average": float(avg) if avg is not None else 0.0,
        "count": int(count or 0),
        "user_rating": float(user_rating) if user_rating is not None else None,
    }


@router.get("/{movie_id}")
def get_average_rating(
    movie_id: int,
    user_id=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    avg, count = (
        db.query(func.avg(Rating.rating), func.count(Rating.user_id))
        .filter(Rating.movie_id == movie_id)
        .first()
    )
    user_rating = (
        db.query(Rating.rating)
        .filter(Rating.user_id == user_id, Rating.movie_id == movie_id)
        .scalar()
    )

    return {
        "movie_id": movie_id,
        "average": float(avg) if avg is not None else 0.0,
        "count": int(count or 0),
        "user_rating": float(user_rating) if user_rating is not None else None,
    }
