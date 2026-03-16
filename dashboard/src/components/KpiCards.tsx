import { DollarSign, BarChart3, Users, Star } from 'lucide-react';
import './KpiCards.css';

interface KpiData {
  totalRevenue: number;
  totalRoi: number;
  totalConversions: number;
  bestSegment: string;
}

const formatCurrency = (n: number) =>
  '₹' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n.toLocaleString('en-IN'));

export default function KpiCards({ data }: { data: KpiData }) {
  const cards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: <DollarSign size={24} />,
      variant: 'berry', // --berry
    },
    {
      label: 'Total ROI',
      value: `${data.totalRoi.toFixed(0)}x`,
      icon: <BarChart3 size={24} />,
      variant: 'naga', // --naga
    },
    {
      label: 'Conversions',
      value: data.totalConversions.toLocaleString(),
      icon: <Users size={24} />,
      variant: 'ashen', // --ashen
    },
    {
      label: 'Best Segment',
      value: data.bestSegment,
      icon: <Star size={24} />,
      variant: 'vino', // --vino
    },
  ];

  return (
    <div className="kpi-row">
      {cards.map((c) => (
        <div key={c.label} className="card kpi-card">
          <div className={`kpi-icon-wrapper ${c.variant}`}>{c.icon}</div>
          <div className="kpi-info">
            <span className="kpi-label">{c.label}</span>
            <span className="kpi-value">{c.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
