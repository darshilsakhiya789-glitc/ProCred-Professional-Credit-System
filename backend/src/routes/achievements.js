const express = require('express');
const router = express.Router();
const {
  getMyAchievements, getAchievement, addAchievement,
  updateAchievement, deleteAchievement, updateStatus, getAllPending,
} = require('../controllers/achievementController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

// Student routes
router.route('/')
  .get(authorize('student'), getMyAchievements)
  .post(authorize('student'), upload.single('document'), addAchievement);

router.post('/ai-assessment', authorize('student'), require('../controllers/achievementController').createAIAssessment);

// Admin/Recruiter/UniversityAdmin: get pending achievements for verification
router.get('/pending', authorize('university_admin'), getAllPending);

// Individual achievement
router.route('/:id')
  .get(getAchievement)
  .put(authorize('student'), updateAchievement)
  .delete(authorize('student'), deleteAchievement);

const { requireSubscriptionOrFreeTrial } = require('../middleware/subscription');

// Status update — recruiter OR university_admin can verify
router.patch('/:id/status', authorize('university_admin'), requireSubscriptionOrFreeTrial, updateStatus);

module.exports = router;
