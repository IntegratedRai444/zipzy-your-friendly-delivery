const express = require('express');
const requestService = require('../services/requestService');
const { authenticateUser, checkUserSafety } = require('../middleware/auth');
const aiService = require('../services/aiService');
const deliveryService = require('../services/deliveryService');

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

    let distance_based_value = Math.round(distance_km * 10);
    if (distance_based_value < 10) distance_based_value = 10;
    if (distance_based_value > 30) distance_based_value = 30;

    const reward = distance_based_value;
    const platform_fee = Math.round(reward * 0.20);
    const item_price = pricingData.item_value || 0;
    const total_price = item_price + reward + platform_fee;

    res.json({
      success: true,
      data: {
        distance_km,
        reward,
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
