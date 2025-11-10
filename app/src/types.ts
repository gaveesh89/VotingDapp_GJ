// Types and interfaces for the voting dapp frontend
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface Poll {
  pollId: BN;
  creator: PublicKey;
  question: string;
  description: string;
  startTime: BN;
  endTime: BN;
  candidateCount: BN;
}

export interface Candidate {
  poll: PublicKey;
  name: string;
  party: string;
  votes: BN;
}

export interface VoterReceipt {
  poll: PublicKey;
  voter: PublicKey;
  hasVoted: boolean;
}

export interface CreatePollParams {
  pollId: number;
  question: string;
  description: string;
  startTime: number;
  endTime: number;
}

export interface AddCandidateParams {
  pollId: number;
  candidateName: string;
  candidateParty: string;
}

export interface VoteParams {
  pollId: number;
  candidateName: string;
}

// Network configuration
export enum Network {
  LOCALNET = 'localnet',
  DEVNET = 'devnet',
  MAINNET = 'mainnet'
}

export interface NetworkConfig {
  name: Network;
  endpoint: string;
  wsEndpoint?: string;
}