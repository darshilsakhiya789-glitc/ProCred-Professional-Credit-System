const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const userFields = (user) => ({
  id: user._id, fullName: user.fullName, email: user.email, role: user.role,
  creditScore: user.creditScore,
  avatarUrl: user.avatarUrl, resumeUrl: user.resumeUrl,
  university: user.university, major: user.major, graduationYear: user.graduationYear,
  location: user.location, bio: user.bio, phone: user.phone,
  linkedinUrl: user.linkedinUrl, githubUrl: user.githubUrl, websiteUrl: user.websiteUrl,
  organization: user.organization, jobTitle: user.jobTitle,
  adminUniversity: user.adminUniversity, adminDepartment: user.adminDepartment,
});

const userResponse = (user, token) => ({ success: true, token, user: userFields(user) });

exports.register = async (req, res, next) => {
  try {
    const {
      fullName, email, password, role,
      university, major, graduationYear, location,
      organization, jobTitle,
      adminUniversity, adminDepartment,
    } = req.body;

    // ── University Admin: MUST provide university AND email must be institutional ──
    if (role === 'university_admin') {
      if (!adminUniversity || adminUniversity.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'University name is required for University Admin registration.',
        });
      }

      // Check email domain against allowed university domains
      const allowedDomains = (process.env.ALLOWED_UNIVERSITY_DOMAINS || 'ac.in,edu.in,edu')
        .split(',').map(d => d.trim().toLowerCase());

      const emailDomain = email.split('@')[1]?.toLowerCase() || '';
      const isInstitutionalEmail = allowedDomains.some(d => emailDomain.endsWith(d));

      if (!isInstitutionalEmail) {
        return res.status(400).json({
          success: false,
          message: `University Admin registration requires an institutional email address ending in: ${allowedDomains.join(', ')}. Please use your university-issued email.`,
        });
      }
    }

    // ── Student: university is recommended but not required ──
    // (students may be self-learners, bootcamp students, etc.)

    const userData = {
      fullName, email, password, role,
      university: university || '',
      major: major || '',
      graduationYear: graduationYear || '',
      location: location || '',
      organization: organization || '',
      jobTitle: jobTitle || '',
      adminUniversity: role === 'university_admin' ? adminUniversity : '',
      adminDepartment: role === 'university_admin' ? (adminDepartment || '') : '',
    };

    const user = await User.create(userData);
    res.status(201).json(userResponse(user, generateToken(user._id)));
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    res.json(userResponse(user, generateToken(user._id)));
  } catch (err) { next(err); }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: userFields(req.user) });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'fullName', 'bio', 'location', 'phone',
      'university', 'major', 'graduationYear',
      'organization', 'jobTitle',
      'linkedinUrl', 'githubUrl', 'websiteUrl',
      'adminUniversity', 'adminDepartment',
    ];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.file) updates.avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: userFields(user) });
  } catch (err) { next(err); }
};

exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const resumeUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { resumeUrl });
    res.json({ success: true, resumeUrl });
  } catch (err) { next(err); }
};
