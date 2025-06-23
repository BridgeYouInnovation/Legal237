const axios = require('axios');
const crypto = require('crypto');

class MyCoolPayService {
  constructor() {
    this.baseURL = 'https://my-coolpay.com/api/v1.1';
    this.publicKey = process.env.MYCOOLPAY_PUBLIC_KEY;
    this.privateKey = process.env.MYCOOLPAY_PRIVATE_KEY;
    this.merchantId = process.env.MYCOOLPAY_MERCHANT_ID;
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
  getDocumentInfo(documentType, language = 'en') {
    const documents = {
      'penal_code': {
        name: language === 'fr' ? 'Code Pénal du Cameroun' : 'Cameroon Penal Code',
        description: language === 'fr' ? 'Code pénal complet avec toutes les lois' : 'Complete penal code with all laws',
        price: 2000,
        currency: 'XAF'
      },
      'criminal_procedure': {
        name: language === 'fr' ? 'Procédure Pénale du Cameroun' : 'Cameroon Criminal Procedure',
        description: language === 'fr' ? 'Procédures complètes du système judiciaire' : 'Complete judicial system procedures',
        price: 2000,
        currency: 'XAF'
      },
      'full_package': {
        name: language === 'fr' ? 'Package Complet' : 'Complete Package',
        description: language === 'fr' ? 'Tous les documents légaux' : 'All legal documents',
        price: 3500,
        currency: 'XAF'
      }
    };

    return documents[documentType] || documents['penal_code'];
  }

  /**
   * Initialize payment with My-CoolPay
   */
  async initiatePayment(orderData) {
    try {
      const timestamp = Date.now().toString();
      const documentInfo = this.getDocumentInfo(orderData.documentType, orderData.language);
      
      const paymentData = {
        merchant_id: this.merchantId,
        public_key: this.publicKey,
        transaction_id: orderData.transactionId,
        amount: documentInfo.price,
        currency: documentInfo.currency,
        description: `Purchase of ${documentInfo.name}`,
        customer_name: orderData.customer.fullname,
        customer_email: orderData.customer.email,
        customer_phone: orderData.customer.phone,
        payment_method: orderData.paymentMethod, // 'MTN' or 'ORANGEMONEY'
        callback_url: `${process.env.BASE_URL}/api/webhooks/mycoolpay`,
        return_url: `${process.env.BASE_URL}/payment/success`,
        cancel_url: `${process.env.BASE_URL}/payment/cancelled`,
        fail_url: `${process.env.BASE_URL}/payment/failed`,
        metadata: {
          documentType: orderData.documentType,
          language: orderData.language,
          userId: orderData.userId
        }
      };

      const signature = this.generateSignature(paymentData, timestamp);

      const response = await axios.post(`${this.baseURL}/payment/init`, paymentData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Timestamp': timestamp,
          'X-Signature': signature,
          'Authorization': `Bearer ${this.publicKey}`
        },
        timeout: 30000
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          payment_url: response.data.data.payment_url,
          transaction_id: response.data.data.transaction_id,
          reference: response.data.data.reference
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
   * Verify payment status
   */
  async verifyPayment(transactionId) {
    try {
      const timestamp = Date.now().toString();
      const data = { transaction_id: transactionId };
      const signature = this.generateSignature(data, timestamp);

      const response = await axios.post(`${this.baseURL}/payment/verify`, data, {
        headers: {
          'Content-Type': 'application/json',
          'X-Timestamp': timestamp,
          'X-Signature': signature,
          'Authorization': `Bearer ${this.privateKey}`
        },
        timeout: 15000
      });

      return {
        success: true,
        status: response.data.data.status,
        data: response.data.data
      };

    } catch (error) {
      console.error('Payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed'
      };
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload, signature, timestamp) {
    const expectedSignature = this.generateSignature(payload, timestamp);
    return expectedSignature === signature;
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
          transaction_id: verification.data.transaction_id,
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