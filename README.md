# Legal237 - Mobile Legal Reference App

Legal237 is a comprehensive mobile application that provides access to Cameroonian legal documents and features an AI-powered legal assistant. The app offers bilingual support (English and French) and includes subscription-based premium features.

## Features

### 🔐 Authentication
- Email/password login and registration
- Anonymous guest access for trial users
- Secure user session management

### 📚 Legal Document Access
- Complete Penal Code articles
- Criminal Procedure Code articles
- Advanced search functionality
- Bilingual content (English/French)
- Article bookmarking and offline access

### 🤖 AI Legal Assistant
- Interactive chat interface
- Legal question answering with article citations
- Daily usage limits for free users
- Unlimited access for premium subscribers

### 💳 Subscription System
- Monthly (2,000 XAF) and Yearly (20,000 XAF) plans
- Flutterwave payment integration
- MTN Mobile Money and Orange Money support
- Automatic subscription management

### 🌍 Internationalization
- Full English and French language support
- Dynamic language switching
- Localized content and UI

### 🎨 Modern UI/UX
- Material Design 3 components
- Dark/Light theme support
- Responsive design for all screen sizes
- Accessibility features

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **UI Components**: React Native Paper
- **Internationalization**: react-i18next
- **Storage**: AsyncStorage
- **Icons**: React Native Vector Icons
- **Payment**: Flutterwave SDK

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/legal237-mobile.git
   cd legal237-mobile
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   \`\`\`env
   API_BASE_URL=https://api.legal237.com
   FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
   \`\`\`

4. **Start the development server**
   \`\`\`bash
   npm start
   \`\`\`

5. **Run on device/simulator**
   \`\`\`bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   \`\`\`

## Project Structure

\`\`\`
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── navigation/         # Navigation configuration
├── stores/            # Zustand state stores
├── services/          # API and external services
├── i18n/             # Internationalization files
├── theme/            # Theme configuration
└── utils/            # Utility functions
\`\`\`

## Key Components

### Authentication Flow
- `LoginScreen.js` - User login interface
- `RegisterScreen.js` - User registration interface
- `authStore.js` - Authentication state management

### Main Features
- `HomeScreen.js` - Dashboard with quick access
- `ChatScreen.js` - AI assistant interface
- `LawViewerScreen.js` - Legal document browser
- `SearchResultsScreen.js` - Search results display
- `SubscriptionScreen.js` - Payment and subscription management

### State Management
- `authStore.js` - User authentication and profile
- `themeStore.js` - Theme preferences
- `bookmarkStore.js` - Saved articles management

## API Integration

The app is designed to work with a REST API backend. Key endpoints include:

- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /articles` - Fetch legal articles
- `GET /articles/search` - Search articles
- `POST /chat` - AI assistant interaction
- `POST /payments/initiate` - Payment processing

## Payment Integration

The app integrates with Flutterwave for payment processing:

1. **Supported Methods**:
   - MTN Mobile Money
   - Orange Money

2. **Payment Flow**:
   - User selects subscription plan
   - Redirects to Flutterwave checkout
   - Handles payment verification
   - Updates user subscription status

## Localization

The app supports English and French languages:

- Translation files in `src/i18n/locales/`
- Dynamic language switching
- Localized date/time formatting
- RTL support ready

## Deployment

### Building for Production

1. **Android APK**
   \`\`\`bash
   expo build:android
   \`\`\`

2. **iOS IPA**
   \`\`\`bash
   expo build:ios
   \`\`\`

3. **App Store Deployment**
   \`\`\`bash
   expo upload:android
   expo upload:ios
   \`\`\`

## Configuration

### Environment Variables
- `API_BASE_URL` - Backend API URL
- `FLUTTERWAVE_PUBLIC_KEY` - Payment gateway key

### App Configuration
- Update `app.json` for app metadata
- Configure splash screen and icons
- Set up deep linking for payment callbacks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@legal237.com
- Phone: +237682310407

## Roadmap

### Upcoming Features
- [ ] Offline article caching
- [ ] Push notifications
- [ ] Advanced search filters
- [ ] Legal document annotations
- [ ] User-generated content
- [ ] Social sharing features

### Technical Improvements
- [ ] Performance optimization
- [ ] Enhanced accessibility
- [ ] Automated testing
- [ ] CI/CD pipeline
- [ ] Error tracking integration
