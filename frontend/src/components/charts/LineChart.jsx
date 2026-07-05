import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LineChart({ data, lines = [{ key: 'stock_in', color: '#27AE60', name: 'Stock In' }, { key: 'stock_out', color: '#E74C3C', name: 'Stock Out' }] }) {
  if (!data?.length) return <div className="chart-empty">No data available</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLine data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} name={l.name} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </RechartsLine>
    </ResponsiveContainer>
  );
}
