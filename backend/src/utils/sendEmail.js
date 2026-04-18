const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // Use real SMTP if configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    console.log('📧 Email: using configured SMTP');
  } else {
    // Auto-create Ethereal test account (no setup needed)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('📧 Email: using Ethereal test account');
    console.log('   View sent emails at: https://ethereal.email/login');
    console.log(`   User: ${testAccount.user} | Pass: ${testAccount.pass}`);
  }
  return transporter;
};

/**
 * sendEmail({ to, subject, html })
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || 'ProCred <noreply@procred.in>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('📧 Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

// ── Email Templates ────────────────────────────────────────────────────────────

const offerLetterTemplate = ({ studentName, jobTitle, company, type, location, deadline, recruiterName, recruiterEmail, customMessage }) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%); padding: 40px 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 15px; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 4px 16px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 12px; border: 1px solid rgba(255,255,255,0.3); }
  .body { padding: 36px 32px; }
  .greeting { font-size: 18px; color: #1e293b; margin-bottom: 20px; }
  .highlight-box { background: linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 24px 0; }
  .highlight-box h2 { margin: 0 0 16px; color: #1e3a5f; font-size: 20px; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { color: #64748b; font-weight: 600; }
  .detail-value { color: #1e293b; font-weight: 700; text-align: right; }
  .message-box { background: #f8fafc; border-left: 4px solid #0ea5e9; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; color: #334155; font-size: 14px; line-height: 1.6; }
  .cta { text-align: center; margin: 32px 0; }
  .cta a { display: inline-block; background: linear-gradient(135deg, #1e3a5f, #0ea5e9); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 16px; }
  .footer { text-align: center; padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  .footer p { margin: 4px 0; font-size: 12px; color: #94a3b8; }
  .footer .brand { font-size: 18px; font-weight: 800; color: #1e3a5f; margin-bottom: 8px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>🎉 Congratulations!</h1>
    <p>You have been selected for an opportunity</p>
    <span class="badge">ProCred Verified Recruitment</span>
  </div>
  <div class="body">
    <p class="greeting">Dear <strong>${studentName}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;">
      We are delighted to inform you that after a thorough review of your <strong>ProCred profile</strong>, 
      verified credentials, and skill assessments, you have been shortlisted for the following opportunity:
    </p>
    <div class="highlight-box">
      <h2>📋 Offer Details</h2>
      <div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>
      <div class="detail-row"><span class="detail-label">Company / Organization</span><span class="detail-value">${company}</span></div>
      <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">${type}</span></div>
      <div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${location || 'To be discussed'}</span></div>
      <div class="detail-row"><span class="detail-label">Response Deadline</span><span class="detail-value" style="color:#dc2626;">${deadline || 'As soon as possible'}</span></div>
    </div>
    ${customMessage ? `<div class="message-box"><strong>Message from ${recruiterName}:</strong><br/><br/>${customMessage}</div>` : ''}
    <p style="color:#475569;font-size:14px;line-height:1.7;">
      Please reply to this email or contact the recruiter directly to confirm your acceptance.
      Your verified ProCred profile was a key factor in this selection.
    </p>
    <div class="cta">
      <a href="http://localhost:5173">View Your ProCred Profile →</a>
    </div>
    <p style="color:#64748b;font-size:13px;">
      Recruiter Contact: <strong>${recruiterName}</strong> &lt;${recruiterEmail}&gt;
    </p>
  </div>
  <div class="footer">
    <div class="brand">ProCred™</div>
    <p>Verified Skills. Trusted Credits. Powered by ProCred.</p>
    <p>This is an automated email. Do not reply to this address.</p>
  </div>
</div>
</body>
</html>
`;

const applicationConfirmTemplate = ({ studentName, jobTitle, company }) => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:40px 0;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1e3a5f,#0ea5e9);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Application Received ✅</h1>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;color:#1e293b;">Hi <strong>${studentName}</strong>,</p>
    <p style="color:#475569;line-height:1.7;">Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been received and is under review.</p>
    <p style="color:#475569;line-height:1.7;">The recruiter will review your ProCred profile and verified credentials. You will receive an offer letter email if selected.</p>
    <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:24px 0;font-size:14px;color:#1e3a5f;">
      💡 <strong>Tip:</strong> While waiting, improve your ProCred Score by adding more verified achievements and skills. Recruiters can see your score in real-time!
    </div>
  </div>
  <div style="text-align:center;padding:20px;background:#f8fafc;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:18px;font-weight:800;color:#1e3a5f;">ProCred™</p>
    <p style="margin:4px 0;font-size:12px;color:#94a3b8;">Verified Skills. Trusted Credits.</p>
  </div>
</div>
</body></html>
`;

module.exports = { sendEmail, offerLetterTemplate, applicationConfirmTemplate };
