import { useEffect } from 'react';

export default function NotificationToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <p>{message}</p>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}
