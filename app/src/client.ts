// Voting DApp API client for easy interaction with the program
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { Wallet, BN } from '@coral-xyz/anchor';
import { 
  getProgram, 
  getConnection, 
  getPollPDA, 
  getCandidatePDA, 
  getVoterReceiptPDA,
  programId 
} from './program';
import {
  fetchPoll,
  fetchCandidate,
  fetchVoterReceipt,
  sendVote,
  sendCreatePoll,
  sendAddCandidate,
  fetchAllCandidatesForPoll,
  fetchPollResults,
  checkUserVoted
} from './transactions';
import { 
  Poll, 
  Candidate, 
  VoterReceipt, 
  CreatePollParams, 
  AddCandidateParams, 
  VoteParams, 
  Network 
} from './types';

export class VotingDappClient {
  private connection: Connection;
  private wallet: Wallet;
  private program: any;

  constructor(network: Network = Network.LOCALNET, wallet: Wallet) {
    this.connection = getConnection(network);
    this.wallet = wallet;
    this.program = getProgram(this.connection, wallet);
  }

  // Create a new poll
  async createPoll(params: CreatePollParams): Promise<string> {
    const { pollId, question, description, startTime, endTime } = params;

    try {
      const { tx } = await sendCreatePoll(
        this.program,
        pollId,
        question,
        description,
        startTime,
        endTime,
        this.wallet.publicKey
      );
      return tx;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }

  // Add a candidate to a poll
  async addCandidate(params: AddCandidateParams): Promise<string> {
    const { pollId, candidateName, candidateParty } = params;
    const [pollPDA] = getPollPDA(pollId);

    try {
      const { tx } = await sendAddCandidate(
        this.program,
        pollPDA,
        candidateName,
        candidateParty,
        this.wallet.publicKey
      );
      return tx;
    } catch (error) {
      console.error('Error adding candidate:', error);
      throw error;
    }
  }

  // Cast a vote for a candidate
  async vote(params: VoteParams): Promise<string> {
    const { pollId, candidateName } = params;
    const [pollPDA] = getPollPDA(pollId);
    const [candidatePDA] = getCandidatePDA(pollPDA, candidateName);

    try {
      const tx = await sendVote(
        this.program,
        pollPDA,
        candidatePDA,
        this.wallet.publicKey
      );
      return tx;
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  }

  // Fetch poll data
  async getPoll(pollId: number): Promise<Poll | null> {
    try {
      const { pollAccount } = await fetchPoll(this.program, pollId);
      return pollAccount as Poll;
    } catch (error) {
      console.error('Error fetching poll:', error);
      return null;
    }
  }

  // Fetch candidate data
  async getCandidate(pollId: number, candidateName: string): Promise<Candidate | null> {
    const [pollPDA] = getPollPDA(pollId);
    
    try {
      const { candidateAccount } = await fetchCandidate(this.program, pollPDA, candidateName);
      return candidateAccount as Candidate;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
  }

  // Check if user has voted
  async hasUserVoted(pollId: number, voterKey?: PublicKey): Promise<boolean> {
    const voter = voterKey || this.wallet.publicKey;
    const [pollPDA] = getPollPDA(pollId);
    
    try {
      return await checkUserVoted(this.program, pollPDA, voter);
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  // Get all candidates for a poll
  async getCandidatesForPoll(pollId: number): Promise<Candidate[]> {
    const [pollPDA] = getPollPDA(pollId);
    
    try {
      const candidates = await fetchAllCandidatesForPoll(this.program, pollPDA);
      return candidates.map((candidate: any) => candidate.account as Candidate);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  }

  // Get poll results
  async getPollResults(pollId: number) {
    try {
      return await fetchPollResults(this.program, pollId);
    } catch (error) {
      console.error('Error fetching poll results:', error);
      throw error;
    }
  }

  // Helper to check if poll is currently active
  private isPollActive(poll: Poll): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now >= poll.startTime.toNumber() && now <= poll.endTime.toNumber();
  }

  // Get connection for external use
  getConnection(): Connection {
    return this.connection;
  }

  // Get program for advanced operations
  getProgram() {
    return this.program;
  }
}