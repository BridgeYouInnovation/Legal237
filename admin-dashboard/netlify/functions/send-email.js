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

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'payment.legal237@gmail.com',
        pass: 'olcz dfwm qqfh ygfh'
      }
    });

    let mailOptions;

    switch (type) {
      case 'contact':
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
            <p>${data.message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><em>Sent from Legal237 Contact Form</em></p>
          `
        };
        break;

      case 'lawyer-application':
        mailOptions = {
          from: 'payment.legal237@gmail.com',
          to: 'payment.legal237@gmail.com',
          subject: `New Lawyer Application: ${data.firstName} ${data.lastName}`,
          html: `
            <h2>New Lawyer Application</h2>
            <h3>Personal Information</h3>
            <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>City:</strong> ${data.city}</p>
            
            <h3>Professional Information</h3>
            <p><strong>Bar Association Number:</strong> ${data.barNumber}</p>
            <p><strong>Law Firm:</strong> ${data.firmName || 'Not specified'}</p>
            <p><strong>Specialization:</strong> ${data.specialization}</p>
            <p><strong>Years of Experience:</strong> ${data.experience}</p>
            
            <h3>Terms</h3>
            <p><strong>Accepted Terms:</strong> ${data.acceptTerms ? 'Yes' : 'No'}</p>
            
            <hr>
            <p><em>Sent from Legal237 Lawyer Application Form</em></p>
          `
        };
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid form type' }),
        };
    }

    // Send email
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Email sent successfully' }),
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to send email', details: error.message }),
    };
  }
}; 