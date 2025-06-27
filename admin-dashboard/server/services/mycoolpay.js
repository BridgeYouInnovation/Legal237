const axios = require('axios');
const crypto = require('crypto');

class MyCoolPayService {
  constructor() {
    this.baseURL = 'https://my-coolpay.com/api';
    this.publicKey = process.env.MYCOOLPAY_PUBLIC_KEY;
    this.privateKey = process.env.MYCOOLPAY_PRIVATE_KEY;
    this.merchantId = process.env.MYCOOLPAY_MERCHANT_ID;
    
    if (!this.publicKey || !this.privateKey) {
      throw new Error('My-CoolPay API keys not configured');
    }
  }

  /**
   * Generate signature for API requests
   */
  generateSignature(data, timestamp) {
    const payload = JSON.stringify(data) + timestamp + this.privateKey;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Get document pricing based on type
   */
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

  /**
   * Format phone number for My-CoolPay (remove +237 prefix)
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 237, remove it
    if (cleaned.startsWith('237')) {
      return cleaned.substring(3);
    }
    
    return cleaned;
  }

  /**
   * Initialize payment with My-CoolPay using the paylink API
   */
  async initiatePayment(paymentRequest) {
    try {
      const documentInfo = this.getDocumentInfo(paymentRequest.documentType);
      
      // Generate unique transaction reference
      const appTransactionRef = paymentRequest.transactionId || 
        `tx_${Date.now()}_${paymentRequest.userId?.replace(/[^a-zA-Z0-9]/g, '')}_${Math.random().toString(36).substr(2, 8)}`;
      
      const paymentData = {
        transaction_amount: documentInfo.price,
        transaction_currency: documentInfo.currency,
        transaction_reason: documentInfo.name,
        app_transaction_ref: appTransactionRef,
        customer_phone_number: this.formatPhoneNumber(paymentRequest.customerPhone),
        customer_name: paymentRequest.customerName,
        customer_email: paymentRequest.customerEmail,
        customer_lang: "en"
      };

      console.log('Initiating My-CoolPay payment:', {
        ...paymentData,
        customer_phone_number: paymentData.customer_phone_number
      });

      // Use the correct paylink endpoint
      const response = await axios.post(
        `${this.baseURL}/${this.publicKey}/paylink`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('My-CoolPay response:', response.data);

      if (response.data.status === 'success') {
        return {
          success: true,
          payment_url: response.data.payment_url,
          transaction_ref: response.data.transaction_ref,
          app_transaction_ref: appTransactionRef,
          amount: documentInfo.price,
          currency: documentInfo.currency
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment initialization failed'
        };
      }

    } catch (error) {
      console.error('My-CoolPay API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Payment service unavailable'
      };
    }
  }

  /**
   * Verify payment status (for webhook processing)
   */
  async verifyPayment(transactionRef) {
    try {
      // For now, we'll rely on webhook data since My-CoolPay paylink API
      // doesn't provide a separate verification endpoint in the docs
      return {
        success: true,
        status: 'pending', // Will be updated by webhook
        transaction_ref: transactionRef
      };
    } catch (error) {
      console.error('Payment verification error:', error.message);
      return {
        success: false,
        error: 'Verification failed'
      };
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhook(webhookData) {
    try {
      console.log('Processing My-CoolPay webhook:', webhookData);
      
      return {
        success: true,
        transaction_ref: webhookData.transaction_ref || webhookData.app_transaction_ref,
        status: webhookData.status,
        amount: webhookData.amount,
        currency: webhookData.currency,
        customer_phone: webhookData.customer_phone,
        payment_method: webhookData.payment_method
      };
    } catch (error) {
      console.error('Webhook processing error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment status for mobile app
   */
  async getPaymentStatus(transactionId) {
    try {
      const verification = await this.verifyPayment(transactionId);
      
      if (verification.success) {
        return {
          success: true,
          status: verification.data.status,
          transaction_id: verification.data.transaction_ref,
          amount: verification.data.amount,
          currency: verification.data.currency,
          customer: verification.data.customer,
          payment_method: verification.data.payment_method,
          paid_at: verification.data.paid_at
        };
      }

      return verification;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check service availability
   */
  async checkServiceStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/status`, {
        timeout: 10000
      });

      return {
        available: true,
        status: 'operational',
        message: 'My-CoolPay service is operational'
      };
    } catch (error) {
      return {
        available: false,
        status: 'error',
        message: 'Unable to reach My-CoolPay service'
      };
    }
  }
}

module.exports = new MyCoolPayService(); 