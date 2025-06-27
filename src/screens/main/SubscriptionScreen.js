import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, Button, Surface, useTheme, IconButton } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useAuthStore } from '../../stores/authStore'

export default function SubscriptionScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [loading, setLoading] = useState(false)
  const { user, updateSubscription } = useAuthStore()
  const theme = useTheme()

  const plans = [
    {
      id: 'monthly',
      name: 'Legal Pro Monthly',
      price: '$9.99',
      period: '/month',
      features: [
        'Unlimited AI legal questions',
        'Offline document access',
        'Advanced search filters',
        'Priority customer support',
        'Export & save documents',
        'Legal document templates'
      ],
      savings: null
    },
    {
      id: 'yearly',
      name: 'Legal Pro Yearly',
      price: '$99.99',
      period: '/year',
      features: [
        'All monthly features included',
        'Save 17% compared to monthly',
        'Legal newsletter subscription',
        'Exclusive legal webinars',
        'Early access to new features',
        'Personal legal assistant'
      ],
      savings: 'Save $19.99'
    }
  ]

  const handleSubscribe = async () => {
    if (!user || user.id === 'anonymous') {
      Alert.alert(
        'Account Required',
        'Please create an account or sign in to subscribe to Legal Pro.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') }
        ]
      )
      return
    }

    setLoading(true)
    
    try {
      // In a real app, you would integrate with a payment processor like Stripe
      // For now, we'll simulate the subscription process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const subscriptionData = {
        plan: selectedPlan,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: selectedPlan === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      await updateSubscription(subscriptionData)
      
      Alert.alert(
        'Subscription Successful!',
        'Welcome to Legal Pro! You now have access to all premium features.',
        [
          { text: 'Get Started', onPress: () => navigation.goBack() }
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription. Please try again.')
      console.error('Subscription error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = () => {
    Alert.alert(
      'Restore Purchases',
      'No previous purchases found for this account.',
      [{ text: 'OK' }]
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '15', theme.colors.background]}
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
              <Icon name="star" size={32} color="white" />
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              Upgrade to Legal Pro
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onBackground }]}>
              Unlock unlimited access to all features
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Plans */}
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <Surface
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selectedPlan === plan.id ? theme.colors.primary : 'transparent',
                    borderWidth: selectedPlan === plan.id ? 2 : 0
                  }
                ]}
                elevation={selectedPlan === plan.id ? 4 : 2}
              >
                <LinearGradient
                  colors={selectedPlan === plan.id 
                    ? [theme.colors.primary + '10', 'transparent'] 
                    : ['transparent', 'transparent']
                  }
                  style={styles.planGradient}
                >
                  <View style={styles.planHeader}>
                    <View style={styles.planInfo}>
                      <Text variant="titleLarge" style={[styles.planName, { color: theme.colors.onSurface }]}>
                        {plan.name}
                      </Text>
                      {plan.savings && (
                        <View style={[styles.savingsBadge, { backgroundColor: theme.colors.secondary }]}>
                          <Text variant="bodySmall" style={styles.savingsText}>
                            {plan.savings}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceContainer}>
                      <Text variant="headlineSmall" style={[styles.price, { color: theme.colors.primary }]}>
                        {plan.price}
                      </Text>
                      <Text variant="bodyMedium" style={[styles.period, { color: theme.colors.onSurface }]}>
                        {plan.period}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Icon name="check-circle" size={20} color={theme.colors.primary} />
                        <Text variant="bodyMedium" style={[styles.featureText, { color: theme.colors.onSurface }]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Button
                    mode={selectedPlan === plan.id ? "contained" : "outlined"}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={[
                      styles.selectButton,
                      selectedPlan === plan.id && { backgroundColor: theme.colors.primary }
                    ]}
                    labelStyle={styles.selectButtonText}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </Button>
                </LinearGradient>
              </Surface>
            ))}
          </View>

          {/* Features Highlight */}
          <Surface style={[styles.highlightCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
            <Text variant="titleMedium" style={[styles.highlightTitle, { color: theme.colors.onPrimaryContainer }]}>
              🎯 Perfect for Legal Professionals
            </Text>
            <Text variant="bodyMedium" style={[styles.highlightText, { color: theme.colors.onPrimaryContainer }]}>
              Join thousands of lawyers, law students, and legal professionals who trust Legal237 for their daily legal research needs.
            </Text>
          </Surface>

          {/* Subscribe Button */}
          <Button
            mode="contained"
            onPress={handleSubscribe}
            loading={loading}
            disabled={loading}
            style={[styles.subscribeButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Subscribe to {plans.find(p => p.id === selectedPlan)?.name}
          </Button>

          {/* Restore & Terms */}
          <View style={styles.footer}>
            <Button
              mode="text"
              onPress={handleRestore}
              labelStyle={[styles.restoreText, { color: theme.colors.primary }]}
            >
              Restore Purchases
            </Button>
            
            <Text variant="bodySmall" style={[styles.termsText, { color: theme.colors.onBackground }]}>
              Subscription automatically renews unless auto-renew is turned off at least 24 hours before the current period ends. 
              By subscribing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
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
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  planGradient: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  savingsBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  savingsText: {
    color: 'white',
    fontWeight: 'bold',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontWeight: 'bold',
  },
  period: {
    opacity: 0.7,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  selectButton: {
    borderRadius: 12,
  },
  selectButtonText: {
    fontWeight: 'bold',
  },
  highlightCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  highlightTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  highlightText: {
    lineHeight: 20,
    opacity: 0.9,
  },
  subscribeButton: {
    borderRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
    gap: 16,
  },
  restoreText: {
    fontWeight: '500',
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.7,
    paddingHorizontal: 16,
  },
})
