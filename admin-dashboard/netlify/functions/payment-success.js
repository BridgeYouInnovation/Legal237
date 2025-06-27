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
    
    // App Store fallback URLs
    const appStoreUrl = 'https://apps.apple.com/app/legal237/id123456789'; // Update with real App Store ID
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.legal237.app';

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
            min-width: 140px;
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
        .btn-store {
            background: #FF9800;
            font-size: 14px;
            min-width: 120px;
        }
        .btn-store:hover {
            background: #F57C00;
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
        .fallback-info {
            background: #FFF3CD;
            border: 1px solid #FF9800;
            color: #E65100;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            display: none;
        }
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
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
        
        <div class="redirect-info" id="redirectInfo">
            🔄 Redirecting to Legal237 app automatically...
        </div>
        
        <div class="fallback-info" id="fallbackInfo">
            📱 If the app didn't open automatically, please open Legal237 manually or download it below.
        </div>
        
        <div class="button-group">
            <a href="${deepLink}" class="btn" id="openAppBtn">Open Legal237 App</a>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <a href="${appStoreUrl}" class="btn btn-store" target="_blank">App Store</a>
                <a href="${playStoreUrl}" class="btn btn-store" target="_blank">Play Store</a>
            </div>
            <a href="https://legal237.com" class="btn btn-secondary">Visit Website</a>
        </div>
        
        <script>
            let attemptCount = 0;
            let redirectSuccess = false;
            
            function attemptRedirect() {
                attemptCount++;
                console.log('Attempting redirect', attemptCount);
                
                // For iOS: Try to open the app
                if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                    // iOS approach
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = '${deepLink}';
                    document.body.appendChild(iframe);
                    
                    // Clean up iframe after attempt
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                } else {
                    // Android/other platforms
                    window.location.href = '${deepLink}';
                }
                
                // Check if redirect was successful
                setTimeout(() => {
                    if (document.hidden || document.webkitHidden) {
                        redirectSuccess = true;
                        console.log('App opened successfully');
                    } else {
                        showFallback();
                    }
                }, 2000);
            }
            
            function showFallback() {
                const redirectInfo = document.getElementById('redirectInfo');
                const fallbackInfo = document.getElementById('fallbackInfo');
                
                if (redirectInfo) redirectInfo.style.display = 'none';
                if (fallbackInfo) fallbackInfo.style.display = 'block';
                
                console.log('Showing fallback options');
            }
            
            // Start redirect attempt after page loads
            window.addEventListener('load', () => {
                setTimeout(attemptRedirect, 1500);
            });
            
            // Handle page visibility changes (detect if user switched to app)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden || document.webkitHidden) {
                    redirectSuccess = true;
                }
            });
            
            // Fallback timer
            setTimeout(() => {
                if (!redirectSuccess) {
                    showFallback();
                }
            }, 6000);
            
            // Manual app open button
            document.getElementById('openAppBtn').addEventListener('click', (e) => {
                e.preventDefault();
                attemptRedirect();
            });
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
    <p>Please open the Legal237 app manually to continue.</p>
    <a href="legal237://payment/success" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Try Opening App</a>
    <br><br>
    <a href="https://apps.apple.com/app/legal237/id123456789" style="background: #007AFF; color: white; padding: 8px 16px; text-decoration: none; border-radius: 8px; margin: 5px;">App Store</a>
    <a href="https://play.google.com/store/apps/details?id=com.legal237.app" style="background: #34A853; color: white; padding: 8px 16px; text-decoration: none; border-radius: 8px; margin: 5px;">Play Store</a>
</body>
</html>`
    };
  }
}; 