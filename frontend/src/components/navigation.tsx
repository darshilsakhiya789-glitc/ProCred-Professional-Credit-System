import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Menu, X, GraduationCap, Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type UserType = 'guest' | 'student' | 'recruiter' | 'university_admin';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  userType: UserType;
}

const PUBLIC_PAGES = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'about', label: 'About Us' },
  { id: 'contact', label: 'Contact' },
];

const DASHBOARD_MAP: Record<string, { page: string; label: string; badge: string; badgeClass: string }> = {
  student: { page: 'student-dashboard', label: 'Dashboard', badge: '🎓 Student', badgeClass: 'bg-blue-100 text-blue-700' },
  recruiter: { page: 'recruiter-dashboard', label: 'Dashboard', badge: '🏢 Recruiter', badgeClass: 'bg-emerald-100 text-emerald-700' },
  university_admin: { page: 'admin-dashboard', label: 'Admin Panel', badge: '🎓 University', badgeClass: 'bg-purple-100 text-purple-700' },
};

export function Navigation({ currentPage, onPageChange, userType }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout, user } = useAuth();

  const dashboard = userType !== 'guest' ? DASHBOARD_MAP[userType] : null;

  const handleLogout = () => { logout(); onPageChange('home'); setMobileOpen(false); setProfileOpen(false); };
  const navigate = (page: string) => { onPageChange(page); setMobileOpen(false); setProfileOpen(false); };
  const isActive = (id: string) => currentPage === id;

  return (
    <nav className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button onClick={() => navigate('home')} className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-md group-hover:shadow-blue-200 group-hover:scale-105 transition-all duration-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Pro<span className="text-blue-600">Cred</span><span className="text-xs font-medium text-slate-400 ml-0.5">™</span>
            </span>
          </button>

          {/* Desktop nav — all pages always accessible */}
          <div className="hidden md:flex items-center gap-1">
            {PUBLIC_PAGES.map(page => (
              <button key={page.id} onClick={() => navigate(page.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive(page.id) ? 'text-blue-700 bg-blue-50 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                {page.label}
              </button>
            ))}
            {dashboard && (
              <button onClick={() => navigate(dashboard.page)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive(dashboard.page) ? 'text-emerald-700 bg-emerald-50 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                {dashboard.label}
              </button>
            )}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {userType === 'guest' ? (
              <Button onClick={() => navigate('login')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 shadow-sm">
                Sign In
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(dashboard!.page)} className="text-slate-500 hover:text-slate-700">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="relative">
                  <button onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-all duration-150">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">{user?.fullName?.split(' ')[0]}</span>
                    <Badge className={`text-xs px-2 py-0 ${dashboard?.badgeClass}`}>{dashboard?.badge.split(' ')[1]}</Badge>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b bg-slate-50">
                        <p className="font-semibold text-slate-900 text-sm truncate">{user?.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <Badge className={`text-xs mt-1 ${dashboard?.badgeClass}`}>{dashboard?.badge}</Badge>
                      </div>
                      <div className="py-1">
                        <button onClick={() => navigate(dashboard!.page)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors">
                          📊 My Dashboard
                        </button>
                        {PUBLIC_PAGES.map(p => (
                          <button key={p.id} onClick={() => navigate(p.id)} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">{p.label}</button>
                        ))}
                        <div className="border-t mt-1" />
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">🚪 Sign Out</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1 shadow-lg">
          {PUBLIC_PAGES.map(page => (
            <button key={page.id} onClick={() => navigate(page.id)}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(page.id) ? 'text-blue-700 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'}`}>
              {page.label}
            </button>
          ))}
          {dashboard && (
            <button onClick={() => navigate(dashboard.page)}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(dashboard.page) ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 hover:bg-slate-100'}`}>
              📊 {dashboard.label}
            </button>
          )}
          <div className="pt-2 border-t">
            {userType === 'guest' ? (
              <Button onClick={() => navigate('login')} className="w-full bg-blue-600 hover:bg-blue-700">Sign In</Button>
            ) : (
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium">🚪 Sign Out</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
