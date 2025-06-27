import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Button, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function DisclaimerScreen({ navigation, route }) {
  const theme = useTheme()
  const language = route?.params?.language || 'en'

  const content = {
    en: {
      title: 'Legal237',
      subtitle: 'Legal Reference App',
      disclaimer: 'This app provides legal information for reference purposes only and does not constitute legal advice. Always consult with a qualified legal professional for specific legal matters.',
      button: 'I Understand'
    },
    fr: {
      title: 'Legal237',
      subtitle: 'Application de Référence Juridique',
      disclaimer: 'Cette application fournit des informations juridiques à des fins de référence uniquement et ne constitue pas un conseil juridique. Consultez toujours un professionnel juridique qualifié pour des questions juridiques spécifiques.',
      button: 'Je Comprends'
    }
  }

  const currentContent = content[language]

  const handleContinue = async () => {
    try {
      // Ensure language is stored in AsyncStorage
      await AsyncStorage.setItem('user_language', language)
      
      navigation.navigate('AuthStack', { 
        screen: 'PhoneAuth',
        params: { language }
      })
    } catch (error) {
      console.error('Error saving language:', error)
      navigation.navigate('AuthStack', { 
        screen: 'PhoneAuth',
        params: { language }
      })
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <Icon name="gavel" size={32} color="white" />
          </View>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            {currentContent.title}
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onBackground }]}>
            {currentContent.subtitle}
          </Text>
        </View>

        {/* Disclaimer */}
        <ScrollView style={styles.disclaimerContainer} showsVerticalScrollIndicator={false}>
          <Text variant="bodyLarge" style={[styles.disclaimerText, { color: theme.colors.onBackground }]}>
            {currentContent.disclaimer}
          </Text>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleContinue}
            style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {currentContent.button}
          </Button>
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
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  disclaimerContainer: {
    flex: 1,
    marginBottom: 40,
  },
  disclaimerText: {
    lineHeight: 28,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  continueButton: {
    borderRadius: 12,
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
}) 