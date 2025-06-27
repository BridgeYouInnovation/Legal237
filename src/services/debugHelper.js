import directPaymentService from './directPaymentService';

// Global debug helpers for development
const debugHelpers = {
  // Sync all purchases to database
  async syncPayments() {
    console.log('🔄 Syncing payments to database...');
    const result = await directPaymentService.syncAllPurchasesToDatabase();
    console.log('✅ Sync result:', result);
    return result;
  },

  // Check sync status
  async checkSyncStatus() {
    console.log('📊 Checking sync status...');
    const result = await directPaymentService.debugSyncStatus();
    console.log('📊 Sync status:', result);
    return result;
  },

  // Test My-CoolPay connectivity
  async testConnectivity() {
    console.log('🌐 Testing My-CoolPay connectivity...');
    const result = await directPaymentService.testConnectivity();
    console.log('🌐 Connectivity result:', result);
    return result;
  },

  // Show help
  help() {
    console.log(`
🛠️  Legal237 Debug Helpers:

• debugHelpers.syncPayments() - Sync local purchases to database
• debugHelpers.checkSyncStatus() - Check sync status and database records  
• debugHelpers.testConnectivity() - Test My-CoolPay API connectivity
• debugHelpers.help() - Show this help message

Example usage:
> debugHelpers.checkSyncStatus()
> debugHelpers.syncPayments()
    `);
  }
};

// Make it globally available in development
if (__DEV__) {
  global.debugHelpers = debugHelpers;
  console.log('🛠️  Debug helpers loaded! Type "debugHelpers.help()" for available commands.');
}

export default debugHelpers; 