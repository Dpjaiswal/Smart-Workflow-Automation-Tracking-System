from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

# ----------------- USER SCHEMAS -----------------
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str # 'admin', 'manager', 'employee', 'client'
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- AUTH SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    full_name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# ----------------- PROJECT SCHEMAS -----------------
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "planning" # 'planning', 'active', 'completed', 'on_hold'
    manager_id: Optional[int] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    manager_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    manager: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ----------------- TASK SCHEMAS -----------------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo" # 'todo', 'in_progress', 'in_review', 'completed'
    priority: Optional[str] = "medium" # 'low', 'medium', 'high', 'critical'
    project_id: int
    assigned_to_id: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    project: Optional[ProjectBase] = None
    assigned_to: Optional[UserResponse] = None
    created_by: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ----------------- APPROVAL SCHEMAS -----------------
class ApprovalBase(BaseModel):
    type: str # 'leave', 'document', 'task_completion'
    assigned_to_id: int
    related_id: Optional[int] = None
    details: str # JSON metadata string or plain text

class ApprovalCreate(ApprovalBase):
    pass

class ApprovalUpdate(BaseModel):
    status: str # 'approved', 'rejected'
    comments: Optional[str] = None

class ApprovalResponse(ApprovalBase):
    id: int
    status: str
    requested_by_id: int
    comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    requested_by: Optional[UserResponse] = None
    assigned_to: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ----------------- WORKLOG SCHEMAS -----------------
class WorkLogBase(BaseModel):
    project_id: int
    task_id: Optional[int] = None
    date: date
    hours_logged: float
    description: Optional[str] = None

class WorkLogCreate(WorkLogBase):
    pass

class WorkLogResponse(WorkLogBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserResponse] = None
    project: Optional[ProjectBase] = None
    task: Optional[TaskBase] = None

    class Config:
        from_attributes = True

# ----------------- TICKET SCHEMAS -----------------
class TicketBase(BaseModel):
    title: str
    description: str
    priority: Optional[str] = "medium" # 'low', 'medium', 'high'

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    status: Optional[str] = None # 'open', 'in_progress', 'resolved', 'closed'
    assigned_to_id: Optional[int] = None
    priority: Optional[str] = None

class TicketResponse(TicketBase):
    id: int
    status: str
    client_id: int
    assigned_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    client: Optional[UserResponse] = None
    assigned_to: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ----------------- NOTIFICATION SCHEMAS -----------------
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- AUDIT LOG SCHEMAS -----------------
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: str
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ----------------- ATTACHMENT SCHEMAS -----------------
class AttachmentBase(BaseModel):
    filename: str
    file_path: str
    content_type: str
    task_id: Optional[int] = None
    ticket_id: Optional[int] = None
    approval_id: Optional[int] = None

class AttachmentResponse(AttachmentBase):
    id: int
    uploaded_by_id: int
    created_at: datetime
    uploaded_by: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ----------------- COMMENT SCHEMAS -----------------
class CommentBase(BaseModel):
    content: str
    task_id: Optional[int] = None
    ticket_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: int
    author_id: int
    created_at: datetime
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True

