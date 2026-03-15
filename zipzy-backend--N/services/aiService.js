const axios = require('axios');

class AIService {
  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/ai';
  }

  async parseRequest(message) {
    try {
      const response = await axios.post(`${this.baseUrl}/parse-request`, { message });
      return response.data;
    } catch (error) {
      console.error('Error in AI parse-request:', error.message);
      return null;
    }
  }

  async matchPartners(requestData) {
    try {
      const response = await axios.post(`${this.baseUrl}/match-partners`, requestData);
      return response.data;
    } catch (error) {
      console.error('Error in AI match-partners:', error.message);
      return null;
    }
  }

  async predictETA(pickupLoc, dropLoc, partnerSpeed = 0.1) {
    try {
      const response = await axios.post(`${this.baseUrl}/predict-eta`, {
        pickup_location: pickupLoc,
        drop_location: dropLoc,
        partner_speed: partnerSpeed
      });
      return response.data;
    } catch (error) {
      console.error('Error in AI predict-eta:', error.message);
      return null;
    }
  }

  async estimatePrice(pricingData) {
    try {
      const response = await axios.post(`${this.baseUrl}/estimate-price`, pricingData);
      return response.data;
    } catch (error) {
      console.error('Error in AI estimate-price:', error.message);
      return null;
    }
  }

  async checkFraud(fraudData) {
    try {
      const response = await axios.post(`${this.baseUrl}/fraud-check`, fraudData);
      return response.data;
    } catch (error) {
      console.error('Error in AI fraud-check:', error.message);
      return null;
    }
  }

  async getTrustScore(userId, factors) {
    try {
      const response = await axios.post(`${this.baseUrl}/trust-score`, {
        user_id: userId,
        factors: factors
      });
      return response.data;
    } catch (error) {
      console.error('Error in AI trust-score:', error.message);
      return null;
    }
  }

  async chatAssistant(message, context = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/chat-assistant`, {
        message: message,
        context: context
      });
      return response.data;
    } catch (error) {
      console.error('Error in AI chat-assistant:', error.message);
      return null;
    }
  }
}

module.exports = new AIService();
