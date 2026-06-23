import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Sun, Moon, Check } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab }) => {
  const { user, getAuthHeaders } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Operational Insights';
      case 'projects': return 'Projects Dashboard';
      case 'tasks': return 'Task Kanban Workspace';
      case 'approvals': return 'Approvals & Workflows';
      case 'worklogs': return 'Employee Productivity Logs';
      case 'tickets': return 'Client Support Portal';
      case 'auditlogs': return 'System Activity Audit';
      case 'reports': return 'Reports & Data Sheets';
      default: return 'SWATS Dashboard';
    }
  };

  return (
    <div className="navbar-container">
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
        {getPageTitle(activeTab)}
      </h2>
      
      <div className="navbar-actions">
        <button onClick={toggleTheme} className="icon-btn" title="Toggle Light/Dark Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)} 
            className="icon-btn" 
            style={{ position: 'relative' }}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '9px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No alerts currently.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`notif-item ${!notif.is_read ? 'notif-unread' : ''}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {notif.title}
                        </span>
                        {!notif.is_read && <Check size={12} style={{ color: 'var(--primary)' }} />}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
