const { supabase } = require('../config/supabaseClient');

// Simple authentication middleware for demo
// In production, use proper JWT verification
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    // For demo purposes, we'll extract user ID from token
    // In production, verify JWT token properly
    if (token.startsWith('demo-user-')) {
      const userId = token.replace('demo-user-', '');
      
      // Verify user exists in database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', userId)
        .single();

      if (error || !user) {
        req.user = null;
        return next();
      }

      req.user = user;
      return next();
    }

    // If using real Supabase tokens
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    await authenticateUser(req, res, () => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user is admin (for demo, we'll check user_roles table)
      checkAdminRole(req.user.id)
        .then(isAdmin => {
          if (!isAdmin) {
            return res.status(403).json({
              success: false,
              error: 'Admin access required'
            });
          }
          next();
        })
        .catch(error => {
          console.error('Admin check error:', error);
          res.status(500).json({
            success: false,
            error: 'Error checking admin permissions'
          });
        });
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Helper function to check admin role
const checkAdminRole = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    return !error && data !== null;
  } catch (error) {
    return false;
  }
};

// Optional authentication (doesn't fail if no auth)
const optionalAuth = async (req, res, next) => {
  await authenticateUser(req, res, next);
};

// safety check middleware (checks for blocks)
const checkUserSafety = async (req, res, next) => {
  if (!req.user) return next();

  try {
    const { data: block, error } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (block) {
      const now = new Date();
      if (!block.blocked_until || new Date(block.blocked_until) > now) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          reason: block.reason || 'Account has been restricted',
          blocked_until: block.blocked_until
        });
      }
    }
    next();
  } catch (err) {
    console.error('Safety check failed:', err);
    next();
  }
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  optionalAuth,
  checkAdminRole,
  checkUserSafety
};
