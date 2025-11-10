// Entry point for the voting dapp frontend
export { VotingDappClient } from './client';
export { getProgram, getConnection, getPollPDA, getCandidatePDA, getVoterReceiptPDA, programId } from './program';
export {
  fetchPoll,
  fetchCandidate,
  fetchVoterReceipt,
  sendVote,
  sendCreatePoll,
  sendAddCandidate,
  fetchAllCandidatesForPoll,
  fetchPollResults,
  checkUserVoted,
  derivePDAs
} from './transactions';
export * from './types';

// Example usage for vanilla JavaScript/TypeScript integration
import { VotingDappClient } from './client';
import { Network } from './types';
import { Keypair } from '@solana/web3.js';

// Example: Basic usage without React
export const createBasicExample = () => {
  // Mock wallet for demonstration
  const mockWallet = {
    publicKey: Keypair.generate().publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };

  // Initialize client
  const client = new VotingDappClient(Network.LOCALNET, mockWallet as any);

  return {
    // Create a poll
    createPoll: async () => {
      try {
        const tx = await client.createPoll({
          pollId: Date.now(),
          question: "Should we upgrade our system?",
          description: "A poll to decide on system upgrades",
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        });
        console.log('Poll created:', tx);
        return tx;
      } catch (error) {
        console.error('Error:', error);
      }
    },

    // Add candidate
    addCandidate: async (pollId: number) => {
      try {
        const tx = await client.addCandidate({
          pollId,
          candidateName: "Alice Johnson",
          candidateParty: "Progressive Party"
        });
        console.log('Candidate added:', tx);
        return tx;
      } catch (error) {
        console.error('Error:', error);
      }
    },

    // Cast vote
    vote: async (pollId: number, candidateName: string) => {
      try {
        const tx = await client.vote({
          pollId,
          candidateName
        });
        console.log('Vote cast:', tx);
        return tx;
      } catch (error) {
        console.error('Error:', error);
      }
    },

    // Get results
    getPollResults: async (pollId: number) => {
      try {
        const results = await client.getPollResults(pollId);
        console.log('Poll results:', results);
        return results;
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };
};

// Example usage documentation
export const USAGE_EXAMPLES = {
  basic: `
// Basic usage example:
import { VotingDappClient, Network } from 'voting-dapp-frontend';

// Initialize with your wallet
const client = new VotingDappClient(Network.LOCALNET, wallet);

// Create a poll
await client.createPoll({
  pollId: 12345,
  question: "Your poll question?",
  description: "Detailed description",
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 3600
});

// Add candidates
await client.addCandidate({
  pollId: 12345,
  candidateName: "Candidate A",
  candidateParty: "Party 1"
});

// Vote
await client.vote({
  pollId: 12345,
  candidateName: "Candidate A"
});

// Get results
const results = await client.getPollResults(12345);
`,

  advanced: `
// Advanced usage with error handling:
try {
  const client = new VotingDappClient(Network.DEVNET, wallet);
  
  // Check if user already voted
  const hasVoted = await client.hasUserVoted(pollId);
  if (!hasVoted) {
    await client.vote({ pollId, candidateName });
  }
  
  // Get real-time results
  const results = await client.getPollResults(pollId);
  console.log('Live results:', results);
  
} catch (error) {
  console.error('Transaction failed:', error);
}
`
};