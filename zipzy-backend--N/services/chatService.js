const { supabase } = require('../config/supabaseClient');
const Joi = require('joi');

// Validation schemas
const sendMessageSchema = Joi.object({
  request_id: Joi.string().uuid().required(),
  sender_id: Joi.string().uuid().required(),
  content: Joi.string().min(1).max(1000).required()
});

class ChatService {
  async getMessages(requestId) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Chat service error:', error);
      return [];
    }
  }

  async sendMessage(requestId, senderId, senderName, content) {
    // Validate input
    const { error, value } = sendMessageSchema.validate({ 
      request_id: requestId, 
      sender_id: senderId, 
      content: content 
    });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          request_id: requestId,
          sender_id: senderId,
          sender_name: senderName,
          content: content.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log(` Message sent in chat for request ${requestId}:`, data);
      return data;
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }

  async subscribeToChat(requestId, onNewMessage) {
    try {
      const subscription = await supabase
        .channel(`request_chat_${requestId}`)
        .on('postgres_changes', { 
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `request_id=eq.${requestId}`
        }, (payload) => {
          if (payload.new) {
            console.log(' New message received:', payload.new);
            onNewMessage(payload.new);
          }
        });

      console.log(` Subscribed to chat for request ${requestId}`);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to chat:', error);
      return null;
    }
  }

  unsubscribeFromChat(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
      console.log(' Unsubscribed from chat');
    }
  }

  // Get user's role in a request (buyer or partner)
  async getUserRoleInRequest(requestId, userId) {
    try {
      const { data: request, error } = await supabase
        .from('requests')
        .select('buyer_id')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching request:', error);
        return null;
      }

      const isBuyer = request.buyer_id === userId;
      return isBuyer ? 'buyer' : 'partner';
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Check if user is participant in the request
  async isUserParticipant(requestId, userId) {
    try {
      const { data: request, error } = await supabase
        .from('requests')
        .select('buyer_id')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching request:', error);
        return false;
      }

      return request.buyer_id === userId;
    } catch (error) {
      console.error('Error checking participation:', error);
      return false;
    }
  }
}

module.exports = new ChatService();
