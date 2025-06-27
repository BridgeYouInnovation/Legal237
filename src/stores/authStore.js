import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "../lib/supabase"

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  subscription: null,

  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user 
    })
  },

  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email,
          isPro: false, // This would come from your user profile/subscription table
          dailyQuestions: 0,
          maxDailyQuestions: 2,
        }
        
        set({
          user,
          isAuthenticated: true,
        })
      }
      
      // Load subscription data from AsyncStorage (local cache)
      const subscriptionData = await AsyncStorage.getItem("subscription")
      if (subscriptionData) {
        set({ subscription: JSON.parse(subscriptionData) })
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email,
        isPro: false, // This would come from your user profile/subscription table
        dailyQuestions: 0,
        maxDailyQuestions: 2,
      }

      set({ user, isAuthenticated: true, isLoading: false })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })

      if (error) {
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      // Note: User won't be immediately authenticated due to email confirmation
      set({ isLoading: false })
      return { success: true, message: "Please check your email for verification" }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  loginAnonymously: async () => {
    const user = {
      id: "anonymous",
      email: "anonymous@legal237.com",
      name: "Guest User",
      isPro: false,
      dailyQuestions: 0,
      maxDailyQuestions: 2,
    }

    set({ user, isAuthenticated: true })
    return { success: true }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut()
      await AsyncStorage.removeItem("subscription")
      set({ user: null, isAuthenticated: false, subscription: null })
    } catch (error) {
      console.error("Error signing out:", error)
      // Still clear local state even if signOut fails
      set({ user: null, isAuthenticated: false, subscription: null })
    }
  },

  updateSubscription: async (subscriptionData) => {
    const user = get().user
    if (user) {
      const updatedUser = { ...user, isPro: true }
      await AsyncStorage.setItem("subscription", JSON.stringify(subscriptionData))
      set({ user: updatedUser, subscription: subscriptionData })
    }
  },

  incrementDailyQuestions: () => {
    const user = get().user
    if (user && !user.isPro) {
      const updatedUser = { ...user, dailyQuestions: user.dailyQuestions + 1 }
      set({ user: updatedUser })
      // Could also sync this to Supabase user profile table
    }
  },

  resetDailyQuestions: () => {
    const user = get().user
    if (user) {
      const updatedUser = { ...user, dailyQuestions: 0 }
      set({ user: updatedUser })
      // Could also sync this to Supabase user profile table
    }
  },

  // New function to check if user can ask questions
  canAskQuestion: () => {
    const user = get().user
    if (!user) return false
    return user.isPro || user.dailyQuestions < user.maxDailyQuestions
  },

  // New function to get remaining questions
  getRemainingQuestions: () => {
    const user = get().user
    if (!user) return 0
    if (user.isPro) return "unlimited"
    return Math.max(0, user.maxDailyQuestions - user.dailyQuestions)
  },
}))
