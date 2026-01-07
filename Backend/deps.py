from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt
from sqlalchemy.orm import Session
from database import SessionLocal, apply_schema
from models import User, UserRole
from config import JWT_SECRET, JWT_ALGORITHM

security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        apply_schema(db)
        yield db
    finally:
        db.close()

def get_current_user(token=Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload["user_id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_admin(
    user_id=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user or user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin required")
    return user
