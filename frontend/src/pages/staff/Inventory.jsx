import { useState, useEffect } from 'react';
import { Search, RefreshCw, Package, AlertCircle } from 'lucide-react';
import { productsAPI } from '../../services/api';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productsAPI.getAll();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let f = [...products];
    if (searchTerm) {
      f = f.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (catFilter !== 'all') f = f.filter(p => p.category === catFilter);
    if (stockFilter === 'low') f = f.filter(p => p.current_stock <= p.reorder_level);
    if (stockFilter === 'ok') f = f.filter(p => p.current_stock > p.reorder_level);
    setFiltered(f);
  }, [products, searchTerm, catFilter, stockFilter]);

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Products Directory</h1>
          <p>Browse warehouse inventory and check current stock levels</p>
        </div>
      </div>

      <div className="search-row">
        <div className="search-box">
          <Search size={16} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by product name or SKU..." />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
          <option value="all">All Stock Status</option>
          <option value="low">Low Stock</option>
          <option value="ok">In Stock</option>
        </select>
        <button className="btn-icon" onClick={fetchProducts}><RefreshCw size={16} /></button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>No products found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</td>
                    <td><span className="badge badge-info">{p.category}</span></td>
                    <td style={{ fontWeight: 700, color: p.current_stock <= p.reorder_level ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {p.current_stock}
                    </td>
                    <td>
                      {p.current_stock <= p.reorder_level
                        ? <span className="badge badge-danger"><AlertCircle size={11} /> Low Stock</span>
                        : <span className="badge badge-success">In Stock</span>}
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