const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// My-CoolPay configuration
const MYCOOLPAY_CONFIG = {
  baseUrl: 'https://api.my-coolpay.com',
  publicKey: process.env.MYCOOLPAY_PUBLIC_KEY,
  privateKey: process.env.MYCOOLPAY_PRIVATE_KEY,
  merchantId: process.env.MYCOOLPAY_MERCHANT_ID
};

// Document prices
const DOCUMENT_PRICES = {
  'penal_code': {
    name: 'Complete Cameroon Penal Code',
    description: 'Penal Code',
    price: 2000,
    currency: 'XAF'
  },
  'criminal_procedure': {
    name: 'Complete Cameroon Criminal Procedure',
    description: 'Criminal Procedure Code', 
    price: 2000,
    currency: 'XAF'
  }
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api-simple', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : null;

    console.log(`${method} ${path}`, { body });

    // Payment initialization
    if (path === '/payment/init' && method === 'POST') {
      return await handlePaymentInit(body, headers);
    }
    
    // Payment processing
    if (path === '/payment/process' && method === 'POST') {
      return await handlePaymentProcess(body, headers);
    }
    
    // Payment status
    if (path.startsWith('/payment/status/') && method === 'GET') {
      const transactionId = path.split('/').pop();
      return await handlePaymentStatus(transactionId, headers);
    }

    // Health check
    if (path === '/health' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: 'API is working',
          version: '5.0.0-simplified',
          timestamp: new Date().toISOString()
        })
      };
    }

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

async function handlePaymentInit(body, headers) {
  const { documentType, userId, customerName, customerEmail, customerPhone } = body;

  if (!documentType || !userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields: documentType, userId' })
    };
  }

  const docInfo = DOCUMENT_PRICES[documentType];
  if (!docInfo) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid document type' })
    };
  }

  try {
    // Cancel existing pending transactions
    await supabase
      .from('payment_transactions')
      .update({ 
        status: 'cancelled',
        error_message: 'Cancelled due to new payment attempt',
        updated_at: new Date().toISOString()
      })
      .eq('customer_email', customerEmail)
      .eq('document_type', documentType)
      .in('status', ['pending', 'processing', 'awaiting_otp']);

    // Generate unique transaction ID
    const timestamp = Date.now();
    const userRef = userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
    const randomSuffix = Math.random().toString(36).substr(2, 15);
    const transactionId = `tx_${timestamp}_${userRef}_${randomSuffix}`;

    // Format phone number
    let formattedPhone = customerPhone;
    if (formattedPhone.startsWith('+237')) {
      formattedPhone = formattedPhone.replace('+237', '');
    }
    if (formattedPhone.startsWith('237')) {
      formattedPhone = formattedPhone.substring(3);
    }

    // Create unique customer name to avoid duplicates
    const uniqueSuffix = timestamp.toString().substr(-6);
    const uniqueCustomerName = `${customerName} #${uniqueSuffix}`;

    // Call My-CoolPay paylink API
    const paylinkData = {
      transaction_amount: docInfo.price,
      transaction_currency: 'XAF',
      transaction_reason: `${docInfo.description} (${uniqueSuffix})`,
      app_transaction_ref: transactionId,
      customer_phone_number: formattedPhone,
      customer_name: uniqueCustomerName,
      customer_email: customerEmail,
      customer_lang: 'en'
    };

    const paylinkUrl = `${MYCOOLPAY_CONFIG.baseUrl}/${MYCOOLPAY_CONFIG.publicKey}/paylink`;
    const paylinkResponse = await axios.post(paylinkUrl, paylinkData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const paylinkResult = paylinkResponse.data;
    
    if (paylinkResult.status !== 'success') {
      throw new Error(`My-CoolPay API returned non-success status: ${paylinkResult.status}`);
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        document_type: documentType,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        amount: docInfo.price,
        currency: 'XAF',
        payment_method: 'MOBILE_MONEY',
        language: 'en',
        user_id: null,
        status: 'pending',
        payment_reference: transactionId,
        payment_url: paylinkResult.payment_url,
        webhook_data: {
          ...paylinkData,
          original_user_id: userId,
          original_customer_name: customerName,
          mycoolpay_transaction_ref: paylinkResult.transaction_ref,
          our_transaction_id: transactionId,
          unique_suffix: uniqueSuffix
        }
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save transaction' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transaction_id: transactionId,
        payment_url: paylinkResult.payment_url,
        amount: docInfo.price,
        currency: 'XAF',
        mycoolpay_transaction_ref: paylinkResult.transaction_ref
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

async function handlePaymentProcess(body, headers) {
  const { transaction_id, phone_number, payment_method = 'MTN' } = body;

  if (!transaction_id || !phone_number) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  try {
    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_reference', transaction_id)
      .single();

    if (fetchError || !transaction) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction not found' })
      };
    }

    // Format phone
    let formattedPhone = phone_number;
    if (formattedPhone.startsWith('+237')) {
      formattedPhone = formattedPhone.replace('+237', '');
    }

    // Call My-CoolPay payin API
    const paymentData = {
      transaction_amount: transaction.amount,
      transaction_currency: transaction.currency,
      transaction_reason: `Payment for ${transaction.document_type}`,
      app_transaction_ref: transaction_id,
      customer_phone_number: formattedPhone,
      customer_name: transaction.customer_name,
      customer_email: transaction.customer_email,
      customer_lang: 'en'
    };

    const paymentUrl = `${MYCOOLPAY_CONFIG.baseUrl}/${MYCOOLPAY_CONFIG.publicKey}/payin`;
    const paymentResponse = await axios.post(paymentUrl, paymentData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const paymentResult = paymentResponse.data;
    
    if (paymentResult.status === 'success') {
      const action = paymentResult.action;
      
      if (action === 'REQUIRE_OTP') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: 'awaiting_otp',
            message: 'OTP sent to your phone. Please check your SMS and authorize the payment.',
            requires_otp: true
          })
        };
      } else if (action === 'PENDING') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: 'processing',
            message: `Please dial ${paymentResult.ussd} on your phone to complete the payment.`,
            ussd: paymentResult.ussd
          })
        };
      }
    }

    throw new Error(`Payment failed: ${paymentResult.message || 'Unknown error'}`);

  } catch (error) {
    console.error('Payment process error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Payment processing failed: ${error.message}`
      })
    };
  }
}

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