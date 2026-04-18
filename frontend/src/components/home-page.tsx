import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import {
  CheckCircle, Shield, Bell, TrendingUp, Users, Globe, Cpu,
  ChevronRight, ArrowRight, Star, Zap, Lock, Award,
  Briefcase, BookOpen, BarChart3,
} from "lucide-react";

interface HomePageProps {
  onPageChange: (page: string) => void;
}

// ── Reliable Unsplash images (no-auth, direct) ────────────────────────────────
const TECH_NEWS = [
  {
    id: 1, category: "AI & ML", time: "2h ago", tag: "Hot 🔥", tagColor: "bg-red-100 text-red-700",
    title: "Google DeepMind Hiring 2,000+ AI Engineers in 2025",
    description: "DeepMind expands across London, Zurich & Mountain View — focusing on LLM safety, robotics, and multimodal AI systems.",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=640&q=75&auto=format",
  },
  {
    id: 2, category: "Software Eng.", time: "5h ago", tag: "Internship", tagColor: "bg-blue-100 text-blue-700",
    title: "Meta Opens Campus Internship Applications for Summer 2025",
    description: "Meta is accepting applications across Reality Labs, WhatsApp, and Instagram. React, Python, C++ skills prioritized.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&q=75&auto=format",
  },
  {
    id: 3, category: "Data Science", time: "8h ago", tag: "Trending 📈", tagColor: "bg-purple-100 text-purple-700",
    title: "Top 10 Data Skills Recruiters Demand in 2025",
    description: "Python, SQL, PyTorch, and cloud ML pipelines are the most sought-after skills per the latest LinkedIn Talent Report.",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=640&q=75&auto=format",
  },
  {
    id: 4, category: "Cybersecurity", time: "1d ago", tag: "Urgent Hiring", tagColor: "bg-orange-100 text-orange-700",
    title: "CrowdStrike & Palo Alto Ramp Up Security Hiring",
    description: "With cyber-attacks up 45% YoY, both firms urgently need SOC analysts, pen testers, and cloud security engineers.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=640&q=75&auto=format",
  },
  {
    id: 5, category: "Full Stack", time: "1d ago", tag: "Free Cert 🎓", tagColor: "bg-green-100 text-green-700",
    title: "Microsoft Offers Free Azure Certifications for Students",
    description: "Microsoft Learn is offering free Azure, Power Platform, and GitHub Copilot certifications through June 2025.",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&q=75&auto=format",
  },
  {
    id: 6, category: "Startups", time: "2d ago", tag: "Startups", tagColor: "bg-yellow-100 text-yellow-700",
    title: "Y Combinator Startups Hiring 5,000+ Engineers",
    description: "The latest YC batch actively recruits across web3, biotech-software, and developer tooling. Open-source work valued.",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=640&q=75&auto=format",
  },
];

const STATS = [
  { value: "50K+", label: "Students", icon: Users },
  { value: "1,200+", label: "Companies", icon: Globe },
  { value: "98%", label: "Placement", icon: TrendingUp },
  { value: "500+", label: "Institutions", icon: Cpu },
];

const FEATURES = [
  { icon: Shield, color: "text-blue-600", bg: "bg-blue-50", title: "Verified Credentials", desc: "Every certificate reviewed by our team. Recruiters trust what they see." },
  { icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50", title: "1000-Point Score", desc: "Multi-dimensional scoring beyond grades — skills, achievements, diversity." },
  { icon: Bell, color: "text-orange-600", bg: "bg-orange-50", title: "Smart Job Alerts", desc: "Real-time notifications for roles matching your exact skill set." },
  { icon: Lock, color: "text-green-600", bg: "bg-green-50", title: "Document Vault", desc: "Secure resume and certificate storage. One link to share everything." },
  { icon: Cpu, color: "text-red-600", bg: "bg-red-50", title: "AI Resume Scanner", desc: "Recruiters paste a JD; AI ranks the best-matched candidate profiles." },
  { icon: Award, color: "text-yellow-600", bg: "bg-yellow-50", title: "Achievement Badges", desc: "Visual proof of accomplishments that stand out in recruiter search." },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Software Engineer @ Google", avatar: "PS", score: 920, text: "ProCred helped me stand out with verified credentials. Three recruiters reached out within a week of my profile going live!" },
  { name: "Arjun Mehta", role: "CS Student, IIT Bombay", avatar: "AM", score: 780, text: "The 1000-point score system is brilliant. I can see exactly where I need to improve and track my progress every week." },
  { name: "Sarah Chen", role: "HR Lead, Razorpay", avatar: "SC", score: null, text: "As a recruiter, the resume scanner saves us 6+ hours per hiring round. Verified profiles give us instant confidence in candidates." },
];

const NEWS_CATEGORIES = ["All", "AI & ML", "Software Eng.", "Data Science", "Cybersecurity", "Full Stack", "Startups"];

export function HomePage({ onPageChange }: HomePageProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleNews, setVisibleNews] = useState(3);
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const filteredNews = activeCategory === "All"
    ? TECH_NEWS
    : TECH_NEWS.filter(n => n.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">

      {/* ════════════════════════════════════════════════════════
          HERO — dark premium gradient, floating cards
      ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-[92vh] flex items-center">
        {/* Mesh background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div
            ref={heroRef}
            className={`space-y-8 transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-sm text-blue-300 font-medium">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              India's #1 Verified Credential Platform
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
              Your Skills,
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Verified.
              </span>
              <br />
              <span className="text-slate-300">Trusted.</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
              ProCred bridges the gap between student achievements and recruiter trust — with AI-powered verification, a 1000-point score, and smart job matching.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => onPageChange('login')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-base font-semibold px-8 h-12 shadow-2xl shadow-blue-900/50 transition-all duration-200 hover:scale-105"
              >
                Get Started 🚀
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              {[
                { icon: <CheckCircle className="h-4 w-4 text-emerald-400" />, label: "100% Verified" },
                { icon: <Shield className="h-4 w-4 text-blue-400" />, label: "Bank-grade Security" },
                { icon: <Zap className="h-4 w-4 text-yellow-400" />, label: "Instant Alerts" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-400">
                  {icon} {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — hero image with floating cards */}
          <div className={`relative transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&auto=format"
                alt="Students collaborating"
                className="w-full h-[480px] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80&auto=format";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>

            {/* Floating score card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">875<span className="text-sm font-medium text-slate-400">/1000</span></div>
                  <div className="text-xs text-slate-500 font-medium">ProCred Score · Expert</div>
                </div>
              </div>
            </div>

            {/* Verified badge */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 border border-slate-100 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Verified ✓</p>
                  <p className="text-xs text-slate-500">React Cert — Meta</p>
                </div>
              </div>
            </div>

            {/* Job alert badge */}
            <div className="absolute top-1/2 -right-4 bg-white rounded-xl shadow-xl p-3 border border-slate-100 z-10">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs font-bold text-slate-900">New Match!</p>
                  <p className="text-xs text-slate-500">Google SWE — Bangalore</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════════ */}
      <section className="bg-blue-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center text-white">
                <Icon className="h-6 w-6 mx-auto mb-2 text-blue-200" />
                <div className="text-4xl font-black">{value}</div>
                <div className="text-blue-200 text-sm mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURES GRID — GFG/LinkedIn style
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-700 mb-4">Platform Capabilities</Badge>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Built for the Modern<br />
              <span className="text-blue-600">Career Journey</span>
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Everything students need to stand out and recruiters need to find the best talent — in one platform.
            </p>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar snap-x">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group min-w-[280px] md:min-w-[320px] shrink-0 snap-center"
              >
                <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-7 w-7 ${color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button onClick={() => onPageChange('features')} className="bg-blue-600 hover:bg-blue-700 px-8 h-12 font-semibold">
              Explore All Features <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS — 3-step visual
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">Simple Process</Badge>
            <h2 className="text-4xl font-black text-slate-900">How ProCred Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-emerald-200" />
            {[
              { step: "01", icon: BookOpen, color: "bg-blue-600", title: "Build Your Profile", desc: "Upload certificates, add skills, and complete your academic profile in minutes." },
              { step: "02", icon: CheckCircle, color: "bg-purple-600", title: "Get Verified", desc: "Our team reviews your documents. Verified achievements earn credit points toward your 1000-point score." },
              { step: "03", icon: Briefcase, color: "bg-emerald-600", title: "Get Hired", desc: "Recruiters discover you through AI-powered search. Get matched jobs & internship notifications instantly." },
            ].map(({ step, icon: Icon, color, title, desc }) => (
              <div key={step} className="text-center relative z-10">
                <div className={`w-24 h-24 ${color} rounded-3xl flex flex-col items-center justify-center mx-auto mb-6 shadow-xl`}>
                  <span className="text-white/60 text-xs font-bold">{step}</span>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TESTIMONIALS — like Fiverr/GFG style
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-blue-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-white/10 text-white border-white/20 mb-4">Real Stories</Badge>
            <h2 className="text-4xl font-black text-white">Trusted by Students & Recruiters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}</p>
                  </div>
                  {t.score && (
                    <div className="ml-auto text-right">
                      <div className="text-blue-400 font-black text-lg">{t.score}</div>
                      <div className="text-slate-500 text-xs">/1000</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TECH HIRING NEWS — dynamic, categorized
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">Live Tech Pulse</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900">Hiring News & Opportunities</h2>
              <p className="text-slate-500 mt-2">Stay ahead — latest openings, certifications & industry trends</p>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setVisibleNews(3); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.slice(0, visibleNews).map((news) => (
              <Card key={news.id} className="border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
                <div className="relative h-48 overflow-hidden bg-slate-200">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      const parent = el.parentElement;
                      if (parent) {
                        parent.style.background = 'linear-gradient(135deg, #1e3a5f, #0ea5e9)';
                        parent.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:white;font-size:14px;font-weight:600;padding:20px;text-align:center">${news.title}</div>`;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${news.tagColor}`}>{news.tag}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-slate-700">{news.category}</span>
                  </div>
                  <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs bg-black/40 text-white">{news.time}</span>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">{news.description}</p>
                  <div className="flex items-center gap-1.5 text-blue-600 text-sm font-semibold">
                    Read More <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visibleNews < filteredNews.length && (
            <div className="text-center mt-10">
              <Button variant="outline" onClick={() => setVisibleNews(v => v + 3)} className="border-slate-300 px-8 h-11 font-semibold hover:border-blue-400 hover:text-blue-700">
                Load More Articles
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA — strong, premium
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-800/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4 space-y-8">
          <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">
            Start Building Your<br />Verified Profile Today
          </h2>
          <p className="text-xl text-blue-100 max-w-xl mx-auto">
            Join 50,000+ students and 1,200+ companies already on ProCred™.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => onPageChange('login')} className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-10 h-14 font-bold shadow-2xl hover:scale-105 transition-all duration-200">
              Create Free Account 🚀
            </Button>
            <Button onClick={() => onPageChange('contact')} className="bg-white/15 border border-white/40 text-white hover:bg-white/25 text-lg px-10 h-14 font-semibold">
              Contact Us
            </Button>
          </div>
          <p className="text-blue-200 text-sm">No credit card required • Free forever for students</p>
        </div>
      </section>
    </div>
  );
}
