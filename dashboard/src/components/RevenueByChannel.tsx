import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChannelData {
  channel: string;
  revenue: number;
}

const COLORS = ['#ff006e', '#ff4d00', '#900c3f', '#3a0ca3', '#ff66a3', '#cc0058'];

const formatRevenue = (v: number) =>
  '₹' + (v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'K');

export default function RevenueByChannel({ data }: { data: ChannelData[] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">
        <span className="title-dot" />
        Revenue by Channel
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="channel"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatRevenue}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
            }}
            formatter={(value: number) => [formatRevenue(value), 'Revenue']}
            cursor={{ fill: 'rgba(255, 0, 110, 0.08)' }}
          />
          <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={48}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
