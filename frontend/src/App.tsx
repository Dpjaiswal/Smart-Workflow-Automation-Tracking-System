import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { Approvals } from './pages/Approvals';
import { WorkLogs } from './pages/WorkLogs';
import { Tickets } from './pages/Tickets';
import { AuditLogs } from './pages/AuditLogs';
import { Reports } from './pages/Reports';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#0a0b10', 
        color: 'white' 
      }}>
        <h3>SWATS Operational Terminal Initializing...</h3>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'projects': return <Projects />;
      case 'tasks': return <Tasks />;
      case 'approvals': return <Approvals />;
      case 'worklogs': return <WorkLogs />;
      case 'tickets': return <Tickets />;
      case 'auditlogs': return <AuditLogs />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-wrapper">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar activeTab={activeTab} />
        <div className="animate-slide-in">
          {renderActivePage()}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
