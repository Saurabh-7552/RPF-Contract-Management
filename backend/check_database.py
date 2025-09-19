import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, text
from app.db.models import User, RFP, Response, RFPDocument, RFPDocumentVersion, ActivityLog
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

async def check_database():
    print("🔍 Checking Database Current State...")
    print("=" * 50)
    
    # Create database connection
    DATABASE_URL = "postgresql+asyncpg://postgres:verma2017@localhost:5432/rfp_contracts"
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with AsyncSessionLocal() as session:
        # Check Users
        print("\n👥 USERS:")
        print("-" * 30)
        users_result = await session.execute(select(User))
        users = users_result.scalars().all()
        
        if users:
            for user in users:
                print(f"ID: {user.id}")
                print(f"Email: {user.email}")
                print(f"Role: {user.role}")
                print(f"Active: {user.is_active}")
                print(f"Created: {user.created_at}")
                print("-" * 20)
        else:
            print("No users found")
        
        # Check RFPs
        print("\n📋 RFPs:")
        print("-" * 30)
        rfps_result = await session.execute(select(RFP))
        rfps = rfps_result.scalars().all()
        
        if rfps:
            for rfp in rfps:
                print(f"ID: {rfp.id}")
                print(f"Title: {rfp.title}")
                print(f"Description: {rfp.description[:100]}..." if len(rfp.description) > 100 else f"Description: {rfp.description}")
                print(f"Status: {rfp.status}")
                print(f"Created by: {rfp.owner_id}")
                print(f"Created: {rfp.created_at}")
                print(f"Updated: {rfp.updated_at}")
                print("-" * 20)
        else:
            print("No RFPs found")
        
        # Check RFP Responses
        print("\n💬 RFP RESPONSES:")
        print("-" * 30)
        responses_result = await session.execute(select(Response))
        responses = responses_result.scalars().all()
        
        if responses:
            for response in responses:
                print(f"ID: {response.id}")
                print(f"RFP ID: {response.rfp_id}")
                print(f"Supplier ID: {response.supplier_id}")
                print(f"Content: {response.content[:100]}..." if len(response.content) > 100 else f"Content: {response.content}")
                print(f"Created: {response.created_at}")
                print("-" * 20)
        else:
            print("No RFP responses found")
        
        # Check RFP Documents
        print("\n📄 RFP DOCUMENTS:")
        print("-" * 30)
        documents_result = await session.execute(select(RFPDocument))
        documents = documents_result.scalars().all()
        
        if documents:
            for doc in documents:
                print(f"ID: {doc.id}")
                print(f"RFP ID: {doc.rfp_id}")
                print(f"Filename: {doc.filename}")
                print(f"Storage Path: {doc.storage_path}")
                print(f"Created: {doc.created_at}")
                print("-" * 20)
        else:
            print("No RFP documents found")
        
        # Check Activity Logs
        print("\n📊 ACTIVITY LOGS:")
        print("-" * 30)
        logs_result = await session.execute(select(ActivityLog))
        logs = logs_result.scalars().all()
        
        if logs:
            for log in logs:
                print(f"ID: {log.id}")
                print(f"Actor ID: {log.actor_id}")
                print(f"Action: {log.action}")
                print(f"Details: {log.details}")
                print(f"Created: {log.created_at}")
                print("-" * 20)
        else:
            print("No activity logs found")
        
        # Summary
        print("\n📈 SUMMARY:")
        print("-" * 30)
        print(f"Total Users: {len(users)}")
        print(f"Total RFPs: {len(rfps)}")
        print(f"Total Responses: {len(responses)}")
        print(f"Total Documents: {len(documents)}")
        print(f"Total Activity Logs: {len(logs)}")
    
    # Close the engine
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_database())
