from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Comment, Task, Ticket
from .auth import get_current_user
from ..schemas import CommentCreate, CommentResponse

router = APIRouter(prefix="/api/comments", tags=["comments"])

@router.post("/", response_model=CommentResponse)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not comment.task_id and not comment.ticket_id:
        raise HTTPException(status_code=400, detail="Must provide either task_id or ticket_id")

    if comment.task_id:
        task = db.query(Task).filter(Task.id == comment.task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
    if comment.ticket_id:
        ticket = db.query(Ticket).filter(Ticket.id == comment.ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

    new_comment = Comment(
        content=comment.content,
        task_id=comment.task_id,
        ticket_id=comment.ticket_id,
        author_id=current_user.id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/task/{task_id}", response_model=List[CommentResponse])
def get_task_comments(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    comments = db.query(Comment).filter(Comment.task_id == task_id).order_by(Comment.created_at.asc()).all()
    return comments

@router.get("/ticket/{ticket_id}", response_model=List[CommentResponse])
def get_ticket_comments(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    comments = db.query(Comment).filter(Comment.ticket_id == ticket_id).order_by(Comment.created_at.asc()).all()
    return comments
