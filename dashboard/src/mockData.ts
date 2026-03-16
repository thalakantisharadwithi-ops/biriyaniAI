/* ─── Enriched Campaign-Level Mock Data ─── */

export interface Campaign {
  id: number;
  name: string;
  channel: string;
  campaignType: string;
  language: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  revenue: number;
  spend: number;
  roi: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  audience: string;
  segment: string;
}

export const CHANNELS = ['Social Media', 'Email', 'Paid Search', 'Display Ads', 'Influencer', 'Affiliate'] as const;
export const CAMPAIGN_TYPES = ['Brand Awareness', 'Lead Generation', 'Retargeting', 'Product Launch', 'Seasonal'] as const;
export const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Marathi', 'Bengali'] as const;
export const AUDIENCES = ['Gen Z (18–24)', 'Millennials (25–34)', 'Gen X (35–44)', 'Boomers (45–54)', 'Premium Shoppers'] as const;
export const SEGMENTS = ['Beauty', 'Skincare', 'Wellness', 'Fashion'] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

const campaigns: Campaign[] = Array.from({ length: 142 }, (_, i) => {
  const channel = pick(CHANNELS, i);
  const campaignType = pick(CAMPAIGN_TYPES, i + 2);
  const language = pick(LANGUAGES, i + 1);
  const audience = pick(AUDIENCES, i + 3);
  const segment = pick(SEGMENTS, i);
  const durationWeeks = [1, 2, 4, 8, 12, 24, 36, 52][i % 8];
  const baseRevenue = 40_000 + (i * 7919) % 200_000;
  const spend = baseRevenue * (0.2 + (i % 5) * 0.08);
  const roi = +(baseRevenue / spend).toFixed(2);
  const impressions = 3000 + (i * 3571) % 30_000;
  const clicks = Math.round(impressions * (0.08 + (i % 10) * 0.015));
  const leads = Math.round(clicks * (0.15 + (i % 7) * 0.03));
  const conversions = Math.round(leads * (0.12 + (i % 5) * 0.04));

  const monthOffset = i % 12;
  const startDate = `2025-${String(monthOffset + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
  const endMs = new Date(startDate).getTime() + durationWeeks * 7 * 86400000;
  const endDate = new Date(endMs).toISOString().slice(0, 10);

  return {
    id: i + 1,
    name: `Campaign ${i + 1}`,
    channel,
    campaignType,
    language,
    startDate,
    endDate,
    durationWeeks,
    revenue: baseRevenue,
    spend,
    roi,
    impressions,
    clicks,
    leads,
    conversions,
    audience,
    segment,
  };
});

export default campaigns;
