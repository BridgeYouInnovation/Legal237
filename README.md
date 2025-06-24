# Legal237 Platform - Admin Dashboard & Payment API

A complete full-stack platform for managing legal document sales with integrated mobile money payments via My-CoolPay.

## 🏗️ Architecture

```
Legal237 Platform
├── 🌐 Frontend: React Admin Dashboard (TypeScript)
├── ⚙️ Backend: Express.js API Server  
├── 💳 Payment: My-CoolPay Integration (MTN & Orange Money)
├── 🗄️ Database: Supabase (PostgreSQL)
└── 📱 Mobile: React Native Integration
```

## 🚀 Features

### Admin Dashboard
- 📊 Real-time payment analytics and reporting
- 👥 User management and subscription tracking
- 📋 Transaction monitoring and status updates
- 🔐 Secure authentication with role-based access
- 📄 Legal document access management

### Payment API
- 💰 My-CoolPay integration for MTN Mobile Money & Orange Money
- 🔄 Automated webhook handling for payment status updates
- 🔐 Secure payment verification with signature validation
- 📱 Mobile app API endpoints with deep linking support
- 🎯 Document access control based on successful payments

### Mobile Integration
- 📲 Seamless payment flow from React Native app
- 🔗 Deep linking for payment redirects
- ⚡ Real-time payment status polling
- 📱 Native mobile money interfaces

## 🛠️ Technology Stack

**Frontend:**
- React 19 with TypeScript
- Material-UI (MUI) for components
- React Router for navigation
- Recharts for analytics

**Backend:**
- Node.js with Express.js
- Supabase for database operations
- My-CoolPay SDK integration
- JWT authentication

**Database:**
- PostgreSQL via Supabase
- Row-level security (RLS)
- Real-time subscriptions
- Automated backups

**Payment Processing:**
- My-CoolPay Merchant API
- MTN Mobile Money
- Orange Money
- Webhook validation
- Transaction tracking

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- My-CoolPay merchant account
- Domain name (for production)

## 🔧 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BridgeYouInnovation/Legal237.git
   cd Legal237/admin-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Database setup:**
   - Create a Supabase project
   - Run the SQL schema from `database/payment_schema.sql`

5. **Start development server:**
   ```bash
   # Frontend only
   npm start
   
   # Full-stack (frontend + backend)
   npm run dev
   ```

## 🔑 Environment Variables

```env
# App Configuration
NODE_ENV=production
PORT=5000
BASE_URL=https://legal237.com

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# My-CoolPay Configuration
MYCOOLPAY_PUBLIC_KEY=your_mycoolpay_public_key
MYCOOLPAY_PRIVATE_KEY=your_mycoolpay_private_key
MYCOOLPAY_MERCHANT_ID=your_mycoolpay_merchant_id
```

## 🌐 API Endpoints

### Payment API
```bash
POST   /api/payment/init                    # Initialize payment
GET    /api/payment/status/:transactionId   # Check payment status
GET    /api/payment/documents/:documentType # Get document info
GET    /api/payment/service-status          # Check service status
GET    /api/payment/history/:userId         # Get payment history
GET    /api/payment/access/:userId/:docType # Check document access
```

### Webhooks
```bash
POST   /api/webhooks/mycoolpay             # My-CoolPay payment webhooks
POST   /api/webhooks/test                  # Test webhook endpoint
GET    /api/webhooks/logs/:transactionId   # Get webhook logs
```

### Health & Monitoring
```bash
GET    /api/health                         # API health check
```

## 💳 My-CoolPay Integration

### Application Configuration
When setting up your My-CoolPay merchant application, use these settings:

```
Application Name: The Law 237 - Legal Documents
Homepage URL: https://legal237.com
Success URL: https://legal237.com/payment/success
Cancelled URL: https://legal237.com/payment/cancelled
Failed URL: https://legal237.com/payment/failed
Callback URL: https://legal237.com/api/webhooks/mycoolpay
```

### Supported Payment Methods
- 📱 MTN Mobile Money
- 🍊 Orange Money
- 💳 More methods coming soon

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:

- 🌐 Netlify deployment (recommended)
- 🖥️ VPS/dedicated server setup
- ☁️ Platform-as-a-Service options
- 🔒 SSL configuration
- 📡 Domain setup

## 📱 Mobile App Integration

The React Native mobile app connects to this backend via API calls:

```javascript
// Example usage in mobile app
import newPaymentService from './services/newPaymentService';

const result = await newPaymentService.initiatePayment(
  'penal_code',
  { fullname: 'John Doe', email: 'john@example.com', phone: '677123456' },
  'MTN',
  'en'
);
```

## 🗄️ Database Schema

The platform uses the following main tables:

- `payment_transactions` - Payment records and status
- `document_access` - User document access permissions
- Custom views for analytics and reporting

## 🔐 Security

- 🛡️ Row-level security on all database tables
- 🔑 JWT-based authentication
- ✅ Webhook signature validation
- 🔒 HTTPS enforcement
- 🚫 CORS protection
- 🔐 Environment variable protection

## 📊 Analytics & Monitoring

- 📈 Real-time payment analytics
- 📉 Revenue tracking by payment method
- 🔍 Transaction monitoring and alerting
- 📋 User activity logs
- 🚨 Error tracking and reporting

## 🧪 Testing

```bash
# Run tests
npm test

# Test API endpoints
curl https://legal237.com/api/health

# Test payment flow
npm run test:payments
```

## 📞 Support

For technical support and questions:
- 📧 Email: support@legal237.com
- 🐛 Issues: [GitHub Issues](https://github.com/BridgeYouInnovation/Legal237/issues)
- 📖 Documentation: [Wiki](https://github.com/BridgeYouInnovation/Legal237/wiki)

## 📄 License

This project is proprietary software owned by BridgeYou Innovation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Legal237** - Simplifying legal document access in Cameroon 🇨🇲
