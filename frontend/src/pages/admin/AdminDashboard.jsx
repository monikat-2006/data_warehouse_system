import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHome from './AdminHome';
import AdminInventory from './AdminInventory';
import AdminUsers from './AdminUsers';
import AdminAnalytics from './AdminAnalytics';
import AdminReports from './AdminReports';
import './AdminDashboard.css';
import AdminActivity from './AdminActivity';
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return <AdminHome />;
      case 'inventory':
        return <AdminInventory />;
      case 'users':
        return <AdminUsers />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'reports':
        return <AdminReports />;
      case 'activity':
         return <AdminActivity />;
      default:
        return <AdminHome />;
    }
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <div className="admin-main-content">
        <div className="admin-content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;