import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, useTheme, Surface, IconButton, Checkbox } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { supabase } from '../../lib/supabase'

export default function SignUpScreen({ navigation }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const theme = useTheme()

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSignUp = async () => {
    const { fullName, email, password, confirmPassword } = formData

    // Validation
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    if (!validatePassword(password)) {
      Alert.alert(
        'Error',
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      )
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          }
        }
      })

      if (error) {
        Alert.alert('Sign Up Failed', error.message)
      } else {
        Alert.alert(
          'Account Created!',
          'Please check your email for a verification link to complete your registration.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
      console.error('Sign up error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[theme.colors.secondary + '10', theme.colors.background]}
          style={styles.gradientContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <View style={styles.headerContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary }]}>
                <Icon name="person-add" size={32} color="white" />
              </View>
              <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                Create Account
              </Text>
              <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onBackground }]}>
                Join thousands of legal professionals
              </Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Sign Up Form */}
            <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
              <View style={styles.form}>
                <TextInput
                  label="Full Name"
                  value={formData.fullName}
                  onChangeText={(text) => updateFormData('fullName', text)}
                  mode="outlined"
                  autoCapitalize="words"
                  autoComplete="name"
                  style={styles.input}
                  left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                  label="Email Address"
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                />

                <TextInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />

                <TextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateFormData('confirmPassword', text)}
                  mode="outlined"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />

                {/* Password Requirements */}
                <Surface style={[styles.requirementsCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                  <Text variant="bodySmall" style={[styles.requirementsTitle, { color: theme.colors.onPrimaryContainer }]}>
                    Password Requirements:
                  </Text>
                  <Text variant="bodySmall" style={[styles.requirement, { color: theme.colors.onPrimaryContainer }]}>
                    • At least 8 characters long
                  </Text>
                  <Text variant="bodySmall" style={[styles.requirement, { color: theme.colors.onPrimaryContainer }]}>
                    • One uppercase and one lowercase letter
                  </Text>
                  <Text variant="bodySmall" style={[styles.requirement, { color: theme.colors.onPrimaryContainer }]}>
                    • At least one number
                  </Text>
                </Surface>

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <Checkbox
                    status={agreedToTerms ? 'checked' : 'unchecked'}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    color={theme.colors.primary}
                  />
                  <Text variant="bodySmall" style={[styles.termsText, { color: theme.colors.onSurface }]}>
                    I agree to the{' '}
                    <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={handleSignUp}
                  loading={loading}
                  disabled={loading}
                  style={[styles.signUpButton, { backgroundColor: theme.colors.secondary }]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Create Account
                </Button>
              </View>
            </Surface>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.onBackground }]}>
                OR
              </Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            </View>

            {/* Alternative Actions */}
            <View style={styles.alternativeActions}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('MainNavigator')}
                style={[styles.guestButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.buttonContent}
                labelStyle={[styles.guestButtonText, { color: theme.colors.onBackground }]}
                icon="account-circle"
              >
                Continue as Guest
              </Button>
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text variant="bodyMedium" style={[styles.loginText, { color: theme.colors.onBackground }]}>
                Already have an account?{' '}
                <Text
                  variant="bodyMedium"
                  style={[styles.loginLink, { color: theme.colors.primary }]}
                  onPress={() => navigation.navigate('Login')}
                >
                  Sign In
                </Text>
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  requirementsCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: -8,
  },
  requirementsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  requirement: {
    marginBottom: 4,
    opacity: 0.8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    opacity: 0.7,
  },
  alternativeActions: {
    marginBottom: 24,
  },
  guestButton: {
    borderRadius: 12,
  },
  guestButtonText: {
    fontWeight: '500',
  },
  loginContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  loginText: {
    textAlign: 'center',
  },
  loginLink: {
    fontWeight: 'bold',
  },
}) 