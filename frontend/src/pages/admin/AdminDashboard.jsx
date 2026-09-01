import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminHome from './AdminHome';
import AdminInventory from './AdminInventory';
import AdminUsers from './AdminUsers';
import AdminAnalytics from './AdminAnalytics';
import AdminReports from './AdminReports';
import AdminActivity from './AdminActivity';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <AdminHome />;
      case 'inventory': return <AdminInventory />;
      case 'users': return <AdminUsers />;
      case 'analytics': return <AdminAnalytics />;
      case 'reports': return <AdminReports />;
      case 'activity': return <AdminActivity />;
      default: return <AdminHome />;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="dashboard-layout">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default AdminDashboard;