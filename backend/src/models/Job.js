const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Full-time', 'Internship', 'Part-time', 'Contract', 'Remote', 'Bounty'], required: true },
  location: { type: String, trim: true, default: '' },
  skills: [{ type: String, trim: true }], // required skills array
  description: { type: String, required: true },
  requirements: { type: String, default: '' },
  salary: { type: String, default: '' },
  deadline: { type: Date },
  minScore: { type: Number, default: 0 }, // minimum ProCred score required
  openings: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  applicantCount: { type: Number, default: 0 },
  isSponsored: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
