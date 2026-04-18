import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  LayoutDashboard, Shield, Search, BarChart3, Upload, Download,
  CheckCircle, Bell, FileText, Cpu, Lock, Users, ArrowRight,
} from "lucide-react";

interface FeaturesPageProps {
  onPageChange: (page: string) => void;
}

export function FeaturesPage({ onPageChange }: FeaturesPageProps) {
  const features = [
    {
      icon: <LayoutDashboard className="h-8 w-8 text-blue-600" />,
      title: "Centralized Achievement Dashboard",
      description: "A unified platform to view, manage, and showcase all academic and non-academic achievements in one place.",
      benefits: ["Real-time sync", "Mobile responsive", "Export capabilities", "Custom categories"],
      bg: "bg-blue-50", border: "border-blue-100",
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Document Verification System",
      description: "Admins review uploaded certificates and documents, then verify authenticity before awarding credit points.",
      benefits: ["Admin review flow", "Document scanning", "Fraud prevention", "Real-time status"],
      bg: "bg-green-50", border: "border-green-100",
    },
    {
      icon: <Cpu className="h-8 w-8 text-purple-600" />,
      title: "AI-Powered Resume Scanner",
      description: "Recruiters paste a job description; our system scans and ranks candidate profiles by keyword match and score.",
      benefits: ["Keyword matching", "Skill gap analysis", "Bulk processing", "Ranked results"],
      bg: "bg-purple-50", border: "border-purple-100",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: "1000-Point Holistic Scoring",
      description: "A comprehensive 1000-point score covering achievements, skills, category diversity, and profile completeness.",
      benefits: ["Multi-dimensional", "Skill mapping", "Progress tracking", "Industry benchmarks"],
      bg: "bg-orange-50", border: "border-orange-100",
    },
    {
      icon: <Bell className="h-8 w-8 text-red-600" />,
      title: "Smart Job & Internship Alerts",
      description: "Students get instant notifications for jobs matching their skills, location, and profile preferences.",
      benefits: ["Real-time alerts", "Skill-matched", "Location filters", "Deadline reminders"],
      bg: "bg-red-50", border: "border-red-100",
    },
    {
      icon: <Lock className="h-8 w-8 text-teal-600" />,
      title: "Secure Document Vault",
      description: "Upload and store your resume, transcripts, and portfolio documents. Share a single verified link with recruiters.",
      benefits: ["Secure storage", "Version control", "Shareable links", "PDF export"],
      bg: "bg-teal-50", border: "border-teal-100",
    },
  ];

  const additionalFeatures = [
    { icon: <Upload className="h-5 w-5" />, title: "Easy Certificate Upload", desc: "Drag-and-drop for PDFs, images, and documents." },
    { icon: <Download className="h-5 w-5" />, title: "Portfolio Export", desc: "Generate shareable professional profile reports." },
    { icon: <CheckCircle className="h-5 w-5" />, title: "Real-time Verification Status", desc: "Track exactly where your achievement is in review." },
    { icon: <Search className="h-5 w-5" />, title: "Advanced Candidate Search", desc: "Filter by skill, university, score, and location." },
    { icon: <Users className="h-5 w-5" />, title: "Recruiter Job Postings", desc: "Post openings; matched students get instant alerts." },
    { icon: <FileText className="h-5 w-5" />, title: "AI Chatbot Support", desc: "Smart assistant for students and recruiters across all sections." },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-emerald-600 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <Badge className="bg-white/20 text-white border-white/30 text-sm">✨ Full Platform Features</Badge>
          <h1 className="text-5xl lg:text-6xl font-black leading-tight">
            Everything You Need<br />to Succeed
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            From AI-powered resume scanning to document verification — ProCred™ is the complete platform for students and recruiters.
          </p>
          <Button
            onClick={() => onPageChange('login')}
            className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-10 h-13 font-bold shadow-xl hover:scale-105 transition-all"
          >
            Get Started Today 🚀
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-700 mb-4">Core Features</Badge>
            <h2 className="text-4xl font-black text-slate-900">Built to Make You Stand Out 🛠️</h2>
            <p className="text-xl text-slate-500 mt-4 max-w-2xl mx-auto">
              Built for students who want to stand out and recruiters who want the best candidates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className={`border ${feature.border} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${feature.bg}`}>
                <CardHeader>
                  <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-md mb-4 border border-slate-100">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-slate-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional tools */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 mb-4">More Tools</Badge>
            <h2 className="text-4xl font-black text-slate-900">More Powerful Tools ⚡</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((f, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="bg-blue-100 p-3 rounded-xl h-fit text-blue-600 flex-shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-blue-950">
        <div className="max-w-4xl mx-auto text-center px-4 space-y-8">
          <h2 className="text-4xl lg:text-5xl font-black text-white">Ready to Get Started? 🎓</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">Join ProCred™ today and transform how you showcase your skills.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => onPageChange('login')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-10 h-14 font-bold shadow-2xl hover:scale-105 transition-all"
            >
              Create Your Account 🚀
            </Button>
            <Button
              onClick={() => onPageChange('contact')}
              className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/50 text-lg px-10 h-14 font-semibold transition-all shadow-lg"
            >
              Contact Us 📞
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
