import React, { useState, useRef, useEffect } from 'react'
import { View, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { Text, TextInput, Button, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../../stores/authStore'
import smsService from '../../services/smsService'

export default function PhoneAuthScreen({ navigation, route }) {
  const [phoneNumber, setPhoneNumber] = useState('+237 ')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [language, setLanguage] = useState('en')
  const [isVerifying, setIsVerifying] = useState(false)
  const theme = useTheme()
  const codeInputRef = useRef(null)
  const { setUser } = useAuthStore()

  // Initialize language from route params or AsyncStorage
  useEffect(() => {
    const initializeLanguage = async () => {
      const routeLanguage = route?.params?.language
      
      if (routeLanguage) {
        setLanguage(routeLanguage)
      } else {
        try {
          const storedLanguage = await AsyncStorage.getItem('user_language')
          if (storedLanguage) {
            setLanguage(storedLanguage)
          }
        } catch (error) {
          console.error('Error loading language:', error)
        }
      }
    }
    
    initializeLanguage()
  }, [route?.params?.language])

  const content = {
    en: {
      title: 'Phone Verification',
      phoneLabel: 'Cameroon Phone Number',
      phoneHint: '6XX XXX XXX',
      codeLabel: 'Verification Code',
      codeHint: 'Enter 6-digit code',
      sendCodeButton: 'Send Code',
      verifyButton: 'Verify',
      resendCode: 'Resend Code',
      guestButton: 'Continue as Guest',
      skipVerification: 'Skip Verification (Dev)',
      codeSentMessage: 'Verification code sent to',
      invalidPhone: 'Please enter a valid Cameroon phone number (9 digits)',
      invalidCode: 'Please enter the verification code',
      verificationSuccess: 'Phone verified successfully!',
      verificationFailed: 'Verification failed. Please try again.',
      resendSuccess: 'New code sent successfully',
      smsError: 'Failed to send SMS. Please try again.'
    },
    fr: {
      title: 'Vérification Téléphone',
      phoneLabel: 'Numéro de Téléphone Cameroun',
      phoneHint: '6XX XXX XXX',
      codeLabel: 'Code de Vérification',
      codeHint: 'Entrez le code à 6 chiffres',
      sendCodeButton: 'Envoyer le Code',
      verifyButton: 'Vérifier',
      resendCode: 'Renvoyer le Code',
      guestButton: 'Continuer comme Invité',
      skipVerification: 'Ignorer Vérification (Dev)',
      codeSentMessage: 'Code de vérification envoyé à',
      invalidPhone: 'Veuillez entrer un numéro de téléphone camerounais valide (9 chiffres)',
      invalidCode: 'Veuillez entrer le code de vérification',
      verificationSuccess: 'Téléphone vérifié avec succès!',
      verificationFailed: 'Échec de la vérification. Veuillez réessayer.',
      resendSuccess: 'Nouveau code envoyé avec succès',
      smsError: 'Échec de l\'envoi du SMS. Veuillez réessayer.'
    }
  }

  const currentContent = content[language]

  const formatPhoneNumber = (number) => {
    // Always start with +237
    if (number.length < 4 || !number.includes('237')) {
      return '+237 '
    }
    
    // Extract only the digits after +237
    const digitsOnly = number.replace(/[^\d]/g, '').replace(/^237/, '')
    
    // Limit to 9 digits maximum
    const limitedDigits = digitsOnly.substring(0, 9)
    
    // Build the formatted number
    let result = '+237 '
    
    if (limitedDigits.length > 0) {
      // Add first 3 digits
      result += limitedDigits.substring(0, Math.min(3, limitedDigits.length))
      
      // Add space and next 3 digits if we have more than 3
      if (limitedDigits.length > 3) {
        result += ' ' + limitedDigits.substring(3, Math.min(6, limitedDigits.length))
      }
      
      // Add space and last 3 digits if we have more than 6
      if (limitedDigits.length > 6) {
        result += ' ' + limitedDigits.substring(6, 9)
      }
    }
    
    return result
  }

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '')
    // Check if it's a valid Cameroon number: +237 + 9 digits starting with 6
    return cleaned.length === 12 && cleaned.startsWith('2376')
  }

  const handleSendCode = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', currentContent.invalidPhone)
      return
    }

    setLoading(true)
    Keyboard.dismiss()

    try {
      // Format phone number for international format
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      const formattedPhone = `+${cleanPhone}`

      console.log('Sending SMS to:', formattedPhone)

      // Use custom SMS service with custom message
      const result = await smsService.sendVerificationSMS(formattedPhone, language)

      if (!result.success) {
        console.error('SMS sending error:', result.error)
        Alert.alert('Error', result.error || currentContent.smsError)
      } else {
        console.log('SMS sent successfully')
        setCodeSent(true)
        setCountdown(60)
        Alert.alert('Success', `${currentContent.codeSentMessage} ${phoneNumber}`)
        
        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        // Focus on code input
        setTimeout(() => {
          codeInputRef.current?.focus()
        }, 500)
      }
    } catch (error) {
      console.error('SMS sending error:', error)
      Alert.alert('Error', currentContent.smsError)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', currentContent.invalidCode)
      return
    }

    if (isVerifying) return // Prevent multiple simultaneous verifications

    setLoading(true)
    setIsVerifying(true)

    try {
      // Format phone number for verification
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      const formattedPhone = `+${cleanPhone}`

      console.log('Verifying SMS code for:', formattedPhone)

      // Use custom SMS service to verify code
      const verificationResult = await smsService.verifyCode(formattedPhone, verificationCode)

      if (!verificationResult.success) {
        console.error('Verification error:', verificationResult.error)
        Alert.alert('Error', verificationResult.error || currentContent.verificationFailed)
        setIsVerifying(false)
      } else {
        console.log('Verification successful')
        
        // Create user session
        const sessionResult = await smsService.createUserSession(formattedPhone)
        
        if (sessionResult.success) {
          // Update auth store immediately
          setUser({
            id: sessionResult.user.id,
            email: sessionResult.user.email,
            phone: sessionResult.user.phone,
            name: sessionResult.user.name,
          })
          
          // Mark onboarding as completed
          await AsyncStorage.setItem('hasSeenOnboarding', 'true')
          
          // Show success message and navigate immediately
          Alert.alert(
            'Success', 
            currentContent.verificationSuccess,
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsVerifying(false)
                  setLoading(false)
                  
                  // Navigate with reset to prevent going back
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainNavigator' }],
                  })
                }
              }
            ],
            { cancelable: false }
          )
        } else {
          Alert.alert('Error', 'Failed to create user session')
          setIsVerifying(false)
        }
        
        return // Don't execute finally block
      }
    } catch (error) {
      console.error('Verification error:', error)
      Alert.alert('Error', currentContent.verificationFailed)
      setIsVerifying(false)
    } finally {
      if (!isVerifying) {
        setLoading(false)
      }
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0) return
    await handleSendCode()
    Alert.alert('Success', currentContent.resendSuccess)
  }

  const handleContinueAsGuest = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasSeenOnboarding', 'true')
      
      // Navigate with reset to prevent going back
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainNavigator' }],
      })
    } catch (error) {
      console.error('Error saving onboarding status:', error)
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainNavigator' }],
      })
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
              <Icon name="phone" size={32} color="white" />
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              {currentContent.title}
            </Text>
          </View>

          {/* Phone Input */}
          {!codeSent ? (
            <View style={styles.inputContainer}>
              <TextInput
                label={currentContent.phoneLabel}
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                onBlur={Keyboard.dismiss}
                mode="outlined"
                keyboardType="phone-pad"
                placeholder={currentContent.phoneHint}
                style={styles.input}
                maxLength={17}
                left={<TextInput.Icon icon="phone" />}
              />
              
              <Button
                mode="contained"
                onPress={handleSendCode}
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {currentContent.sendCodeButton}
              </Button>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text variant="bodyMedium" style={[styles.codeMessage, { color: theme.colors.onBackground }]}>
                {currentContent.codeSentMessage} {phoneNumber}
              </Text>
              
              <TextInput
                ref={codeInputRef}
                label={currentContent.codeLabel}
                value={verificationCode}
                onChangeText={setVerificationCode}
                mode="outlined"
                keyboardType="number-pad"
                placeholder={currentContent.codeHint}
                style={styles.input}
                maxLength={6}
                left={<TextInput.Icon icon="lock" />}
              />
              
              <Button
                mode="contained"
                onPress={handleVerifyCode}
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {currentContent.verifyButton}
              </Button>

              <Button
                mode="text"
                onPress={handleResendCode}
                disabled={countdown > 0}
                style={styles.resendButton}
                labelStyle={[styles.resendText, { color: countdown > 0 ? theme.colors.outline : theme.colors.primary }]}
              >
                {countdown > 0 ? `${currentContent.resendCode} (${countdown}s)` : currentContent.resendCode}
              </Button>
            </View>
          )}

          {/* Guest Option */}
          <View style={styles.guestContainer}>
            <Button
              mode="outlined"
              onPress={handleContinueAsGuest}
              style={[styles.guestButton, { borderColor: theme.colors.outline }]}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.guestButtonText, { color: theme.colors.onBackground }]}
            >
              {currentContent.guestButton}
            </Button>
            
            {/* Development Skip Button (only show in development) */}
            {__DEV__ && (
              <Button
                mode="text"
                onPress={async () => {
                  // Skip verification and login directly
                  const cleanPhone = phoneNumber.replace(/\D/g, '')
                  const formattedPhone = `+${cleanPhone}`
                  
                  if (validatePhoneNumber(phoneNumber)) {
                    const sessionResult = await smsService.createUserSession(formattedPhone)
                    
                    if (sessionResult.success) {
                      setUser({
                        id: sessionResult.user.id,
                        email: sessionResult.user.email,
                        phone: sessionResult.user.phone,
                        name: sessionResult.user.name,
                      })
                      
                      await AsyncStorage.setItem('hasSeenOnboarding', 'true')
                      
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainNavigator' }],
                      })
                    }
                  } else {
                    Alert.alert('Error', 'Please enter a valid phone number first')
                  }
                }}
                style={[styles.guestButton, { marginTop: 10 }]}
                labelStyle={[styles.guestButtonText, { color: theme.colors.error }]}
              >
                {currentContent.skipVerification}
              </Button>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
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
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 40,
  },
  input: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  codeMessage: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  button: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
  },
  guestContainer: {
    marginTop: 20,
  },
  guestButton: {
    borderRadius: 12,
  },
  guestButtonText: {
    fontWeight: '500',
  },
}) 