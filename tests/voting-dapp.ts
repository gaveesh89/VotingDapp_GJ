import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VotingDapp } from "../target/types/voting_dapp";
import { assert } from "chai";

describe("voting-dapp", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.VotingDapp as Program<VotingDapp>;

  // Test variables
  const creator = provider.wallet as anchor.Wallet;
  const voter = anchor.web3.Keypair.generate();
  const pollId = new anchor.BN(1);
  const candidateName = "Alice";
  const candidateParty = "Blue";

  // Helper function to derive PDAs
  const getPollPda = async (pollId: anchor.BN) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
  };

  const getCandidatePda = async (pollKey: anchor.web3.PublicKey, name: string) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("candidate"), pollKey.toBuffer(), Buffer.from(name)],
      program.programId
    );
  };

  const getReceiptPda = async (pollKey: anchor.web3.PublicKey, voterKey: anchor.web3.PublicKey) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), pollKey.toBuffer(), voterKey.toBuffer()],
      program.programId
    );
  };

  it("Is initialized!", async () => {
    // Test successful poll initialization
    const now = new anchor.BN(Math.floor(Date.now() / 1000));
    const startTime = now.sub(new anchor.BN(10)); // Start 10 seconds ago
    const endTime = now.add(new anchor.BN(3600)); // End in 1 hour
    const [pollPda] = await getPollPda(pollId);

    await program.methods
      .initializePoll(
        pollId,
        "Should we use Anchor?",
        "A simple yes/no poll.",
        startTime,
        endTime
      )
      .accounts({
        creator: creator.publicKey,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollPda);
    assert.equal(pollAccount.pollId.toString(), pollId.toString());
    assert.equal(pollAccount.creator.toBase58(), creator.publicKey.toBase58());
    assert.equal(pollAccount.candidateCount.toNumber(), 0);
  });

  it("Can initialize candidate and vote successfully", async () => {
    // Initialize a candidate
    const [pollPda] = await getPollPda(pollId);
    const [candidatePda] = await getCandidatePda(pollPda, candidateName);

    await program.methods
      .initializeCandidate(candidateName, candidateParty)
      .accounts({
        poll: pollPda,
        creator: creator.publicKey,
      })
      .rpc();

    // Airdrop SOL to the voter for the vote transaction
    await provider.connection.requestAirdrop(voter.publicKey, 2000000000);
    // Wait for airdrop to confirm
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(voter.publicKey, 2000000000)
    );

    // Vote for the candidate
    const [receiptPda] = await getReceiptPda(pollPda, voter.publicKey);

    await program.methods
      .vote()
      .accounts({
        poll: pollPda,
        candidate: candidatePda,
        voter: voter.publicKey,
      })
      .signers([voter])
      .rpc();

    // Verify vote count and receipt
    const candidateAccount = await program.account.candidate.fetch(candidatePda);
    assert.equal(candidateAccount.votes.toNumber(), 1);
    const receiptAccount = await program.account.voterReceipt.fetch(receiptPda);
    assert.isTrue(receiptAccount.hasVoted);
  });

  it("Fails on double voting", async () => {
    // Test that a second vote fails
    const [pollPda] = await getPollPda(pollId);
    const [candidatePda] = await getCandidatePda(pollPda, candidateName);
    const [receiptPda] = await getReceiptPda(pollPda, voter.publicKey);

    try {
      await program.methods
        .vote()
        .accounts({
          poll: pollPda,
          candidate: candidatePda,
          voter: voter.publicKey,
        })
        .signers([voter])
        .rpc();
      assert.fail("The transaction should have failed on double voting.");
    } catch (error) {
      // Expecting an account already exists error because the receipt PDA already exists
      console.log("Error logs:", error.logs);
      assert.include(error.message, "already in use", "Expected account already in use error for double voting.");
    }
  });
});
