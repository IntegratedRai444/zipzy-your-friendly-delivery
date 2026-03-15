const express = require('express');
const walletService = require('../services/walletService');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Get wallet details
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const wallet = await walletService.getWallet(userId);
    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get wallet summary with transactions
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const summary = await walletService.getWalletSummary(userId);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get wallet summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const transactions = await walletService.getTransactions(userId, limit);
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Credit wallet (add money)
router.post('/credit', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { amount, type, description, delivery_request_id } = req.body;

    if (!amount || !type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Amount, type, and description are required'
      });
    }

    const result = await walletService.creditWallet(
      userId,
      parseFloat(amount),
      type,
      description,
      delivery_request_id
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Wallet credited successfully'
    });
  } catch (error) {
    console.error('Credit wallet error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Debit wallet (withdraw money)
router.post('/debit', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { amount, type, description, delivery_request_id } = req.body;

    if (!amount || !type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Amount, type, and description are required'
      });
    }

    const result = await walletService.debitWallet(
      userId,
      parseFloat(amount),
      type,
      description,
      delivery_request_id
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Wallet debited successfully'
    });
  } catch (error) {
    console.error('Debit wallet error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Hold escrow for delivery
router.post('/escrow/hold', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { amount, delivery_request_id } = req.body;

    if (!amount || !delivery_request_id) {
      return res.status(400).json({
        success: false,
        error: 'Amount and delivery request ID are required'
      });
    }

    const escrow = await walletService.holdEscrow(userId, parseFloat(amount), delivery_request_id);
    res.status(201).json({
      success: true,
      data: escrow,
      message: 'Escrow held successfully'
    });
  } catch (error) {
    console.error('Hold escrow error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Release escrow to partner
router.post('/escrow/release', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { delivery_request_id, partner_id } = req.body;

    if (!delivery_request_id || !partner_id) {
      return res.status(400).json({
        success: false,
        error: 'Delivery request ID and partner ID are required'
      });
    }

    const result = await walletService.releaseEscrow(delivery_request_id, partner_id);
    res.json({
      success: true,
      data: result,
      message: 'Escrow released successfully'
    });
  } catch (error) {
    console.error('Release escrow error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Refund escrow to buyer
router.post('/escrow/refund', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { delivery_request_id } = req.body;

    if (!delivery_request_id) {
      return res.status(400).json({
        success: false,
        error: 'Delivery request ID is required'
      });
    }

    const result = await walletService.refundEscrow(delivery_request_id, userId);
    res.json({
      success: true,
      data: result,
      message: 'Escrow refunded successfully'
    });
  } catch (error) {
    console.error('Refund escrow error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Add money to wallet (demo endpoint)
router.post('/add', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const result = await walletService.creditWallet(
      userId,
      parseFloat(amount),
      'deposit',
      `Added ₹${amount} to wallet`
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `₹${amount} added to wallet successfully`
    });
  } catch (error) {
    console.error('Add money error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Withdraw money from wallet (demo endpoint)
router.post('/withdraw', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const result = await walletService.debitWallet(
      userId,
      parseFloat(amount),
      'withdrawal',
      `Withdrew ₹${amount} from wallet`
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `₹${amount} withdrawn from wallet successfully`
    });
  } catch (error) {
    console.error('Withdraw money error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
