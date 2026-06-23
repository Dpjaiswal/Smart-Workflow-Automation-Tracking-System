from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas
from ..services import log_activity, create_notification

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

@router.get("", response_model=List[schemas.TicketResponse])
def get_tickets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role in ["admin", "manager"]:
        return db.query(models.Ticket).all()
    elif current_user.role == "client":
        return db.query(models.Ticket).filter(models.Ticket.client_id == current_user.id).all()
    else: # employee
        return db.query(models.Ticket).filter(models.Ticket.assigned_to_id == current_user.id).all()

@router.post("", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Default to first client if manager creates
    client_id = current_user.id
    if current_user.role != "client":
        first_client = db.query(models.User).filter(models.User.role == "client").first()
        if first_client:
            client_id = first_client.id
            
    new_ticket = models.Ticket(
        title=ticket.title,
        description=ticket.description,
        status="open",
        priority=ticket.priority or "medium",
        client_id=client_id
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    log_activity(db, current_user.id, "CREATE_TICKET", f"Submitted support ticket '{new_ticket.title}' (ID: {new_ticket.id})")
    
    managers = db.query(models.User).filter(models.User.role == "manager").all()
    for mgr in managers:
        create_notification(db, mgr.id, "New Support Ticket", f"Ticket '{new_ticket.title}' has been submitted.")
        
    return new_ticket

@router.put("/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(ticket_id: int, ticket_update: schemas.TicketUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    update_data = ticket_update.model_dump(exclude_unset=True)
    
    if current_user.role == "client":
        allowed_keys = ["status"]
        update_data = {k: v for k, v in update_data.items() if k in allowed_keys}
    elif current_user.role == "employee":
        if db_ticket.assigned_to_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only update tickets assigned to you")
        allowed_keys = ["status"]
        update_data = {k: v for k, v in update_data.items() if k in allowed_keys}
        
    old_status = db_ticket.status
    old_assignee = db_ticket.assigned_to_id
    
    for key, value in update_data.items():
        setattr(db_ticket, key, value)
        
    db.commit()
    db.refresh(db_ticket)
    
    log_activity(db, current_user.id, "UPDATE_TICKET", f"Updated ticket '{db_ticket.title}' (ID: {ticket_id})")
    
    if "assigned_to_id" in update_data and old_assignee != db_ticket.assigned_to_id and db_ticket.assigned_to_id:
        create_notification(
            db, 
            db_ticket.assigned_to_id, 
            "Support Ticket Assigned", 
            f"Ticket '{db_ticket.title}' has been assigned to you."
        )
        
    if "status" in update_data and old_status != db_ticket.status:
        create_notification(
            db, 
            db_ticket.client_id, 
            "Ticket Status Update", 
            f"Your support ticket '{db_ticket.title}' status has changed to '{db_ticket.status}'."
        )
        
    return db_ticket
