import { useState, useEffect, useRef } from 'react';
import './SegmentTable.css';

export interface SegmentRow {
  targetAudience: string;
  customerSegment: string;
  count: number;
}

export default function SegmentTable({ data }: { data: SegmentRow[] }) {
  // Debounce: only render table content after 500ms of stable data
  const [rendered, setRendered] = useState<SegmentRow[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Replace rendered content entirely (not append)
      setRendered([...data]);
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data]);

  if (rendered.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-card-title">
          <span className="title-dot" />
          Target Audience vs Customer Segment
        </div>
        <div className="segment-empty">No data</div>
      </div>
    );
  }

  // Show only first 6 rows, already sorted by count desc from App.tsx
  const topRows = rendered.slice(0, 6);
  // Calculate total across all data to get accurate percentages
  const totalCount = rendered.reduce((sum, r) => sum + r.count, 0);
  const maxPct = Math.max(...topRows.map((r) => (r.count / totalCount) * 100));

  return (
    <div className="chart-card">
      <div className="chart-card-title">
        <span className="title-dot" />
        Target Audience vs Customer Segment
      </div>
      <div className="segment-table-wrapper">
        <table className="segment-table">
          <thead>
            <tr>
              <th>Target Audience</th>
              <th>Customer Segment</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {topRows.map((row) => (
              <tr key={`${row.targetAudience}-${row.customerSegment}`}>
                <td>{row.targetAudience}</td>
                <td>{row.customerSegment}</td>
                <td>
                  <div className="segment-cell-bar">
                    <div className="segment-bar-track">
                      <div
                        className="segment-bar-fill"
                        style={{ width: `${((row.count / totalCount) * 100 / maxPct) * 100}%` }}
                      />
                    </div>
                    <span className="segment-bar-value">{((row.count / totalCount) * 100).toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="segment-footer">Showing top segments</span>
    </div>
  );
}
