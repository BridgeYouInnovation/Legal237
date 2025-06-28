const twilio = require('twilio');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      })
    };
  }

  try {
    // Parse request body
    const { phone, message, service } = JSON.parse(event.body);

    // Validate required fields
    if (!phone || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Phone number and message are required' 
        })
      };
    }

    // Validate phone number format (Cameroon numbers)
    const phoneRegex = /^\+237[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid Cameroon phone number format' 
        })
      };
    }

    // Check if Twilio credentials are configured
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Twilio credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'SMS service not configured' 
        })
      };
    }

    console.log(`Sending ${service || 'SMS'} to ${phone}`);

    // Send SMS via Twilio
    const smsResult = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phone
    });

    console.log('SMS sent successfully:', smsResult.sid);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        messageId: smsResult.sid,
        message: 'SMS sent successfully' 
      })
    };

  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Handle specific Twilio errors
    let errorMessage = 'Failed to send SMS';
    if (error.code === 21614) {
      errorMessage = 'Invalid phone number';
    } else if (error.code === 21408) {
      errorMessage = 'Permission denied for this phone number';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}; 