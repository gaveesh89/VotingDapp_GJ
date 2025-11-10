use anchor_client::solana_sdk::pubkey::Pubkey;

pub const POLL_SEED: &[u8] = b"poll";
pub const CANDIDATE_SEED: &[u8] = b"candidate";
pub const RECEIPT_SEED: &[u8] = b"receipt";

/// Derive the PDA for a poll account
pub fn get_poll_address(program_id: &Pubkey, poll_id: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[POLL_SEED, &poll_id.to_le_bytes()],
        program_id,
    )
}

/// Derive the PDA for a candidate account
pub fn get_candidate_address(
    program_id: &Pubkey,
    poll_id: u64,
    candidate_name: &str,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            CANDIDATE_SEED,
            &poll_id.to_le_bytes(),
            candidate_name.as_bytes(),
        ],
        program_id,
    )
}

/// Derive the PDA for a voter receipt account
pub fn get_receipt_address(
    program_id: &Pubkey,
    poll_id: u64,
    voter: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[RECEIPT_SEED, &poll_id.to_le_bytes(), voter.as_ref()],
        program_id,
    )
}
