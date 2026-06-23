import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Briefcase, User, HelpCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: string, mail: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(mail, pass);
    } catch (err: any) {
      setError(err.message || `Failed to log in as ${role}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(6, 118, 212, 0.15) 0%, transparent 40%), var(--bg-base)',
      padding: '16px'
    }}>
      <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '24px',
            color: 'white',
            marginBottom: '16px'
          }}>
            S
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>SWATS Portal</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Workflow Automation & Performance Tracking
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase', 
            display: 'block', 
            textAlign: 'center', 
            marginBottom: '12px' 
          }}>
            Quick Preset Logins
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => handleQuickLogin('Admin', 'admin@swats.com', 'admin123')}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px', justifyContent: 'flex-start', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <Shield size={14} style={{ color: 'var(--danger)' }} />
              <span>Admin</span>
            </button>
            <button
              onClick={() => handleQuickLogin('Manager', 'manager@swats.com', 'manager123')}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px', justifyContent: 'flex-start', border: '1px solid rgba(245, 158, 11, 0.2)' }}
            >
              <Briefcase size={14} style={{ color: 'var(--warning)' }} />
              <span>Manager</span>
            </button>
            <button
              onClick={() => handleQuickLogin('Employee', 'employee@swats.com', 'employee123')}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px', justifyContent: 'flex-start', border: '1px solid rgba(59, 130, 246, 0.2)' }}
            >
              <User size={14} style={{ color: 'var(--info)' }} />
              <span>Employee</span>
            </button>
            <button
              onClick={() => handleQuickLogin('Client', 'client@swats.com', 'client123')}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px', justifyContent: 'flex-start', border: '1px solid rgba(16, 185, 129, 0.2)' }}
            >
              <HelpCircle size={14} style={{ color: 'var(--success)' }} />
              <span>Client</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
