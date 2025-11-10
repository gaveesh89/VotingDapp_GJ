import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import { errorResponse, successResponse } from './lib/api-response-helpers.js'
import { getApiConfig } from './lib/get-api-config.js'
import { getApiContext } from './lib/get-api-context.js'
import { getSolanaBalance } from './lib/get-solana-balance.js'
import { getSolanaCachedBlockhash } from './lib/get-solana-cached-blockhash.js'
import { getSolanaCluster } from './lib/get-solana-cluster.js'
import { createPoll, addCandidate, vote, getPollResults } from './lib/voting-service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const { port, ...config } = getApiConfig()
const context = await getApiContext()

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.corsOrigins.includes(origin)) {
      return cb(null, true)
    }
    cb(new Error('Not allowed by CORS'))
  },
}))

app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

// Serve the main HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗳️ Voting DApp</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 30px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px 0 rgba(31,38,135,.37);
            border: 1px solid rgba(255,255,255,.18);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            border-left: 4px solid #4CAF50;
        }
        button {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(76,175,80,0.4);
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76,175,80,0.6);
        }
        input, textarea {
            width: 100%;
            padding: 12px;
            margin: 8px 0;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.9);
            color: #333;
            font-size: 14px;
        }
        .poll-results {
            margin-top: 20px;
        }
        .candidate {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 3px solid #FF6B6B;
        }
        .vote-bar {
            background: linear-gradient(90deg, #FF6B6B, #4ECDC4);
            height: 8px;
            border-radius: 4px;
            margin-top: 8px;
            transition: width 0.5s;
        }
        #status {
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
        }
        .success {
            background: rgba(76,175,80,0.3);
            border: 1px solid #4CAF50;
        }
        .error {
            background: rgba(244,67,54,0.3);
            border: 1px solid #f44336;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            opacity: 0.8;
            font-size: 14px;
        }
        .demo-button {
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            font-size: 18px;
            padding: 15px 30px;
            margin: 20px auto;
            display: block;
            width: fit-content;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗳️ Solana Voting DApp</h1>
        
        <div id="status"></div>
        
        <div class="section">
            <h2>🚀 Quick Demo</h2>
            <p>Click here to run a complete demo with sample poll, candidates, and voting:</p>
            <button class="demo-button" onclick="runDemo()">▶️ Run Complete Demo</button>
        </div>

        <div class="grid">
            <div class="section">
                <h2>📊 Create Poll</h2>
                <input id="pollId" type="number" placeholder="Poll ID (e.g., 1)" value="1">
                <input id="question" type="text" placeholder="Question (e.g., Who should be president?)" value="Who should be the next president?">
                <textarea id="description" placeholder="Description" rows="2">Presidential election 2024</textarea>
                <input id="startTime" type="datetime-local" placeholder="Start Time">
                <input id="endTime" type="datetime-local" placeholder="End Time">
                <button onclick="createPoll()">Create Poll</button>
            </div>

            <div class="section">
                <h2>👥 Add Candidate</h2>
                <input id="candidatePollId" type="number" placeholder="Poll ID" value="1">
                <input id="candidateName" type="text" placeholder="Candidate Name (e.g., Alice Johnson)">
                <input id="candidateParty" type="text" placeholder="Party (e.g., Democratic Party)">
                <button onclick="addCandidate()">Add Candidate</button>
            </div>

            <div class="section">
                <h2>🗳️ Vote</h2>
                <input id="votePollId" type="number" placeholder="Poll ID" value="1">
                <input id="voteCandidate" type="text" placeholder="Candidate Name">
                <button onclick="vote()">Cast Vote</button>
            </div>

            <div class="section">
                <h2>📈 View Results</h2>
                <input id="resultsPollId" type="number" placeholder="Poll ID" value="1">
                <button onclick="getPollResults()">Get Results</button>
                <div id="pollResults" class="poll-results"></div>
            </div>
        </div>

        <div class="section">
            <h2>ℹ️ API Endpoints</h2>
            <p><strong>Cluster:</strong> <span id="cluster">Loading...</span></p>
            <p><strong>Signer Balance:</strong> <span id="balance">Loading...</span></p>
            <p><strong>Program ID:</strong> ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8</p>
        </div>

        <div class="footer">
            <p>🦀 Built with Rust + Solana + Anchor Framework</p>
            <p>Local Test Network: http://localhost:8899</p>
        </div>
    </div>

    <script>
        function showStatus(message, isError = false) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = isError ? 'error' : 'success';
            console.log(message);
        }

        async function apiRequest(endpoint, method = 'GET', data = null) {
            try {
                const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                };
                if (data) options.body = JSON.stringify(data);
                
                const response = await fetch(endpoint, options);
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || 'API request failed');
                }
                
                return result.data;
            } catch (error) {
                showStatus('Error: ' + error.message, true);
                throw error;
            }
        }

        async function createPoll() {
            const pollId = parseInt(document.getElementById('pollId').value);
            const question = document.getElementById('question').value;
            const description = document.getElementById('description').value;
            const startTime = new Date(document.getElementById('startTime').value).getTime() / 1000;
            const endTime = new Date(document.getElementById('endTime').value).getTime() / 1000;

            if (!question || !description || !startTime || !endTime) {
                showStatus('Please fill in all fields', true);
                return;
            }

            showStatus('Creating poll...');
            try {
                const result = await apiRequest('/api/create-poll', 'POST', {
                    pollId, question, description, startTime, endTime
                });
                showStatus('✅ Poll created successfully! Transaction: ' + result.transaction);
            } catch (error) {
                // Error already handled in apiRequest
            }
        }

        async function addCandidate() {
            const pollId = parseInt(document.getElementById('candidatePollId').value);
            const name = document.getElementById('candidateName').value;
            const party = document.getElementById('candidateParty').value;

            if (!name || !party) {
                showStatus('Please fill in candidate name and party', true);
                return;
            }

            showStatus('Adding candidate...');
            try {
                const result = await apiRequest('/api/add-candidate', 'POST', {
                    pollId, name, party
                });
                showStatus('✅ Candidate added successfully! Transaction: ' + result.transaction);
            } catch (error) {
                // Error already handled in apiRequest
            }
        }

        async function vote() {
            const pollId = parseInt(document.getElementById('votePollId').value);
            const candidateName = document.getElementById('voteCandidate').value;

            if (!candidateName) {
                showStatus('Please enter candidate name', true);
                return;
            }

            showStatus('Casting vote...');
            try {
                const result = await apiRequest('/api/vote', 'POST', {
                    pollId, candidateName
                });
                showStatus('✅ Vote cast successfully! Transaction: ' + result.transaction);
            } catch (error) {
                // Error already handled in apiRequest
            }
        }

        async function getPollResults() {
            const pollId = parseInt(document.getElementById('resultsPollId').value);

            showStatus('Fetching results...');
            try {
                const result = await apiRequest('/api/poll-results/' + pollId);
                
                const resultsDiv = document.getElementById('pollResults');
                const poll = result.poll;
                const candidates = result.candidates;
                
                const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
                const maxVotes = Math.max(...candidates.map(c => c.votes), 1);
                
                resultsDiv.innerHTML = \`
                    <h3>\${poll.question}</h3>
                    <p>\${poll.description}</p>
                    <p><strong>Total Votes:</strong> \${totalVotes}</p>
                    \${candidates.map(candidate => \`
                        <div class="candidate">
                            <div><strong>\${candidate.name}</strong> (\${candidate.party})</div>
                            <div>Votes: \${candidate.votes}</div>
                            <div class="vote-bar" style="width: \${(candidate.votes / maxVotes) * 100}%"></div>
                        </div>
                    \`).join('')}
                \`;
                
                showStatus(\`✅ Results loaded! Total votes: \${totalVotes}\`);
            } catch (error) {
                // Error already handled in apiRequest
            }
        }

        async function runDemo() {
            showStatus('🚀 Starting complete demo...');
            
            // Set default times
            const now = new Date();
            const startTime = new Date(now.getTime() - 3600000); // 1 hour ago
            const endTime = new Date(now.getTime() + 86400000); // 24 hours from now
            
            document.getElementById('startTime').value = startTime.toISOString().slice(0, 16);
            document.getElementById('endTime').value = endTime.toISOString().slice(0, 16);
            
            try {
                // 1. Create poll
                showStatus('Step 1/4: Creating poll...');
                await createPoll();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 2. Add candidates
                showStatus('Step 2/4: Adding candidates...');
                document.getElementById('candidateName').value = 'Alice Johnson';
                document.getElementById('candidateParty').value = 'Democratic Party';
                await addCandidate();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                document.getElementById('candidateName').value = 'Bob Smith';
                document.getElementById('candidateParty').value = 'Republican Party';
                await addCandidate();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                document.getElementById('candidateName').value = 'Charlie Brown';
                document.getElementById('candidateParty').value = 'Independent';
                await addCandidate();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 3. Cast vote
                showStatus('Step 3/4: Casting vote...');
                document.getElementById('voteCandidate').value = 'Alice Johnson';
                await vote();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 4. Show results
                showStatus('Step 4/4: Displaying results...');
                await getPollResults();
                
                showStatus('🎉 Demo completed successfully! Scroll down to see the results.');
                
            } catch (error) {
                showStatus('❌ Demo failed: ' + error.message, true);
            }
        }

        // Load initial data
        async function loadInitialData() {
            try {
                const cluster = await apiRequest('/cluster');
                document.getElementById('cluster').textContent = cluster.cluster + ' (' + cluster.endpoint + ')';
                
                const balance = await apiRequest('/balance-signer');
                document.getElementById('balance').textContent = (balance.balance / 1000000000).toFixed(2) + ' SOL';
            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        }

        // Load data when page loads
        loadInitialData();
        
        // Set default times
        const now = new Date();
        const startTime = new Date(now.getTime() - 3600000);
        const endTime = new Date(now.getTime() + 86400000);
        document.getElementById('startTime').value = startTime.toISOString().slice(0, 16);
        document.getElementById('endTime').value = endTime.toISOString().slice(0, 16);
    </script>
</body>
</html>
  `)
})

// API Routes for voting functionality
app.post('/api/create-poll', async (req, res) => {
  try {
    const { pollId, question, description, startTime, endTime } = req.body
    const result = await createPoll(pollId, question, description, startTime, endTime)
    
    if (result.success) {
      res.json(successResponse(result))
    } else {
      res.status(400).json(errorResponse(result.error || 'Poll creation failed', 'POLL_CREATION_FAILED'))
    }
  } catch (error) {
    context.log.error('Error creating poll', error)
    res.status(500).json(errorResponse('Error creating poll', 'POLL_CREATION_ERROR'))
  }
})

app.post('/api/add-candidate', async (req, res) => {
  try {
    const { pollId, name, party } = req.body
    const result = await addCandidate(pollId, name, party)
    
    if (result.success) {
      res.json(successResponse(result))
    } else {
      res.status(400).json(errorResponse(result.error || 'Candidate addition failed', 'CANDIDATE_ADDITION_FAILED'))
    }
  } catch (error) {
    context.log.error('Error adding candidate', error)
    res.status(500).json(errorResponse('Error adding candidate', 'CANDIDATE_ADDITION_ERROR'))
  }
})

app.post('/api/vote', async (req, res) => {
  try {
    const { pollId, candidateName } = req.body
    const result = await vote(pollId, candidateName)
    
    if (result.success) {
      res.json(successResponse(result))
    } else {
      res.status(400).json(errorResponse(result.error || 'Voting failed', 'VOTING_FAILED'))
    }
  } catch (error) {
    context.log.error('Error voting', error)
    res.status(500).json(errorResponse('Error voting', 'VOTING_ERROR'))
  }
})

app.get('/api/poll-results/:pollId', async (req, res) => {
  try {
    const pollId = parseInt(req.params.pollId)
    const result = await getPollResults(pollId)
    
    if (result.success) {
      res.json(successResponse(result))
    } else {
      res.status(400).json(errorResponse(result.error || 'Poll results failed', 'POLL_RESULTS_FAILED'))
    }
  } catch (error) {
    context.log.error('Error getting poll results', error)
    res.status(500).json(errorResponse('Error getting poll results', 'POLL_RESULTS_ERROR'))
  }
})

// Existing routes
app.get('/balance/:address', async (req, res) => {
  try {
    const balance = await getSolanaBalance(context, req.params.address)
    if (!balance) {
      context.log.error(`Failed to retrieve balance for address: ${req.params.address}`)
      res.status(500).json(errorResponse('Balance not retrieved', 'BALANCE_RETRIEVAL_FAILED'))
      return
    }
    res.json(successResponse(balance))
  } catch (error) {
    context.log.error(`Error getting balance for address ${req.params.address}`, error)
    res.status(500).json(errorResponse('Error getting balance', 'BALANCE_ERROR'))
  }
})

app.get('/balance-signer', async (req, res) => {
  try {
    const balance = await getSolanaBalance(context, context.signer.address)
    if (!balance) {
      context.log.error(`Failed to retrieve balance for signer: ${context.signer.address}`)
      res.status(500).json(errorResponse('Balance not retrieved', 'BALANCE_RETRIEVAL_FAILED'))
      return
    }
    res.json(successResponse(balance))
  } catch (error) {
    context.log.error(`Error getting balance for signer ${context.signer.address}`, error)
    res.status(500).json(errorResponse('Error getting balance', 'BALANCE_ERROR'))
  }
})

app.get('/cluster', async (req, res) => {
  try {
    const result = await getSolanaCluster(context)
    if (!result) {
      context.log.error(`Failed to retrieve cluster`)
      res.status(500).json(errorResponse('Cluster not retrieved', 'CLUSTER_RETRIEVAL_FAILED'))
      return
    }
    res.json(successResponse(result))
  } catch (error) {
    context.log.error(`Error getting cluster`, error)
    res.status(500).json(errorResponse('Error getting cluster', 'CLUSTER_ERROR'))
  }
})

app.get('/latest-blockhash', async (req, res) => {
  try {
    const start = Date.now()
    const blockhash = await getSolanaCachedBlockhash(context)
    
    if (!blockhash) {
      context.log.error(`Failed to retrieve blockhash`)
      res.status(500).json(errorResponse('Blockhash not retrieved', 'BLOCKHASH_RETRIEVAL_FAILED'))
      return
    }

    res.json(successResponse({
      ...blockhash,
      ttl: blockhash.cachedAt + 1000 * 30 - Date.now(),
      duration: Date.now() - start + 'ms',
    }))
  } catch (error) {
    context.log.error(`Error getting blockhash`, error)
    res.status(500).json(errorResponse('Error getting blockhash', 'BLOCKHASH_ERROR'))
  }
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    context.log.warn(`CORS rejection for origin: ${req.headers.origin}`)
    res.status(403).json(errorResponse('Origin not allowed', 'CORS_FORBIDDEN', 403))
    return
  }

  context.log.error(`Unhandled error: ${err.message}`, err)
  res.status(500).json(errorResponse('An unexpected error occurred', 'UNEXPECTED_ERROR'))
})

app.listen(port, () => {
  context.log.info(`🗳️  Voting DApp running on http://localhost:${port}`)
  context.log.info(`�� Endpoint: ${config.solanaRpcEndpoint.split('?')[0]}`)
  context.log.info(`🐠 Signer  : ${context.signer.address}`)
  context.log.info(`📊 Program : ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8`)
})

declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
