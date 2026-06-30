import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'admin', 'manager', 'employee', 'client'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    managed_projects = relationship("Project", back_populates="manager", foreign_keys="Project.manager_id")
    assigned_tasks = relationship("Task", back_populates="assigned_to", foreign_keys="Task.assigned_to_id")
    created_tasks = relationship("Task", back_populates="created_by", foreign_keys="Task.created_by_id")
    submitted_approvals = relationship("Approval", back_populates="requested_by", foreign_keys="Approval.requested_by_id")
    assigned_approvals = relationship("Approval", back_populates="assigned_to", foreign_keys="Approval.assigned_to_id")
    worklogs = relationship("WorkLog", back_populates="user")
    client_tickets = relationship("Ticket", back_populates="client", foreign_keys="Ticket.client_id")
    assigned_tickets = relationship("Ticket", back_populates="assigned_to", foreign_keys="Ticket.assigned_to_id")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="planning") # 'planning', 'active', 'completed', 'on_hold'
    manager_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    manager = relationship("User", back_populates="managed_projects", foreign_keys=[manager_id])
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    worklogs = relationship("WorkLog", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="todo") # 'todo', 'in_progress', 'in_review', 'completed'
    priority = Column(String, default="medium") # 'low', 'medium', 'high', 'critical'
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assigned_to = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to_id])
    created_by = relationship("User", back_populates="created_tasks", foreign_keys=[created_by_id])
    worklogs = relationship("WorkLog", back_populates="task")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False) # 'leave', 'document', 'task_completion'
    status = Column(String, default="pending") # 'pending', 'approved', 'rejected'
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    related_id = Column(Integer, nullable=True) # e.g., Task ID
    details = Column(String) # JSON payload string
    comments = Column(String) # Manager input on status change
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    requested_by = relationship("User", back_populates="submitted_approvals", foreign_keys=[requested_by_id])
    assigned_to = relationship("User", back_populates="assigned_approvals", foreign_keys=[assigned_to_id])

class WorkLog(Base):
    __tablename__ = "worklogs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    date = Column(Date, nullable=False)
    hours_logged = Column(Float, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="worklogs")
    project = relationship("Project", back_populates="worklogs")
    task = relationship("Task", back_populates="worklogs")

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="open") # 'open', 'in_progress', 'resolved', 'closed'
    priority = Column(String, default="medium") # 'low', 'medium', 'high'
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    client = relationship("User", back_populates="client_tickets", foreign_keys=[client_id])
    assigned_to = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to_id])
    attachments = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for system actions
    action = Column(String, nullable=False) # e.g. 'LOGIN', 'CREATE_TASK', 'APPROVE_LEAVE'
    details = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    approval_id = Column(Integer, ForeignKey("approvals.id"), nullable=True)
    
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    task = relationship("Task", back_populates="attachments")
    ticket = relationship("Ticket", back_populates="attachments")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    task = relationship("Task", back_populates="comments")
    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])


