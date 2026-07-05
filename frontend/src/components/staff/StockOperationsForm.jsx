import { useState } from 'react';
import ConfirmationModal from '../ConfirmationModal';

export default function StockOperationsForm({ products, onStockIn, onStockOut, selectedProduct, currentStock }) {
  const [productId, setProductId] = useState(selectedProduct || '');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [modal, setModal] = useState(null);

  const product = products.find((p) => p.id === Number(productId));
  const stock = product?.current_stock ?? currentStock ?? 0;

  const openConfirm = (type) => {
    if (!productId || !quantity || Number(quantity) <= 0) return;
    if (type === 'out' && Number(quantity) > stock) return;
    setModal({ type, productId, quantity: Number(quantity), notes, productName: product?.name });
  };

  const handleConfirm = () => {
    if (modal.type === 'in') {
      onStockIn({ product_id: Number(modal.productId), quantity: modal.quantity, notes: modal.notes });
    } else {
      onStockOut({ product_id: Number(modal.productId), quantity: modal.quantity, notes: modal.notes });
    }
    setModal(null);
    setQuantity('');
    setNotes('');
  };

  return (
    <div className="stock-form card">
      <h3>Stock Operations</h3>

      <div className="form-group">
        <label>Product</label>
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Select a product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.current_stock}</option>
          ))}
        </select>
      </div>

      {productId && (
        <div className="stock-badge">
          Current Stock: <strong>{stock}</strong> units
        </div>
      )}

      <div className="form-group">
        <label>Quantity</label>
        <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" />
      </div>

      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={3} />
      </div>

      <div className="form-actions">
        <button className="btn btn-success" onClick={() => openConfirm('in')} disabled={!productId || !quantity}>
          Stock In
        </button>
        <button
          className="btn btn-danger"
          onClick={() => openConfirm('out')}
          disabled={!productId || !quantity || Number(quantity) > stock}
        >
          Stock Out
        </button>
      </div>

      {quantity && Number(quantity) > stock && productId && (
        <p className="error-text">Cannot stock out more than available ({stock} units)</p>
      )}

      <ConfirmationModal
        isOpen={!!modal}
        title={modal?.type === 'in' ? 'Confirm Stock In' : 'Confirm Stock Out'}
        message={modal ? `${modal.type === 'in' ? 'Add' : 'Remove'} ${modal.quantity} units of "${modal.productName}"?` : ''}
        confirmText={modal?.type === 'in' ? 'Stock In' : 'Stock Out'}
        variant={modal?.type === 'in' ? 'success' : 'danger'}
        onConfirm={handleConfirm}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
