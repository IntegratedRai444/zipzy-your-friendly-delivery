require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import middleware
const { 
  errorHandler, 
  requestLogger, 
  corsMiddleware, 
  rateLimit, 
  healthCheck 
} = require('./middleware/middleware');
const { authenticateUser, optionalAuth } = require('./middleware/auth');

// Import routes
const requestsRouter = require('./routes/requests');
const deliveriesRouter = require('./routes/deliveries');
const chatRouter = require('./routes/chat');
const walletRouter = require('./routes/wallet');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
app.use(healthCheck);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Zipzy Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Zipzy Delivery Platform API',
    version: '1.0.0',
    endpoints: {
      requests: {
        'POST /api/requests': 'Create new request',
        'GET /api/requests/available': 'Get available requests for partners',
        'GET /api/requests/my': 'Get user\'s own requests',
        'GET /api/requests/:id': 'Get specific request details',
        'PATCH /api/requests/:id/status': 'Update request status',
        'POST /api/requests/:id/otp': 'Generate OTP for request',
        'POST /api/requests/:id/otp/verify': 'Verify OTP for request'
      },
      deliveries: {
        'POST /api/deliveries/accept': 'Accept a request (create delivery)',
        'PATCH /api/deliveries/:id/status': 'Update delivery status',
        'GET /api/deliveries/my': 'Get partner\'s deliveries',
        'GET /api/deliveries/:id': 'Get specific delivery details',
        'POST /api/deliveries/:id/location': 'Update partner location',
        'GET /api/deliveries/:id/tracking': 'Get delivery tracking history',
        'PATCH /api/deliveries/:id/cancel': 'Cancel delivery'
      },
      chat: {
        'POST /api/chat/send': 'Send message',
        'GET /api/chat/:deliveryId': 'Get chat history for delivery',
        'POST /api/chat/:deliveryId/read': 'Mark messages as read',
        'GET /api/chat/unread/count': 'Get unread message count',
        'DELETE /api/chat/:messageId': 'Delete message',
        'GET /api/chat/': 'Get all conversations for user'
      },
      wallet: {
        'GET /api/wallet/': 'Get wallet details',
        'GET /api/wallet/summary': 'Get wallet summary with transactions',
        'GET /api/wallet/transactions': 'Get transaction history',
        'POST /api/wallet/credit': 'Credit wallet (add money)',
        'POST /api/wallet/debit': 'Debit wallet (withdraw money)',
        'POST /api/wallet/escrow/hold': 'Hold escrow for delivery',
        'POST /api/wallet/escrow/release': 'Release escrow to partner',
        'POST /api/wallet/escrow/refund': 'Refund escrow to buyer',
        'POST /api/wallet/add': 'Add money to wallet (demo)',
        'POST /api/wallet/withdraw': 'Withdraw money from wallet (demo)'
      }
    },
    authentication: 'Use Authorization: Bearer <token> header (demo: Bearer demo-user-<user-id>)'
  });
});

// Apply authentication middleware to API routes
app.use('/api', (req, res, next) => {
  // For demo purposes, we'll use optional auth
  // In production, use authenticateUser for all protected routes
  optionalAuth(req, res, next);
});

// API routes
app.use('/api/requests', requestsRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/wallet', walletRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: '/api'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Zipzy Backend Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Health Check: http://localhost:${PORT}/health
📖 API Documentation: http://localhost:${PORT}/api
🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

Available Routes:
  • Requests: /api/requests/*
  • Deliveries: /api/deliveries/*
  • Chat: /api/chat/*
  • Wallet: /api/wallet/*

Demo Authentication:
  Use Authorization: Bearer demo-user-<user-id> header
  Example: Authorization: Bearer demo-user-12345678-1234-1234-1234-123456789012
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
