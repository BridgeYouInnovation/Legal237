exports.handler = async (event, context) => {
  try {
    const params = event.queryStringParameters || {};
    console.log('Payment cancelled redirect:', params);

    const deepLink = 'legal237://payment/cancelled';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Cancelled - Legal237</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
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
        .icon {
            font-size: 64px;
            color: #FF9800;
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
        .btn {
            background: #2196F3;
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
            background: #1976D2;
        }
        .btn-secondary {
            background: #666;
        }
        .btn-secondary:hover {
            background: #555;
        }
        .redirect-info {
            background: #FFF3CD;
            border: 1px solid #FF9800;
            color: #E65100;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚠️</div>
        <h1>Payment Cancelled</h1>
        <p class="subtitle">Your payment was cancelled. You can try again anytime.</p>
        
        <div class="redirect-info">
            🔄 Returning to Legal237 app...
        </div>
        
        <a href="${deepLink}" class="btn">Return to Legal237 App</a>
        <a href="https://legal237.com" class="btn btn-secondary">Visit Website</a>
        
        <script>
            setTimeout(() => {
                window.location.href = '${deepLink}';
            }, 2000);
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
    console.error('Payment cancelled redirect error:', error);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Cancelled - Legal237</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
    <h1 style="color: #FF9800;">⚠️ Payment Cancelled</h1>
    <p>Your payment was cancelled. You can try again anytime.</p>
    <a href="legal237://payment/cancelled" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Return to Legal237 App</a>
    <script>
        setTimeout(() => window.location.href = 'legal237://payment/cancelled', 2000);
    </script>
</body>
</html>`
    };
  }
}; 