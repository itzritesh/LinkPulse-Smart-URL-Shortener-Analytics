"""Database seed and schema bootstrap utility for LinkPulse."""

import os
import sys

# Ensure backend package is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.database import engine, Base, check_database_connection
from app.models import User, ShortURL, ClickEvent  # registers models with Base.metadata


def init_database() -> None:
    print("Testing PostgreSQL connection...")
    connected, error = check_database_connection()
    if not connected:
        print(f"Failed to connect to database: {error}")
        print("Please ensure PostgreSQL is running and DATABASE_URL is properly configured.")
        return

    print("PostgreSQL connection successful.")
    print("Creating all tables from declarative metadata (including users, urls, and click_events)...")
    Base.metadata.create_all(bind=engine)
    print("Database schema successfully initialized.")


if __name__ == "__main__":
    init_database()
