import { useState, useEffect } from 'react';
import { Users, Mail, Shield, Activity, RefreshCw } from 'lucide-react';
import { usersAPI, reportsAPI } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, metricsRes] = await Promise.allSettled([
        usersAPI.getAll(),
        reportsAPI.staffMetrics(),
      ]);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || []);
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data.staff_metrics || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getMetrics = (userId) => metrics.find(m => m.user_id === userId) || {};

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const staffCount = users.filter(u => u.role === 'staff').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Staff Users</h1>
          <p>Manage all registered users and their activity</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={22} /></div>
          <div><div className="stat-value">{users.length}</div><div className="stat-label">Total Users</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Shield size={22} /></div>
          <div><div className="stat-value">{adminCount}</div><div className="stat-label">Administrators</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Activity size={22} /></div>
          <div><div className="stat-value">{staffCount}</div><div className="stat-label">Staff Members</div></div>
        </div>
      </div>

      {/* Search */}
      <div className="search-row" style={{ marginBottom: 20 }}>
        <div className="search-box">
          <Users size={16} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by username or email..." />
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><Users size={48} /><h3>No users found</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Transactions</th>
                  <th>Stock In</th>
                  <th>Stock Out</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const m = getMetrics(u.id);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: u.role === 'admin' ? 'var(--grad-primary)' : 'var(--grad-green)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 14, color: u.role === 'admin' ? 'white' : '#1a2338', flexShrink: 0
                          }}>
                            {u.username[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600 }}>{u.username}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <Mail size={13} />{u.email}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-info'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.total_transactions || 0}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{m.stock_in || 0}</td>
                      <td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{m.stock_out || 0}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}