import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, Coins, ArrowRight, Copy, Check } from 'lucide-react';

const AffiliateLanding: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [existingAffiliate, setExistingAffiliate] = useState<any>(null);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndAffiliate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSessionUser(user);
      if (user) {
        setPaypalEmail(user.email || '');
        const { data } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setExistingAffiliate(data);
          setAffiliateCode(data.affiliate_code);
          setPaypalEmail(data.paypal_email);
        }
      }
    };
    checkAuthAndAffiliate();
  }, []);

  const handleRegisterAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!sessionUser) {
      navigate('/user/auth');
      return;
    }

    const cleanCode = affiliateCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3 || cleanCode.length > 20) {
      setErrorMsg('Affiliate code must be 3-20 alphanumeric characters (A-Z, 0-9, dash, underscore).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail.trim())) {
      setErrorMsg('Please enter a valid PayPal email address for payouts.');
      return;
    }

    if (!agreed) {
      setErrorMsg('You must agree to the Affiliate Partner Terms.');
      return;
    }

    setLoading(true);
    try {
      const { data: takenCheck } = await supabase
        .from('affiliates')
        .select('id, user_id')
        .ilike('affiliate_code', cleanCode)
        .maybeSingle();

      if (takenCheck && takenCheck.user_id !== sessionUser.id) {
        throw new Error('This partner code is already reserved by another creator. Please pick another.');
      }

      const { data, error } = await supabase
        .from('affiliates')
        .upsert(
          {
            user_id: sessionUser.id,
            affiliate_code: cleanCode,
            paypal_email: paypalEmail.trim().toLowerCase(),
            status: 'active',
            commission_rate: 0.20,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      setExistingAffiliate(data);
      setSuccessMsg('Your affiliate partnership is active! You can now start sharing your links.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to activate partner account.');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = existingAffiliate 
    ? `${window.location.origin}/c/${existingAffiliate.affiliate_code}` 
    : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#EDEBE6] text-black font-sans selection:bg-black selection:text-white py-12 px-4 sm:px-8 max-w-5xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center border-b border-black pb-4 mb-10">
        <Link to="/" className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase hover:opacity-60 transition-opacity">
          <ArrowLeft size={16} /> RETURN TO STORE
        </Link>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-black text-[#EDEBE6] px-3 py-1">
          SUBQI_PARTNER_PROGRAM · 20% NET
        </span>
      </div>

      {/* HERO SECTION */}
      <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 sm:p-14 mb-10">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-black opacity-50 block mb-2">
          CREATOR & STUDIO NETWORK
        </span>
        <h1 className="text-4xl sm:text-6xl font-normal uppercase tracking-tight leading-none mb-6">
          RECOMMEND FONTS.<br />
          <span className="italic">EARN 20% NET COMMISSION.</span>
        </h1>
        <p className="text-sm sm:text-base font-serif text-black/80 max-w-2xl leading-relaxed">
          Partner with Subqi Studio. Share our type specimens and chromatic display families with designers worldwide.
          Enjoy 100% anti-adblocker vanity paths and reliable monthly payouts directly to your PayPal account.
        </p>
      </div>

      {/* 3 HOW IT WORKS BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="border border-black bg-white/70 p-6 space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5">01</span>
          <h3 className="font-bold text-base uppercase tracking-tight">VANITY PATH</h3>
          <p className="text-xs font-serif text-black/70 leading-relaxed">
            Get your clean vanity URL (<code className="font-mono text-[11px] bg-gray-100 px-1 py-0.5 border border-black/10">subqi.com/c/NAME</code>) that is 100% immune to adblockers and Safari privacy shields.
          </p>
        </div>
        <div className="border border-black bg-white/70 p-6 space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5">02</span>
          <h3 className="font-bold text-base uppercase tracking-tight">30-DAY TAG</h3>
          <p className="text-xs font-serif text-black/70 leading-relaxed">
            When visitors arrive through your link, our edge server tags them with an HttpOnly first-party cookie for 30 full days.
          </p>
        </div>
        <div className="border border-black bg-white/70 p-6 space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5">03</span>
          <h3 className="font-bold text-base uppercase tracking-tight">PAYPAL PAYOUT</h3>
          <p className="text-xs font-serif text-black/70 leading-relaxed">
            Earn 20% on every license sold. After a 14-day warranty holding period, earnings are paid automatically via PayPal once balance reaches $50.
          </p>
        </div>
      </div>

      {/* STATUS / ONBOARDING FORM */}
      <div className="border-2 border-black bg-white p-8 sm:p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        {existingAffiliate ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-black/50 block">STATUS: ACTIVE</span>
                <h3 className="text-2xl font-bold uppercase tracking-tight">Partner ({existingAffiliate.affiliate_code})</h3>
              </div>
              <Link 
                to="/user/dashboard" 
                className="bg-black text-[#EDEBE6] hover:bg-neutral-800 transition-colors py-2 px-5 text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-fit"
              >
                GO TO DASHBOARD <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/60 block">
                YOUR CLEAN VANITY LINK
              </label>
              <div className="flex items-center border border-black bg-gray-50 p-2">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl} 
                  className="w-full bg-transparent font-mono text-xs font-bold uppercase outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0 hover:bg-neutral-800"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <p className="text-[10px] font-mono text-black/60 pt-1">
                Direct font link format: <code className="font-bold">subqi.com/c/{existingAffiliate.affiliate_code}/[font_id]</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-black">
              <div className="border border-black p-3 bg-gray-50">
                <span className="text-[9px] font-mono uppercase tracking-wider block opacity-50">PAYPAL DESTINATION</span>
                <span className="font-mono text-xs font-bold truncate block">{existingAffiliate.paypal_email}</span>
              </div>
              <div className="border border-black p-3 bg-gray-50">
                <span className="text-[9px] font-mono uppercase tracking-wider block opacity-50">COMMISSION RATE</span>
                <span className="text-sm font-bold block">{(existingAffiliate.commission_rate * 100).toFixed(0)}% NET REVENUE</span>
              </div>
              <div className="border border-black p-3 bg-gray-50">
                <span className="text-[9px] font-mono uppercase tracking-wider block opacity-50">CLEARANCE WINDOW</span>
                <span className="text-xs font-bold uppercase block">14-DAY HOLDING</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegisterAffiliate} className="space-y-6">
            <div className="border-b border-black pb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-black/50 block">PARTNER REGISTRATION</span>
              <h3 className="text-2xl font-bold uppercase tracking-tight">ACTIVATE YOUR AFFILIATE PARTNERSHIP</h3>
            </div>

            {errorMsg && (
              <div className="p-4 border-2 border-black bg-red-100 text-red-900 font-bold text-xs">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-4 border-2 border-black bg-green-100 text-green-900 font-bold text-xs">
                {successMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider block">
                Requested Vanity Code
              </label>
              <div className="flex items-center border border-black bg-white">
                <span className="px-3 py-3 font-mono text-xs opacity-50 border-r border-black bg-gray-50">
                  subqi.com/c/
                </span>
                <input 
                  type="text" 
                  value={affiliateCode}
                  onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                  placeholder="STUDIO_NAME" 
                  required
                  className="w-full p-3 font-mono text-xs font-bold uppercase outline-none focus:bg-yellow-50"
                />
              </div>
              <span className="text-[10px] font-mono text-black/50 block">
                Alphanumeric characters only (e.g. ALEX, STUDIO99).
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider block">
                PayPal Payout Email Address
              </label>
              <input 
                type="email" 
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="PAYMENTS@DOMAIN.COM" 
                required
                className="w-full p-3 border border-black font-mono text-xs outline-none focus:bg-yellow-50"
              />
              <span className="text-[10px] font-mono text-black/50 block">
                All monthly commission earnings will be disbursed directly to this PayPal address.
              </span>
            </div>

            <div className="p-4 border border-black bg-gray-50 space-y-1.5 text-xs font-serif text-black/80">
              <p className="font-sans font-bold uppercase tracking-widest text-[10px] text-black">
                Program Policies:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Commission is <strong>20% of net received sales</strong> (after PayPal processing fees).</li>
                <li>All commissions are held in a <strong>14-day clearance window</strong> against refund claims.</li>
                <li>Minimum payout threshold is <strong>$50.00 USD</strong>. Outbound transfer fees are deducted at payout.</li>
                <li>Self-referral purchases are strictly prohibited and will be voided.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 accent-black h-4 w-4" 
              />
              <span className="text-xs font-bold uppercase">
                I agree to the Subqi Studio Affiliate Partner Terms.
              </span>
            </label>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-[#EDEBE6] hover:bg-neutral-800 transition-colors p-4 font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-40"
            >
              {loading ? 'ACTIVATING PARTNER PROFILE...' : 'ACTIVATE AFFILIATE ACCOUNT'}
            </button>
          </form>
        )}
      </div>

    </div>
  );
};

export default AffiliateLanding;
