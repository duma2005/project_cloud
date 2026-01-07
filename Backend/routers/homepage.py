from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from deps import get_current_admin, get_db
from models import HomepageSettings
from schemas import HomepageSettingsUpdate

router = APIRouter(prefix="/homepage", tags=["Homepage"])


def _serialize_settings(settings: HomepageSettings | None):
    if not settings:
        return {
            "hero_movie_id": None,
            "hero_tagline": None,
            "top_ten_title": None,
            "fan_favorites_title": None,
            "new_arrivals_title": None,
            "top_ten_ids": None,
            "fan_favorites_ids": None,
            "new_arrivals_ids": None,
        }
    return {
        "hero_movie_id": settings.hero_movie_id,
        "hero_tagline": settings.hero_tagline,
        "top_ten_title": settings.top_ten_title,
        "fan_favorites_title": settings.fan_favorites_title,
        "new_arrivals_title": settings.new_arrivals_title,
        "top_ten_ids": settings.top_ten_ids,
        "fan_favorites_ids": settings.fan_favorites_ids,
        "new_arrivals_ids": settings.new_arrivals_ids,
    }


@router.get("/")
def get_homepage_settings(db: Session = Depends(get_db)):
    settings = db.query(HomepageSettings).order_by(HomepageSettings.settings_id.asc()).first()
    return _serialize_settings(settings)


@router.put("/")
def update_homepage_settings(
    data: HomepageSettingsUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin)
):
    settings = db.query(HomepageSettings).order_by(HomepageSettings.settings_id.asc()).first()
    if not settings:
        settings = HomepageSettings()
        db.add(settings)

    payload = data.dict(exclude_unset=True)
    for field, value in payload.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return _serialize_settings(settings)
