import os
from pathlib import Path

from dotenv import load_dotenv


def _load_local_env() -> None:
    base_dir = Path(__file__).resolve().parent
    repo_root = base_dir.parent
    candidates = [
        base_dir / ".env",
        repo_root / ".env",
        repo_root / "film-consensus" / ".env",
    ]
    for path in candidates:
        if path.is_file():
            load_dotenv(path, override=False)


_load_local_env()

DATABASE_URL = os.getenv("DATABASE_URL")

JWT_SECRET = os.getenv("JWT_SECRET", "secretkey")
JWT_ALGORITHM = "HS256"

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
OMDB_API_KEY = os.getenv("OMDB_API_KEY")
TRAKT_CLIENT_ID = os.getenv("TRAKT_CLIENT_ID")
