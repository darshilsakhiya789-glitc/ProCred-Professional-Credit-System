import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, HeadphonesIcon, Users } from 'lucide-react';
import { useState } from 'react';
import { contactAPI } from '../lib/api';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInput = (field: string, value: string) =>
    setFormData(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await contactAPI.submit(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to send message. Please try again.');
    } finally { setLoading(false); }
  };

  const contactMethods = [
    { icon: <Mail className="h-6 w-6 text-blue-600" />, title: 'Email Support', description: 'Get help via email within 24 hours', contact: 'support@procred.edu', available: '24/7' },
    { icon: <Phone className="h-6 w-6 text-green-600" />, title: 'Phone Support', description: 'Speak directly with our team', contact: '+1 (555) 123-4567', available: 'Mon-Fri, 9AM-6PM PST' },
    { icon: <MessageCircle className="h-6 w-6 text-purple-600" />, title: 'Live Chat', description: 'Instant support through our chat system', contact: 'Available on website', available: 'Mon-Fri, 8AM-8PM PST' },
  ];

  const supportTeams = [
    { team: 'Students & Universities', email: 'students@procred.edu', description: 'Account setup, verification issues, platform usage' },
    { team: 'Recruiters & Companies', email: 'recruiters@procred.edu', description: 'Enterprise solutions, bulk verifications, integrations' },
    { team: 'Technical Support', email: 'tech@procred.edu', description: 'API issues, technical integrations, troubleshooting' },
    { team: 'Partnership Inquiries', email: 'partnerships@procred.edu', description: 'University partnerships, institutional integrations' },
  ];

  const officeLocations = [
    { title: 'San Francisco Headquarters', address: '123 Innovation Drive, Suite 400', city: 'San Francisco, CA 94107', description: 'Our main headquarters and development center' },
    { title: 'Boston Education Hub', address: '456 University Avenue, Floor 12', city: 'Boston, MA 02116', description: 'Partnership and university relations office' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-blue-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge className="bg-white/20 text-white border-white/30">📞 Contact Us</Badge>
          <h1 className="text-4xl lg:text-5xl font-bold">Get in Touch 💬</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Have questions about ProCred? We're here to help! Reach out to our support team for assistance with accounts, verifications, or partnerships.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Send className="h-6 w-6 text-blue-600" /> Send Us a Message 📝
                </CardTitle>
                <p className="text-gray-600">Fill out the form below and we'll get back to you as soon as possible.</p>
              </CardHeader>
              <CardContent>
                {submitted && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 mb-6">
                    ✅ Thank you! Your message has been sent. We'll respond within 24 hours.
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Full Name *</label>
                      <Input required value={formData.name} onChange={(e) => handleInput('name', e.target.value)} placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email Address *</label>
                      <Input type="email" required value={formData.email} onChange={(e) => handleInput('email', e.target.value)} placeholder="Enter your email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Subject *</label>
                    <Input required value={formData.subject} onChange={(e) => handleInput('subject', e.target.value)} placeholder="What's this about?" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message *</label>
                    <Textarea required value={formData.message} onChange={(e) => handleInput('message', e.target.value)} placeholder="Tell us more about your inquiry…" className="min-h-32" />
                  </div>
                  <Button type="submit" disabled={loading || submitted} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Sending…' : submitted ? 'Message Sent! 🎉' : 'Send Message 🚀'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><HeadphonesIcon className="h-5 w-5 text-green-600" />Quick Contact</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {contactMethods.map((m, i) => (
                  <div key={i} className="space-y-2 pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-50 p-2 rounded-lg">{m.icon}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{m.title}</h4>
                        <p className="text-sm text-gray-600">{m.description}</p>
                        <p className="font-medium text-gray-900">{m.contact}</p>
                        <p className="text-xs text-gray-500">{m.available}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" />Business Hours</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[['Monday - Friday', '9:00 AM - 6:00 PM PST'], ['Saturday', '10:00 AM - 4:00 PM PST'], ['Sunday', 'Closed']].map(([day, hours]) => (
                  <div key={day} className="flex justify-between"><span className="text-gray-600">{day}</span><span className="font-medium">{hours}</span></div>
                ))}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">🕐 Emergency support available 24/7 for enterprise customers</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support Teams */}
        <section className="mt-20">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Specialized Support Teams 🎯</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Connect with the right team for your specific needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportTeams.map((team, i) => (
              <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.team}</h3>
                      <p className="text-blue-600 font-medium">{team.email}</p>
                      <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Offices */}
        <section className="mt-20">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Offices 🏢</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Visit us at our locations across the United States</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {officeLocations.map((office, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg"><MapPin className="h-5 w-5 text-green-600" /></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{office.title}</h3>
                      <p className="text-gray-600">{office.address}</p>
                      <p className="text-gray-600">{office.city}</p>
                      <p className="text-sm text-gray-500 mt-1">{office.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
