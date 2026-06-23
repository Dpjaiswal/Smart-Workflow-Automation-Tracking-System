from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas
from ..services import log_activity, create_notification

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

@router.get("", response_model=List[schemas.ApprovalResponse])
def get_approvals(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role in ["admin", "manager"]:
        if current_user.role == "admin":
            return db.query(models.Approval).all()
        return db.query(models.Approval).filter(models.Approval.assigned_to_id == current_user.id).all()
    else:
        return db.query(models.Approval).filter(models.Approval.requested_by_id == current_user.id).all()

@router.post("", response_model=schemas.ApprovalResponse, status_code=status.HTTP_201_CREATED)
def create_approval(approval: schemas.ApprovalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    manager = db.query(models.User).filter(models.User.id == approval.assigned_to_id).first()
    if not manager or manager.role not in ["manager", "admin"]:
        raise HTTPException(status_code=400, detail="Assigned reviewer must be a manager or admin")
        
    new_approval = models.Approval(
        type=approval.type,
        status="pending",
        requested_by_id=current_user.id,
        assigned_to_id=approval.assigned_to_id,
        related_id=approval.related_id,
        details=approval.details,
        comments=""
    )
    db.add(new_approval)
    db.commit()
    db.refresh(new_approval)
    
    log_activity(db, current_user.id, "SUBMIT_APPROVAL", f"Submitted a '{new_approval.type}' approval request (ID: {new_approval.id}).")
    
    create_notification(
        db, 
        new_approval.assigned_to_id, 
        "New Approval Request", 
        f"A new '{new_approval.type}' request has been submitted by {current_user.full_name}."
    )
    
    return new_approval

@router.put("/{approval_id}", response_model=schemas.ApprovalResponse)
def review_approval(approval_id: int, review: schemas.ApprovalUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if not db_approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
        
    if db_approval.assigned_to_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not authorized to review this request")
        
    db_approval.status = review.status
    db_approval.comments = review.comments
    
    db.commit()
    db.refresh(db_approval)
    
    log_activity(db, current_user.id, "REVIEW_APPROVAL", f"Reviewed approval request ID {approval_id}. Result: {db_approval.status}")
    
    if db_approval.type == "task_completion" and db_approval.status == "approved" and db_approval.related_id:
        task = db.query(models.Task).filter(models.Task.id == db_approval.related_id).first()
        if task:
            task.status = "completed"
            db.commit()
            log_activity(db, current_user.id, "AUTO_COMPLETE_TASK", f"Task '{task.title}' status auto-set to completed via approval.")
            
    create_notification(
        db, 
        db_approval.requested_by_id, 
        "Approval Request Reviewed", 
        f"Your '{db_approval.type}' request has been {db_approval.status} by {current_user.full_name}."
    )
    
    return db_approval
