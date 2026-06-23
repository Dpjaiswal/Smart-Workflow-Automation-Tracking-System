# SWATS - Smart Workflow Automation & Tracking System

SWATS is a production-grade workflow automation, performance tracking, and support ticketing hub built with Python FastAPI, SQLite (SQLAlchemy), and a React + Vite (TypeScript) frontend styled with custom glassmorphic Vanilla CSS.

---

## Preset Login Accounts
On the login screen, you can click the **Quick Preset Pills** to automatically log in as any of the roles with pre-seeded database metrics:

| Role | Username | Password | Full Name | Primary Dashboard Views |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@swats.com` | `admin123` | Amit Sharma | Security Activity Audit Trail, Global Productivity, Project assignments |
| **Manager** | `manager@swats.com` | `manager123` | Rohan Verma | Leave Review triggers, Ticket promotions, Team Workloads |
| **Employee** | `employee@swats.com` | `employee123` | Kunal Sen | Daily hour logs, Task progression board, Leave Request form |
| **Client** | `client@swats.com` | `client123` | Preeti Patel | Support tickets desk, Deliverables tracking |

---

## System Architecture

```mermaid
graph TD
    Client[React Client SPA] -->|JWT Auth Header| Gateway[FastAPI Backend Gateway]
    Gateway -->|CORS Middleware| Auth[JWT Token Validation]
    Gateway -->|Endpoints| Routers[Role-Guarded Routers]
    Routers -->|SQLAlchemy ORM| DB[(SQLite Database)]
    Routers -->|Services| NotificationSystem[In-App Alerts Manager]
    Routers -->|Services| AuditSystem[System Audit Logger]
```

## Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string email
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
    }
    PROJECTS {
        int id PK
        string name
        string description
        string status
        int manager_id FK
        datetime created_at
        datetime updated_at
    }
    TASKS {
        int id PK
        string title
        string description
        string status
        string priority
        int project_id FK
        int assigned_to_id FK
        int created_by_id FK
        datetime due_date
        datetime created_at
    }
    APPROVALS {
        int id PK
        string type
        string status
        int requested_by_id FK
        int assigned_to_id FK
        int related_id FK
        string details
        string comments
        datetime created_at
    }
    WORKLOGS {
        int id PK
        int user_id FK
        int project_id FK
        int task_id FK
        date date
        float hours_logged
        string description
        datetime created_at
    }
    TICKETS {
        int id PK
        string title
        string description
        string status
        string priority
        int client_id FK
        int assigned_to_id FK
        datetime created_at
    }
    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        string message
        boolean is_read
        datetime created_at
    }
    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string details
        datetime created_at
    }

    USERS ||--o{ PROJECTS : "manages"
    USERS ||--o{ TASKS : "assigned_to"
    USERS ||--o{ TASKS : "created_by"
    USERS ||--o{ APPROVALS : "requested_by"
    USERS ||--o{ APPROVALS : "assigned_to"
    USERS ||--o{ WORKLOGS : "logs"
    USERS ||--o{ TICKETS : "client"
    USERS ||--o{ TICKETS : "assigned_to"
    USERS ||--o{ NOTIFICATIONS : "user"
    USERS ||--o{ AUDIT_LOGS : "user"

    PROJECTS ||--o{ TASKS : "contains"
    PROJECTS ||--o{ WORKLOGS : "tracks"
    TASKS ||--o{ WORKLOGS : "tracks"
```

- **Backend:** Python + FastAPI + Uvicorn + SQLAlchemy
- **Frontend:** React + Vite + TypeScript + Lucide Icons + Custom HSL Stylesheet
- **Automation Triggers:**
  - When an Employee logs work on a task, it updates project-wide productivity charts instantly.
  - When an Employee completes a task, they submit a **Task Completion Approval** to their Manager.
  - When the Manager approves the task completion request, the system **automatically** transitions the task's state to `completed`.
  - When a Client submits a support ticket, all Managers receive instant in-app notification alerts.

---

## Quick Start Guide

You will need two terminals running to launch the dev servers:

### 1. Start the Backend API (FastAPI)
Run the following from the root workspace directory (`e:/my-applications/SWATS`):
```powershell
# Activate environment and run uvicorn
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000 --reload
```
*Note: Seeding script runs automatically on the first startup to seed all user roles and logs.*

### 2. Start the Frontend (Vite + React)
Open a new terminal window, navigate to the `frontend` folder, and run:
```powershell
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to evaluate!

---

## Running Verification Tests
To run the automated authentication and security test suite:
```powershell
.\venv\Scripts\python.exe -m unittest backend/app/tests/test_auth.py
```
