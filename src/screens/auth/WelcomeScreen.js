import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { Text, Button, Surface, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialIcons'

const { height } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }) {
  const theme = useTheme()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.background]}
        style={styles.gradientContainer}
        locations={[0, 0.6, 1]}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="gavel" size={60} color="white" />
          </View>
          <Text variant="displaySmall" style={styles.title}>
            Legal237
          </Text>
          <Text variant="titleLarge" style={styles.subtitle}>
            Your Legal Companion
          </Text>
          <Text variant="bodyLarge" style={styles.description}>
            Access Cameroon's legal documents, get AI-powered assistance, and stay informed about the law.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <Surface style={[styles.featureCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]} elevation={0}>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Icon name="search" size={24} color="white" />
                <Text variant="bodySmall" style={styles.featureText}>1,360+ Legal Articles</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="translate" size={24} color="white" />
                <Text variant="bodySmall" style={styles.featureText}>Bilingual Support</Text>
              </View>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Icon name="smart-toy" size={24} color="white" />
                <Text variant="bodySmall" style={styles.featureText}>AI Assistant</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="offline-pin" size={24} color="white" />
                <Text variant="bodySmall" style={styles.featureText}>Offline Access</Text>
              </View>
            </View>
          </Surface>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={[styles.primaryButton, { backgroundColor: 'white' }]}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.primaryButtonText, { color: theme.colors.primary }]}
          >
            Sign In
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('SignUp')}
            style={[styles.secondaryButton, { borderColor: 'white' }]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.secondaryButtonText}
          >
            Create Account
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('MainNavigator')}
            style={styles.guestButton}
            labelStyle={styles.guestButtonText}
          >
            Continue as Guest
          </Button>
        </View>

        {/* Terms and Privacy */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  description: {
    color: 'white',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 12,
    elevation: 4,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 2,
  },
  guestButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  guestButtonText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: 'white',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 18,
  },
}) 