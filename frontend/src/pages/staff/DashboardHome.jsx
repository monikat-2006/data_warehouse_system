import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reportsAPI, activityAPI } from '../../services/api';

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

export default function DashboardHome() {
  const [stats, setStats] = useState({ total_products: 0, low_stock: 0, total_units: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, activityRes, chartRes] = await Promise.allSettled([
        reportsAPI.stockSummary(),
        activityAPI.getMyActivities(), // Assuming backend handles this or we filter
        reportsAPI.transactionsByType(7)
      ]);
      
      if (summaryRes.status === 'fulfilled') setStats(summaryRes.value.data);
      if (activityRes.status === 'fulfilled') setRecentActivities(activityRes.value.data.activities || []);
      if (chartRes.status === 'fulfilled') setChartData(chartRes.value.data.chart_data || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Staff Dashboard</h1>
          <p>Welcome back! Here's your overview for today.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.total_products}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.low_stock || 0}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.total_units}</div>
            <div className="stat-label">Total Units in Stock</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: 20 }}>Warehouse Movement (Last 7 Days)</div>
          {chartData.length > 0 ? (
             <ResponsiveContainer width="100%" height={280}>
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#43e97b" stopOpacity={0.2} />
                     <stop offset="95%" stopColor="#43e97b" stopOpacity={0} />
                   </linearGradient>
                   <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ff4757" stopOpacity={0.2} />
                     <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                 <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                 <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                 <Tooltip content={<CustomTooltip />} />
                 <Area type="monotone" dataKey="stock_in" name="Stock In" stroke="#43e97b" fill="url(#colorIn)" strokeWidth={2} />
                 <Area type="monotone" dataKey="stock_out" name="Stock Out" stroke="#ff4757" fill="url(#colorOut)" strokeWidth={2} />
               </AreaChart>
             </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <TrendingUp size={40} style={{ color: 'var(--text-muted)' }} />
              <p>No transaction data yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">My Recent Activity</span>
          </div>
          {recentActivities.length > 0 ? (
            <div className="activity-list">
              {recentActivities.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot ${a.action?.includes('stock_in') ? 'in' : a.action?.includes('stock_out') ? 'out' : 'default'}`}>
                    {a.action?.includes('stock_in') ? <TrendingUp size={14} /> : <Package size={14} />}
                  </div>
                  <div className="activity-info">
                    <div className="activity-title">{a.description || a.action}</div>
                  </div>
                  <div className="activity-time">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
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
      </div>
    </div>
  );
}