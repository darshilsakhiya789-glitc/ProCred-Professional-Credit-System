const Achievement = require('../models/Achievement');
const User = require('../models/User');

// Student: get their own achievements
exports.getMyAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: achievements.length, data: achievements });
  } catch (err) { next(err); }
};

// Get single achievement
exports.getAchievement = async (req, res, next) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate('student', 'fullName email university major avatarUrl');
    if (!achievement) return res.status(404).json({ success: false, message: 'Achievement not found' });
    if (req.user.role === 'student' && achievement.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: achievement });
  } catch (err) { next(err); }
};

// Student: add achievement
exports.addAchievement = async (req, res, next) => {
  try {
    const { title, issuer, category, date, description } = req.body;

    // Prevent future dates
    const achievementDate = new Date(date);
    if (achievementDate > new Date()) {
      return res.status(400).json({ success: false, message: 'Achievement date cannot be in the future' });
    }

    const data = { student: req.user._id, title, issuer, category, date, description, status: 'pending' };
    if (req.file) data.documentUrl = `/uploads/${req.file.filename}`;
    const achievement = await Achievement.create(data);
    res.status(201).json({ success: true, data: achievement });
  } catch (err) { next(err); }
};

// Student: Add auto-verified AI assessment
exports.createAIAssessment = async (req, res, next) => {
  try {
    const { skill, passed } = req.body;
    if (!passed) return res.status(400).json({ success: false, message: 'You did not pass the assessment.' });

    const user = await User.findById(req.user._id);
    const lastTest = user.lastAITestDate;
    if (lastTest) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      if (lastTest > oneMonthAgo) {
        return res.status(400).json({ success: false, message: 'You can only take an AI Assessment once a month.' });
      }
    }

    const existing = await Achievement.findOne({ 
      student: req.user._id, issuer: 'ProCred AI', title: `${skill} Verified` 
    });
    if (existing) return res.status(400).json({ success: false, message: 'You already earned this badge.' });

    const achievement = await Achievement.create({
      student: req.user._id,
      title: `${skill} Verified`,
      issuer: 'ProCred AI',
      category: 'Technical',
      date: new Date(),
      status: 'verified', // Auto verified!
      creditsEarned: 50,
      description: `Passed the automated AI proficiency assessment for ${skill}.`,
    });

    user.lastAITestDate = new Date();
    await user.save();

    res.status(201).json({ success: true, data: achievement });
  } catch (err) { next(err); }
};

// Student: update achievement (non-verified only)
exports.updateAchievement = async (req, res, next) => {
  try {
    let achievement = await Achievement.findById(req.params.id);
    if (!achievement) return res.status(404).json({ success: false, message: 'Achievement not found' });
    if (achievement.student.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (achievement.status === 'verified') return res.status(400).json({ success: false, message: 'Cannot edit a verified achievement' });
    const { title, issuer, category, date, description } = req.body;
    achievement = await Achievement.findByIdAndUpdate(req.params.id, { title, issuer, category, date, description }, { new: true, runValidators: true });
    res.json({ success: true, data: achievement });
  } catch (err) { next(err); }
};

// Student: delete achievement
exports.deleteAchievement = async (req, res, next) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) return res.status(404).json({ success: false, message: 'Achievement not found' });
    if (achievement.student.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    await achievement.deleteOne();
    res.json({ success: true, message: 'Achievement removed' });
  } catch (err) { next(err); }
};

// Recruiter or University Admin: get achievements for verification
// University admin only sees achievements from their own university's students
exports.getAllPending = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    let filter = { status };

    // Only university_admin can verify — always filter by their university
    if (req.user.adminUniversity) {
      // Only show achievements from students at this admin's university
      const studentsAtUni = await User.find({
        role: 'student',
        university: { $regex: req.user.adminUniversity, $options: 'i' },
      }).select('_id');
      filter.student = { $in: studentsAtUni.map(s => s._id) };
    }

    const achievements = await Achievement.find(filter)
      .populate('student', 'fullName email university major avatarUrl')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, count: achievements.length, data: achievements });
  } catch (err) { next(err); }
};

// Recruiter or University Admin: verify or reject
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, creditsEarned, rejectionReason } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "verified" or "rejected"' });
    }

    const achievement = await Achievement.findById(req.params.id).populate('student', 'university');
    if (!achievement) return res.status(404).json({ success: false, message: 'Achievement not found' });

    // University admin can only verify students from their own university
    // Only university_admin can verify — always filter by their university
    if (req.user.adminUniversity) {
      const studentUniversity = achievement.student?.university || '';
      const adminUni = req.user.adminUniversity.toLowerCase();
      if (!studentUniversity.toLowerCase().includes(adminUni)) {
        return res.status(403).json({ success: false, message: 'You can only verify students from your own university' });
      }
    }

    const update = { status, verifiedBy: req.user._id, verifiedByRole: req.user.role };
    if (status === 'verified') {
      if (creditsEarned) {
        update.creditsEarned = creditsEarned;
      } else {
        const baseScores = { 'Technical': 40, 'Competition': 50, 'Academic': 30, 'Leadership': 20, 'Soft Skills': 15, 'Other': 10 };
        const base = baseScores[achievement.category] || 15;
        const daysOld = (new Date() - new Date(achievement.date)) / (1000 * 60 * 60 * 24);
        let multiplier = 1.0;
        if (daysOld <= 180) multiplier = 1.2;
        else if (daysOld <= 365) multiplier = 1.0;
        else if (daysOld <= 730) multiplier = 0.8;
        else multiplier = 0.5;
        update.creditsEarned = Math.round(base * multiplier);
      }
    }
    if (status === 'rejected') update.rejectionReason = rejectionReason || 'Does not meet verification criteria';

    const updated = await Achievement.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    await updated.save(); // triggers score recalc hook
    res.json({ success: true, data: updated, message: `Achievement ${status}` });
  } catch (err) { next(err); }
};
