import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { reportsAPI } from '../../services/api';
import { TrendingUp, Package, RefreshCw, BarChart3 } from 'lucide-react';

const COLORS = ['#6c63ff', '#4facfe', '#43e97b', '#fa8231', '#ff4757', '#a29bfe', '#ffd32a'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminAnalytics() {
  const [txnData, setTxnData] = useState({ chart_data: [], distribution: {} });
  const [productData, setProductData] = useState({ products: [], top_stock: [] });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [staffMetrics, setStaffMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [txnRes, prodRes, monthRes, lowRes, staffRes] = await Promise.allSettled([
        reportsAPI.transactionsByType(days),
        reportsAPI.transactionsByProduct(days),
        reportsAPI.monthlyTrends(90),
        reportsAPI.lowStock(),
        reportsAPI.staffMetrics(),
      ]);
      if (txnRes.status === 'fulfilled') setTxnData(txnRes.value.data);
      if (prodRes.status === 'fulfilled') setProductData(prodRes.value.data);
      if (monthRes.status === 'fulfilled') setMonthlyData(monthRes.value.data.monthly_data || []);
      if (lowRes.status === 'fulfilled') setCategoryData(lowRes.value.data.category_distribution || []);
      if (staffRes.status === 'fulfilled') setStaffMetrics(staffRes.value.data.staff_metrics || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [days]);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading analytics...</span></div>;

  const { distribution } = txnData;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Analytics</h1>
          <p>Deep insights into warehouse performance</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="filter-select" value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Distribution Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={22} /></div>
          <div>
            <div className="stat-value">{distribution?.in || 0}</div>
            <div className="stat-label">Total Stock In</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Package size={22} /></div>
          <div>
            <div className="stat-value">{distribution?.out || 0}</div>
            <div className="stat-label">Total Stock Out</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><BarChart3 size={22} /></div>
          <div>
            <div className="stat-value">{(distribution?.in || 0) + (distribution?.out || 0)}</div>
            <div className="stat-label">Total Movements</div>
          </div>
        </div>
      </div>

      {/* Daily Transactions */}
      <div className="charts-grid">
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-title" style={{ marginBottom: 20 }}>Daily Stock Movement (Last {days} Days)</div>
          {txnData.chart_data?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={txnData.chart_data}>
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="stock_in" name="Stock In" stroke="#43e97b" fill="url(#colorIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="stock_out" name="Stock Out" stroke="#ff4757" fill="url(#colorOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}><p>No transaction data for this period</p></div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: 20 }}>Stock by Category</div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} dataKey="stock" nameKey="category" cx="50%" cy="50%" outerRadius={85}
                  label={({ category, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No data</p></div>}
        </div>

        {/* Top Products by Activity */}
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: 20 }}>Top Products by Activity</div>
          {productData.products?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={productData.products.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="stock_in" name="Stock In" fill="#43e97b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="stock_out" name="Stock Out" fill="#ff4757" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No data</p></div>}
        </div>

        {/* Monthly Trends */}
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: 20 }}>Monthly Trends (90 Days)</div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="stock_in" name="In" fill="#6c63ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stock_out" name="Out" fill="#4facfe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No monthly data</p></div>}
        </div>

        {/* Staff Performance */}
        <div className="chart-card">
          <div className="card-title" style={{ marginBottom: 20 }}>Staff Performance</div>
          {staffMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={staffMetrics.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="username" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total_transactions" name="Transactions" fill="#a29bfe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}><p>No staff data</p></div>
          )}
        </div>
      </div>
    </div>
  );
}