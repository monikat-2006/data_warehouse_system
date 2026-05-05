import { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  Activity,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function AdminHome() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    lowStock: 0,
    totalTransactions: 0,
    totalValue: 0,
    activeUsers: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch products
      const productsRes = await fetch('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const products = await productsRes.json();
      
      // Fetch users
      const usersRes = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const users = await usersRes.json();
      
      // Fetch transactions
      const transactionsRes = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transactions = await transactionsRes.json();
      
      // Calculate total inventory value
      const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
      const lowStockCount = products.filter(p => p.quantity <= p.reorder_level).length;
      
      setStats({
        totalProducts: products.length,
        totalUsers: users.length,
        lowStock: lowStockCount,
        totalTransactions: transactions.length,
        totalValue: totalValue,
        activeUsers: users.filter(u => u.role === 'staff').length
      });
      
      setRecentActivities(transactions.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts, icon: <Package size={24} />, color: '#667eea' },
    { title: 'Total Users', value: stats.totalUsers, icon: <Users size={24} />, color: '#48bb78' },
    { title: 'Low Stock Alerts', value: stats.lowStock, icon: <AlertCircle size={24} />, color: '#f56565' },
    { title: 'Total Transactions', value: stats.totalTransactions, icon: <Activity size={24} />, color: '#ed8936' },
    { title: 'Inventory Value', value: `$${stats.totalValue.toLocaleString()}`, icon: <DollarSign size={24} />, color: '#4299e1' },
    { title: 'Active Staff', value: stats.activeUsers, icon: <Users size={24} />, color: '#9f7aea' },
  ];

  const chartData = [
    { name: 'Products', value: stats.totalProducts },
    { name: 'Users', value: stats.totalUsers },
    { name: 'Low Stock', value: stats.lowStock },
    { name: 'Transactions', value: stats.totalTransactions }
  ];

  const COLORS = ['#667eea', '#48bb78', '#f56565', '#ed8936'];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-home">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back! Here's what's happening in your warehouse today.</p>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="admin-stat-card" style={{ borderTopColor: stat.color }}>
            <div className="admin-stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="admin-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <h3>System Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3>Recent Activities</h3>
          <div className="admin-activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="admin-activity-item">
                <div className={`admin-activity-icon ${activity.type}`}>
                  {activity.type === 'stock-in' ? <ShoppingCart size={14} /> : <Package size={14} />}
                </div>
                <div className="admin-activity-details">
                  <p className="admin-activity-title">{activity.product_name}</p>
                  <p className="admin-activity-desc">{activity.type} - Quantity: {activity.quantity}</p>
                  <small>{new Date(activity.timestamp).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;