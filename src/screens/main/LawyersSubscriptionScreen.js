import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import {
  Button,
  Card,
  TextInput,
  useTheme,
  ActivityIndicator,
  Chip,
  ProgressBar,
  Surface
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import directPaymentService from '../../services/directPaymentService';
import subscriptionService from '../../services/subscriptionService';
import { supabase } from '../../lib/supabase';

export default function LawyersSubscriptionScreen({ navigation }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStep, setPaymentStep] = useState(1);
  const [progress, setProgress] = useState(0.33);

  // Get current language from i18n
  const currentLanguage = i18n.language;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadUserData();
    loadLanguage();
    animateEntry();
  }, []);

  useEffect(() => {
    console.log('Language changed to:', currentLanguage);
  }, [currentLanguage]);

  const loadLanguage = async () => {
    try {
      const userLanguage = await AsyncStorage.getItem('user_language');
      if (userLanguage && userLanguage !== i18n.language) {
        await i18n.changeLanguage(userLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

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
    ]).start();
  };

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUserInfo(user);
        // Pre-fill phone number if available in user metadata
        if (user.user_metadata?.phone) {
          setPhoneNumber(user.user_metadata.phone);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        title: 'Abonnement Annuaire des Avocats',
        subtitle: 'Accédez aux avocats qualifiés du Cameroun',
        subscriptionInfo: 'Détails de l\'abonnement',
        paymentInfo: 'Informations de paiement',
        phoneLabel: 'Numéro de téléphone',
        phonePlaceholder: 'Entrez votre numéro de téléphone',
        payButton: 'S\'abonner maintenant',
        price: 'Frais uniques',
        features: {
          title: 'Ce que vous obtenez:',
          items: [
            'Annuaire complet des avocats qualifiés',
            'Informations de contact et spécialisations',
            'Recherche d\'avocats par localisation',
            'Capacités de contact direct'
          ]
        },
        paymentSteps: {
          info: 'Info Abonnement',
          processing: 'Traitement du paiement',
          complete: 'Accès accordé'
        },
        success: 'Abonnement réussi!',
        error: 'Erreur de paiement',
        paymentInitiated: 'Paiement initié',
        dialUssd: 'Veuillez composer',
        dialedConfirm: 'J\'ai composé',
        paymentTimeout: 'Délai de paiement dépassé',
        timeoutMessage: 'La vérification du paiement d\'abonnement prend plus de temps que prévu. La transaction a été marquée comme échouée.',
        ok: 'OK',
        tryAgain: 'Réessayer',
        unableToVerify: 'Impossible de vérifier le statut du paiement d\'abonnement. La transaction a été marquée comme échouée.',
        successMessage: 'Votre abonnement à l\'annuaire des avocats est maintenant actif! Vous pouvez maintenant accéder à l\'annuaire complet des avocats.',
        accessLawyers: 'Accéder aux avocats',
        pleaseEnterPhone: 'Veuillez entrer votre numéro de téléphone',
        pleaseEnterValidPhone: 'Veuillez entrer un numéro de téléphone camerounais valide',
        pleaseLogin: 'Veuillez vous connecter pour continuer',
        redirecting: 'Redirection vers l\'annuaire des avocats...'
      };
    } else {
      return {
        title: 'Lawyers Directory Subscription',
        subtitle: 'Get access to qualified lawyers in Cameroon',
        subscriptionInfo: 'Subscription Details',
        paymentInfo: 'Payment Information',
        phoneLabel: 'Phone Number',
        phonePlaceholder: 'Enter your phone number',
        payButton: 'Subscribe Now',
        price: 'One-time Fee',
        features: {
          title: 'What you get:',
          items: [
            'Complete directory of qualified lawyers',
            'Contact information and specializations',
            'Location-based lawyer search',
            'Direct contact capabilities'
          ]
        },
        paymentSteps: {
          info: 'Subscription Info',
          processing: 'Processing Payment',
          complete: 'Access Granted'
        },
        success: 'Subscription Successful!',
        error: 'Payment Error',
        paymentInitiated: 'Payment Initiated',
        dialUssd: 'Please dial',
        dialedConfirm: 'I\'ve dialed',
        paymentTimeout: 'Payment Timeout',
        timeoutMessage: 'Subscription payment verification is taking longer than expected. The transaction has been marked as failed.',
        ok: 'OK',
        tryAgain: 'Try Again',
        unableToVerify: 'Unable to verify subscription payment status. The transaction has been marked as failed.',
        successMessage: 'Your lawyers directory subscription is now active! You can now access the complete lawyers directory.',
        accessLawyers: 'Access Lawyers',
        pleaseEnterPhone: 'Please enter your phone number',
        pleaseEnterValidPhone: 'Please enter a valid Cameroon phone number',
        pleaseLogin: 'Please login to continue',
        redirecting: 'Redirecting to lawyers directory...'
      };
    }
  };

  const content = getLocalizedContent();

  const validateForm = () => {
    if (!phoneNumber.trim()) {
      Alert.alert(content.error, content.pleaseEnterPhone);
      return false;
    }

    const phoneRegex = /^(6[0-9]{8}|2376[0-9]{8}|\+2376[0-9]{8})$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      Alert.alert(content.error, content.pleaseEnterValidPhone);
      return false;
    }

    return true;
  };

  const updateProgress = (step) => {
    setPaymentStep(step);
    setProgress(step / 3);
  };

  const handleSubscription = async () => {
    if (!validateForm()) return;

    setLoading(true);
    updateProgress(2);

    try {
      if (!userInfo) {
        Alert.alert(content.error, content.pleaseLogin);
        setLoading(false);
        updateProgress(1);
        return;
      }

      const customerInfo = {
        fullname: userInfo.user_metadata?.full_name || userInfo.email.split('@')[0],
        email: userInfo.email,
        phone: phoneNumber
      };

      const paymentResult = await directPaymentService.initiatePayment(
        'lawyers_subscription',
        customerInfo,
        userInfo.id
      );

      if (paymentResult.success) {
        console.log('Payment initiated:', paymentResult);

        if (paymentResult.ussd) {
          Alert.alert(
            content.paymentInitiated,
            `${content.dialUssd} ${paymentResult.ussd} on your phone to complete the subscription payment.`,
            [
              {
                text: content.dialedConfirm,
                onPress: () => startPaymentPolling(paymentResult.transaction_id)
              }
            ]
          );
        } else {
          startPaymentPolling(paymentResult.transaction_id);
        }
      } else {
        setLoading(false);
        updateProgress(1);
        Alert.alert(content.error, paymentResult.error || 'Failed to initiate subscription payment');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setLoading(false);
      updateProgress(1);
      Alert.alert(content.error, 'An error occurred while processing your subscription');
    }
  };

  const startPaymentPolling = (transactionId) => {
    let attempts = 0;
    const maxAttempts = 20;

    const checkStatus = async () => {
      try {
        console.log(`Checking subscription payment status (attempt ${attempts + 1}/${maxAttempts})`);
        
        const statusResult = await directPaymentService.checkPaymentStatus(transactionId);
        
        if (statusResult.success) {
          if (statusResult.status === 'completed' || statusResult.status === 'successful') {
            // Subscription completed
            updateProgress(3);
            setLoading(false);
            
            // Show brief success message and automatically redirect
            setTimeout(() => {
              console.log('🎉 Subscription successful! Redirecting to lawyers directory...');
              navigation.replace('FindLawyer');
            }, 1500);
            return;
          } else if (statusResult.status === 'failed' || statusResult.status === 'cancelled') {
            // Payment failed
            setLoading(false);
            updateProgress(1);
            Alert.alert(content.error, statusResult.error || `Subscription payment ${statusResult.status}`);
            return;
          }
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 6000);
        } else {
          // Timeout
          console.log(`⏰ Subscription payment polling timeout after ${maxAttempts} attempts`);
          try {
            await directPaymentService.updateTransactionStatusInDatabase(transactionId, 'failed');
            console.log('✅ Transaction marked as failed due to polling timeout');
            
            // Clear subscription cache to ensure UI shows correct status
            const subscriptionService = require('../../services/subscriptionService').default;
            await subscriptionService.clearLawyersSubscriptionCache();
            console.log('🗑️ Cleared subscription cache after timeout');
          } catch (error) {
            console.error('❌ Error marking transaction as failed:', error);
          }
          
          setLoading(false);
          updateProgress(1);
          Alert.alert(
            content.paymentTimeout,
            content.timeoutMessage,
            [
              {
                text: content.ok,
                onPress: () => navigation.goBack()
              },
              {
                text: content.tryAgain,
                onPress: () => handleSubscription()
              }
            ]
          );
        }
      } catch (error) {
        console.error('Subscription status check error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 6000);
        } else {
          console.log(`⏰ Subscription payment polling timeout due to errors after ${maxAttempts} attempts`);
          try {
            await directPaymentService.updateTransactionStatusInDatabase(transactionId, 'failed');
            console.log('✅ Transaction marked as failed due to polling timeout with errors');
            
            // Clear subscription cache to ensure UI shows correct status
            const subscriptionService = require('../../services/subscriptionService').default;
            await subscriptionService.clearLawyersSubscriptionCache();
            console.log('🗑️ Cleared subscription cache after timeout with errors');
          } catch (updateError) {
            console.error('❌ Error marking transaction as failed:', updateError);
          }
          
          setLoading(false);
          updateProgress(1);
          Alert.alert(content.error, content.unableToVerify);
        }
      }
    };

    checkStatus();
  };

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
  );

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

              {/* Subscription Information */}
              <Card style={[styles.modernCard, styles.subscriptionCard]} elevation={3}>
                <View style={styles.cardContentWrapper}>
                  <LinearGradient
                    colors={[theme.colors.primaryContainer, theme.colors.surfaceVariant]}
                    style={styles.cardGradient}
                  >
                    <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Icon name="gavel" size={24} color={theme.colors.primary} />
                      <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                        {content.subscriptionInfo}
                      </Text>
                    </View>
                    
                    <View style={styles.subscriptionDetails}>
                      <Text variant="headlineSmall" style={[styles.subscriptionName, { color: theme.colors.primary }]}>
                        Lawyers Directory Access
                      </Text>
                      
                      <View style={styles.priceContainer}>
                        <View style={styles.priceInfo}>
                          <Text variant="headlineMedium" style={[styles.price, { color: theme.colors.primary }]}>
                            500 XAF
                          </Text>
                          <Chip mode="flat" style={styles.priceChip}>
                            {content.price}
                          </Chip>
                        </View>
                        <Icon name="verified" size={20} color={theme.colors.primary} />
                      </View>

                      <View style={styles.featuresContainer}>
                        <Text variant="titleMedium" style={[styles.featuresTitle, { color: theme.colors.onSurface }]}>
                          {content.features.title}
                        </Text>
                        {content.features.items.map((feature, index) => (
                          <View key={index} style={styles.featureItem}>
                            <Icon name="check-circle" size={16} color={theme.colors.primary} />
                            <Text variant="bodyMedium" style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    </Card.Content>
                  </LinearGradient>
                </View>
              </Card>

              {/* Payment Form */}
              {paymentStep === 1 && (
                <Card style={styles.modernCard} elevation={3}>
                  <View style={styles.cardContentWrapper}>
                    <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Icon name="payment" size={24} color={theme.colors.primary} />
                      <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                        {content.paymentInfo}
                      </Text>
                    </View>

                    <View style={styles.formContainer}>
                      <TextInput
                        label={content.phoneLabel}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder={content.phonePlaceholder}
                        keyboardType="phone-pad"
                        mode="outlined"
                        style={styles.input}
                        left={<TextInput.Icon icon="phone" />}
                      />

                      <Button
                        mode="contained"
                        onPress={handleSubscription}
                        loading={loading}
                        disabled={loading}
                        style={styles.payButton}
                        contentStyle={styles.payButtonContent}
                      >
                        {loading ? 'Processing...' : content.payButton}
                      </Button>
                    </View>
                    </Card.Content>
                  </View>
                </Card>
              )}

              {/* Processing State */}
              {paymentStep >= 2 && (
                <Card style={styles.modernCard} elevation={3}>
                  <View style={styles.cardContentWrapper}>
                    <Card.Content style={styles.processingContainer}>
                      {paymentStep === 2 ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                      ) : (
                        <Icon name="check-circle" size={64} color={theme.colors.primary} />
                      )}
                      <Text variant="titleMedium" style={[styles.processingText, { color: theme.colors.onSurface }]}>
                        {paymentStep === 2 ? 'Processing your subscription...' : content.success}
                      </Text>
                      {paymentStep === 2 && (
                        <Text variant="bodyMedium" style={[styles.processingSubtext, { color: theme.colors.onSurfaceVariant }]}>
                          Please complete the payment on your phone
                        </Text>
                      )}
                      {paymentStep === 3 && (
                        <Text variant="bodyMedium" style={[styles.processingSubtext, { color: theme.colors.onSurfaceVariant }]}>
                          {content.redirecting}
                        </Text>
                      )}
                    </Card.Content>
                  </View>
                </Card>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  stepsContainer: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepsTitle: {
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
  stepDivider: {
    flex: 1,
    paddingHorizontal: 8,
  },
  stepLine: {
    height: 2,
    borderRadius: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  modernCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  cardContentWrapper: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  subscriptionCard: {
    marginBottom: 24,
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    marginLeft: 12,
    fontWeight: '600',
  },
  subscriptionDetails: {
    gap: 16,
  },
  subscriptionName: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 16,
    borderRadius: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontWeight: 'bold',
  },
  priceChip: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  featuresContainer: {
    gap: 8,
  },
  featuresTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  featureText: {
    flex: 1,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  payButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  payButtonContent: {
    paddingVertical: 8,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  processingText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  processingSubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
}); 