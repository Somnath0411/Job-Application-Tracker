from datetime import date

from sqlalchemy import Boolean, Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    applied_date: Mapped[date] = mapped_column(Date, nullable=False)
    responded: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    interview_date: Mapped[date | None] = mapped_column(Date, nullable=True)
