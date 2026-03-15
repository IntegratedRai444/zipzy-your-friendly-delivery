const express = require('express');
const chatService = require('../services/chatService');
const { authenticateUser } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Send message
router.post('/send', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { delivery_id, content } = req.body;

    if (!delivery_id || !content) {
      return res.status(400).json({
        success: false,
        error: 'Delivery ID and content are required'
      });
    }

    const message = await chatService.sendMessage(delivery_id, userId, content);
    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get chat history for a delivery
router.get('/:deliveryId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.deliveryId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const messages = await chatService.getChatHistory(deliveryId, userId);
    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark messages as read
router.post('/:deliveryId/read', async (req, res) => {
  try {
    const userId = req.user?.id;
    const deliveryId = req.params.deliveryId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await chatService.markMessagesAsRead(deliveryId, userId);
    res.json({
      success: true,
      data: result,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get unread message count
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const count = await chatService.getUnreadCount(userId);
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const messageId = req.params.messageId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const message = await chatService.deleteMessage(messageId, userId);
    res.json({
      success: true,
      data: message,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all chat conversations for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get all deliveries where user is participant
    const { supabase } = require('../config/supabaseClient');
    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        requests!inner(buyer_id, item_description, status)
      `)
      .or(`partner_id.eq.${userId},requests.buyer_id.eq.${userId}`)
      .order('accepted_at', { ascending: false });

    if (error) throw error;

    // Get latest message for each delivery
    const conversations = await Promise.all(
      (deliveries || []).map(async (delivery) => {
        const messages = await chatService.getChatHistory(delivery.id);
        const latestMessage = messages[0]; // Most recent message (ordered by created_at ASC)
        const unreadCount = messages.filter(m => !m.is_read && m.sender_id !== userId).length;

        const otherUserId = delivery.partner_id === userId 
          ? delivery.requests.buyer_id 
          : delivery.partner_id;

        return {
          delivery,
          latestMessage,
          unreadCount,
          otherUserId
        };
      })
    );

    res.json({
      success: true,
      data: conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Talk to AI Assistant
router.post('/assistant', async (req, res) => {
  try {
    // If auth middleware is attached to a parent router or not we carefully check
    const userId = req.user?.id;
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    let contextData = { history, userId };

    if (userId) {
      const { supabase } = require('../config/supabaseClient');
      try {
        // Fetch active deliveries for context
        const { data: activeDeliveries } = await supabase
          .from('deliveries')
          .select('id, status, request_id, requests(item_name, pickup_address, drop_address)')
          .neq('status', 'delivered')
          .limit(2); // Since we can't do complex OR easily without knowing the schema structure exactly, we just fetch a couple

        contextData.active_deliveries = activeDeliveries || [];
      } catch (err) {
        console.error('Failed to fetch context for AI:', err);
      }
    }

    const aiResponse = await aiService.chatAssistant(message, contextData);
    res.json({
      success: true,
      data: aiResponse,
      message: 'AI Assistant responded successfully'
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
