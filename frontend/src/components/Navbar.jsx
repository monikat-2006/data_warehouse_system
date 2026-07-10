import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ extra }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">📦</span>
        <span>Smart Inventory</span>
      </div>
      <div className="navbar-right">
        {user && (
          <span className="navbar-welcome">
            Welcome, <strong>{user.username}</strong>
            <span className={`role-badge role-${user.role}`}>{user.role}</span>
          </span>
        )}
        {extra && <div className="navbar-extra">{extra}</div>}
        <button className="btn btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

