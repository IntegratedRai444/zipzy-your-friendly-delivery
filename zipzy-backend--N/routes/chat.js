const express = require('express');
const chatService = require('../services/chatService');
const { authenticateUser } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Get chat messages for a request
router.get('/messages/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user is participant in the request
    const isParticipant = await chatService.isUserParticipant(requestId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this request'
      });
    }

    const messages = await chatService.getMessages(requestId);
    
    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a message in chat
router.post('/messages/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;
    const userRole = await chatService.getUserRoleInRequest(requestId, userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this request'
      });
    }

    const senderName = userRole === 'buyer' ? 'Buyer' : 'Partner';
    
    const message = await chatService.sendMessage(
      requestId, 
      userId, 
      senderName, 
      content
    );

    res.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
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
