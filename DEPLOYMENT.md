# Legal237 Platform Deployment Guide

This guide covers deploying the Legal237 Platform (admin dashboard + payment API) to production.

## Pre-Deployment Setup

### 1. My-CoolPay Application Configuration

Before deploying, create your My-CoolPay merchant application with these details:

**Application Name:** `The Law 237 - Legal Documents`  
**Homepage URL:** `https://legal237.com`  
**Logo URL:** `https://legal237.com/logo.png`  

**Redirect URLs:**
- Success: `https://legal237.com/payment/success`
- Cancelled: `https://legal237.com/payment/cancelled`  
- Failed: `https://legal237.com/payment/failed`

**Callback URL:** `https://legal237.com/api/webhooks/mycoolpay`  
**Notification Email:** `payments@legal237.com`

### 2. Database Setup

1. **Supabase Configuration:**
   - Create a new Supabase project
   - Run the SQL schema from `database/payment_schema.sql`
   - Get your project URL and service role key

2. **Environment Variables:**
   Copy `.env.example` to `.env` and configure:
   ```env
   NODE_ENV=production
   PORT=5000
   BASE_URL=https://legal237.com
   
   # Supabase
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # My-CoolPay
   MYCOOLPAY_PUBLIC_KEY=your_public_key
   MYCOOLPAY_PRIVATE_KEY=your_private_key
   MYCOOLPAY_MERCHANT_ID=your_merchant_id
   ```

## Deployment Options

### Option 1: Netlify (Recommended for Serverless)

1. **Install Dependencies:**
   ```bash
   cd admin-dashboard
   npm install
   ```

2. **Build the Project:**
   ```bash
   npm run build
   ```

3. **Deploy to Netlify:**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `build`
   - Add environment variables in Netlify dashboard

4. **Configure Serverless Functions:**
   Netlify doesn't support Express.js directly. Use Netlify Functions:
   
   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "build"
   
   [functions]
     directory = "netlify/functions"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api/:splat"
     status = 200
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Option 2: Hostinger VPS/Dedicated Hosting

1. **Server Setup:**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Install Nginx for reverse proxy
   sudo apt install nginx
   ```

2. **Deploy Application:**
   ```bash
   # Clone repository
   git clone your-repo-url /var/www/legal237
   cd /var/www/legal237/admin-dashboard
   
   # Install dependencies
   npm install
   
   # Build React app
   npm run build
   
   # Start server with PM2
   pm2 start server/index.js --name "legal237-api"
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx:**
   Create `/etc/nginx/sites-available/legal237.com`:
   ```nginx
   server {
       listen 80;
       server_name legal237.com www.legal237.com;
       
       # Serve React build files
       location / {
           root /var/www/legal237/admin-dashboard/build;
           try_files $uri $uri/ /index.html;
       }
       
       # Proxy API requests to Node.js
       location /api/ {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable Site and SSL:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/legal237.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   
   # Install SSL with Let's Encrypt
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d legal237.com -d www.legal237.com
   ```

### Option 3: Railway/Heroku (Platform as a Service)

1. **Create `Procfile`:**
   ```
   web: npm run build:full
   ```

2. **Configure Build Scripts:**
   Update `package.json`:
   ```json
   {
     "scripts": {
       "build:full": "npm run build && npm run server",
       "heroku-postbuild": "npm run build"
     }
   }
   ```

3. **Deploy:**
   - Connect repository to Railway/Heroku
   - Add environment variables
   - Deploy automatically from main branch

## Domain Configuration

### DNS Setup for legal237.com

Configure these DNS records with your domain provider:

```
Type    Name    Value                   TTL
A       @       your_server_ip          300
A       www     your_server_ip          300
CNAME   api     legal237.com            300
```

### SSL Certificate

- **Hostinger VPS:** Use Let's Encrypt (shown above)
- **Netlify:** Automatic SSL included
- **Railway/Heroku:** Automatic SSL included

## Mobile App Configuration

Update your React Native app to use the new payment service:

1. **Replace Payment Service:**
   ```javascript
   // Replace in PaymentScreen.js
   import newPaymentService from '../../services/newPaymentService'
   ```

2. **Update Service Calls:**
   ```javascript
   // Instead of:
   // paymentService.initiateMobileMoneyPayment()
   
   // Use:
   const result = await newPaymentService.initiatePayment(
     documentType,
     customer,
     paymentMethod,
     language
   )
   ```

3. **Handle Deep Links:**
   Configure deep linking in your app for payment redirects:
   ```javascript
   // App.js or navigation setup
   const linking = {
     prefixes: ['legal237://'],
     config: {
       screens: {
         PaymentResult: 'payment/:status'
       }
     }
   }
   ```

## Testing

### 1. API Endpoints
Test all endpoints are working:
```bash
# Health check
curl https://legal237.com/api/health

# Service status
curl https://legal237.com/api/payment/service-status

# Document info
curl https://legal237.com/api/payment/documents/penal_code
```

### 2. Payment Flow
1. Test payment initialization from mobile app
2. Verify webhook endpoint receives callbacks
3. Check payment status updates in database
4. Test all redirect URLs work correctly

### 3. My-CoolPay Integration
1. Test with My-CoolPay sandbox environment first
2. Verify webhook signatures are validated correctly
3. Test all payment methods (MTN, Orange Money)

## Monitoring and Maintenance

### Logs
- **Hostinger VPS:** `pm2 logs legal237-api`
- **Netlify:** Function logs in dashboard
- **Railway/Heroku:** Platform logs

### Database Monitoring
- Monitor Supabase dashboard for performance
- Set up alerts for failed transactions
- Regular backup of payment data

### Updates
```bash
# Update deployment
git pull origin main
npm install
npm run build
pm2 restart legal237-api
```

## Security Checklist

- [ ] Environment variables are secure
- [ ] HTTPS is enforced
- [ ] Webhook signatures are validated
- [ ] API rate limiting is configured
- [ ] Database RLS policies are active
- [ ] CORS is properly configured
- [ ] Regular security updates

## Support

For deployment issues:
1. Check server logs
2. Verify environment variables
3. Test API endpoints
4. Contact My-CoolPay support if payment issues
5. Monitor Supabase dashboard for database issues 