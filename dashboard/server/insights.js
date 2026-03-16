/**
 * Rule-based insight engine for campaign data analysis.
 * Analyzes stored dataset and returns business insight text.
 */

function formatCurrency(n) {
  if (n >= 1_000_000) return '₹' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '₹' + (n / 1_000).toFixed(1) + 'K';
  return '₹' + n.toString();
}

function num(val) {
  return parseFloat(val) || 0;
}

/**
 * Generate a statistical summary of the dataset for the AI prompt.
 */
function createDatasetSummary(data) {
  let totalRev = 0;
  let totalConv = 0;
  const channelRev = {};
  const segmentConv = {};

  data.forEach((r) => {
    const rev = num(r.Revenue);
    const conv = num(r.Conversions);
    const ch = (r.Channel_Used || '').trim();
    const seg = (r.Customer_Segment || '').trim();

    totalRev += rev;
    totalConv += conv;
    if (ch) channelRev[ch] = (channelRev[ch] || 0) + rev;
    if (seg) segmentConv[seg] = (segmentConv[seg] || 0) + conv;
  });

  return {
    totalCampaigns: data.length,
    totalRevenue: totalRev,
    totalConversions: totalConv,
    revenueByChannel: channelRev,
    conversionsBySegment: segmentConv,
    averageROI: data.reduce((s, r) => s + num(r.ROI), 0) / (data.length || 1),
    sampleRow: data[0] || {},
  };
}

/**
 * Fallback rule-based analysis.
 */
function fallbackAnalyze(question, data) {
  const q = question.toLowerCase();

  // ─── Highest revenue channel ───
  if ((q.includes('channel') && q.includes('revenue')) || q.includes('highest revenue')) {
    const map = {};
    data.forEach((r) => {
      const ch = (r.Channel_Used || '').trim();
      if (ch) map[ch] = (map[ch] || 0) + num(r.Revenue);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return 'No channel data available.';
    const [best, val] = entries[0];
    return `**${best}** has the highest revenue at **${formatCurrency(val)}** across ${data.length} campaigns.`;
  }

  // ─── ROI trend ───
  if (q.includes('roi') && (q.includes('trend') || q.includes('show'))) {
    const map = {};
    data.forEach((r) => {
      const weeks = parseInt(r.Duration_weeks || r.Duration || '4', 10) || 4;
      const labels = { 1: '1W', 2: '2W', 4: '1M', 8: '2M', 12: '3M', 24: '6M', 36: '9M', 52: '12M' };
      const label = labels[weeks] || `${weeks}W`;
      if (!map[label]) map[label] = { sum: 0, count: 0 };
      map[label].sum += num(r.ROI);
      map[label].count += 1;
    });
    const order = ['1W', '2W', '1M', '2M', '3M', '6M', '9M', '12M'];
    const lines = order
      .filter((d) => map[d])
      .map((d) => `• ${d}: **${(map[d].sum / map[d].count).toFixed(2)}x**`);
    if (lines.length === 0) return 'No ROI duration data available.';
    return `ROI trend by duration:\n${lines.join('\n')}`;
  }

  // ─── Best converting segment ───
  if (q.includes('segment') && (q.includes('convert') || q.includes('best'))) {
    const map = {};
    data.forEach((r) => {
      const seg = (r.Customer_Segment || '').trim();
      if (seg) map[seg] = (map[seg] || 0) + num(r.Conversions);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return 'No segment data available.';
    const [best, val] = entries[0];
    return `**${best}** segment has the most conversions with **${Math.round(val).toLocaleString()}** total conversions.`;
  }

  // ─── Total campaigns ───
  if (q.includes('total') && q.includes('campaign')) {
    return `There are **${data.length}** campaigns in the dataset.`;
  }

  // ─── Average ROI ───
  if (q.includes('average') && q.includes('roi')) {
    const sum = data.reduce((s, r) => s + num(r.ROI), 0);
    const avg = data.length ? sum / data.length : 0;
    return `Average ROI across all campaigns is **${avg.toFixed(2)}x**.`;
  }

  // ─── Total revenue ───
  if (q.includes('total') && q.includes('revenue')) {
    const total = data.reduce((s, r) => s + num(r.Revenue), 0);
    return `Total revenue is **${formatCurrency(total)}**.`;
  }

  // ─── Conversion rate ───
  if (q.includes('conversion') && q.includes('rate')) {
    const clicks = data.reduce((s, r) => s + num(r.Clicks), 0);
    const conv = data.reduce((s, r) => s + num(r.Conversions), 0);
    const rate = clicks ? ((conv / clicks) * 100).toFixed(2) : '0';
    return `Overall conversion rate is **${rate}%** (${Math.round(conv).toLocaleString()} conversions / ${Math.round(clicks).toLocaleString()} clicks).`;
  }

  // ─── Language breakdown ───
  if (q.includes('language')) {
    const map = {};
    data.forEach((r) => {
      const lang = (r.Language || '').trim();
      if (lang) map[lang] = (map[lang] || 0) + 1;
    });
    const lines = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `• ${k}: **${v}** campaigns`);
    return `Language breakdown:\n${lines.join('\n')}`;
  }

  // ─── Campaign type breakdown ───
  if (q.includes('campaign type') || q.includes('type')) {
    const map = {};
    data.forEach((r) => {
      const ct = (r.Campaign_Type || '').trim();
      if (ct) map[ct] = (map[ct] || 0) + 1;
    });
    const lines = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `• ${k}: **${v}** campaigns`);
    return `Campaign type breakdown:\n${lines.join('\n')}`;
  }

  // ─── Fallback ───
  return `I can answer questions about your dataset like:\n• Which channel has highest revenue?\n• Show ROI trend\n• Which segment converts most?\n• Total campaigns / Average ROI\n• Conversion rate\n• Language / Campaign type breakdown`;
}

/**
 * Analyze a question against the campaign dataset using external AI securely.
 * Falls back to rule-based analysis if API key is missing or request fails.
 * @param {string} question - User's natural language question
 * @param {Array<Object>} data - Array of campaign row objects
 * @returns {Promise<string>} - Insight text with markdown bold markers
 */
export async function analyzeInsight(question, data) {
  const apiKey = process.env.AI_API_KEY;

  if (apiKey) {
    try {
      const summary = createDatasetSummary(data);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a helpful business intelligence AI assistant for Nykaa Marketing Dashboard. 
Provide a clear, concise, data-driven insight answering the user's question based strictly on the provided dataset summary. 
Use markdown formatting (especially bolding key metrics). Do not make up data.`
            },
            {
              role: 'user',
              content: `Dataset summary context:
${JSON.stringify(summary, null, 2)}

User Question: ${question}`
            }
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.choices && json.choices.length > 0) {
          return json.choices[0].message.content;
        }
      } else {
        console.error('AI API Error:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Failed to call AI API:', err);
    }
  } else {
    console.log('AI_API_KEY is missing. Falling back to rule-based insight engine.');
  }

  // Fallback if API fails or key is missing
  return fallbackAnalyze(question, data);
}
