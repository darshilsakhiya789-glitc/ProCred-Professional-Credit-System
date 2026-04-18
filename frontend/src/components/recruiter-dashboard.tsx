import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import {
  Search, Filter, Users, CheckCircle, Star, MapPin, Calendar, Award,
  TrendingUp, Eye, X, GraduationCap, Home, Bell, Briefcase,
  MessageCircle, Send, Bot, Plus, FileText, Cpu, ChevronRight,
  Mail, Clock, BarChart3, RefreshCw, UserCheck, AlertCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { recruiterAPI, jobsAPI } from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Student {
  _id: string; fullName: string; university: string; major: string;
  graduationYear: string; creditScore: number; location: string;
  achievementCount: number; verified: boolean;
  topSkills: string[]; recentAchievements: string[];
}
interface StudentProfile extends Student {
  email: string; bio: string;
  achievements: { _id: string; title: string; issuer: string; date: string; creditsEarned: number }[];
  skills: { _id: string; name: string; level: number; category: string }[];
}
interface Job {
  _id: string; title: string; company: string; type: string; location: string;
  skills: string[]; description: string; salary: string; deadline: string;
  minScore: number; openings: number; status: string;
  totalApplicants?: number; countMap?: Record<string, number>;
  createdAt: string;
  isSponsored?: boolean;
}
interface Application {
  _id: string; status: string; coverNote: string; createdAt: string;
  recruiterNote: string; offerSentAt?: string;
  student: {
    _id: string; fullName: string; email: string; university: string; major: string;
    creditScore: number; avatarUrl?: string; resumeUrl?: string; location?: string;
    skills?: { name: string; level: number }[];
  };
}
type ChatMsg = { role: 'bot' | 'user'; text: string };

// ── Chatbot ────────────────────────────────────────────────────────────────────
function buildReply(input: string, ctx: { total: number; avgScore: number; pendingApps: number; activeJobs: number }): string {
  const q = input.toLowerCase();
  if (/^(hi|hello|hey)/.test(q))
    return `Hi! 👋 Dashboard summary:\n• 👥 Candidates: ${ctx.total}\n• 📊 Avg score: ${ctx.avgScore}/1000\n• 📋 Active jobs: ${ctx.activeJobs}\n• 📨 Pending applications: ${ctx.pendingApps}\n\nHow can I help?`;
  if (q.includes('post') || q.includes('job') || q.includes('create'))
    return `To post a job:\n1. Go to **Post Job** tab\n2. Fill title, type, skills, description\n3. Set minimum ProCred Score for automatic filtering\n4. Click **Post Job**\n\nStudents with matching skills get instant notifications! 🔔`;
  if (q.includes('application') || q.includes('applicant') || q.includes('pipeline'))
    return `In the **Recruitment Pipeline** tab:\n• See all applications grouped by job\n• Filter by status: Applied / Under Review / Shortlisted / Offer Sent\n• Click **Review** to update status\n• Select top candidates and click **Send Offer Letters** — emails go out automatically 📧`;
  if (q.includes('offer') || q.includes('letter') || q.includes('email'))
    return `Sending offer letters:\n1. Go to **Recruitment Pipeline** tab\n2. Open a job's applications\n3. Shortlist candidates\n4. Select them with checkboxes\n5. Click **Send Offer Letters**\n6. Add a custom message and deadline\n7. Emails are sent automatically via ProCred to each selected candidate 🎉`;
  if (q.includes('scan') || q.includes('resume') || q.includes('rank'))
    return `Use the **AI Scanner** tab:\n1. Paste your job description\n2. Click Scan & Rank\n3. Candidates are ranked by keyword match % + ProCred score combined\n\nThis gives you the most qualified AND most motivated candidates first.`;
  if (q.includes('score') || q.includes('filter') || q.includes('minimum'))
    return `Set a **Minimum ProCred Score** when posting a job (out of 1000):\n• 750+ = Expert tier (highly verified)\n• 500–749 = Intermediate\n• 0–499 = Entry level\n\nStudents below minimum score cannot apply — this auto-filters your pipeline.`;
  if (q.includes('help'))
    return `I can help with:\n📢 **Post Job** — create listings, set filters\n📋 **Recruitment Pipeline** — manage applications, shortlist, send offers\n🤖 **AI Scanner** — rank candidates by JD match\n🔍 **Candidate Search** — filter by score, skills, university\n📧 **Offer Letters** — automated email delivery`;
  return `Current: ${ctx.activeJobs} active jobs, ${ctx.pendingApps} pending applications, avg score ${ctx.avgScore}/1000.\n\nTry: "post a job", "view applications", "send offer letters", "scan resumes", or "filter by score"`;
}

function scoreLabel(s: number) {
  if (s >= 750) return { label: 'Expert', color: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (s >= 400) return { label: 'Inter.', color: 'text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
  return { label: 'Beginner', color: 'text-orange-600', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  applied:      { label: 'Applied',      color: 'bg-blue-50 text-blue-700 border-blue-200',    icon: <Clock className="h-3.5 w-3.5" /> },
  under_review: { label: 'Under Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Eye className="h-3.5 w-3.5" /> },
  shortlisted:  { label: 'Shortlisted',  color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Star className="h-3.5 w-3.5" /> },
  offer_sent:   { label: 'Offer Sent ✉️', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Mail className="h-3.5 w-3.5" /> },
  rejected:     { label: 'Rejected',     color: 'bg-red-50 text-red-700 border-red-200',      icon: <X className="h-3.5 w-3.5" /> },
  accepted:     { label: 'Accepted 🎉',   color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

interface Props { onPageChange?: (page: string) => void; }

export function RecruiterDashboard({ onPageChange }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'post' | 'scanner' | 'search' | 'profile'>('pipeline');

  // Candidate search
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [minScore, setMinScore] = useState('0');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Jobs
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  interface JobFormState {
    title: string; type: string; location: string; skills: string; description: string;
    requirements: string; salary: string; deadline: string; minScore: string; openings: string;
  }
  const [jobForm, setJobForm] = useState<JobFormState>(() => {
    const saved = localStorage.getItem('procred_jobForm');
    return saved ? JSON.parse(saved) : { title: '', type: 'Full-time', location: '', skills: '', description: '', requirements: '', salary: '', deadline: '', minScore: '0', openings: '1' };
  });
  useEffect(() => { localStorage.setItem('procred_jobForm', JSON.stringify(jobForm)); }, [jobForm]);
  
  // Profile
  const [profileForm, setProfileForm] = useState({ organization: user?.organization || '', fullName: user?.fullName || '' });
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [postSuccess, setPostSuccess] = useState('');

  // Applications / pipeline
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appFilter, setAppFilter] = useState('all');
  const [appSort, setAppSort] = useState('applied_asc');
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerDeadline, setOfferDeadline] = useState('');
  const [sendingOffers, setSendingOffers] = useState(false);
  const [offerResult, setOfferResult] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // AI Scanner
  const [scanJD, setScanJD] = useState('');
  const [scanResults, setScanResults] = useState<(Student & { matchScore: number })[]>([]);
  const [scanning, setScanning] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<{id:number, text: string, time: string, read: boolean}[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  const notifRef = useRef<HTMLDivElement>(null);

  // Chatbot
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: 'bot', text: "Hi! 👋 I'm your ProCred recruiter assistant. I can help you post jobs, manage applications, send offer letters, or scan resumes. What do you need?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchStudents = useCallback(async (params?: object) => {
    setLoadingStudents(true);
    try { const r = await recruiterAPI.searchStudents(params); setStudents(r.data.data); }
    catch { setStudents([]); } finally { setLoadingStudents(false); }
  }, []);

  const fetchMyJobs = useCallback(async () => {
    setLoadingJobs(true);
    try { const r = await jobsAPI.getMyJobs(); setMyJobs(r.data.data); }
    catch { setMyJobs([]); } finally { setLoadingJobs(false); }
  }, []);

  const fetchApplications = useCallback(async (jobId: string, status?: string) => {
    setLoadingApps(true);
    try {
      const r = await jobsAPI.getJobApplications(jobId, status && status !== 'all' ? { status } : undefined);
      setApplications(r.data.data);
    } catch { setApplications([]); } finally { setLoadingApps(false); }
  }, []);

  useEffect(() => { fetchStudents(); fetchMyJobs(); }, [fetchStudents, fetchMyJobs]);
  useEffect(() => { if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs, showChat]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => {
    if (selectedJob) fetchApplications(selectedJob._id, appFilter);
  }, [selectedJob, appFilter, fetchApplications]);

  const handlePostJob = async () => {
    if (!jobForm.title || !jobForm.description) { alert('Title and description are required.'); return; }
    setPostingJob(true);
    try {
      await jobsAPI.createJob({
        ...jobForm,
        skills: jobForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        minScore: parseInt(jobForm.minScore) || 0,
        openings: parseInt(jobForm.openings) || 1,
      });
      await fetchMyJobs();
      setJobForm({ title: '', type: 'Full-time', location: '', skills: '', description: '', requirements: '', salary: '', deadline: '', minScore: '0', openings: '1' });
      localStorage.removeItem('procred_jobForm');
      setPostSuccess('Job posted! Matched students have been notified.');
      setTimeout(() => setPostSuccess(''), 5000);
      setActiveTab('pipeline');
      setNotifications(p => [{ id: Date.now(), text: `📢 "${jobForm.title}" posted successfully!`, time: 'just now', read: false }, ...p]);
    } catch (e: any) { 
      if (e.response?.status === 403 && e.response?.data?.message === 'SUBSCRIPTION_REQUIRED') {
        if (onPageChange) onPageChange('subscription');
      } else {
        alert(e.response?.data?.reason || e.response?.data?.message || 'Failed to post job.'); 
      }
    }
    finally { setPostingJob(false); }
  };

  const handleUpdateStatus = async (appId: string, status: string, note?: string) => {
    setUpdatingStatus(appId);
    try {
      await jobsAPI.updateAppStatus(appId, { status, recruiterNote: note });
      setApplications(p => p.map(a => a._id === appId ? { ...a, status } : a));
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to update.'); }
    finally { setUpdatingStatus(null); }
  };

  const handleSendOffers = async () => {
    if (selectedApps.size === 0) { alert('Select at least one candidate.'); return; }
    setSendingOffers(true);
    try {
      const res = await jobsAPI.sendOfferLetters({
        appIds: Array.from(selectedApps),
        customMessage: offerMessage,
        deadline: offerDeadline,
      });
      const sent = res.data.results?.length || selectedApps.size;
      setOfferResult(`✅ Status updated to 'Offer Sent' for ${sent} candidate(s)!`);
      setSelectedApps(new Set());
      setApplications(p => p.map(a => selectedApps.has(a._id) ? { ...a, status: 'offer_sent' } : a));
      setNotifications(p => [{ id: Date.now(), text: `📋 Marked ${sent} candidate(s) as Offer Sent`, time: 'just now', read: false }, ...p]);
      setTimeout(() => { setShowOfferModal(false); setOfferResult(''); }, 3000);
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to send offers.'); }
    finally { setSendingOffers(false); }
  };

  const handleBoost = async (id: string) => {
    try {
      await jobsAPI.boostJob(id);
      setMyJobs(p => p.map(j => j._id === id ? { ...j, isSponsored: true } : j));
      setNotifications(p => [{ id: Date.now(), text: `🚀 Job Boosted! Your listing will now appear at the top of student searches.`, time: 'just now', read: false }, ...p]);
    } catch (e: any) {
      if (e.response?.status === 403 && e.response?.data?.message === 'SUBSCRIPTION_REQUIRED') {
        if (onPageChange) onPageChange('subscription');
      } else {
        alert(e.response?.data?.message || 'Failed to boost job.');
      }
    }
  };

  const handleScan = () => {
    if (!scanJD.trim()) { alert('Paste a job description first.'); return; }
    setScanning(true);
    setTimeout(() => {
      const kw = scanJD.toLowerCase().split(/[\s,.\n]+/).filter(w => w.length > 3);
      const scored = students.map(s => {
        const text = s.topSkills.join(' ').toLowerCase() + ' ' + s.major.toLowerCase();
        const matches = kw.filter(k => text.includes(k)).length;
        return { ...s, matchScore: Math.min(Math.round((matches / Math.max(kw.length, 1)) * 70 + (s.creditScore / 1000) * 30), 100) };
      }).sort((a, b) => b.matchScore - a.matchScore);
      setScanResults(scored);
      setScanning(false);
    }, 1500);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput;
    setChatMsgs(p => [...p, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);
    const avgScore = students.length ? Math.round(students.reduce((s, c) => s + c.creditScore, 0) / students.length) : 0;
    const pendingApps = applications.filter(a => a.status === 'applied').length;
    setTimeout(() => {
      setChatMsgs(p => [...p, { role: 'bot', text: buildReply(msg, { total: students.length, avgScore, pendingApps, activeJobs: myJobs.filter(j => j.status === 'active').length }) }]);
      setChatLoading(false);
    }, 700);
  };

  const initials = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
  const allSkills = [...new Set(students.flatMap(s => s.topSkills.map(sk => sk.split(' ')[0])))];
  const allUniversities = [...new Set(students.map(s => s.university).filter(Boolean))];
  const avgScore = students.length ? Math.round(students.reduce((s, c) => s + c.creditScore, 0) / students.length) : 0;
  const totalPendingApps = myJobs.reduce((s, j) => s + (j.countMap?.['applied'] || 0), 0);

  const tabs = [
    { key: 'pipeline', label: 'Recruitment Pipeline', icon: <UserCheck className="h-4 w-4" />, badge: totalPendingApps },
    { key: 'post', label: 'Post Job', icon: <Plus className="h-4 w-4" />, badge: 0 },
    { key: 'scanner', label: 'AI Scanner', icon: <Cpu className="h-4 w-4" />, badge: 0 },
    { key: 'search', label: 'Find Candidates', icon: <Search className="h-4 w-4" />, badge: 0 },
    { key: 'profile', label: 'Organization Profile', icon: <Star className="h-4 w-4" />, badge: 0 },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-xl overflow-hidden">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-2xl font-black">{user?.fullName?.charAt(0)}</span>}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-white">Recruiter Dashboard 🎯</h1>
                <p className="text-slate-400 mt-1">{user?.fullName} · <span className="text-emerald-400">{user?.organization || 'Your Company'}</span></p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {onPageChange && (
                <Button onClick={() => onPageChange('home')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 text-sm">
                  <Home className="h-4 w-4 mr-1.5" /> Home
                </Button>
              )}
              <div className="relative" ref={notifRef}>
                <Button onClick={() => setShowNotif(!showNotif)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 text-sm relative">
                  <Bell className="h-4 w-4 mr-1.5" /> Alerts
                  {unread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unread}</span>}
                </Button>
                {showNotif && (
                  <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
                      <h4 className="font-bold text-slate-900">Notifications</h4>
                      <button onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))} className="text-xs text-blue-600 hover:underline font-medium">Mark all read</button>
                    </div>
                    <div className="divide-y max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
                          className={`px-5 py-4 cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                          <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n.text}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={() => setActiveTab('post')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-9 shadow-xl">
                <Plus className="h-4 w-4 mr-1.5" /> Post a Job
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: <Briefcase className="h-6 w-6 text-emerald-600" />, bg: 'bg-emerald-50', value: myJobs.filter(j => j.status === 'active').length, label: 'Active Jobs' },
            { icon: <Users className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-50', value: myJobs.reduce((s, j) => s + (j.totalApplicants || 0), 0), label: 'Total Applications' },
            { icon: <Clock className="h-6 w-6 text-orange-600" />, bg: 'bg-orange-50', value: totalPendingApps, label: 'Pending Review' },
          ].map(({ icon, bg, value, label }) => (
            <Card key={label} className="border-0 shadow-md bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
                <div><div className="text-2xl font-black text-slate-900">{value}</div><p className="text-slate-500 text-xs font-medium">{label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab nav */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-1 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 relative flex-shrink-0 ${activeTab === tab.key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              {tab.icon} {tab.label}
              {tab.badge > 0 && <span className={`ml-1 text-xs rounded-full px-2 py-0.5 font-bold ${activeTab === tab.key ? 'bg-white/20' : 'bg-orange-100 text-orange-700'}`}>{tab.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── RECRUITMENT PIPELINE ── */}
        {activeTab === 'pipeline' && (
          <div className="space-y-5">
            {myJobs.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 bg-white shadow-none">
                <CardContent className="p-16 text-center space-y-4">
                  <Briefcase className="h-16 w-16 text-slate-300 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-700">No job postings yet</h3>
                  <p className="text-slate-500">Post your first job to start receiving applications from verified students.</p>
                  <Button onClick={() => setActiveTab('post')} className="bg-emerald-600 hover:bg-emerald-700">Post a Job →</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Job list */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Your Jobs</h3>
                  {loadingJobs ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div> : myJobs.map(j => (
                    <button key={j._id} onClick={() => { setSelectedJob(j); setSelectedApps(new Set()); setAppFilter('all'); }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${selectedJob?._id === j._id ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{j.title}</h4>
                          <p className="text-slate-500 text-xs mt-0.5">{j.type} · {j.location || 'Remote'}</p>
                        </div>
                        <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
                          {j.isSponsored && <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0 shadow-sm px-1.5 py-0"><Star className="h-2.5 w-2.5 mr-1 fill-white" /> Sponsored</Badge>}
                          <Badge className={`text-xs ${j.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>{j.status}</Badge>
                          <p className="text-orange-600 text-xs font-bold mt-0.5">{j.totalApplicants || 0} applied</p>
                          {!j.isSponsored && j.status === 'active' && (
                            <Button size="sm" className="mt-1 h-6 px-2 text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold tracking-wide rounded uppercase" onClick={(e) => { e.stopPropagation(); handleBoost(j._id); }}>
                              🚀 Boost
                            </Button>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Applications panel */}
                <div className="lg:col-span-2 space-y-4">
                  {!selectedJob ? (
                    <div className="flex items-center justify-center h-64 bg-white rounded-xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">← Select a job to view applications</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>
                          <p className="text-slate-500 text-sm">{selectedJob.company} · {selectedJob.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={appFilter} onValueChange={setAppFilter}>
                            <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="offer_sent">Offer Sent</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={appSort} onValueChange={setAppSort}>
                            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied_asc">Oldest First</SelectItem>
                              <SelectItem value="applied_desc">Newest First</SelectItem>
                              <SelectItem value="score_desc">Highest Score</SelectItem>
                              <SelectItem value="score_asc">Lowest Score</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => fetchApplications(selectedJob._id, appFilter)} className="h-9">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Offer letters button */}
                      {selectedApps.size > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                          <p className="text-emerald-800 font-semibold text-sm">{selectedApps.size} candidate(s) selected</p>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => setShowOfferModal(true)}>
                              <CheckCircle className="h-4 w-4 mr-1.5" />Mark Offer Sent
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setSelectedApps(new Set())} className="h-8">Clear</Button>
                          </div>
                        </div>
                      )}

                      {loadingApps ? (
                        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
                      ) : applications.length === 0 ? (
                        <Card className="border-2 border-dashed border-slate-200 shadow-none bg-white">
                          <CardContent className="p-10 text-center">
                            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No applications yet for this filter.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {[...applications].sort((a, b) => {
                            if (appSort === 'score_desc') return b.student.creditScore - a.student.creditScore;
                            if (appSort === 'score_asc') return a.student.creditScore - b.student.creditScore;
                            if (appSort === 'applied_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                          }).map(app => {
                            const sl = scoreLabel(app.student.creditScore);
                            const st = STATUS_LABELS[app.status] || STATUS_LABELS['applied'];
                            return (
                              <Card key={app._id} className={`border-0 shadow-md bg-white transition-all ${selectedApps.has(app._id) ? 'ring-2 ring-emerald-400' : ''}`}>
                                <CardContent className="p-5">
                                  <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <input type="checkbox" checked={selectedApps.has(app._id)}
                                      onChange={(e) => {
                                        const s = new Set(selectedApps);
                                        e.target.checked ? s.add(app._id) : s.delete(app._id);
                                        setSelectedApps(s);
                                      }}
                                      className="mt-1 w-4 h-4 accent-emerald-600 flex-shrink-0 cursor-pointer" />
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-emerald-100 text-blue-700 font-bold text-xs">{initials(app.student.fullName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <h4 className="font-bold text-slate-900 truncate">{app.student.fullName}</h4>
                                          <p className="text-slate-500 text-xs truncate">{app.student.major} · {app.student.university}</p>
                                          {app.student.location && <p className="text-slate-400 text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{app.student.location}</p>}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <div className={`text-lg font-black ${sl.color}`}>{app.student.creditScore}<span className="text-xs text-slate-400">/1k</span></div>
                                          <Badge className={`text-xs border ${sl.badge} mt-0.5`}>{sl.label}</Badge>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${st.color}`}>{st.icon}{st.label}</span>
                                        {app.coverNote && <span className="text-xs text-slate-400 italic truncate max-w-[150px]">"{app.coverNote}"</span>}
                                        {app.student.resumeUrl && <a href={app.student.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"><FileText className="h-3 w-3" />Resume</a>}
                                      </div>

                                      {/* Status actions */}
                                      {app.status !== 'offer_sent' && app.status !== 'accepted' && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                          {app.status === 'applied' && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                              disabled={updatingStatus === app._id}
                                              onClick={() => handleUpdateStatus(app._id, 'under_review')}>
                                              <Eye className="h-3 w-3 mr-1" />Review
                                            </Button>
                                          )}
                                          {(app.status === 'applied' || app.status === 'under_review') && (
                                            selectedJob.type === 'Bounty' ? (
                                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                disabled={updatingStatus === app._id}
                                                onClick={() => handleUpdateStatus(app._id, 'accepted')}>
                                                <CheckCircle className="h-3 w-3 mr-1" />Accept & Pay Bounty
                                              </Button>
                                            ) : (
                                              <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                                                disabled={updatingStatus === app._id}
                                                onClick={() => handleUpdateStatus(app._id, 'shortlisted')}>
                                                <Star className="h-3 w-3 mr-1" />Shortlist
                                              </Button>
                                            )
                                          )}
                                          {app.status !== 'rejected' && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                              disabled={updatingStatus === app._id}
                                              onClick={() => handleUpdateStatus(app._id, 'rejected')}>
                                              <X className="h-3 w-3 mr-1" />Reject
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── POST JOB ── */}
        {activeTab === 'post' && (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5 text-emerald-600" />Post a Job / Internship</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {postSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 font-medium flex items-center gap-2"><CheckCircle className="h-5 w-5" />{postSuccess}</div>}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                📢 Once posted, students with matching skills receive instant dashboard notifications. Set a minimum ProCred Score to auto-filter unqualified applicants.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Job Title *</label><Input placeholder="e.g. Frontend Developer" value={jobForm.title} onChange={(e) => setJobForm(p => ({ ...p, title: e.target.value }))} className="h-11" /></div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Employment Type</label>
                  <Select value={jobForm.type} onValueChange={(v) => setJobForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{['Full-time','Internship','Part-time','Contract','Remote','Bounty'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Location</label><Input placeholder="e.g. Bangalore / Remote" value={jobForm.location} onChange={(e) => setJobForm(p => ({ ...p, location: e.target.value }))} className="h-11" /></div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Salary / Stipend</label><Input placeholder="e.g. ₹15–25 LPA or ₹25K/mo" value={jobForm.salary} onChange={(e) => setJobForm(p => ({ ...p, salary: e.target.value }))} className="h-11" /></div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Application Deadline</label><Input type="date" value={jobForm.deadline} min={new Date().toISOString().split('T')[0]} onChange={(e) => setJobForm(p => ({ ...p, deadline: e.target.value }))} className="h-11" /></div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">No. of Openings</label><Input type="number" min={1} value={jobForm.openings} onChange={(e) => setJobForm(p => ({ ...p, openings: e.target.value }))} className="h-11" /></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Minimum ProCred Score <span className="text-slate-400 font-normal text-xs">(0 = no minimum)</span>
                </label>
                <div className="flex items-center gap-4">
                  <Input type="number" min={0} max={1000} value={jobForm.minScore} onChange={(e) => setJobForm(p => ({ ...p, minScore: e.target.value }))} className="h-11 w-32" />
                  <span className="text-slate-500 text-sm">/ 1000 — students below this score cannot apply</span>
                </div>
              </div>
              <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Required Skills <span className="text-slate-400 font-normal">(comma-separated)</span></label><Input placeholder="e.g. React, TypeScript, Node.js, MongoDB" value={jobForm.skills} onChange={(e) => setJobForm(p => ({ ...p, skills: e.target.value }))} className="h-11" /></div>
              <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Job Description *</label><Textarea placeholder="Describe the role, responsibilities, and what makes it great…" value={jobForm.description} onChange={(e) => setJobForm(p => ({ ...p, description: e.target.value }))} rows={5} /></div>
              <div className="space-y-2"><label className="text-sm font-semibold text-slate-700">Requirements <span className="text-slate-400 font-normal">(optional)</span></label><Textarea placeholder="Educational qualifications, experience requirements, etc." value={jobForm.requirements} onChange={(e) => setJobForm(p => ({ ...p, requirements: e.target.value }))} rows={3} /></div>
              <Button onClick={handlePostJob} disabled={postingJob} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold">
                {postingJob ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Posting…</> : <><Briefcase className="h-5 w-5 mr-2" />Post Job & Notify Students</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── AI SCANNER ── */}
        {activeTab === 'scanner' && (
          <div className="space-y-5">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Cpu className="h-5 w-5 text-purple-600" />AI Resume & Profile Scanner</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">🤖 Paste your job description. AI ranks all {students.length} candidate profiles by keyword match % + ProCred score combined.</div>
                <Textarea placeholder="Paste your full job description here…" value={scanJD} onChange={(e) => setScanJD(e.target.value)} rows={6} />
                <Button onClick={handleScan} disabled={scanning} className="bg-purple-600 hover:bg-purple-700 h-11 px-8">
                  <Cpu className="h-4 w-4 mr-2" />{scanning ? 'Scanning…' : 'Scan & Rank Candidates'}
                </Button>
              </CardContent>
            </Card>
            {scanning && <div className="text-center py-10"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-slate-600">Analyzing profiles…</p></div>}
            {!scanning && scanResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Ranked Results 🏆</h3>
                {scanResults.map((c: any, idx) => {
                  const sl = scoreLabel(c.creditScore);
                  const medal = idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-blue-500';
                  return (
                    <Card key={c._id} className={`border-0 shadow-md bg-white ${idx === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-9 h-9 ${medal} rounded-full flex items-center justify-center text-white font-black text-sm`}>#{idx+1}</div>
                          <Avatar className="h-9 w-9"><AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">{initials(c.fullName)}</AvatarFallback></Avatar>
                          <div className="min-w-0"><h4 className="font-bold text-slate-900 truncate">{c.fullName}</h4><p className="text-sm text-slate-500 truncate">{c.major} · {c.university}</p></div>
                        </div>
                        <div className="flex items-center gap-5 flex-shrink-0">
                          <div className="text-center"><div className="text-xl font-black text-purple-600">{c.matchScore}%</div><div className="text-xs text-slate-400">Match</div><Progress value={c.matchScore} className="h-1.5 w-16 mt-1" /></div>
                          <div className="text-center"><div className={`text-xl font-black ${sl.color}`}>{c.creditScore}<span className="text-xs text-slate-400">/1k</span></div><Badge className={`text-xs border ${sl.badge} mt-1`}>{sl.label}</Badge></div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-9" onClick={() => handleViewProfile(c._id)}><Eye className="h-4 w-4 mr-1" />Profile</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FIND CANDIDATES ── */}
        {activeTab === 'search' && (
          <div className="space-y-5">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-lg"><Filter className="h-5 w-5 text-blue-600" />Search & Filter Candidates</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2"><Input placeholder="Name, major, university…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchStudents({ search: searchQuery, skill: selectedSkill !== 'all' ? selectedSkill : undefined, university: selectedUniversity !== 'all' ? selectedUniversity : undefined, minScore: parseInt(minScore) > 0 ? minScore : undefined })} className="h-11" /></div>
                  <Select value={selectedSkill} onValueChange={setSelectedSkill}><SelectTrigger className="h-11"><SelectValue placeholder="Skill" /></SelectTrigger><SelectContent><SelectItem value="all">All Skills</SelectItem>{allSkills.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}><SelectTrigger className="h-11"><SelectValue placeholder="University" /></SelectTrigger><SelectContent><SelectItem value="all">All Universities</SelectItem>{allUniversities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">Min Score:</span>
                    <Input type="number" min={0} max={1000} value={minScore} onChange={(e) => setMinScore(e.target.value)} className="w-20 h-8 border-0 bg-transparent p-0 text-center font-bold" />
                    <span className="text-sm text-slate-400">/1000</span>
                  </div>
                  <Button onClick={() => fetchStudents({ search: searchQuery, skill: selectedSkill !== 'all' ? selectedSkill : undefined, university: selectedUniversity !== 'all' ? selectedUniversity : undefined, minScore: parseInt(minScore) > 0 ? minScore : undefined })} className="bg-blue-600 hover:bg-blue-700 h-10 px-6"><Search className="h-4 w-4 mr-2" />Search</Button>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedSkill('all'); setSelectedUniversity('all'); setMinScore('0'); fetchStudents(); }} className="h-10">Clear</Button>
                </div>
              </CardContent>
            </Card>

            {loadingStudents ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            : students.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 shadow-none bg-white"><CardContent className="p-12 text-center"><Users className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No candidates found.</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {students.map(c => {
                  const sl = scoreLabel(c.creditScore);
                  return (
                    <Card key={c._id} className="border-0 shadow-md bg-white hover:shadow-xl transition-all">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 flex-shrink-0"><AvatarFallback className="bg-gradient-to-br from-blue-100 to-emerald-100 text-blue-700 font-bold text-sm">{initials(c.fullName)}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div><h3 className="font-bold text-slate-900 flex items-center gap-1.5 truncate">{c.fullName}{c.verified && <CheckCircle className="h-4 w-4 text-emerald-500" />}</h3><p className="text-slate-500 text-sm">{c.major}</p></div>
                              <div className="text-right"><div className={`text-xl font-black ${sl.color}`}>{c.creditScore}<span className="text-xs text-slate-400">/1k</span></div><Badge className={`text-xs border ${sl.badge} mt-1`}>{sl.label}</Badge></div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />{c.university}</div>
                          {c.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{c.location}</div>}
                          <div className="flex items-center gap-2"><Award className="h-4 w-4" />{c.achievementCount} verified achievements</div>
                        </div>
                        {c.topSkills.length > 0 && <div className="flex flex-wrap gap-1.5">{c.topSkills.map((s, i) => <Badge key={i} className="bg-blue-50 text-blue-700 border-blue-100 text-xs">{s}</Badge>)}</div>}
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-9" onClick={() => handleViewProfile(c._id)} disabled={profileLoading}><Eye className="h-4 w-4 mr-2" />View Profile</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl">Organization Profile</CardTitle>
                <p className="text-sm text-slate-500">Manage your company details and logo to stand out to candidates.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border">
                    {profileAvatarFile ? (
                      <img src={URL.createObjectURL(profileAvatarFile)} className="w-full h-full object-cover" />
                    ) : user?.avatarUrl ? (
                      <img src={user.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-slate-400 font-black">{user?.fullName?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Logo</label>
                    <input type="file" accept="image/*" onChange={(e) => setProfileAvatarFile(e.target.files?.[0] || null)} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Your Full Name</label>
                    <Input value={profileForm.fullName} onChange={e => setProfileForm(p => ({...p, fullName: e.target.value}))} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Organization Name</label>
                    <Input value={profileForm.organization} onChange={e => setProfileForm(p => ({...p, organization: e.target.value}))} className="h-11" />
                  </div>
                </div>
                <Button 
                  disabled={savingProfile}
                  onClick={async () => {
                    setSavingProfile(true);
                    try {
                      const { authAPI } = await import('../lib/api');
                      let newData: any = { ...profileForm };
                      if (profileAvatarFile) {
                        const fd = new FormData();
                        fd.append('avatar', profileAvatarFile);
                        fd.append('fullName', profileForm.fullName);
                        fd.append('organization', profileForm.organization);
                        await authAPI.updateProfile(fd);
                      } else {
                        await authAPI.updateProfile(newData);
                      }
                      alert('Profile updated successfully! Refresh to see changes across the app.');
                    } catch (err: any) { alert(err.response?.data?.message || 'Failed to update profile'); }
                    finally { setSavingProfile(false); }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6">
                <CardTitle className="text-xl">Subscription & Credits</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <Badge className={user?.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-sm' : 'bg-slate-100 text-slate-800 border-slate-200 px-3 py-1 text-sm'}>
                      {user?.subscriptionStatus === 'active' ? 'Pro Plan Active' : 'Free Tier'}
                    </Badge>
                    <p className="mt-3 text-sm text-slate-600 font-medium">
                      {(user as any)?.subscriptionExpiry ? `Renews on: ${new Date((user as any).subscriptionExpiry).toLocaleDateString()}` : 'No active expiry date.'}
                    </p>
                  </div>
                  {(!user?.subscriptionStatus || user?.subscriptionStatus === 'free') && onPageChange && (
                    <Button onClick={() => onPageChange('subscription')} className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-500/20">
                      Upgrade to Pro <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Offer Letter Modal ── */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-emerald-700"><CheckCircle className="h-5 w-5" />Update Status to Offer Sent</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {offerResult ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-5 text-center space-y-2">
                  <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
                  <p className="font-bold">{offerResult}</p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                    📋 You are updating the status to 'Offer Sent' for <strong>{selectedApps.size} candidate(s)</strong>.
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Response Deadline <span className="text-slate-400 font-normal">(optional internal note)</span></label>
                    <Input type="date" value={offerDeadline} min={new Date().toISOString().split('T')[0]} onChange={(e) => setOfferDeadline(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Custom Note <span className="text-slate-400 font-normal">(optional)</span></label>
                    <Textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="Add a personal note for the selected candidates…" rows={4} className="text-sm" />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSendOffers} disabled={sendingOffers} className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11 font-bold">
                      {sendingOffers ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Updating…</> : <><CheckCircle className="h-5 w-5 mr-2" />Update {selectedApps.size} Candidate(s)</>}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowOfferModal(false); setOfferResult(''); }} className="h-11">Cancel</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Student Profile Modal ── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-2xl my-8">
            <CardHeader className="flex flex-row items-start justify-between border-b p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14"><AvatarFallback className="bg-gradient-to-br from-blue-100 to-emerald-100 text-blue-700 font-black text-lg">{initials(selectedStudent.fullName)}</AvatarFallback></Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">{selectedStudent.fullName}{selectedStudent.verified && <CheckCircle className="h-5 w-5 text-emerald-500" />}</CardTitle>
                  <p className="text-slate-500 mt-0.5 text-sm">{selectedStudent.major} · {selectedStudent.university}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 ml-4"><X className="h-5 w-5" /></button>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              {(() => { const sl = scoreLabel(selectedStudent.creditScore); return (
                <div className={`flex items-center gap-4 rounded-2xl p-5 border ${sl.badge}`}>
                  <TrendingUp className={`h-9 w-9 ${sl.color}`} />
                  <div className="flex-1">
                    <div className={`text-3xl font-black ${sl.color}`}>{selectedStudent.creditScore}<span className="text-base text-slate-400 font-normal">/1000</span></div>
                    <div className="text-sm text-slate-500">ProCred Score · <span className={`font-bold ${sl.color}`}>{sl.label}</span></div>
                    <Progress value={(selectedStudent.creditScore / 1000) * 100} className="mt-2 h-2" />
                  </div>
                </div>
              ); })()}
              {selectedStudent.bio && <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-4 border border-slate-200">{selectedStudent.bio}</p>}
              {selectedStudent.skills.length > 0 && (
                <div><h4 className="font-bold text-slate-900 mb-3">Skills</h4>
                  <div className="grid grid-cols-2 gap-3">{selectedStudent.skills.map(sk => (<div key={sk._id} className="space-y-1"><div className="flex justify-between text-sm"><span className="font-medium">{sk.name}</span><span className="font-bold text-blue-600">{sk.level}%</span></div><Progress value={sk.level} className="h-1.5" /></div>))}</div>
                </div>
              )}
              {selectedStudent.achievements.length > 0 && (
                <div><h4 className="font-bold text-slate-900 mb-3">Verified Achievements</h4>
                  <div className="space-y-2">{selectedStudent.achievements.map(a => (<div key={a._id} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /><div><p className="font-semibold text-sm">{a.title}</p><p className="text-xs text-slate-500">{a.issuer}</p></div></div><Badge className="bg-emerald-100 text-emerald-800 text-xs">+{a.creditsEarned} pts</Badge></div>))}</div>
                </div>
              )}
              <div className="flex gap-3"><Button className="flex-1 bg-blue-600 hover:bg-blue-700 h-11" onClick={() => { setNotifications(p => [{id: Date.now(), text: `📨 You contacted ${selectedStudent.fullName}`, time: 'just now', read: false}, ...p]); alert(`Connection request sent to ${selectedStudent.fullName}!`); }}>Contact Candidate</Button><Button variant="outline" onClick={() => setSelectedStudent(null)} className="h-11">Close</Button></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Chatbot ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {showChat && (
          <div className="mb-4 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ height: '500px' }}>
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><Bot className="h-5 w-5 text-white" /></div>
                <div><p className="text-white font-bold text-sm">Recruiter AI</p><div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" /><span className="text-emerald-200 text-xs">Online</span></div></div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {chatMsgs.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><Bot className="h-4 w-4 text-white" /></div>}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-none'}`}>{msg.text}</div>
                </div>
              ))}
              {chatLoading && <div className="flex gap-2.5"><div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center"><Bot className="h-4 w-4 text-white" /></div><div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border"><div className="flex gap-1">{[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div></div>}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t bg-white p-3 flex-shrink-0">
              <div className="flex flex-wrap gap-1.5 mb-2.5">{['post a job', 'view applications', 'send offers', 'scan resumes', 'filter candidates'].map(h => <button key={h} onClick={() => setChatInput(h)} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-1 font-medium border border-emerald-100">{h}</button>)}</div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()} placeholder="Ask me anything…" className="text-sm h-10" />
                <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}
        <button onClick={() => setShowChat(!showChat)} className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 relative ${showChat ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
          {showChat ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
          {!showChat && unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unread}</span>}
        </button>
      </div>
    </div>
  );

  async function handleViewProfile(id: string) {
    setProfileLoading(true);
    try { const r = await recruiterAPI.getStudentProfile(id); setSelectedStudent(r.data.data); }
    catch { alert('Failed to load profile.'); } finally { setProfileLoading(false); }
  }
}
