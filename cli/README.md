# Voting Dapp CLI (Rust)

A command-line interface written in Rust for interacting with the Solana Voting Dapp.

## Features

- ✅ **100% Rust** - All client code written in Rust using `anchor-client`
- 🔐 **Secure** - Uses Solana keypair authentication
- 🚀 **Fast** - Native performance without JavaScript runtime
- 📊 **Complete** - Full support for all voting dapp operations

## Installation

### Build from Source

```bash
cd cli
cargo build --release
```

The binary will be available at `target/release/voting-cli`

### Install Globally

```bash
cd cli
cargo install --path .
```

## Usage

### Basic Syntax

```bash
voting-cli [OPTIONS] <COMMAND>
```

### Options

- `-k, --keypair <PATH>` - Path to keypair file (default: `~/.config/solana/id.json`)
- `-c, --cluster <CLUSTER>` - Cluster to use: localnet, devnet, mainnet (default: `localnet`)
- `-p, --program-id <ID>` - Program ID of the voting dapp (default: `ErWpLzQeDSoB1nuTs2x1d2yHA2AsBvZHg4nNkAusyNK8`)

### Commands

#### 1. Initialize a New Poll

Create a new poll with a unique ID, question, description, and time window.

```bash
voting-cli initialize-poll <POLL_ID> <QUESTION> <DESCRIPTION> <START_TIME> <END_TIME>
```

**Example:**
```bash
voting-cli initialize-poll 1 \
  "Who should be the next president?" \
  "Presidential election 2024" \
  1699000000 \
  1699999999
```

**Output:**
```
Initializing poll 1...
✓ Poll created successfully!
  Poll ID: 1
  Question: Who should be the next president?
  Description: Presidential election 2024
  Start: 2023-11-03 08:26:40 UTC
  End: 2023-11-14 18:06:39 UTC
  Transaction: 5KxZ...abc123
```

#### 2. Add a Candidate

Add a candidate to an existing poll.

```bash
voting-cli add-candidate <POLL_ID> <NAME> <PARTY>
```

**Example:**
```bash
voting-cli add-candidate 1 "Alice Johnson" "Democratic Party"
voting-cli add-candidate 1 "Bob Smith" "Republican Party"
```

**Output:**
```
Adding candidate to poll 1...
✓ Candidate added successfully!
  Name: Alice Johnson
  Party: Democratic Party
  Transaction: 3Hy8...def456
```

#### 3. Vote for a Candidate

Cast your vote for a candidate in a poll.

```bash
voting-cli vote <POLL_ID> <CANDIDATE_NAME>
```

**Example:**
```bash
voting-cli vote 1 "Alice Johnson"
```

**Output:**
```
Voting for Alice Johnson in poll 1...
✓ Vote cast successfully!
  Candidate: Alice Johnson
  Transaction: 7Kj2...ghi789
```

#### 4. Get Poll Details

Fetch information about a specific poll.

```bash
voting-cli get-poll <POLL_ID>
```

**Example:**
```bash
voting-cli get-poll 1
```

**Output:**
```
Fetching poll 1...

=== Poll 1 ===
Creator: 9xQe...xyz789
Question: Who should be the next president?
Description: Presidential election 2024
Start: 2023-11-03 08:26:40 UTC
End: 2023-11-14 18:06:39 UTC
Candidates: 2
```

#### 5. Get Poll Results

View all candidates and their vote counts for a poll.

```bash
voting-cli get-results <POLL_ID>
```

**Example:**
```bash
voting-cli get-results 1
```

**Output:**
```
Fetching results for poll 1...

=== Poll 1 Results ===
Question: Who should be the next president?
Description: Presidential election 2024

Candidates:
  • Alice Johnson (Democratic Party): 42 votes
  • Bob Smith (Republican Party): 38 votes

Total votes cast: 80
Leading candidate: Alice Johnson with 42 votes
```

#### 6. Check if User Has Voted

Check whether a specific user has voted in a poll.

```bash
voting-cli has-voted <POLL_ID> [--voter <PUBKEY>]
```

**Examples:**
```bash
# Check if you have voted
voting-cli has-voted 1

# Check if another user has voted
voting-cli has-voted 1 --voter 9xQeKn...xyz789
```

**Output:**
```
✓ User 9xQeKn...xyz789 has voted in poll 1
```

## Advanced Usage

### Using Different Clusters

#### Localnet (default)
```bash
voting-cli -c localnet get-poll 1
```

#### Devnet
```bash
voting-cli -c devnet get-poll 1
```

#### Mainnet
```bash
voting-cli -c mainnet get-poll 1
```

### Using Custom Keypair

```bash
voting-cli -k /path/to/my-keypair.json vote 1 "Alice Johnson"
```

### Using Custom Program ID

```bash
voting-cli -p YourProgramID1111111111111111111111111111 get-poll 1
```

## Complete Example Workflow

```bash
# 1. Create a poll (starts now, ends in 7 days)
START_TIME=$(date +%s)
END_TIME=$((START_TIME + 604800))
voting-cli initialize-poll 1 \
  "Best Programming Language?" \
  "Community poll for 2024" \
  $START_TIME \
  $END_TIME

# 2. Add candidates
voting-cli add-candidate 1 "Rust" "Systems Programming"
voting-cli add-candidate 1 "Python" "General Purpose"
voting-cli add-candidate 1 "JavaScript" "Web Development"

# 3. Cast your vote
voting-cli vote 1 "Rust"

# 4. Check the results
voting-cli get-results 1

# 5. Verify you voted
voting-cli has-voted 1
```

## Error Handling

The CLI provides clear error messages for common issues:

- **Invalid keypair path**: `Failed to read keypair from /path/to/keypair.json`
- **Poll not found**: Account fetch fails with clear error
- **Already voted**: Transaction fails with program error
- **Invalid time window**: Program validates start/end times
- **Poll not active**: Voting outside the time window is rejected

## Development

### Run Without Building

```bash
cargo run -- get-poll 1
```

### Run Tests

```bash
cargo test
```

### Check Code

```bash
cargo check
cargo clippy
```

## Architecture

The CLI is structured into three main modules:

- **main.rs** - Command-line interface using `clap`
- **client.rs** - Core client logic using `anchor-client`
- **utils.rs** - PDA derivation and helper functions

## Dependencies

- `anchor-client` - Interact with Anchor programs
- `anchor-lang` - Anchor framework types
- `solana-sdk` - Solana blockchain primitives
- `solana-client` - RPC client for Solana
- `clap` - Command-line argument parsing
- `anyhow` - Error handling
- `chrono` - Date/time formatting

## License

Same as the parent voting-dapp project.
