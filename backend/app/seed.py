import datetime
from sqlalchemy.orm import Session
from .database import engine, Base
from . import models
from .auth import get_password_hash

def seed_database(db: Session):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    # Check if we already have users
    if db.query(models.User).count() > 0:
        return
        
    print("Seeding database with demo data...")
    
    # 1. Create Users
    admin = models.User(
        email="admin@swats.com",
        full_name="Amit Sharma",
        role="admin",
        hashed_password=get_password_hash("admin123"),
        is_active=True
    )
    manager = models.User(
        email="manager@swats.com",
        full_name="Rohan Verma",
        role="manager",
        hashed_password=get_password_hash("manager123"),
        is_active=True
    )
    employee = models.User(
        email="employee@swats.com",
        full_name="Kunal Sen",
        role="employee",
        hashed_password=get_password_hash("employee123"),
        is_active=True
    )
    employee2 = models.User(
        email="employee2@swats.com",
        full_name="Sneha Rao",
        role="employee",
        hashed_password=get_password_hash("employee123"),
        is_active=True
    )
    client = models.User(
        email="client@swats.com",
        full_name="Preeti Patel",
        role="client",
        hashed_password=get_password_hash("client123"),
        is_active=True
    )
    
    db.add_all([admin, manager, employee, employee2, client])
    db.commit()
    db.refresh(admin)
    db.refresh(manager)
    db.refresh(employee)
    db.refresh(employee2)
    db.refresh(client)
    
    # 2. Create Projects
    proj_redesign = models.Project(
        name="SaaS Website Redesign",
        description="Overhaul corporate landing and dashboards for premium branding.",
        status="active",
        manager_id=manager.id
    )
    proj_erp = models.Project(
        name="SWATS Mobile Integration",
        description="Build mobile-optimized views for the workflow tracking systems.",
        status="planning",
        manager_id=manager.id
    )
    proj_gateway = models.Project(
        name="Payment Gateway Integration",
        description="Add Razorpay and Stripe processors to core workflow API.",
        status="completed",
        manager_id=manager.id
    )
    
    db.add_all([proj_redesign, proj_erp, proj_gateway])
    db.commit()
    db.refresh(proj_redesign)
    db.refresh(proj_erp)
    db.refresh(proj_gateway)
    
    # 3. Create Tasks
    task_figma = models.Task(
        title="Design Figma UI Layouts",
        description="Generate dark/light dashboard layouts with high-fidelity branding components.",
        status="completed",
        priority="high",
        project_id=proj_redesign.id,
        assigned_to_id=employee.id,
        created_by_id=manager.id,
        due_date=datetime.datetime.utcnow() + datetime.timedelta(days=2)
    )
    task_router = models.Task(
        title="Setup CSS Variables & Routing",
        description="Initialize React context routers and style templates using modern CSS parameters.",
        status="in_progress",
        priority="medium",
        project_id=proj_redesign.id,
        assigned_to_id=employee2.id,
        created_by_id=manager.id,
        due_date=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    task_razorpay = models.Task(
        title="Stripe & Razorpay API Setup",
        description="Verify webhooks, test credentials, and configure database payment states.",
        status="completed",
        priority="critical",
        project_id=proj_gateway.id,
        assigned_to_id=employee.id,
        created_by_id=manager.id,
        due_date=datetime.datetime.utcnow() - datetime.timedelta(days=1)
    )
    task_tests = models.Task(
        title="Write Endpoint Tests",
        description="Implement unit and validation tests to cover project routers and permissions.",
        status="todo",
        priority="low",
        project_id=proj_redesign.id,
        assigned_to_id=employee.id,
        created_by_id=manager.id,
        due_date=datetime.datetime.utcnow() + datetime.timedelta(days=12)
    )
    
    db.add_all([task_figma, task_router, task_razorpay, task_tests])
    db.commit()
    db.refresh(task_figma)
    db.refresh(task_router)
    db.refresh(task_razorpay)
    db.refresh(task_tests)
    
    # 4. Create Support Tickets
    ticket_checkout = models.Ticket(
        title="Stripe checkout throws 500 error",
        description="Intermittent socket failures during checkout redirects. Needs logs investigation.",
        status="open",
        priority="high",
        client_id=client.id
    )
    ticket_fonts = models.Ticket(
        title="Blurry fonts in Chrome version 114",
        description="Antialiasing issues on secondary headers in standard layout settings. Please investigate.",
        status="resolved",
        priority="low",
        client_id=client.id,
        assigned_to_id=employee.id
    )
    
    db.add_all([ticket_checkout, ticket_fonts])
    db.commit()
    
    # 5. Create WorkLogs
    log1 = models.WorkLog(
        user_id=employee.id,
        project_id=proj_redesign.id,
        task_id=task_figma.id,
        date=datetime.date.today() - datetime.timedelta(days=2),
        hours_logged=6.0,
        description="Finished Figma screens. Designed 4 key layout dashboard states including roles grid."
    )
    log2 = models.WorkLog(
        user_id=employee2.id,
        project_id=proj_redesign.id,
        task_id=task_router.id,
        date=datetime.date.today() - datetime.timedelta(days=1),
        hours_logged=4.5,
        description="Configured App routing wrapper. Added responsive sidebar controls."
    )
    log3 = models.WorkLog(
        user_id=employee.id,
        project_id=proj_gateway.id,
        task_id=task_razorpay.id,
        date=datetime.date.today() - datetime.timedelta(days=3),
        hours_logged=8.0,
        description="Completed API integrations. All postman requests successfully returning 200 checks."
    )
    
    db.add_all([log1, log2, log3])
    db.commit()
    
    # 6. Create Workflow Approvals
    app1 = models.Approval(
        type="leave",
        status="pending",
        requested_by_id=employee.id,
        assigned_to_id=manager.id,
        details='{"leave_date": "2026-06-30", "days": 1, "reason": "Annual dental checkup appointment."}',
        comments=""
    )
    app2 = models.Approval(
        type="task_completion",
        status="pending",
        requested_by_id=employee2.id,
        assigned_to_id=manager.id,
        related_id=task_router.id,
        details='{"notes": "CSS template completed. Routing handles redirect controls perfectly."}',
        comments=""
    )
    
    db.add_all([app1, app2])
    db.commit()
    
    # 7. Create Notifications
    notif1 = models.Notification(
        user_id=manager.id,
        title="New Support Ticket",
        message="Client Preeti Patel has submitted ticket: 'Stripe checkout throws 500 error'.",
        is_read=False
    )
    notif2 = models.Notification(
        user_id=employee.id,
        title="New Task Assigned",
        message="You have been assigned: 'Write Endpoint Tests' under project 'SaaS Website Redesign'.",
        is_read=False
    )
    
    db.add_all([notif1, notif2])
    db.commit()
    
    # 8. Create Audit Logs
    audit1 = models.AuditLog(
        user_id=admin.id,
        action="SEED_DATA",
        details="Database initialized and populated with preset SWATS demo profiles."
    )
    audit2 = models.AuditLog(
        user_id=manager.id,
        action="CREATE_PROJECT",
        details="Created project 'SaaS Website Redesign'."
    )
    
    db.add_all([audit1, audit2])
    db.commit()
    
    print("Database seeding completed!")
