import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import NotificationToast from '../components/NotificationToast';
import StockOperationsForm from '../components/staff/StockOperationsForm';
import StaffActivityTable from '../components/staff/StaffActivityTable';
import StockLevelTable from '../components/staff/StockLevelTable';
import { productsAPI, stockAPI, activityAPI, reportsAPI } from '../services/api';

const TABS = ['operations', 'activities', 'stock', 'summary'];

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('operations');
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [toast, setToast] = useState(null);

  const loadProducts = useCallback(async () => {
    const { data } = await productsAPI.getAll();
    setProducts(data.products || []);
  }, []);

  const loadActivities = useCallback(async () => {
    const { data } = await activityAPI.getMyActivities();
    setTransactions(data.transactions || []);
  }, []);

  const loadSummary = useCallback(async () => {
    const [sumRes, actRes] = await Promise.all([
      reportsAPI.stockSummary(),
      activityAPI.getMyActivities(),
    ]);
    setSummary(sumRes.data);
    const txns = actRes.data.transactions || [];
    setTransactions(txns);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    if (activeTab === 'activities') {
      loadActivities();
      const interval = setInterval(loadActivities, 5000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'summary') loadSummary();
  }, [activeTab, loadActivities, loadSummary]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleStockIn = async (payload) => {
    try {
      const { data } = await stockAPI.stockIn(payload);
      showToast(data.message);
      loadProducts();
      loadActivities();
    } catch (err) {
      showToast(err.response?.data?.message || 'Stock in failed', 'error');
    }
  };

  const handleStockOut = async (payload) => {
    try {
      const { data } = await stockAPI.stockOut(payload);
      showToast(data.message);
      loadProducts();
      loadActivities();
    } catch (err) {
      showToast(err.response?.data?.message || 'Stock out failed', 'error');
    }
  };

  const myTxnCount = transactions.length;
  const lastActivity = transactions[0];

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-content">
        <h2>Staff Dashboard</h2>

        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'operations' && 'Stock Operations'}
              {tab === 'activities' && 'My Activities'}
              {tab === 'stock' && 'Stock Levels'}
              {tab === 'summary' && 'Summary'}
            </button>
          ))}
        </div>

        {activeTab === 'operations' && (
          <StockOperationsForm products={products} onStockIn={handleStockIn} onStockOut={handleStockOut} />
        )}
        {activeTab === 'activities' && <StaffActivityTable transactions={transactions} />}
        {activeTab === 'stock' && <StockLevelTable products={products} />}
        {activeTab === 'summary' && (
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-label">Total Products</span><span className="stat-value">{summary.total_products || 0}</span></div>
            <div className="stat-card"><span className="stat-label">Total Stock Units</span><span className="stat-value">{summary.total_units || 0}</span></div>
            <div className="stat-card"><span className="stat-label">My Transactions</span><span className="stat-value">{myTxnCount}</span></div>
            <div className="stat-card">
              <span className="stat-label">Last Activity</span>
              <span className="stat-value stat-value-sm">
                {lastActivity ? `${lastActivity.product_name} (${lastActivity.transaction_type})` : 'None'}
              </span>
            </div>
          </div>
        )}
      </div>

      {toast && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
