#!/usr/bin/env python3
"""
Script to set up test database and create demo users for E2E testing
"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, User, UserRole
from app.core.security import hash_password

# Use the same database URL as the backend
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:verma2017@localhost:5432/rfp_contracts",
)

async def setup_database():
    """Set up the database and create test users"""
    print("Setting up test database...")
    
    # Create engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created")
    
    # Create session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if users already exist
        from sqlalchemy import select
        result = await session.execute(select(User))
        existing_users = result.scalars().all()
        
        if existing_users:
            print(f"Found {len(existing_users)} existing users:")
            for user in existing_users:
                print(f"  - {user.email} ({user.role})")
        else:
            print("No users found, creating demo users...")
            
            # Create demo users
            demo_users = [
                {
                    "email": "buyer@example.com",
                    "password": "buyerpass123",
                    "role": UserRole.buyer
                },
                {
                    "email": "supplier@example.com", 
                    "password": "supplierpass123",
                    "role": UserRole.supplier
                },
                {
                    "email": "admin@example.com",
                    "password": "adminpass123", 
                    "role": UserRole.buyer  # Using buyer role for admin
                }
            ]
            
            for user_data in demo_users:
                user = User(
                    email=user_data["email"],
                    hashed_password=hash_password(user_data["password"]),
                    role=user_data["role"]
                )
                session.add(user)
            
            await session.commit()
            print("✅ Demo users created:")
            for user_data in demo_users:
                print(f"  - {user_data['email']} / {user_data['password']} ({user_data['role'].value})")
    
    await engine.dispose()
    print("✅ Database setup complete!")

if __name__ == "__main__":
    asyncio.run(setup_database())
