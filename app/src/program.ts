// Function to connect to the Solana program using the IDL and program ID
import { Program, AnchorProvider, Wallet, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

// Import IDL as a module - requires resolveJsonModule in tsconfig
const idl = require('./idl/voting_dapp.json') as Idl & { address: string };

const programId = new PublicKey(idl.address);

export const getProgram = (connection: Connection, wallet: Wallet) => {
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(idl, provider);
  return program;
};

// Export program ID for convenience
export { programId };

// Type exports for better TypeScript support
export type VotingDappProgram = Program<Idl>;

// Helper function to get provider
export const getProvider = (connection: Connection, wallet: Wallet) => {
  return new AnchorProvider(connection, wallet, {});
};

// Connection helper for different networks
export const getConnection = (network: 'mainnet' | 'devnet' | 'localnet' = 'localnet') => {
  const endpoints = {
    mainnet: 'https://api.mainnet-beta.solana.com',
    devnet: 'https://api.devnet.solana.com',
    localnet: 'http://127.0.0.1:8899'
  };
  
  return new Connection(endpoints[network], 'confirmed');
};

// PDA helper functions for frontend use
export const getPollPDA = (pollId: number) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), Buffer.from(pollId.toString().padStart(8, '0'), 'hex')],
    programId
  );
};

export const getCandidatePDA = (pollKey: PublicKey, candidateName: string) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("candidate"), pollKey.toBuffer(), Buffer.from(candidateName)],
    programId
  );
};

export const getVoterReceiptPDA = (pollKey: PublicKey, voterKey: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("receipt"), pollKey.toBuffer(), voterKey.toBuffer()],
    programId
  );
};