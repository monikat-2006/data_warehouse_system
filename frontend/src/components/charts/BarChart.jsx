import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BarChart({ data, bars = [{ key: 'value', color: '#3498DB', name: 'Value' }], xKey = 'name', layout = 'horizontal' }) {
  if (!data?.length) return <div className="chart-empty">No data available</div>;

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBar data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11 }} width={100} />
          <Tooltip />
          <Legend />
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} fill={b.color} name={b.name} radius={[0, 4, 4, 0]} />
          ))}
        </RechartsBar>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBar data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} fill={b.color} name={b.name} radius={[4, 4, 0, 0]} />
        ))}
      </RechartsBar>
    </ResponsiveContainer>
  );
}
