import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, useTheme, Surface, IconButton } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { supabase } from '../../lib/supabase'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const theme = useTheme()

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        Alert.alert('Login Failed', error.message)
      } else {
        // Login successful, navigation will be handled by auth state change
        navigation.navigate('MainNavigator')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Reset Password', 'Please enter your email address first')
      return
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
      
      if (error) {
        Alert.alert('Error', error.message)
      } else {
        Alert.alert(
          'Password Reset',
          'Password reset instructions have been sent to your email address.'
        )
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.')
      console.error('Password reset error:', error)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[theme.colors.primary + '10', theme.colors.background]}
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
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                <Icon name="login" size={32} color="white" />
              </View>
              <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                Welcome Back
              </Text>
              <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onBackground }]}>
                Sign in to access your legal resources
              </Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Login Form */}
            <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
              <View style={styles.form}>
                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />

                <Button
                  mode="text"
                  onPress={handleForgotPassword}
                  style={styles.forgotButton}
                  labelStyle={[styles.forgotText, { color: theme.colors.primary }]}
                >
                  Forgot Password?
                </Button>

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Sign In
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

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text variant="bodyMedium" style={[styles.signUpText, { color: theme.colors.onBackground }]}>
                Don't have an account?{' '}
                <Text
                  variant="bodyMedium"
                  style={[styles.signUpLink, { color: theme.colors.primary }]}
                  onPress={() => navigation.navigate('SignUp')}
                >
                  Sign Up
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    fontWeight: '500',
  },
  loginButton: {
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
  signUpContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  signUpText: {
    textAlign: 'center',
  },
  signUpLink: {
    fontWeight: 'bold',
  },
})
