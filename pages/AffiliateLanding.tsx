/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, ArrowRight, ArrowUpRight, Sparkles, 
  Coins, CheckCircle2, Copy, Check, TrendingUp, Layers, 
  DollarSign, Clock, ShieldCheck, Zap, HeartHandshake, MousePointerClick,
  Tag, MapPin, Phone, UserCheck, User, RefreshCw, AlertCircle
} from 'lucide-react';
import { COUNTRIES, PROVINCES_BY_COUNTRY, getDummyAffiliateData, syncAffiliateCoupon, findCountryByName, getCitiesForState, detectClientLocation } from '../utils/affiliateGeo';
import { CountryCombobox } from '../components/CountryCombobox';
import { PhoneDialCombobox } from '../components/PhoneDialCombobox';

const AffiliateLanding: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [existingAffiliate, setExistingAffiliate] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [codeAvailability, setCodeAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [paypalEmail, setPaypalEmail] = useState('');

  // Phone & Address State (Defaulted to US)
  const [phoneCode, setPhoneCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('United States');
  const [stateProvince, setStateProvince] = useState('California');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Client location auto-suggestion for country & dial code
    detectClientLocation().then((geo) => {
      setCountry(prev => (prev === 'United States' ? geo.country : prev));
      setPhoneCode(prev => (prev === '+1' ? geo.phoneCode : prev));
      if (geo.stateProvince) {
        setStateProvince(prev => (prev === 'California' ? geo.stateProvince : prev));
      }
    }).catch(() => {});
    const checkAuthAndAffiliate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSessionUser(user);
      if (user) {
        setPaypalEmail(user.email || '');

        // Pre-fill legal full name & address from user profile
        const { data: buyer } = await supabase
          .from('fontbuyer')
          .select('full_name, address')
          .eq('id', user.id)
          .maybeSingle();

        if (buyer?.full_name) {
          setFullName(buyer.full_name);
        }

        const { data } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setExistingAffiliate(data);
          setAffiliateCode(data.affiliate_code || '');
          setPaypalEmail(data.paypal_email || user.email || '');
          if (data.phone_code) setPhoneCode(data.phone_code);
          if (data.phone_number) setPhoneNumber(data.phone_number);
          if (data.country) {
            setCountry(data.country);
            if (data.state_province) setStateProvince(data.state_province);
          }
          if (data.city) setCity(data.city);
          if (data.postal_code) setPostalCode(data.postal_code);
          if (data.street_address) setStreetAddress(data.street_address);
        } else {
          // Pre-fill dummy data for test account
          const dummy = getDummyAffiliateData(user.email);
          if (dummy) {
            setAffiliateCode(dummy.affiliate_code);
            setPaypalEmail(dummy.paypal_email);
            setPhoneCode(dummy.phone_code);
            setPhoneNumber(dummy.phone_number);
            setCountry(dummy.country);
            setStateProvince(dummy.state_province);
            setCity(dummy.city);
            setPostalCode(dummy.postal_code);
            setStreetAddress(dummy.street_address);
          }
        }
      }
    };
    checkAuthAndAffiliate();
  }, []);

  // Real-time custom vanity slug availability check
  useEffect(() => {
    const clean = affiliateCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!clean || clean.length < 3) {
      setCodeAvailability('idle');
      return;
    }

    if (existingAffiliate?.affiliate_code && clean === existingAffiliate.affiliate_code.toUpperCase()) {
      setCodeAvailability('available');
      return;
    }

    setCodeAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('affiliates')
          .select('id, user_id')
          .ilike('affiliate_code', clean)
          .maybeSingle();

        if (data && (!sessionUser || data.user_id !== sessionUser.id)) {
          setCodeAvailability('taken');
        } else {
          setCodeAvailability('available');
        }
      } catch (err) {
        console.warn('Vanity slug availability check error:', err);
        setCodeAvailability('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [affiliateCode, existingAffiliate, sessionUser]);

  const handleCountryChange = (selectedCountry: string, dialCode?: string) => {
    setCountry(selectedCountry);
    if (dialCode) {
      setPhoneCode(dialCode);
    } else {
      const countryObj = findCountryByName(selectedCountry);
      if (countryObj) {
        setPhoneCode(countryObj.dial);
      }
    }
    const provinces = PROVINCES_BY_COUNTRY[selectedCountry];
    if (provinces && provinces.length > 0) {
      setStateProvince(provinces[0]);
    } else {
      setStateProvince('');
    }
    setCity('');
  };

  const handleRegisterAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!sessionUser) {
      navigate('/user/auth?redirect=/affiliate');
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Legal Full Name is required for partner compliance and payout verification.');
      return;
    }

    const cleanCode = affiliateCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3 || cleanCode.length > 20) {
      setErrorMsg('Affiliate code must be 3-20 alphanumeric characters (A-Z, 0-9, dash, underscore).');
      return;
    }

    if (codeAvailability === 'taken') {
      setErrorMsg(`The partner code "${cleanCode}" is already taken by another creator. Please pick another.`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail.trim())) {
      setErrorMsg('Please enter a valid PayPal email address for payouts.');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMsg('Phone number is required to complete your partner profile.');
      return;
    }

    if (!country.trim() || !stateProvince.trim() || !city.trim() || !postalCode.trim() || !streetAddress.trim()) {
      setErrorMsg('Complete physical address details (Country, State/Province, City, Postal Code, Street Address) are required.');
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

      const fullPayload = {
        user_id: sessionUser.id,
        affiliate_code: cleanCode,
        paypal_email: paypalEmail.trim().toLowerCase(),
        phone_code: phoneCode,
        phone_number: phoneNumber.trim(),
        country: country.trim(),
        state_province: stateProvince.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        street_address: streetAddress.trim(),
        status: 'active',
        commission_rate: 0.20,
        updated_at: new Date().toISOString()
      };

      let affRecord: any = null;
      const { data, error } = await supabase
        .from('affiliates')
        .upsert(fullPayload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.warn('Upsert with full address fields failed, falling back to base fields:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
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

        if (fallbackError) throw fallbackError;
        affRecord = fallbackData;
      } else {
        affRecord = data;
      }

      // Two-Way Sync to fontbuyer (Primary User Profile)
      const fullAddress = [
        streetAddress.trim(),
        city.trim(),
        [stateProvince.trim(), postalCode.trim()].filter(Boolean).join(' '),
        country.trim()
      ].filter(Boolean).join(', ');

      await supabase.from('fontbuyer').upsert({
        id: sessionUser.id,
        full_name: fullName.trim(),
        address: fullAddress
      });

      // Auto-generate/sync promo coupon for audience
      await syncAffiliateCoupon(supabase, affRecord.id, cleanCode);

      setExistingAffiliate(affRecord);
      setSuccessMsg('Your affiliate partnership is active! Your vanity link and audience coupon are ready.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to activate partner account.');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = existingAffiliate 
    ? `${window.location.origin}/c/${existingAffiliate.affiliate_code}` 
    : `${window.location.origin}/c/${(affiliateCode || 'YOUR_CODE').toUpperCase()}`;

  const couponCode = existingAffiliate 
    ? `${existingAffiliate.affiliate_code}10` 
    : `${(affiliateCode || 'YOUR_CODE').toUpperCase()}10`;

  const handleCopyLink = () => {
    if (!existingAffiliate) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCoupon = () => {
    if (!existingAffiliate) return;
    navigator.clipboard.writeText(couponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const provinceOptions = PROVINCES_BY_COUNTRY[country] || [];
  const cityOptions = getCitiesForState(country, stateProvince);

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
              CREATOR PARTNER GUILD
            </span>
            <span className="text-xs uppercase tracking-widest text-black/60 font-semibold">
              PASSIVE REVENUE • 20% NET STORE COMMISSION
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-normal uppercase tracking-tighter leading-[0.85] mb-8 font-sans">
            MONETIZE <br className="hidden sm:block" />
            <span className="italic font-serif">YOUR TASTE.</span>
          </h1>

          <p className="text-base md:text-xl font-normal max-w-3xl leading-relaxed text-black/80 mb-10 normal-case">
            Turn your typography recommendations into continuous passive income. Share Subqi Studio's distinctive display fonts with your design followers, YouTube audience, clients, and newsletters. Earn 20% on every license sale with zero inventory and zero customer support effort.
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

      {/* 2. VANITY ROUTE PREVIEW SHOWCASE */}
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
                  CREATOR_VANITY_VIEWPORT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FF5C00] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                  ACTIVE PARTNER
                </span>
                <span className="border border-black px-2 py-0.5 text-[10px] font-bold uppercase bg-white">
                  WINDOW: 30-DAY
                </span>
              </div>
            </div>

            {/* Vanity Mockup Artboard */}
            <div className="min-h-[200px] md:min-h-[260px] bg-white border border-black flex flex-col items-center justify-center p-6 md:p-12 relative text-center">
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              <div className="relative z-10 max-w-2xl w-full">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF5C00] font-black block mb-2">
                  YOUR PERSONAL DIRECT SHARE LINK & PROMO CODE
                </span>
                <div className="border-2 border-black bg-gray-50 px-4 py-3 text-lg md:text-2xl font-mono font-black text-black tracking-tight inline-block max-w-full truncate shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {shareUrl}
                </div>
                <p className="text-xs uppercase tracking-widest text-black/50 mt-4">
                  [ ZERO PRODUCT OVERHEAD • 30-DAY ATTRIBUTION • TRANSPARENT PAYOUTS ]
                </p>
              </div>
            </div>

            {/* Micro Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-xs uppercase font-bold">
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> 20% Net Commission
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> 30-Day Cookie Tag
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> 14-Day Safe Clearance
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> Monthly PayPal Payouts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MARKETING PILLARS */}
      <section className="relative z-10 px-4 md:px-8 py-16 md:py-24 border-b border-black bg-white/20 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-[#FF5C00] font-bold">
              WHY JOIN OUR GUILD?
            </span>
            <h2 className="text-3xl md:text-6xl font-normal uppercase tracking-tight mt-2 font-sans">
              EFFORTLESS INCOME FOR DESIGNERS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">01</span>
                  <TrendingUp size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Monetize Your Design Taste
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Turn your visual recommendations into an extra revenue stream by earning on every typeface license your network buys.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                HIGH EARNING POTENTIAL
              </div>
            </div>

            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">02</span>
                  <Zap size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Zero Overhead & Zero Hassle
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Never worry about font file distribution, licensing paperwork, customer support, or billing disputes. Subqi handles all delivery and support.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                NO SUPPORT HEADACHES
              </div>
            </div>

            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">03</span>
                  <Sparkles size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Typefaces That Sell Themselves
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Subqi fonts feature chromatic layer stacking, custom OpenType alternates, and real-time experimentation in FontCanvas.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                BUILT FOR CONVERSIONS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ONBOARDING & ACTIVE STATUS SECTION */}
      <section id="register-section" className="relative z-10 px-4 md:px-8 py-16 md:py-24 border-b border-black">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="border-2 border-black bg-white p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {existingAffiliate ? (
              /* Active Affiliate Hub Box */
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

                {/* DUAL PROMO TOOLS: VANITY LINK + AUDIENCE COUPON */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* TOOL 1: VANITY LINK */}
                  <div className="p-4 border-2 border-black bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5C00] block">
                        1. Personal Share Link
                      </span>
                      <span className="text-[9px] font-mono text-black/60">30-day cookie</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1.5 border border-black">
                      <input 
                        type="text" 
                        readOnly 
                        value={shareUrl} 
                        className="w-full bg-transparent font-mono text-xs font-bold outline-none text-black truncate"
                      />
                      <button 
                        onClick={handleCopyLink}
                        className="bg-black text-white hover:bg-[#FF5C00] hover:text-black py-1 px-3 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 shrink-0"
                      >
                        {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                        {copiedLink ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                    <p className="text-[10px] text-black/60 leading-tight">
                      Visitors clicking this link are attributed to your account for 30 days.
                    </p>
                  </div>

                  {/* TOOL 2: AUDIENCE COUPON */}
                  <div className="p-4 border-2 border-black bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5C00] block flex items-center gap-1">
                        <Tag size={12} /> 2. Audience Promo Code
                      </span>
                      <span className="text-[9px] font-bold text-green-900 bg-green-100 px-1.5 py-0.5 border border-green-300">
                        10% OFF
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1.5 border border-black">
                      <input 
                        type="text" 
                        readOnly 
                        value={couponCode} 
                        className="w-full bg-transparent font-mono text-xs font-bold outline-none text-black tracking-wider"
                      />
                      <button 
                        onClick={handleCopyCoupon}
                        className="bg-black text-white hover:bg-[#FF5C00] hover:text-black py-1 px-3 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 shrink-0"
                      >
                        {copiedCoupon ? <Check size={12} /> : <Copy size={12} />}
                        {copiedCoupon ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                    <p className="text-[10px] text-black/60 leading-tight">
                      Buyers applying this code get 10% OFF and credit your 20% Net commission.
                    </p>
                  </div>
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
                    <HeartHandshake size={20} className="text-[#FF5C00]" />
                    <span className="text-xs uppercase font-bold tracking-widest text-[#FF5C00]">
                      PARTNER ACTIVATION
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-normal uppercase tracking-tight font-sans">
                    Activate Your Affiliate Partnership
                  </h2>
                  <p className="text-xs sm:text-sm leading-relaxed text-black/70 normal-case mt-2">
                    Reserve your unique vanity code to start earning 20% net commissions on your typography recommendations.
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

                {/* LOGGED IN ACCOUNT BADGE */}
                {sessionUser && (
                  <div className="p-3 bg-gray-100 border border-black flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-black">
                      <UserCheck size={16} className="text-green-800" />
                      Verified Account: <span className="font-mono">{sessionUser.email}</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-900 bg-green-200 px-2 py-0.5 border border-green-400">
                      Logged In
                    </span>
                  </div>
                )}

                <form onSubmit={handleRegisterAffiliate} className="space-y-6">
                  
                  {/* LEGAL FULL NAME */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black block flex items-center gap-1.5">
                      <User size={14} className="text-[#FF5C00]" /> Legal Full Name
                    </label>
                    <input 
                      type="text" 
                      required
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Johnathan Doe" 
                      className="w-full border-2 border-black px-4 py-3 font-sans text-sm bg-white outline-none"
                    />
                    <span className="text-[11px] text-black/50 block font-mono">
                      Your legal personal or company name for financial compliance, tax records, and account profile sync.
                    </span>
                  </div>

                  {/* 1. VANITY SLUG */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black block">
                      Requested Vanity Code & Promo Base
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
                      {codeAvailability === 'checking' && (
                        <span className="px-3 text-xs text-black/60 font-mono flex items-center gap-1">
                          <RefreshCw size={12} className="animate-spin" /> Checking...
                        </span>
                      )}
                      {codeAvailability === 'available' && (
                        <span className="px-3 text-xs text-green-700 font-bold font-mono flex items-center gap-1">
                          <Check size={14} className="text-green-700" /> Available
                        </span>
                      )}
                      {codeAvailability === 'taken' && (
                        <span className="px-3 text-xs text-red-600 font-bold font-mono flex items-center gap-1">
                          <AlertCircle size={14} className="text-red-600" /> Taken
                        </span>
                      )}
                    </div>
                    {codeAvailability === 'taken' && (
                      <span className="text-xs text-red-600 font-bold font-mono block">
                        This vanity code is already reserved by another creator. Please pick another code.
                      </span>
                    )}
                    <span className="text-[11px] text-black/50 block font-mono">
                      Creates link <code className="font-bold">subqi.com/c/{affiliateCode || 'STUDIO'}</code> and audience coupon <code className="font-bold">{(affiliateCode || 'STUDIO')}10</code> (10% OFF).
                    </span>
                  </div>

                  {/* 2. PAYPAL EMAIL */}
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
                      All monthly commission disbursements will be paid directly to this PayPal address.
                    </span>
                  </div>

                  {/* 3. PHONE NUMBER WITH COUNTRY DIAL CODE */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black block flex items-center gap-1.5">
                      <Phone size={14} className="text-[#FF5C00]" /> Phone Number
                    </label>
                    <div className="flex border-2 border-black bg-white">
                      <PhoneDialCombobox
                        value={phoneCode}
                        onChange={setPhoneCode}
                        theme="brutalist"
                      />
                      <input 
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="4155550198"
                        className="w-full px-4 py-3 font-mono text-sm font-bold outline-none bg-transparent text-black"
                      />
                    </div>
                  </div>

                  {/* 4. PHYSICAL ADDRESS */}
                  <div className="p-4 border-2 border-black bg-gray-50 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C00] block flex items-center gap-1.5">
                      <MapPin size={14} /> Physical Address / Billing Location
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-black block">
                          Country (Type to search or choose)
                        </label>
                        <CountryCombobox
                          value={country}
                          onChange={handleCountryChange}
                          theme="brutalist"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-black block">
                          State / Province
                        </label>
                        {provinceOptions.length > 0 ? (
                          <select
                            value={stateProvince}
                            onChange={(e) => setStateProvince(e.target.value)}
                            className="w-full p-2.5 border border-black bg-white font-mono text-xs font-bold outline-none cursor-pointer text-black"
                          >
                            {provinceOptions.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            required
                            value={stateProvince}
                            onChange={(e) => setStateProvince(e.target.value)}
                            placeholder="State or Region" 
                            className="w-full p-2.5 border border-black bg-white font-mono text-xs font-bold outline-none text-black"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-black block">
                          City / District
                        </label>
                        <input 
                          type="text" 
                          list="affiliate-subqi-landing-city-list"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. San Francisco" 
                          className="w-full p-2.5 border border-black bg-white font-mono text-xs font-bold outline-none text-black"
                        />
                        {cityOptions.length > 0 && (
                          <datalist id="affiliate-subqi-landing-city-list">
                            {cityOptions.map((c) => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-black block">
                          Postal / ZIP Code
                        </label>
                        <input 
                          type="text" 
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="e.g. 94105" 
                          className="w-full p-2.5 border border-black bg-white font-mono text-xs font-bold outline-none text-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-black block">
                        Street Address
                      </label>
                      <input 
                        type="text" 
                        required
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="e.g. 525 Market St, Suite 3200" 
                        className="w-full p-2.5 border border-black bg-white font-mono text-xs font-bold outline-none text-black"
                      />
                    </div>
                  </div>

                  {/* Program Policies Box */}
                  <div className="p-4 border border-black bg-gray-50 text-xs text-black/80 space-y-1.5 normal-case font-mono">
                    <span className="font-bold text-[11px] uppercase tracking-wider block text-black">
                      Program Terms & Policies:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-black/70">
                      <li>Commission is <strong>20% of net received sales</strong> (calculated after PayPal processing fees).</li>
                      <li>Earnings have a <strong>14-day warranty holding period</strong> against customer refund claims.</li>
                      <li>Minimum payout threshold is <strong>$50.00 USD</strong> disbursed monthly via PayPal.</li>
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
        </div>
      </section>
    </div>
  );
};

export default AffiliateLanding;
