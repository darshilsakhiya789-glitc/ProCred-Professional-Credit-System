const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job:     { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['applied', 'under_review', 'shortlisted', 'offer_sent', 'rejected', 'accepted'],
    default: 'applied',
  },
  coverNote: { type: String, maxlength: 1000, default: '' },
  offerSentAt: { type: Date },
  offerMessage: { type: String, default: '' },
  recruiterNote: { type: String, default: '' },
}, { timestamps: true });

// Ensure a student can only apply once per job
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
