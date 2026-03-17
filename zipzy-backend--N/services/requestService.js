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
  item_value: Joi.number().min(0).allow(null).optional(),
  payment_method: Joi.string().valid('cod', 'wallet', 'online').default('wallet')
});

class RequestService {
  async createRequest(requestData) {
    // 1. Use the user-supplied reward (partner earning) directly.
    //    Never hardcode or cap it — the user knows what they want to offer.
    const reward = parseFloat(requestData.reward) || 0;

    // 2. Platform fee = 10% of the delivery reward (our commission).
    const platform_fee = parseFloat((reward * 0.10).toFixed(2));

    // 3. Total price the buyer pays = reward + platform_fee.
    //    (item_value is handled separately at proof-of-purchase stage)
    const total_price = parseFloat((reward + platform_fee).toFixed(2));

    // Preserve estimated_price as item_value for DB schema compatibility
    const estimated_price = parseFloat(requestData.item_value || 0);

    console.log('[createRequest] Pricing:', { reward, platform_fee, total_price });

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
      // We map "created" to "pending" to match existing DB enums
      const statusToInsert = value.payment_method === 'online' ? 'pending' : 'pending';

      const { data, error } = await supabase
        .from('requests')
        .insert([{
          ...value,
          status: statusToInsert,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // 4. Hold escrow (only for Wallet payments)
      if (data.total_price > 0 && data.payment_method === 'wallet') {
        try {
          await walletService.holdEscrow(data.buyer_id, data.total_price, data.id);
        } catch (walletError) {
          console.error('Escrow hold failed for request:', data.id, walletError);
          await supabase.from('requests').delete().eq('id', data.id);
          throw new Error(`Payment failed: ${walletError.message}. Please check your wallet balance.`);
        }
      }

      // Broadcast real-time event: request_created
      this.broadcastEvent('request_created', { request: data });

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
        .select(`
          *,
          partner:accepted_by (
            name
          ),
          deliveries (
            *
          )
        `)
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

  async broadcastEvent(event, payload) {
    try {
      await supabase.channel('realtime-updates').send({
        type: 'broadcast',
        event,
        payload
      });
      console.log(`Broadcasted: ${event}`);
    } catch (err) {
      console.error('Real-time broadcast failed:', err);
    }
  }
}

module.exports = new RequestService();
