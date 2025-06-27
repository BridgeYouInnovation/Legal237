import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const MYCOOLPAY_CONFIG = {
  baseUrl: 'https://my-coolpay.com/api',
  publicKey: 'ee31da6d-65b0-4edc-8919-37ada2ab54c8', // Correct My-CoolPay public key
};

class DirectPaymentService {
  constructor() {
    this.baseUrl = MYCOOLPAY_CONFIG.baseUrl;
    this.publicKey = MYCOOLPAY_CONFIG.publicKey;
  }

  async testConnectivity() {
    try {
      console.log('Testing connectivity to My-CoolPay...');
      const testUrl = 'https://my-coolpay.com';
      
      const response = await axios({
        method: 'GET',
        url: testUrl,
        headers: { 'Accept': 'text/html,application/json' },
        timeout: 15000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      });
      
      console.log('Connectivity test response status:', response.status);
      return { success: true, status: response.status };
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return { success: false, error: error.message };
    }
  }

  getDocumentInfo(documentType) {
    const documents = {
      'penal_code': {
        name: 'Complete Cameroon Penal Code',
        price: 5000,
        currency: 'XAF'
      },
      'criminal_procedure': {
        name: 'Complete Cameroon Criminal Procedure',
        price: 5000,
        currency: 'XAF'
      },
      'full_package': {
        name: 'Complete Legal Package',
        price: 5000,
        currency: 'XAF'
      }
    };
    return documents[documentType] || documents['penal_code'];
  }

  async initiatePayment(documentType, customerInfo, userId = null) {
    try {
      const documentInfo = this.getDocumentInfo(documentType);
      
      // Generate unique transaction ID
      const timestamp = Date.now();
      const userRef = (userId || customerInfo.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
      const randomSuffix = Math.random().toString(36).substr(2, 15);
      const transactionId = `tx_${timestamp}_${userRef}_${randomSuffix}`;

      // Format phone number
      let formattedPhone = customerInfo.phone;
      if (formattedPhone.startsWith('+237')) {
        formattedPhone = formattedPhone.replace('+237', '');
      }
      if (formattedPhone.startsWith('237')) {
        formattedPhone = formattedPhone.substring(3);
      }

      // Create unique customer name to avoid duplicates
      const uniqueSuffix = timestamp.toString().substr(-6);
      const uniqueCustomerName = `${customerInfo.fullname || customerInfo.name} #${uniqueSuffix}`;

      // Prepare My-CoolPay payin data for direct payment
      const paymentData = {
        transaction_amount: documentInfo.price,
        transaction_currency: documentInfo.currency,
        transaction_reason: `${documentInfo.name} (${uniqueSuffix})`,
        app_transaction_ref: transactionId,
        customer_phone_number: formattedPhone,
        customer_name: uniqueCustomerName,
        customer_email: customerInfo.email,
        customer_lang: 'en'
      };

      console.log('Direct My-CoolPay payin:', paymentData);

      // Call My-CoolPay payin API directly for immediate payment processing
      const payinUrl = `${this.baseUrl}/${this.publicKey}/payin`;
      console.log('Making request to URL:', payinUrl);
      console.log('Request data:', JSON.stringify(paymentData, null, 2));
      
      const response = await axios({
        method: 'POST',
        url: payinUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: paymentData,
        timeout: 30000,
        validateStatus: function (status) {
          // Accept any status code between 200-500 to handle error responses properly
          return status >= 200 && status < 500;
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(response.headers));
      console.log('My-CoolPay payin response:', JSON.stringify(response.data));

      const result = response.data;

      if (result.status === 'success') {
        // Store transaction locally
        await this.storeTransactionLocally(transactionId, {
          ...paymentData,
          documentType,
          status: result.action === 'REQUIRE_OTP' ? 'awaiting_otp' : 'processing',
          mycoolpay_transaction_ref: result.transaction_ref,
          action: result.action,
          ussd: result.ussd,
          created_at: new Date().toISOString()
        });

        return {
          success: true,
          transaction_id: transactionId,
          amount: documentInfo.price,
          currency: documentInfo.currency,
          mycoolpay_ref: result.transaction_ref,
          action: result.action,
          ussd: result.ussd,
          status: result.action === 'REQUIRE_OTP' ? 'awaiting_otp' : 'processing'
        };
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }

    } catch (error) {
      console.error('Direct payment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate payment'
      };
    }
  }

  async processInAppPayment(transactionId, phoneNumber, paymentMethod = 'MTN') {
    try {
      console.log(`Processing direct payment for transaction: ${transactionId}`);
      
      // Get stored transaction
      const transactions = await AsyncStorage.getItem('payment_transactions');
      if (!transactions) {
        throw new Error('Transaction not found');
      }

      const transactionsList = JSON.parse(transactions);
      const transaction = transactionsList[transactionId];
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Format phone number
      let formattedPhone = phoneNumber;
      if (formattedPhone.startsWith('+237')) {
        formattedPhone = formattedPhone.replace('+237', '');
      }
      if (formattedPhone.startsWith('237')) {
        formattedPhone = formattedPhone.substring(3);
      }

      // Call My-CoolPay payin API
      const paymentData = {
        transaction_amount: transaction.transaction_amount,
        transaction_currency: transaction.transaction_currency,
        transaction_reason: transaction.transaction_reason,
        app_transaction_ref: transactionId,
        customer_phone_number: formattedPhone,
        customer_name: transaction.customer_name,
        customer_email: transaction.customer_email,
        customer_lang: 'en'
      };

      const paymentUrl = `${this.baseUrl}/${this.publicKey}/payin`;
      
      const response = await fetch(paymentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const responseText = await response.text();
      console.log('My-CoolPay payin response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Invalid response from payment provider: ${responseText}`);
      }

      if (result.status === 'success') {
        const action = result.action;
        
        // Update transaction status
        await this.updateLocalTransaction(transactionId, {
          status: action === 'REQUIRE_OTP' ? 'awaiting_otp' : 'processing',
          payment_response: result,
          updated_at: new Date().toISOString()
        });

        if (action === 'REQUIRE_OTP') {
          return {
            success: true,
            status: 'awaiting_otp',
            message: 'OTP sent to your phone. Please check your SMS and authorize the payment.',
            transaction_id: transactionId,
            requires_otp: true
          };
        } else if (action === 'PENDING') {
          return {
            success: true,
            status: 'processing',
            message: `Please dial ${result.ussd} on your phone to complete the payment.`,
            transaction_id: transactionId,
            ussd: result.ussd
          };
        }
      }

      throw new Error(result.message || 'Payment processing failed');

    } catch (error) {
      console.error('Direct payment processing error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process payment'
      };
    }
  }

  async checkPaymentStatus(transactionId) {
    try {
      console.log(`Checking payment status for transaction: ${transactionId}`);
      
      // Get stored transaction to get My-CoolPay transaction ref
      const transactions = await AsyncStorage.getItem('payment_transactions');
      if (!transactions) {
        return { success: false, error: 'Transaction not found' };
      }

      const transactionsList = JSON.parse(transactions);
      const transaction = transactionsList[transactionId];
      
      if (!transaction || !transaction.mycoolpay_transaction_ref) {
        return { success: false, error: 'Transaction or My-CoolPay reference not found' };
      }

      // Check with My-CoolPay status API using correct endpoint
      const statusUrl = `${this.baseUrl}/${this.publicKey}/checkStatus/${transaction.mycoolpay_transaction_ref}`;
      console.log('Checking status at URL:', statusUrl);

      const response = await axios({
        method: 'GET',
        url: statusUrl,
        headers: {
          'Accept': 'application/json'
        },
        timeout: 15000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      });

      console.log('Status check response:', response.status, JSON.stringify(response.data));

      if (response.status === 200 && response.data && response.data.status === 'success') {
        const transactionStatus = response.data.transaction_status;
        console.log('My-CoolPay transaction status:', transactionStatus);
        console.log('Full response data:', response.data);

        // Update local transaction status
        await this.updateLocalTransaction(transactionId, {
          status: transactionStatus,
          last_status_check: new Date().toISOString(),
          mycoolpay_status_response: response.data
        });

        // Map My-CoolPay status to our app status
        let appStatus = transactionStatus;
        if (transactionStatus === 'SUCCESS') {
          appStatus = 'completed';
          console.log('Payment completed successfully! Marking document as purchased...');
          // Mark document as purchased when payment is successful
          await this.markDocumentAsPurchased(transaction.documentType);
        } else if (transactionStatus === 'FAILED' || transactionStatus === 'CANCELED') {
          appStatus = 'failed';
        } else if (transactionStatus === 'PENDING') {
          appStatus = 'processing';
        }

        return {
          success: true,
          status: appStatus,
          transaction_id: transactionId,
          amount: transaction.transaction_amount,
          currency: transaction.transaction_currency,
          document_type: transaction.documentType,
          mycoolpay_status: transactionStatus,
          mycoolpay_ref: transaction.mycoolpay_transaction_ref,
          app_transaction_ref: response.data.app_transaction_ref
        };
      } else {
        // Fallback to local status if API call fails
        console.log('Status API call failed, using local status');
        return {
          success: true,
          status: transaction.status || 'processing',
          transaction_id: transactionId,
          amount: transaction.transaction_amount,
          currency: transaction.transaction_currency,
          document_type: transaction.documentType
        };
      }

    } catch (error) {
      console.error('Payment status check error:', error);
      
      // Fallback to local status on error
      try {
        const transactions = await AsyncStorage.getItem('payment_transactions');
        if (transactions) {
          const transactionsList = JSON.parse(transactions);
          const transaction = transactionsList[transactionId];
          
          if (transaction) {
            return {
              success: true,
              status: transaction.status || 'processing',
              transaction_id: transactionId,
              amount: transaction.transaction_amount,
              currency: transaction.transaction_currency,
              document_type: transaction.documentType
            };
          }
        }
      } catch (fallbackError) {
        console.error('Fallback status check failed:', fallbackError);
      }

      return {
        success: false,
        error: error.message || 'Failed to check payment status'
      };
    }
  }

  async storeTransactionLocally(transactionId, transactionData) {
    try {
      const transactions = await AsyncStorage.getItem('payment_transactions');
      const transactionsList = transactions ? JSON.parse(transactions) : {};
      
      transactionsList[transactionId] = transactionData;
      
      await AsyncStorage.setItem('payment_transactions', JSON.stringify(transactionsList));
    } catch (error) {
      console.error('Error storing transaction locally:', error);
    }
  }

  async updateLocalTransaction(transactionId, updates) {
    try {
      const transactions = await AsyncStorage.getItem('payment_transactions');
      if (transactions) {
        const transactionsList = JSON.parse(transactions);
        if (transactionsList[transactionId]) {
          transactionsList[transactionId] = {
            ...transactionsList[transactionId],
            ...updates
          };
          await AsyncStorage.setItem('payment_transactions', JSON.stringify(transactionsList));
        }
      }
    } catch (error) {
      console.error('Error updating local transaction:', error);
    }
  }

  async markDocumentAsPurchased(documentType) {
    try {
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents');
      let purchased = purchasedDocuments ? JSON.parse(purchasedDocuments) : [];
      
      if (!purchased.includes(documentType)) {
        purchased.push(documentType);
        await AsyncStorage.setItem('purchased_documents', JSON.stringify(purchased));
        console.log(`Document ${documentType} marked as purchased`);
        
        // Also save to database for admin dashboard
        await this.savePaymentToDatabase(documentType);
      }
    } catch (error) {
      console.error('Error marking document as purchased:', error);
    }
  }

  async savePaymentToDatabase(documentType) {
    try {
      // Import supabase here to avoid circular dependencies
      const { supabase } = require('../lib/supabase');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No authenticated user, skipping database save');
        return;
      }

      // Check if payment record already exists
      const { data: existingPayment } = await supabase
        .from('payment_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('document_type', documentType)
        .in('status', ['completed', 'successful', 'success'])
        .limit(1);

      if (existingPayment && existingPayment.length > 0) {
        console.log('Payment record already exists in database');
        return;
      }

      // Get document info for pricing
      const documentInfo = this.getDocumentInfo(documentType);

      // Create new payment record
      const paymentRecord = {
        user_id: user.id,
        document_type: documentType,
        amount: documentInfo.price,
        currency: documentInfo.currency,
        status: 'completed',
        payment_method: 'mobile_money',
        transaction_id: `direct_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      };

      const { error } = await supabase
        .from('payment_records')
        .insert([paymentRecord]);

      if (error) {
        console.error('Error saving payment to database:', error);
      } else {
        console.log('Payment record saved to database successfully');
      }
    } catch (error) {
      console.error('Error accessing database for payment save:', error);
    }
  }

  // Sync all local purchases to database (for manual reconciliation)
  async syncAllPurchasesToDatabase() {
    try {
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents');
      if (!purchasedDocuments) {
        console.log('No local purchases found');
        return { success: true, synced: 0 };
      }

      const purchased = JSON.parse(purchasedDocuments);
      console.log('Syncing local purchases to database:', purchased);

      let syncedCount = 0;
      for (const documentType of purchased) {
        try {
          await this.savePaymentToDatabase(documentType);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync ${documentType}:`, error);
        }
      }

      console.log(`Synced ${syncedCount} out of ${purchased.length} purchases to database`);
      return { success: true, synced: syncedCount, total: purchased.length };
    } catch (error) {
      console.error('Error syncing purchases to database:', error);
      return { success: false, error: error.message };
    }
  }

  // Simulate payment completion for testing
  async simulatePaymentCompletion(transactionId) {
    try {
      await this.updateLocalTransaction(transactionId, {
        status: 'completed',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Get transaction to mark document as purchased
      const transactions = await AsyncStorage.getItem('payment_transactions');
      if (transactions) {
        const transactionsList = JSON.parse(transactions);
        const transaction = transactionsList[transactionId];
        
        if (transaction && transaction.documentType) {
          await this.markDocumentAsPurchased(transaction.documentType);
        }
      }

      return {
        success: true,
        status: 'completed',
        message: 'Payment completed successfully'
      };
    } catch (error) {
      console.error('Payment simulation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Debug function to manually test status API
  async debugStatusAPI(mycoolpayTransactionRef) {
    try {
      const statusUrl = `${this.baseUrl}/${this.publicKey}/checkStatus/${mycoolpayTransactionRef}`;
      console.log('Debug: Testing status API at:', statusUrl);

      const response = await axios({
        method: 'GET',
        url: statusUrl,
        headers: {
          'Accept': 'application/json'
        },
        timeout: 15000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      });

      console.log('Debug: Status API response:', response.status, JSON.stringify(response.data));
      return { success: true, response: response.data, status: response.status };
    } catch (error) {
      console.error('Debug: Status API error:', error);
      return { success: false, error: error.message };
    }
  }

  // Debug function to check sync status
  async debugSyncStatus() {
    try {
      console.log('=== Debug Sync Status ===');
      
      // Check local purchases
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents');
      const purchased = purchasedDocuments ? JSON.parse(purchasedDocuments) : [];
      console.log('Local purchases:', purchased);

      // Check database sync status
      const syncResult = await this.syncAllPurchasesToDatabase();
      console.log('Sync result:', syncResult);

      // Check if user is authenticated
      const { supabase } = require('../lib/supabase');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user?.id || 'Not authenticated');

      if (user) {
        // Check database records
        const { data: dbPayments, error: dbError } = await supabase
          .from('payment_records')
          .select('*')
          .eq('user_id', user.id);
        
        console.log('Database payments:', dbPayments);
        if (dbError) console.error('Database error:', dbError);
      }

      return {
        success: true,
        localPurchases: purchased,
        syncResult,
        userId: user?.id,
        databasePayments: user ? (await supabase.from('payment_records').select('*').eq('user_id', user.id)).data : null
      };
    } catch (error) {
      console.error('Debug sync status error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new DirectPaymentService(); 