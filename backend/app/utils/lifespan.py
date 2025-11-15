from fastapi import FastAPI
from contextlib import asynccontextmanager
from pathlib import Path

from ..database import SessionLocal
import app.utils.seeder as seed
from ..config import setting


async def update_env_file():
    """Automatically disable RESET_DB_ON_START flag after successful database seeding"""
    env_file = Path(".env")

    if not env_file.exists():
        return

    try:
        # Read file content
        content = env_file.read_text(encoding="utf-8")

        # Replace true with false
        new_content = content.replace(
            "RESET_DB_ON_START=true", "RESET_DB_ON_START=false"
        ).replace('RESET_DB_ON_START="true"', 'RESET_DB_ON_START="false"')

        # Write back only if there were changes
        if new_content != content:
            env_file.write_text(new_content, encoding="utf-8")
            print("✅ RESET_DB_ON_START automatically set to false")

    except Exception as e:
        print(f"⚠️ Could not update .env file: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server started!!!")
    db = SessionLocal()

    if setting.RESET_DB_ON_START:
        print("🔄 Resetting database and seeding with sample data...")
        seed.drop_and_create_db()
        seed.seed_test_data(db)

        # Automatically disable flag after successful seeding
        await update_env_file()
        print("📊 Database initialized with sample data")

    seed.seed_first_admin(db)
    db.close()

    yield
