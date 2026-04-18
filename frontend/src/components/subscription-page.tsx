import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle, CreditCard, Shield, Zap, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../lib/api';

interface Props {
  onPageChange: (page: string) => void;
}

export function SubscriptionPage({ onPageChange }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);

  const plans = [
    { months: 1, label: '1 Month', price: 49, desc: 'Billed monthly' },
    { months: 2, label: '2 Months', price: 89, desc: 'Billed bi-monthly (Save $9)' },
    { months: 12, label: '1 Year', price: 490, desc: 'Billed annually (Save $98)' },
  ];
  const selectedPlan = plans.find(p => p.months === durationMonths) || plans[0];

  const isRecruiter = user?.role === 'recruiter';
  const roleTitle = isRecruiter ? 'Recruiters' : 'University Admins';

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create a mock payment token
      const paymentMethodId = `tok_viz_${Math.random().toString(36).substring(7)}`;
      const res = await paymentAPI.subscribe({ paymentMethodId, durationMonths });
      
      // Update local storage conceptually (in a real app, you might refetch the user)
      if (user) {
        user.subscriptionStatus = res.data.subscriptionStatus;
        if (res.data.subscriptionExpiry) user.subscriptionExpiry = res.data.subscriptionExpiry;
        localStorage.setItem('procred_user', JSON.stringify(user));
      }
      
      setSuccess(true);
      setTimeout(() => {
        onPageChange(isRecruiter ? 'recruiter-dashboard' : 'admin-dashboard');
      }, 3000);
    } catch (err) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden text-center">
          <div className="bg-emerald-600 p-8 flex justify-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <CardContent className="p-8 space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
            <p className="text-slate-600">Your account has been upgraded to Pro. You now have unlimited access to ProCred's powerful tools.</p>
            <p className="text-sm font-semibold text-emerald-600 animate-pulse">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-3xl w-full text-center mb-10">
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 mb-4 border-emerald-200">
          ProCred Premium
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Unlock Unlimited Potential
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          You've used your free trial. Upgrade to a Pro subscription to continue accelerating your {isRecruiter ? 'hiring pipeline' : 'student verifications'} with verified top talent.
        </p>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Pricing Plan Details */}
        <Card className="border-2 border-emerald-500 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wide">
            Most Popular
          </div>
          <CardHeader className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 pb-8 border-b border-emerald-100">
            <CardTitle className="text-slate-900 text-xl">Pro for {roleTitle}</CardTitle>
            <div className="mt-4 flex flex-col gap-3">
              {plans.map((p) => (
                <div 
                  key={p.months}
                  onClick={() => setDurationMonths(p.months)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${durationMonths === p.months ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{p.label}</span>
                    <span className="font-black text-xl text-slate-900">${p.price}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <ul className="space-y-4">
              {[
                isRecruiter ? 'Unlimited Job Postings' : 'Unlimited Student Verifications',
                isRecruiter ? 'Access to AI Resume Scanner' : 'Access to University Analytics (Soon)',
                'Priority Candidate Search Filters',
                'Dedicated Account Manager',
                '24/7 Premium Support'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                  <span className="text-slate-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Secure Checkout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-sm text-blue-800 mb-6">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <p>This is a secure 256-bit encrypted connection. We do not store your card details.</p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Cardholder Name</label>
                <Input 
                  placeholder="John Doe" 
                  required 
                  value={cardName} 
                  onChange={(e) => setCardName(e.target.value)} 
                  className="h-11 bg-slate-50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Card Number</label>
                <div className="relative">
                  <Input 
                    placeholder="0000 0000 0000 0000" 
                    required 
                    maxLength={19}
                    value={cardNumber} 
                    onChange={(e) => setCardNumber(e.target.value)} 
                    className="h-11 bg-slate-50 pl-10 tracking-widest font-mono"
                  />
                  <CreditCard className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Card Expiry (MM/YY)</label>
                  <Input 
                    placeholder="MM/YY" 
                    required 
                    maxLength={5}
                    value={expiry} 
                    onChange={(e) => setExpiry(e.target.value)} 
                    className="h-11 bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">CVC</label>
                  <Input 
                    type="password"
                    placeholder="123" 
                    required 
                    maxLength={4}
                    value={cvv} 
                    onChange={(e) => setCvv(e.target.value)} 
                    className="h-11 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-base font-bold shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
                >
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Processing...</>
                  ) : (
                    <><Zap className="h-5 w-5 mr-2" />Pay ${selectedPlan.price}.00 & Upgrade</>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" /> Payments processed securely by mock-Stripe
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
         <Button variant="ghost" onClick={() => onPageChange(isRecruiter ? 'recruiter-dashboard' : 'admin-dashboard')} className="text-slate-500 hover:text-slate-900 hover:bg-slate-200">
           ← View Dashboard (Limited Access)
         </Button>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>{children}</span>
}
