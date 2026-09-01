import { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, TrendingUp, Package, LogIn, LogOut as LogOutIcon, Plus, Edit } from 'lucide-react';
import { activityAPI } from '../../services/api';

const ACTION_ICONS = {
  login: <LogIn size={14} />,
  logout: <LogOutIcon size={14} />,
  stock_in: <TrendingUp size={14} />,
  stock_out: <Package size={14} />,
  product_create: <Plus size={14} />,
  product_update: <Edit size={14} />,
  register: <LogIn size={14} />,
};

const ACTION_COLORS = {
  login: 'in',
  logout: 'out',
  stock_in: 'in',
  stock_out: 'out',
  product_create: 'default',
  product_update: 'default',
  register: 'in',
};

export default function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PER_PAGE = 25;

  const fetchActivities = async (reset = false) => {
    if (reset) setLoading(true);
    try {
      const { data } = await activityAPI.getLog({ page: reset ? 1 : page, per_page: PER_PAGE });
      const list = data.activities || [];
      if (reset) {
        setActivities(list);
        setPage(1);
      } else {
        setActivities(prev => [...prev, ...list]);
      }
      setHasMore(list.length === PER_PAGE);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(true); }, []);

  const filtered = activities.filter(a => {
    const matchSearch = !searchTerm || a.description?.toLowerCase().includes(searchTerm.toLowerCase()) || a.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = actionFilter === 'all' || a.action === actionFilter;
    return matchSearch && matchAction;
  });

  const uniqueActions = [...new Set(activities.map(a => a.action))];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Activity Log</h1>
          <p>Full audit trail of all system activities</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => fetchActivities(true)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="search-row">
        <div className="search-box">
          <Search size={16} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search activities or users..." />
        </div>
        <select className="filter-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="all">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Activity size={48} /><h3>No activities found</h3>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Description</th>
                  <th>User</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`activity-dot ${ACTION_COLORS[a.action] || 'default'}`} style={{ width: 28, height: 28 }}>
                          {ACTION_ICONS[a.action] || <Activity size={14} />}
                        </div>
                        <span className={`badge ${a.action?.includes('in') || a.action === 'login' || a.action === 'register' ? 'badge-success' : a.action?.includes('out') || a.action?.includes('delete') ? 'badge-danger' : 'badge-info'}`}>
                          {a.action}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{a.description || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                          {(a.username || 'S')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{a.username || 'System'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {a.created_at ? new Date(a.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => { setPage(p => p + 1); fetchActivities(); }}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
}