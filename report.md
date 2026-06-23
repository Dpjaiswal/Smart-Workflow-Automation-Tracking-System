# SWATS - Core Logic & Architecture Report

This report outlines the technical architecture, security measures, and workflow automation logics built into the **Smart Workflow Automation & Tracking System (SWATS)**.

---

## 🛡️ 1. Role-Based Access Control (RBAC) Logic

Security is enforced using role-based dependencies in [auth.py](file:///e:/my-applications/SWATS/backend/app/auth.py). Each router endpoint is wrapped with specific guards that validate the incoming JWT token and assert the user's role:

```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    # Decode JWT and locate active user...
    ...

# Guards checking specific levels of privileges
def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user

def get_current_manager_or_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Manager/Admin only")
    return current_user
```

---

## ⚙️ 2. Workflow Automation Logic (Approvals)

One of SWATS's key features is the automated task-to-approval loop in [approvals.py](file:///e:/my-applications/SWATS/backend/app/routers/approvals.py):

1. **Employee requests completion:** The frontend provides a shortcut button for active tasks. Submitting this request sends a payload to `POST /api/approvals` which creates a `task_completion` approval and automatically changes the task status to `in_review`.
2. **Manager Reviews Request:** The manager receives an in-app notification and reviews the request.
3. **Automated State Change:** If approved, the backend triggers an automatic database hook updating the linked task status directly to `completed`:

```python
# From backend/app/routers/approvals.py:
if db_approval.type == "task_completion" and db_approval.status == "approved" and db_approval.related_id:
    task = db.query(models.Task).filter(models.Task.id == db_approval.related_id).first()
    if task:
        task.status = "completed"
        db.commit()
        log_activity(db, current_user.id, "AUTO_COMPLETE_TASK", f"Task '{task.title}' status auto-set to completed via approval.")
```

---

## 📊 3. Productivity & Work Logs Logic

Daily operations are captured in [worklogs.py](file:///e:/my-applications/SWATS/backend/app/routers/worklogs.py). 

- **Employee Logging:** Employees input hours spent on specific tasks/projects.
- **Reporting Analytics Engine:** The endpoint `GET /api/reports/dashboard-summary` queries worklogs and compiles hours dynamically to populate team-wide bar graphs and personal widgets:

```python
# From backend/app/routers/reports.py:
employee_hours = {}
employees = db.query(models.User).filter(models.User.role == "employee").all()
for emp in employees:
    emp_logs = db.query(models.WorkLog).filter(models.WorkLog.user_id == emp.id).all()
    hours = sum(l.hours_logged for l in emp_logs)
    employee_hours[emp.full_name] = hours
```

---

## 🎫 4. Support Desk & Ticket Triage Flow

Support tickets follow a strict lifecycle in [tickets.py](file:///e:/my-applications/SWATS/backend/app/routers/tickets.py):

- **Creation:** Clients register tickets which generate global alerts for all manager dashboards.
- **Triage:** Managers allocate the ticket to an employee, changing the status to `in_progress`.
- **Resolution:** The employee resolves the issue, notifying the client.
- **Closure:** The client confirms and shifts status to `closed`.

```python
# Notification and state transition triggers:
if "assigned_to_id" in update_data and old_assignee != db_ticket.assigned_to_id and db_ticket.assigned_to_id:
    create_notification(
        db, 
        db_ticket.assigned_to_id, 
        "Support Ticket Assigned", 
        f"Ticket '{db_ticket.title}' has been assigned to you."
    )
```

---

## 📝 5. System Activity Audit Logs

Every critical request creates an immutable record in the audit trail:

- User login
- Project creation
- Task assignment
- Approval state change
- Ticket closure

All logs are written via the unified logging helper in [services.py](file:///e:/my-applications/SWATS/backend/app/services.py) and can only be audited by Administrators:

```python
def log_activity(db: Session, user_id: int, action: str, details: str):
    log = models.AuditLog(user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
```
