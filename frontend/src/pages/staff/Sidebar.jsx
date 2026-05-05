import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  User, 
  LogOut,
  Warehouse,
  TrendingUp
} from 'lucide-react';

function Sidebar({ activeTab, setActiveTab, user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
    { id: 'transactions', label: 'Transactions', icon: <History size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Warehouse size={32} />
          <span>Dark Warehouse</span>
        </div>
        <div className="user-badge">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.name || 'Staff User'}</p>
            <p className="user-role">{user?.role || 'Staff'}</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;