import AsyncStorage from '@react-native-async-storage/async-storage';

class SubscriptionService {
  constructor() {
    this.subscriptions = {};
  }

  // Check if user has paid for lawyers directory access
  async hasLawyersAccess(forceRefresh = false) {
    try {
      // If not forcing refresh, check local storage first
      if (!forceRefresh) {
        const localSubscriptions = await AsyncStorage.getItem('user_subscriptions');
        if (localSubscriptions) {
          const subscriptions = JSON.parse(localSubscriptions);
          if (subscriptions.lawyers_subscription) {
            console.log('✅ Lawyers subscription found locally');
            return true;
          }
        }
      }

      // Check database
      const { supabase } = require('../lib/supabase');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('❌ No authenticated user for subscription check');
        return false;
      }

      // Check payment records for lawyers subscription
      const { data: subscriptionPayments, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_type', 'lawyers_subscription')
        .in('status', ['completed', 'successful', 'success'])
        .limit(1);

      if (error) {
        console.error('❌ Error checking lawyers subscription:', error);
        return false;
      }

      const hasAccess = subscriptionPayments && subscriptionPayments.length > 0;
      
      if (hasAccess) {
        console.log('✅ Lawyers subscription found in database');
        // Cache locally for faster future checks
        await this.cacheLawyersSubscription();
      } else {
        console.log('❌ No lawyers subscription found');
        // Clear cache if database shows no subscription
        await this.clearLawyersSubscriptionCache();
      }

      return hasAccess;
    } catch (error) {
      console.error('❌ Error checking lawyers subscription:', error);
      return false;
    }
  }

  // Cache lawyers subscription locally
  async cacheLawyersSubscription() {
    try {
      const existingSubscriptions = await AsyncStorage.getItem('user_subscriptions');
      const subscriptions = existingSubscriptions ? JSON.parse(existingSubscriptions) : {};
      
      subscriptions.lawyers_subscription = {
        active: true,
        purchased_at: new Date().toISOString()
      };

      await AsyncStorage.setItem('user_subscriptions', JSON.stringify(subscriptions));
      console.log('💾 Lawyers subscription cached locally');
    } catch (error) {
      console.error('❌ Error caching lawyers subscription:', error);
    }
  }

  // Mark lawyers subscription as purchased (called after successful payment)
  async activateLawyersSubscription() {
    try {
      await this.cacheLawyersSubscription();
      console.log('🎉 Lawyers subscription activated!');
      return true;
    } catch (error) {
      console.error('❌ Error activating lawyers subscription:', error);
      return false;
    }
  }

  // Clear all subscription cache (for testing/logout)
  async clearSubscriptionCache() {
    try {
      await AsyncStorage.removeItem('user_subscriptions');
      console.log('🗑️ Subscription cache cleared');
    } catch (error) {
      console.error('❌ Error clearing subscription cache:', error);
    }
  }

  // Clear lawyers subscription cache specifically (called when payment fails)
  async clearLawyersSubscriptionCache() {
    try {
      const existingSubscriptions = await AsyncStorage.getItem('user_subscriptions');
      if (existingSubscriptions) {
        const subscriptions = JSON.parse(existingSubscriptions);
        if (subscriptions.lawyers_subscription) {
          delete subscriptions.lawyers_subscription;
          await AsyncStorage.setItem('user_subscriptions', JSON.stringify(subscriptions));
          console.log('🗑️ Lawyers subscription cache cleared');
        }
      }
    } catch (error) {
      console.error('❌ Error clearing lawyers subscription cache:', error);
    }
  }

  // Get all user subscriptions
  async getUserSubscriptions() {
    try {
      const { supabase } = require('../lib/supabase');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return [];
      }

      const { data: subscriptions, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id)
        .in('document_type', ['lawyers_subscription'])
        .in('status', ['completed', 'successful', 'success'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user subscriptions:', error);
        return [];
      }

      return subscriptions || [];
    } catch (error) {
      console.error('❌ Error getting user subscriptions:', error);
      return [];
    }
  }
}

export default new SubscriptionService(); 