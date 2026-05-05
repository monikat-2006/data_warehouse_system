import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import Inventory from './Inventory';
import Profile from './Profile';
import Transactions from './Transactions';
import './StaffDashboard.css';

function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return <DashboardHome />;
      case 'inventory':
        return <Inventory />;
      case 'transactions':
        return <Transactions />;
      case 'profile':
        return <Profile user={user} onUserUpdate={handleUserUpdate} />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="staff-dashboard">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <div className="main-content">
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;