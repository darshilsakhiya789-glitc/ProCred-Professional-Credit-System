const User = require('../models/User');

const requireSubscriptionOrFreeTrial = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Students don't need subscriptions
    if (user.role === 'student') return next();

    // If active subscription, proceed
    if (user.subscriptionStatus === 'active') {
      if (user.subscriptionExpiry && user.subscriptionExpiry < new Date()) {
        user.subscriptionStatus = 'free';
        await user.save();
      } else {
        return next();
      }
    }

    // If free subscription, check if they have used their 1 free action
    if (user.freeActionsCount < 1) {
      // Increment free actions count
      user.freeActionsCount += 1;
      await user.save();
      return next();
    }

    // Otherwise, block
    return res.status(403).json({
      success: false,
      message: 'SUBSCRIPTION_REQUIRED',
      reason: 'You have used your 1 free action. Please upgrade to Pro to continue.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { requireSubscriptionOrFreeTrial };
