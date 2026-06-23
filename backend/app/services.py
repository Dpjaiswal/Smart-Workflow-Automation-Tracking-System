from sqlalchemy.orm import Session
from . import models

def log_activity(db: Session, user_id: int, action: str, details: str):
    log = models.AuditLog(user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def create_notification(db: Session, user_id: int, title: str, message: str):
    notification = models.Notification(user_id=user_id, title=title, message=message)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
