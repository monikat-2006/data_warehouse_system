import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Package, LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, User, LogOut, ShoppingBag, ClipboardList } from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'inventory', label: 'Products', icon: <Package size={18} /> },
  { id: 'stock-in', label: 'Stock In', icon: <ArrowDownToLine size={18} /> },
  { id: 'stock-out', label: 'Stock Out', icon: <ArrowUpFromLine size={18} /> },
  { id: 'transactions', label: 'My Transactions', icon: <ClipboardList size={18} /> },
  { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
];

export default function Sidebar({ activeTab, setActiveTab, user }) {
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
          <div className="sidebar-logo-sub">Staff Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
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
          {user?.username?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-username">{user?.username || 'Staff'}</div>
          <div className="sidebar-role">Staff Member</div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}