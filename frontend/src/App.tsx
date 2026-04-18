import { useState, useEffect } from 'react';
import { Navigation } from './components/navigation';
import { HomePage } from './components/home-page';
import { FeaturesPage } from './components/features-page';
import { StudentDashboard } from './components/student-dashboard';
import { RecruiterDashboard } from './components/recruiter-dashboard';
import { UniversityAdminDashboard } from './components/university-admin-dashboard';
import { AboutPage } from './components/about-page';
import { ContactPage } from './components/contact-page';
import { LoginPage } from './components/login-page';
import { SubscriptionPage } from './components/subscription-page';
import { useAuth } from './context/AuthContext';

type UserType = 'guest' | 'student' | 'recruiter' | 'university_admin';

const DASHBOARD_MAP: Record<string, string> = {
  student: 'student-dashboard',
  recruiter: 'recruiter-dashboard',
  university_admin: 'admin-dashboard',
};

const PROTECTED_PAGES = ['student-dashboard', 'recruiter-dashboard', 'admin-dashboard', 'subscription'];

export default function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [prevUser, setPrevUser] = useState(user);

  // Redirect protected pages on logout
  useEffect(() => {
    if (loading) return;
    if (!user && PROTECTED_PAGES.includes(currentPage)) setCurrentPage('home');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, currentPage]);

  // Auto-navigate to dashboard on first login
  useEffect(() => {
    if (loading) return;
    if (user && !prevUser) {
      setCurrentPage(DASHBOARD_MAP[user.role] || 'home');
    }
    setPrevUser(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, prevUser]);

  const handlePageChange = (page: string) => {
    if (PROTECTED_PAGES.includes(page) && !user) { setCurrentPage('login'); return; }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const userType: UserType = user ? (user.role as UserType) : 'guest';

  const renderPage = () => {
    switch (currentPage) {
      case 'home':               return <HomePage onPageChange={handlePageChange} />;
      case 'features':           return <FeaturesPage onPageChange={handlePageChange} />;
      case 'about':              return <AboutPage onPageChange={handlePageChange} />;
      case 'contact':            return <ContactPage />;
      case 'login':              return <LoginPage onPageChange={handlePageChange} />;
      case 'student-dashboard':  return user ? <StudentDashboard onPageChange={handlePageChange} /> : <LoginPage onPageChange={handlePageChange} />;
      case 'recruiter-dashboard':return user ? <RecruiterDashboard onPageChange={handlePageChange} /> : <LoginPage onPageChange={handlePageChange} />;
      case 'admin-dashboard':    return user ? <UniversityAdminDashboard onPageChange={handlePageChange} /> : <LoginPage onPageChange={handlePageChange} />;
      case 'subscription':       return user ? <SubscriptionPage onPageChange={handlePageChange} /> : <LoginPage onPageChange={handlePageChange} />;
      default:                   return <HomePage onPageChange={handlePageChange} />;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 font-medium">Loading ProCred…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage={currentPage} onPageChange={handlePageChange} userType={userType} />
      {renderPage()}
    </div>
  );
}
