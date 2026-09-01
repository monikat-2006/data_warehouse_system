import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Package, LayoutDashboard, Users, BarChart3,
  FileText, Activity, LogOut, ShoppingBag, Bell
} from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'inventory', label: 'Inventory', icon: <Package size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
  { id: 'users', label: 'Staff Users', icon: <Users size={18} /> },
  { id: 'activity', label: 'Activity Log', icon: <Activity size={18} /> },
];

export default function AdminSidebar({ activeTab, setActiveTab, user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShoppingBag size={20} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">WarehouseIQ</div>
          <div className="sidebar-logo-sub">Admin Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.username?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-username">{user?.username || 'Admin'}</div>
          <div className="sidebar-role">Administrator</div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}