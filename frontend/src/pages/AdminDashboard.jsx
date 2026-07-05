import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import NotificationToast from '../components/NotificationToast';
import DashboardOverview from '../components/admin/DashboardOverview';
import ProductTable from '../components/admin/ProductTable';
import TransactionTable from '../components/admin/TransactionTable';
import AdminActivityTable from '../components/admin/AdminActivityTable';
import StockReportTab from '../components/admin/StockReportTab';
import TrendTab from '../components/admin/TrendTab';
import StaffMetricsTab from '../components/admin/StaffMetricsTab';
import ProductMovementTab from '../components/admin/ProductMovementTab';
import { productsAPI } from '../services/api';

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'transactions', label: 'Transactions', icon: '🔄' },
  { id: 'activities', label: 'Activities', icon: '📋' },
  { id: 'reports', label: 'Reports', icon: '📈' },
];

const REPORT_TABS = [
  { id: 'stock', label: 'Stock Report' },
  { id: 'trends', label: 'Transaction Trends' },
  { id: 'staff', label: 'Staff Performance' },
  { id: 'movement', label: 'Product Movement' },
];

export default function AdminDashboard() {
  const [section, setSection] = useState('dashboard');
  const [reportTab, setReportTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    const { data } = await productsAPI.getAll();
    setProducts(data.products || []);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleAdd = async (payload) => {
    try {
      await productsAPI.create(payload);
      showToast('Product created');
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create product', 'error');
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await productsAPI.update(id, payload);
      showToast('Product updated');
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update product', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id);
      showToast('Product deleted');
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  return (
    <div className="admin-layout">
      <Navbar />
      <div className="admin-body">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`sidebar-item ${section === s.id ? 'active' : ''}`}
              onClick={() => { setSection(s.id); setSidebarOpen(false); }}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </aside>

        <main className="admin-main">
          {section === 'dashboard' && <DashboardOverview />}
          {section === 'products' && (
            <ProductTable products={products} onAdd={handleAdd} onUpdate={handleUpdate} onDelete={handleDelete} />
          )}
          {section === 'transactions' && <TransactionTable />}
          {section === 'activities' && <AdminActivityTable />}
          {section === 'reports' && (
            <div>
              <div className="tabs">
                {REPORT_TABS.map((t) => (
                  <button key={t.id} className={`tab-btn ${reportTab === t.id ? 'active' : ''}`} onClick={() => setReportTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
              {reportTab === 'stock' && <StockReportTab />}
              {reportTab === 'trends' && <TrendTab />}
              {reportTab === 'staff' && <StaffMetricsTab />}
              {reportTab === 'movement' && <ProductMovementTab />}
            </div>
          )}
        </main>
      </div>

      {toast && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
