import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function DashboardHome() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalTransactions: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

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
      
      // Fetch transactions
      const transactionsRes = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transactions = await transactionsRes.json();
      
      const lowStockCount = products.filter(p => p.quantity <= p.reorder_level).length;
      
      setStats({
        totalProducts: products.length,
        lowStock: lowStockCount,
        totalTransactions: transactions.length,
        recentActivities: transactions.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Products', value: stats.totalProducts },
    { name: 'Low Stock', value: stats.lowStock },
    { name: 'Transactions', value: stats.totalTransactions }
  ];

  const COLORS = ['#667eea', '#f56565', '#48bb78'];

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-home">
      <div className="dashboard-header">
        <h1>Welcome Back!</h1>
        <p>Here's what's happening with your warehouse today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.lowStock}</h3>
            <p>Low Stock Items</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalTransactions}</h3>
            <p>Total Transactions</p>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Overview</h3>
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

        <div className="chart-card">
          <h3>Recent Activities</h3>
          <div className="activity-list">
            {stats.recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <CheckCircle size={16} className="activity-icon" />
                <div className="activity-details">
                  <p className="activity-title">{activity.type}</p>
                  <p className="activity-desc">
                    {activity.product_name} - Quantity: {activity.quantity}
                  </p>
                  <small>{new Date(activity.timestamp).toLocaleString()}</small>
                </div>
              </div>
            ))}
            {stats.recentActivities.length === 0 && (
              <p>No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;