const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

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
  baseUrl: 'https://my-coolpay.com/api/v1'
};

// Validate API keys are present
if (!MYCOOLPAY_CONFIG.publicKey || !MYCOOLPAY_CONFIG.privateKey) {
  console.error('My-CoolPay API keys not configured properly');
}

// Document pricing
const DOCUMENT_PRICES = {
  penal_code: { price: 2000, name: 'Penal Code', description: 'Complete Cameroon Penal Code' },
  criminal_procedure: { price: 2000, name: 'Criminal Procedure', description: 'Criminal Procedure Code' },
  full_package: { price: 3500, name: 'Full Package', description: 'All legal documents package' }
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
          version: '2.0.0-fixed-amount-calculation',
          timestamp: new Date().toISOString(),
          database_status: dbStatus,
          supabase_config: {
            hasUrl: !!process.env.SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            urlPreview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'missing'
          },
          available_endpoints: [
            'POST /api/payment/init',
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
  const finalCustomerPhone = customerPhone || customer?.phone || phone;

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
    // Include original userId in transaction reference for tracking
    const userRef = userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20); // Clean userId for reference
    const transactionId = `tx_${Date.now()}_${userRef}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare payment data
    const paymentData = {
      merchant_id: MYCOOLPAY_CONFIG.merchantId,
      amount: amount,
      currency: currency,
      transaction_id: transactionId,
      description: docInfo.description || 'Legal document purchase',
      customer_email: finalCustomerEmail,
      customer_phone: finalCustomerPhone,
      success_url: `${process.env.BASE_URL || 'https://legal237.com'}/payment/success`,
      cancel_url: `${process.env.BASE_URL || 'https://legal237.com'}/payment/cancelled`,
      fail_url: `${process.env.BASE_URL || 'https://legal237.com'}/payment/failed`,
      webhook_url: `${process.env.BASE_URL || 'https://legal237.com'}/api/webhooks/mycoolpay`
    };

    // Generate signature
    paymentData.signature = generateSignature(paymentData, MYCOOLPAY_CONFIG.privateKey);

    // Create complete checkout URL with payment parameters
    const checkoutParams = new URLSearchParams(paymentData);
    const checkoutUrl = `${MYCOOLPAY_CONFIG.baseUrl}/checkout?${checkoutParams.toString()}`;

    // Save transaction to database
    const insertData = {
      document_type: documentType,
      customer_name: finalCustomerName,
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
      webhook_data: { ...paymentData, original_user_id: userId }
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
        payment_data: paymentData
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