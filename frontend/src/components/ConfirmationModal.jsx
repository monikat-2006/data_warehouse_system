export default function ConfirmationModal({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, variant = 'primary' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText || 'Cancel'}
          </button>
          <button className={`btn btn-${variant}`} onClick={onConfirm}>
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
