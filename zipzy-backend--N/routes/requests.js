const express = require('express');
const requestService = require('../services/requestService');
const deliveryService = require('../services/deliveryService');
const aiService = require('../services/aiService');
const { authenticateUser, checkUserSafety } = require('../middleware/auth');

const router = express.Router();

// Safety guard for all request operations
router.use(authenticateUser, checkUserSafety);

// Create a new request
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let requestData = {
      ...req.body,
      buyer_id: userId
    };

    // 1. If raw message provided, Parse with AI first
    if (req.body.message && !requestData.item_name) {
      const parsedData = await aiService.parseRequest(req.body.message);
      if (!parsedData) {
        throw new Error('AI Service unavailable or failed to parse request');
      }
      
      const estimation = await aiService.estimatePrice(parsedData) || { suggested_price: 0, suggested_reward: 30 };
      requestData = {
        ...requestData,
        ...parsedData,
        estimated_price: estimation.suggested_price || 0,
        reward: estimation.suggested_reward || 30
      };
    }

    // 2. AI Fraud Check before creation
    const fraudResult = await aiService.checkFraud({
      user_behavior: {
        cancellation_rate: 0.1, 
        repeated_cancellations: 0,
        abnormal_wallet_transactions: 0,
        unusual_delivery_behavior: false,
        account_age_days: 30,
        verification_status: 'verified'
      },
      request_pattern: {
        item_name: requestData.item_name || 'Unknown',
        pickup_location: requestData.pickup_address || 'Unknown',
        drop_location: requestData.drop_address,
        reward: requestData.reward
      }
    });

    if (fraudResult && fraudResult.risk_level === 'HIGH') {
      return res.status(403).json({
        success: false,
        error: 'Request rejected by security system',
        reason: fraudResult.reason
      });
    }

    const request = await requestService.createRequest(requestData);

    // AI Partner Matching (Background Trigger)
    deliveryService.findPartnersForRequest(request.id).catch(err => {
      console.error('Error triggering partner matching:', err);
    });
    res.status(201).json({
      success: true,
      data: request,
      message: 'Request created successfully'
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Accept a request (partner accepts)
router.patch('/:id/accept', async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const request = await requestService.acceptRequest(requestId, userId);
    
    // Create delivery row for chat system
    try {
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          request_id: requestId,
          buyer_id: request.buyer_id, // Add buyer_id
          partner_id: userId,
          status: 'assigned',
          otp: null, // Will be generated later
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (deliveryError) {
        console.error('Error creating delivery:', deliveryError);
        throw deliveryError;
      }
      
      console.log('✅ Delivery created for chat system:', deliveryData);
      
      // Return both request and delivery data
      res.json({
        success: true,
        data: {
          request,
          delivery: deliveryData
        },
        message: 'Request accepted successfully. Chat is now open.'
      });
    } catch (deliveryError) {
      console.error('Delivery creation error:', deliveryError);
      res.status(500).json({
        success: false,
        error: deliveryError.message
      });
    }
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Generate OTP for delivery completion
router.post('/:requestId/generate-otp', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Get delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*')
      .eq('request_id', requestId)
      .eq('partner_id', userId)
      .single();

    if (deliveryError || !delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Update delivery with OTP
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({ 
        otp,
        status: 'in_progress' // Partner is now delivering
      })
      .eq('id', delivery.id);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: { otp: '****' }, // Mask OTP for security
      message: 'OTP generated successfully'
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify OTP for delivery completion
router.post('/:requestId/verify-otp', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { otp } = req.body;
    const userId = req.user.id;

    // Get delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*')
      .eq('request_id', requestId)
      .eq('partner_id', userId)
      .single();

    if (deliveryError || !delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    // Verify OTP
    if (delivery.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    // Mark delivery as completed
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', delivery.id);

    if (updateError) {
      throw updateError;
    }

    // Update request status
    const { error: requestUpdateError } = await supabase
      .from('requests')
      .update({ status: 'completed' })
      .eq('id', requestId);

    if (requestUpdateError) {
      throw requestUpdateError;
    }

    // Handle payment (placeholder for now)
    // TODO: Implement wallet credit, COD marking, etc.

    res.json({
      success: true,
      message: 'Delivery completed successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel request
router.patch('/:requestId/cancel', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Check if user can cancel (buyer or partner)
    if (request.buyer_id !== userId && request.partner_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if request can be cancelled
    if (request.status === 'completed' || request.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot cancel a completed or already cancelled request' 
      });
    }

    // Update request status to cancelled
    const { error: updateError } = await supabase
      .from('requests')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancellation_reason: reason || 'User cancelled'
      })
      .eq('id', requestId);

    if (updateError) {
      throw updateError;
    }

    // Update delivery status if exists
    if (request.partner_id) {
      await supabase
        .from('deliveries')
        .update({ status: 'cancelled' })
        .eq('request_id', requestId);
    }

    // Handle escrow refund if wallet payment
    if (request.payment_method === 'wallet' && request.total_price > 0) {
      // TODO: Implement wallet refund logic
      console.log('Should refund wallet for cancelled request:', request.total_price);
    }

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Parse Request (Natural Language to Structured Data)
router.post('/parse', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const parsedData = await aiService.parseRequest(message);
    res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Backend strictly controls pricing
router.post('/estimate', async (req, res) => {
  try {
    const pricingData = req.body;
    // Get distance from AI
    const apiResponse = await aiService.estimatePrice(pricingData) || {};
    const distance_km = apiResponse.distance_km || 1.5;

    let distance_based_value = Math.round(distance_km * 8); // Match requestService per_km_rate
    if (distance_based_value < 25) distance_based_value = 25; // Match requestService base_fee
    if (distance_based_value > 30) distance_based_value = 30; // Keep existing cap for now

    const delivery_charge = 25 + (distance_km * 8); // New pricing model
    delivery_charge = Math.max(25, delivery_charge); // Ensure minimum

    // Platform fee: small flat fee based on delivery charge
    let platform_fee;
    if (delivery_charge < 40) {
      platform_fee = 5;
    } else {
      platform_fee = 7;
    }

    const item_price = pricingData.item_value || 0;
    const total_price = item_price + delivery_charge + platform_fee;

    res.json({
      success: true,
      data: {
        distance_km,
        reward: delivery_charge, // Partner earns delivery charge
        platform_fee,
        total_price,
        item_price
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available requests for partners
router.get('/available', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const requests = await requestService.getAvailableRequests(userId);
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Get available requests error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's own requests
router.get('/my', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const requests = await requestService.getUserRequests(userId);
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific request details
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const requestId = req.params.id;

    // For now, we'll use a simple approach - in production, add proper authorization
    const { supabase } = require('../config/supabaseClient');
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update request status
router.patch('/:id/status', async (req, res) => {
  try {
    const userId = req.user?.id;
    const requestId = req.params.id;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const request = await requestService.updateRequestStatus(requestId, status, userId);
    res.json({
      success: true,
      data: request,
      message: 'Request status updated successfully'
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Generate OTP for request
router.post('/:id/otp', async (req, res) => {
  try {
    const userId = req.user?.id;
    const requestId = req.params.id;
    const { type } = req.body; // 'pickup' or 'drop'

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['pickup', 'drop'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP type. Must be "pickup" or "drop"'
      });
    }

    const result = await requestService.generateOTP(requestId, type);
    res.json({
      success: true,
      data: result.data,
      otp: result.otp, // In production, don't return OTP in response
      message: `${type} OTP generated successfully`
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify OTP for request
router.post('/:id/otp/verify', async (req, res) => {
  try {
    const userId = req.user?.id;
    const requestId = req.params.id;
    const { otp, type } = req.body; // 'pickup' or 'drop'

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['pickup', 'drop'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP type. Must be "pickup" or "drop"'
      });
    }

    const result = await requestService.verifyOTP(requestId, otp, type);
    
    if (result.success) {
      res.json({
        success: true,
        message: `${type} OTP verified successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get AI Demand Heatmap Insights
router.get('/heatmap', async (req, res) => {
  try {
    const { hours } = req.query;
    
    // Get demand analytics from AI Service
    const heatmapData = await aiService.getDemandHeatmap(parseInt(hours) || 24);
    
    res.json({
      success: true,
      data: heatmapData,
      message: 'Demand heatmap insights retrieved successfully'
    });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
