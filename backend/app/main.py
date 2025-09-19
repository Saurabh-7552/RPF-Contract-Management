from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth as auth_router
from app.routers import rfp as rfp_router
from app.routers import uploads as uploads_router
from app.routers import versions as versions_router
from app.routers import search as search_router


app = FastAPI(title="RFP Contract Management API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


app.include_router(auth_router.router)
app.include_router(rfp_router.router)
app.include_router(uploads_router.router)
app.include_router(versions_router.router)
app.include_router(search_router.router)


