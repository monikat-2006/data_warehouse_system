import { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, Filter, Download } from 'lucide-react';

function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, branchFilter, products]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    if (branchFilter !== 'all') {
      filtered = filtered.filter(p => p.branch === branchFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  };

  const branches = [...new Set(products.map(p => p.branch))];

  const exportToCSV = () => {
    const headers = ['SKU', 'Product Name', 'Quantity', 'Unit Price', 'Location', 'Branch', 'Status'];
    const csvData = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.quantity,
      p.unit_price,
      p.location,
      p.branch,
      p.quantity <= p.reorder_level ? 'Low Stock' : 'In Stock'
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_report.csv';
    a.click();
  };

  return (
    <div className="admin-inventory">
      <div className="admin-inventory-header">
        <h2>All Inventory (System Wide)</h2>
        <button className="admin-export-btn" onClick={exportToCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="admin-filters">
        <div className="admin-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by product or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="admin-branch-filter">
          <Filter size={20} />
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="admin-products-table">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Location</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td className={product.quantity <= product.reorder_level ? 'low-stock' : ''}>
                    {product.quantity}
                  </td>
                  <td>${product.unit_price}</td>
                  <td>{product.location || '-'}</td>
                  <td><span className="branch-badge">{product.branch}</span></td>
                  <td>
                    {product.quantity <= product.reorder_level ? (
                      <span className="badge warning">Low Stock</span>
                    ) : (
                      <span className="badge success">In Stock</span>
                    )}
                  </td>
                  <td className="admin-actions">
                    <button className="admin-view-btn" onClick={() => {
                      setSelectedProduct(product);
                      setShowModal(true);
                    }}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedProduct && (
        <div className="admin-modal" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Product Details</h3>
            <div className="product-details">
              <p><strong>Name:</strong> {selectedProduct.name}</p>
              <p><strong>SKU:</strong> {selectedProduct.sku}</p>
              <p><strong>Quantity:</strong> {selectedProduct.quantity}</p>
              <p><strong>Unit Price:</strong> ${selectedProduct.unit_price}</p>
              <p><strong>Location:</strong> {selectedProduct.location || 'N/A'}</p>
              <p><strong>Branch:</strong> {selectedProduct.branch}</p>
              <p><strong>Reorder Level:</strong> {selectedProduct.reorder_level}</p>
            </div>
            <button onClick={() => setShowModal(false)} className="admin-close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;