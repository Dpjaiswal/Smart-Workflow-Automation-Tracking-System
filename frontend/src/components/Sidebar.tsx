import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  FileCheck, 
  Clock, 
  LifeBuoy, 
  Activity, 
  FileText, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAdmin, isManager, isEmployee } = useAuth();

  if (!user) return null;

  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'projects', label: 'Projects', icon: Briefcase, show: true },
    { id: 'tasks', label: 'Tasks & Kanban', icon: CheckSquare, show: true },
    { id: 'approvals', label: 'Approvals Workflow', icon: FileCheck, show: isEmployee || isManager || isAdmin },
    { id: 'worklogs', label: 'Employee Work Logs', icon: Clock, show: isEmployee || isManager || isAdmin },
    { id: 'tickets', label: 'Client Support Portal', icon: LifeBuoy, show: true },
    { id: 'auditlogs', label: 'System Audit Trail', icon: Activity, show: isAdmin },
    { id: 'reports', label: 'Reports & Export', icon: FileText, show: isManager || isAdmin },
  ];

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontWeight: 'bold', 
          color: 'white' 
        }}>S</div>
        <span className="sidebar-brand">SWATS Hub</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => {
          if (!link.show) return null;
          const Icon = link.icon;
          return (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(link.id);
              }}
              className={`sidebar-link ${activeTab === link.id ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.full_name}</span>
          <span className={`role-badge role-${user.role}`} style={{ alignSelf: 'flex-start', margin: '4px 0' }}>{user.role}</span>
        </div>
        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
