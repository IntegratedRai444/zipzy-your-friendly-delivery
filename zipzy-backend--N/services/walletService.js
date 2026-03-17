const { supabase } = require('../config/supabaseClient');
const Joi = require('joi');

// Validation schemas
const creditWalletSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  amount: Joi.number().min(0.01).required(),
  type: Joi.string().valid('deposit', 'carrier_payout', 'refund', 'bonus').required(),
  description: Joi.string().max(500).required(),
  delivery_request_id: Joi.string().uuid().allow(null).optional()
});

const debitWalletSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  amount: Joi.number().min(0.01).required(),
  type: Joi.string().valid('withdrawal', 'escrow_hold', 'platform_fee').required(),
  description: Joi.string().max(500).required(),
  delivery_request_id: Joi.string().uuid().allow(null).optional()
});

class WalletService {
  async getWallet(userId) {
    try {
      let { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert([{ 
            user_id: userId, 
            balance: 0,
            currency: 'INR',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        wallet = newWallet;
      } else if (error) {
        throw error;
      }

      return wallet;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }
  }

  async getTransactions(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async creditWallet(userId, amount, type, description, deliveryRequestId = null) {
    // Validate input
    const { error, value } = creditWalletSchema.validate({ 
      user_id: userId, 
      amount, 
      type, 
      description,
      delivery_request_id: deliveryRequestId
    });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      // Get or create wallet
      const wallet = await this.getWallet(userId);

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          wallet_id: wallet.id,
          amount: amount,
          type: type,
          status: 'completed',
          reference_id: description,
          delivery_id: deliveryRequestId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update wallet balance
      const newBalance = (parseFloat(wallet.balance) || 0) + amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      return { transaction, newBalance };
    } catch (error) {
      console.error('Error crediting wallet:', error);
      throw error;
    }
  }

  async debitWallet(userId, amount, type, description, deliveryRequestId = null) {
    // Validate input
    const { error, value } = debitWalletSchema.validate({ 
      user_id: userId, 
      amount, 
      type, 
      description,
      delivery_request_id: deliveryRequestId
    });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      // Get wallet
      const wallet = await this.getWallet(userId);

      // Check sufficient balance
      if ((parseFloat(wallet.balance) || 0) < amount) {
        throw new Error('Insufficient balance');
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          wallet_id: wallet.id,
          amount: amount,
          type: type,
          status: 'completed',
          reference_id: description,
          delivery_id: deliveryRequestId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update wallet balance
      const newBalance = (parseFloat(wallet.balance) || 0) - amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      return { transaction, newBalance };
    } catch (error) {
      console.error('Error debiting wallet:', error);
      throw error;
    }
  }

  async holdEscrow(buyerId, amount, deliveryRequestId) {
    try {
      // Hold amount from buyer's wallet (creates a transaction record)
      return await this.debitWallet(
        buyerId, 
        amount, 
        'escrow_hold', 
        `Escrow hold for delivery request ${deliveryRequestId}`,
        deliveryRequestId
      );
    } catch (error) {
      console.error('Error holding escrow:', error);
      throw error;
    }
  }

  async releaseEscrow(deliveryRequestId, partnerId) {
    try {
      // Get escrow record
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_holds')
        .select('*')
        .eq('delivery_id', deliveryRequestId)
        .eq('status', 'held')
        .single();

      if (escrowError || !escrow) {
        throw new Error('Escrow record not found');
      }

      // Credit partner wallet
      await this.creditWallet(
        partnerId,
        escrow.partner_payout,
        'carrier_payout',
        `Payment for delivery ${deliveryRequestId}`,
        deliveryRequestId
      );

      // Update escrow status
      const { error: updateError } = await supabase
        .from('escrow_holds')
        .update({ 
          status: 'released',
          released_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

      if (updateError) throw updateError;

      return escrow;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      throw error;
    }
  }

  async deductCommission(partnerId, amount, deliveryRequestId) {
    try {
      return await this.debitWallet(
        partnerId,
        amount,
        'platform_fee',
        `Platform commission for COD delivery ${deliveryRequestId}`,
        deliveryRequestId
      );
    } catch (error) {
      console.error('Error deducting commission:', error);
      throw error;
    }
  }

  async refundEscrow(deliveryRequestId, buyerId) {
    try {
      // Get escrow record
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_holds')
        .select('*')
        .eq('delivery_id', deliveryRequestId)
        .eq('status', 'held')
        .single();

      if (escrowError || !escrow) {
        throw new Error('Escrow record not found');
      }

      // Refund buyer wallet
      await this.creditWallet(
        buyerId,
        escrow.amount,
        'refund',
        `Refund for delivery ${deliveryRequestId}`,
        deliveryRequestId
      );

      // Update escrow status
      const { error: updateError } = await supabase
        .from('escrow_holds')
        .update({ 
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

      if (updateError) throw updateError;

      return escrow;
    } catch (error) {
      console.error('Error refunding escrow:', error);
      throw error;
    }
  }

  async getWalletSummary(userId) {
    try {
      const [wallet, transactions] = await Promise.all([
        this.getWallet(userId),
        this.getTransactions(userId, 100)
      ]);

      // Calculate summary stats
      const totalCredits = transactions
        .filter(t => ['deposit', 'carrier_payout', 'refund', 'bonus'].includes(t.type))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalDebits = transactions
        .filter(t => ['withdrawal', 'escrow_hold', 'platform_fee'].includes(t.type))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const recentTransactions = transactions.slice(0, 10);

      return {
        wallet,
        balance: parseFloat(wallet.balance || 0),
        totalCredits,
        totalDebits,
        recentTransactions
      };
    } catch (error) {
      console.error('Error getting wallet summary:', error);
      throw error;
    }
  }
  async getPartnerEarnings(userId) {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'partner_payout')
        .eq('status', 'completed');

      if (error) throw error;

      const totalEarnings = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyEarnings = transactions
        .filter(t => {
          const date = new Date(t.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        total_earnings: totalEarnings,
        monthly_earnings: monthlyEarnings,
        payout_count: transactions.length,
        transactions: transactions.slice(0, 50)
      };
    } catch (error) {
      console.error('Error fetching partner earnings:', error);
      throw error;
    }
  }
}

module.exports = new WalletService();
