use anchor_client::{
    anchor_lang::{
        prelude::Pubkey, AnchorDeserialize, AnchorSerialize, Discriminator,
    },
    solana_sdk::{signature::Signature, signer::Signer, system_program},
    Client, Program,
};
use anyhow::Result;
use std::rc::Rc;

use crate::utils::{get_candidate_address, get_poll_address, get_receipt_address};

// Define the account structures matching the on-chain program
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct Poll {
    pub poll_id: u64,
    pub creator: Pubkey,
    pub question: String,
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub candidate_count: u64,
}

impl anchor_client::anchor_lang::AccountDeserialize for Poll {
    fn try_deserialize(buf: &mut &[u8]) -> anchor_client::anchor_lang::Result<Self> {
        if buf.len() < 8 {
            return Err(anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into());
        }
        let given_disc = &buf[0..8];
        if Self::DISCRIMINATOR != given_disc {
            return Err(anchor_client::anchor_lang::error::ErrorCode::AccountDiscriminatorMismatch.into());
        }
        Self::deserialize(&mut &buf[8..])
            .map_err(|_| anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into())
    }

    fn try_deserialize_unchecked(buf: &mut &[u8]) -> anchor_client::anchor_lang::Result<Self> {
        Self::deserialize(buf)
            .map_err(|_| anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into())
    }
}

impl anchor_client::anchor_lang::Discriminator for Poll {
    const DISCRIMINATOR: [u8; 8] = [110, 234, 189, 127, 197, 119, 248, 65];
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct Candidate {
    pub poll: Pubkey,
    pub name: String,
    pub party: String,
    pub votes: u64,
}

impl anchor_client::anchor_lang::AccountDeserialize for Candidate {
    fn try_deserialize(buf: &mut &[u8]) -> anchor_client::anchor_lang::Result<Self> {
        if buf.len() < 8 {
            return Err(anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into());
        }
        let given_disc = &buf[0..8];
        if Self::DISCRIMINATOR != given_disc {
            return Err(anchor_client::anchor_lang::error::ErrorCode::AccountDiscriminatorMismatch.into());
        }
        Self::deserialize(&mut &buf[8..])
            .map_err(|_| anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into())
    }

    fn try_deserialize_unchecked(buf: &mut &[u8]) -> anchor_client::anchor_lang::Result<Self> {
        Self::deserialize(buf)
            .map_err(|_| anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into())
    }
}

impl anchor_client::anchor_lang::Discriminator for Candidate {
    const DISCRIMINATOR: [u8; 8] = [176, 27, 202, 124, 178, 75, 76, 43];
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct VoterReceipt {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub has_voted: bool,
}

impl anchor_client::anchor_lang::AccountDeserialize for VoterReceipt {
    fn try_deserialize(buf: &mut &[u8]) -> anchor_client::anchor_lang::Result<Self> {
        if buf.len() < 8 {
            return Err(anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into());
        }
        let given_disc = &buf[0..8];
        if Self::DISCRIMINATOR != given_disc {
            return Err(anchor_client::anchor_lang::error::ErrorCode::AccountDiscriminatorMismatch.into());
        }
        Self::deserialize(&mut &buf[8..])
            .map_err(|_| anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into())
    }

    fn try_deserialize_unchecked(buf: &mut &[u8]) -> anchor_client::anchor_lang::Result<Self> {
        Self::deserialize(buf)
            .map_err(|_| anchor_client::anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into())
    }
}

impl anchor_client::anchor_lang::Discriminator for VoterReceipt {
    const DISCRIMINATOR: [u8; 8] = [36, 100, 107, 120, 65, 243, 217, 180];
}

pub struct VotingClient<C: Signer> {
    program: Program<Rc<C>>,
    program_id: Pubkey,
}

impl<C: Signer> VotingClient<C> {
    pub fn new(client: Client<Rc<C>>, program_id: Pubkey) -> Self {
        let program = client.program(program_id).unwrap();
        Self { program, program_id }
    }

    pub fn payer_pubkey(&self) -> Pubkey {
        self.program.payer()
    }

    /// Initialize a new poll
    pub fn initialize_poll(
        &self,
        poll_id: u64,
        question: String,
        description: String,
        start_time: i64,
        end_time: i64,
    ) -> Result<Signature> {
        let (poll_address, _) = get_poll_address(&self.program_id, poll_id);

        let signature = self
            .program
            .request()
            .accounts(voting_dapp::accounts::InitializePoll {
                poll: poll_address,
                creator: self.program.payer(),
                system_program: system_program::ID,
            })
            .args(voting_dapp::instruction::InitializePoll {
                poll_id,
                question,
                description,
                start_time,
                end_time,
            })
            .send()?;

        Ok(signature)
    }

    /// Add a candidate to a poll
    pub fn add_candidate(
        &self,
        poll_id: u64,
        name: String,
        party: String,
    ) -> Result<Signature> {
        let (poll_address, _) = get_poll_address(&self.program_id, poll_id);
        let (candidate_address, _) = get_candidate_address(&self.program_id, poll_id, &name);

        let signature = self
            .program
            .request()
            .accounts(voting_dapp::accounts::InitializeCandidate {
                poll: poll_address,
                candidate: candidate_address,
                creator: self.program.payer(),
                system_program: system_program::ID,
            })
            .args(voting_dapp::instruction::InitializeCandidate { name, party })
            .send()?;

        Ok(signature)
    }

    /// Cast a vote for a candidate
    pub fn vote(&self, poll_id: u64, candidate_name: String) -> Result<Signature> {
        let (poll_address, _) = get_poll_address(&self.program_id, poll_id);
        let (candidate_address, _) =
            get_candidate_address(&self.program_id, poll_id, &candidate_name);
        let (receipt_address, _) =
            get_receipt_address(&self.program_id, poll_id, &self.program.payer());

        let signature = self
            .program
            .request()
            .accounts(voting_dapp::accounts::Vote {
                poll: poll_address,
                candidate: candidate_address,
                voter_receipt: receipt_address,
                voter: self.program.payer(),
                system_program: system_program::ID,
            })
            .args(voting_dapp::instruction::Vote {})
            .send()?;

        Ok(signature)
    }

    /// Get poll details
    pub fn get_poll(&self, poll_id: u64) -> Result<Poll> {
        let (poll_address, _) = get_poll_address(&self.program_id, poll_id);
        let account = self.program.account::<Poll>(poll_address)?;
        Ok(account)
    }

    /// Get all candidates for a poll along with their vote counts
    pub fn get_poll_results(&self, poll_id: u64) -> Result<(Poll, Vec<Candidate>)> {
        let poll = self.get_poll(poll_id)?;
        let (poll_address, _) = get_poll_address(&self.program_id, poll_id);

        // Fetch all candidate accounts for this poll
        let accounts = self
            .program
            .accounts::<Candidate>(vec![
                // Filter by discriminator and poll pubkey
                anchor_client::solana_client::rpc_filter::RpcFilterType::Memcmp(
                    anchor_client::solana_client::rpc_filter::Memcmp::new_raw_bytes(
                        8, // Skip discriminator
                        poll_address.to_bytes().to_vec(),
                    ),
                ),
            ])?;

        let mut candidates = Vec::new();
        for (_, candidate) in accounts {
            candidates.push(candidate);
        }

        // Sort candidates by name for consistent display
        candidates.sort_by(|a, b| a.name.cmp(&b.name));

        Ok((poll, candidates))
    }

    /// Check if a user has voted in a poll
    pub fn has_voted(&self, poll_id: u64, voter: Pubkey) -> Result<bool> {
        let (receipt_address, _) = get_receipt_address(&self.program_id, poll_id, &voter);

        match self.program.account::<VoterReceipt>(receipt_address) {
            Ok(receipt) => Ok(receipt.has_voted),
            Err(_) => Ok(false), // Receipt doesn't exist, so user hasn't voted
        }
    }
}

// Define the instruction and account structs for the program
mod voting_dapp {
    use super::*;

    pub mod instruction {
        use super::*;

        #[derive(AnchorSerialize, AnchorDeserialize)]
        pub struct InitializePoll {
            pub poll_id: u64,
            pub question: String,
            pub description: String,
            pub start_time: i64,
            pub end_time: i64,
        }

        impl anchor_client::anchor_lang::Discriminator for InitializePoll {
            const DISCRIMINATOR: [u8; 8] = [155, 234, 66, 103, 52, 251, 109, 89];
        }

        impl anchor_client::anchor_lang::InstructionData for InitializePoll {
            fn data(&self) -> Vec<u8> {
                let mut data = Self::DISCRIMINATOR.to_vec();
                data.extend_from_slice(&anchor_client::anchor_lang::AnchorSerialize::try_to_vec(self).unwrap());
                data
            }
        }

        #[derive(AnchorSerialize, AnchorDeserialize)]
        pub struct InitializeCandidate {
            pub name: String,
            pub party: String,
        }

        impl anchor_client::anchor_lang::Discriminator for InitializeCandidate {
            const DISCRIMINATOR: [u8; 8] = [248, 73, 66, 106, 202, 55, 70, 196];
        }

        impl anchor_client::anchor_lang::InstructionData for InitializeCandidate {
            fn data(&self) -> Vec<u8> {
                let mut data = Self::DISCRIMINATOR.to_vec();
                data.extend_from_slice(&anchor_client::anchor_lang::AnchorSerialize::try_to_vec(self).unwrap());
                data
            }
        }

        #[derive(AnchorSerialize, AnchorDeserialize)]
        pub struct Vote {}

        impl anchor_client::anchor_lang::Discriminator for Vote {
            const DISCRIMINATOR: [u8; 8] = [227, 110, 155, 23, 136, 126, 172, 25];
        }

        impl anchor_client::anchor_lang::InstructionData for Vote {
            fn data(&self) -> Vec<u8> {
                Self::DISCRIMINATOR.to_vec()
            }
        }
    }

    pub mod accounts {
        use super::*;

        pub struct InitializePoll {
            pub poll: Pubkey,
            pub creator: Pubkey,
            pub system_program: Pubkey,
        }

        impl anchor_client::anchor_lang::ToAccountMetas for InitializePoll {
            fn to_account_metas(
                &self,
                _is_signer: Option<bool>,
            ) -> Vec<anchor_client::anchor_lang::solana_program::instruction::AccountMeta> {
                vec![
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.poll,
                        false,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.creator,
                        true,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                        self.system_program,
                        false,
                    ),
                ]
            }
        }

        pub struct InitializeCandidate {
            pub poll: Pubkey,
            pub candidate: Pubkey,
            pub creator: Pubkey,
            pub system_program: Pubkey,
        }

        impl anchor_client::anchor_lang::ToAccountMetas for InitializeCandidate {
            fn to_account_metas(
                &self,
                _is_signer: Option<bool>,
            ) -> Vec<anchor_client::anchor_lang::solana_program::instruction::AccountMeta> {
                vec![
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.poll,
                        false,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.candidate,
                        false,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.creator,
                        true,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                        self.system_program,
                        false,
                    ),
                ]
            }
        }

        pub struct Vote {
            pub poll: Pubkey,
            pub candidate: Pubkey,
            pub voter_receipt: Pubkey,
            pub voter: Pubkey,
            pub system_program: Pubkey,
        }

        impl anchor_client::anchor_lang::ToAccountMetas for Vote {
            fn to_account_metas(
                &self,
                _is_signer: Option<bool>,
            ) -> Vec<anchor_client::anchor_lang::solana_program::instruction::AccountMeta> {
                vec![
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.poll,
                        false,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.candidate,
                        false,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.voter_receipt,
                        false,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new(
                        self.voter,
                        true,
                    ),
                    anchor_client::anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                        self.system_program,
                        false,
                    ),
                ]
            }
        }
    }
}
