import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Upload, Award, CheckCircle, Clock, AlertCircle, TrendingUp,
  FileText, Trophy, Bookmark, Plus, Trash2, X, Home, Bell,
  MessageCircle, Send, Bot, Briefcase, MapPin, ChevronRight,
  Star, Shield, Zap, GraduationCap, Camera, Github, Linkedin,
  Globe, Phone, BarChart3, Target, Edit2,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { achievementsAPI, skillsAPI, authAPI, jobsAPI } from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface Achievement {
  _id: string; title: string; issuer: string; date: string;
  status: 'pending' | 'verified' | 'rejected'; category: string;
  creditsEarned: number; rejectionReason?: string; documentUrl?: string;
  description?: string;
}
interface Skill { _id: string; name: string; level: number; category: string; }
type ChatMsg = { role: 'bot' | 'user'; text: string };

// ── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Technical', 'Competition', 'Soft Skills', 'Academic', 'Leadership', 'Other'];
const SKILL_CATS = ['Programming', 'Frontend', 'Backend', 'Data Science', 'DevOps', 'Design', 'Soft Skills', 'Other'];

// Jobs are loaded from backend

// ── Score calculator (out of 1000) ──────────────────────────────────────────
function calcScore(verified: Achievement[], skills: Skill[]) {
  const achPts = Math.min(verified.reduce((s, a) => s + (a.creditsEarned || 50), 0), 600);
  const skillPts = Math.min(skills.length * 20, 200);
  const catBonus = Math.min(new Set(verified.map(a => a.category)).size * 30, 150);
  return Math.min(Math.round(achPts + skillPts + catBonus + 50), 1000);
}

function scoreInfo(s: number) {
  if (s >= 750) return { label: 'Expert 🔥', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' };
  if (s >= 400) return { label: 'Intermediate ⚡', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', bar: 'bg-blue-500' };
  return { label: 'Beginner 🌱', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', bar: 'bg-orange-500' };
}

// ── AI Chatbot ───────────────────────────────────────────────────────────────
function buildBotReply(input: string, ctx: { achievements: number; skills: number; score: number; pending: number; label: string }): string {
  const q = input.toLowerCase().trim();
  if (/^(hi|hello|hey|namaste|yo|sup)/.test(q))
    return `Hi ${ctx.label}! 👋 Here's your quick summary:\n📊 Score: ${ctx.score}/1000 (${ctx.label})\n🏆 Verified: ${ctx.achievements} achievements\n⏳ Pending: ${ctx.pending}\n💡 Skills: ${ctx.skills}\n\nWhat can I help you with?`;
  if (q.includes('score') || q.includes('credit') || q.includes('1000') || q.includes('point'))
    return `Your ProCred Score: ${ctx.score}/1000 — ${ctx.label}\n\n📈 Score breakdown:\n• Verified achievements → up to 600 pts (each gives 50+ pts)\n• Skills added → up to 200 pts (+20 each)\n• Category diversity → up to 150 pts (+30 per new category)\n• Profile bonus → 50 pts\n\nTarget 750+ to reach Expert tier and appear in premium recruiter searches!`;
  if (q.includes('achievement') || q.includes('certificate') || q.includes('upload') && q.includes('cert'))
    return `Adding achievements:\n1. Click "Add Achievement" button\n2. Fill title, issuer, date, category\n3. Upload your certificate (PDF/JPG/PNG, max 5MB)\n4. Hit "Submit for Verification"\n\nOur team reviews in 2–3 business days. ✅ Verified ones earn you credit points.\n\nCurrent: ${ctx.achievements} verified, ${ctx.pending} pending.`;
  if (q.includes('verify') || q.includes('pending') || q.includes('rejected') || q.includes('review'))
    return `Verification process:\n⏳ Pending → Our team is reviewing your document\n✅ Verified → Approved! Credits added to score\n❌ Rejected → Document unclear. Check reason, re-upload better scan\n\nYou have ${ctx.pending} achievement(s) pending review.`;
  if (q.includes('skill'))
    return `Skills boost visibility and score:\n→ Go to Skills tab → "Add Skill"\n→ Enter name, set proficiency (0–100%), pick category\n\nEach skill adds +20 pts (max 200 pts total).\nYou have ${ctx.skills} skills. Try adding ${Math.max(0, 10 - ctx.skills)} more to max out skill points!`;
  if (q.includes('job') || q.includes('intern') || q.includes('apply') || q.includes('career') || q.includes('hiring'))
    return `Check the Job Alerts tab 🔔 for matched opportunities!\n\nAlerts are sorted by % match to your skills. Click "Apply Now" on any listing.\n\nTo get better matches:\n✅ Add more skills\n✅ Get achievements verified\n✅ Complete your location in Profile\n\nHigher score = more recruiter visibility!`;
  if (q.includes('resume') || q.includes('cv') || q.includes('document'))
    return `Go to Documents tab 📄 to:\n• Upload your resume (PDF, DOC, DOCX)\n• Add transcripts, cover letters, portfolio links\n• Upload profile picture\n\nRecruiters see your documents when they view your profile card. Keep your resume updated!`;
  if (q.includes('profile') || q.includes('photo') || q.includes('picture') || q.includes('avatar'))
    return `Update your profile in the Profile tab 👤:\n• Click the camera icon on your avatar to upload a profile photo\n• Add university, major, expected grad year (optional)\n• Location helps with local job matching\n• Bio appears on your recruiter-visible profile card\n\nProfile completion gives you +50 bonus points!`;
  if (q.includes('recruiter') || q.includes('visible') || q.includes('found') || q.includes('discover'))
    return `Recruiters discover you through:\n1. Keyword search (skill, major, university)\n2. Minimum score filter\n3. AI resume scanner (JD → ranked profiles)\n\nTo maximize visibility:\n✅ Get 5+ achievements verified\n✅ Add 8+ skills\n✅ Score 750+ (Expert tier)\n✅ Upload resume\n✅ Complete bio & location`;
  if (q.includes('improve') || q.includes('increase') || q.includes('boost') || q.includes('better'))
    return `To improve your ${ctx.score}/1000 score:\n${ctx.score < 400 ? '🌱 Priority: Get your first 3–5 achievements verified (+150 pts)\n→ Each verified certificate adds 50 pts minimum' : ctx.score < 750 ? '⚡ Priority: Diversify achievement categories\n→ Add achievements in Leadership, Academic, Competition\n→ Each new category adds +30 pts' : '🔥 You\'re Expert! Focus on:\n→ Uploading resume for recruiter downloads\n→ Optimizing bio with job-relevant keywords'}`;
  if (q.includes('help') || q.includes('what can') || q.includes('guide'))
    return `I can help with:\n📊 Score & credits\n🏆 Adding/verifying achievements\n💼 Job & internship alerts\n📄 Resume & document upload\n🎯 Skills assessment\n👤 Profile & profile photo\n📈 Score improvement tips\n\nJust ask naturally — I understand full sentences!`;
  return `${ctx.score < 400 ? `💡 Your score is ${ctx.score}/1000. Start by adding 3 verified achievements to jump up fast!` : ctx.score < 750 ? `⚡ You're at ${ctx.score}/1000. Add skills in new categories to reach Expert tier!` : `🔥 Expert at ${ctx.score}/1000! Focus on resume upload and bio for recruiter visibility.`}\n\nTry asking: "how to improve my score", "add achievement", "job alerts", "upload resume", or "profile picture"`;
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { onPageChange?: (page: string) => void; }

export function StudentDashboard({ onPageChange }: Props) {
  const { user, updateUser } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('achievements');

  // Achievement modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [newAch, setNewAch] = useState({ title: '', issuer: '', category: 'Technical', date: '', description: '' });

  // Skills
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 50, category: 'Programming' });
  const [skillLoading, setSkillLoading] = useState(false);

  // Profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '', university: user?.university || '',
    major: user?.major || '', graduationYear: user?.graduationYear || '',
    location: user?.location || '', bio: user?.bio || '',
    phone: user?.phone || '', linkedinUrl: user?.linkedinUrl || '',
    githubUrl: user?.githubUrl || '', websiteUrl: user?.websiteUrl || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Avatar upload
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Resume upload
  const resumeRef = useRef<HTMLInputElement>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState<{id:number, text: string, time: string, read: boolean}[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applySuccess, setApplySuccess] = useState('');
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  // Chatbot
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: 'bot', text: "Hi! 👋 I'm your ProCred AI assistant. I can help with achievements, your score, jobs, resume upload, profile photo, and anything else. What would you like to know?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // AI Quiz Modal
  const [aiQuizModal, setAiQuizModal] = useState<{skill: string, open: boolean, emailMsg: string}>({skill: '', open: false, emailMsg: ''});
  const [submitAILoading, setSubmitAILoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [achRes, skillRes] = await Promise.all([achievementsAPI.getAll(), skillsAPI.getAll()]);
        setAchievements(achRes.data.data);
        setSkills(skillRes.data.data);
      } catch (e: any) { setError(e.response?.data?.message || 'Failed to load dashboard.'); }
      finally { setLoadingData(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const [jobsRes, appsRes] = await Promise.all([
          jobsAPI.getActive(),
          jobsAPI.getMyApplications(),
        ]);
        setLiveJobs(jobsRes.data.data || []);
        setMyApplications(appsRes.data.data || []);
        const appliedIds = new Set<string>((appsRes.data.data || []).map((a: any) => a.job._id));
        setAppliedJobs(appliedIds);
      } catch { /* non-blocking */ }
      finally { setJobsLoading(false); }
    };
    fetchJobs();
  }, []);

  useEffect(() => { if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs, showChat]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const verified = achievements.filter(a => a.status === 'verified');
  const score = calcScore(verified, skills);
  const si = scoreInfo(score);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddAchievement = async () => {
    if (!newAch.title || !newAch.issuer || !newAch.date) { setAddError('Title, issuer, and date are required.'); return; }
    setAddLoading(true); setAddError('');
    try {
      const fd = new FormData();
      Object.entries(newAch).forEach(([k, v]) => fd.append(k, v));
      if (fileRef.current?.files?.[0]) fd.append('document', fileRef.current.files[0]);
      const res = await achievementsAPI.add(fd);
      setAchievements(p => [res.data.data, ...p]);
      setShowAddModal(false);
      setNewAch({ title: '', issuer: '', category: 'Technical', date: '', description: '' });
      if (fileRef.current) fileRef.current.value = '';
      setNotifications(p => [{ id: Date.now(), text: `📋 "${newAch.title}" submitted for verification`, time: 'just now', read: false }, ...p]);
    } catch (e: any) { setAddError(e.response?.data?.message || 'Failed to add achievement.'); }
    finally { setAddLoading(false); }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm('Delete this achievement?')) return;
    try { await achievementsAPI.delete(id); setAchievements(p => p.filter(a => a._id !== id)); }
    catch (e: any) { alert(e.response?.data?.message || 'Failed to delete.'); }
  };

  const handleUpsertSkill = async () => {
    if (!newSkill.name.trim()) return;
    setSkillLoading(true);
    try {
      const res = await skillsAPI.upsert(newSkill);
      setSkills(p => {
        const i = p.findIndex(s => s._id === res.data.data._id);
        return i >= 0 ? p.map(s => s._id === res.data.data._id ? res.data.data : s) : [res.data.data, ...p];
      });
      setNewSkill({ name: '', level: 50, category: 'Programming' });
      setShowAddSkill(false);
    } catch (e: any) { alert(e.response?.data?.message || 'Failed.'); }
    finally { setSkillLoading(false); }
  };

  const handleDeleteSkill = async (id: string) => {
    try { await skillsAPI.delete(id); setSkills(p => p.filter(s => s._id !== id)); }
    catch { alert('Failed to delete skill.'); }
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await authAPI.updateProfile(profileData);
      updateUser(res.data.user);
      setEditingProfile(false);
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to save profile.'); }
    finally { setProfileLoading(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Profile photo must be under 2MB.'); return; }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await authAPI.updateProfile(fd);
      updateUser({ avatarUrl: res.data.user.avatarUrl });
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to upload photo.'); }
    finally { setAvatarUploading(false); if (avatarRef.current) avatarRef.current.value = ''; }
  };

  const handleResumeUpload = async (file: File) => {
    if (!file) return;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) { alert('Please upload a PDF, DOC, or DOCX file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Resume must be under 5MB.'); return; }
    setResumeUploading(true); setResumeSuccess('');
    try {
      const res = await authAPI.uploadResume(file);
      updateUser({ resumeUrl: res.data.resumeUrl });
      setResumeSuccess(`✅ Resume uploaded: ${file.name}`);
      setNotifications(p => [{ id: Date.now(), text: `📄 Resume uploaded successfully — recruiters can now view it`, time: 'just now', read: false }, ...p]);
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to upload resume.'); }
    finally { setResumeUploading(false); if (resumeRef.current) resumeRef.current.value = ''; }
  };

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput;
    setChatMsgs(p => [...p, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);
    setTimeout(() => {
      const ctx = { achievements: verified.length, skills: skills.length, score, pending: achievements.filter(a => a.status === 'pending').length, label: si.label };
      setChatMsgs(p => [...p, { role: 'bot', text: buildBotReply(msg, ctx) }]);
      setChatLoading(false);
    }, 600);
  }, [chatInput, chatLoading, verified.length, skills.length, score, achievements, si.label]);

  const statusStyle = (s: string) =>
    s === 'verified' ? 'bg-green-50 text-green-700 border-green-200' :
    s === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200';
  const statusIcon = (s: string) =>
    s === 'verified' ? <CheckCircle className="h-3.5 w-3.5" /> :
    s === 'pending' ? <Clock className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />;

  if (loadingData) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 font-medium">Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {error && <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl p-4 mb-6 text-sm">{error}</div>}

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Avatar + info */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center shadow-xl ring-2 ring-white/20">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white">{user?.fullName?.charAt(0)}</span>
                  )}
                </div>
                {/* Camera button */}
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 border-2 border-slate-900"
                  title="Change profile photo"
                >
                  {avatarUploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="h-3.5 w-3.5 text-white" />}
                </button>
                <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-white">
                  Welcome, {user?.fullName?.split(' ')[0]}! 👋
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${si.bg} ${si.color}`}>
                    {si.label}
                  </span>
                  {user?.university && <span className="text-slate-400 text-sm">· {user.university}</span>}
                  {user?.location && <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{user.location}</span>}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {onPageChange && (
                <Button onClick={() => onPageChange('home')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm h-9">
                  <Home className="h-4 w-4 mr-1.5" /> Home
                </Button>
              )}
              <div className="relative" ref={notifRef}>
                <Button onClick={() => setShowNotif(!showNotif)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm h-9 relative">
                  <Bell className="h-4 w-4 mr-1.5" /> Alerts
                  {unread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unread}</span>}
                </Button>
                {showNotif && (
                  <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-slate-200 w-[360px] z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
                      <h4 className="font-bold text-slate-900">Notifications</h4>
                      <button onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))} className="text-xs text-blue-600 hover:underline font-medium">Mark all read</button>
                    </div>
                    <div className="divide-y max-h-80 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
                          className={`px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}>
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 mt-0.5">
                              {n.text.startsWith('🎉') ? '🎉' : n.text.startsWith('💼') ? '💼' : n.text.startsWith('👀') ? '👀' : n.text.startsWith('⏰') ? '⏰' : '📈'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n.text}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xl h-9">
                <Plus className="h-4 w-4 mr-1.5" /> Add Achievement
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Score + Stats row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Score card */}
          <Card className="lg:col-span-1 border-0 shadow-xl overflow-hidden">
            <div className={`p-6 ${score >= 750 ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : score >= 400 ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-orange-500 to-amber-600'} text-white`}>
              <div className="flex items-center gap-2 mb-3 opacity-80">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-semibold">ProCred Score</span>
              </div>
              <div className="text-6xl font-black leading-none">{score}</div>
              <div className="text-white/70 text-base mt-1">out of 1000</div>
              <div className="mt-3 inline-block bg-white/20 rounded-full px-3 py-1 text-sm font-bold">{si.label}</div>
            </div>
            <CardContent className="p-4">
              <Progress value={(score / 1000) * 100} className="h-2.5 mb-3" />
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-orange-50 rounded-lg py-1.5"><div className="font-bold text-orange-600">Beginner</div><div className="text-slate-400">0–399</div></div>
                <div className="bg-blue-50 rounded-lg py-1.5"><div className="font-bold text-blue-600">Inter.</div><div className="text-slate-400">400–749</div></div>
                <div className="bg-emerald-50 rounded-lg py-1.5"><div className="font-bold text-emerald-600">Expert</div><div className="text-slate-400">750+</div></div>
              </div>
            </CardContent>
          </Card>

          {/* Quick stat cards */}
          {[
            { icon: <Trophy className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50', val: verified.length, label: 'Verified', tab: 'achievements' },
            { icon: <Clock className="h-5 w-5 text-yellow-600" />, bg: 'bg-yellow-50', val: achievements.filter(a => a.status === 'pending').length, label: 'Pending', tab: 'achievements' },
            { icon: <Bookmark className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', val: skills.length, label: 'Skills', tab: 'skills' },
            { icon: <Briefcase className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50', val: `${liveJobs.length} new`, label: 'Job Matches', tab: 'jobs' },
          ].map(({ icon, bg, val, label, tab }) => (
            <Card key={label} className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab(tab)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{val}</div>
                  <p className="text-slate-500 text-xs font-medium">{label}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 ml-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tip bar */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 flex-1">
            {score < 400 ? '🎯 Quick win: Upload 3 certificates with documents to jump-start your score!'
              : score < 750 ? `⚡ ${750 - score} points away from Expert tier! Add achievements in new categories.`
              : '🔥 Expert tier! Upload your resume in the Documents tab to maximize recruiter visibility.'}
          </p>
          <button onClick={() => { setShowChat(true); setTimeout(() => setChatInput('how to improve my score'), 100); }}
            className="text-blue-600 text-xs font-bold hover:underline whitespace-nowrap flex-shrink-0">
            Ask AI →
          </button>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 shadow-sm p-1 w-full grid grid-cols-5 mb-6">
            {[
              { value: 'achievements', icon: <Trophy className="h-4 w-4" />, label: 'Achievements' },
              { value: 'ai_assessor', icon: <Zap className="h-4 w-4" />, label: 'AI Badges' },
              { value: 'skills', icon: <Bookmark className="h-4 w-4" />, label: 'Skills' },
              { value: 'jobs', icon: <Briefcase className="h-4 w-4" />, label: 'Jobs', badge: liveJobs.filter(j => j.type !== 'Bounty').length },
              { value: 'bounties', icon: <Target className="h-4 w-4" />, label: 'Bounties', badge: liveJobs.filter(j => j.type === 'Bounty').length },
              { value: 'documents', icon: <FileText className="h-4 w-4" />, label: 'Documents' },
              { value: 'profile', icon: <GraduationCap className="h-4 w-4" />, label: 'Profile' },
            ].map(({ value, icon, label, badge }) => (
              <TabsTrigger key={value} value={value}
                className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg relative">
                {icon}
                <span className="hidden sm:inline">{label}</span>
                {badge && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">{badge}</span>}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Achievements Tab ── */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Your Achievements 🏆</h2>
              <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 h-9">
                <Upload className="h-4 w-4 mr-2" /> Upload Certificate
              </Button>
            </div>
            {achievements.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 shadow-none bg-white">
                <CardContent className="p-16 text-center space-y-4">
                  <Award className="h-16 w-16 text-slate-300 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-700">No achievements yet</h3>
                  <p className="text-slate-500 text-sm">Upload your first certificate to start earning ProCred points!</p>
                  <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Add First Achievement
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {achievements.map((a) => (
                  <Card key={a._id} className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Award className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">{a.title}</h3>
                            <p className="text-slate-500 text-sm">{a.issuer} · {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            {a.description && <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{a.description}</p>}
                            {a.status === 'rejected' && (
                              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                <p className="text-red-700 text-xs font-semibold flex items-center gap-1 mb-0.5">
                                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Rejection Reason:
                                </p>
                                <p className="text-red-600 text-xs leading-snug">
                                  {a.rejectionReason || 'No reason provided. Please re-upload a clearer document.'}
                                </p>
                                <p className="text-red-500 text-xs mt-1 italic">
                                  You can delete this and re-submit with a better document.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">{a.category}</Badge>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${statusStyle(a.status)}`}>
                            {statusIcon(a.status)} {a.status}
                          </span>
                          {a.status === 'verified' && (
                            <span className="text-emerald-600 font-black text-sm">+{a.creditsEarned} pts</span>
                          )}
                          {a.documentUrl && (
                            <a href={a.documentUrl} target="_blank" rel="noreferrer"
                              className="text-blue-500 text-xs hover:underline hover:text-blue-700 font-medium">
                              View Doc
                            </a>
                          )}
                          {a.status !== 'verified' && (
                            <button onClick={() => handleDeleteAchievement(a._id)}
                              className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Skills Tab ── */}
          <TabsContent value="skills" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Skills Assessment 📊</h2>
              <Button onClick={() => setShowAddSkill(true)} className="bg-blue-600 hover:bg-blue-700 h-9">
                <Plus className="h-4 w-4 mr-2" /> Add Skill
              </Button>
            </div>
            {showAddSkill && (
              <Card className="border border-blue-200 bg-blue-50 shadow-md">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-slate-900">Add / Update Skill</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input placeholder="Skill name (e.g. React, SQL)" value={newSkill.name}
                      onChange={(e) => setNewSkill(p => ({ ...p, name: e.target.value }))} className="bg-white" />
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Proficiency: {newSkill.level}%</label>
                      <input type="range" min={0} max={100} value={newSkill.level}
                        onChange={(e) => setNewSkill(p => ({ ...p, level: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer" />
                    </div>
                    <Select value={newSkill.category} onValueChange={(v) => setNewSkill(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>{SKILL_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpsertSkill} disabled={skillLoading} className="bg-blue-600 hover:bg-blue-700">
                      {skillLoading ? 'Saving…' : 'Save Skill'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddSkill(false)} className="bg-white">Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {skills.length === 0 && !showAddSkill ? (
              <Card className="border-2 border-dashed border-slate-300 shadow-none bg-white">
                <CardContent className="p-12 text-center space-y-3">
                  <Bookmark className="h-12 w-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500">No skills yet. Each skill adds +20 points to your score!</p>
                  <Button onClick={() => setShowAddSkill(true)} className="bg-blue-600 hover:bg-blue-700">Add Your First Skill</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <Card key={skill._id} className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900">{skill.name}</h3>
                          <p className="text-xs text-slate-500 font-medium">{skill.category}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-black text-blue-600 text-lg">{skill.level}%</span>
                          <button onClick={() => handleDeleteSkill(skill._id)}
                            className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg ml-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${si.bar} rounded-full transition-all duration-500`} style={{ width: `${skill.level}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Job Alerts Tab ── */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Job & Internship Alerts 🔔</h2>
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1">{liveJobs.length} Active Jobs</Badge>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              🎯 Real jobs posted by recruiters on ProCred. Apply with one click — your ProCred profile is shared automatically!
            </div>
            {applySuccess && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800">Application Submitted! 🎉</p>
                  <p className="text-emerald-700 text-sm">You applied to <strong>{applySuccess}</strong>. A confirmation email has been sent to you. The recruiter will contact you if shortlisted.</p>
                </div>
              </div>
            )}
            {jobsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : liveJobs.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 shadow-none bg-white">
                <CardContent className="p-12 text-center space-y-3">
                  <Briefcase className="h-12 w-12 text-slate-300 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-700">No active jobs right now</h3>
                  <p className="text-slate-500 text-sm">Check back soon — recruiters are actively posting. Make sure your profile and skills are complete to get notified first!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {liveJobs.filter((j: any) => j.type !== 'Bounty').map((job: any) => {
                  const hasApplied = appliedJobs.has(job._id);
                  const isDeadlinePassed = job.deadline && new Date(job.deadline) < new Date();
                  const myApp = myApplications.find((a: any) => a.job._id === job._id);
                  return (
                    <Card key={job._id} className="border-0 shadow-md bg-white hover:shadow-lg transition-all">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900">{job.title}</h3>
                              <span className="font-semibold text-blue-700">@ {job.company}</span>
                              {job.isSponsored && <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0 shadow-sm"><Star className="h-3 w-3 mr-1 fill-white" /> Sponsored</Badge>}
                              <Badge className={`text-xs ${job.type === 'Internship' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{job.type}</Badge>
                              {job.minScore > 0 && <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">Min {job.minScore} score</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-2">
                              {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
                              {job.deadline && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Closes {new Date(job.deadline).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</span>}
                              {job.salary && <span className="font-semibold text-emerald-700">{job.salary}</span>}
                              {job.applicantCount > 0 && <span className="text-slate-400">{job.applicantCount} applicants</span>}
                            </div>
                            {job.skills?.length > 0 && <div className="flex flex-wrap gap-1.5">{job.skills.map((s: string) => <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-600 text-xs">{s}</Badge>)}</div>}
                            {myApp && (
                              <div className={`mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                                myApp.status === 'shortlisted' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                myApp.status === 'offer_sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                myApp.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {myApp.status === 'shortlisted' ? '⭐ Shortlisted' :
                                 myApp.status === 'offer_sent' ? '🎉 Offer Received!' :
                                 myApp.status === 'rejected' ? '❌ Not Selected' :
                                 myApp.status === 'under_review' ? '👁 Under Review' :
                                 '✅ Applied'}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <Button size="sm"
                              disabled={hasApplied || isDeadlinePassed || (job.minScore > 0 && score < job.minScore)}
                              className={`h-9 px-4 transition-all ${hasApplied ? 'bg-emerald-600 cursor-default' : isDeadlinePassed ? 'bg-slate-400 cursor-not-allowed' : job.minScore > 0 && score < job.minScore ? 'bg-slate-300 cursor-not-allowed text-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                              onClick={async () => {
                                if (hasApplied || isDeadlinePassed) return;
                                try {
                                  await jobsAPI.applyToJob(job._id, {});
                                  setAppliedJobs(prev => new Set([...prev, job._id]));
                                  setNotifications(p => [{ id: Date.now(), text: `✅ Applied to ${job.title} at ${job.company}! Check your email for confirmation.`, time: 'just now', read: false }, ...p]);
                                  setApplySuccess(`${job.title} @ ${job.company}`);
                                  setTimeout(() => setApplySuccess(''), 5000);
                                  setLiveJobs(prev => prev.map(j => j._id === job._id ? { ...j, applicantCount: (j.applicantCount || 0) + 1 } : j));
                                } catch (e: any) {
                                  alert(e.response?.data?.message || 'Failed to apply. Please try again.');
                                }
                              }}>
                              {hasApplied ? <><CheckCircle className="h-3.5 w-3.5 mr-1" />Applied!</> :
                               isDeadlinePassed ? 'Closed' :
                               job.minScore > 0 && score < job.minScore ? `Need ${job.minScore} score` :
                               <>Apply Now <ChevronRight className="h-3.5 w-3.5 ml-1" /></>}
                            </Button>
                            {job.minScore > 0 && score < job.minScore && (
                              <p className="text-xs text-red-500 text-right">Your score: {score}/{job.minScore}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── AI Assessor Tab ── */}
          <TabsContent value="ai_assessor" className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">AI Skill Badge Assessor 🤖</h2>
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <Zap className="absolute -right-6 -top-6 h-32 w-32 text-indigo-500/20" />
              <div className="relative z-10 max-w-lg">
                <h3 className="text-2xl font-black mb-2">Prove Your Skills Instantly</h3>
                <p className="text-indigo-200 text-sm mb-6">Take a short 3-question AI-generated test. Pass it, and your profile instantly receives an auto-verified "ProCred AI Badge" and +100 points. No Admin review required!</p>
                <div className="flex flex-wrap gap-3">
                  {['React.js', 'Node.js', 'Python', 'System Design'].map(skill => (
                    <Button key={skill} onClick={() => setAiQuizModal({ skill, open: true, emailMsg: '' })} className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold border-0">
                      Take {skill} Test
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Instant Points', 'Resume Booster', 'Smart Rankings'].map((t, i) => (
                <Card key={t} className="bg-indigo-50 border-indigo-100 shadow-sm"><CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex mx-auto items-center justify-center mb-2 font-black">{i + 1}</div>
                  <p className="font-bold text-indigo-900">{t}</p>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Bounties Tab ── */}
          <TabsContent value="bounties" className="space-y-4">
             <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Gig Economy & Bounties 🎯</h2>
              <Badge className="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1">{liveJobs.filter((j: any) => j.type === 'Bounty').length} Active Bounties</Badge>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
              ⚡ Short-term freelance gigs. Complete Bounties to earn cash and boost your ProCred Score instantly!
            </div>
            
            {jobsLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : liveJobs.filter((j: any) => j.type === 'Bounty').length === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 shadow-none bg-white">
                <CardContent className="p-12 text-center space-y-3">
                  <Target className="h-12 w-12 text-slate-300 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-700">No Bounties right now</h3>
                  <p className="text-slate-500 text-sm">Recruiters haven't posted any quick-gigs yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveJobs.filter((j: any) => j.type === 'Bounty').map((job: any) => {
                  const hasApplied = appliedJobs.has(job._id);
                  return (
                    <Card key={job._id} className="border-2 border-purple-100 shadow-md bg-white hover:shadow-lg transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">BOUNTY</div>
                      <CardContent className="p-5 pt-7">
                        <h3 className="font-extrabold text-slate-900 text-lg mb-1">{job.title}</h3>
                        <p className="font-semibold text-purple-700 text-sm mb-3">@ {job.company}</p>
                        
                        <div className="flex gap-4 mb-4">
                          <div className="bg-emerald-50 rounded-lg p-2 flex-1 text-center border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-bold uppercase">Reward</p>
                            <p className="text-lg font-black text-emerald-700">{job.salary || 'Varies'}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2 flex-1 text-center border border-orange-100">
                            <p className="text-xs text-orange-600 font-bold uppercase">Points</p>
                            <p className="text-lg font-black text-orange-700">+150</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{job.description}</p>
                        
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled={hasApplied} onClick={async () => {
                           if (hasApplied) return;
                           try {
                             await jobsAPI.applyToJob(job._id, {});
                             setAppliedJobs(prev => new Set([...prev, job._id]));
                             alert("Applied to Bounty!");
                           } catch (e: any) { alert(e.response?.data?.message || 'Failed to apply.'); }
                        }}>
                          {hasApplied ? 'Applied ✓' : 'Claim Bounty →'}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Documents Tab ── */}
          <TabsContent value="documents" className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Resume & Documents 📄</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resume Upload */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Upload className="h-5 w-5 text-blue-600" /> Upload Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user?.resumeUrl && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-emerald-800 font-semibold text-sm">Resume uploaded ✓</p>
                        <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="text-emerald-600 text-xs hover:underline">View current resume →</a>
                      </div>
                    </div>
                  )}
                  {resumeSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-medium">{resumeSuccess}</div>
                  )}
                  {/* Drop zone — clicking anywhere here triggers file input */}
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
                    onClick={() => resumeRef.current?.click()}
                  >
                    {resumeUploading ? (
                      <div className="space-y-3">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-slate-600 font-medium">Uploading…</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-slate-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
                        <p className="font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">Click anywhere here to select your resume</p>
                        <p className="text-slate-400 text-sm mt-1">PDF, DOC, DOCX — max 5MB</p>
                      </>
                    )}
                  </div>
                  {/* Hidden file input */}
                  <input
                    ref={resumeRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }}
                  />
                  {/* Upload button — also triggers file input */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-semibold"
                    disabled={resumeUploading}
                    onClick={() => resumeRef.current?.click()}
                  >
                    {resumeUploading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Uploading…</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />{user?.resumeUrl ? 'Replace Resume' : 'Upload Resume'}</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Other Documents */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-emerald-600" /> Other Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-500 text-sm">Upload additional documents to strengthen your recruiter-visible profile.</p>
                  {['Transcript / Marksheet', 'Cover Letter', 'Portfolio / Projects', 'Letter of Recommendation'].map((doc) => (
                    <div key={doc} className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-200 hover:bg-white transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{doc}</span>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50 h-8">
                        Upload
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Profile Information 👤</h2>
              {!editingProfile && (
                <Button variant="outline" onClick={() => {
                  setProfileData({ fullName: user?.fullName || '', university: user?.university || '', major: user?.major || '', graduationYear: user?.graduationYear || '', location: user?.location || '', bio: user?.bio || '', phone: user?.phone || '', linkedinUrl: user?.linkedinUrl || '', githubUrl: user?.githubUrl || '', websiteUrl: user?.websiteUrl || '' });
                  setEditingProfile(true);
                }} className="border-blue-200 text-blue-700 hover:bg-blue-50 h-9">
                  <Edit2 className="h-4 w-4 mr-1.5" /> Edit Profile
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile card */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-600" />Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingProfile ? (
                    <>
                      {[
                        { label: 'Full Name', key: 'fullName', placeholder: 'Your full name' },
                        { label: 'University / College', key: 'university', placeholder: 'e.g. SVIT, Vasad' },
                        { label: 'Branch / Major', key: 'major', placeholder: 'e.g. Computer Engineering' },
                        { label: 'Location', key: 'location', placeholder: 'e.g. Surat, Gujarat' },
                        { label: 'Phone', key: 'phone', placeholder: 'e.g. +91 98765 43210' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-700">{label}</label>
                          <Input value={(profileData as any)[key]} onChange={(e) => setProfileData(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="h-10" />
                        </div>
                      ))}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">
                          Expected Graduation Year
                          <span className="text-slate-400 font-normal text-xs ml-1">(optional)</span>
                        </label>
                        <Input value={profileData.graduationYear} onChange={(e) => setProfileData(p => ({ ...p, graduationYear: e.target.value }))} placeholder="e.g. 2026 — leave blank if not applicable" maxLength={4} className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Bio</label>
                        <Textarea value={profileData.bio} onChange={(e) => setProfileData(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Tell recruiters about yourself, your goals, and what you're looking for…" />
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold text-slate-700 mb-3">Social / Portfolio Links</p>
                        {[
                          { key: 'linkedinUrl', placeholder: 'https://linkedin.com/in/your-profile', icon: <Linkedin className="h-4 w-4 text-blue-600" />, label: 'LinkedIn' },
                          { key: 'githubUrl', placeholder: 'https://github.com/your-username', icon: <Github className="h-4 w-4 text-slate-700" />, label: 'GitHub' },
                          { key: 'websiteUrl', placeholder: 'https://yourportfolio.com', icon: <Globe className="h-4 w-4 text-emerald-600" />, label: 'Portfolio' },
                        ].map(({ key, placeholder, icon, label }) => (
                          <div key={key} className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
                            <Input value={(profileData as any)[key]} onChange={(e) => setProfileData(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="h-9 text-sm" />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button onClick={handleSaveProfile} disabled={profileLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 h-11">
                          {profileLoading ? 'Saving…' : '✓ Save All Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingProfile(false)} className="h-11">Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {/* Profile photo preview */}
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center shadow-md flex-shrink-0">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-black text-white">{user?.fullName?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user?.fullName}</p>
                          <p className="text-slate-500 text-sm">{user?.email}</p>
                          <button onClick={() => avatarRef.current?.click()} className="text-blue-600 text-xs hover:underline font-medium mt-1 flex items-center gap-1">
                            <Camera className="h-3 w-3" /> {user?.avatarUrl ? 'Change photo' : 'Upload photo'}
                          </button>
                        </div>
                      </div>

                      {[
                        { label: 'University / College', value: user?.university || '—' },
                        { label: 'Branch / Major', value: user?.major || '—' },
                        { label: 'Graduation Year', value: user?.graduationYear || 'Not specified' },
                        { label: 'Location', value: user?.location || '—' },
                        { label: 'Phone', value: user?.phone || '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <span className="text-sm text-slate-500 font-medium">{label}</span>
                          <span className="text-sm text-slate-900 font-semibold text-right max-w-[55%] truncate">{value}</span>
                        </div>
                      ))}

                      {user?.bio && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Bio</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{user.bio}</p>
                        </div>
                      )}

                      {/* Social links */}
                      {(user?.linkedinUrl || user?.githubUrl || user?.websiteUrl) && (
                        <div className="flex flex-wrap gap-2">
                          {user?.linkedinUrl && <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200"><Linkedin className="h-3.5 w-3.5" />LinkedIn</a>}
                          {user?.githubUrl && <a href={user.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-700 hover:underline bg-slate-100 px-3 py-1.5 rounded-full border border-slate-300"><Github className="h-3.5 w-3.5" />GitHub</a>}
                          {user?.websiteUrl && <a href={user.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"><Globe className="h-3.5 w-3.5" />Portfolio</a>}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Score breakdown */}
              <div className="space-y-4">
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-purple-600" />Score Breakdown</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    {[
                      { label: 'Verified Achievements', pts: Math.min(verified.reduce((s, a) => s + (a.creditsEarned || 50), 0), 600), max: 600, color: 'bg-blue-500' },
                      { label: 'Skills Added', pts: Math.min(skills.length * 20, 200), max: 200, color: 'bg-emerald-500' },
                      { label: 'Category Diversity', pts: Math.min(new Set(verified.map(a => a.category)).size * 30, 150), max: 150, color: 'bg-purple-500' },
                      { label: 'Profile Bonus', pts: 50, max: 50, color: 'bg-orange-500' },
                    ].map(({ label, pts, max, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-600 font-medium">{label}</span>
                          <span className="font-black text-slate-900">{pts}<span className="text-slate-400 font-normal">/{max}</span></span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min((pts / max) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4 flex justify-between items-center">
                      <span className="font-bold text-slate-700">Total ProCred Score</span>
                      <span className={`font-black text-2xl ${si.color}`}>{score}<span className="text-sm text-slate-400 font-normal">/1000</span></span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick links */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-5">
                    <p className="font-bold text-slate-900 mb-3 text-sm">Quick Actions</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Add a new achievement', icon: <Plus className="h-4 w-4" />, action: () => setShowAddModal(true) },
                        { label: 'Upload your resume', icon: <Upload className="h-4 w-4" />, action: () => setActiveTab('documents') },
                        { label: 'Browse job matches', icon: <Briefcase className="h-4 w-4" />, action: () => setActiveTab('jobs') },
                        { label: 'Ask AI for tips', icon: <Bot className="h-4 w-4" />, action: () => setShowChat(true) },
                      ].map(({ label, icon, action }) => (
                        <button key={label} onClick={action}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors text-sm font-medium text-left">
                          <span className="text-current">{icon}</span> {label} <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Add Achievement Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl flex-shrink-0">
              <CardTitle className="text-white flex items-center gap-2"><Trophy className="h-5 w-5" />Add Achievement</CardTitle>
              <button onClick={() => { setShowAddModal(false); setAddError(''); }} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
            </CardHeader>
            <CardContent className="space-y-4 p-6 overflow-y-auto">
              {addError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{addError}</div>}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Achievement Title *</label>
                <Input placeholder="e.g. React Developer Certification" value={newAch.title} onChange={(e) => setNewAch(p => ({ ...p, title: e.target.value }))} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Issuing Organization *</label>
                  <Input placeholder="e.g. Meta, Coursera, NPTEL" value={newAch.issuer} onChange={(e) => setNewAch(p => ({ ...p, issuer: e.target.value }))} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Date Issued *</label>
                  <Input type="date" value={newAch.date} onChange={(e) => setNewAch(p => ({ ...p, date: e.target.value }))} max={new Date().toISOString().split("T")[0]} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <Select value={newAch.category} onValueChange={(v) => setNewAch(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <Input placeholder="Brief description of this achievement" value={newAch.description} onChange={(e) => setNewAch(p => ({ ...p, description: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Certificate Document</label>
                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-blue-700">Click to select certificate</span>
                  <span className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 5MB</span>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                </label>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                📋 Our team reviews your document within 2–3 business days. You'll get a notification when verified!
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddAchievement} disabled={addLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 font-semibold">
                  {addLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Submitting…</> : '🚀 Submit for Verification'}
                </Button>
                <Button variant="outline" onClick={() => { setShowAddModal(false); setAddError(''); }} className="h-11">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── AI Assessment Modal ── */}
      {aiQuizModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> AI Quiz: {aiQuizModal.skill}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800 mb-5 relative overflow-hidden">
                <AlertCircle className="absolute -right-3 -bottom-3 h-16 w-16 text-indigo-500/10" />
                <p className="relative z-10 font-medium">To begin the 3-question test, please verify your identity.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email ID <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder="Enter your registered email..." 
                    value={aiQuizModal.emailMsg} 
                    onChange={e => setAiQuizModal(p => ({...p, emailMsg: e.target.value}))} 
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">Email id is compulsory for AI assessment tracking.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    disabled={submitAILoading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-11 font-bold"
                    onClick={async () => {
                      if (!aiQuizModal.emailMsg.includes('@')) {
                        alert('A valid email ID is compulsory!');
                        return;
                      }
                      setSubmitAILoading(true);
                      setTimeout(async () => {
                        try {
                          const res = await achievementsAPI.submitAIAssessment({ skill: aiQuizModal.skill, passed: true });
                          setAchievements(p => [res.data.data, ...p]);
                          alert(`🎉 You passed! +50 points and the ${aiQuizModal.skill} AI Badge have been added to your profile.`);
                          setAiQuizModal({ skill: '', open: false, emailMsg: '' });
                          setActiveTab('achievements');
                        } catch (e: any) {
                          alert(e.response?.data?.message || 'Failed Assessment.');
                        } finally {
                          setSubmitAILoading(false);
                        }
                      }, 1000); 
                    }}
                  >
                    {submitAILoading ? 'Processing test...' : 'Start Assessment'}
                  </Button>
                  <Button variant="outline" className="h-11 px-6" onClick={() => setAiQuizModal({ skill: '', open: false, emailMsg: '' })}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Chatbot ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {showChat && (
          <div className="mb-4 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ height: '520px' }}>
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><Bot className="h-5 w-5 text-white" /></div>
                <div>
                  <p className="text-white font-bold text-sm">ProCred AI Assistant</p>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span className="text-blue-200 text-xs">Online</span></div>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {chatMsgs.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><Bot className="h-4 w-4 text-white" /></div>}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-white" /></div>
                  <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-slate-100">
                    <div className="flex gap-1">{[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t bg-white p-3 flex-shrink-0">
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {['my score', 'add achievement', 'job alerts', 'upload resume', 'profile photo'].map(hint => (
                  <button key={hint} onClick={() => setChatInput(hint)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full px-2.5 py-1 font-medium border border-blue-100 transition-colors">{hint}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()} placeholder="Ask me anything…" className="text-sm h-10" />
                <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0 flex-shrink-0 disabled:opacity-50"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}
        <button onClick={() => setShowChat(!showChat)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 relative ${showChat ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {showChat ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
          {!showChat && unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unread}</span>}
        </button>
      </div>
    </div>
  );
}
