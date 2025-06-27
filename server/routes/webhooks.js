const express = require('express');
const myCoolPayService = require('../services/mycoolpay');
const supabaseService = require('../services/supabase');

const router = express.Router();

/**
 * My-CoolPay webhook handler
 * POST /api/webhooks/mycoolpay
 */
router.post('/mycoolpay', async (req, res) => {
  try {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (!signature || !timestamp) {
      console.error('Missing webhook signature or timestamp');
      return res.status(400).json({ error: 'Missing signature or timestamp' });
    }

    // Validate webhook signature
    const isValid = myCoolPayService.validateWebhookSignature(req.body, signature, timestamp);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('Received My-CoolPay webhook:', webhookData);

    const { 
      transaction_id, 
      status, 
      amount, 
      currency, 
      customer,
      payment_method,
      paid_at,
      metadata 
    } = webhookData;

    if (!transaction_id) {
      console.error('Missing transaction_id in webhook');
      return res.status(400).json({ error: 'Missing transaction_id' });
    }

    // Get transaction from database
    const transaction = await supabaseService.getTransaction(transaction_id);
    
    if (!transaction) {
      console.error(`Transaction not found: ${transaction_id}`);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction status based on webhook
    let newStatus = 'pending';
    const updateData = {
      webhook_received_at: new Date().toISOString(),
      webhook_data: webhookData
    };

    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
      case 'paid':
        newStatus = 'completed';
        updateData.paid_at = paid_at || new Date().toISOString();
        
        // Grant document access to user
        if (transaction.user_id && transaction.document_type) {
          await supabaseService.grantDocumentAccess(
            transaction.user_id, 
            transaction.document_type,
            transaction_id
          );
          console.log(`Document access granted for user ${transaction.user_id}, document ${transaction.document_type}`);
        }
        break;
        
      case 'failed':
      case 'cancelled':
      case 'rejected':
        newStatus = 'failed';
        updateData.failure_reason = webhookData.failure_reason || `Payment ${status}`;
        break;
        
      case 'pending':
      case 'processing':
        newStatus = 'pending';
        break;
        
      default:
        console.warn(`Unknown payment status: ${status}`);
        newStatus = 'pending';
    }

    // Update transaction in database
    await supabaseService.updateTransactionStatus(transaction_id, newStatus, updateData);

    console.log(`Transaction ${transaction_id} updated to status: ${newStatus}`);

    // Send success response to My-CoolPay
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      transaction_id: transaction_id,
      status: newStatus
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log the error but still return 200 to prevent retries for malformed data
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return res.status(200).json({ 
        success: false, 
        error: 'Invalid webhook data format' 
      });
    }
    
    // Return 500 for genuine server errors (this will trigger retries from My-CoolPay)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * Webhook test endpoint for development
 * POST /api/webhooks/test
 */
router.post('/test', async (req, res) => {
  try {
    console.log('Test webhook received:', req.body);
    
    const { transaction_id, status = 'completed' } = req.body;
    
    if (!transaction_id) {
      return res.status(400).json({ error: 'Missing transaction_id' });
    }

    // Simulate webhook processing
    const transaction = await supabaseService.getTransaction(transaction_id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await supabaseService.updateTransactionStatus(transaction_id, status, {
      test_webhook_at: new Date().toISOString()
    });

    if (status === 'completed' && transaction.user_id && transaction.document_type) {
      await supabaseService.grantDocumentAccess(
        transaction.user_id, 
        transaction.document_type,
        transaction_id
      );
    }

    res.json({ 
      success: true, 
      message: 'Test webhook processed',
      transaction_id: transaction_id,
      status: status
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get webhook logs for debugging
 * GET /api/webhooks/logs/:transactionId
 */
router.get('/logs/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await supabaseService.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      success: true,
      transaction_id: transactionId,
      webhook_data: transaction.webhook_data || null,
      webhook_received_at: transaction.webhook_received_at || null,
      current_status: transaction.status,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at
    });

  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 