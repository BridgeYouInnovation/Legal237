import React, { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { Provider as PaperProvider } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { Linking } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Import Supabase
import { supabase } from "./src/lib/supabase"

// Import navigation and stores
import { useAuthStore } from "./src/stores/authStore"
import { useThemeStore } from "./src/stores/themeStore"
import MainNavigator from "./src/navigation/MainNavigator"
import { lightTheme, darkTheme } from "./src/theme/theme"
import legalDataService from "./src/services/legalDataService"
import searchService from "./src/services/searchService"
import aiChatService from "./src/services/aiChatService"
import paymentService from "./src/services/paymentService"

// Import onboarding and auth screens
import LanguageSelectionScreen from "./src/screens/onboarding/LanguageSelectionScreen"
import DisclaimerScreen from "./src/screens/onboarding/DisclaimerScreen"
import PhoneAuthScreen from "./src/screens/auth/PhoneAuthScreen"

import "./src/i18n/i18n"
import i18n from "./src/i18n/i18n"

// Import debug helpers (dev only)
import "./src/services/debugHelper"

const Stack = createStackNavigator()

SplashScreen.preventAutoHideAsync()

// Deep linking configuration
const linking = {
  prefixes: ["legal237://"],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              HomeMain: "",
              Payment: "payment",
              PaymentSuccess: "payment/success",
            }
          }
        }
      }
    }
  }
}

export default function App() {
  const { setUser } = useAuthStore()
  const { isDarkMode } = useThemeStore()
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [user, setUserState] = useState(null)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  // Handle user state changes
  const handleAuthStateChange = async (event, session) => {
    console.log('Auth state change:', event, !!session?.user)
    
    try {
      setUserState(session?.user ?? null)
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          name: session.user.user_metadata?.full_name || session.user.phone || session.user.email,
        })
        
        // Check if onboarding was completed when user authenticates
        try {
          const status = await AsyncStorage.getItem('hasSeenOnboarding')
          if (status === 'true') {
            setHasSeenOnboarding(true)
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
        }

        // Sync payments from database when user signs in
        try {
          await paymentService.syncPaymentsFromDatabase()
          console.log('Payment sync completed for user')
        } catch (error) {
          console.error('Error syncing payments:', error)
        }
      } else {
        setUser(null)
        
        // Clear any invalid session data on sign out
        if (event === 'SIGNED_OUT') {
          try {
            await supabase.auth.signOut()
          } catch (error) {
            // Ignore signOut errors during cleanup
            console.log('Session cleanup completed')
          }
        }
      }
    } catch (error) {
      console.error('Error in auth state change handler:', error)
      // On any auth error, ensure we're in a clean state
      setUserState(null)
      setUser(null)
    }
    
    if (initializing) {
      setInitializing(false)
    }
  }

  useEffect(() => {
    // Initialize language from stored preference
    const initializeLanguage = async () => {
      try {
        const userLanguage = await AsyncStorage.getItem('user_language')
        if (userLanguage && (userLanguage === 'en' || userLanguage === 'fr')) {
          await i18n.changeLanguage(userLanguage)
          console.log('Language initialized to:', userLanguage)
        }
      } catch (error) {
        console.error('Error initializing language:', error)
      }
    }

    // Check if user has seen onboarding
    const checkOnboardingStatus = async () => {
      try {
        const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding')
        const newHasSeenOnboarding = onboardingStatus === 'true'
        
        // Only update and log if status has changed
        if (newHasSeenOnboarding !== hasSeenOnboarding) {
          setHasSeenOnboarding(newHasSeenOnboarding)
          console.log('Onboarding status changed to:', onboardingStatus)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setHasSeenOnboarding(false)
      }
    }

    // Initialize auth and clear any invalid sessions
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.log('Session error, clearing auth state:', error.message)
          // Clear invalid session
          await supabase.auth.signOut()
        } else if (session) {
          console.log('Valid session found')
        } else {
          console.log('No existing session')
        }
      } catch (error) {
        console.log('Auth initialization error, starting fresh:', error.message)
        // Start with clean state on any error
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          // Ignore cleanup errors
        }
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Load fonts and data
    const loadAssets = async () => {
      try {
        // Skip font loading for now - use system fonts
        console.log("Using system fonts")
        setFontsLoaded(true)
      } catch (error) {
        console.warn("Error loading fonts:", error)
        setFontsLoaded(true)
      }
    }

    const initializeLegalData = async () => {
      try {
        await legalDataService.initialize()
        console.log("Legal data loaded successfully:", legalDataService.getStatistics())
        
        // Initialize search service
        await searchService.initialize()
        console.log("Search service initialized successfully")
        
        // Initialize AI chat service
        await aiChatService.initialize()
        console.log("AI Chat service initialized successfully")
        
        setDataLoaded(true)
      } catch (error) {
        console.error("Error loading legal data:", error)
        setDataLoaded(true) // Continue even if data loading fails
      }
    }

    initializeLanguage()
    checkOnboardingStatus()
    initializeAuth()
    loadAssets()
    initializeLegalData()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (fontsLoaded && dataLoaded && !initializing) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, dataLoaded, initializing])

  if (!fontsLoaded || !dataLoaded || initializing) {
    return null
  }

  const theme = isDarkMode ? darkTheme : lightTheme

  const OnboardingNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
      <Stack.Screen name="AuthStack" component={AuthNavigator} />
      <Stack.Screen name="MainNavigator" component={MainNavigator} />
    </Stack.Navigator>
  )

  const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="PhoneAuth" 
        component={PhoneAuthScreen}
        initialParams={{ language: 'en' }}
      />
      <Stack.Screen name="MainNavigator" component={MainNavigator} />
    </Stack.Navigator>
  )

  const AppNavigator = () => {
    console.log('Navigation decision - hasSeenOnboarding:', hasSeenOnboarding, 'user:', !!user)
    
    if (!hasSeenOnboarding) {
      return <OnboardingNavigator />
    } else if (user) {
      return <MainNavigator />
    } else {
      return <AuthNavigator />
    }
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme} linking={linking}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  )
}
