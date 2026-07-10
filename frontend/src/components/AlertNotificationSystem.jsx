import { useState, useEffect, useCallback, useRef } from 'react';
import { alertsAPI } from '../services/api';
import './AlertNotificationSystem.css';

const SEVERITY_COLOR = { critical: 'red', high: 'orange', medium: 'yellow' };
const URGENCY_LABEL = { urgent: '🔴 Urgent', soon: '🟡 Soon', below_reorder: '🟠 Below Reorder' };
const TYPE_ICON = { low_stock: '📦', unusual_activity: '⚠️', reorder_suggestion: '🔄' };

export default function AlertNotificationSystem({ inNavbar = false }) {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [unusualActivity, setUnusualActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await alertsAPI.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch { /* silent */ }
  }, []);

  const loadLowStock = useCallback(async () => {
    try {
      const { data } = await alertsAPI.getLowStock();
      setLowStock(data.low_stock_products || []);
    } catch { /* silent */ }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const { data } = await alertsAPI.getReorderSuggestions();
      setSuggestions(data.suggestions || []);
    } catch { /* silent */ }
  }, []);

  const loadUnusual = useCallback(async () => {
    try {
      const { data } = await alertsAPI.getUnusualActivity();
      setUnusualActivity(data.unusual_activity || []);
    } catch { /* silent */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadNotifications(), loadLowStock(), loadSuggestions(), loadUnusual()]);
    setLoading(false);
  }, [loadNotifications, loadLowStock, loadSuggestions, loadUnusual]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [loadAll]);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id) => {
    await alertsAPI.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await alertsAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // ── Navbar bell mode ──────────────────────────────────────────────────────
  if (inNavbar) {
    return (
      <div className="ans-bell-wrap" ref={bellRef}>
        <button
          className="ans-bell-btn"
          onClick={() => setBellOpen(o => !o)}
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && <span className="ans-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>

        {bellOpen && (
          <div className="ans-bell-dropdown">
            <div className="ans-bell-dh">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button className="ans-mark-all" onClick={handleMarkAllRead}>Mark all read</button>
              )}
            </div>
            <div className="ans-bell-list">
              {notifications.length === 0
                ? <div className="ans-bell-empty">No notifications</div>
                : notifications.slice(0, 8).map(n => (
                  <div
                    key={n.id}
                    className={`ans-bell-item ${n.is_read ? 'read' : 'unread'}`}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                  >
                    <span className="ans-ni-icon">{TYPE_ICON[n.type] || '🔔'}</span>
                    <div className="ans-ni-body">
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                    </div>
                    {!n.is_read && <span className="ans-ni-dot" />}
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Full alerts panel ─────────────────────────────────────────────────────
  return (
    <div className="ans-container">
      {/* Header */}
      <div className="ans-header">
        <div className="ans-header-left">
          <span className="ans-header-icon">🔔</span>
          <div>
            <h2>Alerts & Notifications</h2>
            <p>Real-time stock monitoring · auto-refreshes every 30s</p>
          </div>
        </div>
        <div className="ans-header-stats">
          <div className="ans-stat-pill red">{lowStock.length} Low Stock</div>
          <div className="ans-stat-pill orange">{suggestions.length} Reorder</div>
          <div className="ans-stat-pill blue">{unreadCount} Unread</div>
          {loading && <div className="ans-loading-dot" />}
        </div>
      </div>

      {/* Tabs */}
      <div className="ans-tabs">
        {[
          { id: 'notifications', label: '🔔 Notifications', count: unreadCount },
          { id: 'lowstock', label: '📦 Low Stock', count: lowStock.length },
          { id: 'reorder', label: '🔄 Reorder', count: suggestions.length },
          { id: 'unusual', label: '⚠️ Unusual Activity', count: unusualActivity.length },
        ].map(t => (
          <button
            key={t.id}
            className={`ans-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.count > 0 && <span className="ans-tab-badge">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="ans-content">

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div>
            <div className="ans-section-header">
              <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
              {unreadCount > 0 && (
                <button className="ans-mark-all" onClick={handleMarkAllRead}>✓ Mark all as read</button>
              )}
            </div>
            {notifications.length === 0
              ? <EmptyState icon="🎉" text="You're all caught up!" />
              : notifications.map(n => (
                <div key={n.id} className={`ans-notif-card ${n.is_read ? 'read' : 'unread'}`}>
                  <div className="ans-notif-icon-wrap">
                    <span className="ans-notif-icon">{TYPE_ICON[n.type] || '🔔'}</span>
                  </div>
                  <div className="ans-notif-body">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <span className="ans-notif-time">{formatTime(n.created_at)}</span>
                  </div>
                  {!n.is_read && (
                    <button className="ans-read-btn" onClick={() => handleMarkRead(n.id)}>Mark read</button>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* ── LOW STOCK ── */}
        {activeTab === 'lowstock' && (
          <div>
            <div className="ans-section-header">
              <span>{lowStock.length} product{lowStock.length !== 1 ? 's' : ''} below reorder level</span>
            </div>
            {lowStock.length === 0
              ? <EmptyState icon="✅" text="All stock levels are healthy!" />
              : lowStock.map(p => (
                <div key={p.id} className={`ans-stock-card sev-${SEVERITY_COLOR[p.severity] || 'yellow'}`}>
                  <div className="ans-stock-card-header">
                    <div>
                      <strong>{p.name}</strong>
                      <span className="ans-sku">{p.sku}</span>
                    </div>
                    <span className={`ans-severity-badge sev-${SEVERITY_COLOR[p.severity]}`}>
                      {p.severity?.toUpperCase()}
                    </span>
                  </div>
                  <div className="ans-stock-bar-wrap">
                    <div
                      className="ans-stock-bar"
                      style={{ width: `${Math.min(100, p.stock_percentage)}%`, '--sev': SEVERITY_COLOR[p.severity] }}
                    />
                  </div>
                  <div className="ans-stock-stats">
                    <span>Current: <strong>{p.current_stock}</strong></span>
                    <span>Reorder at: <strong>{p.reorder_level}</strong></span>
                    <span>Category: <strong>{p.category}</strong></span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ── REORDER SUGGESTIONS ── */}
        {activeTab === 'reorder' && (
          <div>
            <div className="ans-section-header">
              <span>Smart reorder recommendations</span>
            </div>
            {suggestions.length === 0
              ? <EmptyState icon="📊" text="No reorder suggestions at this time." />
              : suggestions.map(p => (
                <div key={p.id} className={`ans-suggest-card urg-${p.urgency}`}>
                  <div className="ans-suggest-header">
                    <div>
                      <strong>{p.name}</strong>
                      <span className="ans-sku">{p.sku}</span>
                    </div>
                    <span className={`ans-urgency-badge urg-${p.urgency}`}>
                      {URGENCY_LABEL[p.urgency] || p.urgency}
                    </span>
                  </div>
                  <div className="ans-suggest-grid">
                    <div className="ans-sg-item">
                      <span>Current Stock</span><strong>{p.current_stock}</strong>
                    </div>
                    <div className="ans-sg-item">
                      <span>Daily Usage</span><strong>{p.daily_usage}/day</strong>
                    </div>
                    <div className="ans-sg-item">
                      <span>Days Until Out</span>
                      <strong>{p.days_until_stockout != null ? `~${p.days_until_stockout}d` : 'N/A'}</strong>
                    </div>
                    <div className="ans-sg-item ans-order-qty">
                      <span>Suggested Order</span><strong>{p.suggested_order_qty} units</strong>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ── UNUSUAL ACTIVITY ── */}
        {activeTab === 'unusual' && (
          <div>
            <div className="ans-section-header">
              <span>Products with abnormal transaction patterns</span>
            </div>
            {unusualActivity.length === 0
              ? <EmptyState icon="🟢" text="No unusual activity detected." />
              : unusualActivity.map(p => (
                <div key={p.id} className="ans-unusual-card">
                  <div className="ans-unusual-header">
                    <strong>{p.name}</strong>
                    <span className="ans-spike-badge">⚠️ {p.spike_ratio}× spike</span>
                  </div>
                  <div className="ans-unusual-grid">
                    <div className="ans-ug-item">
                      <span>30-day Avg Qty</span><strong>{p.avg_qty_30d}</strong>
                    </div>
                    <div className="ans-ug-item">
                      <span>7-day Max Qty</span><strong>{p.max_recent_7d}</strong>
                    </div>
                    <div className="ans-ug-item">
                      <span>Recent Transactions</span><strong>{p.recent_txn_count}</strong>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="ans-empty">
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  } catch { return ''; }
}
