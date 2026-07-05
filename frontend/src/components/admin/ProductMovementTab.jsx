import { useEffect, useState } from 'react';
import BarChart from '../charts/BarChart';
import { reportsAPI } from '../../services/api';

export default function ProductMovementTab() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    reportsAPI.transactionsByProduct(30).then(({ data }) => setProducts(data.products || []));
  }, []);

  return (
    <div>
      <div className="table-container card">
        <h3>Top 10 Products by Movement</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Stock In</th>
              <th>Stock Out</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.product_id}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td className="text-success">{p.stock_in}</td>
                <td className="text-danger">{p.stock_out}</td>
                <td>{p.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card chart-card">
        <h3>In vs Out per Product</h3>
        <BarChart
          data={products.slice(0, 10)}
          bars={[
            { key: 'stock_in', color: '#27AE60', name: 'Stock In' },
            { key: 'stock_out', color: '#E74C3C', name: 'Stock Out' },
          ]}
        />
      </div>
    </div>
  );
}
