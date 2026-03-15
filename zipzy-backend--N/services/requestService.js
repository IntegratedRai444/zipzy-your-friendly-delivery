const { supabase } = require('../config/supabaseClient');
const Joi = require('joi');
const walletService = require('./walletService');

// Validation schemas
const createRequestSchema = Joi.object({
  buyer_id: Joi.string().uuid().required(),
  item_name: Joi.string().min(1).max(200).required(),
  item_description: Joi.string().min(1).max(1000).required(),
  pickup_address: Joi.string().min(5).required(),
  pickup_city: Joi.string().min(2).required(),
  drop_address: Joi.string().min(5).required(),
  drop_city: Joi.string().min(2).required(),
  drop_notes: Joi.string().max(500).allow('').optional(),
  urgency: Joi.string().valid('flexible', 'today', 'scheduled', 'urgent').default('flexible'),
  item_size: Joi.string().valid('small', 'medium', 'large', 'extra_large').default('small'),
  estimated_price: Joi.number().min(0).default(0),
  reward: Joi.number().min(0).required(),
  platform_fee: Joi.number().min(0).default(0),
  total_price: Joi.number().min(0).default(0),
  preferred_date: Joi.string().isoDate().allow(null).optional(),
  weight: Joi.number().min(0).allow(null).optional(),
  item_value: Joi.number().min(0).allow(null).optional()
});

class RequestService {
  async createRequest(requestData) {
    // 1. Ensure reward is based on distance and capped between ₹10–₹30
    const distance_km = requestData.distance_km || 1.5; // Default distance if not provided
    let distance_based_value = Math.round(distance_km * 10);

    // Apply strict caps
    if (distance_based_value < 10) distance_based_value = 10;
    if (distance_based_value > 30) distance_based_value = 30;

    const reward = distance_based_value;
    const platform_fee = Math.round(reward * 0.20); // 20% commission
    const item_price = requestData.item_value || 0;
    const total_price = item_price + reward + platform_fee;

    // We no longer use 'estimated_price' for the base item unless it's the item_price itself, 
    // but we can preserve it to not break DB schema. We'll set estimated_price as item_price.
    const estimated_price = item_price;

    const enrichedData = {
      ...requestData,
      reward,
      platform_fee,
      estimated_price,
      total_price
    };

    // 2. Validate input
    const { error, value } = createRequestSchema.validate(enrichedData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      // 3. Create the request
      const { data, error } = await supabase
        .from('requests')
        .insert([{
          ...value,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // 4. Hold escrow (Total Estimated Price)
      if (data.total_price > 0) {
        try {
          await walletService.holdEscrow(data.buyer_id, data.total_price, data.id);
        } catch (walletError) {
          console.error('Escrow hold failed for request:', data.id, walletError);
          await supabase.from('requests').delete().eq('id', data.id);
          throw new Error(`Payment failed: ${walletError.message}. Please check your wallet balance.`);
        }
      }

      return data;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  async getAvailableRequests(userId) {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'pending')
        .neq('buyer_id', userId) // Don't show user's own requests
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available requests:', error);
      throw error;
    }
  }

  async getUserRequests(userId) {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user requests:', error);
      throw error;
    }
  }

  async updateRequestStatus(requestId, status, userId = null) {
    try {
      let query = supabase
        .from('requests')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      // If userId provided, ensure user owns the request
      if (userId) {
        query = query.eq('buyer_id', userId);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;

      // If cancelled, refund escrow
      if (status === 'cancelled') {
        try {
          await walletService.refundEscrow(data.id, data.buyer_id);
        } catch (walletError) {
          console.error('Wallet refund failed on request cancellation:', walletError);
        }
      }

      return data;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }
}

module.exports = new RequestService();
