import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { AttachmentManager } from '../components/AttachmentManager';
import { Plus, LifeBuoy, User, Calendar, CheckCircle, Paperclip } from 'lucide-react';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  client?: { full_name: string; email: string };
  assigned_to?: { id: number; full_name: string };
}

export const Tickets: React.FC = () => {
  const { user, getAuthHeaders, isAdmin, isManager, isEmployee, isClient } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  // Assign states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // Attachments
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [selectedEntityForAttachment, setSelectedEntityForAttachment] = useState<number | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error('Failed to fetch tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdmin && !isManager) return;
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const emps = data.filter((u: any) => u.role === 'employee');
        setEmployeesList(emps);
        if (emps.length > 0) setAssigneeId(emps[0].id.toString());
      }
    } catch (e) {
      console.error('Failed to fetch employees:', e);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, description, priority })
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setIsModalOpen(false);
        fetchTickets();
      }
    } catch (e) {
      console.error('Failed to create ticket:', e);
    }
  };

  const handleUpdateStatus = async (ticketId: number, statusVal: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: statusVal })
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (e) {
      console.error('Failed to update ticket:', e);
    }
  };

  const handleOpenAssignModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          assigned_to_id: parseInt(assigneeId),
          status: 'in_progress'
        })
      });
      if (res.ok) {
        setIsAssignModalOpen(false);
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (e) {
      console.error('Failed to assign ticket:', e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading support portal...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Client Support Desk</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>File queries, manage bug trackers, and inspect delivery specs.</p>
        </div>
        {isClient && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Ticket</span>
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {tickets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No support tickets cataloged.</p>
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LifeBuoy size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>TKT-{t.id}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className={`role-badge role-${t.priority === 'high' ? 'admin' : t.priority === 'medium' ? 'employee' : 'client'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                    {t.priority}
                  </span>
                  <span className={`role-badge role-${t.status === 'resolved' || t.status === 'closed' ? 'client' : t.status === 'in_progress' ? 'employee' : 'manager'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                    {t.status}
                  </span>
                </div>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.title}</h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: '1.5' }}>
                {t.description}
              </p>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div>Client: <strong>{t.client?.full_name}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={12} />
                  <span>Assignee: <strong>{t.assigned_to?.full_name || 'Unassigned'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} />
                  <span>Filed: {new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status workflow triggers based on role */}
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => { setSelectedEntityForAttachment(t.id); setIsAttachmentModalOpen(true); }}
                    className="btn btn-secondary" 
                    style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  >
                    <Paperclip size={12} />
                    <span>Attachments</span>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                {(isAdmin || isManager) && (
                  <button 
                    onClick={() => handleOpenAssignModal(t)} 
                    className="btn btn-secondary" 
                    style={{ fontSize: '11px', padding: '6px 12px', width: '100%' }}
                  >
                    Assign Employee
                  </button>
                )}
                {isEmployee && t.status === 'in_progress' && (
                  <button 
                    onClick={() => handleUpdateStatus(t.id, 'resolved')} 
                    className="btn btn-primary" 
                    style={{ fontSize: '11px', padding: '6px 12px', width: '100%' }}
                  >
                    <CheckCircle size={12} />
                    <span>Resolve Ticket</span>
                  </button>
                )}
                {isClient && t.status === 'resolved' && (
                  <button 
                    onClick={() => handleUpdateStatus(t.id, 'closed')} 
                    className="btn btn-secondary" 
                    style={{ fontSize: '11px', padding: '6px 12px', width: '100%', borderColor: 'var(--success)', color: 'var(--success)' }}
                  >
                    Close Ticket
                  </button>
                )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Support Ticket">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Ticket Title</label>
            <input 
              type="text" 
              required 
              className="form-input" 
              placeholder="e.g. Broken links on secondary navigation" 
              value={title}
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select 
              className="form-input" 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
              style={{ background: 'var(--bg-base)' }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description of Request / Issue</label>
            <textarea 
              required 
              className="form-input" 
              placeholder="Provide exact details so managers can reproduce the concern..." 
              rows={4} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">File Ticket</button>
        </form>
      </Modal>

      {/* Assign Modal for Manager */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Ticket to Employee">
        {selectedTicket && (
          <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <span>Assigning ticket: <strong>{selectedTicket.title}</strong></span>
            </div>
            <div className="form-group">
              <label className="form-label">Select Employee</label>
              <select 
                className="form-input" 
                value={assigneeId} 
                onChange={(e) => setAssigneeId(e.target.value)}
                style={{ background: 'var(--bg-base)' }}
              >
                {employeesList.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Assign & Open Ticket</button>
          </form>
        )}
      </Modal>

      {/* Attachment Manager Modal */}
      {selectedEntityForAttachment && (
        <AttachmentManager
          isOpen={isAttachmentModalOpen}
          onClose={() => { setIsAttachmentModalOpen(false); setSelectedEntityForAttachment(null); }}
          entityType="ticket"
          entityId={selectedEntityForAttachment}
        />
      )}
    </div>
  );
};
