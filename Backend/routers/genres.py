from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from deps import get_current_admin, get_db
from models import Genre, MovieGenre
from schemas import GenreCreate, GenreUpdate

router = APIRouter(prefix="/genres", tags=["Genres"])


@router.get("/")
def list_genres(query: str | None = None, db: Session = Depends(get_db)):
    base_query = db.query(Genre)
    if query:
        base_query = base_query.filter(Genre.name.ilike(f"%{query}%"))
    results = base_query.order_by(Genre.name.asc()).all()
    return [{"genre_id": g.genre_id, "name": g.name} for g in results]


@router.post("/", status_code=201)
def create_genre(
    data: GenreCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    existing = db.query(Genre).filter(func.lower(Genre.name) == data.name.lower()).first()
    if existing:
        return {"genre_id": existing.genre_id, "name": existing.name}
    genre = Genre(name=data.name.strip())
    db.add(genre)
    db.commit()
    db.refresh(genre)
    return {"genre_id": genre.genre_id, "name": genre.name}


@router.put("/{genre_id}")
def update_genre(
    genre_id: int,
    data: GenreUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    genre = db.query(Genre).filter(Genre.genre_id == genre_id).first()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")
    genre.name = data.name.strip()
    db.commit()
    db.refresh(genre)
    return {"genre_id": genre.genre_id, "name": genre.name}


@router.delete("/{genre_id}")
def delete_genre(
    genre_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    genre = db.query(Genre).filter(Genre.genre_id == genre_id).first()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")
    db.query(MovieGenre).filter(MovieGenre.genre_id == genre_id).delete()
    db.delete(genre)
    db.commit()
    return {"ok": True}
