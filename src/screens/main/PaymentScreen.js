"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Animated, Dimensions } from "react-native"
import { 
  Text, 
  Card, 
  Button, 
  TextInput, 
  useTheme, 
  RadioButton, 
  ActivityIndicator,
  Chip,
  Surface,
  ProgressBar
} from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from 'expo-linear-gradient'
import Icon from "react-native-vector-icons/MaterialIcons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import newPaymentService from "../../services/newPaymentService"
import directPaymentService from "../../services/directPaymentService"

const { width } = Dimensions.get('window')

export default function PaymentScreen({ navigation, route }) {
  const { documentType } = route.params
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [paymentStep, setPaymentStep] = useState(1) // 1: Info, 2: Processing, 3: Complete
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phoneNumber: '',
    network: 'MTN'
  })
  const [errors, setErrors] = useState({})
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))
  
  const theme = useTheme()

  useEffect(() => {
    loadLanguage()
    loadUserData()
    animateEntry()
  }, [])

  const animateEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const loadLanguage = async () => {
    try {
      const userLanguage = await AsyncStorage.getItem('user_language')
      setCurrentLanguage(userLanguage || 'en')
    } catch (error) {
      console.error('Error loading language:', error)
    }
  }

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data')
      if (userData) {
        const user = JSON.parse(userData)
        setFormData(prev => ({
          ...prev,
          fullname: user.fullname || '',
          email: user.email || ''
        }))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        title: 'Paiement Sécurisé',
        subtitle: 'Accédez instantanément à votre document légal',
        documentInfo: 'Document Sélectionné',
        paymentInfo: 'Informations de Paiement',
        fullname: 'Nom Complet',
        email: 'Adresse Email',
        phoneNumber: 'Numéro de Téléphone',
        network: 'Opérateur Mobile Money',
        price: 'Prix Total',
        payNow: 'Procéder au Paiement',
        processing: 'Traitement en cours...',
        validating: 'Validation du paiement...',
        success: 'Paiement Réussi!',
        error: 'Erreur de Paiement',
        required: 'Champ requis',
        invalidEmail: 'Email invalide',
        invalidPhone: 'Numéro invalide (9 chiffres requis)',
        paymentInstructions: 'Instructions de Paiement',
        authorizePayment: 'Autorisez le paiement sur votre téléphone',
        waitingForPayment: 'En attente de l\'autorisation...',
        paymentDescription: 'Paiement 100% sécurisé via My-CoolPay',
        back: 'Retour',
        paymentSteps: {
          info: 'Informations',
          processing: 'Traitement',
          complete: 'Terminé'
        }
      }
    } else {
      return {
        title: 'Secure Payment',
        subtitle: 'Get instant access to your legal document',
        documentInfo: 'Selected Document',
        paymentInfo: 'Payment Information',
        fullname: 'Full Name',
        email: 'Email Address',
        phoneNumber: 'Phone Number',
        network: 'Mobile Money Provider',
        price: 'Total Price',
        payNow: 'Proceed to Payment',
        processing: 'Processing...',
        validating: 'Validating payment...',
        success: 'Payment Successful!',
        error: 'Payment Error',
        required: 'Required field',
        invalidEmail: 'Invalid email',
        invalidPhone: 'Invalid phone number (9 digits required)',
        paymentInstructions: 'Payment Instructions',
        authorizePayment: 'Authorize the payment on your phone',
        waitingForPayment: 'Waiting for authorization...',
        paymentDescription: '100% secure payment via My-CoolPay',
        back: 'Back',
        paymentSteps: {
          info: 'Information',
          processing: 'Processing',
          complete: 'Complete'
        }
      }
    }
  }

  const content = getLocalizedContent()
  const [documentInfo, setDocumentInfo] = useState(null)

  useEffect(() => {
    const loadDocumentInfo = async () => {
      try {
        const info = directPaymentService.getDocumentInfo(documentType)
        setDocumentInfo(info)
      } catch (error) {
        console.error('Error loading document info:', error)
      }
    }
    loadDocumentInfo()
  }, [documentType, currentLanguage])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullname.trim()) {
      newErrors.fullname = content.required
    }
    
    if (!formData.email.trim()) {
      newErrors.email = content.required
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = content.invalidEmail
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = content.required
    } else if (!/^\d{9}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = content.invalidPhone
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateProgress = (step) => {
    const progressValue = step / 3
    setProgress(progressValue)
    setPaymentStep(step)
  }

  const handlePayment = async () => {
    if (!validateForm()) return

    setLoading(true)
    updateProgress(2)
    
    try {
      // Save user data
      await AsyncStorage.setItem('user_data', JSON.stringify({
        fullname: formData.fullname,
        email: formData.email
      }))

      // Get user ID
      let userId = formData.email
      try {
        const userData = await AsyncStorage.getItem('user_data')
        if (userData) {
          const user = JSON.parse(userData)
          userId = user.id || user.userId || formData.email
        }
      } catch (error) {
        console.log('Using email as user ID')
      }

      // Test connectivity first
      console.log('Testing connectivity...')
      const connectivityTest = await directPaymentService.testConnectivity()
      console.log('Connectivity test result:', connectivityTest)
      
      if (!connectivityTest.success) {
        throw new Error(`Network connectivity issue: ${connectivityTest.error}`)
      }

      // Initialize payment using direct service (temporary solution)
      console.log('Initiating payment with direct service...')
      const result = await directPaymentService.initiatePayment(
        documentType,
        {
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phoneNumber
        },
        userId
      )

      if (result.success) {
        console.log('Payment initialized successfully:', result)
        
        // Handle payment result based on action
        if (result.action === 'REQUIRE_OTP') {
          // OTP was sent to user's phone
          Alert.alert(
            'OTP Required',
            'An OTP has been sent to your phone. Please check your SMS and follow the instructions to complete the payment.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Start polling for completion
                  pollPaymentStatus(result.transaction_id)
                }
              }
            ]
          )
        } else if (result.action === 'PENDING' && result.ussd) {
          // USSD code was provided
          Alert.alert(
            'USSD Payment',
            `Please dial ${result.ussd} on your phone to complete the payment.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Start polling for completion
                  pollPaymentStatus(result.transaction_id)
                }
              }
            ]
          )
        } else {
          // Standard processing flow
          pollPaymentStatus(result.transaction_id)
        }
      } else {
        throw new Error(result.error || 'Payment initialization failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      Alert.alert(content.error, error.message || 'Payment failed. Please try again.')
      setLoading(false)
      updateProgress(1)
    }
  }

  const processInAppPayment = async (transactionId, phoneNumber) => {
    try {
      console.log(`Processing payment for transaction: ${transactionId}`)
      
      const paymentResult = await directPaymentService.processInAppPayment(
        transactionId, 
        phoneNumber, 
        formData.network
      )

      if (paymentResult.success) {
        console.log('Payment processing result:', paymentResult)
        
        // Handle different payment response types
        if (paymentResult.status === 'awaiting_otp') {
          // OTP was sent to user's phone
          Alert.alert(
            'OTP Required',
            paymentResult.message || 'An OTP has been sent to your phone. Please check your SMS and follow the instructions to complete the payment.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Start polling for completion
                  pollPaymentStatus(transactionId)
                }
              }
            ]
          )
        } else if (paymentResult.status === 'processing' && paymentResult.ussd) {
          // USSD code was provided
          Alert.alert(
            'USSD Payment',
            paymentResult.message || `Please dial ${paymentResult.ussd} on your phone to complete the payment.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Start polling for completion
                  pollPaymentStatus(transactionId)
                }
              }
            ]
          )
        } else {
          // Standard processing flow
          pollPaymentStatus(transactionId)
        }
      } else {
        throw new Error(paymentResult.error || 'Payment processing failed')
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      Alert.alert(content.error, error.message || 'Payment processing failed')
      setLoading(false)
      updateProgress(1)
    }
  }

  const pollPaymentStatus = async (transactionId) => {
    let attempts = 0
    const maxAttempts = 20
    
    const checkStatus = async () => {
      try {
        console.log(`Checking payment status (attempt ${attempts + 1}/${maxAttempts})`)
        
        const statusResult = await directPaymentService.checkPaymentStatus(transactionId)
        
        if (statusResult.success) {
          if (statusResult.status === 'completed' || statusResult.status === 'successful') {
            // Payment completed
            updateProgress(3)
            setLoading(false)
            
            // Show success animation
            setTimeout(() => {
              Alert.alert(
                content.success,
                'Your document access has been activated! You can now view the purchased legal document.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('HomeMain')
                  }
                ]
              )
            }, 1500)
            return
          } else if (statusResult.status === 'failed' || statusResult.status === 'cancelled') {
            // Payment failed
            setLoading(false)
            updateProgress(1)
            Alert.alert(content.error, statusResult.error || `Payment ${statusResult.status}`)
            return
          } else if (statusResult.status === 'awaiting_otp' || statusResult.status === 'processing') {
            // Payment is still in progress - continue polling
            console.log(`Payment still in progress with status: ${statusResult.status}`)
          }
        }

        // Continue polling
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 6000)
        } else {
          // Timeout
          setLoading(false)
          updateProgress(1)
          Alert.alert(
            'Payment Timeout',
            'Payment verification is taking longer than expected. Please check your transaction history.',
            [
              {
                text: 'Check Later',
                onPress: () => navigation.navigate('HomeMain')
              },
              {
                text: 'Try Again',
                onPress: () => handlePayment()
              }
            ]
          )
        }
      } catch (error) {
        console.error('Payment status check error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 6000)
        } else {
          setLoading(false)
          updateProgress(1)
          Alert.alert(content.error, 'Unable to verify payment status. Please try again.')
        }
      }
    }

    checkStatus()
  }

  const renderPaymentSteps = () => (
    <Surface style={styles.stepsContainer} elevation={1}>
      <View style={styles.stepsHeader}>
        <Text variant="titleMedium" style={[styles.stepsTitle, { color: theme.colors.onSurface }]}>
          {content.paymentSteps.info}
        </Text>
        <View style={styles.stepDivider}>
          <View style={[styles.stepLine, { backgroundColor: paymentStep >= 2 ? theme.colors.primary : theme.colors.outline }]} />
        </View>
        <Text variant="titleMedium" style={[styles.stepsTitle, { 
          color: paymentStep >= 2 ? theme.colors.onSurface : theme.colors.outline 
        }]}>
          {content.paymentSteps.processing}
        </Text>
        <View style={styles.stepDivider}>
          <View style={[styles.stepLine, { backgroundColor: paymentStep >= 3 ? theme.colors.primary : theme.colors.outline }]} />
        </View>
        <Text variant="titleMedium" style={[styles.stepsTitle, { 
          color: paymentStep >= 3 ? theme.colors.onSurface : theme.colors.outline 
        }]}>
          {content.paymentSteps.complete}
        </Text>
      </View>
      <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
    </Surface>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '10', theme.colors.background]}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                  {content.title}
                </Text>
                <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {content.subtitle}
                </Text>
              </View>

              {/* Payment Steps */}
              {renderPaymentSteps()}

              {/* Document Information */}
              <Card style={[styles.modernCard, styles.documentCard]} elevation={3}>
                <LinearGradient
                  colors={[theme.colors.primaryContainer, theme.colors.surfaceVariant]}
                  style={styles.cardGradient}
                >
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Icon name="description" size={24} color={theme.colors.primary} />
                      <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                        {content.documentInfo}
                      </Text>
                    </View>
                    
                    {documentInfo ? (
                      <View style={styles.documentDetails}>
                        <Text variant="headlineSmall" style={[styles.documentName, { color: theme.colors.primary }]}>
                          {documentInfo.name}
                        </Text>
                        <Text variant="bodyMedium" style={[styles.documentDescription, { color: theme.colors.onSurfaceVariant }]}>
                          {documentInfo.description}
                        </Text>
                        
                        <View style={styles.priceContainer}>
                          <View style={styles.priceInfo}>
                            <Text variant="headlineMedium" style={[styles.price, { color: theme.colors.primary }]}>
                              {documentInfo.price?.toLocaleString()} {documentInfo.currency}
                            </Text>
                            <Chip mode="flat" style={styles.priceChip}>
                              {content.price}
                            </Chip>
                          </View>
                          <Icon name="verified" size={20} color={theme.colors.primary} />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                          Loading document info...
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </LinearGradient>
              </Card>

              {/* Payment Form */}
              {paymentStep === 1 && (
                <Card style={styles.modernCard} elevation={3}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Icon name="payment" size={24} color={theme.colors.primary} />
                      <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                        {content.paymentInfo}
                      </Text>
                    </View>

                    <View style={styles.formContainer}>
                      <TextInput
                        label={content.fullname}
                        value={formData.fullname}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, fullname: text }))}
                        style={styles.modernInput}
                        mode="outlined"
                        left={<TextInput.Icon icon="account" />}
                        error={!!errors.fullname}
                        disabled={loading}
                      />
                      {errors.fullname && <Text style={styles.errorText}>{errors.fullname}</Text>}

                      <TextInput
                        label={content.email}
                        value={formData.email}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                        style={styles.modernInput}
                        mode="outlined"
                        left={<TextInput.Icon icon="email" />}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={!!errors.email}
                        disabled={loading}
                      />
                      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                      <TextInput
                        label={content.phoneNumber}
                        value={formData.phoneNumber}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                        style={styles.modernInput}
                        mode="outlined"
                        left={<TextInput.Icon icon="phone" />}
                        keyboardType="phone-pad"
                        placeholder="XXXXXXXXX"
                        error={!!errors.phoneNumber}
                        disabled={loading}
                      />
                      {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

                      <Text variant="titleSmall" style={[styles.networkTitle, { color: theme.colors.onSurface }]}>
                        {content.network}
                      </Text>
                      
                      <Surface style={styles.radioContainer} elevation={1}>
                        <RadioButton.Group 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, network: value }))} 
                          value={formData.network}
                        >
                          <View style={styles.radioRow}>
                            <RadioButton.Item 
                              label="MTN Mobile Money" 
                              value="MTN" 
                              disabled={loading}
                              labelStyle={{ color: theme.colors.onSurface }}
                              style={styles.radioItem}
                            />
                            <RadioButton.Item 
                              label="Orange Money" 
                              value="ORANGEMONEY" 
                              disabled={loading}
                              labelStyle={{ color: theme.colors.onSurface }}
                              style={styles.radioItem}
                            />
                          </View>
                        </RadioButton.Group>
                      </Surface>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {/* Processing Step */}
              {paymentStep === 2 && (
                <Card style={styles.modernCard} elevation={3}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.processingContainer}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text variant="headlineSmall" style={[styles.processingTitle, { color: theme.colors.onSurface }]}>
                        {content.processing}
                      </Text>
                      <Text variant="bodyMedium" style={[styles.processingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                        {content.authorizePayment}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {/* Success Step */}
              {paymentStep === 3 && (
                <Card style={styles.modernCard} elevation={3}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.successContainer}>
                      <Icon name="check-circle" size={64} color={theme.colors.primary} />
                      <Text variant="headlineSmall" style={[styles.successTitle, { color: theme.colors.onSurface }]}>
                        {content.success}
                      </Text>
                      <Text variant="bodyMedium" style={[styles.successSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                        Document access activated!
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {/* Security Info */}
              <Surface style={styles.securityContainer} elevation={1}>
                <View style={styles.securityInfo}>
                  <Icon name="security" size={24} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={[styles.securityText, { color: theme.colors.onSurfaceVariant }]}>
                    {content.paymentDescription}
                  </Text>
                </View>
              </Surface>

              {/* Action Buttons */}
              {paymentStep === 1 && (
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={handlePayment}
                    style={styles.primaryButton}
                    contentStyle={styles.buttonContent}
                    disabled={loading || !documentInfo}
                    icon={loading ? undefined : "credit-card"}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : !documentInfo ? (
                      currentLanguage === 'fr' ? 'Chargement...' : 'Loading...'
                    ) : (
                      content.payNow
                    )}
                  </Button>
                </View>
              )}

              <View style={styles.bottomSpacing} />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  animatedContainer: {
    flex: 1,
  },
  stepsContainer: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 80,
  },
  stepDivider: {
    flex: 1,
    marginHorizontal: 8,
  },
  stepLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  progressBar: {
    marginTop: 8,
    borderRadius: 4,
  },
  modernCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  documentCard: {
    marginBottom: 20,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    marginLeft: 12,
    fontWeight: '600',
    fontSize: 18,
  },
  documentDetails: {
    gap: 12,
  },
  documentName: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 8,
  },
  documentDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontWeight: 'bold',
    fontSize: 28,
  },
  priceChip: {
    marginLeft: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  formContainer: {
    gap: 16,
  },
  modernInput: {
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
    marginLeft: 16,
  },
  networkTitle: {
    marginBottom: 12,
    marginTop: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  radioContainer: {
    borderRadius: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  radioItem: {
    flex: 1,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  processingTitle: {
    marginTop: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingSubtitle: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  successContainer: {
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    marginTop: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  successSubtitle: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonContent: {
    paddingVertical: 8,
    justifyContent: 'center',
  },
  bottomSpacing: {
    height: 60,
  },
  securityContainer: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
}) 