const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Skill = require('../models/Skill');

exports.searchStudents = async (req, res, next) => {
  try {
    let { search, skill, university, minScore, maxScore, graduationYear } = req.query;
    
    // Map 'gtu' to 'Gujarat Technological University'
    if (search && search.toLowerCase() === 'gtu') {
      search = 'Gujarat Technological University';
    }
    if (university && university.toLowerCase() === 'gtu') {
      university = 'Gujarat Technological University';
    }

    const query = { role: 'student' };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { major: { $regex: search, $options: 'i' } },
      ];
    }
    if (university) query.university = { $regex: university, $options: 'i' };
    if (graduationYear) query.graduationYear = graduationYear;
    if (minScore || maxScore) {
      query.creditScore = {};
      if (minScore) query.creditScore.$gte = parseInt(minScore);
      if (maxScore) query.creditScore.$lte = parseInt(maxScore);
    }
    let students = await User.find(query).select('-password').lean();

    if (skill) {
      const skillMatches = await Skill.find({ name: { $regex: skill, $options: 'i' } }).select('student');
      const ids = new Set(skillMatches.map(s => s.student.toString()));
      students = students.filter(s => ids.has(s._id.toString()));
    }

    const enriched = await Promise.all(students.map(async (student) => {
      const skills = await Skill.find({ student: student._id }).sort({ level: -1 }).limit(3).lean();
      const achievements = await Achievement.find({ student: student._id, status: 'verified' }).sort({ date: -1 }).limit(3).lean();
      const achievementCount = await Achievement.countDocuments({ student: student._id, status: 'verified' });
      return {
        ...student,
        topSkills: skills.map(s => `${s.name} (${s.level}%)`),
        recentAchievements: achievements.map(a => a.title),
        achievementCount,
        verified: achievementCount > 0,
      };
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) { next(err); }
};

exports.getStudentProfile = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' }).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const achievements = await Achievement.find({ student: student._id, status: 'verified' }).sort({ date: -1 });
    const skills = await Skill.find({ student: student._id }).sort({ level: -1 });
    res.json({ success: true, data: { ...student.toObject(), achievements, skills } });
  } catch (err) { next(err); }
};
