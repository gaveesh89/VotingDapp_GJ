// Simple HTML example for testing the voting dapp client
// This can be used to test the client integration without React

import { VotingDappClient } from './client';
import { Network } from './types';
import { Keypair } from '@solana/web3.js';

// Simple example that demonstrates the client functionality
export class SimpleVotingDemo {
  private client: VotingDappClient | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Create a mock wallet for demonstration
    // In a real application, this would be provided by a wallet adapter
    const mockKeypair = Keypair.generate();
    const mockWallet = {
      publicKey: mockKeypair.publicKey,
      signTransaction: async (tx: any) => {
        // In a real wallet, this would sign the transaction
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        // In a real wallet, this would sign all transactions
        return txs;
      },
    };

    // Initialize the client
    this.client = new VotingDappClient(Network.LOCALNET, mockWallet as any);
    console.log('Voting client initialized');
  }

  // Demo function to create and interact with a poll
  async runDemo() {
    if (!this.client) {
      console.error('Client not initialized');
      return;
    }

    try {
      // 1. Create a new poll
      console.log('Creating poll...');
      const pollId = Math.floor(Math.random() * 1000000);
      const createTx = await this.client.createPoll({
        pollId,
        question: "What's your favorite blockchain?",
        description: "Choose your preferred blockchain platform",
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 3600
      });
      console.log('Poll created with transaction:', createTx);

      // 2. Add candidates
      console.log('Adding candidates...');
      await this.client.addCandidate({
        pollId,
        candidateName: "Solana",
        candidateParty: "Fast & Cheap"
      });

      await this.client.addCandidate({
        pollId,
        candidateName: "Ethereum",
        candidateParty: "Smart Contracts"
      });

      console.log('Candidates added successfully');

      // 3. Fetch poll data
      console.log('Fetching poll data...');
      const poll = await this.client.getPoll(pollId);
      const candidates = await this.client.getCandidatesForPoll(pollId);
      
      console.log('Poll:', poll);
      console.log('Candidates:', candidates);

      // 4. Cast a vote
      console.log('Casting vote...');
      const voteTx = await this.client.vote({
        pollId,
        candidateName: "Solana"
      });
      console.log('Vote cast with transaction:', voteTx);

      // 5. Get results
      console.log('Getting poll results...');
      const results = await this.client.getPollResults(pollId);
      console.log('Final results:', results);

      return {
        pollId,
        poll,
        candidates,
        results
      };

    } catch (error) {
      console.error('Demo failed:', error);
      throw error;
    }
  }

  // Test individual functions
  async testCreatePoll() {
    if (!this.client) return null;

    const pollId = Date.now();
    return await this.client.createPoll({
      pollId,
      question: "Test Poll",
      description: "This is a test poll",
      startTime: Math.floor(Date.now() / 1000),
      endTime: Math.floor(Date.now() / 1000) + 3600
    });
  }

  async testGetPoll(pollId: number) {
    if (!this.client) return null;
    return await this.client.getPoll(pollId);
  }

  async testAddCandidate(pollId: number, name: string, party: string) {
    if (!this.client) return null;
    return await this.client.addCandidate({
      pollId,
      candidateName: name,
      candidateParty: party
    });
  }

  async testVote(pollId: number, candidateName: string) {
    if (!this.client) return null;
    return await this.client.vote({
      pollId,
      candidateName
    });
  }

  async testGetResults(pollId: number) {
    if (!this.client) return null;
    return await this.client.getPollResults(pollId);
  }

  getClient() {
    return this.client;
  }
}

// Export for use in browser or Node.js
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') {
  // Browser environment
  (globalThis as any).window.SimpleVotingDemo = SimpleVotingDemo;
}

export default SimpleVotingDemo;