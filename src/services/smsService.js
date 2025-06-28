import AsyncStorage from '@react-native-async-storage/async-storage'

class SMSService {
  constructor() {
    this.verificationCodes = new Map() // Store verification codes temporarily
  }

  // Generate a 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Send SMS with custom message via Netlify function
  async sendVerificationSMS(phoneNumber, language = 'en') {
    try {
      // Generate verification code
      const code = this.generateVerificationCode()
      
      // Create custom message based on language
      const message = language === 'fr' 
        ? `Legal237 - Votre code de vérification est : ${code}\nCe code est valide pendant 5 minutes.`
        : `Legal237 - Your verification code is: ${code}\nThis code is valid for 5 minutes.`

      // Store the code temporarily (expires in 5 minutes)
      this.verificationCodes.set(phoneNumber, {
        code,
        timestamp: Date.now(),
        expires: Date.now() + (5 * 60 * 1000) // 5 minutes
      })

      // Clean up expired codes
      this.cleanupExpiredCodes()

      // For development/testing - we'll simulate successful SMS sending
      // In production, you can either:
      // 1. Use a backend service to send SMS (recommended for security)
      // 2. Use Twilio directly (credentials would be exposed in app)
      
      console.log('SMS would be sent to:', phoneNumber)
      console.log('Message:', message)
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For now, always return success to test the flow
      console.log('SMS simulation successful for:', phoneNumber)
      return { success: true, message: 'SMS sent successfully (simulated)' }

      /* 
      // OPTION 1: Use your own backend API (recommended)
      const response = await fetch('YOUR_BACKEND_API/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({
          phone: phoneNumber,
          message: message,
          service: 'verification'
        })
      })
      
      // OPTION 2: Direct Twilio (not recommended - exposes credentials)
      // This would require installing twilio package in React Native
      // and storing credentials in environment variables
      */

    } catch (error) {
      console.error('Error sending SMS:', error)
      return { success: false, error: error.message }
    }
  }

  // Verify the code entered by user
  verifyCode(phoneNumber, enteredCode) {
    const stored = this.verificationCodes.get(phoneNumber)
    
    if (!stored) {
      return { success: false, error: 'No verification code found for this number' }
    }

    if (Date.now() > stored.expires) {
      this.verificationCodes.delete(phoneNumber)
      return { success: false, error: 'Verification code has expired' }
    }

    if (stored.code !== enteredCode) {
      return { success: false, error: 'Invalid verification code' }
    }

    // Code is valid, remove it from storage
    this.verificationCodes.delete(phoneNumber)
    return { success: true }
  }

  // Clean up expired codes
  cleanupExpiredCodes() {
    const now = Date.now()
    for (const [phone, data] of this.verificationCodes.entries()) {
      if (now > data.expires) {
        this.verificationCodes.delete(phone)
      }
    }
  }

  // Create a user session after successful verification
  async createUserSession(phoneNumber) {
    try {
      // Create a unique user ID based on phone number
      const userId = `user_${phoneNumber.replace(/\D/g, '')}`
      
      // Store user data locally
      const userData = {
        id: userId,
        phone: phoneNumber,
        email: null,
        name: phoneNumber,
        created_at: new Date().toISOString(),
        verified: true
      }

      await AsyncStorage.setItem('user_data', JSON.stringify(userData))
      
      return { success: true, user: userData }
    } catch (error) {
      console.error('Error creating user session:', error)
      return { success: false, error: error.message }
    }
  }
}

// Create and export singleton instance
const smsService = new SMSService()
export default smsService 