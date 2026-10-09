import os
from collections.abc import Generator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

load_dotenv(Path(__file__).with_name(".env"))

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise RuntimeError("Set DATABASE_URL in backend/.env or the process environment.")

engine = create_engine(database_url, pool_pre_ping=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = Session(bind=engine, autoflush=False, autocommit=False)
    try:
        yield db
    finally:
        db.close()
