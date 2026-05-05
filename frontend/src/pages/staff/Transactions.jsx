import { useState, useEffect } from 'react';
import { History, Package, User, Calendar } from 'lucide-react';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    filter === 'all' || t.type === filter
  );

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h2>Transaction History</h2>
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All
          </button>
          <button className={filter === 'stock-in' ? 'active' : ''} onClick={() => setFilter('stock-in')}>
            Stock In
          </button>
          <button className={filter === 'stock-out' ? 'active' : ''} onClick={() => setFilter('stock-out')}>
            Stock Out
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="transactions-list">
          {filteredTransactions.map(transaction => (
            <div key={transaction.id} className="transaction-card">
              <div className={`transaction-icon ${transaction.type}`}>
                {transaction.type === 'stock-in' ? <Package size={24} /> : <Package size={24} />}
              </div>
              <div className="transaction-details">
                <div className="transaction-header">
                  <h4>{transaction.product_name}</h4>
                  <span className={`transaction-type ${transaction.type}`}>
                    {transaction.type === 'stock-in' ? 'Stock In' : 'Stock Out'}
                  </span>
                </div>
                <div className="transaction-info">
                  <div className="info-item">
                    <Package size={14} />
                    <span>Quantity: {transaction.quantity}</span>
                  </div>
                  <div className="info-item">
                    <User size={14} />
                    <span>By: {transaction.user_name}</span>
                  </div>
                  <div className="info-item">
                    <Calendar size={14} />
                    <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                {transaction.remarks && (
                  <p className="transaction-remarks">{transaction.remarks}</p>
                )}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <p className="no-data">No transactions found</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Transactions;