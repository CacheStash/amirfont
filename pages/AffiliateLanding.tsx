/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck, Zap, 
  Coins, CheckCircle2, Copy, Check, Sliders, Layers, 
  DollarSign, Clock, Lock, Sparkles, ExternalLink 
} from 'lucide-react';

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
      navigate('/user/auth?redirect=/affiliate');
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
    : `${window.location.origin}/c/${(affiliateCode || 'YOUR_CODE').toUpperCase()}`;

  const handleCopyLink = () => {
    if (!existingAffiliate) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#EDEBE6] text-black font-mono selection:bg-black selection:text-white pb-24 relative overflow-x-hidden">
      {/* Background Orbs selaras dengan Canvas & Home */}
      <div className="grain-orb-base orb-top-right pointer-events-none" />
      <div className="grain-orb-base orb-bottom-left pointer-events-none" />

      {/* 1. HEADER ORB */}
      <div className="absolute top-[-100px] right-[-100px] w-[800px] h-[600px] pointer-events-none z-0 hidden md:block opacity-60">
        <div
          className="w-full h-full mix-blend-multiply blur-[80px]" 
          style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.45) 0%, rgba(253, 186, 116, 0.25) 50%, rgba(253, 186, 116, 0) 100%)' }}
        />
      </div>

      {/* 2. MIDDLE ORB */}
      <div className="absolute top-[40%] left-[-200px] w-[800px] h-[800px] pointer-events-none z-0 hidden md:block opacity-35">
        <div
          className="w-full h-full mix-blend-multiply blur-[100px]" 
          style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.3) 0%, rgba(253, 186, 116, 0.15) 50%, rgba(253, 186, 116, 0) 100%)' }}
        />
      </div>

      {/* 3. BOTTOM ORB */}
      <div className="absolute bottom-[10%] right-[-200px] w-[800px] h-[800px] pointer-events-none z-0 hidden md:block opacity-45">
        <div
          className="w-full h-full mix-blend-multiply blur-[100px]" 
          style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.4) 0%, rgba(253, 186, 116, 0.2) 50%, rgba(253, 186, 116, 0) 100%)' }}
        />
      </div>

      {/* 1. HERO HEADER */}
      <header className="relative z-10 px-4 md:px-8 py-14 md:py-20 border-b border-black bg-white/30 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="bg-black text-[#FF5C00] px-3 py-1 text-xs font-black uppercase tracking-widest">
              PARTNER PROGRAM
            </span>
            <span className="text-xs uppercase tracking-widest text-black/60 font-semibold">
              20% NET COMMISSION • 100% ANTI-ADBLOCKER
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-normal uppercase tracking-tighter leading-[0.85] mb-8 font-sans">
            AFFILIATE <br className="hidden sm:block" />
            <span className="italic font-serif">PARTNERSHIP.</span>
          </h1>

          <p className="text-base md:text-xl font-normal max-w-3xl leading-relaxed text-black/80 mb-10 normal-case">
            Recommend Subqi Studio typefaces to designers, agencies, and typographers worldwide. Enjoy clean vanity paths, 30-day first-party edge cookies, and transparent 20% net commissions deposited straight to your PayPal account.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {existingAffiliate ? (
              <Link
                to="/user/dashboard"
                className="bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-all px-8 py-4 font-bold text-sm uppercase tracking-widest flex items-center gap-3 border border-black group"
              >
                <span>Go to Affiliate Hub</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <a
                href="#register-section"
                className="bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-all px-8 py-4 font-bold text-sm uppercase tracking-widest flex items-center gap-3 border border-black group"
              >
                <span>Activate Partner Code</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
            )}
            <Link
              to="/fonts"
              className="canvas-explore-btn px-8 py-4 font-bold text-sm uppercase tracking-widest cursor-pointer"
            >
              Explore Fonts
            </Link>
          </div>
        </div>
      </header>

      {/* 2. VANITY ROUTE SIMULATOR SHOWCASE */}
      <section className="relative z-10 px-4 md:px-8 py-12 border-b border-black bg-white/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="border border-black bg-[#EDEBE6]/80 p-4 md:p-8 relative overflow-hidden backdrop-blur-xs">
            {/* Top Bar Simulator */}
            <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-black inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-black/40 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-black/20 inline-block"></span>
                <span className="text-xs uppercase font-bold tracking-widest ml-2 hidden sm:inline">
                  EDGE_ROUTER_SIMULATOR
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FF5C00] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                  ANTI-ADBLOCK
                </span>
                <span className="border border-black px-2 py-0.5 text-[10px] font-bold uppercase bg-white">
                  COOKIE: 30-DAY
                </span>
              </div>
            </div>

            {/* Vanity Mockup Artboard */}
            <div className="min-h-[220px] md:min-h-[280px] bg-white border border-black flex flex-col items-center justify-center p-6 md:p-12 relative text-center">
              {/* Grid dots background */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              <div className="relative z-10 max-w-2xl w-full">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF5C00] font-black block mb-2">
                  CLEAN VANITY PATH ARCHITECTURE
                </span>
                <div className="border-2 border-black bg-gray-50 px-4 py-3 text-lg md:text-2xl font-mono font-black text-black tracking-tight inline-block max-w-full truncate shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {shareUrl}
                </div>
                <p className="text-xs uppercase tracking-widest text-black/50 mt-4">
                  [ NO SUSPICIOUS ?REF= STRINGS • CLOUDFLARE FIRST-PARTY ATTRIBUTION ]
                </p>
              </div>
            </div>

            {/* Bottom feature badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 text-[10px] uppercase font-bold tracking-wider">
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> Zero AdBlock Strip
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> 30-Day Edge Attribution
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> 14-Day Warranty Clearance
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> Automated PayPal Payout
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES / PROGRAM PILLARS (BRUTALIST CARDS) */}
      <section className="relative z-10 px-4 md:px-8 py-16 md:py-24 border-b border-black bg-white/20 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-[#FF5C00] font-bold">
              PROGRAM PILLARS
            </span>
            <h2 className="text-3xl md:text-6xl font-normal uppercase tracking-tight mt-2 font-sans">
              ENGINEERED FOR MODERN CREATORS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">01</span>
                  <ShieldCheck size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Anti-AdBlocker Engine
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Standard tracking queries like <code className="font-mono text-[11px] bg-black/5 px-1 py-0.5">?ref=</code> and <code className="font-mono text-[11px] bg-black/5 px-1 py-0.5">?aff=</code> are blocked by Brave, uBlock, and Safari ITP. Our clean vanity path (<code className="font-mono text-[11px] bg-black/5 px-1 py-0.5">/c/:code</code>) passes through edge routing without ever being stripped.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                VANITY EDGE ROUTING
              </div>
            </div>

            {/* Card 2 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">02</span>
                  <Coins size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  20% Net Commission
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Earn a clear 20% on every license sale. Commissions are calculated cleanly from the net store proceeds after PayPal inbound processing fees, ensuring fair and predictable income on single licenses and complete family bundles.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                TRANSPARENT REVENUE SHARE
              </div>
            </div>

            {/* Card 3 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">03</span>
                  <Clock size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  30-Day Edge Cookie Tag
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  When a prospective buyer visits through your link, Cloudflare Workers assign a secure, HttpOnly first-party cookie lasting 30 full days. If they come back anytime within a month to purchase, the attribution is credited to you.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                FIRST-PARTY ATTRIBUTION
              </div>
            </div>

            {/* Card 4 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">04</span>
                  <CheckCircle2 size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  14-Day Warranty Window
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case mb-2">
                  Commissions remain in a brief 14-day clearance hold protecting against customer payment disputes and refund claims before automatically clearing for payout.
                </p>
                <p className="text-[11px] leading-relaxed text-black/90 font-medium normal-case bg-black/5 p-2 border-l border-black">
                  Minimum Payout: Cleared commissions are disbursed automatically once your available balance reaches $50.00 USD.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                DISPUTE-PROTECTED CLEARANCE
              </div>
            </div>

            {/* Card 5 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">05</span>
                  <DollarSign size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  PayPal Automated Payouts
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Monthly disbursements are sent straight to your verified PayPal account via batch Mass Payouts. No manual invoicing or waiting on complex overseas wire transfers.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                DIRECT TO YOUR PAYPAL
              </div>
            </div>

            {/* Card 6 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">06</span>
                  <Layers size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Real-Time Partner Ledger
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Access your private Affiliate Hub in the user dashboard anytime. Audit every sale down to the cent: gross purchase price, PayPal fees, exact commission earned, and clearance countdowns.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                TRANSPARENT LEDGER AUDIT
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ONBOARDING & ACTIVATION SECTION (Matches Section 4 in Canvas Landing) */}
      <section id="register-section" className="relative z-10 px-4 md:px-8 py-16 md:py-20 border-b border-black bg-white/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="border border-black bg-white/90 backdrop-blur-xs p-8 md:p-12 relative mb-6">
            
            {existingAffiliate ? (
              /* Already Registered Affiliate Box */
              <div className="space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-black pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={18} className="text-[#FF5C00]" />
                      <span className="text-xs uppercase font-bold tracking-widest text-[#FF5C00]">
                        ACTIVE PARTNER STATUS
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-normal uppercase tracking-tight font-sans">
                      PARTNER CODE: <span className="text-[#FF5C00]">{existingAffiliate.affiliate_code}</span>
                    </h2>
                  </div>

                  <Link
                    to="/user/dashboard"
                    className="canvas-editor-btn px-7 py-4 text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>Open Affiliate Hub</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {/* Vanity Link Box */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/70 block">
                    Your Official Vanity Share Link
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={shareUrl} 
                      className="grow border-2 border-black bg-gray-50 px-4 py-3 font-mono text-sm font-bold uppercase outline-none"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className="bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-all px-6 py-3 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-black shrink-0"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY LINK'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-black/60 font-mono">
                    Direct font link syntax: <code className="font-bold">subqi.com/c/{existingAffiliate.affiliate_code}/[font-slug]</code>
                  </p>
                </div>

                {/* 3 Metric Summary Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-black">
                  <div className="border border-black p-4 bg-gray-50">
                    <span className="text-[10px] font-mono uppercase tracking-wider block text-gray-500 mb-1">
                      PAYPAL PAYOUT DESTINATION
                    </span>
                    <span className="font-mono text-sm font-bold truncate block">{existingAffiliate.paypal_email}</span>
                  </div>
                  <div className="border border-black p-4 bg-gray-50">
                    <span className="text-[10px] font-mono uppercase tracking-wider block text-gray-500 mb-1">
                      COMMISSION RATE
                    </span>
                    <span className="text-sm font-bold block text-black">
                      {(Number(existingAffiliate.commission_rate || 0.20) * 100).toFixed(0)}% NET REVENUE
                    </span>
                  </div>
                  <div className="border border-black p-4 bg-gray-50">
                    <span className="text-[10px] font-mono uppercase tracking-wider block text-gray-500 mb-1">
                      CLEARANCE SCHEDULE
                    </span>
                    <span className="text-sm font-bold uppercase block text-black">
                      14-DAY WARRANTY HOLD
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Activation Registration Form */
              <div className="space-y-8">
                <div className="border-b border-black pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={20} className="text-[#FF5C00]" />
                    <span className="text-xs uppercase font-bold tracking-widest text-[#FF5C00]">
                      PARTNER ACTIVATION
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-normal uppercase tracking-tight font-sans">
                    Activate Your Affiliate Partnership
                  </h2>
                  <p className="text-xs sm:text-sm leading-relaxed text-black/70 normal-case mt-2">
                    Reserve your unique vanity code to start earning 20% net commissions immediately.
                  </p>
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

                <form onSubmit={handleRegisterAffiliate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black block">
                      Requested Vanity Code
                    </label>
                    <div className="flex items-center border-2 border-black bg-white">
                      <span className="px-4 py-3 bg-gray-100 border-r-2 border-black text-xs font-mono font-bold text-black/60 select-none">
                        subqi.com/c/
                      </span>
                      <input 
                        type="text" 
                        required
                        value={affiliateCode} 
                        onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                        placeholder="STUDIO_NAME" 
                        className="grow px-4 py-3 font-mono text-sm font-bold uppercase bg-transparent outline-none"
                      />
                    </div>
                    <span className="text-[11px] text-black/50 block font-mono">
                      Alphanumeric characters only (e.g. ALEX, STUDIO9, TYPEGUILD).
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black block">
                      PayPal Payout Email Address
                    </label>
                    <input 
                      type="email" 
                      required
                      value={paypalEmail} 
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="payouts@yourdomain.com" 
                      className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-white outline-none"
                    />
                    <span className="text-[11px] text-black/50 block font-mono">
                      Monthly commission earnings will be disbursed directly to this PayPal address.
                    </span>
                  </div>

                  {/* Program Policies Box */}
                  <div className="p-4 border border-black bg-gray-50 text-xs text-black/80 space-y-1.5 normal-case font-mono">
                    <span className="font-bold text-[11px] uppercase tracking-wider block text-black">
                      Program Policies:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-black/70">
                      <li>Commission is <strong>20% of net received sales</strong> (after PayPal processing fees).</li>
                      <li>All commissions are held in a <strong>14-day clearance window</strong> against refund claims.</li>
                      <li>Minimum payout threshold is <strong>$50.00 USD</strong>. Outbound transfer fees are deducted at payout.</li>
                      <li>Self-referral purchases are strictly prohibited and will be voided.</li>
                    </ul>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="agree" 
                      required
                      checked={agreed} 
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded-none accent-black cursor-pointer"
                    />
                    <label htmlFor="agree" className="text-xs text-black/80 uppercase font-bold cursor-pointer select-none">
                      I agree to the Subqi Studio Affiliate Partner Terms.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-all py-4 px-8 font-bold text-sm uppercase tracking-widest border-2 border-black cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                  >
                    {loading ? 'ACTIVATING PARTNERSHIP...' : 'ACTIVATE AFFILIATE ACCOUNT'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Supplementary Notices */}
          <div className="space-y-4">
            <div className="p-5 border border-black/15 bg-white/70 text-xs leading-relaxed text-black/80 normal-case font-mono">
              <div className="font-bold uppercase tracking-wider text-[#FF5C00] text-[11px] mb-1.5 flex items-center gap-1.5">
                <span>Fair Play & Quality Recommendation Standard</span>
              </div>
              <p>
                <strong>Partner Guidelines:</strong> Subqi Studio partners are encouraged to present our fonts ethically in genuine design contexts, portfolio showcases, YouTube tutorials, design newsletters, and typographic specimens. Cookie-stuffing, spamming, and misleading discounts are strictly prohibited.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER (Matches Section 5 in Canvas Landing) */}
      <section className="relative z-10 px-4 md:px-8 pt-16 md:pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="border border-black bg-black text-white p-10 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="text-xs uppercase tracking-widest text-[#FF5C00] font-bold block mb-4">
                READY TO PARTNER WITH US?
              </span>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-normal uppercase tracking-tighter leading-none mb-8 font-sans">
                START EARNING WITH SUBQI TODAY.
              </h2>
              {existingAffiliate ? (
                <Link
                  to="/user/dashboard"
                  className="inline-flex items-center gap-3 bg-[#FF5C00] text-black hover:bg-white hover:text-black transition-all px-10 py-5 font-black text-sm uppercase tracking-widest"
                >
                  <span>Open Your Affiliate Hub</span>
                  <ArrowRight size={20} />
                </Link>
              ) : (
                <a
                  href="#register-section"
                  className="inline-flex items-center gap-3 bg-[#FF5C00] text-black hover:bg-white hover:text-black transition-all px-10 py-5 font-black text-sm uppercase tracking-widest"
                >
                  <span>Activate Your Partner Link</span>
                  <ArrowRight size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AffiliateLanding;
