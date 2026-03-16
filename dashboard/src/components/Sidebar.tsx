import { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Megaphone,
  BarChart3,
  FileText,
  SlidersHorizontal,
  Zap,
  Filter,
  Upload,
} from 'lucide-react';
import { CHANNELS, CAMPAIGN_TYPES, LANGUAGES } from '../mockData';
import './Sidebar.css';

export interface Filters {
  channel: string;
  campaignType: string;
  language: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: Filters = {
  channel: '',
  campaignType: '',
  language: '',
  dateFrom: '',
  dateTo: '',
};

interface SidebarProps {
  onApplyFilters: (filters: Filters) => void;
  onFileSelected: (file: File) => void;
  csvLoaded: boolean;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
] as const;

export default function Sidebar({ onApplyFilters, onFileSelected, csvLoaded }: SidebarProps) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [draft, setDraft] = useState<Filters>({ ...emptyFilters });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCount = [draft.channel, draft.campaignType, draft.language, draft.dateFrom, draft.dateTo].filter(Boolean).length;

  const handleApply = () => onApplyFilters(draft);

  const handleReset = () => {
    const reset = { ...emptyFilters };
    setDraft(reset);
    onApplyFilters(reset);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      e.target.value = ''; // allow re-upload
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Zap size={22} className="sidebar-logo-icon" />
        <span className="sidebar-logo-text">CampaignIQ</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menu</span>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item${activeNav === item.id ? ' active' : ''}`}
            onClick={() => setActiveNav(item.id)}
          >
            <item.icon size={18} className="nav-icon" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-divider" />

      {/* Upload */}
      <div className="sidebar-upload">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className="upload-btn" onClick={handleUploadClick}>
          <Upload size={16} />
          Upload Dataset
        </button>
        {csvLoaded && <span className="upload-status">✓ CSV loaded</span>}
      </div>

      <div className="sidebar-divider" />

      {/* Filters */}
      <div className="sidebar-filters">
        <span className="sidebar-section-label">
          <SlidersHorizontal size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Filters
        </span>

        {/* Channel */}
        <div className="filter-group">
          <label className="filter-label">Channel</label>
          <select
            className="filter-select"
            value={draft.channel}
            onChange={(e) => setDraft((d) => ({ ...d, channel: e.target.value }))}
          >
            <option value="">All Channels</option>
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>

        {/* Campaign Type */}
        <div className="filter-group">
          <label className="filter-label">Campaign Type</label>
          <select
            className="filter-select"
            value={draft.campaignType}
            onChange={(e) => setDraft((d) => ({ ...d, campaignType: e.target.value }))}
          >
            <option value="">All Types</option>
            {CAMPAIGN_TYPES.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div className="filter-group">
          <label className="filter-label">Language</label>
          <select
            className="filter-select"
            value={draft.language}
            onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
          >
            <option value="">All Languages</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="filter-group">
          <label className="filter-label">Date Range</label>
          <div className="date-range">
            <input
              type="date"
              className="filter-date"
              value={draft.dateFrom}
              onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
              placeholder="From"
            />
            <input
              type="date"
              className="filter-date"
              value={draft.dateTo}
              onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
              placeholder="To"
            />
          </div>
        </div>

        {/* Apply */}
        <button className="filter-apply-btn" onClick={handleApply}>
          <Filter size={15} />
          Apply Filters
          {activeCount > 0 && <span className="filter-active-count">{activeCount}</span>}
        </button>

        {activeCount > 0 && (
          <button className="filter-reset-btn" onClick={handleReset}>
            Reset all filters
          </button>
        )}
      </div>
    </aside>
  );
}
