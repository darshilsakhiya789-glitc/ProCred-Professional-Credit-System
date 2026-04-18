import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import {
  Mail, Lock, User, GraduationCap, Building2, Shield,
  Eye, EyeOff, ArrowRight, Loader2, CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onPageChange: (page: string) => void;
}

interface FormData {
  email: string; password: string; confirmPassword: string;
  fullName: string; organization: string; university: string;
  major: string; graduationYear: string;
}

// ── Login Form (outside LoginPage to prevent remount on keypress) ─────────────
interface LoginFormProps {
  role: 'student' | 'recruiter' | 'university_admin';
  isSignUp: boolean; loading: boolean; error: string; formData: FormData;
  showPassword: boolean;
  onInput: (field: keyof FormData, value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (role: 'student' | 'recruiter' | 'university_admin') => void;
  onFillDemo: (role: 'student' | 'recruiter' | 'university_admin') => void;
}

function LoginForm({ role, isSignUp, loading, error, formData, showPassword, onInput, onTogglePassword, onSubmit, onFillDemo }: LoginFormProps) {
  return (
    <div className="space-y-4">
      {isSignUp && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Your full name" value={formData.fullName} onChange={(e) => onInput('fullName', e.target.value)} className="pl-10 h-11" autoComplete="name" />
          </div>
        </div>
      )}

      {isSignUp && role === 'university_admin' && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              University Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. SVIT Vasad, IIT Bombay, NIT Surat (required)"
              value={formData.university}
              onChange={(e) => onInput('university', e.target.value)}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Department / Role</label>
            <Input placeholder="e.g. Examination Cell, Academic Office" value={formData.major} onChange={(e) => onInput('major', e.target.value)} className="h-11" />
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">🛡️ University Admin Requirements:</p>
            <p>• <strong>University name is mandatory</strong> — you will only see achievements from your university's students.</p>
            <p>• <strong>Institutional email required</strong> — your email must end in <code className="bg-purple-100 px-1 rounded">.ac.in</code>, <code className="bg-purple-100 px-1 rounded">.edu.in</code>, <code className="bg-purple-100 px-1 rounded">.edu</code>, or your university's domain.</p>
            <p>• This ensures only authorized academic staff can verify credentials.</p>
          </div>
        </>
      )}
      {isSignUp && role === 'student' && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">University / College</label>
            <Input placeholder="e.g. SVIT, Vasad" value={formData.university} onChange={(e) => onInput('university', e.target.value)} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Major</label>
              <Input placeholder="e.g. Computer Eng." value={formData.major} onChange={(e) => onInput('major', e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Grad Year <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
              <Input placeholder="e.g. 2026" value={formData.graduationYear} onChange={(e) => onInput('graduationYear', e.target.value)} maxLength={4} className="h-11" />
            </div>
          </div>
        </>
      )}

      {isSignUp && role === 'recruiter' && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Company / Organization</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Your company name" value={formData.organization} onChange={(e) => onInput('organization', e.target.value)} className="pl-10 h-11" />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input type="email" placeholder={role === 'student' ? 'student@university.edu' : 'recruiter@company.com'}
            value={formData.email} onChange={(e) => onInput('email', e.target.value)} className="pl-10 h-11" autoComplete="email" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input type={showPassword ? 'text' : 'password'} placeholder="Enter password"
            value={formData.password} onChange={(e) => onInput('password', e.target.value)}
            className="pl-10 pr-10 h-11" autoComplete={isSignUp ? 'new-password' : 'current-password'} />
          <button type="button" onClick={onTogglePassword} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600" tabIndex={-1}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isSignUp && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input type="password" placeholder="Confirm your password"
              value={formData.confirmPassword} onChange={(e) => onInput('confirmPassword', e.target.value)}
              className="pl-10 h-11" autoComplete="new-password" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <Button type="button" onClick={() => onSubmit(role)} disabled={loading}
        className={`w-full h-12 font-bold text-base ${role === 'student' ? 'bg-blue-600 hover:bg-blue-700' : role === 'recruiter' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
        {loading ? (
          <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {role === 'student' ? <GraduationCap className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            {isSignUp ? `Create ${role === 'student' ? 'Student' : role === 'recruiter' ? 'Recruiter' : 'Admin'} Account` : `Sign In as ${role === 'student' ? 'Student' : role === 'recruiter' ? 'Recruiter' : 'University Admin'}`}
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>

      {!isSignUp && (
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Demo credentials:</p>
          <button type="button" onClick={() => onFillDemo(role)} className="text-sm text-blue-600 hover:underline font-medium">
            Fill {role} demo account
          </button>
        </div>
      )}
    </div>
  );
}

// ── LoginPage ─────────────────────────────────────────────────────────────────
export function LoginPage({ onPageChange }: LoginPageProps) {
  const { login, register, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    email: '', password: '', confirmPassword: '', fullName: '',
    organization: '', university: '', major: '', graduationYear: '',
  });

  const handleInput = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleLogin = async (role: 'student' | 'recruiter' | 'university_admin') => {
    setError('');
    if (!formData.email || !formData.password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      if (user.role !== role) {
        logout(); // Critical: clear the logged-in state immediately
        setError(`Wrong account type. "${formData.email}" is a ${user.role} account. Please switch to the ${user.role === 'student' ? 'Student' : 'Recruiter'} tab.`);
        return;
      }
      onPageChange(role === 'student' ? 'student-dashboard' : 'recruiter-dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Login failed. Please check your email and password.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (role: 'student' | 'recruiter' | 'university_admin') => {
    setError('');
    if (!formData.fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!formData.email.trim()) { setError('Please enter your email address.'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const payload: any = { fullName: formData.fullName, email: formData.email, password: formData.password, role };
      if (role === 'student') { payload.university = formData.university; payload.major = formData.major; payload.graduationYear = formData.graduationYear; }
      else if (role === 'recruiter') { payload.organization = formData.organization; }
      else if (role === 'university_admin') { payload.adminUniversity = formData.university; payload.adminDepartment = formData.major; }
      await register(payload);
      const dashMap: Record<string, string> = { student: 'student-dashboard', recruiter: 'recruiter-dashboard', university_admin: 'admin-dashboard' };
      onPageChange(dashMap[role]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSubmit = (role: 'student' | 'recruiter' | 'university_admin') =>
    isSignUp ? handleRegister(role) : handleLogin(role);

  const fillDemo = (role: 'student' | 'recruiter' | 'university_admin') => {
    if (role === 'student') setFormData(p => ({ ...p, email: 'alex.johnson@stanford.edu', password: 'demo123' }));
    else setFormData(p => ({ ...p, email: 'sarah.recruiter@techcorp.com', password: 'demo123' }));
  };

  const sharedProps = { isSignUp, loading, error, formData, showPassword, onInput: handleInput, onTogglePassword: () => setShowPassword(v => !v), onSubmit: handleSubmit, onFillDemo: fillDemo };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* Left — branding */}
        <div className="hidden lg:block space-y-8 text-white">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">Pro<span className="text-blue-400">Cred</span><span className="text-slate-400 text-sm">™</span></span>
            </div>
            <h1 className="text-4xl font-black leading-tight">
              Your verified career<br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">starts here.</span>
            </h1>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed">
              Join 50,000+ students and 1,200+ companies on India's most trusted credential verification platform.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <CheckCircle className="h-5 w-5 text-emerald-400" />, text: 'AI-powered 1000-point ProCred Score' },
              { icon: <Shield className="h-5 w-5 text-blue-400" />, text: 'Verified skills and certificates' },
              { icon: <GraduationCap className="h-5 w-5 text-purple-400" />, text: 'Smart job matching and instant alerts' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-slate-300">
                {icon} <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={() => onPageChange('home')} className="border-slate-600 text-slate-300 hover:bg-white/10 hover:text-white">
            ← Back to Home
          </Button>
        </div>

        {/* Right — form card */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
            <div className="flex items-center gap-3 mb-2 lg:hidden">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"><GraduationCap className="h-5 w-5 text-white" /></div>
              <span className="text-xl font-black">Pro<span className="text-blue-600">Cred</span><span className="text-slate-400 text-xs">™</span></span>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900">
              {isSignUp ? 'Create your account 🚀' : 'Welcome back 👋'}
            </CardTitle>
            <p className="text-slate-500 text-sm mt-1">
              {isSignUp ? 'Join ProCred™ and build your verified profile' : 'Sign in to access your dashboard'}
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-5">
            {/* Role tabs */}
            <Tabs defaultValue="student" onValueChange={() => setError('')}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="student" className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs sm:text-sm">
                  <GraduationCap className="h-4 w-4" /> Student
                </TabsTrigger>
                <TabsTrigger value="recruiter" className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs sm:text-sm">
                  <Building2 className="h-4 w-4" /> Recruiter
                </TabsTrigger>
                <TabsTrigger value="university_admin" className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs sm:text-sm">
                  <Shield className="h-4 w-4" /> Uni Admin
                </TabsTrigger>
              </TabsList>
              <TabsContent value="student" className="mt-4">
                <LoginForm role="student" {...sharedProps} />
              </TabsContent>
              <TabsContent value="recruiter" className="mt-4">
                <LoginForm role="recruiter" {...sharedProps} />
              </TabsContent>
              <TabsContent value="university_admin" className="mt-4">
                <LoginForm role="university_admin" {...sharedProps} />
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="text-center space-y-3">
              <p className="text-slate-500 text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <Button variant="outline" onClick={() => { setIsSignUp(v => !v); setError(''); }} className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold">
                {isSignUp ? '← Sign In Instead' : 'Create New Account ✨'}
              </Button>
            </div>

            {isSignUp && (
              <p className="text-xs text-center text-slate-400">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
