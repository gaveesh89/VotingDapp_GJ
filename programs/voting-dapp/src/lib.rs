use anchor_lang::prelude::*;

declare_id!("ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8");

// Constants for PDA seeds
const POLL_SEED: &[u8] = b"poll";
const CANDIDATE_SEED: &[u8] = b"candidate";
const RECEIPT_SEED: &[u8] = b"receipt";

#[program]
pub mod voting_dapp {
    use super::*;

    /// Initialize a new poll
    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        question: String,
        description: String,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        // Validate that the start time is before the end time
        require!(start_time < end_time, ErrorCode::InvalidTimeRange);

        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.creator = ctx.accounts.creator.key();
        poll.question = question;
        poll.description = description;
        poll.start_time = start_time;
        poll.end_time = end_time;
        poll.candidate_count = 0;
        
        msg!("Poll initialized with ID: {}", poll_id);
        Ok(())
    }

    /// Add a candidate to a poll
    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        candidate_name: String,
        candidate_party: String,
    ) -> Result<()> {
        // Only the poll creator can initialize a candidate
        require_keys_eq!(ctx.accounts.poll.creator, ctx.accounts.creator.key(), ErrorCode::Unauthorized);

        let poll = &mut ctx.accounts.poll;
        let candidate = &mut ctx.accounts.candidate;

        candidate.poll = poll.key();
        candidate.name = candidate_name.clone();
        candidate.party = candidate_party;
        candidate.votes = 0;

        // Increment the candidate count on the poll account
        poll.candidate_count = poll.candidate_count.checked_add(1).unwrap();
        
        msg!("Candidate {} added to poll {}", candidate.name, poll.poll_id);
        Ok(())
    }

    /// Cast a vote for a candidate
    pub fn vote(ctx: Context<Vote>) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let poll = &ctx.accounts.poll;

        // Check if the current time is within the poll's active period
        require!(clock >= poll.start_time && clock <= poll.end_time, ErrorCode::PollNotActive);

        // Increment the candidate's vote count
        ctx.accounts.candidate.votes = ctx.accounts.candidate.votes.checked_add(1).unwrap();

        // Initialize the voter receipt to prevent double voting
        ctx.accounts.voter_receipt.poll = poll.key();
        ctx.accounts.voter_receipt.voter = ctx.accounts.voter.key();
        ctx.accounts.voter_receipt.has_voted = true;

        msg!("Vote cast successfully");
        Ok(())
    }
}

// Account validation structs
#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(
        init,
        payer = creator,
        seeds = [POLL_SEED, poll_id.to_le_bytes().as_ref()],
        bump,
        space = 8 + Poll::INIT_SPACE
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    #[account(
        init,
        payer = creator,
        seeds = [CANDIDATE_SEED, poll.key().as_ref(), candidate_name.as_bytes()],
        bump,
        space = 8 + Candidate::INIT_SPACE
    )]
    pub candidate: Account<'info, Candidate>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub candidate: Account<'info, Candidate>,
    #[account(
        init,
        payer = voter,
        seeds = [RECEIPT_SEED, poll.key().as_ref(), voter.key().as_ref()],
        bump,
        space = 8 + VoterReceipt::INIT_SPACE
    )]
    pub voter_receipt: Account<'info, VoterReceipt>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Data structures
#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    pub creator: Pubkey,
    #[max_len(200)]
    pub question: String,
    #[max_len(280)]
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub candidate_count: u64,
}

// Account to store candidate details and votes, linked to a Poll PDA
#[account]
#[derive(InitSpace)]
pub struct Candidate {
    pub poll: Pubkey,
    #[max_len(50)]
    pub name: String,
    #[max_len(30)]
    pub party: String,
    pub votes: u64,
}

// Account to prevent double voting for a specific poll and voter
#[account]
#[derive(InitSpace)]
pub struct VoterReceipt {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub has_voted: bool,
}

// Error handling
#[error_code]
pub enum ErrorCode {
    #[msg("The poll start time must be before the end time.")]
    InvalidTimeRange,
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("The poll is not currently active for voting.")]
    PollNotActive,
}
