const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, uploadResume } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
// update profile — optionally with avatar image
router.put('/me', protect, upload.single('avatar'), updateProfile);
// dedicated resume upload endpoint
router.post('/me/resume', protect, upload.single('resume'), uploadResume);

module.exports = router;
