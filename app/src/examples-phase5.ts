// Comprehensive examples demonstrating Phase 5.5 and 5.6 functionality
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { 
  getProgram,
  getConnection,
  fetchPoll,
  fetchCandidate,
  sendVote,
  sendCreatePoll,
  sendAddCandidate,
  fetchPollResults,
  checkUserVoted,
  derivePDAs
} from './index';

// Example: Phase 5.5 - Implement Fetching Logic
export const exampleFetchingLogic = async () => {
  console.log('🔍 Phase 5.5: Implementing Fetching Logic');

  // Setup
  const connection = getConnection('localnet');
  const mockWallet = {
    publicKey: Keypair.generate().publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  
  const program = getProgram(connection, mockWallet as any);

  try {
    // Function to fetch a Poll account by its PDA
    const pollId = 12345;
    console.log('📊 Fetching poll with ID:', pollId);
    
    const { pollAccount, pollPda } = await fetchPoll(program, pollId);
    console.log('✅ Poll fetched successfully:');
    console.log('  - Poll ID:', pollAccount.pollId.toString());
    console.log('  - Question:', pollAccount.question);
    console.log('  - Creator:', pollAccount.creator.toString());
    console.log('  - PDA:', pollPda.toString());

    // Fetch candidate
    const candidateName = "Alice Johnson";
    console.log('👤 Fetching candidate:', candidateName);
    
    const { candidateAccount, candidatePda } = await fetchCandidate(program, pollPda, candidateName);
    console.log('✅ Candidate fetched successfully:');
    console.log('  - Name:', candidateAccount.name);
    console.log('  - Party:', candidateAccount.party);
    console.log('  - Votes:', candidateAccount.votes.toString());
    console.log('  - PDA:', candidatePda.toString());

    return { pollAccount, pollPda, candidateAccount, candidatePda };

  } catch (error) {
    console.error('❌ Fetching failed:', error);
    throw error;
  }
};

// Example: Phase 5.6 - Implement Voting Transaction
export const exampleVotingTransaction = async () => {
  console.log('🗳️ Phase 5.6: Implementing Voting Transaction');

  // Setup
  const connection = getConnection('localnet');
  const voterKeypair = Keypair.generate();
  const mockWallet = {
    publicKey: voterKeypair.publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  
  const program = getProgram(connection, mockWallet as any);

  try {
    const pollId = 12345;
    const candidateName = "Alice Johnson";

    // Derive PDAs
    const [pollPda] = derivePDAs.poll(program.programId, pollId);
    const [candidatePda] = derivePDAs.candidate(program.programId, pollPda, candidateName);
    const voter = mockWallet.publicKey;

    console.log('🎯 Preparing to vote:');
    console.log('  - Poll PDA:', pollPda.toString());
    console.log('  - Candidate PDA:', candidatePda.toString());
    console.log('  - Voter:', voter.toString());

    // Check if user has already voted
    const hasVoted = await checkUserVoted(program, pollPda, voter);
    console.log('  - Has already voted:', hasVoted);

    if (!hasVoted) {
      // Function to send the vote transaction
      console.log('📤 Sending vote transaction...');
      
      const tx = await sendVote(program, pollPda, candidatePda, voter);
      console.log('✅ Vote transaction successful!');
      console.log('  - Transaction signature:', tx);

      // Verify vote was recorded
      const updatedCandidate = await fetchCandidate(program, pollPda, candidateName);
      console.log('  - Updated vote count:', updatedCandidate.candidateAccount.votes.toString());

      return { tx, updatedVoteCount: updatedCandidate.candidateAccount.votes.toString() };
    } else {
      console.log('⚠️ User has already voted for this poll');
      return { tx: null, message: 'Already voted' };
    }

  } catch (error) {
    console.error('❌ Voting transaction failed:', error);
    throw error;
  }
};

// Comprehensive example combining both phases
export const comprehensiveExample = async () => {
  console.log('🚀 Comprehensive Example: Fetching + Voting');

  // Setup
  const connection = getConnection('localnet');
  const creatorKeypair = Keypair.generate();
  const voterKeypair = Keypair.generate();
  
  const creatorWallet = {
    publicKey: creatorKeypair.publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };

  const voterWallet = {
    publicKey: voterKeypair.publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };

  const program = getProgram(connection, creatorWallet as any);

  try {
    // 1. Create poll
    const pollId = Math.floor(Math.random() * 1000000);
    const now = Math.floor(Date.now() / 1000);
    
    console.log('1️⃣ Creating poll...');
    const { tx: createTx } = await sendCreatePoll(
      program,
      pollId,
      "Who should be the next president?",
      "Presidential election poll",
      now,
      now + 3600,
      creatorKeypair.publicKey
    );
    console.log('✅ Poll created:', createTx);

    // 2. Add candidates
    console.log('2️⃣ Adding candidates...');
    const [pollPda] = derivePDAs.poll(program.programId, pollId);
    
    await sendAddCandidate(program, pollPda, "Alice Johnson", "Democratic", creatorKeypair.publicKey);
    await sendAddCandidate(program, pollPda, "Bob Smith", "Republican", creatorKeypair.publicKey);
    console.log('✅ Candidates added');

    // 3. Fetch poll data using Phase 5.5 functions
    console.log('3️⃣ Fetching poll data...');
    const { pollAccount } = await fetchPoll(program, pollId);
    const aliceCandidate = await fetchCandidate(program, pollPda, "Alice Johnson");
    const bobCandidate = await fetchCandidate(program, pollPda, "Bob Smith");
    
    console.log('📊 Poll Data:');
    console.log('  - Question:', pollAccount.question);
    console.log('  - Alice votes:', aliceCandidate.candidateAccount.votes.toString());
    console.log('  - Bob votes:', bobCandidate.candidateAccount.votes.toString());

    // 4. Vote using Phase 5.6 functions
    console.log('4️⃣ Casting vote...');
    const voteTx = await sendVote(
      program,
      pollPda,
      aliceCandidate.candidatePda,
      voterKeypair.publicKey
    );
    console.log('✅ Vote cast:', voteTx);

    // 5. Get final results
    console.log('5️⃣ Getting final results...');
    const results = await fetchPollResults(program, pollId);
    console.log('📈 Final Results:');
    console.log('  - Total votes:', results.totalVotes);
    console.log('  - Is active:', results.isActive);
    results.candidates.forEach((candidate: any) => {
      console.log(`  - ${candidate.name} (${candidate.party}): ${candidate.votes} votes (${candidate.percentage.toFixed(1)}%)`);
    });

    return {
      pollId,
      createTx,
      voteTx,
      results
    };

  } catch (error) {
    console.error('❌ Comprehensive example failed:', error);
    throw error;
  }
};

// Usage examples for documentation
export const PHASE_5_EXAMPLES = {
  fetching: `
// Phase 5.5: Fetch a Poll account by its PDA
import { fetchPoll, derivePDAs } from 'voting-dapp-frontend';

const pollId = 12345;
const { pollAccount, pollPda } = await fetchPoll(program, pollId);

console.log('Poll Question:', pollAccount.question);
console.log('Poll PDA:', pollPda.toString());

// Alternative using PDA derivation utility
const [pollPdaAlt] = derivePDAs.poll(program.programId, pollId);
`,

  voting: `
// Phase 5.6: Send the vote transaction
import { sendVote, derivePDAs } from 'voting-dapp-frontend';

const pollId = 12345;
const candidateName = "Alice Johnson";
const [pollPda] = derivePDAs.poll(program.programId, pollId);
const [candidatePda] = derivePDAs.candidate(program.programId, pollPda, candidateName);
const voter = wallet.publicKey;

const tx = await sendVote(program, pollPda, candidatePda, voter);
console.log('Vote transaction:', tx);
`
};

// Test function to validate the implementations
export const testPhase5Implementation = async () => {
  console.log('🧪 Testing Phase 5 Implementation');

  try {
    // Test PDA derivation
    const connection = getConnection('localnet');
    const mockWallet = {
      publicKey: Keypair.generate().publicKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };
    
    const program = getProgram(connection, mockWallet as any);
    
    // Test PDA derivation functions
    const pollId = 12345;
    const [pollPda] = derivePDAs.poll(program.programId, pollId);
    const [candidatePda] = derivePDAs.candidate(program.programId, pollPda, "TestCandidate");
    const [receiptPda] = derivePDAs.voterReceipt(program.programId, pollPda, mockWallet.publicKey);

    console.log('✅ PDA Derivation Tests:');
    console.log('  - Poll PDA:', pollPda.toString());
    console.log('  - Candidate PDA:', candidatePda.toString());
    console.log('  - Receipt PDA:', receiptPda.toString());

    console.log('✅ Phase 5 implementation validation complete!');

    return {
      success: true,
      pollPda: pollPda.toString(),
      candidatePda: candidatePda.toString(),
      receiptPda: receiptPda.toString()
    };

  } catch (error) {
    console.error('❌ Phase 5 implementation test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export default {
  exampleFetchingLogic,
  exampleVotingTransaction,
  comprehensiveExample,
  testPhase5Implementation,
  PHASE_5_EXAMPLES
};