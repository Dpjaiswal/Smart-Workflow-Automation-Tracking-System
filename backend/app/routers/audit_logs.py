from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth import get_current_admin
from .. import models, schemas

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).all()
