import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"

import en from "./locales/en.json"
import fr from "./locales/fr.json"

// Function to get user's language preference
const getUserLanguage = async () => {
  try {
    const userLanguage = await AsyncStorage.getItem('user_language')
    return userLanguage || 'en'
  } catch (error) {
    console.error('Error getting user language:', error)
    return 'en'
  }
}

// Initialize i18n
const initializeI18n = async () => {
  const userLanguage = await getUserLanguage()
  
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: userLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  })
}

// Function to change language and persist preference
export const changeLanguage = async (language) => {
  try {
    await AsyncStorage.setItem('user_language', language)
    await i18n.changeLanguage(language)
  } catch (error) {
    console.error('Error changing language:', error)
  }
}

// Initialize the i18n system
initializeI18n()

export default i18n
