import { useState, useEffect } from 'react';
import { stockAPI, usersAPI, productsAPI } from '../../services/api';

export default function TransactionTable() {
  const [transactions, setTransactions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ user_id: '', product_id: '', type: '', date_from: '', date_to: '' });

  const load = async () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const { data } = await stockAPI.getTransactions(params);
    setTransactions(data.transactions || []);
  };

  useEffect(() => {
    usersAPI.getStaff().then(({ data }) => setStaff(data.users || [])).catch(() => {});
    productsAPI.getAll().then(({ data }) => setProducts(data.products || [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [filters]);

  const totalIn = transactions.filter((t) => t.transaction_type === 'in').reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter((t) => t.transaction_type === 'out').reduce((s, t) => s + t.quantity, 0);

  return (
    <div>
      <div className="filters-bar card">
        <select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}>
          <option value="">All Staff</option>
          {staff.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
        <select value={filters.product_id} onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}>
          <option value="">All Products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
      </div>

      <div className="summary-bar">
        <span className="badge badge-success">Total In: {totalIn}</span>
        <span className="badge badge-danger">Total Out: {totalOut}</span>
        <span className="badge badge-primary">Net: {totalIn - totalOut}</span>
      </div>

      <div className="table-container card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Staff</th>
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const d = new Date(t.created_at);
              return (
                <tr key={t.id}>
                  <td>{d.toLocaleDateString()}</td>
                  <td>{d.toLocaleTimeString()}</td>
                  <td>{t.username}</td>
                  <td>{t.product_name}</td>
                  <td><span className={`badge badge-${t.transaction_type === 'in' ? 'success' : 'danger'}`}>{t.transaction_type.toUpperCase()}</span></td>
                  <td>{t.quantity}</td>
                  <td>{t.notes || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
