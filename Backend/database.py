
import os
import re
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base

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
DATABASE_SCHEMA = os.getenv("DATABASE_SCHEMA")

def normalize_schema(schema: Optional[str]) -> Optional[str]:
    if not schema:
        return None
    if "://" in schema:
        raise ValueError("DATABASE_SCHEMA must be a schema name, not a URL.")
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", schema):
        raise ValueError(f"DATABASE_SCHEMA contains invalid characters: {schema}")
    return schema

if not DATABASE_URL:
    # DÙNG TẠM SQLite khi chưa có PostgreSQL cloud
    DATABASE_URL = "sqlite:///./local_dev.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # DÙNG PostgreSQL cloud
    schema_name = normalize_schema(DATABASE_SCHEMA)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True
    )
    if schema_name:
        @event.listens_for(engine, "connect")
        def set_search_path(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute(f"SET search_path TO {schema_name}, public")
            cursor.close()

SCHEMA_NAME = schema_name


def apply_schema(session) -> None:
    if not SCHEMA_NAME:
        return
    session.execute(text(f"SET search_path TO {SCHEMA_NAME}, public"))

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
