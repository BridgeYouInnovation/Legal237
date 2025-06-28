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
      console.log('🔗 Testing connectivity to My-CoolPay...');
      
      // Test multiple endpoints to ensure connectivity
      const testEndpoints = [
        'https://my-coolpay.com',
        'https://my-coolpay.com/api',
        `https://my-coolpay.com/api/${this.publicKey}`
      ];

      for (const endpoint of testEndpoints) {
        try {
          console.log(`Testing: ${endpoint}`);
          
          // Try axios first
          let response;
          try {
            response = await axios({
              method: 'GET',
              url: endpoint,
              headers: { 'Accept': 'text/html,application/json' },
              timeout: 10000,
              validateStatus: function (status) {
                return status >= 200 && status < 500;
              }
            });
            console.log(`✅ Axios - ${endpoint} - Status: ${response.status}`);
          } catch (axiosError) {
            console.log(`⚠️ Axios failed for ${endpoint}, trying fetch...`);
            
            // Fallback to fetch
            try {
              response = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Accept': 'text/html,application/json' }
              });
              console.log(`✅ Fetch - ${endpoint} - Status: ${response.status}`);
            } catch (fetchError) {
              console.log(`❌ Both failed for ${endpoint}`);
              continue;
            }
          }
          
          if (response && response.status >= 200 && response.status < 400) {
            return { success: true, status: response.status, endpoint };
          }
        } catch (error) {
          console.log(`❌ ${endpoint} - Error: ${error.message}`);
        }
      }
      
      return { success: false, error: 'All connectivity tests failed' };
    } catch (error) {
      console.error('🔗 Connectivity test failed:', error);
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
      },
      'lawyers_subscription': {
        name: 'Lawyers Directory Access',
        price: 500,
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

      console.log('🚀 Direct My-CoolPay payin:', paymentData);

      // Call My-CoolPay payin API directly for immediate payment processing
      const payinUrl = `${this.baseUrl}/${this.publicKey}/payin`;
      console.log('🎯 Making request to URL:', payinUrl);
      console.log('📋 Request data:', JSON.stringify(paymentData, null, 2));
      
      let response;
      let result;
      
      try {
        // Try axios first
        console.log('📡 Attempting axios request...');
        response = await axios({
          method: 'POST',
          url: payinUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Legal237-Mobile-App/1.0.0'
          },
          data: paymentData,
          timeout: 30000,
          validateStatus: function (status) {
            // Accept any status code between 200-500 to handle error responses properly
            return status >= 200 && status < 500;
          }
        });
        
        result = response.data;
        console.log('✅ Axios response:', { status: response.status, data: result });
        
      } catch (axiosError) {
        console.warn('⚠️ Axios failed, trying fetch fallback:', axiosError.message);
        
        // Fallback to fetch if axios fails (common in React Native)
        try {
          console.log('📡 Attempting fetch request...');
          response = await fetch(payinUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'Legal237-Mobile-App/1.0.0'
            },
            body: JSON.stringify(paymentData)
          });
          
          const responseText = await response.text();
          console.log('📥 Fetch response text:', responseText);
          
          try {
            result = JSON.parse(responseText);
            console.log('✅ Fetch response parsed:', { status: response.status, data: result });
          } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            throw new Error(`Invalid JSON response: ${responseText}`);
          }
          
        } catch (fetchError) {
          console.error('❌ Both axios and fetch failed:', fetchError);
          throw new Error(`Network request failed: ${fetchError.message}`);
        }
      }

      if (result.status === 'success') {
        // Store transaction locally
        await this.storeTransactionLocally(transactionId, {
          ...paymentData,
          documentType,
          status: result.action === 'REQUIRE_OTP' ? 'awaiting_otp' : 'pending',
          mycoolpay_transaction_ref: result.transaction_ref,
          action: result.action,
          ussd: result.ussd,
          created_at: new Date().toISOString()
        });

        // 🆕 Get user ID and cancel any pending transactions for this document
        const { supabase } = require('../lib/supabase');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!userError && user) {
          // Cancel any existing pending transactions for this user and document
          await this.cancelPendingTransactions(user.id, documentType, transactionId);
        }

        // 🆕 Save transaction to database immediately with PENDING status
        await this.saveTransactionToDatabase({
          transactionId,
          documentType,
          customerInfo,
          paymentData,
          mycoolpayRef: result.transaction_ref,
          status: 'pending', // Start with pending status
          action: result.action,
          ussd: result.ussd
        });

        return {
          success: true,
          transaction_id: transactionId,
          amount: documentInfo.price,
          currency: documentInfo.currency,
          mycoolpay_ref: result.transaction_ref,
          action: result.action,
          ussd: result.ussd,
          status: result.action === 'REQUIRE_OTP' ? 'awaiting_otp' : 'pending'
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

      // Check if transaction has been pending too long (5 minutes timeout to match UI polling)
      const createdAt = new Date(transaction.created_at);
      const now = new Date();
      const timeoutMinutes = 5;
      const timeDiff = (now - createdAt) / (1000 * 60); // difference in minutes

      if (timeDiff > timeoutMinutes && (transaction.status === 'pending' || transaction.status === 'awaiting_otp')) {
        console.log(`⏰ Transaction ${transactionId} has timed out after ${timeoutMinutes} minutes`);
        
        // Update local status
        await this.updateLocalTransaction(transactionId, {
          status: 'failed',
          failure_reason: 'Transaction timeout - user did not complete payment',
          failed_at: new Date().toISOString()
        });

        // Update database status
        await this.updateTransactionStatusInDatabase(transactionId, 'failed');

        return {
          success: true,
          status: 'failed',
          transaction_id: transactionId,
          amount: transaction.transaction_amount,
          currency: transaction.transaction_currency,
          document_type: transaction.documentType,
          failure_reason: 'Transaction timeout'
        };
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

        // Map My-CoolPay status to our app status and update database
        let appStatus = transactionStatus;
        if (transactionStatus === 'SUCCESS') {
          appStatus = 'completed';
          console.log('✅ Payment completed successfully! Marking document as purchased...');
          
          // Mark document as purchased when payment is successful
          await this.markDocumentAsPurchased(transaction.documentType);
          
          // If this is a lawyers subscription, activate it
          if (transaction.documentType === 'lawyers_subscription') {
            const subscriptionService = require('./subscriptionService').default;
            await subscriptionService.activateLawyersSubscription();
          }
          
          // Update database status to completed
          await this.updateTransactionStatusInDatabase(transactionId, 'completed');
          
        } else if (transactionStatus === 'FAILED' || transactionStatus === 'CANCELED') {
          appStatus = 'failed';
          console.log('❌ Payment failed or cancelled');
          
          // Update database status to failed
          await this.updateTransactionStatusInDatabase(transactionId, 'failed');
          
        } else if (transactionStatus === 'PENDING') {
          appStatus = 'pending';
          console.log('⏳ Payment still pending - user needs to enter PIN code');
          
          // Update database status to pending (in case it was different before)
          await this.updateTransactionStatusInDatabase(transactionId, 'pending');
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
      console.log('=== Payment Debug Status ===');
      
      // Check local storage
      const transactions = await AsyncStorage.getItem('payment_transactions');
      const purchased = await AsyncStorage.getItem('purchased_documents');
      
      console.log('Local transactions:', transactions ? JSON.parse(transactions) : 'None');
      console.log('Local purchased documents:', purchased ? JSON.parse(purchased) : 'None');
      
      // Check database
      const { supabase } = require('../lib/supabase');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No authenticated user for database check');
        return;
      }
      
      const { data: dbPayments, error: dbError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id);
        
      console.log('Database payments:', dbPayments || 'None');
      
      return {
        localTransactions: transactions ? JSON.parse(transactions) : {},
        localPurchased: purchased ? JSON.parse(purchased) : [],
        databasePayments: dbPayments || []
      };
    } catch (error) {
      console.error('Debug sync status error:', error);
    }
  }

  // Get comprehensive payment history from all sources
  async getPaymentHistory() {
    try {
      console.log('🔍 Getting comprehensive payment history...');
      
      const history = {
        localTransactions: [],
        localPurchased: [],
        databasePayments: [],
        summary: {}
      };

      // Get local transactions
      const transactions = await AsyncStorage.getItem('payment_transactions');
      if (transactions) {
        const transactionsList = JSON.parse(transactions);
        history.localTransactions = Object.values(transactionsList);
        console.log('📱 Local transactions found:', history.localTransactions.length);
      }

      // Get local purchased documents
      const purchased = await AsyncStorage.getItem('purchased_documents');
      if (purchased) {
        history.localPurchased = JSON.parse(purchased);
        console.log('📱 Local purchased documents:', history.localPurchased);
      }

      // Get database payments
      try {
        const { supabase } = require('../lib/supabase');
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          const { data: dbPayments, error: dbError } = await supabase
            .from('payment_records')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (!dbError && dbPayments) {
            history.databasePayments = dbPayments;
            console.log('💾 Database payments found:', dbPayments.length);
          }
        }
      } catch (dbError) {
        console.warn('Database query failed:', dbError);
      }

      // Create summary
      history.summary = {
        totalLocalTransactions: history.localTransactions.length,
        totalPurchasedLocally: history.localPurchased.length,
        totalDatabasePayments: history.databasePayments.length,
        purchasedDocuments: [...new Set([
          ...history.localPurchased,
          ...history.databasePayments.filter(p => ['completed', 'successful', 'success'].includes(p.status)).map(p => p.document_type)
        ])]
      };

      console.log('📊 Payment history summary:', history.summary);
      return history;
    } catch (error) {
      console.error('❌ Error getting payment history:', error);
      return null;
    }
  }

  // Clear all payment data (for testing/reset)
  async clearAllPaymentData() {
    try {
      console.log('🗑️ Clearing all payment data...');
      
      await AsyncStorage.removeItem('payment_transactions');
      await AsyncStorage.removeItem('purchased_documents');
      
      console.log('✅ All local payment data cleared');
      return { success: true, message: 'All payment data cleared' };
    } catch (error) {
      console.error('❌ Error clearing payment data:', error);
      return { success: false, error: error.message };
    }
  }

     async saveTransactionToDatabase({ transactionId, documentType, customerInfo, paymentData, mycoolpayRef, status, action, ussd }) {
     try {
       // Import supabase here to avoid circular dependencies
       const { supabase } = require('../lib/supabase');
       
       // Get current user
       const { data: { user }, error: userError } = await supabase.auth.getUser();
       if (userError || !user) {
         console.log('No authenticated user, skipping database save');
         return;
       }

       // Create new payment record using existing schema
       const paymentRecord = {
         user_id: user.id,
         document_type: documentType,
         amount: paymentData.transaction_amount,
         currency: paymentData.transaction_currency,
         status: status,
         payment_method: 'mobile_money',
         transaction_id: transactionId,
         flutterwave_tx_ref: mycoolpayRef // Use existing field for My-CoolPay ref
       };

       console.log('💾 Saving payment record to database:', paymentRecord);

       const { error } = await supabase
         .from('payment_records')
         .insert([paymentRecord]);

       if (error) {
         console.error('❌ Error saving payment to database:', error);
       } else {
         console.log('✅ Payment record saved to database successfully');
       }
     } catch (error) {
       console.error('❌ Error accessing database for payment save:', error);
     }
   }

   // Update transaction status in database
   async updateTransactionStatusInDatabase(transactionId, status, additionalData = {}) {
     try {
       const { supabase } = require('../lib/supabase');
       
       // Only use fields that exist in the payment_records table
       const updateData = {
         status: status
       };

       console.log(`📊 Updating database: ${transactionId} -> ${status}`);

       const { error } = await supabase
         .from('payment_records')
         .update(updateData)
         .eq('transaction_id', transactionId);

       if (error) {
         console.error('❌ Error updating transaction status in database:', error);
       } else {
         console.log(`✅ Transaction ${transactionId} updated to ${status} in database`);
       }
     } catch (error) {
       console.error('❌ Error accessing database for status update:', error);
     }
   }

   // Check if user has pending transactions (to prevent multiple payments)
   async checkPendingTransactions(userId, documentType) {
     try {
       const { supabase } = require('../lib/supabase');
       
       const { data: pendingTransactions, error } = await supabase
         .from('payment_records')
         .select('transaction_id, mycoolpay_ref, created_at')
         .eq('user_id', userId)
         .eq('document_type', documentType)
         .eq('status', 'pending')
         .order('created_at', { ascending: false });

       if (error) {
         console.error('Error checking pending transactions:', error);
         return [];
       }

       return pendingTransactions || [];
     } catch (error) {
       console.error('Error accessing database for pending check:', error);
       return [];
     }
   }

   // Cancel pending transactions for same user and document
   async cancelPendingTransactions(userId, documentType, excludeTransactionId = null) {
     try {
       const { supabase } = require('../lib/supabase');
       
       let query = supabase
         .from('payment_records')
         .update({ 
           status: 'cancelled'
         })
         .eq('user_id', userId)
         .eq('document_type', documentType)
         .eq('status', 'pending');

       if (excludeTransactionId) {
         query = query.neq('transaction_id', excludeTransactionId);
       }

       const { error } = await query;

       if (error) {
         console.error('❌ Error cancelling pending transactions:', error);
       } else {
         console.log(`✅ Cancelled pending transactions for user ${userId} and document ${documentType}`);
       }
     } catch (error) {
       console.error('❌ Error accessing database for cancellation:', error);
     }
   }
}

export default new DirectPaymentService(); 