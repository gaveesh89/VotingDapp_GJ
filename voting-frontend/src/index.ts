import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorResponse, successResponse } from './lib/api-response-helpers.js';
import { getApiConfig } from './lib/get-api-config.js';
import { getApiContext } from './lib/get-api-context.js';
import { getSolanaBalance } from './lib/get-solana-balance.js';
import { getSolanaCachedBlockhash } from './lib/get-solana-cached-blockhash.js';
import { getSolanaCluster } from './lib/get-solana-cluster.js';
import { createPoll, addCandidate, vote, getPollResults, getAllPolls, hasVoted, getPollStatus, getTimeRemaining } from './lib/voting-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const { port, ...config } = getApiConfig();
const context = await getApiContext();

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.corsOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Enhanced API Routes
app.post('/api/createPoll', async (req, res) => {
  try {
    const { pollId, question, description, startTime, endTime } = req.body;
    const result = await createPoll(pollId, question, description, startTime, endTime);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: `Error creating poll: ${error}` });
  }
});

app.post('/api/addCandidate', async (req, res) => {
  try {
    const { pollId, candidateName, candidateParty } = req.body;
    const result = await addCandidate(pollId, candidateName, candidateParty);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: `Error adding candidate: ${error}` });
  }
});

app.post('/api/vote', async (req, res) => {
  try {
    const { pollId, candidateName } = req.body;
    const result = await vote(pollId, candidateName);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: `Error voting: ${error}` });
  }
});

app.get('/api/getPollResults', async (req, res) => {
  try {
    const pollId = parseInt(req.query.pollId as string);
    const result = await getPollResults(pollId);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: `Error getting results: ${error}` });
  }
});

app.get('/api/getAllPolls', async (req, res) => {
  try {
    const result = await getAllPolls();
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: `Error getting polls: ${error}` });
  }
});

app.get('/api/hasVoted', async (req, res) => {
  try {
    const pollId = parseInt(req.query.pollId as string);
    const result = await hasVoted(pollId);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: `Error checking vote status: ${error}` });
  }
});

app.get('/api/getPollStatus', async (req, res) => {
  try {
    // This would need actual poll start/end times from the blockchain
    // For now, return a demo status
    const pollId = parseInt(req.query.pollId as string);
    const now = Date.now();
    const demoStartTime = now - 3600000; // 1 hour ago
    const demoEndTime = now + 3600000; // 1 hour from now
    const status = getPollStatus(demoStartTime, demoEndTime);
    res.json({ success: true, status });
  } catch (error) {
    res.json({ success: false, message: `Error getting poll status: ${error}` });
  }
});

app.get('/api/getTimeRemaining', async (req, res) => {
  try {
    const pollId = parseInt(req.query.pollId as string);
    const result = await getTimeRemaining(pollId);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: `Error getting time remaining: ${error}` });
  }
});

// System utility endpoints  
app.get('/api/cluster', async (req, res) => {
  try {
    const cluster = await getSolanaCluster(context);
    res.json(successResponse(cluster));
  } catch (error) {
    res.json(errorResponse(`Cluster error: ${error}`));
  }
});

app.get('/api/balance', async (req, res) => {
  try {
    // Need to provide an address - using signer's address for demo
    const signerAddress = context.signer.address;
    const balance = await getSolanaBalance(context, signerAddress);
    res.json(successResponse(balance));
  } catch (error) {
    res.json(errorResponse(`Balance error: ${error}`));
  }
});

app.get('/api/blockhash', async (req, res) => {
  try {
    const blockhash = await getSolanaCachedBlockhash(context);
    res.json(successResponse(blockhash));
  } catch (error) {
    res.json(errorResponse(`Blockhash error: ${error}`));
  }
});

app.listen(port, () => {
  console.log(`🗳️ Enhanced Voting DApp server running at http://localhost:${port}`);
  console.log(`📊 Modern UI with tabbed interface and multiple poll support`);
  console.log(`✨ Features: Auto-refresh, real-time status, vote checking`);
  console.log(`🦀 Powered by Rust + Solana + Anchor Framework`);
  console.log(`🌐 Network: localhost cluster`);
});
