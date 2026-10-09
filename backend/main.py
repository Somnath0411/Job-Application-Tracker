from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

import models
from database import Base, engine, get_db
from schemas import ApplicationCreate, ApplicationRead, ApplicationUpdate


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="JobTrack API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/applications", response_model=list[ApplicationRead])
def list_applications(db: Session = Depends(get_db)) -> list[models.Application]:
    statement = select(models.Application).order_by(
        models.Application.applied_date.desc(),
        models.Application.id.desc(),
    )
    return list(db.scalars(statement).all())


@app.post(
    "/api/applications",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
) -> models.Application:
    application = models.Application(
        company=application_data.company,
        applied_date=application_data.applied_date,
        interview_date=application_data.interview_date,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@app.patch(
    "/api/applications/{application_id}",
    response_model=ApplicationRead,
)
def update_application(
    application_id: int,
    updates: ApplicationUpdate,
    db: Session = Depends(get_db),
) -> models.Application:
    application = db.get(models.Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found.")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)
    return application


@app.delete(
    "/api/applications/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_application(application_id: int, db: Session = Depends(get_db)) -> Response:
    application = db.get(models.Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found.")

    db.delete(application)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
