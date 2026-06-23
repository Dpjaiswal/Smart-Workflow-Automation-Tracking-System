import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Search, Calendar } from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
  user?: { full_name: string; email: string };
}

export const AuditLogs: React.FC = () => {
  const { user, getAuthHeaders, isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/audit-logs`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  if (!isAdmin) {
    return (
      <div style={{ padding: '24px', color: 'var(--danger)', fontWeight: 'bold' }}>
        Access Denied. Admins Only.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading security audit trails...</p>
      </div>
    );
  }

  const filteredLogs = logs.filter(
    l => 
      l.action.toLowerCase().includes(search.toLowerCase()) || 
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      (l.user?.full_name && l.user.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.user?.email && l.user.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>System Audit Trail</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Un-alterable chronicle of developer activity and status transitions.</p>
      </div>

      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Filter logs by Action, Employee Name, Email, or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ width: '100%', background: 'transparent', border: 'none', boxShadow: 'none', padding: '4px' }}
        />
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '16px' }}>Timestamp</th>
              <th style={{ padding: '16px' }}>Employee</th>
              <th style={{ padding: '16px' }}>Action Trigger</th>
              <th style={{ padding: '16px' }}>Log Detail Summary</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No matches in audit records.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {log.user ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500' }}>{log.user.full_name}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{log.user.email}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>SYSTEM AUTO</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className="role-badge role-admin" style={{ fontSize: '10px', fontWeight: 'bold' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
