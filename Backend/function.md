# Backend Functions

This file summarizes the FastAPI endpoints available in the Backend folder.

## Auth
- POST `/auth/register`
  - Body: `AuthRegister`
  - Behavior: create user with hashed password, return JWT `access_token`.
- POST `/auth/login`
  - Body: `AuthLogin`
  - Behavior: verify email/password, return JWT `access_token`.

## Movies
- GET `/movies`
  - Auth: Admin-only (Bearer JWT required)
  - Params: `query`, `page`, `limit`
  - Behavior: list movies for admin management.
- GET `/movies/search`
  - Params: `query` (string)
  - Behavior: search movies by title (ILIKE), returns up to 20 items.
- GET `/movies/{movie_id}`
  - Behavior: movie detail by numeric id, 404 if missing.
- POST `/movies`
  - Body: `MovieCreate`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: create a new movie, optional genre list will be linked or created.
- PUT `/movies/{movie_id}`
  - Body: `MovieUpdate`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: update movie fields and genres.
- DELETE `/movies/{movie_id}`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: delete movie and related records.
- GET `/movies/{movie_id}/genres`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: list genres for a movie.
- GET `/movies/{movie_id}/cast`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: list cast for a movie.
- POST `/movies/{movie_id}/cast`
  - Body: `CastCreate`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: attach a person/role to a movie.
- DELETE `/movies/{movie_id}/cast`
  - Body: `CastDelete`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: remove a person/role from a movie.

## Ratings
- POST `/ratings/`
  - Body: `RatingCreate`
  - Auth: Bearer JWT required
  - Behavior: upsert rating, returns summary.
- GET `/ratings/{movie_id}`
  - Auth: Bearer JWT required
  - Behavior: returns rating summary for a movie.

## Genres
- GET `/genres/`
  - Params: `query` (optional)
  - Behavior: list genres.
- POST `/genres/`
  - Body: `GenreCreate`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: create genre.
- PUT `/genres/{genre_id}`
  - Body: `GenreUpdate`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: update genre.
- DELETE `/genres/{genre_id}`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: delete genre and detach from movies.

## People
- GET `/people/`
  - Params: `query` (optional)
  - Behavior: list people.
- POST `/people/`
  - Body: `PersonCreate`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: create person.
- PUT `/people/{person_id}`
  - Body: `PersonUpdate`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: update person.
- DELETE `/people/{person_id}`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: delete person and related cast entries.

## Homepage
- GET `/homepage/`
  - Behavior: returns homepage settings (if any).
- PUT `/homepage/`
  - Body: `HomepageSettingsUpdate`
  - Auth: Admin-only (Bearer JWT required)
  - Behavior: update homepage settings.

## Chatbot
- POST `/chatbot/chat`
  - Params: `question` (string) query param or JSON body `{ "question": "..." }`
  - Behavior: basic text search against title/description/storyline, optional year and rating filters.

## External (Proxy)
- GET `/external/trakt/{path}`
  - Behavior: proxy to Trakt API using `TRAKT_CLIENT_ID`.
- GET `/external/omdb`
  - Params: `i` or `t` plus optional query params
  - Behavior: proxy to OMDb API using `OMDB_API_KEY`.

## Contact
- POST `/contact`
  - Body: `{ name, email, message }`
  - Behavior: validates payload and returns `{ ok: true }`.

## Watchlist
- POST `/watchlist/add`
  - Body: `WatchlistCreate`
  - Auth: Bearer JWT required
  - Behavior: add movie to favorites.
- GET `/watchlist/`
  - Auth: Bearer JWT required
  - Behavior: list favorites for current user.

## Notes
- JWT auth is enforced via `Authorization: Bearer <token>` on watchlist routes.
- Database models come from `Backend/models.py`.
