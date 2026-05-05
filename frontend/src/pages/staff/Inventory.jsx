import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Search, X } from 'lucide-react';

function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    quantity: '',
    unit_price: '',
    location: '',
    reorder_level: '',
    branch: ''
  });

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProducts(data);
      setError('');
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const token = localStorage.getItem('token');
    const url = editingProduct 
      ? `http://localhost:5000/api/products/${editingProduct.id}`
      : 'http://localhost:5000/api/products';
    
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        location: formData.location,
        reorder_level: parseInt(formData.reorder_level),
        branch: formData.branch || user.branch || 'Main Warehouse'
      };

      console.log('Saving product:', productData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        setSuccess(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
        fetchProducts(); // Refresh the list
        resetForm();
        setShowModal(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Product deleted successfully!');
        fetchProducts(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete product');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStockOperation = async (id, type) => {
    const quantity = prompt(`Enter quantity to ${type}:`);
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:5000/api/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          product_id: id, 
          quantity: parseInt(quantity),
          remarks: `${type} operation by ${user.name || 'staff'}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${type} successful! New quantity: ${data.product.quantity}`);
        fetchProducts(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Operation failed');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Operation failed. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      quantity: '',
      unit_price: '',
      location: '',
      reorder_level: '',
      branch: user.branch || ''
    });
    setEditingProduct(null);
    setError('');
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      quantity: product.quantity.toString(),
      unit_price: product.unit_price.toString(),
      location: product.location || '',
      reorder_level: product.reorder_level?.toString() || '',
      branch: product.branch || user.branch || ''
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="inventory-container">
      {/* Success/Error Messages */}
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message" style={{background: '#fee', color: '#c00', padding: '10px', borderRadius: '5px', marginBottom: '15px'}}>{error}</div>}

      <div className="inventory-header">
        <h2>Inventory Management</h2>
        <div className="header-actions">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={openAddModal}>
            <Plus size={20} /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>
                    No products found. Click "Add Product" to create one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td className={product.quantity <= product.reorder_level ? 'low-stock' : ''}>
                      {product.quantity}
                    </td>
                    <td>${Number(product.unit_price).toFixed(2)}</td>
                    <td>{product.location || 'N/A'}</td>
                    <td>
                      {product.quantity <= product.reorder_level ? (
                        <span className="badge warning">Low Stock</span>
                      ) : (
                        <span className="badge success">In Stock</span>
                      )}
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-stock-in" 
                        onClick={() => handleStockOperation(product.id, 'stock-in')}
                        title="Add Stock"
                      >
                        Stock In
                      </button>
                      <button 
                        className="btn-stock-out" 
                        onClick={() => handleStockOperation(product.id, 'stock-out')}
                        title="Remove Stock"
                      >
                        Stock Out
                      </button>
                      <button 
                        className="btn-edit" 
                        onClick={() => openEditModal(product)}
                        title="Edit Product"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(product.id)}
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Product Name *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="SKU *"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                required
              />
              <input
                type="number"
                placeholder="Quantity *"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
              <input
                type="number"
                placeholder="Unit Price *"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Location (e.g., Aisle A1)"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
              <input
                type="number"
                placeholder="Reorder Level (e.g., 10)"
                value={formData.reorder_level}
                onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
              />
              
              {user?.role === 'admin' && (
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                >
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="East Branch">East Branch</option>
                  <option value="West Branch">West Branch</option>
                </select>
              )}
              
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;