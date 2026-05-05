import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Printer, TrendingUp, Package, Users, Eye } from 'lucide-react';

function AdminReports() {
  const [reportType, setReportType] = useState('inventory');
  const [dateRange, setDateRange] = useState('week');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (reportType === 'inventory') {
        const response = await fetch('http://localhost:5000/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setReportData(data);
      } else if (reportType === 'transactions') {
        const response = await fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Filter by date range
        let filteredData = data;
        const now = new Date();
        if (dateRange === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          filteredData = data.filter(t => new Date(t.timestamp) > weekAgo);
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          filteredData = data.filter(t => new Date(t.timestamp) > monthAgo);
        } else if (dateRange === 'year') {
          const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
          filteredData = data.filter(t => new Date(t.timestamp) > yearAgo);
        }
        
        setReportData(filteredData);
      } else if (reportType === 'users') {
        const response = await fetch('http://localhost:5000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setReportData(data);
      } else if (reportType === 'summary') {
        // Summary report combining multiple data sources
        const productsRes = await fetch('http://localhost:5000/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersRes = await fetch('http://localhost:5000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const transactionsRes = await fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const products = await productsRes.json();
        const users = await usersRes.json();
        const transactions = await transactionsRes.json();
        
        const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
        const lowStockCount = products.filter(p => p.quantity <= p.reorder_level).length;
        
        setReportData({
          summary: {
            totalProducts: products.length,
            totalUsers: users.length,
            totalTransactions: transactions.length,
            totalInventoryValue: totalValue,
            lowStockItems: lowStockCount,
            branches: [...new Set(products.map(p => p.branch))].length
          },
          details: {
            products: products.slice(0, 10),
            recentTransactions: transactions.slice(0, 10)
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    let headers = [];
    let data = [];
    
    if (reportType === 'inventory') {
      headers = ['SKU', 'Name', 'Quantity', 'Unit Price', 'Location', 'Branch', 'Status'];
      data = reportData.map(item => [
        item.sku, item.name, item.quantity, item.unit_price, 
        item.location || 'N/A', item.branch, 
        item.quantity <= item.reorder_level ? 'Low Stock' : 'In Stock'
      ]);
    } else if (reportType === 'transactions') {
      headers = ['Product', 'Type', 'Quantity', 'User', 'Date', 'Remarks'];
      data = reportData.map(item => [
        item.product_name, item.type, item.quantity, item.user_name, 
        new Date(item.timestamp).toLocaleString(), item.remarks || ''
      ]);
    } else if (reportType === 'users') {
      headers = ['Name', 'Email', 'Employee ID', 'Role', 'Branch'];
      data = reportData.map(item => [
        item.name, item.email, item.employee_id, item.role, item.branch
      ]);
    } else if (reportType === 'summary') {
      headers = ['Metric', 'Value'];
      data = [
        ['Total Products', reportData.summary.totalProducts],
        ['Total Users', reportData.summary.totalUsers],
        ['Total Transactions', reportData.summary.totalTransactions],
        ['Total Inventory Value', `$${reportData.summary.totalInventoryValue.toLocaleString()}`],
        ['Low Stock Items', reportData.summary.lowStockItems],
        ['Active Branches', reportData.summary.branches]
      ];
    }
    
    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    if (!reportData) return;
    
    let headers = [];
    let data = [];
    let title = '';
    
    if (reportType === 'inventory') {
      headers = ['SKU', 'Name', 'Quantity', 'Unit Price', 'Location', 'Branch', 'Status'];
      data = reportData.map(item => [
        item.sku, item.name, item.quantity, `$${item.unit_price}`, 
        item.location || 'N/A', item.branch, 
        item.quantity <= item.reorder_level ? 'Low Stock' : 'In Stock'
      ]);
      title = 'INVENTORY REPORT';
    } else if (reportType === 'transactions') {
      headers = ['Product', 'Type', 'Quantity', 'User', 'Date', 'Remarks'];
      data = reportData.map(item => [
        item.product_name, item.type, item.quantity, item.user_name, 
        new Date(item.timestamp).toLocaleString(), item.remarks || ''
      ]);
      title = 'TRANSACTION REPORT';
    } else if (reportType === 'users') {
      headers = ['Name', 'Email', 'Employee ID', 'Role', 'Branch'];
      data = reportData.map(item => [
        item.name, item.email, item.employee_id, item.role, item.branch
      ]);
      title = 'USER REPORT';
    } else if (reportType === 'summary') {
      title = 'SUMMARY REPORT';
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              margin: 40px; 
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #667eea;
            }
            h1 { 
              color: #667eea; 
              margin: 0;
              font-size: 28px;
            }
            .company-name {
              color: #666;
              margin-top: 5px;
              font-size: 14px;
            }
            .report-info {
              margin: 20px 0;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              font-size: 12px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 10px; 
              text-align: left; 
            }
            th { 
              background-color: #667eea; 
              color: white; 
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #999;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DARK WAREHOUSE</h1>
            <div class="company-name">${title}</div>
          </div>
          <div class="report-info">
            <strong>Generated on:</strong> ${new Date().toLocaleString()}<br>
            <strong>Report Type:</strong> ${reportType.toUpperCase()}<br>
            <strong>Total Records:</strong> ${reportType === 'summary' ? '1' : data.length}
          </div>
          ${reportType === 'summary' ? `
            <div class="summary-stats">
              <h3>System Summary</h3>
              <ul>
                <li>Total Products: ${reportData.summary.totalProducts}</li>
                <li>Total Users: ${reportData.summary.totalUsers}</li>
                <li>Total Transactions: ${reportData.summary.totalTransactions}</li>
                <li>Total Inventory Value: $${reportData.summary.totalInventoryValue.toLocaleString()}</li>
                <li>Low Stock Items: ${reportData.summary.lowStockItems}</li>
                <li>Active Branches: ${reportData.summary.branches}</li>
              </ul>
              <h3>Top Products</h3>
              <td>
                <thead><tr><th>Name</th><th>Quantity</th><th>Price</th></tr></thead>
                <tbody>
                  ${reportData.details.products.map(p => `
                    <tr><td>${p.name}</td><td>${p.quantity}</td><td>$${p.unit_price}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <table>
              <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          `}
          <div class="footer">
            This is a computer-generated report. For any queries, please contact system administrator.
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const previewReport = () => {
    setShowPreview(true);
  };

  return (
    <div className="admin-reports">
      <div className="reports-header">
        <h2>📊 Reports & Analytics</h2>
        <p>Generate and export detailed reports about your warehouse operations</p>
      </div>
      
      <div className="report-controls">
        <div className="control-group">
          <label>📄 Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="inventory">📦 Inventory Report</option>
            <option value="transactions">🔄 Transaction Report</option>
            <option value="users">👥 User Report</option>
            <option value="summary">📈 Summary Report</option>
          </select>
        </div>

        {reportType === 'transactions' && (
          <div className="control-group">
            <label>📅 Date Range:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        )}

        <div className="control-buttons">
          <button className="btn-generate" onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          
          {reportData && (
            <>
              <button className="btn-preview" onClick={previewReport}>
                <Eye size={16} /> Preview
              </button>
              <button className="btn-export" onClick={exportToCSV}>
                <Download size={16} /> Export CSV
              </button>
              <button className="btn-print" onClick={printReport}>
                <Printer size={16} /> Print
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Generating your report...</p>
        </div>
      )}

      {reportData && !loading && (
        <div className="report-preview">
          <div className="report-header">
            <h3>Report Preview</h3>
            <div className="report-stats">
              <span>Total Records: {reportType === 'summary' ? 'Summary Data' : reportData.length}</span>
              <span>Generated: {new Date().toLocaleString()}</span>
            </div>
          </div>
          
          <div className="report-table-container">
            {reportType === 'inventory' && (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Location</th>
                    <th>Branch</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 20).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.sku}</td>
                      <td>{item.name}</td>
                      <td className={item.quantity <= item.reorder_level ? 'text-danger' : ''}>
                        {item.quantity}
                      </td>
                      <td>${item.unit_price}</td>
                      <td>{item.location || 'N/A'}</td>
                      <td>{item.branch}</td>
                      <td>
                        <span className={`status-badge ${item.quantity <= item.reorder_level ? 'warning' : 'success'}`}>
                          {item.quantity <= item.reorder_level ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'transactions' && (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 20).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product_name}</td>
                      <td>
                        <span className={`type-badge ${item.type}`}>
                          {item.type === 'stock-in' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{item.user_name}</td>
                      <td>{new Date(item.timestamp).toLocaleString()}</td>
                      <td>{item.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'users' && (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Employee ID</th>
                    <th>Role</th>
                    <th>Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.employee_id}</td>
                      <td>
                        <span className={`role-badge ${item.role}`}>
                          {item.role}
                        </span>
                      </td>
                      <td>{item.branch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'summary' && (
              <div className="summary-report">
                <div className="summary-cards">
                  <div className="summary-card">
                    <Package size={32} />
                    <h3>{reportData.summary.totalProducts}</h3>
                    <p>Total Products</p>
                  </div>
                  <div className="summary-card">
                    <Users size={32} />
                    <h3>{reportData.summary.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                  <div className="summary-card">
                    <FileText size={32} />
                    <h3>{reportData.summary.totalTransactions}</h3>
                    <p>Transactions</p>
                  </div>
                  <div className="summary-card">
                    <TrendingUp size={32} />
                    <h3>${reportData.summary.totalInventoryValue.toLocaleString()}</h3>
                    <p>Inventory Value</p>
                  </div>
                </div>
                
                <h3>Top Products</h3>
                <table className="report-table">
                  <thead><tr><th>Product Name</th><th>Quantity</th><th>Price</th></tr></thead>
                  <tbody>
                    {reportData.details.products.map((p, idx) => (
                      <tr key={idx}><td>{p.name}</td><td>{p.quantity}</td><td>${p.unit_price}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportData.length > 20 && (
              <div className="report-note">
                <p>Showing first 20 records out of {reportData.length}. Export to CSV or Print for full report.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!reportData && !loading && (
        <div className="report-placeholder">
          <FileText size={64} />
          <h3>No Report Generated</h3>
          <p>Select a report type and click "Generate Report" to view data</p>
        </div>
      )}

      {showPreview && reportData && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Preview - {reportType.toUpperCase()}</h3>
              <button className="close-btn" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="report-table-container">
                {reportType === 'inventory' && (
                  <table className="report-table">
                    <thead><tr><th>SKU</th><th>Name</th><th>Quantity</th><th>Price</th><th>Branch</th></tr></thead>
                    <tbody>
                      {reportData.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.sku}</td><td>{item.name}</td><td>{item.quantity}</td>
                          <td>${item.unit_price}</td><td>{item.branch}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {reportType === 'transactions' && (
                  <table className="report-table">
                    <thead><tr><th>Product</th><th>Type</th><th>Quantity</th><th>User</th><th>Date</th></tr></thead>
                    <tbody>
                      {reportData.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.product_name}</td>
                          <td>{item.type}</td><td>{item.quantity}</td>
                          <td>{item.user_name}</td>
                          <td>{new Date(item.timestamp).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-export" onClick={exportToCSV}>Export CSV</button>
              <button className="btn-print" onClick={printReport}>Print</button>
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports; 