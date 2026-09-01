import { useState, useEffect } from 'react';
import { Search, RefreshCw, ClipboardList, TrendingUp, Package } from 'lucide-react';
import { stockAPI } from '../../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // For staff, we might want to only show their own transactions.
      // But the backend /stock/transactions endpoint currently returns all if you just hit it,
      // or we can pass a user filter if backend supports it. For now we just show what it returns.
      const { data } = await stockAPI.getTransactions({ limit: 100 });
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => {
    const matchSearch = t.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.product_sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || t.transaction_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>My Transactions</h1>
          <p>History of your stock entries and dispatches</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchTransactions}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="search-row">
        <div className="search-box">
          <Search size={16} />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Search by product name or SKU..." 
          />
        </div>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <h3>No transactions found</h3>
            <p>You haven't made any stock movements yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Date & Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.product_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.product_sku}</div>
                    </td>
                    <td>
                      <span className={`badge ${t.transaction_type === 'in' ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {t.transaction_type === 'in' ? <TrendingUp size={12} /> : <Package size={12} />}
                        {t.transaction_type === 'in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {t.transaction_type === 'in' ? '+' : '-'}{t.quantity}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {t.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}