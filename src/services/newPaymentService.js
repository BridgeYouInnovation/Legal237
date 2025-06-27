import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://legal237-platform.netlify.app/.netlify/functions/api-simple';

class NewPaymentService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Generate unique transaction reference
  generateTransactionReference(userId) {
    const timestamp = Date.now();
    const userIdSafe = userId ? userId.replace(/[^a-zA-Z0-9]/g, '') : 'guest';
    return `tx_${timestamp}_${userIdSafe}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Get document pricing
  getDocumentPrice(documentType) {
    const prices = {
      'penal_code': 5000,
      'criminal_procedure': 5000,
      'full_package': 5000
    };
    return prices[documentType] || 5000;
  }

  // Get document info
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

  // Check if user has paid for a specific document
  async hasPaidForDocument(documentType, userId = null) {
    try {
      // Check local storage first
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents');
      if (purchasedDocuments) {
        const purchased = JSON.parse(purchasedDocuments);
        if (purchased.includes(documentType)) {
          return true;
        }
      }

      // Check with backend if user is provided
      if (userId) {
        const accessCheck = await this.checkDocumentAccess(userId, documentType);
        if (accessCheck.hasAccess) {
          // Update local storage
          await this.markDocumentAsPurchased(documentType);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }

  // Check document access from backend
  async checkDocumentAccess(userId, documentType) {
    try {
      const response = await fetch(`${this.baseUrl}/payment/access/${userId}/${documentType}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking document access:', error);
      return { hasAccess: false };
    }
  }

  // Initiate payment (returns payment data for in-app processing)
  async initiatePayment(documentType, customerInfo, userId = null) {
    try {
      const documentInfo = this.getDocumentInfo(documentType);
      
      const paymentData = {
        documentType,
        customerName: customerInfo.fullname || customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        userId: userId || customerInfo.email,
        amount: documentInfo.price,
        currency: documentInfo.currency,
        description: `Purchase of ${documentInfo.name}`
      };

      console.log('Initiating payment:', paymentData);

      console.log('Calling API:', `${this.baseUrl}/payment/init`);
      
      const response = await fetch(`${this.baseUrl}/payment/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response text:', responseText);
        throw new Error(`API returned invalid JSON. Status: ${response.status}, Response: ${responseText}`);
      }
      
      if (result.success) {
        // Store transaction locally for tracking
        await this.storeTransactionLocally(result.transaction_id, {
          ...paymentData,
          status: 'initiated',
          mycoolpay_transaction_ref: result.mycoolpay_transaction_ref,
          created_at: new Date().toISOString()
        });
        
        return {
          success: true,
          transaction_id: result.transaction_id,
          payment_url: result.payment_url,
          amount: result.amount,
          currency: result.currency,
          mycoolpay_ref: result.mycoolpay_transaction_ref
        };
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate payment'
      };
    }
  }

  // Check payment status
  async checkPaymentStatus(transactionId) {
    try {
      console.log('Checking payment status for:', transactionId);
      
      const response = await fetch(`${this.baseUrl}/payment/status/${transactionId}`);
      const result = await response.json();
      
      console.log('Payment status response:', result);

      if (result.success) {
        // Update local transaction
        await this.updateLocalTransaction(transactionId, {
          status: result.status,
          paid_at: result.paid_at,
          updated_at: new Date().toISOString()
        });

        // If payment is completed, mark document as purchased
        if (result.status === 'completed' || result.status === 'successful') {
          await this.markDocumentAsPurchased(result.document_type);
        }

        return result;
      } else {
        throw new Error(result.error || 'Failed to check payment status');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check payment status'
      };
    }
  }

  // Store transaction locally
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

  // Update local transaction
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

  // Mark document as purchased
  async markDocumentAsPurchased(documentType) {
    try {
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents');
      let purchased = purchasedDocuments ? JSON.parse(purchasedDocuments) : [];
      
      if (!purchased.includes(documentType)) {
        purchased.push(documentType);
        await AsyncStorage.setItem('purchased_documents', JSON.stringify(purchased));
        console.log(`Document ${documentType} marked as purchased`);
      }
    } catch (error) {
      console.error('Error marking document as purchased:', error);
    }
  }

  // Get purchased documents
  async getPurchasedDocuments() {
    try {
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents');
      return purchasedDocuments ? JSON.parse(purchasedDocuments) : [];
    } catch (error) {
      console.error('Error getting purchased documents:', error);
      return [];
    }
  }

  // Process in-app payment (for mobile money)
  async processInAppPayment(transactionId, phoneNumber, paymentMethod = 'MTN') {
    try {
      console.log(`Processing ${paymentMethod} payment for transaction: ${transactionId}`);
      console.log(`Phone: ${phoneNumber}`);
      
      // Update transaction status to processing
      await this.updateLocalTransaction(transactionId, {
        status: 'processing',
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      });

      // Call the backend to process the actual payment with My-CoolPay
      const response = await fetch(`${this.baseUrl}/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          phone_number: phoneNumber,
          payment_method: paymentMethod
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Payment processing initiated:', result);
        
        // Update local transaction with processing status
        await this.updateLocalTransaction(transactionId, {
          status: result.status || 'processing',
          updated_at: new Date().toISOString()
        });

        return {
          success: true,
          status: result.status || 'processing',
          message: result.message || `Payment initiated. Please check your phone for the payment prompt.`,
          transaction_id: transactionId,
          ussd: result.ussd || null,
          requires_otp: result.requires_otp || false
        };
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('In-app payment processing error:', error);
      
      // Update transaction status to failed
      await this.updateLocalTransaction(transactionId, {
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message || 'Failed to process payment'
      };
    }
  }

  // Simulate payment completion (for testing)
  async simulatePaymentCompletion(transactionId) {
    try {
      // Get transaction details
      const transactions = await AsyncStorage.getItem('payment_transactions');
      if (!transactions) {
        throw new Error('No transactions found');
      }

      const transactionsList = JSON.parse(transactions);
      const transaction = transactionsList[transactionId];
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Mark as completed
      await this.updateLocalTransaction(transactionId, {
        status: 'completed',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Mark document as purchased
      await this.markDocumentAsPurchased(transaction.documentType);

      return {
        success: true,
        status: 'completed',
        message: 'Payment completed successfully',
        document_type: transaction.documentType
      };
    } catch (error) {
      console.error('Payment simulation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sync payments from database
  async syncPaymentsFromDatabase() {
    try {
      // This would sync completed payments from the backend
      console.log('Syncing payments from database...');
      
      // For now, we'll check for any pending transactions and update their status
      const transactions = await AsyncStorage.getItem('payment_transactions');
      if (transactions) {
        const transactionsList = JSON.parse(transactions);
        
        for (const [transactionId, transaction] of Object.entries(transactionsList)) {
          if (transaction.status === 'pending' || transaction.status === 'initiated') {
            // Check status with backend
            const statusResult = await this.checkPaymentStatus(transactionId);
            if (statusResult.success && statusResult.status === 'completed') {
              console.log(`Payment ${transactionId} completed during sync`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing payments:', error);
    }
  }

  // Clear all purchases (for testing)
  async clearAllPurchases() {
    try {
      await AsyncStorage.removeItem('purchased_documents');
      await AsyncStorage.removeItem('payment_transactions');
      console.log('All purchases cleared');
    } catch (error) {
      console.error('Error clearing purchases:', error);
    }
  }
}

export default new NewPaymentService(); 




