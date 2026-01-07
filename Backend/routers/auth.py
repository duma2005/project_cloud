import hashlib
import hmac
import secrets
from fastapi import APIRouter, Depends, HTTPException
from pydantic import EmailStr, TypeAdapter
from sqlalchemy.orm import Session
from jose import jwt
from config import JWT_SECRET, JWT_ALGORITHM
from deps import get_db
from models import User
from schemas import AuthLogin, AuthRegister

router = APIRouter(prefix="/auth", tags=["Auth"])

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    rounds = 120_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), rounds)
    return f"pbkdf2_sha256${rounds}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, rounds_str, salt, hash_hex = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        rounds = int(rounds_str)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), rounds)
        return hmac.compare_digest(digest.hex(), hash_hex)
    except Exception:
        return False


def normalize_email(email: str) -> str:
    cleaned = email.strip()
    if cleaned.lower() == "admin@a":
        return cleaned
    try:
        TypeAdapter(EmailStr).validate_python(cleaned)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid email format")
    return cleaned


def build_username(db: Session, email: str) -> str:
    base = email.split("@")[0] if "@" in email else email
    base = base.replace(" ", "").lower() or "user"
    candidate = base
    counter = 1
    while db.query(User).filter(User.username == candidate).first():
        counter += 1
        candidate = f"{base}{counter}"
    return candidate


@router.post("/register")
def register(data: AuthRegister, db: Session = Depends(get_db)):
    email = normalize_email(data.email)
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    username = build_username(db, email)
    user = User(
        email=email,
        username=username,
        password_hash=hash_password(data.password),
        full_name=data.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = jwt.encode(
        {"user_id": user.user_id},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    return {"access_token": token}


@router.post("/login")
def login(data: AuthLogin, db: Session = Depends(get_db)):
    email = normalize_email(data.email)
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode(
        {"user_id": user.user_id},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return {"access_token": token}
