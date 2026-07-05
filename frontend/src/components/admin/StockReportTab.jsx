import { useEffect, useState } from 'react';
import PieChart from '../charts/PieChart';
import { reportsAPI } from '../../services/api';

export default function StockReportTab() {
  const [summary, setSummary] = useState({});
  const [categories, setCategories] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [sumRes, lowRes] = await Promise.all([
        reportsAPI.stockSummary(),
        reportsAPI.lowStock(),
      ]);
      setSummary(sumRes.data);
      setCategories((lowRes.data.category_distribution || []).map((c) => ({
        name: c.category,
        value: c.stock,
      })));
      setLowStock(lowRes.data.low_stock_products || []);
    };
    load();
  }, []);

  return (
    <div>
      <div className="stat-card highlight-card">
        <span className="stat-label">Total Stock Value</span>
        <span className="stat-value">${(summary.total_value || 0).toLocaleString()}</span>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Stock by Category</h3>
          <PieChart data={categories} />
        </div>
        <div className="card">
          <h3>⚠️ Products Below Reorder Level</h3>
          {lowStock.length === 0 ? (
            <p className="success-text">All products are adequately stocked!</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Stock</th><th>Reorder Level</th></tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td className="text-danger">{p.current_stock}</td>
                    <td>{p.reorder_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
