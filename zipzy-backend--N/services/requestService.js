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
  payment_method: Joi.string().valid('wallet', 'cod', 'online').required()
});

class RequestService {
  async createRequest(requestData) {
    // 1. Ensure user exists in users table before creating request
    const { buyer_id } = requestData;
    
    try {
      // Check if user exists in users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', buyer_id)
        .maybeSingle();

      if (userCheckError) {
        console.error('Error checking user existence:', userCheckError);
        throw new Error('Failed to verify user');
      }

      // If user doesn't exist in users table, create them
      if (!existingUser) {
        console.log(`User ${buyer_id} not found in users table, creating...`);
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: buyer_id,
            created_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          throw new Error('Failed to create user profile');
        }
        
        console.log(`User ${buyer_id} created successfully in users table`);
      }
    } catch (error) {
      console.error('User verification error:', error);
      throw new Error(`User verification failed: ${error.message}`);
    }

    // 2. Calculate realistic delivery charges for campus gig platform
    const distance_km = requestData.distance_km || 1.5; // Default distance if not provided
    
    // New pricing model: base_fee + (distance_km × per_km_rate)
    const base_fee = 25;
    const per_km_rate = 8;
    let delivery_charge = base_fee + (distance_km * per_km_rate);
    
    // Ensure minimum delivery charge
    delivery_charge = Math.max(25, delivery_charge);

    // Platform fee: small flat fee based on delivery charge
    let platform_fee;
    if (delivery_charge < 40) {
      platform_fee = 5;
    } else {
      platform_fee = 7;
    }

    const item_price = requestData.item_value || 0;
    const total_price = item_price + delivery_charge + platform_fee;

    // Partner earns ONLY the delivery charge
    // Platform earns ONLY the platform fee
    const partner_earnings = delivery_charge;

    // We no longer use 'estimated_price' for the base item unless it's the item_price itself, 
    // but we can preserve it to not break DB schema. We'll set estimated_price as item_price.
    const estimated_price = item_price;

    const enrichedData = {
      ...requestData,
      reward: delivery_charge, // Partner earns ONLY the delivery charge
      platform_fee,
      estimated_price,
      total_price: item_price + delivery_charge + platform_fee
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
          status: 'pending', // Fix: Use 'pending' instead of 'open'
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Request insertion failed:', error);
        throw error;
      }

      console.log('✅ Request created successfully:', data);

      // 4. Hold escrow only if payment method is wallet
      const { payment_method } = value;
      
      if (payment_method === 'wallet' && data.total_price > 0) {
        try {
          await walletService.holdEscrow(data.buyer_id, data.total_price, data.id);
          console.log(`💳 Wallet payment: ${data.total_price} held in escrow for request ${data.id}`);
        } catch (walletError) {
          console.error('❌ Escrow hold failed for request:', data.id, walletError);
          console.log('🗑️ Deleting request due to payment failure...');
          await supabase.from('requests').delete().eq('id', data.id);
          throw new Error(`Payment failed: ${walletError.message}. Please check your wallet balance.`);
        }
      } else if (payment_method === 'cod') {
        console.log(`💵 COD request created for ${data.id} - no escrow hold required`);
      } else if (payment_method === 'online') {
        console.log(`🌐 Online payment request created for ${data.id} - payment to be processed`);
        // TODO: Integrate with payment gateway (Stripe/Razorpay)
      }

      return data;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  async acceptRequest(requestId, partnerId) {
    try {
      // Update request status to 'accepted' and assign partner
      const { data, error } = await supabase
        .from('requests')
        .update({
          status: 'accepted',
          partner_id: partnerId,
          accepted_by: partnerId, // Fix: Store who accepted the request
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select(`
          *,
          users!inner(email, full_name),
          partner_users!inner(email, full_name)
        `)
        .single();

      if (error) {
        console.error('Error accepting request:', error);
        throw error;
      }

      console.log(`✅ Request ${requestId} accepted by partner ${partnerId}`);
      
      // Create delivery row for chat system
      try {
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('deliveries')
          .insert({
            request_id: requestId,
            partner_id: partnerId,
            status: 'assigned',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (deliveryError) {
          console.error('Error creating delivery:', deliveryError);
        } else {
          console.log('✅ Delivery created for chat system:', deliveryData);
        }
      } catch (deliveryError) {
        console.error('Delivery creation error:', deliveryError);
      }
      
      // Create notification for buyer
      await this.createNotification(
        data.buyer_id,
        'Request Accepted!',
        `Your request has been accepted by ${data.partner_users?.full_name || 'a partner'}. Chat is now open.`,
        'request_accepted',
        {
          request_id: requestId,
          partner_id: partnerId,
          partner_name: data.partner_users?.full_name
        }
      );

      return data;
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  }

  async createNotification(userId, title, body, type, data = null) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          type,
          data,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Notification service error:', error);
    }
  }

  async getAvailableRequests(userId) {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'pending') // Fix: Use 'pending' for partner dashboard
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
