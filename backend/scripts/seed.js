require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Achievement = require('../src/models/Achievement');
const Skill = require('../src/models/Skill');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding...');
  await User.deleteMany(); await Achievement.deleteMany(); await Skill.deleteMany();

  const alex = await User.create({ fullName: 'Alex Johnson', email: 'alex.johnson@stanford.edu', password: 'demo123', role: 'student', university: 'Stanford University', major: 'Computer Science', graduationYear: '2025', location: 'San Francisco, CA', bio: 'Passionate full-stack developer.' });
  const sarah = await User.create({ fullName: 'Sarah Chen', email: 'sarah.chen@mit.edu', password: 'demo123', role: 'student', university: 'MIT', major: 'Data Science', graduationYear: '2024', location: 'Boston, MA', bio: 'ML researcher and conference speaker.' });
  const marcus = await User.create({ fullName: 'Marcus Rodriguez', email: 'marcus.rodriguez@berkeley.edu', password: 'demo123', role: 'student', university: 'UC Berkeley', major: 'Software Engineering', graduationYear: '2025', location: 'Berkeley, CA', bio: 'Backend engineer.' });
  const emily = await User.create({ fullName: 'Emily Watson', email: 'emily.watson@harvard.edu', password: 'demo123', role: 'student', university: 'Harvard University', major: 'Business Analytics', graduationYear: '2024', location: 'Cambridge, MA', bio: 'Business analyst.' });
  await User.create({ fullName: 'Sarah Recruiter', email: 'sarah.recruiter@techcorp.com', password: 'demo123', role: 'recruiter', organization: 'TechCorp', jobTitle: 'Senior Technical Recruiter' });

  await Achievement.insertMany([
    { student: alex._id, title: 'React Developer Certification', issuer: 'Meta', category: 'Technical', date: new Date('2024-08-15'), status: 'verified', creditsEarned: 25 },
    { student: alex._id, title: 'Hackathon Winner - CodeFest 2024', issuer: 'TechUniversity', category: 'Competition', date: new Date('2024-07-20'), status: 'verified', creditsEarned: 50 },
    { student: alex._id, title: 'Data Science Specialization', issuer: 'Coursera', category: 'Technical', date: new Date('2024-06-10'), status: 'pending', creditsEarned: 0 },
    { student: alex._id, title: 'Leadership Workshop Certificate', issuer: 'University Leadership Center', category: 'Leadership', date: new Date('2024-05-15'), status: 'rejected', creditsEarned: 0, rejectionReason: 'Certificate format not recognized' },
    { student: sarah._id, title: 'Research Publication - NeurIPS 2024', issuer: 'NeurIPS', category: 'Academic', date: new Date('2024-11-01'), status: 'verified', creditsEarned: 60 },
    { student: sarah._id, title: 'Data Science Specialization', issuer: 'Coursera', category: 'Technical', date: new Date('2024-09-01'), status: 'verified', creditsEarned: 40 },
    { student: sarah._id, title: 'Conference Speaker - AI Summit', issuer: 'AI Summit Organization', category: 'Leadership', date: new Date('2024-10-15'), status: 'verified', creditsEarned: 30 },
    { student: marcus._id, title: 'Java Professional Certification', issuer: 'Oracle', category: 'Technical', date: new Date('2024-07-01'), status: 'verified', creditsEarned: 30 },
    { student: marcus._id, title: 'Open Source Contributor - Apache', issuer: 'Apache Foundation', category: 'Technical', date: new Date('2024-08-01'), status: 'verified', creditsEarned: 25 },
    { student: emily._id, title: 'Analytics Certification', issuer: 'Google', category: 'Technical', date: new Date('2024-09-15'), status: 'verified', creditsEarned: 35 },
    { student: emily._id, title: 'Business Case Competition Winner', issuer: 'Harvard Business School', category: 'Competition', date: new Date('2024-08-20'), status: 'verified', creditsEarned: 45 },
  ]);

  await Skill.insertMany([
    { student: alex._id, name: 'JavaScript', level: 85, category: 'Programming' },
    { student: alex._id, name: 'React', level: 80, category: 'Frontend' },
    { student: alex._id, name: 'Python', level: 75, category: 'Programming' },
    { student: alex._id, name: 'Data Analysis', level: 70, category: 'Analytics' },
    { student: alex._id, name: 'Leadership', level: 65, category: 'Soft Skills' },
    { student: alex._id, name: 'Project Management', level: 60, category: 'Management' },
    { student: sarah._id, name: 'Python', level: 95, category: 'Programming' },
    { student: sarah._id, name: 'Data Analysis', level: 90, category: 'Analytics' },
    { student: sarah._id, name: 'Machine Learning', level: 88, category: 'Analytics' },
    { student: sarah._id, name: 'TensorFlow', level: 82, category: 'Programming' },
    { student: marcus._id, name: 'Java', level: 82, category: 'Programming' },
    { student: marcus._id, name: 'Spring Boot', level: 78, category: 'Backend' },
    { student: marcus._id, name: 'Docker', level: 75, category: 'Backend' },
    { student: marcus._id, name: 'DevOps', level: 65, category: 'Other' },
    { student: emily._id, name: 'SQL', level: 90, category: 'Analytics' },
    { student: emily._id, name: 'Tableau', level: 85, category: 'Analytics' },
    { student: emily._id, name: 'Analytics', level: 87, category: 'Analytics' },
    { student: emily._id, name: 'Project Management', level: 75, category: 'Management' },
  ]);

  // Recalculate credit scores
  for (const student of [alex, sarah, marcus, emily]) {
    const achs = await Achievement.find({ student: student._id, status: 'verified' });
    const total = achs.reduce((s, a) => s + a.creditsEarned, 0);
    await User.findByIdAndUpdate(student._id, { creditScore: Math.min(Math.round((total / 500) * 100), 100) });
  }

  console.log('\n✅ Seed complete!\n');
  console.log('  👨‍🎓 alex.johnson@stanford.edu     / demo123');
  console.log('  👩‍🎓 sarah.chen@mit.edu            / demo123');
  console.log('  👨‍💻 marcus.rodriguez@berkeley.edu / demo123');
  console.log('  👩‍💼 emily.watson@harvard.edu      / demo123');
  console.log('  🏢 sarah.recruiter@techcorp.com   / demo123\n');
  await mongoose.disconnect(); process.exit(0);
};

seed().catch(err => { console.error('❌', err); process.exit(1); });
