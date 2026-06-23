import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Plus, Clock, Calendar, Briefcase, FileText } from 'lucide-react';

interface WorkLog {
  id: number;
  date: string;
  hours_logged: number;
  description: string;
  created_at: string;
  user?: { full_name: string; email: string };
  project?: { name: string };
  task?: { title: string };
}

export const WorkLogs: React.FC = () => {
  const { user, getAuthHeaders, isEmployee } = useAuth();
  const [worklogs, setWorklogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);

  const fetchWorklogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/worklogs`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setWorklogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch worklogs:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsAndTasks = async () => {
    try {
      const projRes = await fetch(`${API_BASE}/api/projects`, {
        headers: getAuthHeaders()
      });
      if (projRes.ok) {
        const data = await projRes.json();
        setProjectsList(data);
        if (data.length > 0) setProjectId(data[0].id.toString());
      }

      const tasksRes = await fetch(`${API_BASE}/api/tasks`, {
        headers: getAuthHeaders()
      });
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasksList(data);
      }
    } catch (e) {
      console.error('Failed to fetch metadata:', e);
    }
  };

  useEffect(() => {
    fetchWorklogs();
    fetchProjectsAndTasks();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/worklogs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          project_id: parseInt(projectId),
          task_id: taskId ? parseInt(taskId) : undefined,
          date,
          hours_logged: parseFloat(hours),
          description
        })
      });
      if (res.ok) {
        setHours('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setTaskId('');
        setIsModalOpen(false);
        fetchWorklogs();
      }
    } catch (e) {
      console.error('Failed to create worklog:', e);
    }
  };

  const totalHours = worklogs.reduce((sum, log) => sum + log.hours_logged, 0);

  // Filter tasks based on selected project
  const filteredTasks = tasksList.filter(t => t.project_id === parseInt(projectId));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading productivity database...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Work Productivity Logs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Enforce audit times and evaluate resource distributions.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: '13px' }}>Total Tracked: <strong>{totalHours} hrs</strong></span>
          </div>

          {isEmployee && (
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Log Daily Activity</span>
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '16px' }}>Date</th>
              <th style={{ padding: '16px' }}>Employee</th>
              <th style={{ padding: '16px' }}>Project Context</th>
              <th style={{ padding: '16px' }}>Aligned Task</th>
              <th style={{ padding: '16px' }}>Hours Logged</th>
              <th style={{ padding: '16px' }}>Log Description</th>
            </tr>
          </thead>
          <tbody>
            {worklogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No activity logged.
                </td>
              </tr>
            ) : (
              worklogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13.5px' }}>
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500' }}>{log.user?.full_name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.user?.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={14} style={{ color: 'var(--secondary)' }} />
                      <span>{log.project?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    {log.task?.title ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{log.task.title}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>General Work</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className="role-badge role-employee" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {log.hours_logged} hrs
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: '1.4' }}>
                    {log.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Activity Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Daily Productivity Activity">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Project Alignment</label>
            <select 
              className="form-input" 
              value={projectId} 
              onChange={(e) => setProjectId(e.target.value)}
              style={{ background: 'var(--bg-base)' }}
            >
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Task Alignment (Optional)</label>
            <select 
              className="form-input" 
              value={taskId} 
              onChange={(e) => setTaskId(e.target.value)}
              style={{ background: 'var(--bg-base)' }}
            >
              <option value="">General Project Work (No specific task)</option>
              {filteredTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                required 
                className="form-input" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hours Logged</label>
              <input 
                type="number" 
                step="0.5" 
                min="0.5"
                max="24"
                required 
                className="form-input" 
                placeholder="e.g. 6.5" 
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Task Details / Work Completed</label>
            <textarea 
              required
              className="form-input" 
              placeholder="What specifically did you accomplish during these hours?" 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <button type="submit" className="btn btn-primary">Save Activity Log</button>
        </form>
      </Modal>
    </div>
  );
};
