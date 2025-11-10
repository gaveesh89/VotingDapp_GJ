// Test file for validating the voting dapp client integration
// Run with: npx ts-node src/test-client.ts

import { VotingDappClient } from './client';
import { Network } from './types';
import { Keypair } from '@solana/web3.js';

async function testClientIntegration() {
  console.log('🚀 Starting Voting DApp Client Integration Test');

  try {
    // Create a test keypair (in real app, this would be from wallet)
    const testKeypair = Keypair.generate();
    console.log('✅ Test keypair generated:', testKeypair.publicKey.toString());

    // Mock wallet interface
    const mockWallet = {
      publicKey: testKeypair.publicKey,
      signTransaction: async (tx: any) => {
        // In a real implementation, this would sign with the private key
        console.log('📝 Signing transaction...');
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        console.log(`📝 Signing ${txs.length} transactions...`);
        return txs;
      },
    };

    // Initialize client
    console.log('🔧 Initializing Voting DApp Client...');
    const client = new VotingDappClient(Network.LOCALNET, mockWallet as any);
    console.log('✅ Client initialized successfully');

    // Test connection
    const connection = client.getConnection();
    console.log('🌐 Connection endpoint:', connection.rpcEndpoint);

    // Test program access
    const program = client.getProgram();
    console.log('📄 Program ID:', program.programId.toString());

    console.log('✅ All basic integration tests passed!');
    console.log('');
    console.log('🎯 Client is ready for blockchain interactions');
    console.log('📚 Available methods:');
    console.log('   - client.createPoll()');
    console.log('   - client.addCandidate()');
    console.log('   - client.vote()');
    console.log('   - client.getPoll()');
    console.log('   - client.getPollResults()');

    return {
      success: true,
      client,
      publicKey: testKeypair.publicKey.toString(),
      programId: program.programId.toString()
    };

  } catch (error) {
    console.error('❌ Client integration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testClientIntegration()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Integration test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Integration test failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

export { testClientIntegration };
export default testClientIntegration;