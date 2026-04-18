const express = require('express');
const router = express.Router();
const { searchStudents, getStudentProfile } = require('../controllers/recruiterController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('recruiter'));
router.get('/students', searchStudents);
router.get('/students/:id', getStudentProfile);

module.exports = router;
