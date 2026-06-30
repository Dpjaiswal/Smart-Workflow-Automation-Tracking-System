import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User, Attachment, Task, Ticket, Approval
from .auth import get_current_user
from ..schemas import AttachmentResponse

router = APIRouter(prefix="/api/attachments", tags=["attachments"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=AttachmentResponse)
async def upload_attachment(
    file: UploadFile = File(...),
    task_id: Optional[int] = Form(None),
    ticket_id: Optional[int] = Form(None),
    approval_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not (task_id or ticket_id or approval_id):
        raise HTTPException(status_code=400, detail="Must provide task_id, ticket_id, or approval_id")

    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{current_user.id}_{int(os.path.getmtime(UPLOAD_DIR)) if os.path.exists(UPLOAD_DIR) else 1}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    attachment = Attachment(
        filename=file.filename,
        file_path=f"/uploads/{safe_filename}",
        content_type=file.content_type,
        task_id=task_id,
        ticket_id=ticket_id,
        approval_id=approval_id,
        uploaded_by_id=current_user.id
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment

@router.get("/task/{task_id}", response_model=List[AttachmentResponse])
def get_task_attachments(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    attachments = db.query(Attachment).filter(Attachment.task_id == task_id).all()
    return attachments

@router.get("/ticket/{ticket_id}", response_model=List[AttachmentResponse])
def get_ticket_attachments(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    attachments = db.query(Attachment).filter(Attachment.ticket_id == ticket_id).all()
    return attachments
