from fastapi import APIRouter, HTTPException, Request
import requests

from config import TRAKT_CLIENT_ID, OMDB_API_KEY

router = APIRouter(prefix="/external", tags=["External"])

TRAKT_BASE = "https://api.trakt.tv"
OMDB_BASE = "https://www.omdbapi.com/"
DEFAULT_TIMEOUT = 10


def fetch_json(url: str, params: dict | None = None, headers: dict | None = None):
    try:
        res = requests.get(url, params=params, headers=headers, timeout=DEFAULT_TIMEOUT)
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Upstream request failed")

    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail=res.text)

    try:
        return res.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Invalid upstream response")


@router.get("/trakt/{path:path}")
def trakt_proxy(path: str, request: Request):
    if not TRAKT_CLIENT_ID:
        raise HTTPException(status_code=500, detail="TRAKT_CLIENT_ID is not configured")

    params = dict(request.query_params)
    headers = {
        "content-type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": TRAKT_CLIENT_ID,
    }
    return fetch_json(f"{TRAKT_BASE}/{path}", params=params, headers=headers)


@router.get("/omdb")
def omdb_proxy(request: Request):
    if not OMDB_API_KEY:
        raise HTTPException(status_code=500, detail="OMDB_API_KEY is not configured")

    params = dict(request.query_params)
    if "apikey" not in params:
        params["apikey"] = OMDB_API_KEY

    if "i" not in params and "t" not in params:
        raise HTTPException(status_code=400, detail="Missing OMDb identifier")

    return fetch_json(OMDB_BASE, params=params)
