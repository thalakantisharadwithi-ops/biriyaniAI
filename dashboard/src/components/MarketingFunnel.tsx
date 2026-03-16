import './MarketingFunnel.css';

interface FunnelData {
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
}

const formatNum = (n: number) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000
      ? (n / 1_000).toFixed(1) + 'K'
      : n.toString();

const BERRIES_SHADES = ['#ff006e', '#ff4d00', '#900c3f', '#3a0ca3'];

export default function MarketingFunnel({ data }: { data: FunnelData }) {
  const stages = [
    { label: 'Impressions', value: data.impressions },
    { label: 'Clicks', value: data.clicks },
    { label: 'Leads', value: data.leads },
    { label: 'Conversions', value: data.conversions },
  ];

  const maxWidth = 100; // percentage
  const minWidth = 30;

  return (
    <div className="chart-card">
      <div className="chart-card-title">
        <span className="title-dot" />
        Campaign Funnel
      </div>
      <div className="funnel-container">
        {stages.map((stage, idx) => {
          const topWidthPct = maxWidth - ((maxWidth - minWidth) / (stages.length - 1)) * idx;
          const bottomWidthPct =
            idx < stages.length - 1
              ? maxWidth - ((maxWidth - minWidth) / (stages.length - 1)) * (idx + 1)
              : minWidth;

          const rate =
            idx > 0
              ? ((stage.value / stages[idx - 1].value) * 100).toFixed(1) + '%'
              : null;

          return (
            <div
              key={stage.label}
              className="funnel-stage"
              style={{ width: `${topWidthPct}%` }}
            >
              <svg
                className="funnel-stage-bg"
                viewBox="0 0 200 60"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon
                  points={`${((200 - (topWidthPct / maxWidth) * 200) / 2)},0 ${200 - ((200 - (topWidthPct / maxWidth) * 200) / 2)},0 ${200 - ((200 - (bottomWidthPct / maxWidth) * 200) / 2)},60 ${((200 - (bottomWidthPct / maxWidth) * 200) / 2)},60`}
                  fill={BERRIES_SHADES[idx]}
                  rx="4"
                />
              </svg>
              <div className="funnel-stage-content">
                <span className="funnel-stage-label">{stage.label}</span>
                <span className="funnel-stage-value">{formatNum(stage.value)}</span>
                {rate && <span className="funnel-stage-rate">↓ {rate}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
