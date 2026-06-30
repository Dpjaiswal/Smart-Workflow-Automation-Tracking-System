import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { AttachmentManager } from '../components/AttachmentManager';
import { Plus, Calendar, User, Paperclip } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  project_id: number;
  project?: { name: string };
  assigned_to?: { id: number; full_name: string };
  created_by?: { full_name: string };
}

export const Tasks: React.FC = () => {
  const { user, getAuthHeaders, isAdmin, isManager, isEmployee } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedTaskForApproval, setSelectedTaskForApproval] = useState<Task | null>(null);

  // Attachments
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [selectedEntityForAttachment, setSelectedEntityForAttachment] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [projectId, setProjectId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [approvalNotes, setApprovalNotes] = useState('');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState<any[]>([]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndProjects = async () => {
    try {
      const projRes = await fetch(`${API_BASE}/api/projects`, {
        headers: getAuthHeaders()
      });
      if (projRes.ok) {
        const data = await projRes.json();
        setProjects(data);
        if (data.length > 0) setProjectId(data[0].id.toString());
      }

      const usersRes = await fetch(`${API_BASE}/api/users`, {
        headers: getAuthHeaders()
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        const emps = data.filter((u: any) => u.role === 'employee');
        setEmployees(emps);
        if (emps.length > 0) setAssignedToId(emps[0].id.toString());

        const mgrs = data.filter((u: any) => u.role === 'manager' || u.role === 'admin');
        setManagers(mgrs);
        if (mgrs.length > 0) setManagerId(mgrs[0].id.toString());
      }
    } catch (e) {
      console.error('Failed to fetch users and projects:', e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsersAndProjects();
  }, [user]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          project_id: parseInt(projectId),
          assigned_to_id: assignedToId ? parseInt(assignedToId) : undefined,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined
        })
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setStatus('todo');
        setPriority('medium');
        setDueDate('');
        setIsTaskModalOpen(false);
        fetchTasks();
      }
    } catch (e) {
      console.error('Failed to create task:', e);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (e) {
      console.error('Failed to update task status:', e);
    }
  };

  const handleOpenApprovalModal = (task: Task) => {
    setSelectedTaskForApproval(task);
    setIsApprovalModalOpen(true);
  };

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForApproval) return;
    try {
      const res = await fetch(`${API_BASE}/api/approvals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'task_completion',
          assigned_to_id: parseInt(managerId),
          related_id: selectedTaskForApproval.id,
          details: JSON.stringify({
            notes: approvalNotes,
            task_title: selectedTaskForApproval.title,
            project_name: selectedTaskForApproval.project?.name || ''
          })
        })
      });
      if (res.ok) {
        await handleUpdateStatus(selectedTaskForApproval.id, 'in_review');
        setApprovalNotes('');
        setIsApprovalModalOpen(false);
        setSelectedTaskForApproval(null);
        fetchTasks();
      }
    } catch (e) {
      console.error('Failed to submit completion approval:', e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading task checklist...</p>
      </div>
    );
  }

  const columns = [
    { id: 'todo', title: 'To Do', color: 'var(--text-secondary)' },
    { id: 'in_progress', title: 'In Progress', color: 'var(--secondary)' },
    { id: 'in_review', title: 'In Review', color: 'var(--primary)' },
    { id: 'completed', title: 'Completed', color: 'var(--success)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Task & Workflow board</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Enforce delivery, manage backlogs, and trigger reviews.</p>
        </div>
        {(isAdmin || isManager) && (
          <button onClick={() => setIsTaskModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        )}
      </div>

      <div className="kanban-board">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-title" style={{ borderBottom: `2px solid ${col.color}`, paddingBottom: '6px' }}>
                <span>{col.title}</span>
                <span style={{ fontSize: '11px', background: 'var(--border-color)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-primary)' }}>
                  {colTasks.length}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                {colTasks.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No tasks here
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div key={task.id} className="kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--secondary)', textTransform: 'uppercase' }}>
                          {task.project?.name || 'No Project'}
                        </span>
                        <span className={`role-badge role-${task.priority === 'critical' ? 'admin' : task.priority === 'high' ? 'manager' : task.priority === 'medium' ? 'employee' : 'client'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <h5 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>{task.title}</h5>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
                        {task.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={12} />
                          <span>Owner: <strong>{task.assigned_to?.full_name || 'Unassigned'}</strong></span>
                        </div>
                        {task.due_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={12} />
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Status quick changer or approval request triggers */}
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => { setSelectedEntityForAttachment(task.id); setIsAttachmentModalOpen(true); }}
                            className="btn btn-secondary" 
                            style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                          >
                            <Paperclip size={12} />
                            <span>Attachments</span>
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {isEmployee && task.status !== 'completed' && task.status !== 'in_review' && (
                          <>
                            {task.status === 'todo' && (
                              <button onClick={() => handleUpdateStatus(task.id, 'in_progress')} className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 10px', flexGrow: 1 }}>
                                Start Working
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button onClick={() => handleOpenApprovalModal(task)} className="btn btn-primary" style={{ fontSize: '11px', padding: '6px 10px', flexGrow: 1 }}>
                                Request Completion
                              </button>
                            )}
                          </>
                        )}
                        
                        {(isAdmin || isManager) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                            <select 
                              className="form-input" 
                              value={task.status} 
                              onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                              style={{ width: '100%', padding: '4px 8px', fontSize: '11px', background: 'var(--bg-base)' }}
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="in_review">In Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creation Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input 
              type="text" 
              required 
              className="form-input" 
              placeholder="e.g. Write backend documentation" 
              value={title}
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              placeholder="Provide context and requirements..." 
              rows={3} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Project Alignment</label>
            <select 
              className="form-input" 
              value={projectId} 
              onChange={(e) => setProjectId(e.target.value)}
              style={{ background: 'var(--bg-base)' }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign Employee</label>
            <select 
              className="form-input" 
              value={assignedToId} 
              onChange={(e) => setAssignedToId(e.target.value)}
              style={{ background: 'var(--bg-base)' }}
            >
              <option value="">Unassigned</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select 
                className="form-input" 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                style={{ background: 'var(--bg-base)' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Create Task</button>
        </form>
      </Modal>

      {/* Submit Approval Modal */}
      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title="Submit Task Completion Approval">
        {selectedTaskForApproval && (
          <form onSubmit={handleSubmitApproval} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <span>Submitting completion request for: <strong>{selectedTaskForApproval.title}</strong></span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Assign Reviewing Manager</label>
              <select 
                className="form-input" 
                value={managerId} 
                onChange={(e) => setManagerId(e.target.value)}
                style={{ background: 'var(--bg-base)' }}
              >
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Review Notes / Deliverable Links</label>
              <textarea 
                required
                className="form-input" 
                placeholder="Include link to documentation, commits, or notes..." 
                rows={4} 
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
            
            <button type="submit" className="btn btn-primary">Submit to Manager</button>
          </form>
        )}
      </Modal>

      {/* Attachment Manager Modal */}
      {selectedEntityForAttachment && (
        <AttachmentManager
          isOpen={isAttachmentModalOpen}
          onClose={() => { setIsAttachmentModalOpen(false); setSelectedEntityForAttachment(null); }}
          entityType="task"
          entityId={selectedEntityForAttachment}
        />
      )}
    </div>
  );
};
