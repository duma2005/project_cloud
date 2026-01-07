from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import Favorite
from schemas import WatchlistCreate
from deps import get_db, get_current_user

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

@router.post("/add")
def add_to_watchlist(
    data: WatchlistCreate,
    user_id=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Favorite).filter_by(user_id=user_id, movie_id=data.movie_id).first()
    if existing:
        return {"message": "Already in favorites"}

    item = Favorite(user_id=user_id, movie_id=data.movie_id)
    db.add(item)
    db.commit()
    return {"message": "Added to favorites"}

@router.get("/")
def get_watchlist(
    user_id=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Favorite).filter_by(user_id=user_id).all()
