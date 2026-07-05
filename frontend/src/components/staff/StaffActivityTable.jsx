export default function StaffActivityTable({ transactions }) {
  const formatDate = (iso) => {
    if (!iso) return { date: '-', time: '-' };
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString(),
    };
  };

  return (
    <div className="table-container card">
      <h3>My Activities</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Type</th>
            <th>Date</th>
            <th>Time</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan={6} className="empty-row">No activities yet</td></tr>
          ) : (
            transactions.map((t) => {
              const { date, time } = formatDate(t.created_at);
              return (
                <tr key={t.id}>
                  <td>{t.product_name}</td>
                  <td>{t.quantity}</td>
                  <td>
                    <span className={`badge badge-${t.transaction_type === 'in' ? 'success' : 'danger'}`}>
                      {t.transaction_type === 'in' ? 'IN' : 'OUT'}
                    </span>
                  </td>
                  <td>{date}</td>
                  <td>{time}</td>
                  <td>{t.notes || '—'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
