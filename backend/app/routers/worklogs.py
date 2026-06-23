from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas
from ..services import log_activity

router = APIRouter(prefix="/api/worklogs", tags=["Work Logs"])

@router.get("", response_model=List[schemas.WorkLogResponse])
def get_worklogs(user_id: Optional[int] = None, project_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.WorkLog)
    
    if current_user.role in ["admin", "manager"]:
        if user_id:
            query = query.filter(models.WorkLog.user_id == user_id)
        if project_id:
            query = query.filter(models.WorkLog.project_id == project_id)
        return query.all()
    else:
        return query.filter(models.WorkLog.user_id == current_user.id).all()

@router.post("", response_model=schemas.WorkLogResponse, status_code=status.HTTP_201_CREATED)
def create_worklog(worklog: schemas.WorkLogCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "client":
        raise HTTPException(status_code=403, detail="Clients cannot submit work logs")
         
    project = db.query(models.Project).filter(models.Project.id == worklog.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if worklog.task_id:
        task = db.query(models.Task).filter(models.Task.id == worklog.task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
    new_log = models.WorkLog(
        user_id=current_user.id,
        project_id=worklog.project_id,
        task_id=worklog.task_id,
        date=worklog.date,
        hours_logged=worklog.hours_logged,
        description=worklog.description
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    log_activity(db, current_user.id, "LOG_WORK", f"Logged {new_log.hours_logged} hours on Project ID {new_log.project_id}")
    return new_log
