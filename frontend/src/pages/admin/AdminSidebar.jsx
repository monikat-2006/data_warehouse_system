import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  BarChart3, 
  FileText,
  LogOut,
  Warehouse,
  Settings,
  Bell
} from 'lucide-react';

function AdminSidebar({ activeTab, setActiveTab, user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: 'All Inventory', icon: <Package size={20} /> },
    { id: 'users', label: 'User Management', icon: <Users size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'activity', label: 'Activity Log', icon: <Activity size={20} /> },
  ];

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-logo">
          <Warehouse size={32} />
          <span>Admin Portal</span>
        </div>
        <div className="admin-user-badge">
          <div className="admin-user-avatar">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="admin-user-info">
            <p className="admin-user-name">{user?.name || 'Admin'}</p>
            <p className="admin-user-role">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;