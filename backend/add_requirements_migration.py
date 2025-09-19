import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

async def add_requirements_column():
    print("Adding requirements column to rfps table...")
    
    # Create database connection
    DATABASE_URL = "postgresql+asyncpg://postgres:verma2017@localhost:5432/rfp_contracts"
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with AsyncSessionLocal() as session:
        try:
            # Add requirements column
            await session.execute(text("""
                ALTER TABLE rfps 
                ADD COLUMN IF NOT EXISTS requirements TEXT
            """))
            await session.commit()
            print("✅ Requirements column added successfully!")
        except Exception as e:
            print(f"❌ Error adding requirements column: {e}")
            await session.rollback()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_requirements_column())
