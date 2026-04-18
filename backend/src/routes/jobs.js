const express = require('express');
const router = express.Router();
const {
  createJob, getMyJobs, getJobApplications, updateApplicationStatus,
  sendOfferLetters, closeJob, getActiveJobs, applyToJob, getMyApplications,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

// Public + student: browse active jobs (protect optional — shows hasApplied if logged in)
router.get('/', (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      User.findById(decoded.id).then(user => { req.user = user; getActiveJobs(req, res, next); }).catch(() => getActiveJobs(req, res, next));
    } catch { getActiveJobs(req, res, next); }
  } else { getActiveJobs(req, res, next); }
});

// Student: apply + view own applications
router.post('/:id/apply', protect, authorize('student'), applyToJob);
router.get('/my-applications', protect, authorize('student'), getMyApplications);

const { requireSubscriptionOrFreeTrial } = require('../middleware/subscription');

// Recruiter: manage jobs
router.post('/', protect, authorize('recruiter'), requireSubscriptionOrFreeTrial, createJob);
router.get('/my-jobs', protect, authorize('recruiter'), getMyJobs);
router.get('/:id/applications', protect, authorize('recruiter'), getJobApplications);
router.patch('/applications/:appId/status', protect, authorize('recruiter'), updateApplicationStatus);
router.post('/send-offers', protect, authorize('recruiter'), sendOfferLetters);
router.patch('/:id/close', protect, authorize('recruiter'), closeJob);
router.patch('/:id/boost', protect, authorize('recruiter'), require('../controllers/jobController').boostJob);

module.exports = router;
