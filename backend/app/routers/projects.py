from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth import get_current_user, get_current_manager_or_admin, get_current_admin
from .. import models, schemas
from ..services import log_activity

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role in ["admin", "manager"]:
        return db.query(models.Project).all()
    elif current_user.role == "employee":
        # Return projects where employee has tasks, or all projects if none to avoid empty dashboards
        task_project_ids = db.query(models.Task.project_id).filter(models.Task.assigned_to_id == current_user.id).distinct().all()
        project_ids = [r[0] for r in task_project_ids]
        if project_ids:
            return db.query(models.Project).filter(models.Project.id.in_(project_ids)).all()
        return db.query(models.Project).all()
    else: # client
        return db.query(models.Project).all()

@router.post("", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_or_admin)):
    new_project = models.Project(
        name=project.name,
        description=project.description,
        status=project.status,
        manager_id=project.manager_id or current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    log_activity(db, current_user.id, "CREATE_PROJECT", f"Created project '{new_project.name}' (ID: {new_project.id})")
    return new_project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_manager_or_admin)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    update_data = project_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
        
    db.commit()
    db.refresh(db_project)
    log_activity(db, current_user.id, "UPDATE_PROJECT", f"Updated project '{db_project.name}' (ID: {db_project.id})")
    return db_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db.delete(db_project)
    db.commit()
    log_activity(db, current_user.id, "DELETE_PROJECT", f"Deleted project '{db_project.name}' (ID: {project_id})")
    return None
