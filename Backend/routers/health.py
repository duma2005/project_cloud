from urllib.parse import urlparse

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import DATABASE_SCHEMA, DATABASE_URL
from deps import get_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/db")
def db_health(db: Session = Depends(get_db)):
    if not DATABASE_URL:
        return {
            "database": {
                "configured": False,
                "scheme": "sqlite",
                "schema_env": DATABASE_SCHEMA,
                "search_path": None,
            }
        }

    parsed = urlparse(DATABASE_URL)
    search_path = None
    try:
        search_path = db.execute(text("SHOW search_path")).scalar()
    except Exception:
        search_path = None

    return {
        "database": {
            "configured": True,
            "scheme": parsed.scheme,
            "host": parsed.hostname,
            "name": parsed.path.lstrip("/") if parsed.path else None,
            "schema_env": DATABASE_SCHEMA,
            "search_path": search_path,
        }
    }
