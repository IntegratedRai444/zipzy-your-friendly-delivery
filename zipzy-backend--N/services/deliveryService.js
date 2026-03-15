const { supabase } = require('../config/supabaseClient');
const Joi = require('joi');
const walletService = require('./walletService');
const aiService = require('./aiService');

// Validation schemas
const acceptRequestSchema = Joi.object({
  request_id: Joi.string().uuid().required(),
  partner_id: Joi.string().uuid().required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('assigned', 'arriving_pickup', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled').required(),
  notes: Joi.string().max(500).allow('').optional()
});

class DeliveryService {
  async acceptRequest(requestId, partnerId) {
    // Validate input
    const { error, value } = acceptRequestSchema.validate({ request_id: requestId, partner_id: partnerId });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      // Check if request exists and is pending
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending')
        .single();

      if (requestError || !request) {
        throw new Error('Request not found or already taken');
      }

      // Create delivery record
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert([{
          request_id: requestId,
          partner_id: partnerId,
          status: 'assigned',
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      // Update request status
      const { error: updateError } = await supabase
        .from('requests')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;
      
      // Create escrow hold record for this delivery
      const { error: escrowError } = await supabase
        .from('escrow_holds')
        .insert([{
          delivery_id: delivery.id,
          sender_id: request.buyer_id,
          partner_id: partnerId,
          amount: request.total_price,
          platform_fee: request.reward * 0.20,
          partner_payout: request.estimated_price + (request.reward * 0.80),
          status: 'held',
          held_at: new Date().toISOString()
        }]);

      if (escrowError) {
        console.error('Failed to create escrow record:', escrowError);
      }

      // Generate OTPs for pickup and drop
      await this.generateOTPs(delivery.id);

      return { delivery, request };
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  }

  async generateOTPs(deliveryId) {
    const pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
    const dropOTP = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          pickup_otp: pickupOTP,
          drop_otp: dropOTP
        })
        .eq('id', deliveryId);

      if (error) throw error;
      return { pickupOTP, dropOTP };
    } catch (error) {
      console.error('Error generating OTPs:', error);
      throw error;
    }
  }

  async updateDeliveryStatus(deliveryId, status, partnerId, notes = '') {
    // Validate input
    const { error, value } = updateStatusSchema.validate({ status, notes });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      // Get delivery with request details
      const { data: delivery, error: fetchError } = await supabase
        .from('deliveries')
        .select(`
          *,
          requests (*)
        `)
        .eq('id', deliveryId)
        .eq('partner_id', partnerId)
        .single();

      if (fetchError || !delivery) {
        throw new Error('Delivery not found or unauthorized');
      }

      // Update delivery status
      const updateData = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { data: updatedDelivery, error: updateError } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Also update request status using mapping
      const requestStatusMap = {
        'assigned': 'accepted',
        'arriving_pickup': 'accepted',
        'picked_up': 'picked_up',
        'in_transit': 'in_transit',
        'delivered': 'delivered',
        'completed': 'delivered',
        'cancelled': 'cancelled'
      };

      await supabase
        .from('requests')
        .update({ 
          status: requestStatusMap[status] || status,
          updated_at: new Date().toISOString()
        })
        .eq('id', delivery.request_id);

      // If delivered, release escrow to partner. If cancelled, refund to buyer.
      if (status === 'delivered') {
        try {
          await walletService.releaseEscrow(deliveryId, delivery.partner_id);
        } catch (walletError) {
          console.error('Wallet release failed on status update:', walletError);
        }
      } else if (status === 'cancelled') {
        try {
          await walletService.refundEscrow(deliveryId, delivery.requests?.buyer_id);
        } catch (walletError) {
          console.error('Wallet refund failed on status update:', walletError);
        }
      }

      return { delivery: updatedDelivery, request: delivery.requests };
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }



  async getPartnerDeliveries(partnerId) {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          requests (*)
        `)
        .eq('partner_id', partnerId)
        .order('accepted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching partner deliveries:', error);
      throw error;
    }
  }

  async getDeliveryById(deliveryId, userId = null) {
    try {
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          requests (*)
        `)
        .eq('id', deliveryId);

      // If userId provided, ensure user is partner or buyer
      if (userId) {
        query = query.or(`partner_id.eq.${userId},requests.buyer_id.eq.${userId}`);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery:', error);
      throw error;
    }
  }

  async verifyOTP(deliveryId, otp, type) {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          requests (*)
        `)
        .eq('id', deliveryId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Delivery not found');

      const storedOTP = type === 'pickup' ? data.pickup_otp : data.drop_otp;
      
      if (storedOTP === otp) {
        // Clear OTP after successful verification
        const updateData = {};
        if (type === 'pickup') {
          updateData.pickup_otp = null;
          // Update status to picked_up
          updateData.status = 'picked_up';
          updateData.picked_up_at = new Date().toISOString();
        } else if (type === 'drop') {
          updateData.drop_otp = null;
          // Update status to delivered
          updateData.status = 'delivered';
          updateData.delivered_at = new Date().toISOString();
        }

        const { data: updatedDelivery, error: updateError } = await supabase
          .from('deliveries')
          .update(updateData)
          .eq('id', deliveryId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Also update request status using mapping
        const requestStatusMap = {
          'assigned': 'accepted',
          'arriving_pickup': 'accepted',
          'picked_up': 'picked_up',
          'in_transit': 'in_transit',
          'delivered': 'delivered',
          'completed': 'delivered',
          'cancelled': 'cancelled'
        };

        await supabase
          .from('requests')
          .update({ 
            status: requestStatusMap[updateData.status] || updateData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.request_id);

        // If delivered, release escrow to partner
        if (type === 'drop') {
          try {
            await walletService.releaseEscrow(deliveryId, data.partner_id);
          } catch (walletError) {
            console.error('Wallet release failed on OTP verify:', walletError);
          }
        }

        return { success: true, delivery: updatedDelivery };
      } else {
        return { success: false, error: 'Invalid OTP' };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async updateLocation(deliveryId, partnerId, latitude, longitude) {
    try {
      // Verify delivery belongs to partner
      const { data: delivery, error: verifyError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .eq('partner_id', partnerId)
        .single();

      if (verifyError || !delivery) {
        throw new Error('Delivery not found or unauthorized');
      }

      // Insert location tracking
      const { data, error } = await supabase
        .from('partner_locations')
        .insert([{
          partner_id: partnerId,
          delivery_request_id: deliveryId,
          latitude,
          longitude,
          is_online: true,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async findPartnersForRequest(requestId) {
    try {
      // 1. Get request details
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (requestError) throw requestError;

      // 2. Get all online partners
      const { data: partners, error: partnersError } = await supabase
        .from('partner_locations')
        .select(`
          *,
          users (*)
        `)
        .eq('is_online', true);

      if (partnersError) throw partnersError;

      // 3. Call AI Service to rank partners
      const rankingResult = await aiService.matchPartners({
        request: request,
        partners: partners
      });

      return rankingResult;
    } catch (error) {
      console.error('Error finding partners for request:', error);
      throw error;
    }
  }

  async submitRating(deliveryId, fromUserId, toUserId, raterRole, ratingValue, reviewText) {
    try {
      // 1. Store rating
      const { data: rating, error } = await supabase
        .from('ratings')
        .insert([{
          delivery_id: deliveryId,
          from_user: fromUserId,
          to_user: toUserId,
          rater_role: raterRole,
          rating: ratingValue,
          review: reviewText,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Update trust score via AI Service
      // First get user metrics from trust_scores table
      const { data: currentTrust, error: trustError } = await supabase
        .from('trust_scores')
        .select('*')
        .eq('user_id', toUserId)
        .single();

      if (!trustError && currentTrust) {
        const aiTrust = await aiService.getTrustScore(toUserId, {
          deliveries_completed: currentTrust.completed_deliveries,
          deliveries_cancelled: currentTrust.cancelled_deliveries,
          average_rating: currentTrust.avg_rating_as_partner,
          complaints: currentTrust.flags_received,
          last_rating: ratingValue
        });

        if (aiTrust) {
          await supabase
            .from('trust_scores')
            .update({
              score: aiTrust.trust_score,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', toUserId);
        }
      }

      return rating;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }
  async submitProof(deliveryId, partnerId, actualItemPrice, proofUrl) {
    try {
      // 1. Get delivery with request details
      const { data: delivery, error: fetchError } = await supabase
        .from('deliveries')
        .select(`
          *,
          requests (*)
        `)
        .eq('id', deliveryId)
        .eq('partner_id', partnerId)
        .single();

      if (fetchError || !delivery) {
        throw new Error('Delivery not found or unauthorized');
      }

      // 2. Recalculate final billing
      const reward = delivery.requests.reward;
      const platformFee = delivery.requests.platform_fee;
      const finalTotal = parseFloat(actualItemPrice) + parseFloat(reward) + parseFloat(platformFee);

      // 3. Update delivery record
      const { data: updatedDelivery, error: updateError } = await supabase
        .from('deliveries')
        .update({
          purchase_proof_url: proofUrl,
          purchase_proof_uploaded_at: new Date().toISOString(),
          status: 'in_transit' // Move to transit after proof upload
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 4. Update request record with final billing
      const { error: requestUpdateError } = await supabase
        .from('requests')
        .update({
          item_value: actualItemPrice, // Using item_value as actual_item_price
          total_price: finalTotal,      // Final total
          status: 'in_transit',          // Transit to in_transit
          updated_at: new Date().toISOString()
        })
        .eq('id', delivery.request_id);

      if (requestUpdateError) throw requestUpdateError;

      // 5. Update escrow hold record with final amounts
      const { error: escrowUpdateError } = await supabase
        .from('escrow_holds')
        .update({
          amount: finalTotal,
          platform_fee: platformFee,
          partner_payout: parseFloat(actualItemPrice) + (parseFloat(reward) - parseFloat(platformFee)),
          updated_at: new Date().toISOString()
        })
        .eq('delivery_id', deliveryId);

      if (escrowUpdateError) {
        console.error('Failed to update escrow record with final price:', escrowUpdateError);
      }

      return {
        delivery: updatedDelivery,
        billing: {
          actual_item_price: actualItemPrice,
          delivery_reward: reward,
          platform_fee: platformFee,
          final_total: finalTotal
        }
      };
    } catch (error) {
      console.error('Error submitting proof:', error);
      throw error;
    }
  }
}

module.exports = new DeliveryService();
