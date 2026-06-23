import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Plus, Check, X, Calendar, FileText } from 'lucide-react';

interface Approval {
  id: number;
  type: string;
  status: string;
  details: string; // JSON string
  comments?: string;
  created_at: string;
  requested_by?: { full_name: string; email: string };
  assigned_to?: { full_name: string };
}

export const Approvals: React.FC = () => {
  const { user, getAuthHeaders, isAdmin, isManager, isEmployee } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [type, setType] = useState('leave');
  const [managerId, setManagerId] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveDays, setLeaveDays] = useState('1');
  const [documentUrl, setDocumentUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [managersList, setManagersList] = useState<any[]>([]);

  const [reviewComments, setReviewComments] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/approvals`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      }
    } catch (e) {
      console.error('Failed to fetch approvals:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const mgrs = data.filter((u: any) => u.role === 'manager' || u.role === 'admin');
        setManagersList(mgrs);
        if (mgrs.length > 0) setManagerId(mgrs[0].id.toString());
      }
    } catch (e) {
      console.error('Failed to fetch managers:', e);
    }
  };

  useEffect(() => {
    fetchApprovals();
    fetchManagers();
  }, [user]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    let detailsObj = {};
    if (type === 'leave') {
      detailsObj = { leave_date: leaveDate, days: parseInt(leaveDays), reason: notes };
    } else {
      detailsObj = { document_url: documentUrl, notes };
    }

    try {
      const res = await fetch(`${API_BASE}/api/approvals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type,
          assigned_to_id: parseInt(managerId),
          details: JSON.stringify(detailsObj)
        })
      });
      if (res.ok) {
        setLeaveDate('');
        setLeaveDays('1');
        setDocumentUrl('');
        setNotes('');
        setIsModalOpen(false);
        fetchApprovals();
      }
    } catch (e) {
      console.error('Failed to submit approval request:', e);
    }
  };

  const handleOpenReview = (approval: Approval, action: 'approved' | 'rejected') => {
    setSelectedApproval(approval);
    setReviewAction(action);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    try {
      const res = await fetch(`${API_BASE}/api/approvals/${selectedApproval.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: reviewAction,
          comments: reviewComments
        })
      });
      if (res.ok) {
        setReviewComments('');
        setIsReviewModalOpen(false);
        setSelectedApproval(null);
        fetchApprovals();
      }
    } catch (e) {
      console.error('Failed to submit approval review:', e);
    }
  };

  const parseDetails = (detailsStr: string) => {
    try {
      return JSON.parse(detailsStr);
    } catch (e) {
      return { notes: detailsStr };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading approvals dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Approvals Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Enforce operational checks, verify documents, and submit leave cards.</p>
        </div>
        {isEmployee && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Submit Request</span>
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '16px' }}>Request details</th>
              <th style={{ padding: '16px' }}>Requester</th>
              <th style={{ padding: '16px' }}>Assigned Reviewer</th>
              <th style={{ padding: '16px' }}>Workflow Specs</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Review Feedback</th>
              {(isAdmin || isManager) && <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {approvals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No approval requests cataloged.
                </td>
              </tr>
            ) : (
              approvals.map((app) => {
                const details = parseDetails(app.details);
                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13.5px' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {app.type === 'leave' ? <Calendar size={16} style={{ color: 'var(--warning)' }} /> : <FileText size={16} style={{ color: 'var(--primary)' }} />}
                        <span style={{ textTransform: 'capitalize' }}>{app.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500' }}>{app.requested_by?.full_name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.requested_by?.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      {app.assigned_to?.full_name || 'System Auto'}
                    </td>
                    <td style={{ padding: '16px', maxWidth: '240px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {app.type === 'leave' && (
                        <span>Date: <strong>{details.leave_date}</strong> ({details.days} days)<br /></span>
                      )}
                      {app.type === 'document' && details.document_url && (
                        <span>Doc: <a href={details.document_url} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)' }}>View Document</a><br /></span>
                      )}
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{details.notes || details.reason || 'No comments'}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={`role-badge role-${app.status === 'approved' ? 'client' : app.status === 'pending' ? 'manager' : 'admin'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {app.comments || 'No manager comments yet.'}
                    </td>
                    {(isAdmin || isManager) && (
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        {app.status === 'pending' && (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleOpenReview(app, 'approved')} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleOpenReview(app, 'rejected')} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Submit Request Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Approval Request">
        <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Workflow Type</label>
            <select 
              className="form-input" 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              style={{ background: 'var(--bg-base)' }}
            >
              <option value="leave">Leave Request</option>
              <option value="document">Document Authorization</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Manager Reviewer</label>
            <select 
              className="form-input" 
              value={managerId} 
              onChange={(e) => setManagerId(e.target.value)}
              style={{ background: 'var(--bg-base)' }}
            >
              {managersList.map(m => (
                <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
              ))}
            </select>
          </div>

          {type === 'leave' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input 
                  type="date" 
                  required 
                  className="form-input" 
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Days</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  className="form-input" 
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(e.target.value)} 
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Document Resource URL</label>
              <input 
                type="url" 
                required 
                className="form-input" 
                placeholder="https://drive.google.com/..." 
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)} 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Context Description / Reason</label>
            <textarea 
              required
              className="form-input" 
              placeholder="Provide background context for review..." 
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <button type="submit" className="btn btn-primary">Submit Workflow Request</button>
        </form>
      </Modal>

      {/* Review Dialog Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title={`Confirm Action: ${reviewAction.toUpperCase()}`}>
        {selectedApproval && (
          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <span>Reviewing request from <strong>{selectedApproval.requested_by?.full_name}</strong>.</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Reviewer Comments / Feedback</label>
              <textarea 
                required
                className="form-input" 
                placeholder="Add comments explaining decision parameters..." 
                rows={4} 
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
            
            <button 
              type="submit" 
              className={`btn ${reviewAction === 'approved' ? 'btn-primary' : 'btn-danger'}`}
            >
              Confirm {reviewAction}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
