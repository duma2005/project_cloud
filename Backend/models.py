from enum import Enum as PyEnum

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String, Text, func
from sqlalchemy import PrimaryKeyConstraint
from database import Base


class UserRole(str, PyEnum):
    user = "user"
    admin = "admin"


class CastRole(str, PyEnum):
    Director = "Director"
    Writer = "Writer"
    Actor = "Actor"


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole, name="user_role"), nullable=False, server_default="user")
    created_at = Column(DateTime, server_default=func.now())


class Movie(Base):
    __tablename__ = "movies"
    movie_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    original_title = Column(String(255))
    release_date = Column(Date)
    duration_minutes = Column(Integer)
    age_rating = Column(String(10))
    description = Column(Text)
    storyline = Column(Text)
    imdb_score = Column(Numeric(3, 1))
    imdb_vote_count = Column(Integer)
    poster_url = Column(String(500))
    cover_url = Column(String(500))
    trailer_url = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())


class Genre(Base):
    __tablename__ = "genres"
    genre_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)


class Person(Base):
    __tablename__ = "persons"
    person_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    birth_date = Column(Date)
    avatar_url = Column(String(500))
    bio = Column(Text)


class MovieGenre(Base):
    __tablename__ = "movie_genres"
    movie_id = Column(Integer, ForeignKey("movies.movie_id"), nullable=False)
    genre_id = Column(Integer, ForeignKey("genres.genre_id"), nullable=False)

    __table_args__ = (PrimaryKeyConstraint("movie_id", "genre_id"),)


class MovieCast(Base):
    __tablename__ = "movie_cast"
    movie_id = Column(Integer, ForeignKey("movies.movie_id"), nullable=False)
    person_id = Column(Integer, ForeignKey("persons.person_id"), nullable=False)
    role = Column(Enum(CastRole, name="cast_role"), nullable=False)
    character_name = Column(String(100))

    __table_args__ = (PrimaryKeyConstraint("movie_id", "person_id", "role"),)


class Favorite(Base):
    __tablename__ = "favorites"
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.movie_id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (PrimaryKeyConstraint("user_id", "movie_id"),)


class Rating(Base):
    __tablename__ = "ratings"
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.movie_id"), nullable=False)
    rating = Column(Numeric(2, 1), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (PrimaryKeyConstraint("user_id", "movie_id"),)


class HomepageSettings(Base):
    __tablename__ = "homepage_settings"
    settings_id = Column(Integer, primary_key=True, autoincrement=True)
    hero_movie_id = Column(Integer, ForeignKey("movies.movie_id"))
    hero_tagline = Column(String(255))
    top_ten_title = Column(String(100))
    fan_favorites_title = Column(String(100))
    new_arrivals_title = Column(String(100))
    top_ten_ids = Column(JSON)
    fan_favorites_ids = Column(JSON)
    new_arrivals_ids = Column(JSON)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
