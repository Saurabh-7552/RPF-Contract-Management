import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Database connection
DATABASE_URL = 'postgresql+asyncpg://postgres:password@localhost:5432/rfp_contracts'
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_proposals():
    async with AsyncSessionLocal() as session:
        # Check total RFPs
        result = await session.execute(text('SELECT COUNT(*) FROM rfps'))
        total_rfps = result.scalar()
        
        # Check total proposals/responses
        result = await session.execute(text('SELECT COUNT(*) FROM rfp_responses'))
        total_proposals = result.scalar()
        
        # Check RFPs by status
        result = await session.execute(text('SELECT status, COUNT(*) FROM rfps GROUP BY status'))
        status_counts = result.fetchall()
        
        # Check recent proposals
        result = await session.execute(text('SELECT r.title, r.status, COUNT(rr.id) as proposal_count FROM rfps r LEFT JOIN rfp_responses rr ON r.id = rr.rfp_id GROUP BY r.id, r.title, r.status ORDER BY r.created_at DESC LIMIT 10'))
        recent_rfps = result.fetchall()
        
        print(f'📊 Current Database Status:')
        print(f'Total RFPs: {total_rfps}')
        print(f'Total Proposals/Responses: {total_proposals}')
        print(f'')
        print(f'📋 RFPs by Status:')
        for status, count in status_counts:
            print(f'  {status}: {count}')
        print(f'')
        print(f'📝 Recent RFPs with Proposal Counts:')
        for rfp in recent_rfps:
            print(f'  "{rfp.title}" ({rfp.status}): {rfp.proposal_count} proposals')

if __name__ == "__main__":
    asyncio.run(check_proposals())
