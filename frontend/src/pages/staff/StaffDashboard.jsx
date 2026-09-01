import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import Inventory from './Inventory';
import Profile from './Profile';
import Transactions from './Transactions';
import StockIn from './StockIn';
import StockOut from './StockOut';

function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'staff')) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <DashboardHome />;
      case 'inventory': return <Inventory />;
      case 'stock-in': return <StockIn />;
      case 'stock-out': return <StockOut />;
      case 'transactions': return <Transactions />;
      case 'profile': return <Profile user={user} />;
      default: return <DashboardHome />;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
      </div>
    );
  }

  if (!user || user.role !== 'staff') return null;

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default StaffDashboard;