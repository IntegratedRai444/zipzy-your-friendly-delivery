const express = require('express');
const { supabase } = require('../config/supabaseClient');
const deliveryService = require('../services/deliveryService');
const { authenticateUser, checkUserSafety } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Safety guard for all delivery operations
router.use(authenticateUser, checkUserSafety);

// Get delivery by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: delivery, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        requests:requests!inner(
          *,
          users:users!inner(
            id,
            full_name,
            email
          ),
          partner_users:users!inner(
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Delivery fetch error:', error);
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    // Check if user is part of this delivery
    if (delivery.buyer_id !== userId && delivery.partner_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get delivery by request ID (for chat system)
router.get('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const delivery = await deliveryService.getDeliveryByRequestId(requestId);
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Check if user is authorized (buyer or partner)
    const isBuyer = delivery.requests?.buyer_id === userId;
    const isPartner = delivery.partner_id === userId;

    if (!isBuyer && !isPartner) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept a request (create delivery)
router.post('/accept', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { request_id } = req.body;
    if (!request_id) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    const result = await deliveryService.acceptRequest(request_id, userId);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Request accepted successfully'
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update delivery status
router.patch('/:id/status', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.id;
    const { status, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await deliveryService.updateDeliveryStatus(deliveryId, status, userId, notes);
    res.json({
      success: true,
      data: result,
      message: 'Delivery status updated successfully'
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get partner's deliveries
router.get('/my', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const deliveries = await deliveryService.getPartnerDeliveries(userId);
    
    // Separate active and completed deliveries
    const activeDeliveries = deliveries.filter(
      d => !['delivered', 'cancelled'].includes(d.status || '')
    );
    const completedDeliveries = deliveries.filter(
      d => ['delivered', 'cancelled'].includes(d.status || '')
    );

    res.json({
      success: true,
      data: {
        deliveries,
        activeDeliveries,
        completedDeliveries,
        total: deliveries.length,
        active: activeDeliveries.length,
        completed: completedDeliveries.length
      }
    });
  } catch (error) {
    console.error('Get partner deliveries error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific delivery details
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const delivery = await deliveryService.getDeliveryById(deliveryId, userId);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update partner location (for tracking)
router.post('/:id/location', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.id;
    const { latitude, longitude, location: geoJsonLocation } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Support both direct lat/lng and GeoJSON location
    const lat = latitude || geoJsonLocation?.coordinates?.[1];
    const lng = longitude || geoJsonLocation?.coordinates?.[0];

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Location coordinates are required'
      });
    }

    const location = await deliveryService.updateLocation(deliveryId, userId, lat, lng);
    res.status(201).json({
      success: true,
      data: location,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get delivery tracking history
router.get('/:id/tracking', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify delivery access
    const delivery = await deliveryService.getDeliveryById(deliveryId, userId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found or unauthorized'
      });
    }

    // Get location history
    const { supabase } = require('../config/supabaseClient');
    const { data, error } = await supabase
      .from('partner_locations')
      .select('*')
      .eq('delivery_request_id', deliveryId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify OTP for delivery
router.post('/:id/otp/verify', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.id;
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

    const result = await deliveryService.verifyOTP(deliveryId, otp, type);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.delivery,
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

// Cancel delivery
router.patch('/:id/cancel', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.id;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await deliveryService.updateDeliveryStatus(deliveryId, 'cancelled', userId, reason);
    res.json({
      success: true,
      data: result,
      message: 'Delivery cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel delivery error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get AI ETA prediction for delivery
router.get('/:id/eta', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const delivery = await deliveryService.getDeliveryById(deliveryId, userId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found or unauthorized'
      });
    }

    // Get current partner location
    const { supabase } = require('../config/supabaseClient');
    const { data: location } = await supabase
      .from('partner_locations')
      .select('*')
      .eq('partner_id', delivery.partner_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const etaResult = await aiService.predictETA({
      pickup_location: delivery.requests.pickup_address,
      drop_location: delivery.requests.drop_address,
      current_location: location?.location ? `${location.location.coordinates[1]},${location.location.coordinates[0]}` : null,
      partner_id: delivery.partner_id
    });

    res.json({
      success: true,
      data: etaResult,
      message: 'ETA predicted successfully'
    });
  } catch (error) {
    console.error('Predict ETA error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload purchase proof and set actual price (Stage 4 Billing)
router.post('/:id/proof', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.id;
    const { actual_item_price, purchase_proof_url } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!actual_item_price || !purchase_proof_url) {
      return res.status(400).json({
        success: false,
        error: 'Actual price and purchase proof URL are required'
      });
    }

    const result = await deliveryService.submitProof(deliveryId, userId, actual_item_price, purchase_proof_url);
    res.json({
      success: true,
      data: result,
      message: 'Purchase proof and price submitted successfully'
    });
  } catch (error) {
    console.error('Submit proof error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
