import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle } from 'lucide-react';

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    topProducts: [],
    branchPerformance: [],
    monthlyTrends: [],
    lowStockItems: [],
    totalValue: 0,
    averageStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all products
      const productsRes = await fetch('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const products = await productsRes.json();
      
      // Fetch all transactions
      const transactionsRes = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transactions = await transactionsRes.json();
      
      // Calculate analytics
      const topProducts = [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
      const lowStockItems = products.filter(p => p.quantity <= p.reorder_level);
      
      // Branch performance
      const branches = [...new Set(products.map(p => p.branch))];
      const branchPerformance = branches.map(branch => ({
        name: branch,
        products: products.filter(p => p.branch === branch).length,
        value: products.filter(p => p.branch === branch).reduce((sum, p) => sum + (p.quantity * p.unit_price), 0)
      }));
      
      const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
      const averageStock = products.reduce((sum, p) => sum + p.quantity, 0) / products.length;
      
      setAnalytics({
        topProducts,
        branchPerformance,
        monthlyTrends: [
          { month: 'Jan', sales: 4500, stock: 12000 },
          { month: 'Feb', sales: 5200, stock: 11800 },
          { month: 'Mar', sales: 6100, stock: 11500 },
          { month: 'Apr', sales: 5800, stock: 11300 },
          { month: 'May', sales: 5900, stock: 11100 },
          { month: 'Jun', sales: 6300, stock: 10900 }
        ],
        lowStockItems,
        totalValue,
        averageStock
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#667eea', '#48bb78', '#f56565', '#ed8936', '#4299e1'];

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="admin-analytics">
      <h2>Advanced Analytics</h2>
      
      <div className="analytics-summary">
        <div className="analytics-card">
          <DollarSign size={24} color="#48bb78" />
          <div>
            <h3>${analytics.totalValue.toLocaleString()}</h3>
            <p>Total Inventory Value</p>
          </div>
        </div>
        <div className="analytics-card">
          <Package size={24} color="#667eea" />
          <div>
            <h3>{analytics.averageStock.toFixed(0)}</h3>
            <p>Average Stock Level</p>
          </div>
        </div>
        <div className="analytics-card">
          <AlertTriangle size={24} color="#f56565" />
          <div>
            <h3>{analytics.lowStockItems.length}</h3>
            <p>Low Stock Items</p>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="analytics-chart">
          <h3>Top 5 Products by Stock</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-chart">
          <h3>Branch Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.branchPerformance}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.branchPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-chart">
        <h3>Monthly Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#667eea" name="Sales ($)" />
            <Line type="monotone" dataKey="stock" stroke="#48bb78" name="Stock Value ($)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="low-stock-alerts">
        <h3>⚠️ Low Stock Alerts</h3>
        <div className="alerts-list">
          {analytics.lowStockItems.map(item => (
            <div key={item.id} className="alert-item">
              <span className="alert-product">{item.name}</span>
              <span className="alert-quantity">Current: {item.quantity}</span>
              <span className="alert-reorder">Reorder at: {item.reorder_level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;