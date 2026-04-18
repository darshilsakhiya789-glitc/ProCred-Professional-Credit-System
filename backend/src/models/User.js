const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['student', 'recruiter', 'university_admin'], required: true },

  // Common fields
  avatarUrl: { type: String, default: '' },
  location: { type: String, trim: true, default: '' },
  bio: { type: String, maxlength: 500, default: '' },
  creditScore: { type: Number, default: 0 },
  phone: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  websiteUrl: { type: String, default: '' },
  subscriptionStatus: { type: String, enum: ['free', 'active'], default: 'free' },
  subscriptionExpiry: { type: Date },
  freeActionsCount: { type: Number, default: 0 },
  lastAITestDate: { type: Date },

  // Student fields
  university: { type: String, trim: true, default: '' },
  major: { type: String, trim: true, default: '' },
  graduationYear: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },

  // Recruiter fields
  organization: { type: String, trim: true, default: '' },
  jobTitle: { type: String, trim: true, default: '' },

  // University Admin fields
  adminUniversity: { type: String, trim: true, default: '' }, // which university they admin
  adminDepartment: { type: String, trim: true, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
