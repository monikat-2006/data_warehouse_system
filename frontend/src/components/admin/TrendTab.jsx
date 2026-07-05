import { useEffect, useState } from 'react';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import { reportsAPI } from '../../services/api';

export default function TrendTab() {
  const [days, setDays] = useState(30);
  const [lineData, setLineData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const load = async () => {
      const [typeRes, monthRes] = await Promise.all([
        reportsAPI.transactionsByType(days),
        reportsAPI.monthlyTrends(days),
      ]);
      setLineData(typeRes.data.chart_data || []);
      setMonthlyData(monthRes.data.monthly_data || []);
      setStats({
        avg_daily_in: monthRes.data.avg_daily_in,
        avg_daily_out: monthRes.data.avg_daily_out,
      });
    };
    load();
  }, [days]);

  return (
    <div>
      <div className="tab-controls">
        {[30, 60, 90].map((d) => (
          <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDays(d)}>
            {d} Days
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-label">Avg Daily In</span><span className="stat-value">{stats.avg_daily_in || 0}</span></div>
        <div className="stat-card"><span className="stat-label">Avg Daily Out</span><span className="stat-value">{stats.avg_daily_out || 0}</span></div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Stock In/Out Trend ({days} days)</h3>
          <LineChart data={lineData} />
        </div>
        <div className="card chart-card">
          <h3>Monthly Totals</h3>
          <BarChart
            data={monthlyData}
            xKey="month"
            bars={[
              { key: 'stock_in', color: '#27AE60', name: 'Stock In' },
              { key: 'stock_out', color: '#E74C3C', name: 'Stock Out' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
