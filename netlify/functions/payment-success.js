exports.handler = async (event, context) => {
  try {
    // Extract payment information from query parameters
    const params = event.queryStringParameters || {};
    const {
      transaction_ref,
      app_transaction_ref,
      status,
      amount,
      currency,
      customer_phone,
      payment_method
    } = params;

    console.log('Payment success redirect:', params);

    // Create mobile app deep link
    const appParams = new URLSearchParams();
    if (app_transaction_ref) appParams.set('transaction_id', app_transaction_ref);
    if (transaction_ref) appParams.set('transaction_ref', transaction_ref);
    if (status) appParams.set('status', status);
    if (amount) appParams.set('amount', amount);

    const deepLink = `legal237://payment/success?${appParams.toString()}`;

    // HTML page that redirects to mobile app
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - Legal237</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        .success-icon {
            font-size: 64px;
            color: #4CAF50;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .details {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .detail-label {
            color: #666;
        }
        .detail-value {
            color: #333;
            font-weight: 500;
        }
        .btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
        }
        .btn:hover {
            background: #45a049;
        }
        .btn-secondary {
            background: #2196F3;
        }
        .btn-secondary:hover {
            background: #1976D2;
        }
        .redirect-info {
            background: #E8F5E8;
            border: 1px solid #4CAF50;
            color: #2E7D32;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Payment Successful!</h1>
        <p class="subtitle">Your payment has been processed successfully</p>
        
        ${amount && currency ? `
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">${parseInt(amount).toLocaleString()} ${currency}</span>
            </div>
            ${payment_method ? `
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${payment_method}</span>
            </div>
            ` : ''}
            ${app_transaction_ref ? `
            <div class="detail-row">
                <span class="detail-label">Transaction:</span>
                <span class="detail-value">${app_transaction_ref.slice(0, 16)}...</span>
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        <div class="redirect-info">
            🔄 Redirecting to Legal237 app automatically...
        </div>
        
        <a href="${deepLink}" class="btn">Open Legal237 App</a>
        <a href="https://legal237.com" class="btn btn-secondary">Visit Website</a>
        
        <script>
            // Automatically attempt to open the app
            setTimeout(() => {
                window.location.href = '${deepLink}';
            }, 2000);
            
            // Fallback: show instruction if app doesn't open
            setTimeout(() => {
                const info = document.querySelector('.redirect-info');
                if (info) {
                    info.innerHTML = '📱 If the app didn\\'t open, tap "Open Legal237 App" above';
                    info.style.background = '#FFF3CD';
                    info.style.borderColor = '#FF9800';
                    info.style.color = '#E65100';
                }
            }, 5000);
        </script>
    </div>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      },
      body: html
    };

  } catch (error) {
    console.error('Payment success redirect error:', error);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Successful - Legal237</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
    <h1 style="color: #4CAF50;">✅ Payment Successful!</h1>
    <p>Your payment has been processed successfully.</p>
    <a href="legal237://payment/success" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Open Legal237 App</a>
    <script>
        setTimeout(() => window.location.href = 'legal237://payment/success', 2000);
    </script>
</body>
</html>`
    };
  }
}; 