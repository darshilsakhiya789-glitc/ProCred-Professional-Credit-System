import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import {
  Shield, CheckCircle, X, AlertCircle, Clock, Home, Bell,
  ExternalLink, RefreshCw, Users, Award, TrendingUp, FileText,
  Search, Eye, GraduationCap, BarChart3, Filter,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { achievementsAPI, recruiterAPI, authAPI } from '../lib/api';

interface PendingAchievement {
  _id: string; title: string; issuer: string; date: string; category: string;
  description: string; documentUrl: string; status: 'pending' | 'verified' | 'rejected';
  createdAt: string; creditsEarned?: number; rejectionReason?: string;
  verifiedByRole?: string;
  student: { _id: string; fullName: string; email: string; university: string; major: string; avatarUrl?: string };
}

interface Student {
  _id: string; fullName: string; university: string; major: string;
  graduationYear: string; creditScore: number; location: string;
  achievementCount: number; verified: boolean;
  topSkills: string[]; recentAchievements: string[];
}

interface Props { onPageChange?: (page: string) => void; }

export function UniversityAdminDashboard({ onPageChange }: Props) {
  const { user, updateUser } = useAuth();
  const [achievements, setAchievements] = useState<PendingAchievement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingAch, setLoadingAch] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'students' | 'stats' | 'profile'>('pending');
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [profileData, setProfileData] = useState({ fullName: user?.fullName || '', adminUniversity: user?.adminUniversity || '', adminDepartment: user?.adminDepartment || '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [notifications, setNotifications] = useState<{id:number, text: string, time: string, read: boolean}[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchAchievements = useCallback(async (status = 'pending') => {
    setLoadingAch(true);
    try {
      const res = await achievementsAPI.getPending(status);
      setAchievements(res.data.data);
    } catch { setAchievements([]); }
    finally { setLoadingAch(false); }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await recruiterAPI.searchStudents({});
      setStudents(res.data.data);
    } catch { setStudents([]); }
    finally { setLoadingStudents(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending' || activeTab === 'verified' || activeTab === 'rejected') {
      fetchAchievements(activeTab);
    } else if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab, fetchAchievements, fetchStudents]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Fetch all to build stats
  const [allAchs, setAllAchs] = useState<{ pending: number; verified: number; rejected: number }>({ pending: 0, verified: 0, rejected: 0 });
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [p, v, r] = await Promise.all([
          achievementsAPI.getPending('pending'),
          achievementsAPI.getPending('verified'),
          achievementsAPI.getPending('rejected'),
        ]);
        setAllAchs({ pending: p.data.count, verified: v.data.count, rejected: r.data.count });
      } catch {}
    };
    fetchStats();
    // Also load students on mount so Total Students count shows immediately
    fetchStudents();
  }, [fetchStudents]);

  const handleVerify = async (id: string, status: 'verified' | 'rejected', reason?: string) => {
    setVerifyLoading(id);
    try {
      await achievementsAPI.updateStatus(id, {
        status,
        creditsEarned: status === 'verified' ? 50 : undefined,
        rejectionReason: status === 'rejected' ? (reason || 'Does not meet verification criteria') : undefined,
      });
      setAchievements(p => p.filter(a => a._id !== id));
      setAllAchs(s => ({
        ...s,
        pending: Math.max(0, s.pending - 1),
        [status]: s[status as keyof typeof s] + 1,
      }));
      setNotifications(p => [{
        id: Date.now(),
        text: status === 'verified'
          ? `✅ Achievement verified — student's ProCred Score updated!`
          : `❌ Achievement rejected — student will see your reason.`,
        time: 'just now', read: false,
      }, ...p]);
    } catch (e: any) { 
      if (e.response?.status === 403 && e.response?.data?.message === 'SUBSCRIPTION_REQUIRED') {
        if (onPageChange) onPageChange('subscription');
      } else {
        alert(e.response?.data?.reason || e.response?.data?.message || 'Failed to update status.'); 
      }
    }
    finally { setVerifyLoading(null); }
  };

  const initials = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

  const filteredAchs = searchQuery
    ? achievements.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.issuer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : achievements;

  const filteredStudents = searchQuery
    ? students.filter(s =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.major.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  const tabs = [
    { key: 'pending', label: 'Pending', icon: <Clock className="h-4 w-4" />, count: allAchs.pending, color: 'orange' },
    { key: 'verified', label: 'Verified', icon: <CheckCircle className="h-4 w-4" />, count: allAchs.verified, color: 'emerald' },
    { key: 'rejected', label: 'Rejected', icon: <X className="h-4 w-4" />, count: allAchs.rejected, color: 'red' },
    { key: 'students', label: 'Students', icon: <Users className="h-4 w-4" />, count: null, color: 'blue' },
    { key: 'stats', label: 'Stats', icon: <BarChart3 className="h-4 w-4" />, count: null, color: 'purple' },
    { key: 'profile', label: 'Profile', icon: <Shield className="h-4 w-4" />, count: null, color: 'slate' },
  ] as const;

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await authAPI.updateProfile(profileData);
      updateUser(res.data.user);
      alert('Profile updated successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to update profile.'); }
    finally { setProfileLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl lg:text-3xl font-black text-white">University Admin Panel</h1>
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/30 text-xs">ADMIN</Badge>
                </div>
                <p className="text-slate-400">
                  {user?.fullName} · <span className="text-purple-300 font-semibold">{user?.adminUniversity || 'Your University'}</span>
                  {user?.adminDepartment && <span className="text-slate-500"> · {user.adminDepartment}</span>}
                </p>
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
                  <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-slate-200 w-96 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
                      <h4 className="font-bold text-slate-900">Notifications</h4>
                      <button onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))} className="text-xs text-blue-600 font-medium hover:underline">Mark all read</button>
                    </div>
                    <div className="divide-y max-h-72 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
                          className={`px-5 py-4 cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-purple-50' : ''}`}>
                          <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n.text}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            { label: 'Pending Review', value: allAchs.pending, icon: <Clock className="h-6 w-6 text-orange-600" />, bg: 'bg-orange-50', urgent: true },
            { label: 'Verified This Month', value: allAchs.verified, icon: <CheckCircle className="h-6 w-6 text-emerald-600" />, bg: 'bg-emerald-50', urgent: false },
            { label: 'Rejected', value: allAchs.rejected, icon: <AlertCircle className="h-6 w-6 text-red-600" />, bg: 'bg-red-50', urgent: false },
            { label: 'Total Students', value: students.length ?? 0, icon: <Users className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-50', urgent: false },
          ].map(({ label, value, icon, bg, urgent }) => (
            <Card key={label} className={`border-0 shadow-md bg-white hover:shadow-lg transition-shadow ${urgent && (value as number) > 0 ? 'ring-2 ring-orange-300' : ''}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{value}</div>
                  <p className="text-slate-500 text-xs font-medium">{label}</p>
                  {urgent && (value as number) > 0 && <p className="text-orange-600 text-xs font-semibold">Needs attention</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800">
            <span className="font-bold">Your role:</span> You are authorized to verify achievement documents submitted by students from <strong>{user?.adminUniversity || 'your university'}</strong>. Verified achievements award 50 credit points to the student's ProCred Score. Rejected achievements notify the student with your reason.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-1 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 relative flex-shrink-0 ${
                activeTab === tab.key
                  ? tab.color === 'orange' ? 'bg-orange-500 text-white shadow-sm'
                  : tab.color === 'emerald' ? 'bg-emerald-600 text-white shadow-sm'
                  : tab.color === 'red' ? 'bg-red-500 text-white shadow-sm'
                  : tab.color === 'blue' ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {tab.icon} {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className={`ml-1 text-xs rounded-full px-2 py-0.5 font-bold ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar (shown for achievement tabs and students) */}
        {activeTab !== 'stats' && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder={activeTab === 'students' ? 'Search students by name or major…' : 'Search by achievement title, student, or issuer…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); fetchAchievements(activeTab !== 'students' ? activeTab : 'pending'); }} className="h-11">
              <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
            </Button>
          </div>
        )}

        {/* ── PENDING / VERIFIED / REJECTED TABS ── */}
        {(activeTab === 'pending' || activeTab === 'verified' || activeTab === 'rejected') && (
          <div className="space-y-4">
            {loadingAch ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : filteredAchs.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 shadow-none bg-white">
                <CardContent className="p-16 text-center space-y-3">
                  {activeTab === 'pending' ? <Clock className="h-16 w-16 text-slate-300 mx-auto" /> : <CheckCircle className="h-16 w-16 text-slate-300 mx-auto" />}
                  <h3 className="text-xl font-bold text-slate-700">
                    {activeTab === 'pending' ? 'All caught up! No pending reviews.' : `No ${activeTab} achievements.`}
                  </h3>
                  {activeTab === 'pending' && <p className="text-slate-500 text-sm">Students from {user?.adminUniversity || 'your university'} will appear here when they submit documents.</p>}
                </CardContent>
              </Card>
            ) : (
              filteredAchs.map((a) => (
                <Card key={a._id} className="border-0 shadow-lg bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                      {/* Student info + achievement */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0 font-bold text-purple-700 text-sm">
                          {initials(a.student?.fullName || '?')}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Achievement */}
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">{a.category}</Badge>
                          </div>
                          <p className="text-slate-500 text-sm">{a.issuer} · {new Date(a.date).toLocaleDateString('en-IN')}</p>
                          {a.description && <p className="text-slate-400 text-xs mt-0.5 italic line-clamp-1">{a.description}</p>}

                          {/* Student details */}
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="font-semibold text-slate-800">{a.student?.fullName}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600 flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{a.student?.major}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500 text-xs">{a.student?.email}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Submitted {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {/* Rejection reason if shown */}
                          {activeTab === 'rejected' && a.rejectionReason && (
                            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              <p className="text-red-700 text-xs font-semibold">Rejection Reason:</p>
                              <p className="text-red-600 text-xs">{a.rejectionReason}</p>
                            </div>
                          )}

                          {/* Verified info */}
                          {activeTab === 'verified' && (
                            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              <p className="text-emerald-700 text-xs font-medium">Verified · +{a.creditsEarned || 50} points awarded to student</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
                        {a.documentUrl ? (
                          <a href={a.documentUrl} target="_blank" rel="noreferrer"
                            className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl border border-blue-200 transition-colors">
                            <ExternalLink className="h-4 w-4" /> View Document
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 justify-center">
                            <AlertCircle className="h-4 w-4" /> No document
                          </div>
                        )}

                        {activeTab === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-bold"
                              disabled={verifyLoading === a._id}
                              onClick={() => handleVerify(a._id, 'verified')}>
                              {verifyLoading === a._id
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <><CheckCircle className="h-4 w-4 mr-1" />Verify</>}
                            </Button>
                            <Button size="sm" variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-10 font-bold"
                              disabled={verifyLoading === a._id}
                              onClick={() => { setRejectModal({ id: a._id, name: a.title }); setRejectReason(''); }}>
                              <X className="h-4 w-4 mr-1" />Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ── STUDENTS TAB ── */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{filteredStudents.length} students from {user?.adminUniversity || 'your university'}</p>
            {loadingStudents ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : filteredStudents.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-300 shadow-none bg-white">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No students found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredStudents.map(s => (
                  <Card key={s._id} className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
                          {initials(s.fullName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                {s.fullName}{s.verified && <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                              </h3>
                              <p className="text-slate-500 text-sm truncate">{s.major} · {s.university}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xl font-black text-blue-700">{s.creditScore}<span className="text-xs text-slate-400">/1k</span></div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="secondary" className="text-xs">{s.achievementCount} achievements</Badge>
                            {s.graduationYear && <Badge variant="secondary" className="text-xs">Class of {s.graduationYear}</Badge>}
                            {s.topSkills.slice(0, 2).map(sk => <Badge key={sk} className="bg-blue-50 text-blue-700 text-xs border border-blue-100">{sk}</Badge>)}
                          </div>
                          <Progress value={(s.creditScore / 1000) * 100} className="h-1.5 mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Award className="h-5 w-5 text-emerald-600" />Verification Rate</CardTitle></CardHeader>
                <CardContent>
                  {(() => {
                    const total = allAchs.verified + allAchs.rejected;
                    const rate = total > 0 ? Math.round((allAchs.verified / total) * 100) : 0;
                    return (
                      <>
                        <div className="text-4xl font-black text-emerald-600 mb-2">{rate}%</div>
                        <p className="text-slate-500 text-sm">{allAchs.verified} verified out of {total} reviewed</p>
                        <Progress value={rate} className="h-3 mt-3" />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600" />Total Reviewed</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-blue-600 mb-2">{allAchs.verified + allAchs.rejected}</div>
                  <p className="text-slate-500 text-sm">Achievements reviewed total</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                      <div className="text-xl font-black text-emerald-600">{allAchs.verified}</div>
                      <p className="text-xs text-slate-500">Approved</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                      <div className="text-xl font-black text-red-600">{allAchs.rejected}</div>
                      <p className="text-xs text-slate-500">Rejected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5 text-orange-600" />Pending Queue</CardTitle></CardHeader>
                <CardContent>
                  <div className={`text-4xl font-black mb-2 ${allAchs.pending > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{allAchs.pending}</div>
                  <p className="text-slate-500 text-sm">{allAchs.pending > 0 ? 'Awaiting your review' : 'Queue is clear ✅'}</p>
                  {allAchs.pending > 0 && (
                    <Button size="sm" onClick={() => setActiveTab('pending')} className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white h-9">
                      Review Now →
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg bg-white">
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-purple-600" />Admin Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {[
                      { label: 'Admin Name', value: user?.fullName },
                      { label: 'Email', value: user?.email },
                      { label: 'University', value: user?.adminUniversity || 'Not specified' },
                      { label: 'Department', value: user?.adminDepartment || 'Not specified' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <span className="text-sm text-slate-500 font-medium">{label}</span>
                        <span className="text-sm text-slate-900 font-semibold text-right max-w-[60%] truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-3">
                    <h4 className="font-bold text-purple-900">Verification Guidelines</h4>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />Verify documents that clearly show student name, issuer, and date</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />Verify certificates from recognized institutions and platforms</li>
                      <li className="flex items-start gap-2"><X className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />Reject blurry, unreadable, or clearly fake documents</li>
                      <li className="flex items-start gap-2"><X className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />Reject documents where name doesn't match student profile</li>
                      <li className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />Always provide a clear reason when rejecting</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* ── ALUMNI & STUDENT ANALYTICS ── */}
            <Card className="border-0 shadow-lg bg-white mt-6 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-white"><BarChart3 className="h-5 w-5" /> University Outcome Analytics</CardTitle>
                <p className="text-indigo-200 text-sm mt-1">Aggregated data for {students.length} students enrolled in your institution.</p>
              </div>
              <CardContent className="p-6">
                {(() => {
                  const scoreBuckets = { expert: 0, intermediate: 0, beginner: 0 };
                  const skillCount: Record<string, number> = {};
                  
                  students.forEach(s => {
                    if (s.creditScore >= 750) scoreBuckets.expert++;
                    else if (s.creditScore >= 400) scoreBuckets.intermediate++;
                    else scoreBuckets.beginner++;

                    s.topSkills.forEach(skill => {
                      skillCount[skill] = (skillCount[skill] || 0) + 1;
                    });
                  });

                  const topSkillsArray = Object.entries(skillCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                  const maxSkillCount = topSkillsArray[0]?.[1] || 1;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Score Distribution */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 border-b pb-2">Score Distribution</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-sm font-semibold text-emerald-700">Expert (750+)</div>
                            <Progress value={students.length ? (scoreBuckets.expert / students.length) * 100 : 0} className="h-2 flex-1 [&>div]:bg-emerald-500" />
                            <div className="w-10 text-right text-sm font-bold text-slate-700">{scoreBuckets.expert}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-sm font-semibold text-blue-700">Inter. (400-749)</div>
                            <Progress value={students.length ? (scoreBuckets.intermediate / students.length) * 100 : 0} className="h-2 flex-1 [&>div]:bg-blue-500" />
                            <div className="w-10 text-right text-sm font-bold text-slate-700">{scoreBuckets.intermediate}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-sm font-semibold text-orange-700">Beg. (0-399)</div>
                            <Progress value={students.length ? (scoreBuckets.beginner / students.length) * 100 : 0} className="h-2 flex-1 [&>div]:bg-orange-500" />
                            <div className="w-10 text-right text-sm font-bold text-slate-700">{scoreBuckets.beginner}</div>
                          </div>
                        </div>
                      </div>

                      {/* Top Skills */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 border-b pb-2">Most Verified Skills</h4>
                        {topSkillsArray.length === 0 ? (
                          <p className="text-sm text-slate-500">Not enough data to display skills.</p>
                        ) : (
                          <div className="space-y-3">
                            {topSkillsArray.map(([skill, count]) => (
                              <div key={skill} className="flex items-center gap-3">
                                <div className="w-28 text-sm font-semibold text-slate-700 truncate" title={skill}>{skill}</div>
                                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(count / maxSkillCount) * 100}%` }} />
                                </div>
                                <div className="w-10 text-right text-sm font-bold text-slate-700">{count}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader><CardTitle className="text-lg">Admin Profile Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <Input value={profileData.fullName} onChange={(e) => setProfileData(p => ({ ...p, fullName: e.target.value }))} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">University</label>
                  <Input value={profileData.adminUniversity} onChange={(e) => setProfileData(p => ({ ...p, adminUniversity: e.target.value }))} className="bg-white" />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Department</label>
                  <Input value={profileData.adminDepartment} onChange={(e) => setProfileData(p => ({ ...p, adminDepartment: e.target.value }))} className="bg-white" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={profileLoading} className="bg-purple-600 hover:bg-purple-700">
                {profileLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" /> Reject Achievement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                You are rejecting: <strong>"{rejectModal.name}"</strong>
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ The student will receive a notification with your rejection reason. Provide a clear, helpful reason so they can re-submit with the correct document.
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Reason for Rejection *</label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Document is blurry/unreadable — please re-upload a clearer scan or photo of the certificate. Ensure the student name and issuer are clearly visible."
                  rows={4}
                  className="text-sm"
                />
              </div>
              {/* Quick reason buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  'Document is blurry or unreadable',
                  'Student name does not match profile',
                  'Certificate appears to be fake or altered',
                  'Wrong document uploaded',
                ].map(r => (
                  <button key={r} onClick={() => setRejectReason(r)}
                    className="text-xs bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-lg px-3 py-1.5 border border-slate-200 hover:border-red-200 transition-colors">
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 h-11 font-bold"
                  disabled={!rejectReason.trim()}
                  onClick={() => {
                    if (!rejectReason.trim()) { alert('Please provide a reason.'); return; }
                    handleVerify(rejectModal.id, 'rejected', rejectReason);
                    setRejectModal(null);
                  }}>
                  <X className="h-4 w-4 mr-2" /> Confirm Rejection
                </Button>
                <Button variant="outline" onClick={() => setRejectModal(null)} className="h-11 px-6">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
