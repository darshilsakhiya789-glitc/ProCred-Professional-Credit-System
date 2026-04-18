const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  issuer: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Technical', 'Competition', 'Soft Skills', 'Academic', 'Leadership', 'Other'],
    required: true,
  },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  creditsEarned: { type: Number, default: 0 },
  rejectionReason: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
  description: { type: String, maxlength: 500, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedByRole: { type: String, enum: ['recruiter', 'university_admin', null], default: null },
}, { timestamps: true });

// Recalculate student ProCred score (out of 1000) after any save
achievementSchema.post('save', async function () {
  try {
    const User = mongoose.model('User');
    const Achievement = mongoose.model('Achievement');
    const Skill = mongoose.model('Skill');

    const verified = await Achievement.find({ student: this.student, status: 'verified' });
    const skills = await Skill.find({ student: this.student });

    // Dynamic Score components to make 1000 points harder to reach
    const achPts = verified.reduce((s, a) => s + (a.creditsEarned || 0), 0);
    const skillPts = Math.min(skills.length * 10, 100);
    const catBonus = Math.min(new Set(verified.map(a => a.category)).size * 15, 75);
    const profileBonus = 25;
    const creditScore = Math.min(Math.round(achPts + skillPts + catBonus + profileBonus), 1000);

    await User.findByIdAndUpdate(this.student, { creditScore });
  } catch (e) { /* non-blocking */ }
});

module.exports = mongoose.model('Achievement', achievementSchema);
