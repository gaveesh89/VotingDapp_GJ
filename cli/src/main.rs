use anchor_client::{
    anchor_lang::prelude::Pubkey,
    solana_sdk::{
        commitment_config::CommitmentConfig,
        signature::read_keypair_file,
    },
    Client, Cluster,
};
use anyhow::Result;
use clap::{Parser, Subcommand};
use std::rc::Rc;

mod client;
mod utils;

use client::VotingClient;

#[derive(Parser)]
#[command(name = "voting-cli")]
#[command(about = "A Rust CLI for interacting with the Solana Voting Dapp", long_about = None)]
struct Cli {
    /// Path to the payer keypair file
    #[arg(short, long, default_value = "~/.config/solana/id.json")]
    keypair: String,

    /// Cluster to use (localnet, devnet, mainnet)
    #[arg(short, long, default_value = "localnet")]
    cluster: String,

    /// Program ID of the voting dapp
    #[arg(short, long, default_value = "ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8")]
    program_id: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new poll
    InitializePoll {
        /// Unique poll ID
        poll_id: u64,
        /// Poll question
        question: String,
        /// Poll description
        description: String,
        /// Start time (Unix timestamp)
        start_time: i64,
        /// End time (Unix timestamp)
        end_time: i64,
    },
    /// Add a candidate to a poll
    AddCandidate {
        /// Poll ID
        poll_id: u64,
        /// Candidate name
        name: String,
        /// Candidate party affiliation
        party: String,
    },
    /// Vote for a candidate
    Vote {
        /// Poll ID
        poll_id: u64,
        /// Candidate name
        candidate_name: String,
    },
    /// Get poll details
    GetPoll {
        /// Poll ID
        poll_id: u64,
    },
    /// Get poll results with all candidates and their vote counts
    GetResults {
        /// Poll ID
        poll_id: u64,
    },
    /// Check if a user has voted in a poll
    HasVoted {
        /// Poll ID
        poll_id: u64,
        /// Voter public key (optional, defaults to payer)
        #[arg(short, long)]
        voter: Option<String>,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    // Expand tilde in keypair path
    let keypair_path = shellexpand::tilde(&cli.keypair).to_string();
    
    // Read keypair
    let payer = read_keypair_file(&keypair_path)
        .map_err(|e| anyhow::anyhow!("Failed to read keypair from {}: {}", keypair_path, e))?;

    // Parse cluster
    let cluster = match cli.cluster.as_str() {
        "localnet" => Cluster::Localnet,
        "devnet" => Cluster::Devnet,
        "mainnet" => Cluster::Mainnet,
        _ => return Err(anyhow::anyhow!("Invalid cluster: {}", cli.cluster)),
    };

    // Parse program ID
    let program_id = cli.program_id.parse::<Pubkey>()
        .map_err(|e| anyhow::anyhow!("Invalid program ID: {}", e))?;

    // Create client
    let client = Client::new_with_options(
        cluster,
        Rc::new(payer),
        CommitmentConfig::confirmed(),
    );

    let voting_client = VotingClient::new(client, program_id);

    // Execute command
    match cli.command {
        Commands::InitializePoll {
            poll_id,
            question,
            description,
            start_time,
            end_time,
        } => {
            println!("Initializing poll {}...", poll_id);
            let signature = voting_client.initialize_poll(
                poll_id,
                question.clone(),
                description.clone(),
                start_time,
                end_time,
            )?;
            println!("✓ Poll created successfully!");
            println!("  Poll ID: {}", poll_id);
            println!("  Question: {}", question);
            println!("  Description: {}", description);
            println!("  Start: {}", chrono::DateTime::from_timestamp(start_time, 0).unwrap());
            println!("  End: {}", chrono::DateTime::from_timestamp(end_time, 0).unwrap());
            println!("  Transaction: {}", signature);
        }
        Commands::AddCandidate {
            poll_id,
            name,
            party,
        } => {
            println!("Adding candidate to poll {}...", poll_id);
            let signature = voting_client.add_candidate(poll_id, name.clone(), party.clone())?;
            println!("✓ Candidate added successfully!");
            println!("  Name: {}", name);
            println!("  Party: {}", party);
            println!("  Transaction: {}", signature);
        }
        Commands::Vote {
            poll_id,
            candidate_name,
        } => {
            println!("Voting for {} in poll {}...", candidate_name, poll_id);
            let signature = voting_client.vote(poll_id, candidate_name.clone())?;
            println!("✓ Vote cast successfully!");
            println!("  Candidate: {}", candidate_name);
            println!("  Transaction: {}", signature);
        }
        Commands::GetPoll { poll_id } => {
            println!("Fetching poll {}...", poll_id);
            let poll = voting_client.get_poll(poll_id)?;
            println!("\n=== Poll {} ===", poll_id);
            println!("Creator: {}", poll.creator);
            println!("Question: {}", poll.question);
            println!("Description: {}", poll.description);
            println!("Start: {}", chrono::DateTime::from_timestamp(poll.start_time, 0).unwrap());
            println!("End: {}", chrono::DateTime::from_timestamp(poll.end_time, 0).unwrap());
            println!("Candidates: {}", poll.candidate_count);
        }
        Commands::GetResults { poll_id } => {
            println!("Fetching results for poll {}...", poll_id);
            let (poll, candidates) = voting_client.get_poll_results(poll_id)?;
            
            println!("\n=== Poll {} Results ===", poll_id);
            println!("Question: {}", poll.question);
            println!("Description: {}", poll.description);
            println!("\nCandidates:");
            
            let mut total_votes = 0u64;
            for candidate in &candidates {
                println!("  • {} ({}): {} votes", candidate.name, candidate.party, candidate.votes);
                total_votes += candidate.votes;
            }
            
            println!("\nTotal votes cast: {}", total_votes);
            
            if !candidates.is_empty() {
                let winner = candidates.iter().max_by_key(|c| c.votes).unwrap();
                println!("Leading candidate: {} with {} votes", winner.name, winner.votes);
            }
        }
        Commands::HasVoted { poll_id, voter } => {
            let voter_pubkey = if let Some(voter_str) = voter {
                voter_str.parse::<Pubkey>()?
            } else {
                voting_client.payer_pubkey()
            };
            
            let has_voted = voting_client.has_voted(poll_id, voter_pubkey)?;
            
            if has_voted {
                println!("✓ User {} has voted in poll {}", voter_pubkey, poll_id);
            } else {
                println!("✗ User {} has not voted in poll {}", voter_pubkey, poll_id);
            }
        }
    }

    Ok(())
}
