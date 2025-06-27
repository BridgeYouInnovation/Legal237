import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, Card, Title, Paragraph, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import paymentService from '../../services/paymentService';
import { useAuthStore } from '../../stores/authStore';

export default function PaymentSuccessScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  // Get parameters from deep link
  const { transaction_id, transaction_ref, status, amount } = route.params || {};

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      
      if (transaction_id) {
        // Verify payment status with backend
        const result = await paymentService.checkPaymentStatus(transaction_id);
        
        if (result.success) {
          setPaymentData(result);
          
          // Sync payments to get updated access
          await paymentService.syncPaymentsFromDatabase();
          
          // Show success message
          Alert.alert(
            t('payment.success.title', 'Payment Successful!'),
            t('payment.success.message', 'Your document access has been activated. You can now view your purchased legal documents.'),
            [
              {
                text: t('common.ok', 'OK'),
                onPress: () => navigation.navigate('HomeMain')
              }
            ]
          );
        } else {
          setError(result.error || 'Failed to verify payment');
        }
      } else {
        // No transaction ID, but payment might still be successful
        setPaymentData({
          transaction_id: 'unknown',
          status: status || 'completed',
          amount: amount ? parseInt(amount) : null,
          currency: 'XAF'
        });
        
        // Try to sync payments anyway
        if (user) {
          await paymentService.syncPaymentsFromDatabase();
        }
      }
    } catch (err) {
      console.error('Payment success handling error:', err);
      setError(err.message || 'Failed to process payment success');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeMain' }],
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    scrollView: {
      flex: 1,
    },
    successIcon: {
      alignSelf: 'center',
      marginBottom: 20,
    },
    title: {
      textAlign: 'center',
      marginBottom: 10,
      color: theme.colors.primary,
      fontSize: 24,
      fontWeight: 'bold',
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: 30,
      color: theme.colors.onSurface,
      fontSize: 16,
    },
    card: {
      marginBottom: 20,
      padding: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: {
      color: theme.colors.onSurface,
      fontSize: 14,
    },
    value: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      textAlign: 'center',
      color: theme.colors.error,
      marginBottom: 20,
    },
    buttonContainer: {
      marginTop: 20,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.onSurface }}>
          {t('payment.verifying', 'Verifying payment...')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={handleContinue}>
          {t('common.continue', 'Continue')}
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollView}>
      <Icon
        name="check-circle"
        size={80}
        color={theme.colors.primary}
        style={styles.successIcon}
      />
      
      <Text style={styles.title}>
        {t('payment.success.title', 'Payment Successful!')}
      </Text>
      
      <Text style={styles.subtitle}>
        {t('payment.success.subtitle', 'Your payment has been processed successfully')}
      </Text>

      {paymentData && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('payment.details', 'Payment Details')}</Title>
            
            {paymentData.transaction_id && paymentData.transaction_id !== 'unknown' && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('payment.transactionId', 'Transaction ID')}:</Text>
                <Text style={styles.value}>
                  {paymentData.transaction_id.slice(0, 12)}...
                </Text>
              </View>
            )}
            
            {paymentData.amount && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('payment.amount', 'Amount')}:</Text>
                <Text style={styles.value}>
                  {paymentData.amount.toLocaleString()} {paymentData.currency || 'XAF'}
                </Text>
              </View>
            )}
            
            {paymentData.payment_method && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('payment.method', 'Payment Method')}:</Text>
                <Text style={styles.value}>{paymentData.payment_method}</Text>
              </View>
            )}
            
            {paymentData.document_type && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('payment.document', 'Document')}:</Text>
                <Text style={styles.value}>
                  {paymentData.document_type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Paragraph>
            {t('payment.success.accessMessage', 
              'Your document access has been activated! You can now view the purchased legal document in the app.'
            )}
          </Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={{ marginBottom: 10 }}
        >
          {t('payment.viewDocuments', 'View My Documents')}
        </Button>
      </View>
    </ScrollView>
  );
} 