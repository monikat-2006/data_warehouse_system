import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    reorderLevel: '',
    branch: 'Main Warehouse'
  });

  const getToken = () => localStorage.getItem('token');

  const fetchProducts = async () => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError('Failed to load products');
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Simple validation
    if (!product.name.trim()) {
      setError('Product name is required');
      setLoading(false);
      return;
    }
    if (!product.price || isNaN(product.price)) {
      setError('Valid price is required');
      setLoading(false);
      return;
    }
    if (!product.quantity || isNaN(product.quantity)) {
      setError('Valid quantity is required');
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const data = {
        name: product.name.trim(),
        description: product.description.trim() || '',
        category: product.category.trim() || '',
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity),
        reorderLevel: parseInt(product.reorderLevel) || 10,
        branch: product.branch
      };

      console.log('Sending:', data);

      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      console.log('Response:', result);

      if (!res.ok) {
        throw new Error(result.error || 'Failed to add product');
      }

      setSuccess('✅ Product added successfully!');
      setProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        quantity: '',
        reorderLevel: '',
        branch: 'Main Warehouse'
      });
      setShowForm(false);
      await fetchProducts();
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('✅ Deleted!');
        await fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Delete failed');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📦 Inventory</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 25px',
            background: showForm ? '#dc3545' : '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          {showForm ? '✕ Close' : '+ Add Product'}
        </button>
      </div>

      {error && <div style={{ color: '#dc3545', padding: '12px', background: '#fde8e8', borderRadius: '8px', marginBottom: '15px' }}>❌ {error}</div>}
      {success && <div style={{ color: '#28a745', padding: '12px', background: '#e8f8ed', borderRadius: '8px', marginBottom: '15px' }}>✅ {success}</div>}

      {showForm && (
        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Add New Product</h3>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input type="text" placeholder="Product Name *" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} required style={inputStyle} />
              <input type="text" placeholder="Category" value={product.category} onChange={e => setProduct({...product, category: e.target.value})} style={inputStyle} />
              <input type="number" step="0.01" placeholder="Price *" value={product.price} onChange={e => setProduct({...product, price: e.target.value})} required style={inputStyle} />
              <input type="number" placeholder="Quantity *" value={product.quantity} onChange={e => setProduct({...product, quantity: e.target.value})} required style={inputStyle} />
              <input type="number" placeholder="Reorder Level" value={product.reorderLevel} onChange={e => setProduct({...product, reorderLevel: e.target.value})} style={inputStyle} />
              <select value={product.branch} onChange={e => setProduct({...product, branch: e.target.value})} style={inputStyle}>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="East Branch">East Branch</option>
                <option value="West Branch">West Branch</option>
                <option value="North Branch">North Branch</option>
                <option value="South Branch">South Branch</option>
              </select>
            </div>
            <textarea placeholder="Description" value={product.description} onChange={e => setProduct({...product, description: e.target.value})} style={{ ...inputStyle, width: '100%', minHeight: '80px', marginTop: '15px' }} />
            <div style={{ marginTop: '15px' }}>
              <button type="submit" disabled={loading} style={{ padding: '12px 35px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontWeight: 'bold' }}>
                {loading ? '⏳ Adding...' : '🚀 Add Product'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 35px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', marginLeft: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <h3>Product List ({products.length})</h3>
        {loading && <p>⏳ Loading...</p>}
        {products.length === 0 && !loading && <p style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>📭 No products</p>}
        {products.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Reorder</th>
                <th style={thStyle}>Branch</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}><b>{p.name}</b></td>
                  <td style={tdStyle}>{p.category || '-'}</td>
                  <td style={tdStyle}>₹{p.price?.toFixed(2) || '0.00'}</td>
                  <td style={{ ...tdStyle, color: p.quantity < p.reorderLevel ? '#dc3545' : '#28a745' }}>{p.quantity || 0}{p.quantity < p.reorderLevel && ' ⚠️'}</td>
                  <td style={tdStyle}>{p.reorderLevel || 10}</td>
                  <td style={tdStyle}>{p.branch || '-'}</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: '5px 15px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 14px',
  border: '1px solid #ced4da',
  borderRadius: '6px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none'
};

const thStyle = { padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' };
const tdStyle = { padding: '12px', textAlign: 'left', fontSize: '14px' };

export default Inventory;