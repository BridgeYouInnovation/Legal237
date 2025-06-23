const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server-side operations
    );
  }

  /**
   * Save transaction to database
   */
  async saveTransaction(transactionData) {
    try {
      const { data, error } = await this.supabase
        .from('payment_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        console.error('Error saving transaction:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Save transaction error:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId) {
    try {
      const { data, error } = await this.supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) {
        console.error('Error getting transaction:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get transaction error:', error);
      return null;
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      const { data, error } = await this.supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update transaction status error:', error);
      throw error;
    }
  }

  /**
   * Grant document access to user
   */
  async grantDocumentAccess(userId, documentType, transactionId) {
    try {
      // Check if access already exists
      const { data: existingAccess } = await this.supabase
        .from('document_access')
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .single();

      if (existingAccess) {
        console.log(`User ${userId} already has access to ${documentType}`);
        return existingAccess;
      }

      // Grant new access
      const accessData = {
        user_id: userId,
        document_type: documentType,
        transaction_id: transactionId,
        granted_at: new Date().toISOString(),
        expires_at: null, // Permanent access
        status: 'active'
      };

      const { data, error } = await this.supabase
        .from('document_access')
        .insert([accessData])
        .select()
        .single();

      if (error) {
        console.error('Error granting document access:', error);
        throw error;
      }

      console.log(`Document access granted: User ${userId} -> ${documentType}`);
      return data;
    } catch (error) {
      console.error('Grant document access error:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to document
   */
  async checkDocumentAccess(userId, documentType) {
    try {
      const { data, error } = await this.supabase
        .from('document_access')
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .eq('status', 'active')
        .single();

      if (error) {
        // User doesn't have access
        return false;
      }

      // Check if access has expired (if expires_at is set)
      if (data.expires_at) {
        const expiryDate = new Date(data.expires_at);
        const now = new Date();
        if (now > expiryDate) {
          // Access has expired
          await this.revokeDocumentAccess(userId, documentType);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Check document access error:', error);
      return false;
    }
  }

  /**
   * Revoke document access
   */
  async revokeDocumentAccess(userId, documentType) {
    try {
      const { data, error } = await this.supabase
        .from('document_access')
        .update({ 
          status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .select();

      if (error) {
        console.error('Error revoking document access:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Revoke document access error:', error);
      throw error;
    }
  }

  /**
   * Get user's transactions
   */
  async getUserTransactions(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await this.supabase
        .from('payment_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting user transactions:', error);
        throw error;
      }

      return { data, count };
    } catch (error) {
      console.error('Get user transactions error:', error);
      throw error;
    }
  }

  /**
   * Get all transactions (for admin dashboard)
   */
  async getAllTransactions(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = this.supabase
        .from('payment_transactions')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.document_type) {
        query = query.eq('document_type', filters.document_type);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting all transactions:', error);
        throw error;
      }

      return { data, count };
    } catch (error) {
      console.error('Get all transactions error:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(dateFrom, dateTo) {
    try {
      let query = this.supabase
        .from('payment_transactions')
        .select('status, amount, currency, created_at, payment_method');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting payment stats:', error);
        throw error;
      }

      // Calculate statistics
      const stats = {
        total_transactions: data.length,
        completed_transactions: data.filter(t => t.status === 'completed').length,
        failed_transactions: data.filter(t => t.status === 'failed').length,
        pending_transactions: data.filter(t => t.status === 'pending').length,
        total_revenue: data
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        revenue_by_method: {},
        transactions_by_day: {}
      };

      // Group by payment method
      data.forEach(transaction => {
        if (transaction.status === 'completed') {
          if (!stats.revenue_by_method[transaction.payment_method]) {
            stats.revenue_by_method[transaction.payment_method] = 0;
          }
          stats.revenue_by_method[transaction.payment_method] += transaction.amount;
        }
      });

      return stats;
    } catch (error) {
      console.error('Get payment stats error:', error);
      throw error;
    }
  }

  /**
   * Get user's document access list
   */
  async getUserDocumentAccess(userId) {
    try {
      const { data, error } = await this.supabase
        .from('document_access')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('granted_at', { ascending: false });

      if (error) {
        console.error('Error getting user document access:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get user document access error:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService(); 