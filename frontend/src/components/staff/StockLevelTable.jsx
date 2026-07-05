import { useState } from 'react';

export default function StockLevelTable({ products }) {
  const [search, setSearch] = useState('');

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="table-container card">
      <div className="table-header">
        <h3>Stock Levels</h3>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Current Stock</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={4} className="empty-row">No products found</td></tr>
          ) : (
            filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><code>{p.sku}</code></td>
                <td>{p.category}</td>
                <td>
                  <span className={p.current_stock <= p.reorder_level ? 'text-danger' : ''}>
                    {p.current_stock}
                    {p.current_stock <= p.reorder_level && ' ⚠️'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
