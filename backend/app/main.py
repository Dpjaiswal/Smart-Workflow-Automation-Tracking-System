from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import SessionLocal
from .seed import seed_database
from .routers import auth, users, projects, tasks, approvals, worklogs, tickets, notifications, audit_logs, reports

app = FastAPI(
    title="SWATS API", 
    description="Smart Workflow Automation & Tracking System API Portal"
)

# CORS middleware to allow connection from the Vite Dev Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(approvals.router)
app.include_router(worklogs.router)
app.include_router(tickets.router)
app.include_router(notifications.router)
app.include_router(audit_logs.router)
app.include_router(reports.router)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"status": "SWATS API is running", "version": "1.0.0"}
