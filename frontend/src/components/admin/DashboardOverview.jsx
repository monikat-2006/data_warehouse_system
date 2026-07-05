import { useEffect, useState } from 'react';
import LineChart from '../charts/LineChart';
import PieChart from '../charts/PieChart';
import BarChart from '../charts/BarChart';
import { reportsAPI, stockAPI } from '../../services/api';

export default function DashboardOverview() {
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [topStock, setTopStock] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, typeRes, prodRes, txnRes, staffRes] = await Promise.all([
          reportsAPI.stockSummary(),
          reportsAPI.transactionsByType(30),
          reportsAPI.transactionsByProduct(30),
          stockAPI.getTransactions(),
          reportsAPI.staffMetrics(),
        ]);
        setSummary(sumRes.data);
        setChartData(typeRes.data.chart_data || []);
        setDistribution(typeRes.data.distribution || {});
        setTopStock(prodRes.data.top_stock || []);
        setRecentTxns((txnRes.data.transactions || []).slice(0, 10));
        setMetrics(staffRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const pieData = [
    { name: 'Stock In', value: distribution.in || 0 },
    { name: 'Stock Out', value: distribution.out || 0 },
  ];

  return (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <span className="stat-value">{summary.total_products || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Stock Units</span>
          <span className="stat-value">{summary.total_units || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Today Transactions</span>
          <span className="stat-value">{metrics.today_transactions || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Staff</span>
          <span className="stat-value">{metrics.active_staff || 0}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Stock In vs Stock Out (30 days)</h3>
          <LineChart data={chartData} />
        </div>
        <div className="card chart-card">
          <h3>Transaction Distribution</h3>
          <PieChart data={pieData} />
        </div>
        <div className="card chart-card">
          <h3>Top 5 Products by Stock</h3>
          <BarChart data={topStock} bars={[{ key: 'stock', color: '#3498DB', name: 'Stock' }]} />
        </div>
      </div>

      <div className="card table-container">
        <h3>Recent Transactions</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Staff</th>
              <th>Product</th>
              <th>Type</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {recentTxns.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleString()}</td>
                <td>{t.username}</td>
                <td>{t.product_name}</td>
                <td><span className={`badge badge-${t.transaction_type === 'in' ? 'success' : 'danger'}`}>{t.transaction_type.toUpperCase()}</span></td>
                <td>{t.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
