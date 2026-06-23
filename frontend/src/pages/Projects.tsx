import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Plus, Briefcase, User, Calendar } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  manager?: { full_name: string };
}

export const Projects: React.FC = () => {
  const { user, getAuthHeaders, isAdmin, isManager } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState<any[]>([]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin && !isManager) return;
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const mgrs = data.filter((u: any) => u.role === 'manager' || u.role === 'admin');
        setManagers(mgrs);
        if (mgrs.length > 0) setManagerId(mgrs[0].id.toString());
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          description,
          status,
          manager_id: managerId ? parseInt(managerId) : undefined
        })
      });
      if (res.ok) {
        setName('');
        setDescription('');
        setStatus('planning');
        setIsModalOpen(false);
        fetchProjects();
      }
    } catch (e) {
      console.error('Failed to create project:', e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading projects database...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Active Projects ({projects.length})</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Monitor scope, allocations, and deadlines.</p>
        </div>
        {(isAdmin || isManager) && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {projects.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No projects aligned currently.</p>
        ) : (
          projects.map((proj) => (
            <div key={proj.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{proj.name}</h4>
                </div>
                <span className={`role-badge role-${proj.status === 'completed' ? 'client' : proj.status === 'active' ? 'employee' : 'manager'}`}>
                  {proj.status}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: '1.5' }}>
                {proj.description || 'No description provided.'}
              </p>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <User size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Manager: <strong>{proj.manager?.full_name || 'Unassigned'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Initiated: {new Date(proj.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input 
              type="text" 
              required 
              className="form-input" 
              placeholder="e.g. ERP System Redesign" 
              value={name}
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              placeholder="Summary of goals and timeline parameters..." 
              rows={3} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select 
              className="form-input" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              style={{ background: 'var(--bg-base)' }}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign Project Manager</label>
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
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Create Project</button>
        </form>
      </Modal>
    </div>
  );
};
