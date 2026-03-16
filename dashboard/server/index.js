import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { analyzeInsight } from './insights.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── In-memory dataset store ───
let campaignData = null;

// ─── POST /api/upload ───
// Accept parsed campaign dataset from frontend, store in memory
app.post('/api/upload', (req, res) => {
  try {
    const { dataset } = req.body;

    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
      return res.status(400).json({ success: false, error: 'Dataset is empty or invalid.' });
    }

    // Validate required columns exist in first row
    const requiredCols = [
      'Channel_Used', 'Campaign_Type', 'Language',
      'Revenue', 'ROI', 'Impressions', 'Clicks', 'Leads', 'Conversions',
    ];
    const sampleKeys = Object.keys(dataset[0]);
    const missing = requiredCols.filter((col) => !sampleKeys.includes(col));

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid dataset format. Missing columns: ${missing.join(', ')}`,
      });
    }

    // Store in memory
    campaignData = dataset;

    console.log(`✓ Dataset uploaded: ${campaignData.length} campaigns`);
    return res.json({
      success: true,
      message: `Loaded ${campaignData.length} campaigns.`,
      count: campaignData.length,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing dataset.' });
  }
});

// ─── POST /api/insights ───
// Accept user question, analyze stored dataset, return business insight
app.post('/api/insights', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: 'Question is required.' });
    }

    if (!campaignData || campaignData.length === 0) {
      return res.json({
        success: true,
        insight: 'Upload dataset to enable AI insights.',
      });
    }

    const insight = await analyzeInsight(question, campaignData);

    return res.json({
      success: true,
      insight,
      datasetSize: campaignData.length,
    });
  } catch (err) {
    console.error('Insight error:', err);
    return res.status(500).json({ success: false, error: 'Server error generating insight.' });
  }
});

// ─── POST /api/chat ───
// Hardcoded API Key implementation
app.post("/api/chat", async (req, res) => {
  try {
    const userQuestion = req.body.question;
    const datasetSummary = req.body.summary;
    const GROQ_API_KEY = process.env.AI_API_KEY;

    const response = await axios.post(
      "https://api.groq.ai/v1/query",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are a marketing intelligence AI. Give short business insights."
          },
          {
            role: "user",
            content:
              "Dataset Summary: " +
              datasetSummary +
              " Question: " +
              userQuestion
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiText =
      response.data.choices[0].message.content || "No AI response";

    res.json({ reply: aiText });
  } catch (err) {
    console.log(err.message);
    res.json({
      reply: "AI failed. Showing basic dataset insight"
    });
  }
});

// ─── Health check ───
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    datasetLoaded: !!campaignData,
    datasetSize: campaignData?.length || 0,
    apiKeyConfigured: !!process.env.AI_API_KEY,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 CampaignIQ Backend running on http://localhost:${PORT}`);
  console.log(`   POST /api/upload    — Upload campaign dataset`);
  console.log(`   POST /api/insights  — Get business insights`);
  console.log(`   GET  /api/health    — Health check\n`);
});
