const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validate Supabase configuration
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration:', {
    hasUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
}

// My-CoolPay configuration
const MYCOOLPAY_CONFIG = {
  merchantId: process.env.MYCOOLPAY_MERCHANT_ID,
  publicKey: process.env.MYCOOLPAY_PUBLIC_KEY,
  privateKey: process.env.MYCOOLPAY_PRIVATE_KEY,
  baseUrl: 'https://my-coolpay.com/api'
};

// Validate API keys are present
if (!MYCOOLPAY_CONFIG.publicKey || !MYCOOLPAY_CONFIG.privateKey) {
  console.error('My-CoolPay API keys not configured properly');
}

// Document pricing
const DOCUMENT_PRICES = {
  penal_code: { price: 5000, name: 'Penal Code', description: 'Complete Cameroon Penal Code' },
  criminal_procedure: { price: 5000, name: 'Criminal Procedure', description: 'Criminal Procedure Code' },
      full_package: { price: 5000, name: 'Full Package', description: 'All legal documents package' }
};

// Helper function to generate signature
function generateSignature(data, privateKey) {
  const sortedData = Object.keys(data)
    .sort()
    .reduce((result, key) => {
      result[key] = data[key];
      return result;
    }, {});
  
  const queryString = Object.entries(sortedData)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', privateKey)
    .update(queryString)
    .digest('hex');
}

// Helper function to verify webhook signature
function verifyWebhookSignature(payload, signature, privateKey) {
  const expectedSignature = crypto
    .createHmac('sha256', privateKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}

// Main handler function
exports.handler = async (event, context) => {
  console.log('Function called with event:', {
    path: event.path,
    method: event.httpMethod,
    body: event.body,
    headers: event.headers
  });
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : null;
    const queryParams = event.queryStringParameters || {};

    console.log(`${method} ${path}`, { body, queryParams });

    // Route handling
    if (path === '/payment/init' && method === 'POST') {
      return await handlePaymentInit(body, headers);
    }
    
    if (path === '/payment/process' && method === 'POST') {
      return await handlePaymentProcess(body, headers);
    }
    
    if (path.startsWith('/payment/status/') && method === 'GET') {
      const transactionId = path.split('/').pop();
      return await handlePaymentStatus(transactionId, headers);
    }
    
    if (path.startsWith('/payment/documents/') && method === 'GET') {
      const documentType = path.split('/').pop();
      return await handleGetDocument(documentType, headers);
    }
    
    if (path === '/payment/service-status' && method === 'GET') {
      return await handleServiceStatus(headers);
    }
    
    if (path.startsWith('/payment/history/') && method === 'GET') {
      const userId = path.split('/').pop();
      return await handlePaymentHistory(userId, headers);
    }
    
    if (path.match(/\/payment\/access\/(.+)\/(.+)/) && method === 'GET') {
      const matches = path.match(/\/payment\/access\/(.+)\/(.+)/);
      const userId = matches[1];
      const documentType = matches[2];
      return await handleDocumentAccess(userId, documentType, headers);
    }
    
    if (path === '/webhooks/mycoolpay' && method === 'POST') {
      return await handleWebhook(body, event.headers, headers);
    }
    
    // Test endpoint for webhook (GET request for testing)
    if (path === '/webhooks/mycoolpay' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Webhook endpoint is working',
          endpoint: 'POST /api/webhooks/mycoolpay',
          note: 'This endpoint accepts POST requests from My-CoolPay'
        })
      };
    }
    
    // Health check endpoint
    if (path === '/health' && method === 'GET') {
      // Test database connection
      let dbStatus = 'unknown';
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('count', { count: 'exact', head: true });
        dbStatus = error ? `error: ${error.message}` : 'connected';
      } catch (err) {
        dbStatus = `connection failed: ${err.message}`;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          status: 'API is running',
          version: '4.5.0-duplicate-prevention-enhanced',
          timestamp: new Date().toISOString(),
          database_status: dbStatus,
          supabase_config: {
            hasUrl: !!process.env.SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            urlPreview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'missing'
          },
          mycoolpay_config: {
            hasPublicKey: !!MYCOOLPAY_CONFIG.publicKey,
            hasPrivateKey: !!MYCOOLPAY_CONFIG.privateKey,
            hasMerchantId: !!MYCOOLPAY_CONFIG.merchantId,
            publicKeyPreview: MYCOOLPAY_CONFIG.publicKey ? MYCOOLPAY_CONFIG.publicKey.substring(0, 20) + '...' : 'missing',
            baseUrl: MYCOOLPAY_CONFIG.baseUrl
          },
          available_endpoints: [
            'POST /api/payment/init',
            'POST /api/payment/process',
            'GET /api/payment/status/{transactionId}',
            'GET /api/payment/documents/{documentType}',
            'GET /api/payment/service-status',
            'GET /api/payment/history/{userId}',
            'GET /api/payment/access/{userId}/{documentType}',
            'POST /api/webhooks/mycoolpay'
          ]
        })
      };
    }

    // Default 404 response
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};

// Payment initialization handler
async function handlePaymentInit(body, headers) {
  console.log('Payment init request body:', body);
  
  const { currency = 'XAF', documentType, userId, email, phone, customer, customerName, customerEmail, customerPhone } = body;

  if (!documentType || !userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields: documentType, userId' })
    };
  }
  
  // Get document info and price
  const docInfo = DOCUMENT_PRICES[documentType];
  if (!docInfo) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid document type' })
    };
  }
  
  const amount = docInfo.price;

  // Extract customer info - prioritize direct fields, then customer object, then fallbacks
  const finalCustomerName = customerName || customer?.fullname || customer?.name || 'Guest User';
  const finalCustomerEmail = customerEmail || customer?.email || email;
  let finalCustomerPhone = customerPhone || customer?.phone || phone;
  
  // Format phone number for My-CoolPay (they expect local format like "699009900")
  if (finalCustomerPhone && finalCustomerPhone.startsWith('+237')) {
    finalCustomerPhone = finalCustomerPhone.replace('+237', '');
  }
  if (finalCustomerPhone && finalCustomerPhone.startsWith('237')) {
    finalCustomerPhone = finalCustomerPhone.substring(3);
  }
  console.log('Formatted phone number for My-CoolPay:', finalCustomerPhone);

  // Handle user_id - generate UUID if not a valid UUID format
  let finalUserId = userId;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    // For non-UUID userIds (like emails or simple strings), we'll set user_id to null
    // and use the original userId for reference in the payment_reference
    finalUserId = null;
    console.log(`Non-UUID userId provided: ${userId}, setting user_id to null`);
  }

  try {
    // Check for existing pending transactions for this user + document combination
    const { data: existingTransactions, error: checkError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('customer_email', finalCustomerEmail)
      .eq('document_type', documentType)
      .in('status', ['pending', 'processing', 'awaiting_otp'])
      .order('created_at', { ascending: false });

    if (checkError) {
      console.error('Error checking existing transactions:', checkError);
    }

    // If there's an existing pending transaction, cancel it first
    if (existingTransactions && existingTransactions.length > 0) {
      console.log(`Found ${existingTransactions.length} existing pending transaction(s), canceling them...`);
      
      for (const existingTx of existingTransactions) {
        console.log(`Canceling transaction: ${existingTx.payment_reference}`);
        await supabase
          .from('payment_transactions')
          .update({ 
            status: 'cancelled',
            error_message: 'Cancelled due to new payment attempt',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingTx.id);
      }
      
      // Allow immediate processing after cancellation
      console.log('Existing transactions cancelled, proceeding with new payment...');
    }

    // Include original userId in transaction reference for tracking
    const userRef = userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15); // Clean userId for reference
    // Add more randomness and timestamp to ensure uniqueness
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 15);
    const transactionId = `tx_${timestamp}_${userRef}_${randomSuffix}`;
    
    console.log(`Creating transaction: ${transactionId}`);
    console.log(`Cancelled existing transactions for: ${finalCustomerEmail} + ${documentType}`);
    
    // Add unique suffix to customer name to avoid duplicate detection
    const uniqueSuffix = timestamp.toString().substr(-6);
    const uniqueCustomerName = `${finalCustomerName} #${uniqueSuffix}`;
    
    // Prepare My-CoolPay paylink data
    const paylinkData = {
      transaction_amount: amount,
      transaction_currency: currency,
      transaction_reason: `${docInfo.description || 'Legal document purchase'} (${uniqueSuffix})`,
      app_transaction_ref: transactionId,
      customer_phone_number: finalCustomerPhone,
      customer_name: uniqueCustomerName,
      customer_email: finalCustomerEmail,
      customer_lang: 'en'
    };

    // Call My-CoolPay paylink API with correct endpoint format
    console.log('Calling My-CoolPay paylink API with:', paylinkData);
    
    let paylinkResult;
    try {
      // Use correct endpoint: /api/{public_key}/paylink
      const paylinkUrl = `${MYCOOLPAY_CONFIG.baseUrl}/${MYCOOLPAY_CONFIG.publicKey}/paylink`;
      console.log('My-CoolPay paylink URL:', paylinkUrl);
      
      const paylinkResponse = await axios.post(paylinkUrl, paylinkData, {
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header needed - authentication via public key in URL
        },
        timeout: 15000 // 15 second timeout to prevent function timeout
      });

      paylinkResult = paylinkResponse.data;
      console.log('My-CoolPay paylink response:', paylinkResult);
      
      // Check for success status
      if (paylinkResult.status !== 'success') {
        throw new Error(`My-CoolPay API returned non-success status: ${paylinkResult.status}`);
      }
      
    } catch (apiError) {
      console.error('My-CoolPay API error details:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message,
        url: apiError.config?.url,
        method: apiError.config?.method,
        timeout: apiError.code === 'ECONNABORTED'
      });
      
      // Return more specific error information
      const errorMessage = apiError.response?.data?.message || 
                          apiError.response?.statusText || 
                          apiError.message || 
                          'Unknown API error';
      
      throw new Error(`My-CoolPay API error: ${apiError.response?.status || 'Network error'} - ${errorMessage}`);
    }

    // Extract payment URL and transaction reference from response
    const checkoutUrl = paylinkResult.payment_url;
    const mycoolpayTransactionRef = paylinkResult.transaction_ref;

    if (!checkoutUrl) {
      throw new Error('No payment_url received from My-CoolPay API response');
    }
    
    console.log('My-CoolPay payment URL:', checkoutUrl);
    console.log('My-CoolPay transaction ref:', mycoolpayTransactionRef);

    // Save transaction to database (using original customer name, not the modified one)
    const insertData = {
      document_type: documentType,
      customer_name: finalCustomerName, // Store original name
      customer_email: finalCustomerEmail,
      customer_phone: finalCustomerPhone,
      amount: amount,
      currency: currency,
      payment_method: 'MOBILE_MONEY', // or use the actual payment method
      language: 'en', // or use the actual language
      user_id: finalUserId,
      status: 'pending',
      payment_reference: transactionId,
      payment_url: checkoutUrl,
      webhook_data: { 
        ...paylinkData, 
        original_user_id: userId,
        original_customer_name: finalCustomerName, // Store original name here too
        mycoolpay_transaction_ref: mycoolpayTransactionRef,
        our_transaction_id: transactionId,
        unique_suffix: uniqueSuffix
      }
    };
    
    console.log('Inserting transaction data:', insertData);
    
    const { error: dbError } = await supabase
      .from('payment_transactions')
      .insert(insertData);

    if (dbError) {
      console.error('Database error details:', {
        error: dbError,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      });
      console.error('Attempted to insert:', {
        document_type: documentType,
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail,
        customer_phone: finalCustomerPhone,
        amount: amount,
        currency: currency,
        user_id: finalUserId,
        status: 'pending',
        payment_reference: transactionId
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to save transaction',
          details: dbError.message,
          code: dbError.code
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transaction_id: transactionId,
        payment_url: checkoutUrl,
        amount: amount,
        currency: currency,
        mycoolpay_transaction_ref: mycoolpayTransactionRef,
        payment_data: paylinkData
      })
    };

  } catch (error) {
    console.error('Payment init error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Payment initialization failed' })
    };
  }
}

// Payment processing handler - actually process the payment with My-CoolPay
async function handlePaymentProcess(body, headers) {
  console.log('Payment process request body:', body);
  
  const { transaction_id, phone_number, payment_method = 'MTN' } = body;

  if (!transaction_id || !phone_number) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields: transaction_id, phone_number' })
    };
  }

  try {
    // Get the transaction from database
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_reference', transaction_id)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', fetchError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction not found' })
      };
    }

    // Format phone number for My-CoolPay
    let formattedPhone = phone_number;
    if (formattedPhone.startsWith('+237')) {
      formattedPhone = formattedPhone.replace('+237', '');
    }
    if (formattedPhone.startsWith('237')) {
      formattedPhone = formattedPhone.substring(3);
    }

    // Update transaction status to processing
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({ 
        status: 'processing',
        payment_method: payment_method,
        updated_at: new Date().toISOString()
      })
      .eq('payment_reference', transaction_id);

    if (updateError) {
      console.error('Failed to update transaction status:', updateError);
    }

    // Call My-CoolPay's mobile money payment API
    try {
      const paymentData = {
        transaction_amount: transaction.amount,
        transaction_currency: transaction.currency,
        transaction_reason: `Payment for ${transaction.document_type}`,
        app_transaction_ref: transaction_id,
        customer_phone_number: formattedPhone,
        customer_name: transaction.customer_name,
        customer_email: transaction.customer_email,
        customer_lang: transaction.language || 'en'
        // Note: payment_method is not included as My-CoolPay auto-detects based on phone number
      };

      // Use My-CoolPay's mobile money payment endpoint
      const paymentUrl = `${MYCOOLPAY_CONFIG.baseUrl}/${MYCOOLPAY_CONFIG.publicKey}/payin`;
      console.log('Calling My-CoolPay payin API:', paymentUrl);
      console.log('Payment data:', paymentData);
      
      const paymentResponse = await axios.post(paymentUrl, paymentData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout for payin payments
      });

      const paymentResult = paymentResponse.data;
      console.log('My-CoolPay payin response:', paymentResult);
      
      if (paymentResult.status === 'success') {
        // Check the action from payin response
        const action = paymentResult.action;
        
        if (action === 'REQUIRE_OTP') {
          // Payment requires OTP - update status to awaiting_otp
          const { error: paymentUpdateError } = await supabase
            .from('payment_transactions')
            .update({
              status: 'awaiting_otp',
              webhook_data: {
                ...transaction.webhook_data,
                payment_response: paymentResult,
                payin_initiated_at: new Date().toISOString(),
                transaction_ref: paymentResult.transaction_ref,
                action: action
              },
              updated_at: new Date().toISOString()
            })
            .eq('payment_reference', transaction_id);

          if (paymentUpdateError) {
            console.error('Failed to update payment details:', paymentUpdateError);
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              status: 'awaiting_otp',
              message: 'OTP sent to your phone. Please check your SMS and authorize the payment.',
              transaction_id: transaction_id,
              payment_method: payment_method,
              requires_otp: true
            })
          };
        } else if (action === 'PENDING') {
          // Payment is pending with USSD
          const ussd = paymentResult.ussd;
          
          const { error: paymentUpdateError } = await supabase
            .from('payment_transactions')
            .update({
              status: 'processing',
              webhook_data: {
                ...transaction.webhook_data,
                payment_response: paymentResult,
                payin_initiated_at: new Date().toISOString(),
                transaction_ref: paymentResult.transaction_ref,
                action: action,
                ussd: ussd
              },
              updated_at: new Date().toISOString()
            })
            .eq('payment_reference', transaction_id);

          if (paymentUpdateError) {
            console.error('Failed to update payment details:', paymentUpdateError);
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              status: 'processing',
              message: `Please dial ${ussd} on your phone to complete the payment.`,
              transaction_id: transaction_id,
              payment_method: payment_method,
              ussd: ussd
            })
          };
        } else {
          // Unknown action
          throw new Error(`Unknown action '${action}' in payin response`);
        }
      } else {
        throw new Error(`Payment failed: ${paymentResult.message || 'Unknown error'}`);
      }

    } catch (apiError) {
      console.error('My-CoolPay payin API error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message
      });

      // Update transaction status to failed
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          error_message: apiError.response?.data?.message || apiError.message,
          updated_at: new Date().toISOString()
        })
        .eq('payment_reference', transaction_id);

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Payment processing failed: ${apiError.response?.data?.message || apiError.message}`
        })
      };
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Payment processing failed' 
      })
    };
  }
}

// Payment status handler
async function handlePaymentStatus(transactionId, headers) {
  try {
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_reference', transactionId)
      .single();

    if (error || !transaction) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...transaction
      })
    };

  } catch (error) {
    console.error('Payment status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get payment status' })
    };
  }
}

// Document info handler
async function handleGetDocument(documentType, headers) {
  const docInfo = DOCUMENT_PRICES[documentType];
  
  if (!docInfo) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Document type not found' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      document_type: documentType,
      ...docInfo
    })
  };
}

// Service status handler
async function handleServiceStatus(headers) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        database: 'operational',
        payment_gateway: 'operational'
      }
    })
  };
}

// Payment history handler
async function handlePaymentHistory(userId, headers) {
  try {
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to get payment history' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transactions: transactions || []
      })
    };

  } catch (error) {
    console.error('Payment history error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get payment history' })
    };
  }
}

// Document access handler
async function handleDocumentAccess(userId, documentType, headers) {
  try {
    const { data: access, error } = await supabase
      .from('document_access')
      .select('*')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .eq('status', 'active')
      .single();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        has_access: !!access,
        access_details: access || null
      })
    };

  } catch (error) {
    console.error('Document access error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to check document access' })
    };
  }
}

// Webhook handler
async function handleWebhook(body, eventHeaders, headers) {
  try {
    const signature = eventHeaders['x-mycoolpay-signature'];
    
    if (!signature || !verifyWebhookSignature(body, signature, MYCOOLPAY_CONFIG.privateKey)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const { transaction_id, status, payment_method, reference } = body;

    // Update transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: status,
        payment_method: payment_method,
        webhook_data: body,
        webhook_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('payment_reference', transaction_id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update transaction' })
      };
    }

    // If payment successful, grant document access
    if (status === 'completed' || status === 'success') {
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('user_id, document_type, id')
        .eq('payment_reference', transaction_id)
        .single();

      if (transaction) {
        await supabase
          .from('document_access')
          .upsert({
            user_id: transaction.user_id,
            document_type: transaction.document_type,
            transaction_id: transaction.id,
            status: 'active',
            granted_at: new Date().toISOString()
          });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Webhook processed' })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
} 