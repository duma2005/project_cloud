from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import JWT_ALGORITHM, JWT_SECRET
from database import Base
from deps import get_db
from main import app
from models import Movie, User


@pytest.fixture()
def db_session(tmp_path):
    db_path = tmp_path / "ratings.db"
    engine = create_engine(
        f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_token(user_id: int) -> str:
    return jwt.encode({"user_id": user_id}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_user(db, email: str):
    user = User(
        username=email.split("@")[0],
        email=email,
        password_hash="test",
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_movie(db, title: str):
    movie = Movie(title=title)
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


def test_post_rating_requires_auth(client):
    resp = client.post("/ratings/", json={"movie_id": 1, "rating": 4})
    assert resp.status_code == 403


def test_post_rating_rejects_invalid_token(client):
    resp = client.post(
        "/ratings/",
        json={"movie_id": 1, "rating": 4},
        headers={"Authorization": "Bearer bad-token"},
    )
    assert resp.status_code == 401


def test_post_rating_returns_404_when_movie_missing(client, db_session):
    user = create_user(db_session, "user@example.com")
    token = make_token(user.user_id)
    resp = client.post(
        "/ratings/",
        json={"movie_id": 999, "rating": 4},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404


def test_post_rating_validates_range(client, db_session):
    user = create_user(db_session, "user@example.com")
    movie = create_movie(db_session, "Test Movie")
    token = make_token(user.user_id)

    resp = client.post(
        "/ratings/",
        json={"movie_id": movie.movie_id, "rating": 5.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


def test_post_rating_creates_or_updates_single_user_rating(client, db_session):
    user = create_user(db_session, "user@example.com")
    movie = create_movie(db_session, "Test Movie")
    token = make_token(user.user_id)

    resp = client.post(
        "/ratings/",
        json={"movie_id": movie.movie_id, "rating": 3.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["movie_id"] == movie.movie_id
    assert body["count"] == 1
    assert body["user_rating"] == pytest.approx(3.5)
    assert body["average"] == pytest.approx(3.5)

    resp = client.post(
        "/ratings/",
        json={"movie_id": movie.movie_id, "rating": 4.0},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["user_rating"] == pytest.approx(4.0)
    assert body["average"] == pytest.approx(4.0)


def test_get_rating_summary_includes_user_rating(client, db_session):
    user1 = create_user(db_session, "user1@example.com")
    user2 = create_user(db_session, "user2@example.com")
    movie = create_movie(db_session, "Test Movie")
    token1 = make_token(user1.user_id)
    token2 = make_token(user2.user_id)

    client.post(
        "/ratings/",
        json={"movie_id": movie.movie_id, "rating": 4.0},
        headers={"Authorization": f"Bearer {token1}"},
    )
    client.post(
        "/ratings/",
        json={"movie_id": movie.movie_id, "rating": 2.0},
        headers={"Authorization": f"Bearer {token2}"},
    )

    resp = client.get(
        f"/ratings/{movie.movie_id}",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["movie_id"] == movie.movie_id
    assert body["count"] == 2
    assert body["average"] == pytest.approx(3.0)
    assert body["user_rating"] == pytest.approx(4.0)


def test_get_rating_returns_404_when_movie_missing(client, db_session):
    user = create_user(db_session, "user@example.com")
    token = make_token(user.user_id)
    resp = client.get("/ratings/999", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 404
