from fastapi import FastAPI
from database import engine
from models import Base
from routers import chatbot, movies, ratings, auth, external, contact, watchlist, health, genres, people, homepage

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Movie Review Backend")

app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(ratings.router)
app.include_router(chatbot.router)
app.include_router(external.router)
app.include_router(contact.router)
app.include_router(watchlist.router)
app.include_router(health.router)
app.include_router(genres.router)
app.include_router(people.router)
app.include_router(homepage.router)
