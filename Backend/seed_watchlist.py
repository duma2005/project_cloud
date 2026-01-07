import argparse
import hashlib
import os
import secrets
from datetime import date
from pathlib import Path


def load_env_from_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


env_path = Path(__file__).resolve().parents[1] / "film-consensus" / ".env"
load_env_from_file(env_path)

from sqlalchemy.orm import Session

seed_db_url = os.getenv("SEED_DATABASE_URL")
if seed_db_url:
    os.environ["DATABASE_URL"] = seed_db_url

from database import Base, SessionLocal, engine
from models import Favorite, Movie, User


MOVIES = [
    {
        "title": "Inception",
        "release_date": date(2010, 7, 16),
        "duration_minutes": 148,
        "imdb_score": 8.8,
        "description": "A thief enters dreams to steal secrets.",
        "storyline": "A crew plants an idea in a target's mind.",
        "poster_url": "https://image.tmdb.org/t/p/w500/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
    },
    {
        "title": "Interstellar",
        "release_date": date(2014, 11, 7),
        "duration_minutes": 169,
        "imdb_score": 8.6,
        "description": "Explorers travel through a wormhole in space.",
        "storyline": "A team searches for a new home for humanity.",
        "poster_url": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    },
    {
        "title": "The Dark Knight",
        "release_date": date(2008, 7, 18),
        "duration_minutes": 152,
        "imdb_score": 9.0,
        "description": "Batman faces the Joker in Gotham.",
        "storyline": "A new villain pushes Gotham to chaos.",
        "poster_url": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    },
    {
        "title": "The Matrix",
        "release_date": date(1999, 3, 31),
        "duration_minutes": 136,
        "imdb_score": 8.7,
        "description": "A hacker discovers the world is a simulation.",
        "storyline": "Rebels fight to free humanity from machines.",
        "poster_url": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    },
    {
        "title": "Blade Runner 2049",
        "release_date": date(2017, 10, 6),
        "duration_minutes": 163,
        "imdb_score": 8.0,
        "description": "A new blade runner uncovers a secret.",
        "storyline": "An officer searches for a missing replicant.",
        "poster_url": "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    },
    {
        "title": "Parasite",
        "release_date": date(2019, 5, 30),
        "duration_minutes": 132,
        "imdb_score": 8.5,
        "description": "A poor family schemes to work for a rich family.",
        "storyline": "Class tensions rise after a family infiltrates a home.",
        "poster_url": "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    },
    {
        "title": "Dune",
        "release_date": date(2021, 10, 22),
        "duration_minutes": 155,
        "imdb_score": 8.0,
        "description": "A noble family becomes entangled in a galactic war.",
        "storyline": "A young heir embraces his destiny on a desert planet.",
        "poster_url": "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    },
    {
        "title": "Oppenheimer",
        "release_date": date(2023, 7, 21),
        "duration_minutes": 180,
        "imdb_score": 8.4,
        "description": "The story of the father of the atomic bomb.",
        "storyline": "A physicist leads the Manhattan Project.",
        "poster_url": "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    },
]

DEMO_EMAIL = "demo@filmconsensus.local"
DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo1234"
SEED_TITLES = [movie["title"] for movie in MOVIES]


def upsert_movie(db: Session, payload: dict) -> Movie:
    movie = db.query(Movie).filter(Movie.title == payload["title"]).first()
    if movie:
        for key, value in payload.items():
            setattr(movie, key, value)
        return movie
    movie = Movie(**payload)
    db.add(movie)
    return movie


def get_or_create_user(db: Session) -> User:
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if user:
        return user
    salt = secrets.token_hex(16)
    rounds = 120_000
    digest = hashlib.pbkdf2_hmac("sha256", DEMO_PASSWORD.encode("utf-8"), salt.encode("utf-8"), rounds)
    password_hash = f"pbkdf2_sha256${rounds}${salt}${digest.hex()}"

    user = User(email=DEMO_EMAIL, username=DEMO_USERNAME, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def ensure_favorite(db: Session, user_id: int, movie_id: int) -> None:
    existing = db.query(Favorite).filter_by(user_id=user_id, movie_id=movie_id).first()
    if existing:
        return
    db.add(Favorite(user_id=user_id, movie_id=movie_id))


def seed(db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    movies = [upsert_movie(db, payload) for payload in MOVIES]
    db.commit()
    for movie in movies:
        db.refresh(movie)

    user = get_or_create_user(db)
    for movie in movies[:3]:
        ensure_favorite(db, user.user_id, movie.movie_id)
    db.commit()

    print(f"Seeded {len(MOVIES)} movies.")
    print(f"Demo user: {DEMO_EMAIL} (password: {DEMO_PASSWORD})")
    print("Favorites added for the first 3 movies.")


def cleanup(db: Session) -> None:
    movie_ids = [
        row[0] for row in db.query(Movie.movie_id).filter(Movie.title.in_(SEED_TITLES)).all()
    ]

    favorites_removed = 0
    movies_removed = 0
    if movie_ids:
        favorites_removed += (
            db.query(Favorite)
            .filter(Favorite.movie_id.in_(movie_ids))
            .delete(synchronize_session=False)
        )
        movies_removed = (
            db.query(Movie)
            .filter(Movie.movie_id.in_(movie_ids))
            .delete(synchronize_session=False)
        )

    demo_user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    demo_favorites_removed = 0
    if demo_user:
        demo_favorites_removed = (
            db.query(Favorite)
            .filter(Favorite.user_id == demo_user.user_id)
            .delete(synchronize_session=False)
        )
        db.delete(demo_user)

    db.commit()
    print(f"Removed {movies_removed} seeded movies.")
    print(f"Removed {favorites_removed + demo_favorites_removed} seeded favorites.")
    print("Removed demo user if it existed.")


def ensure_safe_to_run(action: str, confirm: bool, force: bool) -> None:
    app_env = os.getenv("APP_ENV", "").lower()
    if app_env in {"prod", "production"} and not force and os.getenv("SEED_FORCE") != "1":
        raise SystemExit("Refusing to run in production. Set SEED_FORCE=1 or pass --force.")

    if not confirm and os.getenv("SEED_CONFIRM") != "YES":
        raise SystemExit(f"Set SEED_CONFIRM=YES or pass --confirm to {action}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed or cleanup watchlist demo data.")
    parser.add_argument("command", choices=["seed", "cleanup"], nargs="?", default="seed")
    parser.add_argument("--confirm", action="store_true", help="Confirm destructive operations.")
    parser.add_argument("--force", action="store_true", help="Allow running in production.")
    args = parser.parse_args()

    ensure_safe_to_run(args.command, args.confirm, args.force)

    db = SessionLocal()
    try:
        if args.command == "seed":
            seed(db)
        else:
            cleanup(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
