import { useEffect, useState } from 'react';
import BarChart from '../charts/BarChart';
import { reportsAPI } from '../../services/api';

export default function StaffMetricsTab() {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    reportsAPI.staffMetrics().then(({ data }) => setMetrics(data.staff_metrics || []));
  }, []);

  const chartData = metrics.map((m) => ({
    name: m.username,
    transactions: m.total_transactions,
  }));

  return (
    <div>
      <div className="table-container card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Total Transactions</th>
              <th>Stock In</th>
              <th>Stock Out</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.user_id}>
                <td>{m.username}</td>
                <td>{m.total_transactions}</td>
                <td className="text-success">{m.stock_in}</td>
                <td className="text-danger">{m.stock_out}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card chart-card">
        <h3>Transactions per Staff</h3>
        <BarChart data={chartData} bars={[{ key: 'transactions', color: '#3498DB', name: 'Transactions' }]} />
      </div>
    </div>
  );
}
