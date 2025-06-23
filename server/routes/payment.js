const express = require('express');
const { v4: uuidv4 } = require('uuid');
const myCoolPayService = require('../services/mycoolpay');
const supabaseService = require('../services/supabase');

const router = express.Router();

/**
 * Initialize payment for mobile app
 * POST /api/payment/init
 */
router.post('/init', async (req, res) => {
  try {
    const { documentType, customer, paymentMethod, language = 'en', userId } = req.body;

    // Validate required fields
    if (!documentType || !customer || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: documentType, customer, paymentMethod'
      });
    }

    if (!customer.fullname || !customer.email || !customer.phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing customer information: fullname, email, phone'
      });
    }

    // Format phone number for Cameroon
    let phone = customer.phone.replace(/\s/g, '');
    if (phone.startsWith('6')) {
      phone = '237' + phone;
    } else if (!phone.startsWith('237')) {
      phone = '237' + phone;
    }

    const transactionId = uuidv4();
    const documentInfo = myCoolPayService.getDocumentInfo(documentType, language);

    // Save transaction to database
    const transactionData = {
      id: transactionId,
      document_type: documentType,
      customer_name: customer.fullname,
      customer_email: customer.email,
      customer_phone: phone,
      amount: documentInfo.price,
      currency: documentInfo.currency,
      payment_method: paymentMethod,
      language: language,
      user_id: userId,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await supabaseService.saveTransaction(transactionData);

    // Initialize payment with My-CoolPay
    const paymentResult = await myCoolPayService.initiatePayment({
      transactionId,
      documentType,
      customer: {
        fullname: customer.fullname,
        email: customer.email,
        phone: phone
      },
      paymentMethod,
      language,
      userId
    });

    if (paymentResult.success) {
      // Update transaction with payment reference
      await supabaseService.updateTransactionStatus(transactionId, 'initiated', {
        payment_reference: paymentResult.reference,
        payment_url: paymentResult.payment_url
      });

      res.json({
        success: true,
        transaction_id: transactionId,
        payment_url: paymentResult.payment_url,
        reference: paymentResult.reference,
        amount: documentInfo.price,
        currency: documentInfo.currency,
        message: 'Payment initialized successfully'
      });
    } else {
      // Update transaction status to failed
      await supabaseService.updateTransactionStatus(transactionId, 'failed', {
        error_message: paymentResult.error
      });

      res.status(400).json({
        success: false,
        error: paymentResult.error,
        transaction_id: transactionId
      });
    }

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Check payment status for mobile app
 * GET /api/payment/status/:transactionId
 */
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Get transaction from database
    const transaction = await supabaseService.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // If already completed, return cached status
    if (transaction.status === 'completed' || transaction.status === 'failed') {
      return res.json({
        success: true,
        status: transaction.status,
        transaction_id: transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        customer: {
          name: transaction.customer_name,
          email: transaction.customer_email,
          phone: transaction.customer_phone
        },
        payment_method: transaction.payment_method,
        paid_at: transaction.paid_at,
        document_type: transaction.document_type
      });
    }

    // Check with My-CoolPay for latest status
    const statusResult = await myCoolPayService.getPaymentStatus(transactionId);
    
    if (statusResult.success) {
      // Update database with latest status
      if (statusResult.status === 'completed' || statusResult.status === 'successful') {
        await supabaseService.updateTransactionStatus(transactionId, 'completed', {
          paid_at: new Date().toISOString()
        });
        
        // Grant document access
        await supabaseService.grantDocumentAccess(
          transaction.user_id, 
          transaction.document_type,
          transactionId
        );
      } else if (statusResult.status === 'failed' || statusResult.status === 'cancelled') {
        await supabaseService.updateTransactionStatus(transactionId, 'failed');
      }

      res.json(statusResult);
    } else {
      res.status(400).json(statusResult);
    }

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get document info and pricing
 * GET /api/payment/documents/:documentType
 */
router.get('/documents/:documentType', (req, res) => {
  try {
    const { documentType } = req.params;
    const { language = 'en' } = req.query;

    const documentInfo = myCoolPayService.getDocumentInfo(documentType, language);
    
    res.json({
      success: true,
      document: documentInfo
    });

  } catch (error) {
    console.error('Get document info error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Check service status
 * GET /api/payment/service-status
 */
router.get('/service-status', async (req, res) => {
  try {
    const status = await myCoolPayService.checkServiceStatus();
    res.json(status);
  } catch (error) {
    console.error('Service status check error:', error);
    res.status(500).json({
      available: false,
      status: 'error',
      message: 'Unable to check service status'
    });
  }
});

/**
 * Get user's payment history
 * GET /api/payment/history/:userId
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await supabaseService.getUserTransactions(userId, page, limit);
    
    res.json({
      success: true,
      transactions: transactions.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transactions.count,
        pages: Math.ceil(transactions.count / limit)
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Check if user has access to document
 * GET /api/payment/access/:userId/:documentType
 */
router.get('/access/:userId/:documentType', async (req, res) => {
  try {
    const { userId, documentType } = req.params;

    const hasAccess = await supabaseService.checkDocumentAccess(userId, documentType);
    
    res.json({
      success: true,
      has_access: hasAccess,
      document_type: documentType,
      user_id: userId
    });

  } catch (error) {
    console.error('Check document access error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router; 