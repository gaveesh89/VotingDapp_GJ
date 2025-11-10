/**
 * Voting DApp Client Script
 * This script demonstrates the complete workflow:
 * 1. Airdrop SOL to a new voter
 * 2. Initialize a poll
 * 3. Add candidates to the poll
 * 4. Cast votes
 * 5. Display results
 */

const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

// ============================================================================
// CONFIGURATION
// ============================================================================

// Program ID from Anchor.toml and target/idl/voting_dapp.json
const PROGRAM_ID = new PublicKey("ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8");

// Seeds for PDA derivation
const POLL_SEED = "poll";
const CANDIDATE_SEED = "candidate";
const RECEIPT_SEED = "receipt";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the PDA for a poll account
 */
function getPollAddress(pollId) {
  const pollIdBuffer = Buffer.alloc(8);
  pollIdBuffer.writeBigUInt64LE(BigInt(pollId));
  
  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(POLL_SEED), pollIdBuffer],
    PROGRAM_ID
  );
  return pollPda;
}

/**
 * Get the PDA for a candidate account
 */
function getCandidateAddress(pollId, candidateName) {
  const pollIdBuffer = Buffer.alloc(8);
  pollIdBuffer.writeBigUInt64LE(BigInt(pollId));
  
  const [candidatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from(CANDIDATE_SEED), pollIdBuffer, Buffer.from(candidateName)],
    PROGRAM_ID
  );
  return candidatePda;
}

/**
 * Get the PDA for a voter receipt account
 */
function getReceiptAddress(pollId, voterPubkey) {
  const pollIdBuffer = Buffer.alloc(8);
  pollIdBuffer.writeBigUInt64LE(BigInt(pollId));
  
  const [receiptPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(RECEIPT_SEED), pollIdBuffer, voterPubkey.toBuffer()],
    PROGRAM_ID
  );
  return receiptPda;
}

/**
 * Airdrop SOL to an account
 */
async function airdropSol(connection, publicKey, amount = 2) {
  console.log(`\n💰 Airdropping ${amount} SOL to ${publicKey.toString().slice(0, 8)}...`);
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature);
  console.log(`✅ Airdrop successful!`);
}

/**
 * Load IDL from file and ensure proper structure
 */
function loadIdl() {
  const idlPath = path.join(__dirname, "target", "idl", "voting_dapp.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  
  // Ensure accounts have proper structure for Anchor
  if (idl.accounts) {
    idl.accounts = idl.accounts.map(account => {
      if (!account.type) {
        return account;
      }
      return {
        name: account.name,
        type: {
          kind: "struct",
          fields: account.type.kind === "struct" ? account.type.fields : []
        }
      };
    });
  }
  
  return idl;
}

// ============================================================================
// MAIN CLIENT LOGIC
// ============================================================================

async function main() {
  console.log("🚀 Starting Voting DApp Client Interaction...\n");
  console.log("=" .repeat(70));

  // Setup connection and provider
  const connection = new anchor.web3.Connection(
    "http://localhost:8899",
    "confirmed"
  );

  // Load wallet (creator/admin)
  const walletPath = path.join(
    require("os").homedir(),
    ".config",
    "solana",
    "id.json"
  );
  const creatorKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf8")))
  );

  // Create a new voter keypair
  const voterKeypair = Keypair.generate();

  console.log(`👤 Creator: ${creatorKeypair.publicKey.toString()}`);
  console.log(`🗳️  Voter:   ${voterKeypair.publicKey.toString()}`);
  console.log("=" .repeat(70));

  // Airdrop SOL to voter
  await airdropSol(connection, voterKeypair.publicKey, 2);

  // Setup Anchor provider and program
  const wallet = new anchor.Wallet(creatorKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Use the workspace program (this reads from Anchor.toml automatically)
  const program = anchor.workspace.VotingDapp;

  // ============================================================================
  // STEP 1: Initialize Poll
  // ============================================================================

  console.log("\n📊 STEP 1: Initializing Poll...");
  console.log("-".repeat(70));

  const pollId = 1;
  const question = "Who should be the next president?";
  const description = "Presidential election 2024";
  const startTime = Math.floor(Date.now() / 1000) - 3600; // Started 1 hour ago
  const endTime = Math.floor(Date.now() / 1000) + 86400; // Ends in 24 hours

  const pollPda = getPollAddress(pollId);

  try {
    const tx = await program.methods
      .initializePoll(
        new anchor.BN(pollId),
        question,
        description,
        new anchor.BN(startTime),
        new anchor.BN(endTime)
      )
      .accounts({
        poll: pollPda,
        creator: creatorKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`✅ Poll Initialized!`);
    console.log(`   Poll ID: ${pollId}`);
    console.log(`   Question: ${question}`);
    console.log(`   Description: ${description}`);
    console.log(`   Transaction: ${tx}`);
  } catch (error) {
    if (error.message.includes("already in use")) {
      console.log(`ℹ️  Poll ${pollId} already exists, skipping initialization.`);
    } else {
      throw error;
    }
  }

  // ============================================================================
  // STEP 2: Add Candidates
  // ============================================================================

  console.log("\n👥 STEP 2: Adding Candidates...");
  console.log("-".repeat(70));

  const candidates = [
    { name: "Alice Johnson", party: "Democratic Party" },
    { name: "Bob Smith", party: "Republican Party" },
    { name: "Charlie Brown", party: "Independent" },
  ];

  for (const candidate of candidates) {
    const candidatePda = getCandidateAddress(pollId, candidate.name);

    try {
      const tx = await program.methods
        .initializeCandidate(candidate.name, candidate.party)
        .accounts({
          poll: pollPda,
          candidate: candidatePda,
          creator: creatorKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
      console.log(`   Transaction: ${tx}`);
    } catch (error) {
      if (error.message.includes("already in use")) {
        console.log(`ℹ️  Candidate "${candidate.name}" already exists, skipping.`);
      } else {
        throw error;
      }
    }
  }

  // ============================================================================
  // STEP 3: Cast Votes
  // ============================================================================

  console.log("\n🗳️  STEP 3: Casting Votes...");
  console.log("-".repeat(70));

  // Voter 1 votes for Alice Johnson
  const votedCandidate = candidates[0]; // Alice Johnson
  const candidatePda = getCandidateAddress(pollId, votedCandidate.name);
  const receiptPda = getReceiptAddress(pollId, voterKeypair.publicKey);

  console.log(`Voter ${voterKeypair.publicKey.toString().slice(0, 8)}... voting for ${votedCandidate.name}...`);

  const tx = await program.methods
    .vote()
    .accounts({
      poll: pollPda,
      candidate: candidatePda,
      voterReceipt: receiptPda,
      voter: voterKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([voterKeypair])
    .rpc();

  console.log(`✅ Vote cast successfully!`);
  console.log(`   Voted for: ${votedCandidate.name}`);
  console.log(`   Transaction: ${tx}`);

  // ============================================================================
  // STEP 4: Display Results
  // ============================================================================

  console.log("\n📈 STEP 4: Poll Results");
  console.log("=".repeat(70));

  // Fetch poll data
  const pollAccount = await program.account.poll.fetch(pollPda);
  console.log(`\nPoll: ${pollAccount.question}`);
  console.log(`Description: ${pollAccount.description}`);
  console.log(`Total Candidates: ${pollAccount.candidateCount.toString()}`);
  console.log(`\nCandidates:`);

  let totalVotes = 0;
  const results = [];

  for (const candidate of candidates) {
    const candidatePda = getCandidateAddress(pollId, candidate.name);
    try {
      const candidateAccount = await program.account.candidate.fetch(candidatePda);
      const votes = candidateAccount.votes.toNumber();
      totalVotes += votes;
      results.push({ name: candidate.name, party: candidate.party, votes });
      
      const voteBar = "█".repeat(votes * 2 || 1);
      console.log(`  • ${candidate.name} (${candidate.party})`);
      console.log(`    Votes: ${votes} ${voteBar}`);
    } catch (error) {
      console.log(`  • ${candidate.name} (${candidate.party}): 0 votes`);
    }
  }

  console.log(`\n📊 Total Votes Cast: ${totalVotes}`);

  if (results.length > 0) {
    const winner = results.reduce((prev, current) => 
      (prev.votes > current.votes) ? prev : current
    );
    console.log(`🏆 Leading Candidate: ${winner.name} with ${winner.votes} vote(s)`);
  }

  // ============================================================================
  // STEP 5: Verify Voter Receipt
  // ============================================================================

  console.log("\n✅ STEP 5: Verify Voter Receipt");
  console.log("=".repeat(70));

  try {
    const receipt = await program.account.voterReceipt.fetch(receiptPda);
    console.log(`Voter ${voterKeypair.publicKey.toString().slice(0, 8)}... has voted: ${receipt.hasVoted}`);
  } catch (error) {
    console.log(`Voter ${voterKeypair.publicKey.toString().slice(0, 8)}... has not voted yet.`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log("\n" + "=".repeat(70));
  console.log("🎉 Client Interaction Complete!");
  console.log("=".repeat(70));
  console.log(`\n📝 Summary:`);
  console.log(`   • Poll ID: ${pollId}`);
  console.log(`   • Candidates: ${candidates.length}`);
  console.log(`   • Votes Cast: ${totalVotes}`);
  console.log(`   • Program ID: ${PROGRAM_ID.toString()}`);
  console.log(`\n💡 To view the frontend, navigate to http://localhost:3000`);
  console.log(`   (after setting up the React/Next.js frontend)\n`);
}

// ============================================================================
// RUN THE CLIENT
// ============================================================================

main()
  .then(() => {
    console.log("✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error occurred:");
    console.error(error);
    process.exit(1);
  });
