import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    stats = {}
    
    total_projects = db.query(models.Project).count()
    total_tasks = db.query(models.Task).count()
    completed_tasks = db.query(models.Task).filter(models.Task.status == "completed").count()
    in_progress_tasks = db.query(models.Task).filter(models.Task.status == "in_progress").count()
    in_review_tasks = db.query(models.Task).filter(models.Task.status == "in_review").count()
    todo_tasks = db.query(models.Task).filter(models.Task.status == "todo").count()
    
    pending_approvals = db.query(models.Approval).filter(models.Approval.status == "pending").count()
    open_tickets = db.query(models.Ticket).filter(models.Ticket.status == "open").count()
    resolved_tickets = db.query(models.Ticket).filter(models.Ticket.status == "resolved").count()
    
    worklogs = db.query(models.WorkLog).all()
    total_hours = sum(log.hours_logged for log in worklogs)
    
    stats["project_metrics"] = {
        "total": total_projects,
        "active": db.query(models.Project).filter(models.Project.status == "active").count(),
        "completed": db.query(models.Project).filter(models.Project.status == "completed").count()
    }
    
    stats["task_metrics"] = {
        "total": total_tasks,
        "todo": todo_tasks,
        "in_progress": in_progress_tasks,
        "in_review": in_review_tasks,
        "completed": completed_tasks
    }
    
    employee_hours = {}
    employees = db.query(models.User).filter(models.User.role == "employee").all()
    for emp in employees:
        emp_logs = db.query(models.WorkLog).filter(models.WorkLog.user_id == emp.id).all()
        hours = sum(l.hours_logged for l in emp_logs)
        employee_hours[emp.full_name] = hours
        
    stats["employee_productivity"] = employee_hours
    stats["total_hours_logged"] = total_hours
    
    stats["ticket_metrics"] = {
        "open": open_tickets,
        "resolved": resolved_tickets,
        "in_progress": db.query(models.Ticket).filter(models.Ticket.status == "in_progress").count(),
        "closed": db.query(models.Ticket).filter(models.Ticket.status == "closed").count()
    }
    
    stats["pending_approvals"] = pending_approvals
    
    if current_user.role == "employee":
        user_tasks = db.query(models.Task).filter(models.Task.assigned_to_id == current_user.id).count()
        user_completed = db.query(models.Task).filter(models.Task.assigned_to_id == current_user.id, models.Task.status == "completed").count()
        user_logs = db.query(models.WorkLog).filter(models.WorkLog.user_id == current_user.id).all()
        user_hours = sum(l.hours_logged for l in user_logs)
        user_pending_approvals = db.query(models.Approval).filter(models.Approval.requested_by_id == current_user.id, models.Approval.status == "pending").count()
        
        stats["employee_personal"] = {
            "my_tasks": user_tasks,
            "my_completed_tasks": user_completed,
            "my_hours_logged": user_hours,
            "my_pending_approvals": user_pending_approvals
        }
        
    elif current_user.role == "client":
        client_tickets = db.query(models.Ticket).filter(models.Ticket.client_id == current_user.id).count()
        client_resolved = db.query(models.Ticket).filter(models.Ticket.client_id == current_user.id, models.Ticket.status == "resolved").count()
        client_open = db.query(models.Ticket).filter(models.Ticket.client_id == current_user.id, models.Ticket.status == "open").count()
        
        stats["client_personal"] = {
            "my_tickets": client_tickets,
            "my_resolved_tickets": client_resolved,
            "my_open_tickets": client_open
        }
        
    return stats

@router.get("/export/tasks")
def export_tasks_csv(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    tasks = db.query(models.Task).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Task ID", "Title", "Description", "Status", "Priority", "Project Name", "Assigned Employee", "Due Date", "Created At"])
    
    for task in tasks:
        project_name = task.project.name if task.project else "N/A"
        assignee = task.assigned_to.full_name if task.assigned_to else "Unassigned"
        writer.writerow([
            task.id,
            task.title,
            task.description or "",
            task.status,
            task.priority,
            project_name,
            assignee,
            task.due_date.strftime("%Y-%m-%d") if task.due_date else "N/A",
            task.created_at.strftime("%Y-%m-%d %H:%M")
        ])
        
    output.seek(0)
    headers = {
        'Content-Disposition': 'attachment; filename="tasks_report.csv"',
        'Content-Type': 'text/csv'
    }
    return StreamingResponse(io.BytesIO(output.getvalue().encode('utf-8')), headers=headers)

@router.get("/export/worklogs")
def export_worklogs_csv(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    worklogs = db.query(models.WorkLog).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["WorkLog ID", "Employee Email", "Employee Name", "Project", "Task", "Date", "Hours Logged", "Description", "Submitted At"])
    
    for log in worklogs:
        user_email = log.user.email if log.user else "N/A"
        user_name = log.user.full_name if log.user else "N/A"
        project_name = log.project.name if log.project else "N/A"
        task_title = log.task.title if log.task else "General Work"
        
        writer.writerow([
            log.id,
            user_email,
            user_name,
            project_name,
            task_title,
            log.date.strftime("%Y-%m-%d") if log.date else "N/A",
            log.hours_logged,
            log.description or "",
            log.created_at.strftime("%Y-%m-%d %H:%M")
        ])
        
    output.seek(0)
    headers = {
        'Content-Disposition': 'attachment; filename="productivity_worklogs_report.csv"',
        'Content-Type': 'text/csv'
    }
    return StreamingResponse(io.BytesIO(output.getvalue().encode('utf-8')), headers=headers)
