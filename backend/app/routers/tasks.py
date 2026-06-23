from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..auth import get_current_user, get_current_manager_or_admin
from .. import models, schemas
from ..services import log_activity, create_notification

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("", response_model=List[schemas.TaskResponse])
def get_tasks(project_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Task)
    
    if project_id:
        query = query.filter(models.Task.project_id == project_id)
        
    if current_user.role in ["admin", "manager"]:
        return query.all()
    elif current_user.role == "employee":
        return query.filter(models.Task.assigned_to_id == current_user.id).all()
    else: # client
        return query.all()

@router.post("", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_or_admin)):
    project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    new_task = models.Task(
        title=task.title,
        description=task.description,
        status=task.status or "todo",
        priority=task.priority or "medium",
        project_id=task.project_id,
        assigned_to_id=task.assigned_to_id,
        created_by_id=current_user.id,
        due_date=task.due_date
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    log_activity(db, current_user.id, "CREATE_TASK", f"Created task '{new_task.title}' in Project ID {new_task.project_id}")
    
    if new_task.assigned_to_id:
        create_notification(
            db, 
            new_task.assigned_to_id, 
            "New Task Assigned", 
            f"You have been assigned: '{new_task.title}' under project '{project.name}'."
        )
        
    return new_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role == "employee" and db_task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Employees can only update tasks assigned to themselves")
        
    update_data = task_update.model_dump(exclude_unset=True)
    
    if current_user.role == "employee":
        allowed_keys = ["status"]
        update_data = {k: v for k, v in update_data.items() if k in allowed_keys}
        
    old_status = db_task.status
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    
    log_activity(db, current_user.id, "UPDATE_TASK", f"Updated task '{db_task.title}' (ID: {task_id}). Status changed: {old_status} -> {db_task.status}")
    
    if "status" in update_data and old_status != db_task.status:
        project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
        if project:
            create_notification(
                db, 
                project.manager_id, 
                "Task Status Update", 
                f"Task '{db_task.title}' status changed to '{db_task.status}' by {current_user.full_name}."
            )
            
    return db_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_or_admin)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(db_task)
    db.commit()
    log_activity(db, current_user.id, "DELETE_TASK", f"Deleted task '{db_task.title}' (ID: {task_id})")
    return None
