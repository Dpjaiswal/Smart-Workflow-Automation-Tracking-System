from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SWATS (Smart Workflow Automation & Tracking System)"
    SECRET_KEY: str = "apana_time_tech_solutions_super_secret_key_swats_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    DATABASE_URL: str = "sqlite:///./swats.db"

    class Config:
        case_sensitive = True

settings = Settings()
