const express = require('express');
const router = express.Router();
const { getMySkills, upsertSkill, deleteSkill } = require('../controllers/skillController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student'));
router.route('/').get(getMySkills).post(upsertSkill);
router.delete('/:id', deleteSkill);

module.exports = router;
