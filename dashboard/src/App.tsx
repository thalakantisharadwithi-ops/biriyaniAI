import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import Sidebar, { type Filters } from './components/Sidebar';
import KpiCards from './components/KpiCards';
import RevenueByChannel from './components/RevenueByChannel';
import RoiVsDuration from './components/RoiVsDuration';
import MarketingFunnel from './components/MarketingFunnel';
import SegmentTable from './components/SegmentTable';
import PreviewTable from './components/PreviewTable';
import ChatPanel from './components/ChatPanel';
import ToastContainer, { createToast, type ToastMessage } from './components/Toast';
import defaultCampaigns, { type Campaign } from './mockData';

/* ─── Required CSV columns ─── */
const REQUIRED_COLS = [
  'Channel_Used', 'Campaign_Type', 'Language', 'Revenue', 'ROI',
  'Impressions', 'Clicks', 'Leads', 'Conversions',
];

/* ─── CSV parser ─── */
function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(',');
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
    return obj;
  });
}

function csvRowToCampaign(row: Record<string, string>, index: number): Campaign {
  const durationWeeks = parseInt(row['Duration_weeks'] || row['Duration'] || '4', 10) || 4;
  return {
    id: index + 1,
    name: row['Campaign_Name'] || row['Name'] || `Campaign ${index + 1}`,
    channel: row['Channel_Used'] || 'Unknown',
    campaignType: row['Campaign_Type'] || 'Unknown',
    language: row['Language'] || 'English',
    startDate: row['Start_Date'] || row['Date'] || '2025-01-01',
    endDate: row['End_Date'] || '2025-12-31',
    durationWeeks,
    revenue: parseFloat(row['Revenue'] || '0') || 0,
    spend: parseFloat(row['Spend'] || row['Budget'] || '0') || 0,
    roi: parseFloat(row['ROI'] || '0') || 0,
    impressions: parseInt(row['Impressions'] || '0', 10) || 0,
    clicks: parseInt(row['Clicks'] || '0', 10) || 0,
    leads: parseInt(row['Leads'] || '0', 10) || 0,
    conversions: parseInt(row['Conversions'] || '0', 10) || 0,
    audience: row['Target_Audience'] || row['Audience'] || 'Unknown',
    segment: row['Customer_Segment'] || row['Segment'] || 'Unknown',
  };
}

/* ─── Stagger animation ─── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function App() {
  const [csvData, setCsvData] = useState<Campaign[] | null>(null);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [filters, setFilters] = useState<Filters>({
    channel: '',
    campaignType: '',
    language: '',
    dateFrom: '',
    dateTo: '',
  });

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    setToasts((prev) => [...prev, createToast(text, type)]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ─── CSV Upload handler ─── */
  const handleFileSelected = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || !text.trim()) {
        addToast('Dataset empty', 'error');
        return;
      }

      const rows = parseCsvText(text);
      if (rows.length === 0) {
        addToast('Dataset empty', 'error');
        return;
      }

      // Validate required columns
      const headers = Object.keys(rows[0]);
      const missing = REQUIRED_COLS.filter((col) => !headers.includes(col));
      if (missing.length > 0) {
        addToast(`Invalid dataset format. Missing columns: ${missing.join(', ')}`, 'error');
        return;
      }

      // Send raw parsed rows to backend for insights
      fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset: rows }),
      }).catch((err) => console.error('Failed to upload dataset to backend:', err));

      const campaigns = rows.map((r, i) => csvRowToCampaign(r, i));
      setCsvData(campaigns);
      setCsvLoaded(true);
      addToast(`Loaded ${campaigns.length} campaigns from CSV`, 'success');
    };
    reader.onerror = () => addToast('Failed to read file', 'error');
    reader.readAsText(file);
  }, [addToast]);

  const handleApplyFilters = useCallback((f: Filters) => {
    setFilters(f);
  }, []);

  /* ─── Data source: uploaded CSV or mock ─── */
  const source = csvData || defaultCampaigns;

  /* ─── Filtered dataset ─── */
  const filtered = useMemo(() => {
    return source.filter((c) => {
      if (filters.channel && c.channel !== filters.channel) return false;
      if (filters.campaignType && c.campaignType !== filters.campaignType) return false;
      if (filters.language && c.language !== filters.language) return false;
      if (filters.dateFrom && c.startDate < filters.dateFrom) return false;
      if (filters.dateTo && c.endDate > filters.dateTo) return false;
      return true;
    });
  }, [source, filters]);

  /* ─── Derive KPIs ─── */
  const kpiData = useMemo(() => {
    const totalRevenue = filtered.reduce((s, c) => s + c.revenue, 0);
    const totalRoi = filtered.length ? +(filtered.reduce((s, c) => s + c.roi, 0)) : 0;
    const totalConversions = filtered.reduce((s, c) => s + c.conversions, 0);
    
    // Find best segment (highest total revenue)
    const segmentRevMap = new Map<string, number>();
    filtered.forEach(c => segmentRevMap.set(c.segment, (segmentRevMap.get(c.segment) || 0) + c.revenue));
    let bestSeg = 'None';
    let maxRev = -1;
    segmentRevMap.forEach((rev, seg) => {
      if (rev > maxRev) { maxRev = rev; bestSeg = seg; }
    });

    return { totalRevenue, totalRoi, totalConversions, bestSegment: bestSeg };
  }, [filtered]);

  /* ─── Revenue by Channel ─── */
  const revenueByChannel = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((c) => map.set(c.channel, (map.get(c.channel) || 0) + c.revenue));
    return Array.from(map, ([channel, revenue]) => ({ channel, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  /* ─── ROI vs Duration ─── */
  const roiVsDuration = useMemo(() => {
    const durationLabels: Record<number, string> = { 1: '1W', 2: '2W', 4: '1M', 8: '2M', 12: '3M', 24: '6M', 36: '9M', 52: '12M' };
    const map = new Map<string, { sum: number; count: number }>();
    filtered.forEach((c) => {
      const label = durationLabels[c.durationWeeks] || `${c.durationWeeks}W`;
      const prev = map.get(label) || { sum: 0, count: 0 };
      map.set(label, { sum: prev.sum + c.roi, count: prev.count + 1 });
    });
    const order = ['1W', '2W', '1M', '2M', '3M', '6M', '9M', '12M'];
    return order
      .filter((d) => map.has(d))
      .map((d) => {
        const v = map.get(d)!;
        return { duration: d, roi: +(v.sum / v.count).toFixed(2) };
      });
  }, [filtered]);

  /* ─── Funnel ─── */
  const funnelData = useMemo(() => ({
    impressions: filtered.reduce((s, c) => s + c.impressions, 0),
    clicks: filtered.reduce((s, c) => s + c.clicks, 0),
    leads: filtered.reduce((s, c) => s + c.leads, 0),
    conversions: filtered.reduce((s, c) => s + c.conversions, 0),
  }), [filtered]);

  /* ─── Segment Table (pivot matrix, single-pass, no duplicates) ─── */
  const segmentData = useMemo(() => {
    // Clear pivot matrix each time
    const pivot = new Map<string, { displayAudience: string; displaySegment: string; count: number }>();

    // Single pass through filtered data
    for (let i = 0; i < filtered.length; i++) {
      const c = filtered[i];
      const rawAudience = (c.audience || '').trim();
      const rawSegment = (c.segment || '').trim();
      // Skip rows with missing values
      if (!rawAudience || !rawSegment) continue;

      // Lowercase key for grouping (prevents duplicates from case mismatch)
      const normKey = `${rawAudience.toLowerCase()}|||${rawSegment.toLowerCase()}`;

      const existing = pivot.get(normKey);
      if (existing) {
        existing.count += 1;
      } else {
        pivot.set(normKey, { displayAudience: rawAudience, displaySegment: rawSegment, count: 1 });
      }
    }

    // Build result array once, sorted by count descending
    return Array.from(pivot.values())
      .filter((v) => v.displayAudience.toLowerCase() !== 'unknown' && v.displaySegment.toLowerCase() !== 'unknown')
      .map((v) => ({
        targetAudience: v.displayAudience,
        customerSegment: v.displaySegment,
        count: v.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  return (
    <div className="app-layout">
      <Sidebar
        onApplyFilters={handleApplyFilters}
        onFileSelected={handleFileSelected}
        csvLoaded={csvLoaded}
      />

      <main className="main-content">
        {/* Header */}
        <motion.header
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>
            <BarChart3 size={26} className="logo-icon" />
            Nykaa Marketing Intelligence Dashboard
          </h1>
          <span className="header-badge">{csvLoaded ? 'CSV Data' : 'Live'}</span>
        </motion.header>

        {/* Dashboard sections */}
        <motion.div variants={stagger} initial="hidden" animate="show" key={JSON.stringify(filters) + (csvLoaded ? 'csv' : 'mock')}>
          <motion.div variants={fadeUp}>
            <KpiCards data={kpiData as any} />
          </motion.div>

          {/* Row 1: Bar & Line */}
          <motion.div className="chart-grid" variants={fadeUp} style={{ marginTop: '1.5rem' }}>
            <RevenueByChannel data={revenueByChannel} />
            <RoiVsDuration data={roiVsDuration} />
          </motion.div>

          {/* Row 2: Funnel & Segment Analysis */}
          <motion.div className="chart-grid" variants={fadeUp} style={{ marginTop: '1.5rem' }}>
            <MarketingFunnel data={funnelData} />
            <SegmentTable data={segmentData} />
          </motion.div>

          {/* Preview Table — only when CSV is loaded */}
          {csvLoaded && csvData && (
            <motion.div variants={fadeUp} style={{ marginTop: '1.5rem' }}>
              <PreviewTable data={csvData} total={csvData.length} />
            </motion.div>
          )}

          {/* CampaignIQ Assistant — inline section below charts */}
          <motion.div variants={fadeUp} style={{ marginTop: '1.5rem' }}>
            <ChatPanel data={filtered.length > 0 ? filtered : null} />
          </motion.div>
        </motion.div>
      </main>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
