const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { type, data } = JSON.parse(event.body);

    // Validate required fields
    if (!type || !data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: type and data' }),
      };
    }

    // Create transporter with error handling
    let transporter;
    try {
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'payment.legal237@gmail.com',
          pass: 'olcz dfwm qqfh ygfh'
        },
        secure: true,
        port: 465,
      });

      // Verify connection configuration
      await transporter.verify();
    } catch (error) {
      console.error('Transporter configuration error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Email service configuration error' }),
      };
    }

    let mailOptions;

    switch (type) {
      case 'contact':
        if (!data.name || !data.email || !data.subject || !data.message) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required contact form fields' }),
          };
        }

        mailOptions = {
          from: 'payment.legal237@gmail.com',
          to: 'payment.legal237@gmail.com',
          subject: `Contact Form Submission: ${data.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            <hr>
            <p><em>Sent from Legal237 Contact Form at ${new Date().toLocaleString()}</em></p>
          `
        };
        break;

      case 'lawyer-application':
        if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.barNumber) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required lawyer application fields' }),
          };
        }

        mailOptions = {
          from: 'payment.legal237@gmail.com',
          to: 'payment.legal237@gmail.com',
          subject: `New Lawyer Application: ${data.firstName} ${data.lastName}`,
          html: `
            <h2>New Lawyer Application</h2>
            
            <h3>Personal Information</h3>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.firstName} ${data.lastName}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.phone}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>City:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.city}</td></tr>
            </table>
            
            <h3>Professional Information</h3>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Bar Association Number:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.barNumber}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Law Firm:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.firmName || 'Not specified'}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Specialization:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.specialization}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Years of Experience:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.experience}</td></tr>
            </table>
            
            <h3>Terms & Conditions</h3>
            <p><strong>Accepted Terms:</strong> ${data.acceptTerms ? '✅ Yes' : '❌ No'}</p>
            
            <hr>
            <p><em>Sent from Legal237 Lawyer Application Form at ${new Date().toLocaleString()}</em></p>
          `
        };
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid form type. Must be "contact" or "lawyer-application"' }),
        };
    }

    // Send email with timeout
    try {
      const info = await Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), 30000)
        )
      ]);

      console.log('Email sent successfully:', info.messageId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          messageId: info.messageId
        }),
      };

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to send email', 
          details: emailError.message 
        }),
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
    };
  }
}; 