from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    applied_date: date
    interview_date: date | None = None

    @field_validator("company")
    @classmethod
    def strip_company(cls, company: str) -> str:
        company = company.strip()
        if not company:
            raise ValueError("Company name cannot be blank.")
        return company


class ApplicationUpdate(BaseModel):
    responded: bool | None = None
    interview_date: date | None = None


class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    applied_date: date
    responded: bool
    interview_date: date | None
