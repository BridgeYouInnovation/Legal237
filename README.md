# Legal237 Admin Dashboard

A React.js web application for managing the Legal237 mobile app content, users, and analytics.

## Features

- **Dashboard Overview**: Real-time statistics and analytics
- **Laws Management**: Add, edit, and delete legal articles in both English and French
- **Lawyers Directory**: Manage lawyer profiles and contact information
- **User Management**: View registered users and their verification status
- **Subscriptions & Payments**: Track payment records and revenue analytics
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to the Supabase database (same as mobile app)

## Installation

1. **Navigate to the admin dashboard directory:**
   ```bash
   cd admin-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Database Schema

The admin dashboard expects the following Supabase tables:

### `legal_articles`
```sql
CREATE TABLE legal_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_number TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_fr TEXT NOT NULL,
  document_type TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `lawyers`
```sql
CREATE TABLE lawyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialization TEXT NOT NULL,
  location TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  bar_number TEXT NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `payment_records`
```sql
CREATE TABLE payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  document_type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'XAF',
  status TEXT NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Authentication

The admin dashboard uses Supabase authentication. Admin users need to be created manually in the Supabase dashboard or via the Supabase CLI.

### Creating an Admin User

1. **Via Supabase Dashboard:**
   - Go to Authentication > Users
   - Click "Invite" or "Add user"
   - Enter admin email and temporary password
   - The user can then sign in to the admin dashboard

2. **Via SQL:**
   ```sql
   -- Insert admin user (replace with actual admin email/password)
   INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
   VALUES (gen_random_uuid(), 'admin@legal237.com', NOW(), NOW(), NOW());
   ```

## Usage

### Dashboard
- View real-time statistics for users, laws, lawyers, and revenue
- Monitor system health and activity

### Laws Management
- **Add Laws**: Click "Add New Law" to create articles in both languages
- **Edit Laws**: Click the edit icon to modify existing articles
- **Delete Laws**: Click the delete icon to remove articles
- **Document Types**: Support for Penal Code and Criminal Procedure
- **Categories**: Organize laws by category for better navigation

### Lawyers Directory
- **Add Lawyers**: Include full profile information
- **Contact Details**: Email and phone information
- **Specializations**: Tag lawyers by their areas of expertise
- **Experience Tracking**: Years of experience and bar number
- **Profile Images**: Optional profile photo URLs

### User Management
- **View Users**: See all registered users from the mobile app
- **Search & Filter**: Find users by email, phone, or ID
- **Verification Status**: Check email/phone verification status
- **Registration Tracking**: View join dates and last sign-in times

### Subscriptions & Payments
- **Payment Records**: View all transaction history
- **Revenue Analytics**: Track total revenue and successful payments
- **Filter Options**: Filter by status, document type, or user
- **Transaction Details**: View payment methods and transaction IDs

## Security

- **Row Level Security**: Ensure RLS is enabled on all tables
- **Service Role**: Uses service role key for admin operations
- **Authentication Required**: All routes require authentication
- **Input Validation**: Form validation for all data entry

## Deployment

### Production Build
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `build` folder to Netlify
3. Set environment variables in Netlify dashboard

### Environment Variables for Production
Make sure to set these in your hosting platform:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_SUPABASE_SERVICE_KEY`

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check environment variables are correctly set
   - Verify Supabase service role key has admin permissions

2. **Database Connection Issues**
   - Confirm Supabase URL and keys are valid
   - Check if RLS policies allow admin access

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run build`

### Support

For issues or questions:
- Check the console for error messages
- Verify database schema matches requirements
- Ensure all environment variables are set correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Legal237 ecosystem. All rights reserved.
