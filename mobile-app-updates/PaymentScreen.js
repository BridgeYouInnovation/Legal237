"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native"
import { 
  Text, 
  Card, 
  Button, 
  TextInput, 
  useTheme, 
  RadioButton, 
  ActivityIndicator,
  Chip,
  Divider
} from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialIcons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import paymentService from "../../services/newPaymentService"

export default function PaymentScreen({ navigation, route }) {
  const { documentType } = route.params
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [serviceStatus, setServiceStatus] = useState({ available: true, status: 'checking', message: 'Checking service status...' })
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phoneNumber: '',
    network: 'MTN'
  })
  const [errors, setErrors] = useState({})
  
  const theme = useTheme()

  useEffect(() => {
    loadLanguage()
    loadUserData()
    checkServiceStatus()
  }, [])

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

  const checkServiceStatus = async () => {
    try {
      console.log('Checking My-CoolPay service status...')
      setServiceStatus({ available: true, status: 'checking', message: 'Checking service status...' })
      
      const status = await paymentService.checkServiceStatus()
      setServiceStatus(status)
      
      console.log('Service status:', status)
    } catch (error) {
      console.error('Error checking service status:', error)
      setServiceStatus({ 
        available: false, 
        status: 'error', 
        message: 'Unable to check service status' 
      })
    }
  }

  const testApiConnection = async () => {
    try {
      console.log('Testing My-CoolPay API connection...')
      const result = await paymentService.checkServiceStatus()
      if (result.available) {
        console.log('My-CoolPay API connection successful')
      } else {
        console.error('My-CoolPay API connection failed:', result.message)
      }
    } catch (error) {
      console.error('Error testing API connection:', error)
    }
  }

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        title: 'Acheter Document',
        documentInfo: 'Informations du Document',
        paymentInfo: 'Informations de Paiement',
        fullname: 'Nom Complet',
        email: 'Email',
        phoneNumber: 'Numéro de Téléphone',
        network: 'Réseau Mobile Money',
        price: 'Prix',
        payNow: 'Payer Maintenant',
        processing: 'Traitement en cours...',
        validating: 'Validation du paiement...',
        success: 'Paiement Réussi!',
        error: 'Erreur de Paiement',
        required: 'Champ requis',
        invalidEmail: 'Email invalide',
        invalidPhone: 'Numéro de téléphone invalide (9 chiffres requis)',
        paymentInstructions: 'Instructions de Paiement',
        authorizePayment: 'Autorisez le paiement sur votre téléphone',
        waitingForPayment: 'En attente de l\'autorisation...',
        paymentDescription: 'Paiement sécurisé via My-CoolPay',
        back: 'Retour'
      }
    } else {
      return {
        title: 'Purchase Document',
        documentInfo: 'Document Information',
        paymentInfo: 'Payment Information',
        fullname: 'Full Name',
        email: 'Email',
        phoneNumber: 'Phone Number',
        network: 'Mobile Money Network',
        price: 'Price',
        payNow: 'Pay Now',
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
        paymentDescription: 'Secure payment via My-CoolPay',
        back: 'Back'
      }
    }
  }

  const content = getLocalizedContent()
  const [documentInfo, setDocumentInfo] = useState(null)

  useEffect(() => {
    const loadDocumentInfo = async () => {
      try {
        const info = await paymentService.getDocumentInfo(documentType, currentLanguage)
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

  const handlePayment = async () => {
    if (!validateForm()) return

    setLoading(true)
    
    try {
      // Save user data for future use
      await AsyncStorage.setItem('user_data', JSON.stringify({
        fullname: formData.fullname,
        email: formData.email
      }))

      // Initiate payment with My-CoolPay
      const result = await paymentService.initiatePayment(
        documentType,
        {
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phoneNumber
        },
        formData.network === 'MTN' ? 'MTN' : 'ORANGEMONEY',
        currentLanguage
      )

      if (result.success) {
        // Show payment instructions
        Alert.alert(
          content.paymentInstructions,
          content.authorizePayment,
          [
            {
              text: content.back,
              style: 'cancel',
              onPress: () => setLoading(false)
            },
            {
              text: 'OK',
              onPress: () => pollPaymentStatus(result.transaction_id)
            }
          ]
        )
      } else {
        setLoading(false)
        
        Alert.alert(content.error, result.error)
      }
    } catch (error) {
      setLoading(false)
      console.error('Payment error:', error)
      Alert.alert(content.error, 'Something went wrong. Please try again.')
    }
  }

  // Test payment with dummy data (for development)
  const handleTestPayment = async () => {
    setLoading(true)
    
    try {
      const result = await paymentService.initiatePayment(
        documentType,
        {
          fullname: 'Test User',
          email: 'test@example.com',
          phone: '677123456'
        },
        'MTN',
        currentLanguage
      )

      console.log('Test payment result:', result)
      setLoading(false)
      
      if (result.success) {
        Alert.alert('Test Payment Initiated', `Transaction ID: ${result.transaction_id}`)
      } else {
        Alert.alert('Test Payment Failed', result.error)
      }
    } catch (error) {
      setLoading(false)
      console.error('Test payment error:', error)
      Alert.alert('Test Payment Error', error.message)
    }
  }

  const pollPaymentStatus = async (transactionId) => {
    let attempts = 0
    const maxAttempts = 30 // 5 minutes with 10-second intervals
    
    const checkStatus = async () => {
      try {
        const verification = await paymentService.checkPaymentStatus(transactionId)
        
        if (verification.success && (verification.status === 'completed' || verification.status === 'success')) {
          setLoading(false)
          Alert.alert(
            content.success,
            `${documentInfo?.name || 'Document'} has been unlocked!`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          )
          return
        }
        
        if (verification.success && verification.status === 'failed') {
          setLoading(false)
          Alert.alert(content.error, 'Payment failed. Please try again.')
          return
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000) // Check every 10 seconds
        } else {
          setLoading(false)
          Alert.alert(
            content.error,
            'Payment verification timeout. Please contact support if you completed the payment.'
          )
        }
      } catch (error) {
        setLoading(false)
        Alert.alert(content.error, 'Verification failed. Please try again.')
      }
    }
    
    checkStatus()
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
              {content.title}
            </Text>
          </View>

          {/* Service Status Indicator */}
          <Card style={[styles.card, styles.statusCard, {
            backgroundColor: serviceStatus.status === 'operational' ? '#e8f5e8' : 
                           serviceStatus.status === 'maintenance' ? '#fff3cd' : '#f8d7da'
          }]}>
            <Card.Content>
              <View style={styles.statusInfo}>
                <Icon 
                  name={serviceStatus.status === 'operational' ? "check-circle" : 
                        serviceStatus.status === 'maintenance' ? "alert-circle" : "close-circle"} 
                  size={20} 
                  color={serviceStatus.status === 'operational' ? '#28a745' : 
                         serviceStatus.status === 'maintenance' ? '#ffc107' : '#dc3545'} 
                />
                <View style={styles.statusText}>
                  <Text variant="labelMedium" style={{ 
                    color: serviceStatus.status === 'operational' ? '#28a745' : 
                           serviceStatus.status === 'maintenance' ? '#856404' : '#721c24',
                    fontWeight: 'bold'
                  }}>
                    {serviceStatus.status === 'operational' ? 
                      (currentLanguage === 'fr' ? 'Service Opérationnel' : 'Service Operational') :
                     serviceStatus.status === 'maintenance' ? 
                      (currentLanguage === 'fr' ? 'Maintenance en Cours' : 'Under Maintenance') :
                     serviceStatus.status === 'checking' ?
                      (currentLanguage === 'fr' ? 'Vérification...' : 'Checking...') :
                      (currentLanguage === 'fr' ? 'Service Indisponible' : 'Service Unavailable')
                    }
                  </Text>
                  <Text variant="bodySmall" style={{ 
                    color: serviceStatus.status === 'operational' ? '#155724' : 
                           serviceStatus.status === 'maintenance' ? '#856404' : '#721c24',
                    marginTop: 2
                  }}>
                    {serviceStatus.status === 'maintenance' ? 
                      (currentLanguage === 'fr' ? 'Le paiement mobile money est temporairement indisponible' : 'Mobile money payments are temporarily unavailable') :
                     serviceStatus.status === 'operational' ?
                      (currentLanguage === 'fr' ? 'Tous les services de paiement sont disponibles' : 'All payment services are available') :
                      serviceStatus.message
                    }
                  </Text>
                </View>
                {serviceStatus.status !== 'operational' && (
                  <Button 
                    mode="text" 
                    compact 
                    onPress={checkServiceStatus}
                    style={styles.refreshButton}
                  >
                    {currentLanguage === 'fr' ? 'Actualiser' : 'Refresh'}
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Document Information */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {content.documentInfo}
              </Text>
              
              <View style={styles.documentDetails}>
                {documentInfo ? (
                  <>
                    <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                      {documentInfo.name}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                      {documentInfo.description}
                    </Text>
                    
                    <View style={styles.priceContainer}>
                      <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                        {documentInfo.price?.toLocaleString()} {documentInfo.currency}
                      </Text>
                      <Chip mode="outlined" compact>
                        {content.price}
                      </Chip>
                    </View>
                  </>
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurface }}>
                      Loading document info...
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Payment Form */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {content.paymentInfo}
              </Text>

              <TextInput
                label={content.fullname}
                value={formData.fullname}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fullname: text }))}
                style={styles.input}
                error={!!errors.fullname}
                disabled={loading}
              />
              {errors.fullname && <Text style={styles.errorText}>{errors.fullname}</Text>}

              <TextInput
                label={content.email}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                style={styles.input}
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
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="XXXXXXXXX"
                error={!!errors.phoneNumber}
                disabled={loading}
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

              <Text variant="titleSmall" style={[styles.networkTitle, { color: theme.colors.onSurface }]}>
                {content.network}
              </Text>
              
              <RadioButton.Group 
                onValueChange={(value) => setFormData(prev => ({ ...prev, network: value }))} 
                value={formData.network}
              >
                <View style={styles.radioContainer}>
                  <RadioButton.Item 
                    label="MTN Mobile Money" 
                    value="MTN" 
                    disabled={loading}
                    labelStyle={{ color: theme.colors.onSurface }}
                  />
                  <RadioButton.Item 
                    label="Orange Money" 
                    value="ORANGEMONEY" 
                    disabled={loading}
                    labelStyle={{ color: theme.colors.onSurface }}
                  />
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Payment Description */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.securityInfo}>
                <Icon name="security" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                  {content.paymentDescription}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handlePayment}
            style={styles.payButton}
            disabled={loading || serviceStatus.status === 'maintenance' || !documentInfo}
            icon={loading ? undefined : "credit-card"}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : serviceStatus.status === 'maintenance' ? (
              currentLanguage === 'fr' ? 'Service en Maintenance' : 'Service Under Maintenance'
            ) : !documentInfo ? (
              currentLanguage === 'fr' ? 'Chargement...' : 'Loading...'
            ) : (
              content.payNow
            )}
          </Button>

          <Button
            mode="contained"
            onPress={handleTestPayment}
            style={styles.testButton}
            disabled={loading}
            icon={loading ? undefined : "bug"}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              'Test Payment'
            )}
          </Button>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  documentDetails: {
    gap: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -12,
  },
  networkTitle: {
    marginBottom: 8,
    marginTop: 8,
  },
  radioContainer: {
    marginBottom: 16,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  testButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 40,
  },
  statusCard: {
    marginBottom: 20,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    flexDirection: 'column',
    marginLeft: 8,
  },
  refreshButton: {
    marginLeft: 'auto',
  },
}) 