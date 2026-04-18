const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const { sendEmail, offerLetterTemplate, applicationConfirmTemplate } = require('../utils/sendEmail');

// ── RECRUITER: Create a job post ──────────────────────────────────────────────
exports.createJob = async (req, res, next) => {
  try {
    const { title, type, location, skills, description, requirements, salary, deadline, minScore, openings } = req.body;
    const job = await Job.create({
      recruiter: req.user._id,
      company: req.user.organization || req.user.fullName,
      title, type, location, description, requirements, salary, minScore, openings,
      skills: Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean),
      deadline: deadline ? new Date(deadline) : undefined,
    });

    // Notify matching students natively
    try {
      const Skill = require('../models/Skill');
      const jobSkills = job.skills || [];
      if (jobSkills.length > 0) {
        const skillRegexes = jobSkills.map(s => new RegExp(`^${s}$`, 'i'));
        const matchedSkills = await Skill.find({ name: { $in: skillRegexes } }).populate('student', 'email fullName');
        
        const matchedEmails = {};
        matchedSkills.forEach(s => {
          if (s.student && s.student.email) {
            matchedEmails[s.student.email] = s.student;
          }
        });

        Object.values(matchedEmails).forEach(student => {
          const html = `
            <h2>New Job Match on ProCred!</h2>
            <p>Hi ${student.fullName},</p>
            <p>A new job <strong>${job.title}</strong> at <strong>${job.company}</strong> has been posted that matches your skills!</p>
            <p>Log in to your ProCred dashboard to apply now.</p>
          `;
          sendEmail({
            to: student.email,
            subject: 'ProCred Job Match: ' + job.title,
            html,
          }).catch(err => console.log('Job alert email failed to send:', err));
        });
      }
    } catch (notifyErr) {
      console.log('Failed to notify students:', notifyErr);
    }

    res.status(201).json({ success: true, data: job });
  } catch (err) { next(err); }
};

// ── RECRUITER: Get all their own jobs ─────────────────────────────────────────
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
    // Attach applicant counts
    const withCounts = await Promise.all(jobs.map(async j => {
      const counts = await Application.aggregate([
        { $match: { job: j._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const countMap = {};
      counts.forEach(c => { countMap[c._id] = c.count; });
      return { ...j.toObject(), countMap, totalApplicants: Object.values(countMap).reduce((a, b) => a + b, 0) };
    }));
    res.json({ success: true, count: withCounts.length, data: withCounts });
  } catch (err) { next(err); }
};

// ── RECRUITER: Get applications for a specific job ────────────────────────────
exports.getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or not yours' });

    const { status } = req.query;
    const filter = { job: req.params.id };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('student', 'fullName email university major creditScore avatarUrl resumeUrl location topSkills')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with student skills
    const Skill = require('../models/Skill');
    const enriched = await Promise.all(applications.map(async app => {
      const skills = await Skill.find({ student: app.student._id }).sort({ level: -1 }).limit(5).lean();
      return { ...app, student: { ...app.student, skills } };
    }));

    res.json({ success: true, count: enriched.length, data: enriched, job });
  } catch (err) { next(err); }
};

// ── RECRUITER: Update application status (review, shortlist, reject) ──────────
// ── RECRUITER: Update application status (review, shortlist, reject, accepted) ────────
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, recruiterNote } = req.body;
    const allowed = ['under_review', 'shortlisted', 'offer_sent', 'rejected', 'accepted'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const app = await Application.findById(req.params.appId)
      .populate('student', 'fullName email')
      .populate('job', 'title company recruiter type');

    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    if (app.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    app.status = status;
    if (recruiterNote) app.recruiterNote = recruiterNote;
    await app.save();

    // Bounty payout logic
    if (status === 'accepted' && app.job.type === 'Bounty') {
      const Achievement = require('../models/Achievement');
      await Achievement.create({
        student: app.student._id,
        title: `Completed Bounty: ${app.job.title}`,
        issuer: app.job.company,
        category: 'Other',
        date: new Date(),
        status: 'verified',
        creditsEarned: 150,
        description: `Successfully completed a bounty posted by ${app.job.company}.`
      });
      // The student model pre-save hook recalculates score usually, or the front-end calculates it based on achievements.
    }

    res.json({ success: true, data: app, message: `Status updated to ${status}` });
  } catch (err) { next(err); }
};

// ── RECRUITER: Send offer letter to top N selected candidates ─────────────────
exports.sendOfferLetters = async (req, res, next) => {
  try {
    const { appIds, customMessage, deadline } = req.body;
    if (!appIds || !Array.isArray(appIds) || appIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide at least one application ID' });
    }

    const results = [];
    for (const appId of appIds) {
      const app = await Application.findById(appId)
        .populate('student', 'fullName email')
        .populate('job', 'title company type location recruiter');
      if (!app) { results.push({ appId, success: false, error: 'Not found' }); continue; }
      if (app.job.recruiter.toString() !== req.user._id.toString()) { results.push({ appId, success: false, error: 'Unauthorized' }); continue; }

      // Send offer letter email
      const html = offerLetterTemplate({
        studentName: app.student.fullName,
        jobTitle: app.job.title,
        company: app.job.company || req.user.organization,
        type: app.job.type,
        location: app.job.location,
        deadline: deadline || 'Within 48 hours',
        recruiterName: req.user.fullName,
        recruiterEmail: req.user.email,
        customMessage,
      });

      const emailResult = await sendEmail({
        to: app.student.email,
        subject: `🎉 Offer Letter: ${app.job.title} at ${app.job.company || req.user.organization} — ProCred`,
        html,
      });

      // Update application status
      app.status = 'offer_sent';
      app.offerSentAt = new Date();
      app.offerMessage = customMessage || '';
      await app.save();

      results.push({ appId, studentName: app.student.fullName, email: app.student.email, emailResult });
    }

    const sent = results.filter(r => r.emailResult?.success).length;
    res.json({ success: true, message: `Offer letters sent to ${sent}/${appIds.length} candidates`, results });
  } catch (err) { next(err); }
};

// ── RECRUITER: Close a job ────────────────────────────────────────────────────
exports.closeJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      { status: 'closed' }, { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

// ── RECRUITER: Boost a job ────────────────────────────────────────────────────
exports.boostJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      { isSponsored: true }, { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job, message: 'Job sponsored successfully!' });
  } catch (err) { next(err); }
};

// ── STUDENT: Get active job listings ─────────────────────────────────────────
exports.getActiveJobs = async (req, res, next) => {
  try {
    const { search, type, skill } = req.query;
    const filter = { status: 'active' };
    if (type) filter.type = type;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (skill) filter.skills = { $elemMatch: { $regex: skill, $options: 'i' } };

    const jobs = await Job.find(filter)
      .populate('recruiter', 'fullName organization avatarUrl')
      .sort({ isSponsored: -1, createdAt: -1 })
      .limit(50);

    // If student is logged in, mark which ones they applied to
    let appliedSet = new Set();
    if (req.user) {
      const myApps = await Application.find({ student: req.user._id }).select('job');
      myApps.forEach(a => appliedSet.add(a.job.toString()));
    }

    const data = jobs.map(j => ({
      ...j.toObject(),
      hasApplied: appliedSet.has(j._id.toString()),
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

// ── STUDENT: Apply to a job ────────────────────────────────────────────────────
exports.applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'active') return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });

    // Check student score meets minimum
    if (job.minScore > 0 && req.user.creditScore < job.minScore) {
      return res.status(400).json({ success: false, message: `Your ProCred Score (${req.user.creditScore}) is below the minimum required (${job.minScore})` });
    }

    const { coverNote } = req.body;
    const app = await Application.create({ job: job._id, student: req.user._id, coverNote });
    await Job.findByIdAndUpdate(job._id, { $inc: { applicantCount: 1 } });

    // Send confirmation email to student (non-blocking)
    sendEmail({
      to: req.user.email,
      subject: `Application Received: ${job.title} at ${job.company} — ProCred`,
      html: applicationConfirmTemplate({ studentName: req.user.fullName, jobTitle: job.title, company: job.company }),
    });

    res.status(201).json({ success: true, data: app, message: 'Application submitted successfully' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'You have already applied to this job' });
    next(err);
  }
};

// ── STUDENT: Get their own applications ──────────────────────────────────────
exports.getMyApplications = async (req, res, next) => {
  try {
    const apps = await Application.find({ student: req.user._id })
      .populate('job', 'title company type location status deadline recruiter')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: apps.length, data: apps });
  } catch (err) { next(err); }
};
