import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Button, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function LanguageSelectionScreen({ navigation }) {
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const theme = useTheme()

  const languages = [
    {
      code: 'en',
      name: 'English',
      flag: '🇬🇧',
    },
    {
      code: 'fr',
      name: 'Français',
      flag: '🇫🇷',
    },
  ]

  const handleLanguageSelect = async (languageCode) => {
    try {
      // Save language preference
      await AsyncStorage.setItem('user_language', languageCode)
      
      // DO NOT mark onboarding as completed here - only after the full flow
      // Navigate to disclaimer
      navigation.navigate('Disclaimer', { language: languageCode })
    } catch (error) {
      console.error('Error saving language:', error)
      // Continue anyway
      navigation.navigate('Disclaimer', { language: languageCode })
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.languageContainer}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline
                }
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{language.flag}</Text>
              <Text 
                variant="titleLarge" 
                style={[styles.languageName, { color: theme.colors.onSurface }]}
              >
                {language.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  languageContainer: {
    gap: 20,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    gap: 16,
  },
  flag: {
    fontSize: 32,
  },
  languageName: {
    fontWeight: '600',
  },
}) 