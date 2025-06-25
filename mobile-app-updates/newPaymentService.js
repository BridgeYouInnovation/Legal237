import AsyncStorage from '@react-native-async-storage/async-storage';

class NewPaymentService {
  constructor() {
    // For mobile development, always use production API since we don't have local server
    this.baseURL = 'https://legal237.com/.netlify/functions/api';
    
    console.log('NewPaymentService initialized with baseURL:', this.baseURL);
  }

  /**
   * Get document information and pricing
   */
  async getDocumentInfo(documentType, language = 'en') {
    try {
      const url = `${this.baseURL}/payment/documents/${documentType}?language=${language}`;
      console.log('Getting document info from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Document info response:', data);
      
      if (data.success) {
        return data.document || data; // Handle different response formats
      } else {
        throw new Error(data.error || 'Failed to get document info');
      }
    } catch (error) {
      console.error('Get document info error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        documentType,
        language
      });
      throw error;
    }
  }

  /**
   * Initialize payment with My-CoolPay via backend
   */
  async initiatePayment(documentType, customer, paymentMethod, language = 'en') {
    try {
      // Get user ID if available
      const userData = await AsyncStorage.getItem('user_data');
      const userId = userData ? JSON.parse(userData).id : null;

      const requestData = {
        documentType,
        customer,
        paymentMethod,
        language,
        userId
      };

      console.log('Initiating payment:', requestData);

      const response = await fetch(`${this.baseURL}/payment/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('Payment initiation response:', data);

      if (data.success) {
        return {
          success: true,
          transaction_id: data.transaction_id,
          payment_url: data.payment_url,
          reference: data.reference,
          amount: data.amount,
          currency: data.currency,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Payment initialization failed'
        };
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId) {
    try {
      console.log('Checking payment status for:', transactionId);

      const response = await fetch(
        `${this.baseURL}/payment/status/${transactionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('Payment status response:', data);

      return data;
    } catch (error) {
      console.error('Payment status check error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check payment status'
      };
    }
  }

  /**
   * Check if user has access to document
   */
  async checkDocumentAccess(userId, documentType) {
    try {
      const response = await fetch(
        `${this.baseURL}/payment/access/${userId}/${documentType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        return data.has_access;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Check document access error:', error);
      return false;
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId, page = 1, limit = 10) {
    try {
      const response = await fetch(
        `${this.baseURL}/payment/history/${userId}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get payment history error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get payment history'
      };
    }
  }

  /**
   * Check service status
   */
  async checkServiceStatus() {
    try {
      const url = `${this.baseURL}/payment/service-status`;
      console.log('Checking service status at:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // Increase timeout
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Service status response:', data);
      
      return {
        available: data.success || true,
        status: data.status || 'operational',
        message: data.message || 'Service is running',
        services: data.services
      };
    } catch (error) {
      console.error('Service status check error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        url: `${this.baseURL}/payment/service-status`,
        stack: error.stack
      });
      return {
        available: false,
        status: 'error',
        message: `Unable to reach payment service: ${error.message}`
      };
    }
  }

  /**
   * Open payment URL in browser
   */
  async openPaymentUrl(paymentUrl) {
    try {
      const { Linking } = require('react-native');
      
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
        return { success: true };
      } else {
        throw new Error('Cannot open payment URL');
      }
    } catch (error) {
      console.error('Open payment URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to open payment page'
      };
    }
  }

  /**
   * Poll payment status until completion or timeout
   */
  async pollPaymentStatus(transactionId, onStatusUpdate, maxAttempts = 30) {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkStatus = async () => {
        try {
          const result = await this.checkPaymentStatus(transactionId);
          
          if (onStatusUpdate) {
            onStatusUpdate(result);
          }

          if (result.success) {
            if (result.status === 'completed' || result.status === 'successful') {
              resolve({
                success: true,
                status: 'completed',
                data: result
              });
              return;
            } else if (result.status === 'failed' || result.status === 'cancelled') {
              resolve({
                success: false,
                status: result.status,
                error: result.error || `Payment ${result.status}`
              });
              return;
            }
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 10000); // Check every 10 seconds
          } else {
            resolve({
              success: false,
              status: 'timeout',
              error: 'Payment verification timeout'
            });
          }
        } catch (error) {
          resolve({
            success: false,
            status: 'error',
            error: error.message || 'Payment verification failed'
          });
        }
      };

      checkStatus();
    });
  }

  /**
   * Handle deep link from payment redirect
   */
  handlePaymentDeepLink(url) {
    try {
      const urlObj = new URL(url);
      const transactionId = urlObj.searchParams.get('transaction_id');
      const status = urlObj.pathname.includes('success') ? 'success' : 
                    urlObj.pathname.includes('cancelled') ? 'cancelled' : 'failed';
      const error = urlObj.searchParams.get('error');

      return {
        success: true,
        transactionId,
        status,
        error
      };
    } catch (error) {
      console.error('Deep link parsing error:', error);
      return {
        success: false,
        error: 'Invalid deep link'
      };
    }
  }
}

export default new NewPaymentService(); 