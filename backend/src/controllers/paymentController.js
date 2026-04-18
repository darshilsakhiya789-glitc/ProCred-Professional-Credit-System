const User = require('../models/User');

exports.subscribe = async (req, res, next) => {
  try {
    // In a real application, we would verify the Stripe payment token here.
    // We are mocking this for the prototype.
    const { paymentMethodId, durationMonths } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'Payment method required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.subscriptionStatus = 'active';
    const months = parseInt(durationMonths) || 1;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    user.subscriptionExpiry = expiry;
    
    await user.save();

    res.json({
      success: true,
      message: 'Subscription activated successfully!',
      data: { subscriptionStatus: user.subscriptionStatus, subscriptionExpiry: user.subscriptionExpiry }
    });
  } catch (err) {
    next(err);
  }
};
