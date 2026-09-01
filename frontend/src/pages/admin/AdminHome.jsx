import { useState, useEffect } from 'react';
import { Package, Users, TrendingUp, AlertCircle, DollarSign, Activity, RefreshCw, Plus, X } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardAPI, reportsAPI, activityAPI, productsAPI } from '../../services/api';

const COLORS = ['#6c63ff', '#4facfe', '#43e97b', '#fa8231', '#ff4757', '#a29bfe'];
const CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Clothing', 'Food', 'Tools', 'Sports', 'Other'];
const EMPTY_FORM = { name: '', sku: '', category: 'Electronics', price: '', initial_stock: '', reorder_level: '10' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminHome() {
  const [stats, setStats] = useState({ total_products: 0, total_value: 0, low_stock: 0, total_transactions: 0, total_staff: 0 });
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Add Product State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, txnRes, lowRes, actRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        reportsAPI.transactionsByType(30),
        reportsAPI.lowStock(),
        activityAPI.getLog({ limit: 8 }),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (txnRes.status === 'fulfilled') setChartData(txnRes.value.data.chart_data || []);
      if (lowRes.status === 'fulfilled') setCategoryData(lowRes.value.data.category_distribution || []);
      if (actRes.status === 'fulfilled') setRecentActivity(actRes.value.data.activities || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name.trim(), sku: form.sku.trim(), category: form.category,
        price: parseFloat(form.price), reorder_level: parseInt(form.reorder_level) || 10,
        initial_stock: parseInt(form.initial_stock) || 0
      };
      await productsAPI.create(payload);
      setSuccess('Product added successfully!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      await fetchAll(); // Refresh dashboard stats immediately
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally { setSaving(false); }
  };

  const statCards = [
    { title: 'Total Products', value: stats.total_products, icon: <Package size={22} />, cls: 'purple' },
    { title: 'Inventory Value', value: `$${(stats.total_value || 0).toLocaleString()}`, icon: <DollarSign size={22} />, cls: 'green' },
    { title: 'Low Stock Alerts', value: stats.low_stock, icon: <AlertCircle size={22} />, cls: 'red' },
    { title: 'Total Transactions', value: stats.total_transactions, icon: <Activity size={22} />, cls: 'blue' },
    { title: 'Active Staff', value: stats.total_staff, icon: <Users size={22} />, cls: 'orange' },
    { title: 'Stock Movement', value: chartData.reduce((s, d) => s + (d.stock_in || 0) + (d.stock_out || 0), 0), icon: <TrendingUp size={22} />, cls: 'cyan' },
  ];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's your warehouse overview for today.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Quick Add Product
          </button>
        </div>
      </div>
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: 20 }}>Stock Movement (Last 30 Days)</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="stock_in" name="Stock In" stroke="#43e97b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stock_out" name="Stock Out" stroke="#ff4757" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <TrendingUp size={40} style={{ color: 'var(--text-muted)' }} />
              <p>No transaction data yet</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: 20 }}>Stock by Category</div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="stock"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <Package size={40} style={{ color: 'var(--text-muted)' }} />
              <p>No category data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
        </div>
        {recentActivity.length > 0 ? (
          <div className="activity-list">
            {recentActivity.map((a, i) => (
              <div key={i} className="activity-item">
                <div className={`activity-dot ${a.action?.includes('stock_in') ? 'in' : a.action?.includes('stock_out') ? 'out' : 'default'}`}>
                  {a.action?.includes('stock_in') ? <TrendingUp size={14} /> : <Package size={14} />}
                </div>
                <div className="activity-info">
                  <div className="activity-title">{a.description || a.action}</div>
                  <div className="activity-desc">by {a.username || 'System'}</div>
                </div>
                <div className="activity-time">
                  {a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <p>No recent activity</p>
          </div>
        )}
      </div>

      {/* Quick Add Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Quick Add Product</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveProduct}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Laptop Pro 15" />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="LP-001" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input type="number" value={form.initial_stock} onChange={e => setForm({ ...form, initial_stock: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Reorder Level</label>
                  <input type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} placeholder="10" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Saving...</> : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}