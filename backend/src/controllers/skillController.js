const Skill = require('../models/Skill');

exports.getMySkills = async (req, res, next) => {
  try {
    const skills = await Skill.find({ student: req.user._id }).sort({ level: -1 });
    res.json({ success: true, data: skills });
  } catch (err) { next(err); }
};

exports.upsertSkill = async (req, res, next) => {
  try {
    const { name, level, category } = req.body;
    const skill = await Skill.findOneAndUpdate(
      { student: req.user._id, name },
      { level, category },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, data: skill });
  } catch (err) { next(err); }
};

exports.deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    if (skill.student.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    await skill.deleteOne();
    res.json({ success: true, message: 'Skill removed' });
  } catch (err) { next(err); }
};
