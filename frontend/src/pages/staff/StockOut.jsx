import { useState, useEffect } from 'react';
import { Search, RefreshCw, ArrowUpFromLine, CheckCircle, Package } from 'lucide-react';
import { productsAPI, stockAPI } from '../../services/api';

export default function StockOut() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productsAPI.getAll();
      // Only show products that have stock
      setProducts((data.products || []).filter(p => p.current_stock > 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product first');
      return;
    }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setError('Quantity must be a positive number');
      return;
    }
    if (qty > selectedProduct.current_stock) {
      setError(`Cannot dispatch more than current stock (${selectedProduct.current_stock})`);
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      await stockAPI.stockOut({
        product_id: selectedProduct.id,
        quantity: qty,
        notes: notes.trim()
      });
      setSuccess(`Successfully dispatched ${qty} units of ${selectedProduct.name}`);
      setQuantity('');
      setNotes('');
      setSelectedProduct(null);
      await fetchProducts(); // refresh stock levels
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process stock out');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Stock Out (Dispatch)</h1>
        <p>Dispatch inventory and record stock leaving the warehouse</p>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        {/* Left Side: Product Selection */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Select Product</span>
            <button className="btn-icon" onClick={fetchProducts}><RefreshCw size={14} /></button>
          </div>
          
          <div className="search-box" style={{ marginBottom: 16 }}>
            <Search size={16} />
            <input 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Search by name or SKU..." 
            />
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ display: 'inline-block' }} /></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No products available with stock</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setError(''); }}
                    style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      background: selectedProduct?.id === p.id ? 'rgba(108,99,255,0.1)' : 'transparent',
                      borderLeft: selectedProduct?.id === p.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Available Stock</div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{p.current_stock}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Dispatch Details</span>
          </div>
          
          {success && <div className="alert alert-success"><CheckCircle size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!selectedProduct ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <Package size={40} />
              <p>Select a product from the list to begin</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Selected Product</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedProduct.name}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <span className="badge badge-info">{selectedProduct.category}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Max Available: <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{selectedProduct.current_stock}</span></span>
                </div>
              </div>

              <div className="form-group">
                <label>Quantity to Dispatch *</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  max={selectedProduct.current_stock}
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  placeholder={`Max: ${selectedProduct.current_stock}`} 
                />
              </div>

              <div className="form-group">
                <label>Notes / Reference (Optional)</label>
                <textarea 
                  rows="3" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Order ID, Destination, etc." 
                />
              </div>

              <button type="submit" className="btn btn-danger btn-block" disabled={submitting} style={{ marginTop: 16, padding: '14px' }}>
                {submitting ? (
                  <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing...</>
                ) : (
                  <><ArrowUpFromLine size={18} /> Process Stock Out</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
