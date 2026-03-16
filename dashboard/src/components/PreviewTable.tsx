import type { Campaign } from '../mockData';
import './PreviewTable.css';

const DISPLAY_COLS: (keyof Campaign)[] = [
  'id', 'name', 'channel', 'campaignType', 'language', 'revenue', 'roi', 'impressions', 'clicks', 'leads', 'conversions',
];

const LABELS: Record<string, string> = {
  id: '#',
  name: 'Campaign',
  channel: 'Channel',
  campaignType: 'Type',
  language: 'Lang',
  revenue: 'Revenue',
  roi: 'ROI',
  impressions: 'Impr.',
  clicks: 'Clicks',
  leads: 'Leads',
  conversions: 'Conv.',
};

function formatCell(key: string, val: unknown): string {
  if (key === 'revenue') {
    const n = Number(val);
    return '₹' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n.toLocaleString('en-IN'));
  }
  if (key === 'roi') return val + 'x';
  return String(val);
}

export default function PreviewTable({ data, total }: { data: Campaign[]; total: number }) {
  const preview = data.slice(0, 5);

  return (
    <div className="chart-card preview-section">
      <div className="chart-card-title">
        <span className="title-dot" />
        Dataset Preview
        <span className="preview-badge">
          Showing {preview.length} of {total} rows
        </span>
      </div>
      <div className="preview-table-wrapper">
        <table className="preview-table">
          <thead>
            <tr>
              {DISPLAY_COLS.map((col) => (
                <th key={col}>{LABELS[col] || col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i}>
                {DISPLAY_COLS.map((col) => (
                  <td key={col}>{formatCell(col, row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
