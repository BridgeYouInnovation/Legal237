import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const useThemeStore = create((set) => ({
  isDarkMode: false,

  toggleTheme: async () => {
    set((state) => {
      const newMode = !state.isDarkMode
      AsyncStorage.setItem("darkMode", JSON.stringify(newMode))
      return { isDarkMode: newMode }
    })
  },

  initializeTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("darkMode")
      if (savedTheme !== null) {
        set({ isDarkMode: JSON.parse(savedTheme) })
      }
    } catch (error) {
      console.error("Error loading theme:", error)
    }
  },
}))
