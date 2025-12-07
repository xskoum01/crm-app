# backend/db.py
from sqlmodel import SQLModel, Session, create_engine
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
print("▶ Using database:", DATABASE_URL)   # <<< přidat


engine = create_engine(
    DATABASE_URL,
    echo=True,
)
def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency pro FastAPI – zajistí otevření / zavření session."""
    with Session(engine) as session:
        yield session
