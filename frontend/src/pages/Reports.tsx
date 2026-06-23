import React from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Download, Briefcase, Clock } from 'lucide-react';

export const Reports: React.FC = () => {
  const { getAuthHeaders, isAdmin, isManager } = useAuth();

  const handleDownload = async (endpoint: string, filename: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/export/${endpoint}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download report:', e);
    }
  };

  if (!isAdmin && !isManager) {
    return (
      <div style={{ padding: '24px', color: 'var(--danger)', fontWeight: 'bold' }}>
        Access Denied. Managers and Admins Only.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Operational Reports Workspace</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Download CSV datasets and analyze company performance logs.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Tasks Report */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
              <Briefcase size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Tasks & Projects Database</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>File Format: CSV Spreadsheet</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: '1.5' }}>
            Generates a spreadsheet containing every task registered, including creation timestamps, project alignment, priority levels, assigned employees, and final completion status.
          </p>
          <button 
            onClick={() => handleDownload('tasks', 'tasks_report.csv')} 
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
          >
            <Download size={14} />
            <span>Download CSV Sheet</span>
          </button>
        </div>

        {/* Card 2: Work Logs Report */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <Clock size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Work Productivity Logs</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>File Format: CSV Spreadsheet</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: '1.5' }}>
            Export detailed daily activity lists. Shows hours logged by each developer, project/task mappings, exact work description comments, and submission timestamps.
          </p>
          <button 
            onClick={() => handleDownload('worklogs', 'worklogs_report.csv')} 
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
          >
            <Download size={14} />
            <span>Download CSV Sheet</span>
          </button>
        </div>
      </div>
      
      {/* Policy banner */}
      <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.01)', borderStyle: 'dashed' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>Regulatory compliance data policy</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          These logs represent sensitive employee workflow metrics and client inputs. Exported files are audit-locked and cataloged in the system activity feed. Please handle reports under standard NDAs and privacy agreements.
        </p>
      </div>
    </div>
  );
};
