import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  Briefcase, 
  CheckSquare, 
  Clock, 
  LifeBuoy, 
  FileCheck, 
  TrendingUp,
  Plus
} from 'lucide-react';

interface DashboardStats {
  project_metrics: { total: number; active: number; completed: number };
  task_metrics: { total: number; todo: number; in_progress: number; in_review: number; completed: number };
  employee_productivity: Record<string, number>;
  total_hours_logged: number;
  ticket_metrics: { open: number; resolved: number; in_progress: number; closed: number };
  pending_approvals: number;
  employee_personal?: { my_tasks: number; my_completed_tasks: number; my_hours_logged: number; my_pending_approvals: number };
  client_personal?: { my_tickets: number; my_resolved_tickets: number; my_open_tickets: number };
}

export const Dashboard: React.FC = () => {
  const { user, getAuthHeaders, isAdmin, isManager, isEmployee, isClient } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Client quick ticket states
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Employee quick log hours states
  const [logHours, setLogHours] = useState('');
  const [logDesc, setLogDesc] = useState('');
  const [logProjectId, setLogProjectId] = useState('');
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [logSuccess, setLogSuccess] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/dashboard-summary`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data);
        if (data.length > 0) setLogProjectId(data[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentLogs = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/api/audit-logs`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRecentLogs(data.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentLogs();
    if (isEmployee) fetchProjects();
  }, [user]);

  const handleQuickTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: ticketTitle,
          description: ticketDesc,
          priority: 'medium'
        })
      });
      if (res.ok) {
        setTicketTitle('');
        setTicketDesc('');
        setTicketSuccess(true);
        fetchStats();
        setTimeout(() => setTicketSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/worklogs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          project_id: parseInt(logProjectId),
          hours_logged: parseFloat(logHours),
          description: logDesc,
          date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        setLogHours('');
        setLogDesc('');
        setLogSuccess(true);
        fetchStats();
        setTimeout(() => setLogSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  if (!stats) return null;

  // Custom SVG Bar Chart details
  const prodKeys = Object.keys(stats.employee_productivity || {});
  const prodValues = Object.values(stats.employee_productivity || {});
  const maxHours = Math.max(...prodValues, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{ 
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Welcome Back, {user?.full_name}!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
              Your workspace is synced. Here is an overview of {user?.role === 'client' ? 'your projects and tickets' : 'team productivity and approvals'}.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Local Time: {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Highlights metrics cards */}
      <div className="metrics-grid">
        {/* Core items based on roles */}
        {(isAdmin || isManager) && (
          <>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
                <Briefcase size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Active Projects</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.project_metrics.active} / {stats.project_metrics.total}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)' }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Task Completion</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.task_metrics.completed} / {stats.task_metrics.total}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              border: stats.pending_approvals > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)'
            }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                <FileCheck size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Pending Approvals</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.pending_approvals}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <Clock size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Total Hours Logged</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.total_hours_logged} hrs</h3>
              </div>
            </div>
          </>
        )}

        {isEmployee && stats.employee_personal && (
          <>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>My Assigned Tasks</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.employee_personal.my_tasks}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Tasks Completed</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.employee_personal.my_completed_tasks}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)' }}>
                <Clock size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>My Hours Logged</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.employee_personal.my_hours_logged} hrs</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                <FileCheck size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>My Pending Requests</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.employee_personal.my_pending_approvals}</h3>
              </div>
            </div>
          </>
        )}

        {isClient && stats.client_personal && (
          <>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
                <LifeBuoy size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Total Submitted Tickets</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.client_personal.my_tickets}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                <LifeBuoy size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Open Tickets</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.client_personal.my_open_tickets}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <LifeBuoy size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Resolved Tickets</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>{stats.client_personal.my_resolved_tickets}</h3>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Grid: Charts & Workflows */}
      <div className="chart-card-grid">
        
        {/* Left Side: SVG Charts for Admin/Manager, Work logs widget for employee, Tickets for client */}
        {(isAdmin || isManager) ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Team Productivity Analytics</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '12px', fontWeight: '600' }}>
                <TrendingUp size={14} />
                <span>Hours Logged</span>
              </div>
            </div>
            
            {prodKeys.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No work logged yet.</p>
            ) : (
              <div style={{ width: '100%', overflowX: 'auto', paddingTop: '10px' }}>
                <svg viewBox="0 0 500 240" width="100%" height="240" style={{ minWidth: '400px' }}>
                  {/* Grid Lines */}
                  <line x1="50" y1="40" x2="480" y2="40" stroke="var(--border-color)" strokeDasharray="4 4" />
                  <line x1="50" y1="90" x2="480" y2="90" stroke="var(--border-color)" strokeDasharray="4 4" />
                  <line x1="50" y1="140" x2="480" y2="140" stroke="var(--border-color)" strokeDasharray="4 4" />
                  <line x1="50" y1="190" x2="480" y2="190" stroke="var(--border-color)" />
                  
                  {/* Y Axis Labels */}
                  <text x="35" y="45" fill="var(--text-muted)" fontSize="10" textAnchor="end">{Math.round(maxHours)}h</text>
                  <text x="35" y="95" fill="var(--text-muted)" fontSize="10" textAnchor="end">{Math.round(maxHours * 0.6)}h</text>
                  <text x="35" y="145" fill="var(--text-muted)" fontSize="10" textAnchor="end">{Math.round(maxHours * 0.3)}h</text>
                  <text x="35" y="195" fill="var(--text-muted)" fontSize="10" textAnchor="end">0h</text>

                  {/* Bars */}
                  {prodKeys.map((name, idx) => {
                    const value = stats.employee_productivity[name];
                    const height = (value / maxHours) * 150;
                    const x = 70 + idx * 110;
                    const y = 190 - height;
                    return (
                      <g key={name}>
                        {/* Shadow Bar */}
                        <rect x={x} y="40" width="36" height="150" fill="rgba(255, 255, 255, 0.01)" rx="4" />
                        {/* Actual Bar */}
                        <rect 
                          x={x} 
                          y={y} 
                          width="36" 
                          height={height} 
                          rx="4" 
                          fill="url(#barGradient)" 
                        />
                        <text x={x + 18} y={y - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700">{value}h</text>
                        <text x={x + 18} y="210" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="500">{name}</text>
                      </g>
                    );
                  })}
                  
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--secondary)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
          </div>
        ) : isEmployee ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Submit Operational Work Log</h3>
            {logSuccess && (
              <div style={{ color: 'var(--success)', background: 'var(--success-bg)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                Hours logged successfully!
              </div>
            )}
            <form onSubmit={handleQuickLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Project Alignment</label>
                <select 
                  className="form-input" 
                  value={logProjectId} 
                  onChange={(e) => setLogProjectId(e.target.value)}
                  style={{ background: 'var(--bg-base)' }}
                >
                  {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hours Spent</label>
                <input 
                  type="number" 
                  step="0.5"
                  required 
                  className="form-input" 
                  placeholder="e.g. 4.5"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description of Activity</label>
                <textarea 
                  required 
                  className="form-input" 
                  placeholder="What did you work on?" 
                  rows={3}
                  value={logDesc}
                  onChange={(e) => setLogDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Plus size={16} />
                <span>Log Hours</span>
              </button>
            </form>
          </div>
        ) : (
          /* Client quick submit support ticket */
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Submit Support/Request Ticket</h3>
            {ticketSuccess && (
              <div style={{ color: 'var(--success)', background: 'var(--success-bg)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                Support ticket submitted successfully!
              </div>
            )}
            <form onSubmit={handleQuickTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ticket Title</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="Brief summary of request"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Detailed Description</label>
                <textarea 
                  required 
                  className="form-input" 
                  placeholder="Steps to reproduce, or details of document/leave approval requested..." 
                  rows={4}
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Plus size={16} />
                <span>Submit Ticket</span>
              </button>
            </form>
          </div>
        )}

        {/* Right Side: Task Metrics / Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Task Status Overview */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Task Status Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Completed Tasks</span>
                  <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                    {stats.task_metrics.completed} / {stats.task_metrics.total}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${stats.task_metrics.total ? (stats.task_metrics.completed / stats.task_metrics.total) * 100 : 0}%`, 
                    height: '100%', 
                    background: 'var(--success)' 
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>In Review Tasks</span>
                  <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                    {stats.task_metrics.in_review} / {stats.task_metrics.total}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${stats.task_metrics.total ? (stats.task_metrics.in_review / stats.task_metrics.total) * 100 : 0}%`, 
                    height: '100%', 
                    background: 'var(--primary)' 
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>In Progress Tasks</span>
                  <span style={{ fontWeight: '600', color: 'var(--secondary)' }}>
                    {stats.task_metrics.in_progress} / {stats.task_metrics.total}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${stats.task_metrics.total ? (stats.task_metrics.in_progress / stats.task_metrics.total) * 100 : 0}%`, 
                    height: '100%', 
                    background: 'var(--secondary)' 
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Audit trail / Activity logs for Admin, or help desk description for others */}
          {isAdmin ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Recent Audit Trail</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>{log.action}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(6, 182, 212, 0.03)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary)' }}>Support Hotline</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Need help or custom workflows configured? Reach out directly to your assigned manager or open a support ticket to catalog document and leave workflows.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Apana Time Tech Solutions SWATS Portal 1.0.0
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
