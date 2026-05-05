import { useState, useEffect } from 'react';
import { Activity, User, Package, LogIn, UserPlus, TrendingUp, Calendar, Filter } from 'lucide-react';

function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/admin/activities?limit=200';
      if (filter !== 'all') {
        url += `&action_type=${filter}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/activity-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'login': return <LogIn size={16} />;
      case 'register': return <UserPlus size={16} />;
      case 'stock_in': return <Package size={16} />;
      case 'stock_out': return <Package size={16} />;
      case 'product_add': return <Package size={16} />;
      case 'product_edit': return <Package size={16} />;
      case 'product_delete': return <Package size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'login': return '#48bb78';
      case 'register': return '#4299e1';
      case 'stock_in': return '#38a169';
      case 'stock_out': return '#ed8936';
      case 'product_add': return '#667eea';
      case 'product_edit': return '#9f7aea';
      case 'product_delete': return '#f56565';
      default: return '#718096';
    }
  };

  const getActivityBadge = (type) => {
    const badges = {
      login: 'Login',
      register: 'New Registration',
      stock_in: 'Stock In',
      stock_out: 'Stock Out',
      product_add: 'Product Added',
      product_edit: 'Product Edited',
      product_delete: 'Product Deleted'
    };
    return badges[type] || type;
  };

  if (loading) return <div className="loading">Loading activity logs...</div>;

  return (
    <div className="admin-activity">
      <div className="activity-header">
        <h2>📋 User Activity Tracking</h2>
        <p>Real-time monitoring of all user actions across the system</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="activity-stats">
          <div className="stat-card">
            <LogIn size={24} color="#48bb78" />
            <div>
              <h3>{stats.total_logins}</h3>
              <p>Total Logins</p>
            </div>
          </div>
          <div className="stat-card">
            <UserPlus size={24} color="#4299e1" />
            <div>
              <h3>{stats.total_registrations}</h3>
              <p>New Registrations</p>
            </div>
          </div>
          <div className="stat-card">
            <Package size={24} color="#667eea" />
            <div>
              <h3>{stats.total_product_adds}</h3>
              <p>Products Added</p>
            </div>
          </div>
          <div className="stat-card">
            <Activity size={24} color="#ed8936" />
            <div>
              <h3>{stats.total_stock_ins + stats.total_stock_outs}</h3>
              <p>Stock Operations</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="activity-filters">
        <div className="filter-group">
          <Filter size={16} />
          <select value={filter} onChange={(e) => { setFilter(e.target.value); fetchActivities(); }}>
            <option value="all">All Activities</option>
            <option value="login">Logins</option>
            <option value="register">Registrations</option>
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="product_add">Product Added</option>
            <option value="product_edit">Product Edited</option>
            <option value="product_delete">Product Deleted</option>
          </select>
        </div>
        <button className="refresh-btn" onClick={() => { fetchActivities(); fetchStats(); }}>
          Refresh
        </button>
      </div>

      {/* Activity List */}
      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="no-activities">
            <Activity size={48} />
            <p>No activities found</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon" style={{ background: `${getActivityColor(activity.action_type)}20`, color: getActivityColor(activity.action_type) }}>
                {getActivityIcon(activity.action_type)}
              </div>
              <div className="activity-content">
                <div className="activity-header-row">
                  <span className="activity-user">{activity.user_name}</span>
                  <span className={`activity-badge ${activity.action_type}`}>
                    {getActivityBadge(activity.action_type)}
                  </span>
                </div>
                <div className="activity-details">
                  <p className="activity-description">{activity.action_details}</p>
                  <div className="activity-meta">
                    <span className="activity-email">{activity.user_email}</span>
                    <span className="activity-role">{activity.user_role}</span>
                    <span className="activity-time">
                      <Calendar size={12} />
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Activity Summary */}
      {stats && stats.user_activity && stats.user_activity.length > 0 && (
        <div className="user-activity-summary">
          <h3>User Activity Summary</h3>
          <div className="user-activity-grid">
            {stats.user_activity.map((user, idx) => (
              <div key={idx} className="user-activity-card">
                <div className="user-avatar">{user.user.charAt(0)}</div>
                <div className="user-stats">
                  <p className="user-name">{user.user}</p>
                  <p className="activity-count">{user.count} activities</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminActivity;