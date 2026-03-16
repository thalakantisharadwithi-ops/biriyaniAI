import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import type { Campaign } from '../mockData';
import './ChatPanel.css';

interface Msg {
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  'Which channel has highest revenue?',
  'Show ROI trend',
  'Which segment converts most?',
  'Total campaigns',
  'Average ROI',
];

interface DatasetSummary {
  status?: string;
  totalCampaigns?: number;
  totalRevenue?: number;
  totalConversions?: number;
  revenueByChannel?: Record<string, number>;
  conversionsBySegment?: Record<string, number>;
}

// External backend handles insights now
function renderBotText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split('\n').map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

export default function ChatPanel({ data }: { data: Campaign[] | null }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', text: 'Hi! I\'m your CampaignIQ assistant. Ask me questions about your campaign data.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || isLoading) return;
    setInput('');
    const userMsg: Msg = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {      let summaryObj: DatasetSummary = { status: 'No data' };
      if (data && data.length > 0) {
        const revByCh: Record<string, number> = {};
        const convBySeg: Record<string, number> = {};
        let totalRev = 0;
        let totalConv = 0;
        
        data.forEach(c => {
          totalRev += c.revenue;
          totalConv += c.conversions;
          revByCh[c.channel] = (revByCh[c.channel] || 0) + c.revenue;
          convBySeg[c.segment] = (convBySeg[c.segment] || 0) + c.conversions;
        });

        summaryObj = {
          totalCampaigns: data.length,
          totalRevenue: totalRev,
          totalConversions: totalConv,
          revenueByChannel: revByCh,
          conversionsBySegment: convBySeg
        };
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          question: q,
          summary: JSON.stringify(summaryObj)
        }),
      });
      const resData = await res.json();
      
      const botMsg: Msg = { 
        role: 'bot', 
        text: resData.reply || 'Failed to get insight from server.' 
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: 'bot', text: 'Error connecting to the insight server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-section">
      <div className="chat-section-title">
        <span className="title-dot" />
        <Sparkles size={16} />
        CampaignIQ Assistant
        <span className="chat-status">{data && data.length > 0 ? `${data.length} campaigns loaded` : 'No dataset'}</span>
      </div>

      {/* Scrollable chat history */}
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.role === 'bot' ? renderBotText(m.text) : m.text}
          </div>
        ))}

        {messages.length <= 1 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chat-suggestion" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <input
          className="chat-input"
          placeholder="Ask about your campaign data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="chat-send" onClick={() => send()} disabled={!input.trim() || isLoading}>
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
