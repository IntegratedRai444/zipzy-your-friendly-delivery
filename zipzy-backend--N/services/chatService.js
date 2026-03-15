const { supabase } = require('../config/supabaseClient');
const Joi = require('joi');

// Validation schemas
const sendMessageSchema = Joi.object({
  delivery_id: Joi.string().uuid().required(),
  sender_id: Joi.string().uuid().required(),
  content: Joi.string().min(1).max(1000).required()
});

class ChatService {
  async sendMessage(deliveryId, senderId, content) {
    // Validate input
    const { error, value } = sendMessageSchema.validate({ 
      delivery_id: deliveryId, 
      sender_id: senderId, 
      content 
    });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      // Verify delivery exists and user is participant
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .select(`
          *,
          requests (buyer_id)
        `)
        .eq('id', deliveryId)
        .single();

      if (deliveryError || !delivery) {
        throw new Error('Delivery not found');
      }

      // Check if user is partner or buyer
      const isParticipant = delivery.partner_id === senderId || delivery.requests.buyer_id === senderId;
      if (!isParticipant) {
        throw new Error('Unauthorized to send message to this delivery');
      }

      // Create message
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          delivery_request_id: deliveryId, // Use correct field name
          sender_id: senderId,
          content: content, // Use correct field name
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Create notification for recipient
      const recipientId = delivery.partner_id === senderId 
        ? delivery.requests.buyer_id 
        : delivery.partner_id;

      await this.createMessageNotification(recipientId, deliveryId, content);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getChatHistory(deliveryId, userId = null) {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('delivery_request_id', deliveryId) // Note: Schema uses delivery_request_id
        .order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  async markMessagesAsRead(deliveryId, userId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('delivery_request_id', deliveryId) // Use correct field name
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      // Get deliveries where user is participant
      const { data: deliveries, error: deliveryError } = await supabase
        .from('deliveries')
        .select('id, partner_id, requests!inner(buyer_id)')
        .or(`partner_id.eq.${userId},requests.buyer_id.eq.${userId}`);

      if (deliveryError) throw deliveryError;

      const deliveryIds = deliveries?.map(d => d.id) || [];

      if (deliveryIds.length === 0) {
        return 0;
      }

      // Count unread messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('delivery_request_id', deliveryIds[0]) // Use correct field name
        .order('created_at', { ascending: true })
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return (data || []).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  async createMessageNotification(recipientId, deliveryId, messageContent) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: recipientId,
          title: 'New Message',
          body: messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent,
          type: 'message',
          data: {
            delivery_id: deliveryId,
            message_content: messageContent
          },
          is_read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating message notification:', error);
      // Don't throw - notification failure shouldn't break message sending
    }
  }

  async deleteMessage(messageId, userId) {
    try {
      // Verify message belongs to user
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('sender_id', userId)
        .single();

      if (fetchError || !message) {
        throw new Error('Message not found or unauthorized');
      }

      // Delete message (or mark as deleted if you want soft delete)
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
