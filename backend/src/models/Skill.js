const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  level: { type: Number, min: 0, max: 100, default: 50 },
  category: {
    type: String,
    enum: ['Programming', 'Frontend', 'Backend', 'Analytics', 'Soft Skills', 'Management', 'Design', 'Other'],
    default: 'Other',
  },
}, { timestamps: true });

skillSchema.index({ student: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Skill', skillSchema);
