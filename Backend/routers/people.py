from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_current_admin, get_db
from models import MovieCast, Person
from schemas import PersonCreate, PersonUpdate

router = APIRouter(prefix="/people", tags=["People"])


@router.get("/")
def list_people(query: str | None = None, db: Session = Depends(get_db)):
    base_query = db.query(Person)
    if query:
        base_query = base_query.filter(Person.full_name.ilike(f"%{query}%"))
    results = base_query.order_by(Person.full_name.asc()).all()
    return [
        {
            "person_id": p.person_id,
            "full_name": p.full_name,
            "birth_date": p.birth_date,
            "avatar_url": p.avatar_url,
            "bio": p.bio,
        }
        for p in results
    ]


@router.post("/", status_code=201)
def create_person(
    data: PersonCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    person = Person(
        full_name=data.full_name.strip(),
        birth_date=data.birth_date,
        avatar_url=data.avatar_url.strip() if data.avatar_url else None,
        bio=data.bio.strip() if data.bio else None,
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return {"person_id": person.person_id, "full_name": person.full_name}


@router.put("/{person_id}")
def update_person(
    person_id: int,
    data: PersonUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    person = db.query(Person).filter(Person.person_id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    payload = data.dict(exclude_unset=True)
    if "full_name" in payload and payload["full_name"] is not None:
        person.full_name = payload["full_name"].strip()
    if "birth_date" in payload:
        person.birth_date = payload["birth_date"]
    if "avatar_url" in payload:
        person.avatar_url = payload["avatar_url"].strip() if payload["avatar_url"] else None
    if "bio" in payload:
        person.bio = payload["bio"].strip() if payload["bio"] else None

    db.commit()
    db.refresh(person)
    return {"person_id": person.person_id, "full_name": person.full_name}


@router.delete("/{person_id}")
def delete_person(
    person_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    person = db.query(Person).filter(Person.person_id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    db.query(MovieCast).filter(MovieCast.person_id == person_id).delete()
    db.delete(person)
    db.commit()
    return {"ok": True}
