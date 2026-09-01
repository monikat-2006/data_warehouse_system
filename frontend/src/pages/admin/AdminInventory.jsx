import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Download, X, Package, RefreshCw, AlertCircle } from 'lucide-react';
import { productsAPI } from '../../services/api';

const EMPTY_FORM = { name: '', sku: '', category: 'Electronics', price: '', initial_stock: '', reorder_level: '10' };
const CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Clothing', 'Food', 'Tools', 'Sports', 'Other'];

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productsAPI.getAll();
      setProducts(data.products || []);
    } catch { setError('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let f = [...products];
    if (searchTerm) f = f.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    if (catFilter !== 'all') f = f.filter(p => p.category === catFilter);
    if (stockFilter === 'low') f = f.filter(p => p.current_stock <= p.reorder_level);
    if (stockFilter === 'ok') f = f.filter(p => p.current_stock > p.reorder_level);
    setFiltered(f);
  }, [products, searchTerm, catFilter, stockFilter]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditProduct(null); setError(''); setShowModal(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, sku: p.sku, category: p.category, price: String(p.price), initial_stock: String(p.current_stock), reorder_level: String(p.reorder_level) });
    setEditProduct(p);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name.trim(), sku: form.sku.trim(), category: form.category,
        price: parseFloat(form.price), reorder_level: parseInt(form.reorder_level) || 10,
      };
      if (editProduct) {
        await productsAPI.update(editProduct.id, payload);
        setSuccess('Product updated!');
      } else {
        await productsAPI.create({ ...payload, initial_stock: parseInt(form.initial_stock) || 0 });
        setSuccess('Product added!');
      }
      setShowModal(false);
      await fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await productsAPI.delete(p.id);
      setSuccess(`"${p.name}" deleted`);
      await fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Delete failed'); }
  };

  const exportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Price', 'Current Stock', 'Reorder Level', 'Status'];
    const rows = filtered.map(p => [
      p.sku, p.name, p.category, p.price, p.current_stock, p.reorder_level,
      p.current_stock <= p.reorder_level ? 'Low Stock' : 'In Stock'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Inventory</h1>
          <p>Manage all products and stock levels</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add Product</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="search-row">
        <div className="search-box">
          <Search size={16} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or SKU..." />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
          <option value="all">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="ok">In Stock</option>
        </select>
        <button className="btn-icon" onClick={fetchProducts}><RefreshCw size={16} /></button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>No products found</h3>
            <p>Try adjusting your filters or add a new product.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</td>
                    <td><span className="badge badge-info">{p.category}</span></td>
                    <td>${p.price?.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: p.current_stock <= p.reorder_level ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {p.current_stock}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.reorder_level}</td>
                    <td>
                      {p.current_stock <= p.reorder_level
                        ? <span className="badge badge-danger"><AlertCircle size={11} /> Low Stock</span>
                        : <span className="badge badge-success">In Stock</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-icon" onClick={() => openEdit(p)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(p)} title="Delete" style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editProduct ? 'Edit Product' : 'Add New Product'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Laptop Pro 15" />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="LP-001" disabled={!!editProduct} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                {!editProduct && (
                  <div className="form-group">
                    <label>Initial Stock</label>
                    <input type="number" value={form.initial_stock} onChange={e => setForm({ ...form, initial_stock: e.target.value })} placeholder="0" />
                  </div>
                )}
                <div className="form-group">
                  <label>Reorder Level</label>
                  <input type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} placeholder="10" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Saving...</> : editProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}