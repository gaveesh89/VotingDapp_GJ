// Transaction and fetching utilities for the voting dapp
import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// Import the program type
type VotingDappProgram = Program<any>;

// Function to fetch a Poll account by its PDA
export const fetchPoll = async (program: VotingDappProgram, pollId: number) => {
  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new anchor.BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const pollAccount = await (program.account as any).poll.fetch(pollPda);
  return { pollAccount, pollPda };
};

// Function to fetch a Candidate account by its PDA
export const fetchCandidate = async (
  program: VotingDappProgram, 
  pollPda: PublicKey, 
  candidateName: string
) => {
  const [candidatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("candidate"), pollPda.toBuffer(), Buffer.from(candidateName)],
    program.programId
  );
  const candidateAccount = await (program.account as any).candidate.fetch(candidatePda);
  return { candidateAccount, candidatePda };
};

// Function to fetch a Voter Receipt by its PDA
export const fetchVoterReceipt = async (
  program: VotingDappProgram,
  pollPda: PublicKey,
  voter: PublicKey
) => {
  const [receiptPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("receipt"), pollPda.toBuffer(), voter.toBuffer()],
    program.programId
  );
  
  try {
    const receiptAccount = await (program.account as any).voterReceipt.fetch(receiptPda);
    return { receiptAccount, receiptPda, exists: true };
  } catch (error) {
    // Receipt doesn't exist, user hasn't voted
    return { receiptAccount: null, receiptPda, exists: false };
  }
};

// Function to send the vote transaction
export const sendVote = async (
  program: VotingDappProgram, 
  pollPda: PublicKey, 
  candidatePda: PublicKey, 
  voter: PublicKey
) => {
  const [receiptPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("receipt"), pollPda.toBuffer(), voter.toBuffer()],
    program.programId
  );

  const tx = await (program.methods as any)
    .vote()
    .accounts({
      poll: pollPda,
      candidate: candidatePda,
      voterReceipt: receiptPda,
      voter: voter,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
};

// Function to send create poll transaction
export const sendCreatePoll = async (
  program: VotingDappProgram,
  pollId: number,
  question: string,
  description: string,
  startTime: number,
  endTime: number,
  creator: PublicKey
) => {
  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new anchor.BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const tx = await (program.methods as any)
    .initializePoll(
      new anchor.BN(pollId),
      question,
      description,
      new anchor.BN(startTime),
      new anchor.BN(endTime)
    )
    .accounts({
      poll: pollPda,
      creator: creator,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { tx, pollPda };
};

// Function to send add candidate transaction
export const sendAddCandidate = async (
  program: VotingDappProgram,
  pollPda: PublicKey,
  candidateName: string,
  candidateParty: string,
  creator: PublicKey
) => {
  const [candidatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("candidate"), pollPda.toBuffer(), Buffer.from(candidateName)],
    program.programId
  );

  const tx = await (program.methods as any)
    .initializeCandidate(candidateName, candidateParty)
    .accounts({
      poll: pollPda,
      candidate: candidatePda,
      creator: creator,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { tx, candidatePda };
};

// Function to get all candidates for a poll
export const fetchAllCandidatesForPoll = async (
  program: VotingDappProgram,
  pollPda: PublicKey
) => {
  try {
    // Fetch all candidate accounts that belong to this poll
    const candidates = await (program.account as any).candidate.all([
      {
        memcmp: {
          offset: 8, // Skip discriminator
          bytes: pollPda.toBase58()
        }
      }
    ]);
    
    return candidates.map((candidate: any) => ({
      account: candidate.account,
      publicKey: candidate.publicKey
    }));
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
};

// Function to get poll results with vote counts and percentages
export const fetchPollResults = async (
  program: VotingDappProgram,
  pollId: number
) => {
  try {
    const { pollAccount, pollPda } = await fetchPoll(program, pollId);
    const candidates = await fetchAllCandidatesForPoll(program, pollPda);
    
    const totalVotes = candidates.reduce((sum: number, candidate: any) => 
      sum + candidate.account.votes.toNumber(), 0
    );

    const candidateResults = candidates.map((candidate: any) => ({
      name: candidate.account.name,
      party: candidate.account.party,
      votes: candidate.account.votes.toNumber(),
      percentage: totalVotes > 0 ? (candidate.account.votes.toNumber() / totalVotes) * 100 : 0,
      publicKey: candidate.publicKey
    }));

    // Check if poll is currently active
    const now = Math.floor(Date.now() / 1000);
    const isActive = now >= pollAccount.startTime.toNumber() && now <= pollAccount.endTime.toNumber();

    return {
      poll: pollAccount,
      pollPda,
      candidates: candidateResults,
      totalVotes,
      isActive,
      hasStarted: now >= pollAccount.startTime.toNumber(),
      hasEnded: now > pollAccount.endTime.toNumber()
    };
  } catch (error) {
    console.error('Error fetching poll results:', error);
    throw error;
  }
};

// Utility function to check if user has voted
export const checkUserVoted = async (
  program: VotingDappProgram,
  pollPda: PublicKey,
  voter: PublicKey
): Promise<boolean> => {
  const { exists } = await fetchVoterReceipt(program, pollPda, voter);
  return exists;
};

// Helper function to derive PDA addresses (for external use)
export const derivePDAs = {
  poll: (programId: PublicKey, pollId: number) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(pollId).toArrayLike(Buffer, "le", 8)],
      programId
    );
  },

  candidate: (programId: PublicKey, pollPda: PublicKey, candidateName: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("candidate"), pollPda.toBuffer(), Buffer.from(candidateName)],
      programId
    );
  },

  voterReceipt: (programId: PublicKey, pollPda: PublicKey, voter: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), pollPda.toBuffer(), voter.toBuffer()],
      programId
    );
  }
};