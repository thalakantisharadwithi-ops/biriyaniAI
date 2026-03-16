import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface RoiPoint {
  duration: string;
  roi: number;
}

export default function RoiVsDuration({ data }: { data: RoiPoint[] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">
        <span className="title-dot" />
        ROI vs Duration
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff006e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ff006e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="duration"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => v + 'x'}
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
            formatter={(value: any) => [value + 'x', 'ROI']}
          />
          <Area
            type="monotone"
            dataKey="roi"
            fill="url(#roiGradient)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="roi"
            stroke="#ff006e"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, stroke: '#ff006e', strokeWidth: 0, fill: '#ff006e' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
