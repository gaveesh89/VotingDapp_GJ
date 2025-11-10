# Running Your Voting DApp Client Locally

This guide will help you interact with your deployed Voting DApp using the Node.js client script.

## 📋 Prerequisites

- Solana local validator running (`solana-test-validator`)
- Anchor CLI installed
- Node.js and npm/yarn installed
- Program deployed to localnet

## 🚀 Quick Start

### Step 1: Find Your Program ID

Your program's unique ID is stored in two places:

**Location 1: `Anchor.toml`**
```toml
[programs.localnet]
voting_dapp = "ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8"
```

**Location 2: `target/idl/voting_dapp.json`**
```json
{
  "address": "ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8",
  ...
}
```

✅ **Your Current Program ID:** `ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8`

### Step 2: Ensure Local Validator is Running

In a separate terminal, start the local validator:

```bash
solana-test-validator
```

Keep this terminal running throughout your testing.

### Step 3: Deploy the Program (if not already deployed)

```bash
anchor build
anchor deploy
```

### Step 4: Run the Client Script

The `client.js` script demonstrates the complete DApp workflow:

```bash
node client.js
```

## 📖 What the Client Script Does

The script performs the following operations:

1. **💰 Airdrop SOL** - Funds a new voter account with 2 SOL
2. **📊 Initialize Poll** - Creates a new poll with question and description
3. **👥 Add Candidates** - Adds multiple candidates to the poll
4. **🗳️ Cast Vote** - Voter casts their vote for a candidate
5. **📈 Display Results** - Shows current vote counts for all candidates
6. **✅ Verify Receipt** - Confirms the voter's receipt was created

## 🖥️ Expected Output

```
🚀 Starting Voting DApp Client Interaction...

======================================================================
👤 Creator: 7xK8...abc123
🗳️  Voter:   9pL2...def456
======================================================================

💰 Airdropping 2 SOL to 9pL2...
✅ Airdrop successful!

📊 STEP 1: Initializing Poll...
----------------------------------------------------------------------
✅ Poll Initialized!
   Poll ID: 1
   Question: Who should be the next president?
   Description: Presidential election 2024
   Transaction: 5Hm9...xyz789

👥 STEP 2: Adding Candidates...
----------------------------------------------------------------------
✅ Added: Alice Johnson (Democratic Party)
   Transaction: 3Kj7...abc456
✅ Added: Bob Smith (Republican Party)
   Transaction: 2Lp8...def789
✅ Added: Charlie Brown (Independent)
   Transaction: 4Mn9...ghi012

🗳️  STEP 3: Casting Votes...
----------------------------------------------------------------------
Voter 9pL2... voting for Alice Johnson...
✅ Vote cast successfully!
   Voted for: Alice Johnson
   Transaction: 6Op1...jkl345

📈 STEP 4: Poll Results
======================================================================

Poll: Who should be the next president?
Description: Presidential election 2024
Total Candidates: 3

Candidates:
  • Alice Johnson (Democratic Party)
    Votes: 1 ██
  • Bob Smith (Republican Party)
    Votes: 0 █
  • Charlie Brown (Independent)
    Votes: 0 █

📊 Total Votes Cast: 1
🏆 Leading Candidate: Alice Johnson with 1 vote(s)

✅ STEP 5: Verify Voter Receipt
======================================================================
Voter 9pL2... has voted: true

======================================================================
🎉 Client Interaction Complete!
======================================================================

📝 Summary:
   • Poll ID: 1
   • Candidates: 3
   • Votes Cast: 1
   • Program ID: ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8

💡 To view the frontend, navigate to http://localhost:3000
   (after setting up the React/Next.js frontend)

✅ Script completed successfully!
```

## 🔧 Customization

### Update Program ID

If your program ID changes after redeployment, update line 21 in `client.js`:

```javascript
const PROGRAM_ID = new PublicKey("YOUR_NEW_PROGRAM_ID_HERE");
```

### Modify Poll Data

Edit the poll details in the script (around line 123):

```javascript
const pollId = 1;
const question = "Your custom question?";
const description = "Your custom description";
```

### Add/Remove Candidates

Modify the candidates array (around line 168):

```javascript
const candidates = [
  { name: "Your Candidate", party: "Party Name" },
  // Add more candidates here
];
```

## 🌐 Setting Up Frontend (Optional)

To access a visual interface at `http://localhost:3000`:

### Option 1: React App (Already in `app/` directory)

```bash
cd app
npm install
npm run dev
```

### Option 2: Create New Next.js Frontend

```bash
npx create-next-app@latest voting-frontend
cd voting-frontend
npm install @coral-xyz/anchor @solana/web3.js
npm run dev
```

Then integrate the voting functions from `app/src/` into your React components.

## 🐛 Troubleshooting

### Error: "Connection refused"
- Ensure `solana-test-validator` is running
- Check the RPC URL is `http://localhost:8899`

### Error: "Account does not exist"
- Run `anchor deploy` to deploy the program
- Verify the Program ID matches in `client.js`

### Error: "Insufficient funds"
- The script automatically airdrops SOL
- If it fails, manually airdrop: `solana airdrop 2 <ADDRESS>`

### Error: "Poll already exists"
- Change the `pollId` variable to a new number
- Or delete and restart `solana-test-validator` for a fresh state

## 📚 Additional Resources

- **TypeScript Client**: Use `app/src/client.ts` for TypeScript integration
- **Rust CLI**: Use `cli/target/release/voting-cli` for command-line interactions
- **Tests**: Run `anchor test` to execute the test suite

## 🎯 Next Steps

1. ✅ Run `node client.js` to test the basic workflow
2. 🎨 Set up the React frontend in `app/` directory
3. 🚀 Deploy to devnet: Change cluster in `Anchor.toml` and redeploy
4. 🌐 Build a production-ready UI with advanced features

## 📞 Support

If you encounter issues:
- Check the [Anchor documentation](https://www.anchor-lang.com/)
- Review the [Solana documentation](https://docs.solana.com/)
- Check the test files in `tests/` for reference implementations

Happy voting! 🗳️✨
