from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth import get_current_user, get_current_admin, get_password_hash
from .. import models, schemas
from ..services import log_activity

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.User).all()

@router.post("", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hashed_password,
        is_active=user.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_activity(db, current_admin.id, "CREATE_USER", f"Created user {new_user.email} (Role: {new_user.role})")
    return new_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        db_user.hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
    elif "password" in update_data:
        del update_data["password"]
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    log_activity(db, current_admin.id, "UPDATE_USER", f"Updated user ID {user_id} profile details.")
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    db.delete(db_user)
    db.commit()
    log_activity(db, current_admin.id, "DELETE_USER", f"Deleted user ID {user_id}.")
    return None
