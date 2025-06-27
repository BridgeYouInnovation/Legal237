// Payment service for Flutterwave integration
import { Linking } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'https://api.flutterwave.com/v3'

// Flutterwave API Keys (in production, these should be on your backend)
const FLUTTERWAVE_CONFIG = {
  publicKey: 'FLWPUBK-93f5ed63df2c00b9bb1808550f8070e2-X',
  secretKey: 'FLWSECK-11a773c2100444901d787c95c56f2769-1977b11e4fbvt-X',
  encryptionKey: '11a773c210049d75f7f74350'
}

class PaymentService {
  constructor() {
    this.publicKey = FLUTTERWAVE_CONFIG.publicKey
    this.secretKey = FLUTTERWAVE_CONFIG.secretKey
    this.encryptionKey = FLUTTERWAVE_CONFIG.encryptionKey
    
    // Debug keys (remove in production)
    console.log('Payment Service initialized with keys:', {
      publicKey: this.publicKey ? `${this.publicKey.substring(0, 10)}...` : 'NOT_FOUND',
      secretKey: this.secretKey ? `${this.secretKey.substring(0, 10)}...` : 'NOT_FOUND',
      encryptionKey: this.encryptionKey ? `${this.encryptionKey.substring(0, 5)}...` : 'NOT_FOUND'
    })
  }

  // Generate unique transaction reference
  generateTransactionReference() {
    return `LEGAL237_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Check if user has paid for a specific document
  async hasPaidForDocument(documentType) {
    try {
      // First check database for completed payments
      const dbPaymentStatus = await this.checkDatabasePaymentStatus(documentType);
      if (dbPaymentStatus) {
        // If payment found in database, sync it to local storage
        await this.markDocumentAsPurchased(documentType);
        return true;
      }

      // Fallback to local storage check
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents')
      if (!purchasedDocuments) return false
      
      const purchased = JSON.parse(purchasedDocuments)
      return purchased.includes(documentType)
    } catch (error) {
      console.error('Error checking payment status:', error)
      return false
    }
  }

  // Check database for payment status
  async checkDatabasePaymentStatus(documentType) {
    try {
      const { supabase } = require('../lib/supabase');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No authenticated user found');
        return false;
      }

      // Check for completed payments in database
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_type', documentType)
        .in('status', ['completed', 'successful', 'success'])
        .limit(1);

      if (error) {
        console.error('Error checking database payment status:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error accessing database:', error);
      return false;
    }
  }

  // Mark document as purchased
  async markDocumentAsPurchased(documentType) {
    try {
      // Update local storage
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents')
      let purchased = purchasedDocuments ? JSON.parse(purchasedDocuments) : []
      
      if (!purchased.includes(documentType)) {
        purchased.push(documentType)
        await AsyncStorage.setItem('purchased_documents', JSON.stringify(purchased))
      }

      // Also save to database if user is authenticated
      await this.savePurchaseToDatabase(documentType);
    } catch (error) {
      console.error('Error marking document as purchased:', error)
    }
  }

  // Save purchase record to database
  async savePurchaseToDatabase(documentType, txRef = null, amount = 2500) {
    try {
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

      // Create new payment record
      const paymentRecord = {
        user_id: user.id,
        document_type: documentType,
        amount: amount,
        currency: 'XAF',
        status: 'completed',
        payment_method: 'mobile_money',
        transaction_id: txRef || this.generateTransactionReference(),
        flutterwave_tx_ref: txRef,
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

  // Get purchased documents list
  async getPurchasedDocuments() {
    try {
      const purchasedDocuments = await AsyncStorage.getItem('purchased_documents')
      return purchasedDocuments ? JSON.parse(purchasedDocuments) : []
    } catch (error) {
      console.error('Error getting purchased documents:', error)
      return []
    }
  }

  // Initiate mobile money payment for Cameroon (XAF)
  async initiateMobileMoneyPayment(documentType, customerInfo, phoneNumber, network = 'MTN') {
    try {
      const amount = 2500 // XAF
      const txRef = this.generateTransactionReference()

      // Format phone number for Cameroon (add country code if not present)
      const formattedPhone = phoneNumber.startsWith('237') ? phoneNumber : `237${phoneNumber}`

      const payload = {
        phone_number: formattedPhone,
        amount: amount,
        currency: 'XAF',
        country: 'CM',
        email: customerInfo.email,
        tx_ref: txRef,
        network: network, // MTN or ORANGEMONEY
        fullname: customerInfo.fullname || 'Legal237 User',
        meta: {
          document_type: documentType,
          app_name: 'Legal237'
        }
      }

      console.log('Payment payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(`${API_URL}/charges?type=mobile_money_franco`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))

      const result = await response.json()
      console.log('Payment response:', JSON.stringify(result, null, 2))
      
      if (result.status === 'success') {
        // Store payment reference for verification
        await AsyncStorage.setItem(`payment_${txRef}`, JSON.stringify({
          documentType,
          amount,
          flw_ref: result.data.flw_ref,
          status: 'pending',
          timestamp: new Date().toISOString()
        }))

        return {
          success: true,
          data: result.data,
          meta: result.meta,
          tx_ref: txRef
        }
      } else {
        console.error('Payment initiation failed:', result)
        return {
          success: false,
          error: result.message || result.data?.message || 'Payment initiation failed'
        }
      }
    } catch (error) {
      console.error('Error initiating payment:', error)
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    }
  }

  // Verify payment status
  async verifyPayment(txRef) {
    try {
      const response = await fetch(`${API_URL}/transactions/${txRef}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (result.status === 'success' && result.data.status === 'successful') {
        // Payment successful, mark document as purchased
        const paymentData = await AsyncStorage.getItem(`payment_${txRef}`)
        if (paymentData) {
          const payment = JSON.parse(paymentData)
          
          // Save to database with correct transaction reference
          await this.savePurchaseToDatabase(payment.documentType, txRef, payment.amount);
          
          // Mark locally as purchased
          await this.markDocumentAsPurchased(payment.documentType)
          
          // Update payment status
          payment.status = 'successful'
          await AsyncStorage.setItem(`payment_${txRef}`, JSON.stringify(payment))
        }

        return {
          success: true,
          status: 'successful',
          data: result.data
        }
      } else {
        return {
          success: false,
          status: result.data?.status || 'failed',
          data: result.data
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      return {
        success: false,
        error: 'Verification failed'
      }
    }
  }

  // Get document price
  getDocumentPrice(documentType) {
    return 5000 // XAF for both penal code and criminal procedure
  }

  // Get document info
  getDocumentInfo(documentType, language = 'en') {
    const docs = {
      penal_code: {
        en: {
          name: 'Cameroonian Penal Code',
          description: 'Complete collection of criminal law articles',
          price: 5000,
          currency: 'XAF'
        },
        fr: {
          name: 'Code Pénal Camerounais',
          description: 'Collection complète des articles de droit pénal',
          price: 5000,
          currency: 'XAF'
        }
      },
      criminal_procedure: {
        en: {
          name: 'Criminal Procedure Code',
          description: 'Complete collection of criminal procedure articles',
          price: 5000,
          currency: 'XAF'
        },
        fr: {
          name: 'Code de Procédure Pénale',
          description: 'Collection complète des articles de procédure pénale',
          price: 5000,
          currency: 'XAF'
        }
      }
    }

    // If it's a known document type, return the specific info
    if (docs[documentType]?.[language] || docs[documentType]?.en) {
      return docs[documentType]?.[language] || docs[documentType]?.en;
    }

    // For new/unknown document types, create generic info
    const formattedName = documentType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      name: formattedName,
      description: language === 'fr' ? 'Collection d\'articles juridiques' : 'Collection of legal articles',
      price: 5000,
      currency: 'XAF'
    };
  }

  // Check if payment is required
  async isPaymentRequired(documentType) {
    const hasPaid = await this.hasPaidForDocument(documentType)
    return !hasPaid
  }

  // Test API connection
  async testApiConnection() {
    try {
      console.log('Testing Flutterwave API connection...')
      
      const response = await fetch(`${API_URL}/bills/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_code: 'test',
          code: 'test',
          customer: 'test'
        })
      })

      const result = await response.json()
      console.log('API Test Response:', result)
      
      if (response.ok || result.status === 'error') {
        console.log('Flutterwave API connection successful')
        return { success: true, message: 'API connection successful' }
      } else {
        console.log('Flutterwave API connection failed')
        return { success: false, message: 'API connection failed' }
      }
    } catch (error) {
      console.error('API connection test failed:', error)
      return { success: false, message: error.message }
    }
  }

  // Check mobile money service status
  async checkMobileMoneyServiceStatus() {
    try {
      console.log('Checking mobile money service status...')
      
      // Try a minimal mobile money payment request to check service availability
      const testPayload = {
        phone_number: '237677000000', // Test number
        amount: 100, // Minimal amount
        currency: 'XAF',
        country: 'CM',
        email: 'test@example.com',
        tx_ref: `TEST_${Date.now()}`,
        network: 'MTN',
        fullname: 'Test User'
      }

      const response = await fetch(`${API_URL}/charges?type=mobile_money_franco`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      })

      const result = await response.json()
      console.log('Service Status Check Response:', result)
      
      // Check for maintenance error
      if (result.message && result.message.includes('not allowed to process this payment')) {
        return { 
          available: false, 
          status: 'maintenance',
          message: 'Mobile money service is under maintenance'
        }
      }
      
      // Check for other errors that might indicate service issues
      if (result.status === 'error' && !result.message.includes('Invalid phone number')) {
        return { 
          available: false, 
          status: 'error',
          message: result.message || 'Service temporarily unavailable'
        }
      }
      
      return { 
        available: true, 
        status: 'operational',
        message: 'Mobile money service is operational'
      }
    } catch (error) {
      console.error('Service status check failed:', error)
      return { 
        available: false, 
        status: 'error',
        message: 'Unable to check service status'
      }
    }
  }

  // Clear all purchases (for testing)
  async clearAllPurchases() {
    try {
      await AsyncStorage.removeItem('purchased_documents')
    } catch (error) {
      console.error('Error clearing purchases:', error)
    }
  }

  // Sync completed payments from database to local storage
  async syncPaymentsFromDatabase() {
    try {
      const { supabase } = require('../lib/supabase');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No authenticated user for payment sync');
        return;
      }

      console.log('Syncing payments for user:', user.id);

      // Get all completed payments for this user
      const { data: payments, error } = await supabase
        .from('payment_records')
        .select('document_type')
        .eq('user_id', user.id)
        .in('status', ['completed', 'successful', 'success']);

      if (error) {
        console.error('Error syncing payments from database:', error);
        return;
      }

      console.log('Database payments found:', payments);

      if (payments && payments.length > 0) {
        // Get current local purchases
        const purchasedDocuments = await AsyncStorage.getItem('purchased_documents');
        let purchased = purchasedDocuments ? JSON.parse(purchasedDocuments) : [];

        console.log('Current local purchases:', purchased);

        // Add database payments to local storage
        let updated = false;
        payments.forEach(payment => {
          if (!purchased.includes(payment.document_type)) {
            purchased.push(payment.document_type);
            updated = true;
            console.log('Added to local purchases:', payment.document_type);
          }
        });

        // Save updated list if changed
        if (updated) {
          await AsyncStorage.setItem('purchased_documents', JSON.stringify(purchased));
          console.log('Updated local purchases saved:', purchased);
        } else {
          console.log('No new payments to sync');
        }
      } else {
        console.log('No completed payments found in database');
      }
    } catch (error) {
      console.error('Error syncing payments from database:', error);
    }
  }

  // Test method to manually check payment sync (for development)
  async testPaymentSync() {
    console.log('=== Testing Payment Sync ===');
    
    try {
      const { supabase } = require('../lib/supabase');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No authenticated user for test');
        return { success: false, message: 'No authenticated user' };
      }

      console.log('Testing for user:', user.id);

      // Check database payments
      const { data: dbPayments, error: dbError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id);

      console.log('All database payments:', dbPayments);

      // Check local storage
      const localPurchases = await this.getPurchasedDocuments();
      console.log('Local purchases:', localPurchases);

      // Run sync
      await this.syncPaymentsFromDatabase();

      // Check local storage again
      const newLocalPurchases = await this.getPurchasedDocuments();
      console.log('Local purchases after sync:', newLocalPurchases);

      return {
        success: true,
        databasePayments: dbPayments?.length || 0,
        localPurchasesBefore: localPurchases,
        localPurchasesAfter: newLocalPurchases
      };
    } catch (error) {
      console.error('Payment sync test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PaymentService()
