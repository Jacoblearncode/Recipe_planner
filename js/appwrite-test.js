import { client, account } from './appwrite.js';

// Test Appwrite connection
async function testAppwriteConnection() {
    try {
        // Test the health endpoint
        const health = await client.health.get();
        console.log('✅ Appwrite connection successful!', health);
        
        // Try to get the current session (will fail if not logged in, but that's expected)
        try {
            const session = await account.get();
            console.log('👤 User is logged in:', session);
        } catch (error) {
            console.log('👋 No active session (expected if not logged in)');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Appwrite connection failed:', error);
        
        // Check common issues
        if (error.message.includes('CORS')) {
            console.error('🔒 CORS Error: Make sure http://127.0.0.1:5500 is added to your Appwrite project platforms');
        }
        
        if (error.message.includes('network')) {
            console.error('🌐 Network Error: Check your internet connection');
        }
        
        return false;
    }
}

// Run the test
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Testing Appwrite connection...');
    await testAppwriteConnection();
});

export { testAppwriteConnection }; 