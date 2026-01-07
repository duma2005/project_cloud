import csv
from datetime import datetime
from pathlib import Path
from typing import Iterable, Optional

from sqlalchemy import func

from database import SessionLocal, apply_schema
from models import Genre, Movie, MovieCast, MovieGenre, Person


EXPECTED_COLUMNS = {
    "title",
    "original_title",
    "release_date",
    "duration_minutes",
    "age_rating",
    "imdb_score",
    "imdb_vote_count",
    "genres",
    "poster_url",
    "cover_url",
    "trailer_url",
    "description",
    "storyline",
    "cast_directors",
    "cast_writers",
    "cast_actors",
}


def parse_date(value: str) -> Optional[datetime.date]:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unsupported date format: {value}")


def parse_int(value: str) -> Optional[int]:
    if not value:
        return None
    return int(value)


def parse_float(value: str) -> Optional[float]:
    if not value:
        return None
    return float(value)


def split_values(value: str, delimiter: str = ";") -> list[str]:
    return [part.strip() for part in value.split(delimiter) if part.strip()]


def parse_actors(value: str) -> list[tuple[str, Optional[str]]]:
    actors: list[tuple[str, Optional[str]]] = []
    for entry in split_values(value):
        if "(" in entry and entry.endswith(")"):
            name, character = entry.rsplit("(", 1)
            actors.append((name.strip(), character[:-1].strip() or None))
        else:
            actors.append((entry, None))
    return actors


def get_or_create_genre(db, name: str) -> Genre:
    genre = db.query(Genre).filter(func.lower(Genre.name) == name.lower()).first()
    if genre:
        return genre
    genre = Genre(name=name)
    db.add(genre)
    db.flush()
    return genre


def get_or_create_person(db, full_name: str) -> Person:
    person = db.query(Person).filter(func.lower(Person.full_name) == full_name.lower()).first()
    if person:
        return person
    person = Person(full_name=full_name)
    db.add(person)
    db.flush()
    return person


def find_movies_by_title(db, title: str) -> list[Movie]:
    return (
        db.query(Movie)
        .filter(func.lower(Movie.title) == title.lower())
        .order_by(Movie.movie_id.asc())
        .all()
    )


def update_movie_fields(movie: Movie, data: dict) -> None:
    for key, value in data.items():
        if value in (None, ""):
            continue
        setattr(movie, key, value)


def replace_movie_genres(db, movie_id: int, genres: Iterable[str]) -> None:
    db.query(MovieGenre).filter(MovieGenre.movie_id == movie_id).delete(synchronize_session=False)
    for name in genres:
        genre = get_or_create_genre(db, name)
        db.add(MovieGenre(movie_id=movie_id, genre_id=genre.genre_id))


def replace_movie_cast(db, movie_id: int, role: str, entries: Iterable[tuple[str, Optional[str]]]) -> None:
    db.query(MovieCast).filter(MovieCast.movie_id == movie_id, MovieCast.role == role).delete(synchronize_session=False)
    for full_name, character_name in entries:
        person = get_or_create_person(db, full_name)
        db.add(
            MovieCast(
                movie_id=movie_id,
                person_id=person.person_id,
                role=role,
                character_name=character_name,
            )
        )


def import_csv(path: Path) -> None:
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise RuntimeError("CSV is missing a header row.")
        reader.fieldnames = [name.strip().lstrip("\ufeff") for name in reader.fieldnames]
        missing = EXPECTED_COLUMNS - set(reader.fieldnames)
        if missing:
            raise RuntimeError(f"CSV missing columns: {', '.join(sorted(missing))}")

        created = 0
        updated = 0
        rows = list(reader)
        total = len(rows)
        with SessionLocal() as db:
            apply_schema(db)
            for index, row in enumerate(rows, start=1):
                title = (row.get("title") or "").strip()
                if not title:
                    continue

                release_date = parse_date((row.get("release_date") or "").strip())
                movies = find_movies_by_title(db, title)

                payload = {
                    "original_title": (row.get("original_title") or "").strip() or None,
                    "release_date": release_date,
                    "duration_minutes": parse_int((row.get("duration_minutes") or "").strip()),
                    "age_rating": (row.get("age_rating") or "").strip() or None,
                    "imdb_score": parse_float((row.get("imdb_score") or "").strip()),
                    "imdb_vote_count": parse_int((row.get("imdb_vote_count") or "").strip()),
                    "poster_url": (row.get("poster_url") or "").strip() or None,
                    "cover_url": (row.get("cover_url") or "").strip() or None,
                    "trailer_url": (row.get("trailer_url") or "").strip() or None,
                    "description": (row.get("description") or "").strip() or None,
                    "storyline": (row.get("storyline") or "").strip() or None,
                }

                if movies:
                    updated += len(movies)
                else:
                    movie = Movie(title=title, **payload)
                    db.add(movie)
                    db.flush()
                    movies = [movie]
                    created += 1

                genres_value = (row.get("genres") or "").strip()
                genres = [g.strip() for g in genres_value.split(",") if g.strip()] if genres_value else []

                directors_value = (row.get("cast_directors") or "").strip()
                directors = [(name, None) for name in split_values(directors_value)] if directors_value else []

                writers_value = (row.get("cast_writers") or "").strip()
                writers = [(name, None) for name in split_values(writers_value)] if writers_value else []

                actors_value = (row.get("cast_actors") or "").strip()
                actors = parse_actors(actors_value) if actors_value else []

                for movie in movies:
                    update_movie_fields(movie, payload)
                    if genres:
                        replace_movie_genres(db, movie.movie_id, genres)
                    if directors:
                        replace_movie_cast(db, movie.movie_id, "Director", directors)
                    if writers:
                        replace_movie_cast(db, movie.movie_id, "Writer", writers)
                    if actors:
                        replace_movie_cast(db, movie.movie_id, "Actor", actors)

                db.commit()
                if index == total or index % 5 == 0:
                    print(f"Processed {index}/{total}: {title}", flush=True)

        print(f"Imported {created} new movies, updated {updated} existing movies.")


if __name__ == "__main__":
    import sys

    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("movies_template.csv")
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")
    import_csv(csv_path)
