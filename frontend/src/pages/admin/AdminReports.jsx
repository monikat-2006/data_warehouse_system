import { useState } from 'react';
import { FileText, Download, Printer, Eye, RefreshCw, Package, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { productsAPI, usersAPI, stockAPI, reportsAPI } from '../../services/api';

export default function AdminReports() {
  const [reportType, setReportType] = useState('inventory');
  const [dateRange, setDateRange] = useState('30');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      if (reportType === 'inventory') {
        const { data } = await productsAPI.getAll();
        setReportData({ type: 'inventory', rows: data.products || [] });

      } else if (reportType === 'transactions') {
        const { data } = await stockAPI.getTransactions({ limit: 500 });
        let rows = data.transactions || [];
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        rows = rows.filter(t => new Date(t.created_at) >= daysAgo);
        setReportData({ type: 'transactions', rows });

      } else if (reportType === 'users') {
        const { data } = await usersAPI.getAll();
        setReportData({ type: 'users', rows: data.users || [] });

      } else if (reportType === 'summary') {
        const [pRes, uRes, tRes, sRes] = await Promise.all([
          productsAPI.getAll(), usersAPI.getAll(),
          stockAPI.getTransactions({ limit: 1000 }), reportsAPI.stockSummary()
        ]);
        const products = pRes.data.products || [];
        const users = uRes.data.users || [];
        const transactions = tRes.data.transactions || [];
        const summary = sRes.data;
        setReportData({ type: 'summary', summary, products, users, transactions });
      }
    } catch (e) {
      console.error('Report generation failed:', e);
    } finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!reportData) return;
    let headers = [], rows = [];

    if (reportData.type === 'inventory') {
      headers = ['SKU', 'Product Name', 'Category', 'Price', 'Current Stock', 'Reorder Level', 'Status'];
      rows = reportData.rows.map(p => [p.sku, p.name, p.category, p.price, p.current_stock, p.reorder_level, p.current_stock <= p.reorder_level ? 'Low Stock' : 'In Stock']);
    } else if (reportData.type === 'transactions') {
      headers = ['ID', 'Product', 'SKU', 'Type', 'Quantity', 'User', 'Notes', 'Date'];
      rows = reportData.rows.map(t => [t.id, t.product_name, t.product_sku, t.transaction_type, t.quantity, t.username, t.notes || '', new Date(t.created_at).toLocaleString()]);
    } else if (reportData.type === 'users') {
      headers = ['ID', 'Username', 'Email', 'Role', 'Joined'];
      rows = reportData.rows.map(u => [u.id, u.username, u.email, u.role, u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A']);
    } else if (reportData.type === 'summary') {
      headers = ['Metric', 'Value'];
      rows = [
        ['Total Products', reportData.products.length],
        ['Total Users', reportData.users.length],
        ['Total Transactions', reportData.transactions.length],
        ['Total Inventory Value', `$${reportData.summary.total_value}`],
        ['Total Units', reportData.summary.total_units],
      ];
    }

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    if (!reportData) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>${reportData.type.toUpperCase()} REPORT</title>
      <style>
        body{font-family:Arial,sans-serif;margin:40px;color:#222}
        h1{color:#6c63ff;border-bottom:3px solid #6c63ff;padding-bottom:12px}
        table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
        th{background:#6c63ff;color:white;padding:10px;text-align:left}
        td{padding:9px;border-bottom:1px solid #eee}
        tr:nth-child(even) td{background:#f9f9f9}
        .footer{margin-top:30px;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:20px;text-align:center}
      </style></head><body>
      <h1>WarehouseIQ — ${reportData.type.toUpperCase()} REPORT</h1>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()} &nbsp;|&nbsp; <strong>Records:</strong> ${reportData.rows?.length || 'N/A'}</p>
    `);

    if (reportData.type === 'inventory') {
      w.document.write(`<table><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>`);
      reportData.rows.forEach(p => w.document.write(`<tr><td>${p.sku}</td><td>${p.name}</td><td>${p.category}</td><td>$${p.price}</td><td>${p.current_stock}</td><td>${p.current_stock <= p.reorder_level ? 'Low Stock' : 'In Stock'}</td></tr>`));
      w.document.write(`</tbody></table>`);
    } else if (reportData.type === 'transactions') {
      w.document.write(`<table><thead><tr><th>Product</th><th>Type</th><th>Qty</th><th>User</th><th>Date</th><th>Notes</th></tr></thead><tbody>`);
      reportData.rows.forEach(t => w.document.write(`<tr><td>${t.product_name}</td><td>${t.transaction_type}</td><td>${t.quantity}</td><td>${t.username}</td><td>${new Date(t.created_at).toLocaleString()}</td><td>${t.notes || '-'}</td></tr>`));
      w.document.write(`</tbody></table>`);
    } else if (reportData.type === 'users') {
      w.document.write(`<table><thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>`);
      reportData.rows.forEach(u => w.document.write(`<tr><td>${u.username}</td><td>${u.email}</td><td>${u.role}</td><td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td></tr>`));
      w.document.write(`</tbody></table>`);
    } else if (reportData.type === 'summary') {
      w.document.write(`<h2>System Summary</h2><ul>
        <li>Total Products: ${reportData.products.length}</li>
        <li>Total Users: ${reportData.users.length}</li>
        <li>Total Transactions: ${reportData.transactions.length}</li>
        <li>Inventory Value: $${reportData.summary.total_value}</li>
        <li>Total Units: ${reportData.summary.total_units}</li>
      </ul>`);
    }

    w.document.write(`<div class="footer">WarehouseIQ — Smart E-Commerce Data Warehouse & Inventory Management System</div></body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  const REPORT_TYPES = [
    { value: 'inventory', label: '📦 Inventory Report', icon: <Package size={18} /> },
    { value: 'transactions', label: '🔄 Transaction Report', icon: <TrendingUp size={18} /> },
    { value: 'users', label: '👥 User Report', icon: <Users size={18} /> },
    { value: 'summary', label: '📈 Summary Report', icon: <FileText size={18} /> },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Generate, preview, export, and print warehouse reports</p>
      </div>

      {/* Controls */}
      <div className="card">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
            <label>Report Type</label>
            <select className="filter-select" style={{ width: '100%' }} value={reportType} onChange={e => { setReportType(e.target.value); setReportData(null); }}>
              {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {reportType === 'transactions' && (
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
              <label>Date Range</label>
              <select className="filter-select" style={{ width: '100%' }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
                <option value="9999">All Time</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Generating...</> : <><RefreshCw size={15} /> Generate Report</>}
            </button>
            {reportData && (
              <>
                <button className="btn btn-secondary" onClick={() => setShowPreview(true)}><Eye size={15} /> Preview</button>
                <button className="btn btn-secondary" onClick={exportCSV}><Download size={15} /> CSV</button>
                <button className="btn btn-secondary" onClick={printReport}><Printer size={15} /> Print</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {!reportData && !loading && (
        <div className="card">
          <div className="empty-state">
            <FileText size={56} />
            <h3>No Report Generated</h3>
            <p>Select a report type and click "Generate Report" to view data</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="card"><div className="loading"><div className="spinner" /><span>Generating report...</span></div></div>
      )}

      {reportData && !loading && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="card-title">Report Preview — {reportData.type.toUpperCase()}</span>
              <span style={{ marginLeft: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                {reportData.type === 'summary' ? 'Summary' : `${reportData.rows?.length} records`}
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Generated: {new Date().toLocaleString()}</span>
          </div>

          {reportData.type === 'summary' ? (
            <div style={{ padding: 24 }}>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {[
                  { label: 'Total Products', value: reportData.products.length, color: 'var(--accent-primary)' },
                  { label: 'Total Users', value: reportData.users.length, color: 'var(--accent-blue)' },
                  { label: 'Transactions', value: reportData.transactions.length, color: 'var(--accent-green)' },
                  { label: 'Inventory Value', value: `$${reportData.summary.total_value?.toLocaleString()}`, color: 'var(--accent-orange)' },
                  { label: 'Total Units', value: reportData.summary.total_units?.toLocaleString(), color: 'var(--accent-cyan)' },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <div><div className="stat-value" style={{ color: s.color, fontSize: 24 }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {reportData.type === 'inventory' && <><th>SKU</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Reorder</th><th>Status</th></>}
                    {reportData.type === 'transactions' && <><th>Product</th><th>Type</th><th>Qty</th><th>User</th><th>Date</th><th>Notes</th></>}
                    {reportData.type === 'users' && <><th>Username</th><th>Email</th><th>Role</th><th>Joined</th></>}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      {reportData.type === 'inventory' && (
                        <>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{row.sku}</td>
                          <td style={{ fontWeight: 600 }}>{row.name}</td>
                          <td><span className="badge badge-info">{row.category}</span></td>
                          <td>${row.price?.toFixed(2)}</td>
                          <td style={{ fontWeight: 700, color: row.current_stock <= row.reorder_level ? 'var(--accent-red)' : 'var(--accent-green)' }}>{row.current_stock}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{row.reorder_level}</td>
                          <td>{row.current_stock <= row.reorder_level
                            ? <span className="badge badge-danger"><AlertCircle size={11} /> Low</span>
                            : <span className="badge badge-success">OK</span>}</td>
                        </>
                      )}
                      {reportData.type === 'transactions' && (
                        <>
                          <td style={{ fontWeight: 600 }}>{row.product_name}</td>
                          <td><span className={`badge ${row.transaction_type === 'in' ? 'badge-success' : 'badge-danger'}`}>{row.transaction_type}</span></td>
                          <td style={{ fontWeight: 700 }}>{row.quantity}</td>
                          <td>{row.username}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(row.created_at).toLocaleString()}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{row.notes || '-'}</td>
                        </>
                      )}
                      {reportData.type === 'users' && (
                        <>
                          <td style={{ fontWeight: 600 }}>{row.username}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{row.email}</td>
                          <td><span className={`badge ${row.role === 'admin' ? 'badge-purple' : 'badge-info'}`}>{row.role}</span></td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.rows?.length > 50 && (
                <div style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, borderTop: '1px solid var(--border)' }}>
                  Showing 50 of {reportData.rows.length} records — Export CSV for full report
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}