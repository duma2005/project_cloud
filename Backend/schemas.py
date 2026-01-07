from datetime import date
from pydantic import BaseModel, confloat, conint, constr
from models import CastRole


class WatchlistCreate(BaseModel):
    movie_id: int
    movie_title: str | None = None


class AuthRegister(BaseModel):
    email: constr(min_length=1, max_length=100)
    password: constr(min_length=6, max_length=128)
    full_name: constr(min_length=1, max_length=100) | None = None


class AuthLogin(BaseModel):
    email: constr(min_length=1, max_length=100)
    password: constr(min_length=6, max_length=128)


class RatingCreate(BaseModel):
    movie_id: int
    rating: confloat(ge=0, le=5)


class MovieCreate(BaseModel):
    title: constr(min_length=1, max_length=255)
    original_title: str | None = None
    release_date: date | None = None
    duration_minutes: conint(ge=1) | None = None
    age_rating: str | None = None
    description: str | None = None
    storyline: str | None = None
    imdb_score: confloat(ge=0, le=10) | None = None
    imdb_vote_count: conint(ge=0) | None = None
    poster_url: str | None = None
    cover_url: str | None = None
    trailer_url: str | None = None
    genres: list[str] | None = None


class MovieUpdate(BaseModel):
    title: constr(min_length=1, max_length=255) | None = None
    original_title: str | None = None
    release_date: date | None = None
    duration_minutes: conint(ge=1) | None = None
    age_rating: str | None = None
    description: str | None = None
    storyline: str | None = None
    imdb_score: confloat(ge=0, le=10) | None = None
    imdb_vote_count: conint(ge=0) | None = None
    poster_url: str | None = None
    cover_url: str | None = None
    trailer_url: str | None = None
    genres: list[str] | None = None


class GenreCreate(BaseModel):
    name: constr(min_length=1, max_length=50)


class GenreUpdate(BaseModel):
    name: constr(min_length=1, max_length=50)


class PersonCreate(BaseModel):
    full_name: constr(min_length=1, max_length=100)
    birth_date: date | None = None
    avatar_url: str | None = None
    bio: str | None = None


class PersonUpdate(BaseModel):
    full_name: constr(min_length=1, max_length=100) | None = None
    birth_date: date | None = None
    avatar_url: str | None = None
    bio: str | None = None


class CastCreate(BaseModel):
    person_id: int
    role: CastRole
    character_name: str | None = None


class CastDelete(BaseModel):
    person_id: int
    role: CastRole


class HomepageSettingsUpdate(BaseModel):
    hero_movie_id: int | None = None
    hero_tagline: str | None = None
    top_ten_title: str | None = None
    fan_favorites_title: str | None = None
    new_arrivals_title: str | None = None
    top_ten_ids: list[int] | None = None
    fan_favorites_ids: list[int] | None = None
    new_arrivals_ids: list[int] | None = None
