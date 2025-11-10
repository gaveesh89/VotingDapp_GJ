/**
 * Voting DApp Client Demo
 * 
 * This script demonstrates the complete voting workflow.
 * Run with: npm run client-demo
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { VotingDapp } from "./target/types/voting_dapp";

// Seeds for PDA derivation
const POLL_SEED = "poll";
const CANDIDATE_SEED = "candidate";
const RECEIPT_SEED = "receipt";

/**
 * Airdrop SOL to an account
 */
async function airdropSol(
  connection: anchor.web3.Connection,
  publicKey: anchor.web3.PublicKey,
  amount: number = 2
) {
  console.log(`\n💰 Airdropping ${amount} SOL to ${publicKey.toString().slice(0, 8)}...`);
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature);
  console.log(`✅ Airdrop successful!`);
}

async function main() {
  console.log("🚀 Starting Voting DApp Client Interaction...\n");
  console.log("=".repeat(70));

  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VotingDapp as Program<VotingDapp>;
  const connection = provider.connection;

  // Get creator keypair
  const creator = (provider.wallet as anchor.Wallet).payer;

  // Create a new voter
  const voter = Keypair.generate();

  console.log(`👤 Creator: ${creator.publicKey.toString()}`);
  console.log(`🗳️  Voter:   ${voter.publicKey.toString()}`);
  console.log("=".repeat(70));

  // Airdrop SOL to voter
  await airdropSol(connection, voter.publicKey, 2);

  // ============================================================================
  // STEP 1: Initialize Poll
  // ============================================================================

  console.log("\n📊 STEP 1: Initializing Poll...");
  console.log("-".repeat(70));

  const pollId = new anchor.BN(Date.now()); // Use timestamp for unique ID
  const question = "Who should be the next president?";
  const description = "Presidential election 2024";
  const startTime = new anchor.BN(Math.floor(Date.now() / 1000) - 3600); // Started 1 hour ago
  const endTime = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // Ends in 24 hours

  const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(POLL_SEED), pollId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  try {
    const tx = await program.methods
      .initializePoll(pollId, question, description, startTime, endTime)
      .accounts({
        creator: creator.publicKey,
      })
      .rpc();

    console.log(`✅ Poll Initialized!`);
    console.log(`   Poll ID: ${pollId.toString()}`);
    console.log(`   Question: ${question}`);
    console.log(`   Description: ${description}`);
    console.log(`   Transaction: ${tx}`);
  } catch (error) {
    console.error(`❌ Error initializing poll:`, error.message);
    throw error;
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
    const [candidatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(CANDIDATE_SEED),
        pollId.toArrayLike(Buffer, "le", 8),
        Buffer.from(candidate.name),
      ],
      program.programId
    );

    try {
      const tx = await program.methods
        .initializeCandidate(candidate.name, candidate.party)
        .accounts({
          creator: creator.publicKey,
        })
        .rpc();

      console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
      console.log(`   Transaction: ${tx}`);
    } catch (error) {
      console.error(`❌ Error adding candidate ${candidate.name}:`, error.message);
    }
  }

  // ============================================================================
  // STEP 3: Cast Votes
  // ============================================================================

  console.log("\n🗳️  STEP 3: Casting Votes...");
  console.log("-".repeat(70));

  const votedCandidate = candidates[0]; // Alice Johnson

  const [candidatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from(CANDIDATE_SEED),
      pollId.toArrayLike(Buffer, "le", 8),
      Buffer.from(votedCandidate.name),
    ],
    program.programId
  );

  const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(RECEIPT_SEED), pollId.toArrayLike(Buffer, "le", 8), voter.publicKey.toBuffer()],
    program.programId
  );

  console.log(`Voter ${voter.publicKey.toString().slice(0, 8)}... voting for ${votedCandidate.name}...`);

  try {
    const tx = await program.methods
      .vote()
      .accounts({
        voter: voter.publicKey,
      })
      .signers([voter])
      .rpc();

    console.log(`✅ Vote cast successfully!`);
    console.log(`   Voted for: ${votedCandidate.name}`);
    console.log(`   Transaction: ${tx}`);
  } catch (error) {
    console.error(`❌ Error casting vote:`, error.message);
    throw error;
  }

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
    const [candidatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(CANDIDATE_SEED),
        pollId.toArrayLike(Buffer, "le", 8),
        Buffer.from(candidate.name),
      ],
      program.programId
    );

    try {
      const candidateAccount = await program.account.candidate.fetch(candidatePda);
      const votes = candidateAccount.votes.toNumber();
      totalVotes += votes;
      results.push({ name: candidate.name, party: candidate.party, votes });

      const voteBar = "█".repeat(Math.max(votes * 2, 1));
      console.log(`  • ${candidate.name} (${candidate.party})`);
      console.log(`    Votes: ${votes} ${voteBar}`);
    } catch (error) {
      console.log(`  • ${candidate.name} (${candidate.party}): 0 votes`);
    }
  }

  console.log(`\n📊 Total Votes Cast: ${totalVotes}`);

  if (results.length > 0) {
    const winner = results.reduce((prev, current) => (prev.votes > current.votes ? prev : current));
    console.log(`🏆 Leading Candidate: ${winner.name} with ${winner.votes} vote(s)`);
  }

  // ============================================================================
  // STEP 5: Verify Voter Receipt
  // ============================================================================

  console.log("\n✅ STEP 5: Verify Voter Receipt");
  console.log("=".repeat(70));

  try {
    const receipt = await program.account.voterReceipt.fetch(receiptPda);
    console.log(`Voter ${voter.publicKey.toString().slice(0, 8)}... has voted: ${receipt.hasVoted}`);
  } catch (error) {
    console.log(`Voter ${voter.publicKey.toString().slice(0, 8)}... has not voted yet.`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log("\n" + "=".repeat(70));
  console.log("🎉 Client Interaction Complete!");
  console.log("=".repeat(70));
  console.log(`\n📝 Summary:`);
  console.log(`   • Poll ID: ${pollId.toString()}`);
  console.log(`   • Candidates: ${candidates.length}`);
  console.log(`   • Votes Cast: ${totalVotes}`);
  console.log(`   • Program ID: ${program.programId.toString()}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Run the frontend: cd app && npm run dev`);
  console.log(`   2. Access at: http://localhost:3000`);
  console.log(`   3. Use Rust CLI: ./cli/target/release/voting-cli --help\n`);
}

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
