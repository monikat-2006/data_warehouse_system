import { useState, useEffect } from 'react';
import { activityAPI, usersAPI } from '../../services/api';

export default function AdminActivityTable() {
  const [activities, setActivities] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filters, setFilters] = useState({ user_id: '', action: '', date_from: '', date_to: '' });

  const load = async () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const { data } = await activityAPI.getLog(params);
    setActivities(data.activities || []);
  };

  useEffect(() => {
    usersAPI.getStaff().then(({ data }) => setStaff(data.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [filters]);

  return (
    <div>
      <div className="filters-bar card">
        <select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}>
          <option value="">All Staff</option>
          {staff.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
        <input placeholder="Filter by action..." value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
      </div>

      <div className="table-container card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Staff</th>
              <th>Action</th>
              <th>Product</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.timestamp).toLocaleString()}</td>
                <td>{a.username}</td>
                <td><code>{a.action}</code></td>
                <td>{a.product_name || '—'}</td>
                <td>{a.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
