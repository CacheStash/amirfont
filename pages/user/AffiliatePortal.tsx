/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Copy, Check, ArrowRight, Clock, CheckCircle2, DollarSign, CircleDollarSign,
  AlertCircle, Share2, ExternalLink, Settings, Save, Mail, Hash,
  Tag, MapPin, Phone, Calendar, Wallet, ChevronRight, FileText,
  Zap, RefreshCw, X, Sparkles, Info, ShieldCheck, Percent, Timer, Award, Star, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  COUNTRIES, 
  PROVINCES_BY_COUNTRY, 
  getDummyAffiliateData, 
  syncAffiliateCoupon, 
  checkCouponAvailability,
  findCountryByName,
  getNextMonthlyPayoutDate,
  AFFILIATE_MIN_PAYOUT_USD
} from '../../utils/affiliateGeo';
import { calculateAffiliateMilestone, getClaimedMilestones, getAffiliateEarningBadge } from '../../utils/affiliateMilestone';
import { CountryCombobox } from '../../components/CountryCombobox';
import { PhoneDialCombobox } from '../../components/PhoneDialCombobox';

interface PayoutItem {
  id: string;
  paid_at: string;
  amount: number;
  fee?: number;
  net_amount?: number;
  currency: string;
  payout_batch_id: string;
  commission_count: number;
  status: string;
  notes?: string;
}

const AffiliatePortal: React.FC = () => {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'settings'>('overview');
  const [salesPage, setSalesPage] = useState(1);
  const SALES_PER_PAGE = 10;
  const [payoutPage, setPayoutPage] = useState(1);
  const PAYOUTS_PER_PAGE = 10;

  // Account Settings Form State
  const [editFullName, setEditFullName] = useState('');
  const [originalFullName, setOriginalFullName] = useState('');
  const [editPaypalEmail, setEditPaypalEmail] = useState('');
  const [editVanityCode, setEditVanityCode] = useState('');
  const [vanityCodeAvailability, setVanityCodeAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [editPhoneCode, setEditPhoneCode] = useState('+62');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editCountry, setEditCountry] = useState('Indonesia');
  const [editStateProvince, setEditStateProvince] = useState('DKI Jakarta');
  const [editCity, setEditCity] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editStreetAddress, setEditStreetAddress] = useState('');
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(true);

  const [savingSettings, setSavingSettings] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawInputAmount, setWithdrawInputAmount] = useState('50.00');
  const [withdrawSuccess, setWithdrawSuccess] = useState<{
    grossAmount: number;
    feeAmount: number;
    netAmount: number;
    receiver: string;
    batchId: string;
  } | null>(null);
  const [withdrawError, setWithdrawError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Custom Coupon & Discount State (10% to 30%)
  const [affiliateCoupon, setAffiliateCoupon] = useState<any>(null);
  const [couponCodeCustom, setCouponCodeCustom] = useState('');
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<number>(10);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; message: string } | null>(null);
  const [countdownStr, setCountdownStr] = useState<string>('');

  const nextPayoutInfo = getNextMonthlyPayoutDate();

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');

      // 1. Fetch legal full name from fontbuyer profile, fallback to user metadata
      let resolvedName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      try {
        const { data: buyerData } = await supabase
          .from('fontbuyer')
          .select('full_name, address')
          .eq('id', user.id)
          .maybeSingle();

        if (buyerData?.full_name) {
          resolvedName = buyerData.full_name;
        }
      } catch (_) {}

      if (resolvedName) {
        setEditFullName(resolvedName);
        setOriginalFullName(resolvedName);
      }

      const { data: affData } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setAffiliate(affData);

      if (affData) {
        setEditPaypalEmail(affData.paypal_email || user.email || '');
        setEditVanityCode(affData.affiliate_code || '');
        if (affData.phone_code) setEditPhoneCode(affData.phone_code);
        if (affData.phone_number) setEditPhoneNumber(affData.phone_number);
        if (affData.country) {
          setEditCountry(affData.country);
          if (affData.state_province) setEditStateProvince(affData.state_province);
        }
        if (affData.city) setEditCity(affData.city);
        if (affData.postal_code) setEditPostalCode(affData.postal_code);
        if (affData.street_address) setEditStreetAddress(affData.street_address);

        // Auto Payout Preference
        const cachedPref = localStorage.getItem(`aff_auto_payout_${affData.id}`);
        if (affData.auto_payout_enabled !== undefined && affData.auto_payout_enabled !== null) {
          setAutoPayoutEnabled(affData.auto_payout_enabled !== false);
        } else if (cachedPref !== null) {
          setAutoPayoutEnabled(cachedPref === '1');
        } else {
          setAutoPayoutEnabled(true);
        }

        // Pre-fill dummy data if test account has empty address
        if (!affData.phone_number && user.email === 'gotrainer19@gmail.com') {
          const dummy = getDummyAffiliateData(user.email);
          if (dummy) {
            setEditPhoneCode(dummy.phone_code);
            setEditPhoneNumber(dummy.phone_number);
            setEditCountry(dummy.country);
            setEditStateProvince(dummy.state_province);
            setEditCity(dummy.city);
            setEditPostalCode(dummy.postal_code);
            setEditStreetAddress(dummy.street_address);
          }
        }

        // Fetch active affiliate coupon
        try {
          const { data: couponRow } = await supabase
            .from('coupons')
            .select('*')
            .eq('affiliate_id', affData.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (couponRow) {
            setAffiliateCoupon(couponRow);
            setCouponCodeCustom(couponRow.code);
            setCouponDiscountPercent(Number(couponRow.discount_value || couponRow.discount_percentage || 10));
          } else {
            // Fallback: Check if coupon exists matching affiliate_code pattern
            const defaultCode = `${affData.affiliate_code || ''}10`;
            const { data: fallbackCoup } = await supabase
              .from('coupons')
              .select('*')
              .ilike('code', defaultCode)
              .eq('is_active', true)
              .maybeSingle();

            if (fallbackCoup) {
              setAffiliateCoupon(fallbackCoup);
              setCouponCodeCustom(fallbackCoup.code);
              setCouponDiscountPercent(Number(fallbackCoup.discount_value || fallbackCoup.discount_percentage || 10));
            } else {
              setCouponCodeCustom(defaultCode);
              setCouponDiscountPercent(10);
            }
          }
        } catch (_) {
          setCouponCodeCustom(`${affData.affiliate_code || ''}10`);
          setCouponDiscountPercent(10);
        }

        // Fetch commissions
        const { data: commData } = await supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('affiliate_id', affData.id)
          .order('created_at', { ascending: false });

        // Query font_history metadata for attribution details
        const orderIds = (commData || []).map(c => c.order_id).filter(Boolean);
        const orderMetaMap = new Map<string, any>();
        if (orderIds.length > 0) {
          try {
            const { data: histData } = await supabase
              .from('font_history')
              .select('transaction_id, metadata')
              .in('transaction_id', orderIds);
            (histData || []).forEach((h: any) => {
              if (h.transaction_id && h.metadata) {
                orderMetaMap.set(h.transaction_id, h.metadata);
              }
            });
          } catch (_) {}
        }

        const loadedComms = (commData || []).map((c: any) => {
          const meta = orderMetaMap.get(c.order_id);
          return {
            ...c,
            coupon_code: c.coupon_code || meta?.coupon_code || null,
            attribution_type: c.attribution_type || meta?.attribution_type || (meta?.coupon_code ? 'coupon' : 'referral_link')
          };
        });
        setCommissions(loadedComms);

        // Fetch Payouts History (try table first, fallback to synthesized)
        try {
          const { data: pData } = await supabase
            .from('affiliate_payouts')
            .select('*')
            .eq('affiliate_id', affData.id)
            .order('paid_at', { ascending: false });

          if (pData && pData.length > 0) {
            setPayoutHistory(pData.map((p: any) => {
              const amount = Number(p.amount || 0);
              const fee = Number(p.payout_fee ?? p.fee ?? Math.min(20, +(amount * 0.02).toFixed(2)));
              const netAmount = Number(p.net_amount ?? Math.max(0, +(amount - fee).toFixed(2)));
              return {
                id: p.id,
                paid_at: p.paid_at || p.created_at,
                amount,
                fee,
                net_amount: netAmount,
                currency: p.currency || 'USD',
                payout_batch_id: p.payout_batch_id || 'PP-BATCH',
                commission_count: Array.isArray(p.commission_ids) ? p.commission_ids.length : 1,
                status: p.status || 'completed',
                notes: p.notes
              };
            }));
          } else {
            synthesizePayoutHistory(loadedComms);
          }
        } catch {
          synthesizePayoutHistory(loadedComms);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const pendingComms = commissions.filter(c => c.status === 'pending_clearance' && new Date(c.cleared_at) > new Date());
    if (pendingComms.length === 0) {
      setCountdownStr('');
      return;
    }
    const earliestTime = Math.min(...pendingComms.map(c => new Date(c.cleared_at).getTime()));

    const updateCountdown = () => {
      const diff = earliestTime - Date.now();
      if (diff <= 0) {
        setCountdownStr('Clearing now...');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      setCountdownStr(parts.join(' '));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [commissions]);

  const synthesizePayoutHistory = (allComms: any[]) => {
    const paidComms = allComms.filter(c => c.status === 'paid');
    const groupMap = new Map<string, {
      id: string;
      paid_at: string;
      amount: number;
      count: number;
      reference: string;
    }>();

    paidComms.forEach(c => {
      // Group per withdrawal event (batch ID, payout reference, or exact ISO timestamp)
      const withdrawKey = c.payout_batch_id || c.payout_reference || (c.paid_at ? c.paid_at.substring(0, 19) : `item-${c.id}`);
      const existing = groupMap.get(withdrawKey) || {
        id: withdrawKey,
        paid_at: c.paid_at || c.created_at,
        amount: 0,
        count: 0,
        reference: c.payout_batch_id || c.payout_reference || 'PP-DISBURSEMENT'
      };
      existing.amount += Number(c.commission_amount || 0);
      existing.count += 1;
      groupMap.set(withdrawKey, existing);
    });

    const list = Array.from(groupMap.values()).map(g => {
      const total = Number(g.amount || 0);
      const fee = +(Math.min(20, total * 0.02)).toFixed(2);
      const netAmount = +(Math.max(0, total - fee)).toFixed(2);
      return {
        id: g.id,
        paid_at: g.paid_at,
        amount: total,
        fee,
        net_amount: netAmount,
        currency: 'USD',
        payout_batch_id: g.reference,
        commission_count: g.count,
        status: 'completed'
      };
    });

    list.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
    setPayoutHistory(list);
  };

  const handleCountryChange = (selectedCountry: string, dialCode?: string) => {
    setEditCountry(selectedCountry);
    if (dialCode) {
      setEditPhoneCode(dialCode);
    } else {
      const countryObj = findCountryByName(selectedCountry);
      if (countryObj) {
        setEditPhoneCode(countryObj.dial);
      }
    }
    const provinces = PROVINCES_BY_COUNTRY[selectedCountry];
    if (provinces && provinces.length > 0) {
      setEditStateProvince(provinces[0]);
    } else {
      setEditStateProvince('');
    }
  };

  const toggleAutoPayout = async () => {
    const nextVal = !autoPayoutEnabled;
    setAutoPayoutEnabled(nextVal);
    if (affiliate?.id) {
      localStorage.setItem(`aff_auto_payout_${affiliate.id}`, nextVal ? '1' : '0');
      try {
        await supabase
          .from('affiliates')
          .update({ auto_payout_enabled: nextVal, updated_at: new Date().toISOString() })
          .eq('id', affiliate.id);
      } catch (e) {
        console.warn("Direct toggle update error:", e);
      }
    }
  };

  // Real-time custom vanity code availability check in settings
  useEffect(() => {
    const clean = editVanityCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!clean || clean.length < 3) {
      setVanityCodeAvailability('idle');
      return;
    }

    if (affiliate?.affiliate_code && clean === affiliate.affiliate_code.toUpperCase()) {
      setVanityCodeAvailability('available');
      return;
    }

    setVanityCodeAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('affiliates')
          .select('id, user_id')
          .ilike('affiliate_code', clean)
          .maybeSingle();

        if (data && (!affiliate || data.id !== affiliate.id)) {
          setVanityCodeAvailability('taken');
        } else {
          setVanityCodeAvailability('available');
        }
      } catch (err) {
        console.warn('Vanity code availability check error:', err);
        setVanityCodeAvailability('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [editVanityCode, affiliate]);

  const handleCheckCouponAvailability = async () => {
    if (!couponCodeCustom || couponCodeCustom.trim().length < 3) {
      setAvailabilityResult({ available: false, message: 'Please enter at least 3 characters.' });
      return;
    }
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await checkCouponAvailability(supabase, couponCodeCustom, affiliate?.id);
      setAvailabilityResult(res);
    } catch (e: any) {
      setAvailabilityResult({ available: false, message: e.message || 'Check failed.' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');
    setSettingsError('');

    if (!editFullName.trim() || editFullName.trim().length < 2) {
      setSettingsError('Legal Full Name is required for partner compliance and payout verification.');
      return;
    }

    const cleanEmail = editPaypalEmail.trim().toLowerCase();
    const cleanCode = editVanityCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setSettingsError('Please provide a valid PayPal email address for disbursements.');
      return;
    }

    if (cleanCode.length < 3 || cleanCode.length > 20) {
      setSettingsError('Vanity code must be between 3 and 20 alphanumeric characters (A-Z, 0-9, dash, underscore).');
      return;
    }

    if (vanityCodeAvailability === 'taken') {
      setSettingsError(`The vanity code "${cleanCode}" is already taken by another creator. Please select another.`);
      return;
    }

    if (!editPhoneNumber.trim()) {
      setSettingsError('Phone number is required for partner identification.');
      return;
    }

    if (!editCountry.trim() || !editStateProvince.trim() || !editCity.trim() || !editPostalCode.trim() || !editStreetAddress.trim()) {
      setSettingsError('All physical address details (Country, State/Province, City, Postal Code, Street Address) are required for partner compliance.');
      return;
    }

    setSavingSettings(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session expired. Please sign in again.");

      const res = await fetch('/api/affiliate/save-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          paypalEmail: cleanEmail,
          affiliateCode: cleanCode,
          phoneCode: editPhoneCode,
          phoneNumber: editPhoneNumber.trim(),
          country: editCountry.trim(),
          stateProvince: editStateProvince.trim(),
          city: editCity.trim(),
          postalCode: editPostalCode.trim(),
          streetAddress: editStreetAddress.trim(),
          autoPayoutEnabled: autoPayoutEnabled,
          customCouponCode: couponCodeCustom.trim().toUpperCase(),
          couponDiscount: couponDiscountPercent
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save settings.');
      }

      if (data.affiliate) {
        setAffiliate(data.affiliate);
        setEditPaypalEmail(data.affiliate.paypal_email || '');
        setEditVanityCode(data.affiliate.affiliate_code || '');
      }
      if (data.fullName) {
        setEditFullName(data.fullName);
        setOriginalFullName(data.fullName);
      }
      if (data.coupon) {
        setAffiliateCoupon(data.coupon);
        setCouponCodeCustom(data.coupon.code);
        setCouponDiscountPercent(Number(data.coupon.discount_value || data.coupon.discount_percentage || 10));
      }

      localStorage.setItem(`aff_auto_payout_${affiliate.id}`, autoPayoutEnabled ? '1' : '0');
      setSettingsSuccess('Affiliate profile and promo coupon updated successfully!');
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to update account settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center font-bold uppercase tracking-widest text-black animate-pulse">
        Consulting Partner Vault...
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="border-2 border-black p-10 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-5">
        <Share2 size={36} className="mx-auto text-[#FF5C00]" />
        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Join the Subqi Affiliate Program</h3>
          <p className="text-xs sm:text-sm font-medium text-gray-700 max-w-md mx-auto leading-relaxed">
            Recommend our type specimens to your network and receive 20% net commission on every font license purchased.
          </p>
        </div>
        <div>
          <Link 
            to="/affiliate" 
            className="py-3 px-8 text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 bg-[#FF5C00] text-black border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
          >
            <Share2 size={15} /> Join Affiliate
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/c/${affiliate.affiliate_code}`;
  const couponCode = couponCodeCustom || (affiliateCoupon?.code) || `${affiliate.affiliate_code}${couponDiscountPercent}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const now = new Date();

  // Cleared / Due: status approved OR (pending_clearance with cleared_at <= now)
  const readyAmount = commissions
    .filter(c => c.status === 'approved' || (c.status === 'pending_clearance' && new Date(c.cleared_at) <= now))
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  // Clearance Holding: pending_clearance still within 14-day warranty window
  const pendingAmount = commissions
    .filter(c => c.status === 'pending_clearance' && new Date(c.cleared_at) > now)
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  // Total Disbursed / Settled (Gross and Net after PayPal outbound fee)
  const totalPaidGross = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  const totalNetPaidAmount = payoutHistory.length > 0
    ? payoutHistory.reduce((sum, p) => sum + Number(p.net_amount ?? (p.amount - (p.fee || 0))), 0)
    : Math.max(0, +(totalPaidGross - Math.min(20, totalPaidGross * 0.02)).toFixed(2));

  // Gross referral sales & Milestone reward calculations
  const totalGrossSales = commissions.reduce((sum, c) => sum + Number(c.gross_amount || 0), 0);
  const claimedMilestones = affiliate ? getClaimedMilestones(affiliate.id, Math.floor(totalGrossSales / 1000)) : [];
  const milestoneInfo = calculateAffiliateMilestone(totalGrossSales, claimedMilestones);
  const earningBadge = getAffiliateEarningBadge(totalGrossSales);

  const isQualifiedForPayout = readyAmount >= AFFILIATE_MIN_PAYOUT_USD;
  const thresholdPercentage = Math.min(100, (readyAmount / AFFILIATE_MIN_PAYOUT_USD) * 100);
  const remainingForThreshold = Math.max(0, AFFILIATE_MIN_PAYOUT_USD - readyAmount);

  const provinceOptions = PROVINCES_BY_COUNTRY[editCountry] || [];

  const handleOpenWithdrawModal = () => {
    if (readyAmount < AFFILIATE_MIN_PAYOUT_USD) {
      alert(`Minimum withdrawal amount is $${AFFILIATE_MIN_PAYOUT_USD.toFixed(2)} USD. Your cleared balance is currently $${readyAmount.toFixed(2)} USD.`);
      return;
    }
    setWithdrawInputAmount(readyAmount.toFixed(2));
    setWithdrawError('');
    setWithdrawSuccess(null);
    setShowWithdrawModal(true);
  };

  // Safe fallback alias for any button referencing the legacy name
  const handleInstantWithdraw = handleOpenWithdrawModal;

  const executeWithdrawal = async () => {
    const targetAmt = Number(withdrawInputAmount);
    if (isNaN(targetAmt) || targetAmt < AFFILIATE_MIN_PAYOUT_USD) {
      setWithdrawError(`Minimum withdrawal amount is $${AFFILIATE_MIN_PAYOUT_USD.toFixed(2)} USD.`);
      return;
    }
    if (targetAmt > readyAmount + 0.001) {
      setWithdrawError(`Requested amount ($${targetAmt.toFixed(2)}) exceeds your cleared balance ($${readyAmount.toFixed(2)}).`);
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const res = await fetch('/api/affiliate/request-withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ amount: targetAmt })
      });

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.message || data.error || "Withdrawal failed.");

      await fetchAffiliateData();
      setWithdrawSuccess({
        grossAmount: Number(data.grossAmount || targetAmt),
        feeAmount: Number(data.feeAmount || 0),
        netAmount: Number(data.netAmount || data.amount || targetAmt),
        receiver: data.receiver || affiliate.paypal_email,
        batchId: data.payoutBatchId || ''
      });
    } catch (err: any) {
      setWithdrawError(err.message || "Withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const totalSalesPages = Math.ceil(commissions.length / SALES_PER_PAGE) || 1;
  const paginatedCommissions = commissions.slice((salesPage - 1) * SALES_PER_PAGE, salesPage * SALES_PER_PAGE);

  const totalPayoutPages = Math.ceil(payoutHistory.length / PAYOUTS_PER_PAGE) || 1;
  const paginatedPayouts = payoutHistory.slice((payoutPage - 1) * PAYOUTS_PER_PAGE, payoutPage * PAYOUTS_PER_PAGE);

  return (
    <div className="space-y-8 font-sans text-black">
      
      {/* HEADER SECTION (SUBQI NEO-BRUTALIST) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
        <div className="flex items-center gap-3.5">
          {/* EARNING BADGE (Envato Style Star/Medal with Tier Number - Neo-Brutalist) */}
          <div 
            className="group relative flex items-center justify-center shrink-0 cursor-help"
            title={earningBadge.hasEarned 
              ? `${earningBadge.label} (Total Gross Sales: $${totalGrossSales.toFixed(2)})`
              : `Creator Earning Badge: Reach $100 gross sales to unlock Level 1 (Current: $${totalGrossSales.toFixed(2)})`}
          >
            <div className={`relative w-12 h-12 flex flex-col items-center justify-center border-2 border-black transition-all ${
              earningBadge.hasEarned 
                ? 'bg-[#FFE500] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-gray-100 border-dashed border-gray-400 text-gray-400'
            }`}>
              <div className="flex items-center justify-center leading-none -mb-0.5">
                <Star 
                  size={11} 
                  className={earningBadge.hasEarned ? "fill-black text-black" : "fill-gray-300 text-gray-400"} 
                />
              </div>
              <span className={`text-lg font-black leading-none font-mono ${
                earningBadge.hasEarned ? 'text-black' : 'text-gray-400'
              }`}>
                {earningBadge.level > 0 ? earningBadge.level : '0'}
              </span>
              <span className={`text-[7px] font-black uppercase tracking-tighter leading-none ${
                earningBadge.hasEarned ? 'text-black' : 'text-gray-400'
              }`}>
                LVL
              </span>
            </div>

            {/* Hover Tooltip Card */}
            <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col z-30 w-60 p-3 bg-black text-white text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,229,0,1)] pointer-events-none font-sans">
              <div className="flex items-center gap-1.5 font-black text-[#FFE500] text-[11px] uppercase tracking-wider mb-1">
                <Award size={13} />
                {earningBadge.hasEarned ? `Level ${earningBadge.level} Creator Badge` : 'Creator Earning Badge'}
              </div>
              <p className="text-[11px] leading-tight text-gray-200 mb-2">
                {earningBadge.hasEarned 
                  ? `Milestone earning badge unlocked based on gross referral sales.` 
                  : `Reach $100 in gross referral sales to unlock Level 1 badge!`}
              </p>
              <div className="text-[10px] font-mono border-t border-gray-800 pt-1.5 flex justify-between">
                <span className="text-gray-400">Total Gross:</span>
                <span className="font-bold text-[#FFE500]">${totalGrossSales.toFixed(2)}</span>
              </div>
              {earningBadge.nextMinGross && (
                <div className="text-[10px] font-mono flex justify-between mt-0.5">
                  <span className="text-gray-400">Next (Lvl {earningBadge.level + 1}):</span>
                  <span className="font-bold text-white">${earningBadge.nextMinGross}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF5C00] block">
              Partner Identification
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight">
              Partner Code: <span className="font-mono bg-yellow-200 px-2 py-0.5 border border-black">{affiliate.affiliate_code}</span>
            </h2>
          </div>
        </div>

        {/* SUB TAB CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-black tracking-wider uppercase border-2 border-black transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Overview & Sales
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2.5 text-xs font-black tracking-wider uppercase border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Calendar size={13} /> Payouts & Due Ledger
            {isQualifiedForPayout && (
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-black tracking-wider uppercase border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Settings size={13} /> Account Settings
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SALES LEDGER */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* 3 FINANCIAL RECONCILIATION CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-500">
                <span>Clearance Holding</span>
                <Clock size={16} className="text-amber-600" />
              </div>
              <div className="text-3xl font-black font-mono text-amber-600">
                ${pendingAmount.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">14-day warranty hold against refund disputes</p>
              {countdownStr ? (
                <div className="mt-3 pt-2 border-t border-black/10 flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-900">
                  <Timer size={13} className="text-amber-700" />
                  <span>Earliest release: {countdownStr}</span>
                </div>
              ) : (
                <div className="mt-3 pt-2 border-t border-black/10 text-[10px] text-gray-400 italic">
                  No active clearance holds
                </div>
              )}
            </div>

            <div className="p-6 border-2 border-black bg-yellow-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-black">
                  <span>Ready For Payout (Due)</span>
                  <CheckCircle2 size={16} className="text-black" />
                </div>
                <div className="text-3xl font-black font-mono text-black">
                  ${readyAmount.toFixed(2)}
                </div>
                <p className="text-xs text-black/80 font-bold">
                  {isQualifiedForPayout 
                    ? `Passed 14-day warranty. Ready for immediate withdrawal!` 
                    : `$${remainingForThreshold.toFixed(2)} more needed to unlock withdrawal ($50 min).`}
                </p>
              </div>

              <button
                onClick={handleOpenWithdrawModal}
                disabled={!isQualifiedForPayout || isWithdrawing}
                className={`w-full mt-2 py-2.5 px-3 border-2 border-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isQualifiedForPayout
                    ? 'bg-[#FF5C00] text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none'
                    : 'bg-black/10 text-black/40 border-black/20 cursor-not-allowed shadow-none'
                }`}
                title={isQualifiedForPayout ? "Withdraw cleared funds instantly to PayPal" : "Requires $50.00 minimum cleared balance"}
              >
                {isWithdrawing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Transferring...
                  </>
                ) : (
                  <>
                    <Zap size={13} /> {isQualifiedForPayout ? `Instant Withdraw ($${readyAmount.toFixed(2)})` : `Withdraw ($50 Min)`}
                  </>
                )}
              </button>
            </div>

            <div className="p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-500">
                <span>Lifetime Net Paid</span>
                <CircleDollarSign size={16} className="text-black" />
              </div>
              <div className="text-3xl font-black font-mono text-black">
                ${totalNetPaidAmount.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">Net payouts received to PayPal (post-fee)</p>
            </div>
          </div>

          {/* 14-DAY WARRANTY HOLD CLARITY BANNER */}
          <div className="border-2 border-black bg-amber-50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
            <Clock size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 grow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-950 block">
                  Why is there a 14-Day Clearance Period on new sales?
                </span>
                {countdownStr && (
                  <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-950 px-2 py-0.5 border border-black inline-flex items-center gap-1 shrink-0 self-start sm:self-auto">
                    <Timer size={12} /> Next Release: {countdownStr}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed max-w-3xl font-sans">
                To protect our creator network and partner payouts against fraudulent card use, unauthorized disputes, and chargebacks, every new sale is held in a 14-day warranty clearance window. Once the 14 days expire without customer dispute, funds automatically clear into <strong>Ready For Payout</strong> and can be withdrawn immediately to your PayPal account.
              </p>
            </div>
          </div>

          {/* TRANSPARENT PAYMENT GATEWAY FEE NOTICE (SUBQI NEO-BRUTALIST) */}
          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex items-start gap-3">
            <Info size={20} className="text-[#FF5C00] shrink-0 mt-0.5" />
            <div className="space-y-1 grow">
              <span className="text-xs font-black uppercase tracking-wider text-black block">
                Transparent Payment Gateway Fee Notice
              </span>
              <p className="text-[11px] text-gray-700 leading-relaxed max-w-3xl font-sans font-medium">
                As an independent type foundry, sales transactions already incur payment gateway fees (~4.4% + $0.30) upon checkout, meaning the store receives net revenue rather than 100% of gross sales. In addition, PayPal charges an outbound transfer fee (standard 2% cross-border transfer, capped at $20.00 USD) on automated payouts. To maintain sustainable store operations, this outbound transfer fee is deducted from the withdrawal amount. We sincerely apologize for this gateway transfer cost and deeply appreciate your understanding and valuable partnership!
              </p>
            </div>
          </div>

          {/* COMMISSIONS & SALES TRANSACTION TABLE (AT THE TOP WITH AUTO-PAGINATION) */}
          <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-4 border-b-2 border-black bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Referral Sales & Commission Ledger
                </h3>
                <span className="text-[11px] text-gray-500">
                  Transactions referred via your vanity slug or promo coupon code
                </span>
              </div>
              <span className="text-xs font-mono font-black px-2 py-1 bg-black text-white">
                {commissions.length} Sales Recorded
              </span>
            </div>

            {commissions.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <AlertCircle size={32} className="mx-auto text-gray-400" />
                <p className="text-sm font-black uppercase">No referred orders recorded yet</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Share your vanity link or discount coupon on your social platforms and portfolio to begin recording 20% net earnings.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-100 font-mono uppercase text-[10px] text-gray-600 font-bold">
                      <th className="p-3">Date</th>
                      <th className="p-3">Typeface / Order</th>
                      <th className="p-3">Attribution</th>
                      <th className="p-3 text-right">Gross</th>
                      <th className="p-3 text-right">Net Store</th>
                      <th className="p-3 text-right">Commission (20%)</th>
                      <th className="p-3 text-right">PayPal Fee (2%)</th>
                      <th className="p-3 text-right">Net Payout</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/20 font-mono">
                    {paginatedCommissions.map((comm) => {
                      const commAmt = Number(comm.commission_amount || 0);
                      const commFee = +(Math.min(20, commAmt * 0.02)).toFixed(2);
                      const commNet = +(Math.max(0, commAmt - commFee)).toFixed(2);
                      return (
                        <tr key={comm.id} className="hover:bg-yellow-50 transition-colors">
                          <td className="p-3 text-gray-600 text-xs whitespace-nowrap">
                            {new Date(comm.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="p-3">
                            <span className="font-black font-sans text-xs uppercase block">
                              {comm.font_name || 'Specimen License'}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate block max-w-[200px]">
                              ID: {comm.order_id}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {comm.coupon_code || comm.attribution_type === 'coupon' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 border border-black bg-purple-100 text-purple-950 font-sans shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <Tag size={10} className="text-[#FF5C00]" /> Coupon: {comm.coupon_code || 'PROMO'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 border border-black bg-gray-100 text-gray-800 font-sans">
                                <Share2 size={10} className="text-gray-500" /> Shared Link
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">
                            ${Number(comm.gross_amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right text-gray-600 font-medium">
                            ${Number(comm.net_store_amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-black text-black text-sm">
                            +${commAmt.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700 text-xs">
                            -${commFee.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-green-700 text-sm">
                            ${commNet.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            {comm.status === 'pending_clearance' && (
                              <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 border border-black bg-amber-200 text-amber-950">
                                <Clock size={10} /> Holding
                              </span>
                            )}
                            {comm.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 border border-black bg-green-200 text-green-950">
                                <CheckCircle2 size={10} /> Cleared
                              </span>
                            )}
                            {comm.status === 'paid' && (
                              <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 border border-black bg-blue-200 text-blue-950">
                                <DollarSign size={10} /> Paid Out
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* AUTO PAGINATION CONTROLS */}
                {commissions.length > SALES_PER_PAGE && (
                  <div className="p-3 border-t-2 border-black bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans">
                    <span className="text-gray-600 font-medium">
                      Showing <strong className="text-black font-black">{(salesPage - 1) * SALES_PER_PAGE + 1}</strong> to <strong className="text-black font-black">{Math.min(salesPage * SALES_PER_PAGE, commissions.length)}</strong> of <strong className="text-black font-black">{commissions.length}</strong> sales
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                        disabled={salesPage === 1}
                        className="px-3 py-1 border border-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase font-black text-[10px]"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-mono font-black text-black text-[11px]">
                        Page {salesPage} of {totalSalesPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))}
                        disabled={salesPage >= totalSalesPages}
                        className="px-3 py-1 border border-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase font-black text-[10px]"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DUAL PROMO TOOLS: VANITY LINK + AUDIENCE COUPON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TOOL 1: VANITY LINK */}
            <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#FF5C00] block">
                  1. Personal Vanity Share Link
                </label>
                <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">30-day cookie window</span>
              </div>
              
              <div className="flex items-center border-2 border-black bg-gray-50 p-1.5">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl} 
                  className="w-full bg-transparent font-mono text-xs font-black text-black outline-none px-2 truncate"
                />
                <button 
                  onClick={handleCopyLink}
                  className="bg-black text-white hover:bg-[#FF5C00] hover:text-black border border-black py-1.5 px-3 text-[10px] tracking-wider uppercase font-black flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copiedLink ? 'COPIED' : 'COPY'}
                </button>
              </div>

              {/* ADDRESS BAR AUTO-CLEAN NOTICE */}
              <div className="p-3 bg-yellow-50 border border-black text-xs text-black space-y-1">
                <div className="flex items-center gap-1.5 font-black text-[#FF5C00] text-[10px] uppercase tracking-wider">
                  <Info size={13} />
                  <span>Address Bar Auto-Clean Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-800 font-medium">
                  When visitors open your referral link in their address bar, the slug automatically cleans itself into a clean URL. This is our standard platform behavior—your referral cookie is instantly recorded and full tracking remains 100% active for 30 days!
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                <span className="truncate pr-2">Visitors clicking this link are tagged for 30 days.</span>
                <Link to="/fonts" className="underline hover:text-[#FF5C00] font-bold flex items-center gap-1 uppercase text-[10px] whitespace-nowrap shrink-0">
                  View Catalog <ExternalLink size={10} />
                </Link>
              </div>
            </div>

            {/* TOOL 2: AUDIENCE PROMO COUPON */}
            <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#FF5C00] block flex items-center gap-1">
                  <Tag size={12} /> 2. Audience {couponDiscountPercent}% OFF Promo Code
                </label>
                <span className="text-[9px] font-black text-green-950 bg-green-200 px-2 py-0.5 border border-black uppercase">
                  Active in Checkout
                </span>
              </div>
              
              <div className="flex items-center border-2 border-black bg-gray-50 p-1.5">
                <input 
                  type="text" 
                  readOnly 
                  value={couponCode} 
                  className="w-full bg-transparent font-mono text-xs font-black text-black outline-none px-2 tracking-wider"
                />
                <button 
                  onClick={handleCopyCoupon}
                  className="bg-black text-white hover:bg-[#FF5C00] hover:text-black border border-black py-1.5 px-3 text-[10px] tracking-wider uppercase font-black flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedCoupon ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copiedCoupon ? 'COPIED' : 'COPY'}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Gives your audience {couponDiscountPercent}% instant discount. Commission (20%) is calculated on the discounted checkout total.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="underline hover:text-[#FF5C00] font-bold uppercase text-[10px] shrink-0 ml-2 cursor-pointer"
                >
                  Customize &rarr;
                </button>
              </div>
            </div>

          </div>

          {/* STRATEGY COMPARISON: REFERRAL LINK VS PROMO COUPON */}
          <div className="border-2 border-black bg-orange-50/70 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#FF5C00]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-black">
                Campaign Strategy: Referral Link vs Promo Coupon
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 border-2 border-black bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase tracking-wider text-[11px] text-black">1. Referral Link (/c/...)</span>
                  <span className="text-[9px] font-black bg-gray-100 px-2 py-0.5 border border-black uppercase">Full Rate</span>
                </div>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  <strong>Buyer pays full catalog price (100%).</strong> Your 20% Net commission is credited on the full transaction value (minus PayPal fees).
                </p>
                <div className="text-[10px] text-gray-500 font-bold space-y-0.5">
                  <div className="text-green-700">✓ Advantage: Maximum profit per individual transaction.</div>
                  <div className="text-gray-500">✕ Consideration: No discount incentive for price-sensitive buyers.</div>
                </div>
              </div>

              <div className="p-4 border-2 border-black bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase tracking-wider text-[11px] text-black">2. Promo Coupon ({couponDiscountPercent}% OFF)</span>
                  <span className="text-[9px] font-black bg-green-200 text-green-950 px-2 py-0.5 border border-black uppercase">High Conversion</span>
                </div>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  <strong>Buyer gets {couponDiscountPercent}% instant discount.</strong> Your 20% Net commission is computed from the discounted checkout total.
                </p>
                <div className="text-[10px] text-gray-500 font-bold space-y-0.5">
                  <div className="text-green-700">✓ Advantage: Drastically higher purchase conversion & instant impulse buy.</div>
                  <div className="text-gray-500">✕ Consideration: Dollar commission is slightly lower due to the discount.</div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-gray-600 bg-white p-3 border border-black/20 flex items-start gap-2">
              <Info size={14} className="text-[#FF5C00] shrink-0 mt-0.5" />
              <span>
                <strong>Flexibility Note:</strong> You can adjust your promo discount between <strong>10% (Default)</strong> and <strong>30% (Max)</strong> under the <strong>Settings</strong> tab. Offering 20%–30% discount attracts substantially more buyers, multiplying overall earnings!
              </span>
            </div>
          </div>

          {/* CREATOR MILESTONE REWARDS (NEO-BRUTALIST) */}
          <div className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF5C00] block">
                  Creator Milestone Rewards
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Award size={18} className="text-black" />
                  Personal Font Purchase Discounts
                </h3>
              </div>
              <div className="text-left sm:text-right font-mono">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Gross Referral Sales</span>
                <span className="text-lg font-black text-black">${milestoneInfo.totalGrossSales.toFixed(2)} USD</span>
              </div>
            </div>

            {/* PSYCHOLOGICAL URGENCY BANNER IF REWARD UNLOCKED */}
            {milestoneInfo.activeDiscountPercent > 0 && (
              <div className="p-4 bg-yellow-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-black">
                    <Sparkles size={14} className="text-[#FF5C00]" />
                    EXCLUSIVE CREATOR REWARD: {milestoneInfo.activeDiscountPercent}% OFF ACTIVE
                  </span>
                  <Link
                    to="/fonts"
                    className="bg-[#FF5C00] text-black font-black uppercase text-[10px] tracking-wider px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Use Discount Now &rarr;
                  </Link>
                </div>
                <p className="text-xs font-bold text-black/90 leading-relaxed font-sans">
                  {milestoneInfo.warningMessage}
                </p>
                <div className="text-[10px] text-gray-700 font-mono italic border-t border-black/20 pt-1.5">
                  * Auto-applied at checkout when logged in with this affiliate account. Single-use per tier and does not stack.
                </div>
              </div>
            )}

            {milestoneInfo.claimedInCurrentTier && (
              <div className="p-3 bg-green-100 border-2 border-black text-green-950 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-800" />
                  You have claimed your <strong>{milestoneInfo.rawTier}% OFF</strong> milestone reward for this tier!
                </span>
                {milestoneInfo.nextThreshold && (
                  <span className="text-[11px] font-mono font-black text-green-900">
                    Next tier at ${milestoneInfo.nextThreshold} (${milestoneInfo.amountNeededForNext.toFixed(2)} left)
                  </span>
                )}
              </div>
            )}

            {/* PROGRESS BAR & MILESTONE TIERS */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-mono font-black text-black">
                <span>Cycle Progress ($0 &rarr; $1,000)</span>
                <span>${milestoneInfo.cycleGrossSales.toFixed(2)} / $1,000.00</span>
              </div>
              <div className="w-full h-4 bg-gray-100 border-2 border-black relative overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${milestoneInfo.cycleProgressPercent}%` }}
                />
              </div>

              {/* 4 MILESTONE TIERS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { threshold: 100, label: '10% OFF' },
                  { threshold: 300, label: '20% OFF' },
                  { threshold: 500, label: '30% OFF' },
                  { threshold: 1000, label: '50% OFF' },
                ].map((tier) => {
                  const achieved = milestoneInfo.cycleGrossSales >= tier.threshold;
                  const isCurrent = milestoneInfo.rawTier === (tier.threshold === 1000 ? 50 : tier.threshold === 500 ? 30 : tier.threshold === 300 ? 20 : 10);
                  return (
                    <div 
                      key={tier.threshold}
                      className={`p-3 border-2 border-black text-center transition-all ${
                        isCurrent
                          ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                          : achieved
                          ? 'bg-gray-100 text-black'
                          : 'bg-white text-gray-400 border-gray-300'
                      }`}
                    >
                      <div className="text-[10px] font-mono font-black">${tier.threshold} Target</div>
                      <div className="text-base font-black mt-0.5">{tier.label}</div>
                      <div className="text-[9px] uppercase font-black tracking-tight mt-1">
                        {isCurrent ? '⚡ Current Tier' : achieved ? '✓ Reached' : 'Locked'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYOUT HISTORY & DUE STATUS */}
      {activeTab === 'payouts' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* PAYOUT SCHEDULE & THRESHOLD CARD */}
          <div className="p-6 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
              <div className="flex items-start gap-3">
                <Calendar size={26} className="text-[#FF5C00] shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00] block">
                      Disbursement Schedule
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 border border-black ${
                      autoPayoutEnabled ? 'bg-green-300 text-green-950' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {autoPayoutEnabled ? 'Auto-Payout Active' : 'Manual Payout Only'}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-0.5">
                    {autoPayoutEnabled ? `Next Monthly Payout: ${nextPayoutInfo.dateString}` : 'Automated Payout: Paused'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {autoPayoutEnabled ? (
                      <>Disbursements occur on the <span className="font-bold text-black">1st of every month</span> for balances reaching the <span className="font-bold text-black">${AFFILIATE_MIN_PAYOUT_USD.toFixed(2)} USD</span> minimum.</>
                    ) : (
                      <>Automated monthly disbursement is paused. Your cleared earnings accumulate until you trigger Instant Withdrawal manually.</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAutoPayout}
                    className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer whitespace-nowrap ${
                      autoPayoutEnabled 
                        ? 'bg-green-300 hover:bg-green-400 text-black' 
                        : 'bg-yellow-200 hover:bg-yellow-300 text-black'
                    }`}
                    title="Click to toggle automated monthly payouts"
                  >
                    {autoPayoutEnabled ? '✓ Auto-Payout: ON' : '✕ Auto-Payout: OFF'}
                  </button>
                  {autoPayoutEnabled && (
                    <span className="text-xs font-mono font-black px-3 py-1.5 bg-black text-white border-2 border-black inline-block">
                      {nextPayoutInfo.daysLeft} DAYS REMAINING
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 block font-mono">
                  To: <span className="font-bold text-black">{affiliate.paypal_email}</span>
                </span>
              </div>
            </div>

            {/* Threshold Qualification Meter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black uppercase tracking-wider text-[11px]">
                  $50 Minimum Threshold Progress
                </span>
                <span className="font-mono font-black text-black">
                  ${readyAmount.toFixed(2)} / ${AFFILIATE_MIN_PAYOUT_USD.toFixed(2)} USD ({thresholdPercentage.toFixed(0)}%)
                </span>
              </div>

              <div className="w-full bg-gray-100 border-2 border-black h-4 overflow-hidden p-0.5">
                <div 
                  className={`h-full transition-all duration-700 ${
                    isQualifiedForPayout ? 'bg-green-600' : 'bg-[#FF5C00]'
                  }`}
                  style={{ width: `${thresholdPercentage}%` }}
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-bold">
                  {isQualifiedForPayout ? (
                    <span className="text-green-800 flex items-center gap-1.5 uppercase">
                      <CheckCircle2 size={14} /> Qualified! You can withdraw your cleared balance of ${readyAmount.toFixed(2)} USD instantly to {affiliate.paypal_email}.
                    </span>
                  ) : (
                    <span className="text-amber-800 flex items-center gap-1.5 uppercase">
                      <Clock size={14} /> Accumulating: ${remainingForThreshold.toFixed(2)} USD needed to reach threshold ($50 min).
                    </span>
                  )}
                </div>

                <button
                  onClick={handleOpenWithdrawModal}
                  disabled={!isQualifiedForPayout || isWithdrawing}
                  className={`py-2 px-5 border-2 border-black text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    isQualifiedForPayout
                      ? 'bg-[#FF5C00] text-black hover:bg-black hover:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none'
                      : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isWithdrawing ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Disbursing...
                    </>
                  ) : (
                    <>
                      <Zap size={13} /> {isQualifiedForPayout ? `⚡ Withdraw Now ($${readyAmount.toFixed(2)})` : `Locked ($50 Min)`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 3 BALANCE BREAKDOWN CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 border-2 border-black bg-yellow-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-black block">
                Ready for Next Monthly Run
              </span>
              <div className="text-3xl font-black font-mono text-black">
                ${readyAmount.toFixed(2)}
              </div>
              <p className="text-xs text-black/70 font-bold">
                Passed 14-day warranty clearance
              </p>
            </div>

            <div className="p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                In-Warranty Holding
              </span>
              <div className="text-3xl font-black font-mono text-amber-600">
                ${pendingAmount.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">
                Protected by 14-day clearance buffer
              </p>
            </div>

            <div className="p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                Lifetime Paid Out (Net)
              </span>
              <div className="text-3xl font-black font-mono text-black">
                ${totalNetPaidAmount.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">
                Net transferred to PayPal
              </p>
            </div>
          </div>

          {/* SETTLED PAYOUTS LEDGER */}
          <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Completed Payout Disbursements ({payoutHistory.length})
                </h3>
                <span className="text-[11px] text-gray-500">
                  Official disbursement receipts to your PayPal account
                </span>
              </div>
              <span className="text-xs font-mono font-black px-2 py-1 bg-black text-white">
                ${totalNetPaidAmount.toFixed(2)} Net Settled
              </span>
            </div>

            {payoutHistory.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Wallet size={32} className="mx-auto text-gray-400" />
                <p className="text-sm font-black uppercase">No historical payouts yet</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When your cleared balance reaches $50.00 USD on the 1st of the month, payments are disbursed to {affiliate.paypal_email} and documented here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-100 font-mono uppercase text-[10px] text-gray-600 font-bold">
                      <th className="p-3">Payout Date</th>
                      <th className="p-3">Reference / Batch ID</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3 text-right">Gross Sent</th>
                      <th className="p-3 text-right">PayPal Fee (2% max $20)</th>
                      <th className="p-3 text-right">Net Received</th>
                      <th className="p-3 text-center">Orders Settled</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/20 font-mono">
                    {paginatedPayouts.map((p) => {
                      const fee = p.fee ?? Math.min(20, +(p.amount * 0.02).toFixed(2));
                      const netReceived = p.net_amount ?? Math.max(0, +(p.amount - fee).toFixed(2));
                      return (
                        <tr key={p.id} className="hover:bg-yellow-50 transition-colors">
                          <td className="p-3 text-gray-600 text-xs whitespace-nowrap">
                            {new Date(p.paid_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="p-3 font-mono font-black text-black truncate max-w-[180px]">
                            {p.payout_batch_id}
                          </td>
                          <td className="p-3 text-gray-700 truncate max-w-[200px]">
                            {affiliate.paypal_email}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-800">
                            ${p.amount.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            -${fee.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-black text-green-700 text-sm font-mono">
                              ${netReceived.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold block">
                              {p.currency}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold">
                            {p.commission_count}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 border border-black bg-green-200 text-green-950">
                              <Check size={10} /> Completed
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* AUTO PAGINATION CONTROLS */}
                {payoutHistory.length > PAYOUTS_PER_PAGE && (
                  <div className="p-3 border-t-2 border-black bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans">
                    <span className="text-gray-600 font-medium">
                      Showing <strong className="text-black font-black">{(payoutPage - 1) * PAYOUTS_PER_PAGE + 1}</strong> to <strong className="text-black font-black">{Math.min(payoutPage * PAYOUTS_PER_PAGE, payoutHistory.length)}</strong> of <strong className="text-black font-black">{payoutHistory.length}</strong> disbursements
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPayoutPage(p => Math.max(1, p - 1))}
                        disabled={payoutPage === 1}
                        className="px-3 py-1 border border-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase font-black text-[10px]"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-mono font-black text-black text-[11px]">
                        Page {payoutPage} of {totalPayoutPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPayoutPage(p => Math.min(totalPayoutPages, p + 1))}
                        disabled={payoutPage >= totalPayoutPages}
                        className="px-3 py-1 border border-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase font-black text-[10px]"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TRANSPARENT PAYMENT GATEWAY FEE NOTICE (PAYOUTS SECTION) */}
          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex items-start gap-3">
            <Info size={20} className="text-[#FF5C00] shrink-0 mt-0.5" />
            <div className="space-y-1 grow">
              <span className="text-xs font-black uppercase tracking-wider text-black block">
                Transparent Payment Gateway Fee Notice
              </span>
              <p className="text-[11px] text-gray-700 leading-relaxed max-w-3xl font-sans font-medium">
                As an independent type foundry, sales transactions already incur payment gateway fees (~4.4% + $0.30) upon checkout, meaning the store receives net revenue rather than 100% of gross sales. In addition, PayPal charges an outbound transfer fee (standard 2% cross-border transfer, capped at $20.00 USD) on automated payouts. To maintain sustainable store operations, this outbound transfer fee is deducted from the withdrawal amount. We sincerely apologize for this gateway transfer cost and deeply appreciate your understanding and valuable partnership!
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: ACCOUNT & PAYOUT SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-3xl space-y-6">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">
                Partner Profile & Payment Configuration
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Keep your payout destination, vanity credentials, and physical address up-to-date.
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-4 border-2 border-black bg-green-100 text-green-900 text-xs font-black uppercase flex items-center gap-2">
                <CheckCircle2 size={16} /> {settingsSuccess}
              </div>
            )}

            {settingsError && (
              <div className="p-4 border-2 border-black bg-red-100 text-red-900 text-xs font-black uppercase flex items-center gap-2">
                <AlertCircle size={16} /> {settingsError}
              </div>
            )}

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              
              {/* Account Username & Authentication Info Card */}
              <div className="p-4 border-2 border-black bg-yellow-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_#000000]">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5C00] block">
                    Registered Login Account (Username)
                  </span>
                  <div className="text-sm font-black font-mono text-black flex items-center gap-1.5 mt-0.5">
                    <Mail size={14} className="text-[#FF5C00]" />
                    {userEmail || affiliate.paypal_email}
                  </div>
                  <span className="text-[11px] text-gray-600 font-bold block mt-0.5">
                    This is your primary login identity. Payout disbursements are sent to your PayPal email below.
                  </span>
                </div>
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 bg-black text-white border border-black self-start sm:self-center">
                  Verified Account
                </span>
              </div>

              {/* Legal Full Name Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5 text-gray-700">
                  <User size={14} className="text-[#FF5C00]" /> Legal Full Name
                </label>
                <input 
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="e.g. Johnathan Doe"
                  className="w-full border-2 border-black px-4 py-3 font-sans text-sm font-bold bg-white focus:bg-yellow-50 outline-none text-black"
                />
                <span className="text-[11px] text-gray-500 block">
                  Your legal personal or business entity name for financial payouts, tax reporting, and purchaser profile sync.
                </span>
              </div>

              {/* PayPal Email Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5 text-gray-700">
                  <Mail size={14} className="text-[#FF5C00]" /> PayPal Payout Email Address
                </label>
                <input 
                  type="email"
                  required
                  value={editPaypalEmail}
                  onChange={(e) => setEditPaypalEmail(e.target.value)}
                  placeholder="payouts@yourdomain.com"
                  className="w-full border-2 border-black px-4 py-3 font-mono text-sm font-bold bg-white focus:bg-yellow-50 outline-none"
                />
                <span className="text-[11px] text-gray-500 block">
                  All cleared commission earnings will be disbursed directly to this PayPal address.
                </span>
              </div>

              {/* Monthly Auto-Payout Toggle */}
              <div className="p-4 border-2 border-black bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#FF5C00]" />
                    <span className="text-xs font-black uppercase tracking-wider">Monthly Automated Disbursement</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed max-w-lg">
                    When enabled, cleared commissions ($50.00+ minimum) are automatically paid out on the 1st of each month. If disabled, your balance accumulates indefinitely until you trigger Instant Withdrawal manually.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPayoutEnabled(!autoPayoutEnabled)}
                  className={`px-4 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer whitespace-nowrap self-start sm:self-center ${
                    autoPayoutEnabled ? 'bg-green-400 text-black' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {autoPayoutEnabled ? '✓ Auto-Payout ON' : '✕ Auto-Payout OFF (Manual Only)'}
                </button>
              </div>

              {/* Vanity Code Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5 text-gray-700">
                  <Hash size={14} className="text-[#FF5C00]" /> Custom Vanity Code
                </label>
                <div className="flex items-center border-2 border-black bg-white">
                  <span className="px-4 py-3 bg-gray-100 border-r-2 border-black text-xs font-mono font-black text-gray-600 select-none">
                    subqifont.com/c/
                  </span>
                  <input 
                    type="text"
                    required
                    value={editVanityCode}
                    onChange={(e) => setEditVanityCode(e.target.value.toUpperCase())}
                    placeholder="STUDIO_NAME"
                    className="grow px-4 py-3 font-mono text-sm font-black uppercase bg-transparent outline-none focus:bg-yellow-50"
                  />
                  {vanityCodeAvailability === 'checking' && (
                    <span className="px-3 text-xs text-black/60 font-mono flex items-center gap-1">
                      <RefreshCw size={12} className="animate-spin" /> Checking...
                    </span>
                  )}
                  {vanityCodeAvailability === 'available' && (
                    <span className="px-3 text-xs text-green-700 font-bold font-mono flex items-center gap-1">
                      <Check size={14} className="text-green-700" /> Available
                    </span>
                  )}
                  {vanityCodeAvailability === 'taken' && (
                    <span className="px-3 text-xs text-red-600 font-bold font-mono flex items-center gap-1">
                      <AlertCircle size={14} className="text-red-600" /> Taken
                    </span>
                  )}
                </div>
                {vanityCodeAvailability === 'taken' && (
                  <span className="text-xs text-red-600 font-bold font-mono block">
                    This custom vanity code is already taken by another creator. Please select another code.
                  </span>
                )}
                <span className="text-[11px] text-gray-500 block leading-relaxed">
                  Alphanumeric only (3–20 chars). Updating your code sets your custom referral link (<code>subqifont.com/c/{editVanityCode || 'CODE'}</code>). Note: When opened in an address bar, the slug cleans itself to show a pristine link while retaining your 30-day referral attribution.
                </span>
              </div>

              {/* Promo Coupon Customization & Availability Check */}
              <div className="p-5 border-2 border-black bg-yellow-50 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-[#FF5C00]" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Audience Promo Coupon & Discount Percentage
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 border border-black">
                    Current: {couponDiscountPercent}% OFF
                  </span>
                </div>

                {/* Coupon Code Input + Check Availability Button */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block">
                    Custom Coupon Code
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text"
                      value={couponCodeCustom}
                      onChange={(e) => {
                        setCouponCodeCustom(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                        setAvailabilityResult(null);
                      }}
                      placeholder="MYSTUDIO10"
                      className="grow px-4 py-2.5 font-mono text-sm font-black uppercase bg-white border-2 border-black outline-none focus:bg-yellow-100"
                    />
                    <button
                      type="button"
                      onClick={handleCheckCouponAvailability}
                      disabled={checkingAvailability || !couponCodeCustom}
                      className="px-4 py-2.5 bg-black text-white hover:bg-[#FF5C00] hover:text-black border-2 border-black text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      {checkingAvailability ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> Checking...
                        </>
                      ) : (
                        'Check Availability'
                      )}
                    </button>
                  </div>

                  {availabilityResult && (
                    <div className={`p-2.5 border-2 border-black text-xs font-bold flex items-center gap-2 mt-2 ${
                      availabilityResult.available ? 'bg-green-100 text-green-950' : 'bg-red-100 text-red-950'
                    }`}>
                      {availabilityResult.available ? <Check size={14} className="text-green-700 shrink-0" /> : <AlertCircle size={14} className="text-red-700 shrink-0" />}
                      <span>{availabilityResult.message}</span>
                    </div>
                  )}
                  <span className="text-[10px] text-gray-500 block">
                    Check if your desired promo code is available before publishing.
                  </span>
                </div>

                {/* Discount Percentage Selector (10% to 30%) */}
                <div className="space-y-2 pt-2 border-t border-black/10">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block flex items-center justify-between">
                    <span>Discount Percentage Offered (10% Min – 30% Max)</span>
                    <span className="font-mono font-black text-black">{couponDiscountPercent}% OFF</span>
                  </label>

                  <div className="grid grid-cols-5 gap-2">
                    {[10, 15, 20, 25, 30].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const oldPct = couponDiscountPercent;
                          setCouponDiscountPercent(pct);
                          if (couponCodeCustom === `${editVanityCode}${oldPct}` || !couponCodeCustom) {
                            setCouponCodeCustom(`${editVanityCode}${pct}`);
                          }
                          setAvailabilityResult(null);
                        }}
                        className={`py-2 text-xs font-black uppercase border-2 border-black transition-all cursor-pointer ${
                          couponDiscountPercent === pct 
                            ? 'bg-[#FF5C00] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                            : 'bg-white text-black hover:bg-gray-100'
                        }`}
                      >
                        {pct}%{pct === 10 ? ' (Default)' : pct === 30 ? ' (Max)' : ''}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-gray-600 leading-relaxed bg-white/80 p-2.5 border border-black/15">
                    <strong>Economic Trade-off:</strong> Default is 10% OFF. You may raise it up to 30% OFF to make font purchases irresistible to your audience. While higher discounts slightly reduce net commission per sale, they dramatically boost checkout conversion rate and overall sales volume!
                  </p>
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5 text-gray-700">
                  <Phone size={14} className="text-[#FF5C00]" /> Phone Number (With Dial Code)
                </label>
                <div className="flex border-2 border-black bg-white">
                  <PhoneDialCombobox
                    value={editPhoneCode}
                    onChange={setEditPhoneCode}
                    theme="brutalist"
                  />
                  <input 
                    type="tel"
                    required
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="81234567890"
                    className="w-full px-4 py-3 font-mono text-sm font-bold outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Physical Address Section */}
              <div className="p-5 border-2 border-black bg-gray-50 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-[#FF5C00] block flex items-center gap-1.5">
                  <MapPin size={14} /> Physical Address / Tax Verification
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                      Country
                    </label>
                    <CountryCombobox
                      value={editCountry}
                      onChange={handleCountryChange}
                      theme="brutalist"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                      State / Province
                    </label>
                    {provinceOptions.length > 0 ? (
                      <select
                        value={editStateProvince}
                        onChange={(e) => setEditStateProvince(e.target.value)}
                        className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none cursor-pointer"
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
                        value={editStateProvince}
                        onChange={(e) => setEditStateProvince(e.target.value)}
                        placeholder="State or Region" 
                        required
                        className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                      City / District
                    </label>
                    <input 
                      type="text" 
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="e.g. Jakarta Selatan" 
                      required
                      className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                      Postal / ZIP Code
                    </label>
                    <input 
                      type="text" 
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                      placeholder="e.g. 12190" 
                      required
                      className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                    Street Address
                  </label>
                  <input 
                    type="text" 
                    value={editStreetAddress}
                    onChange={(e) => setEditStreetAddress(e.target.value)}
                    placeholder="Street name, suite, unit, building" 
                    required
                    className="w-full p-2.5 border-2 border-black bg-white font-mono text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Fixed Details Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-2 border-black bg-white font-mono text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Commission Rate:</span>
                  <span className="font-black text-sm text-black">
                    {(Number(affiliate.commission_rate || 0.20) * 100).toFixed(0)}% Net Store Proceeds
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Minimum Payout Threshold:</span>
                  <span className="font-black text-sm text-black">$50.00 USD</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Holding Window:</span>
                  <span className="font-black text-black">14-Day Customer Dispute Warranty</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Guild Status:</span>
                  <span className="font-black text-green-700 uppercase">{affiliate.status || 'ACTIVE'}</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-black text-white hover:bg-[#FF5C00] hover:text-black border-2 border-black py-3.5 px-8 text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all cursor-pointer"
                >
                  <Save size={14} />
                  <span>{savingSettings ? 'SAVING CHANGES...' : 'SAVE SETTINGS'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditFullName(originalFullName);
                    setEditPaypalEmail(affiliate.paypal_email || '');
                    setEditVanityCode(affiliate.affiliate_code || '');
                    if (affiliate.phone_code) setEditPhoneCode(affiliate.phone_code);
                    if (affiliate.phone_number) setEditPhoneNumber(affiliate.phone_number);
                    if (affiliate.country) setEditCountry(affiliate.country);
                    if (affiliate.state_province) setEditStateProvince(affiliate.state_province);
                    if (affiliate.city) setEditCity(affiliate.city);
                    if (affiliate.postal_code) setEditPostalCode(affiliate.postal_code);
                    if (affiliate.street_address) setEditStreetAddress(affiliate.street_address);
                    setSettingsError('');
                    setSettingsSuccess('');
                  }}
                  className="border-2 border-black bg-white hover:bg-gray-100 py-3.5 px-6 text-xs uppercase font-bold tracking-wider cursor-pointer"
                >
                  Reset
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* WITHDRAWAL CONFIRMATION MODAL (SUBQI NEO-BRUTALIST) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-6 space-y-5 text-black max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#FF5C00] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Wallet size={16} className="text-black" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Confirm Withdrawal</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PayPal Payout Transfer</p>
                </div>
              </div>
              <button 
                onClick={() => { if (!isWithdrawing) { setShowWithdrawModal(false); setWithdrawError(''); setWithdrawSuccess(null); } }}
                disabled={isWithdrawing}
                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 border-2 border-black bg-green-100 space-y-3 text-center">
                  <CheckCircle2 size={36} className="text-green-700 mx-auto" />
                  <h4 className="text-sm font-black uppercase text-green-950">Transfer Completed!</h4>
                  <p className="text-xs text-green-900 leading-relaxed font-sans font-medium">
                    <span className="font-black font-mono text-base text-green-950">${withdrawSuccess.netAmount.toFixed(2)} USD</span> has been sent to your PayPal account:
                  </p>
                  <p className="font-mono text-xs font-bold bg-white border-2 border-black py-1 px-3 inline-block">
                    {withdrawSuccess.receiver}
                  </p>

                  <div className="pt-2 border-t border-black/20 text-[11px] font-sans text-green-950 space-y-1 text-left px-2">
                    <div className="flex justify-between">
                      <span className="font-bold">Settled from Cleared Balance:</span>
                      <span className="font-mono font-black">${withdrawSuccess.grossAmount.toFixed(2)} USD</span>
                    </div>
                    {withdrawSuccess.feeAmount > 0 && (
                      <div className="flex justify-between text-amber-900 font-bold">
                        <span>PayPal Gateway Transfer Fee:</span>
                        <span className="font-mono font-black">-${withdrawSuccess.feeAmount.toFixed(2)} USD</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-green-950 pt-1 border-t border-black/10">
                      <span>Net Transferred to PayPal:</span>
                      <span className="font-mono font-black">${withdrawSuccess.netAmount.toFixed(2)} USD</span>
                    </div>
                  </div>

                  {withdrawSuccess.batchId && (
                    <p className="text-[10px] font-mono text-green-900 opacity-75 pt-1">
                      PayPal Batch ID: {withdrawSuccess.batchId}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setShowWithdrawModal(false); setWithdrawSuccess(null); }}
                  className="w-full py-3 bg-black text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FF5C00] hover:text-black transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <>
                {/* Editable Amount Input Card */}
                <div className="p-4 border-2 border-black bg-yellow-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 block">
                      Withdrawal Amount (USD)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-gray-600">
                      Available: <span className="text-black font-black">${readyAmount.toFixed(2)}</span>
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-lg text-black">
                      $
                    </span>
                    <input 
                      type="number"
                      step="0.01"
                      min={AFFILIATE_MIN_PAYOUT_USD}
                      max={readyAmount}
                      value={withdrawInputAmount}
                      onChange={(e) => setWithdrawInputAmount(e.target.value)}
                      disabled={isWithdrawing}
                      className="w-full pl-8 pr-4 py-2 border-2 border-black font-mono font-black text-xl text-black bg-white focus:outline-hidden focus:bg-yellow-100"
                    />
                  </div>

                  {/* Preset Quick Buttons */}
                  <div className="flex gap-2 text-[10px] font-black uppercase">
                    <button
                      type="button"
                      onClick={() => setWithdrawInputAmount('50.00')}
                      disabled={isWithdrawing || readyAmount < 50}
                      className="px-2.5 py-1 border border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer"
                    >
                      $50.00 Min
                    </button>
                    {readyAmount >= 100 && (
                      <button
                        type="button"
                        onClick={() => setWithdrawInputAmount('100.00')}
                        disabled={isWithdrawing}
                        className="px-2.5 py-1 border border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer"
                      >
                        $100.00
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setWithdrawInputAmount(readyAmount.toFixed(2))}
                      disabled={isWithdrawing}
                      className="px-2.5 py-1 border border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer ml-auto"
                    >
                      Max (${readyAmount.toFixed(2)})
                    </button>
                  </div>
                </div>

                {/* Dynamic Fee & Net Payout Calculation (Subqi Neo-Brutalist) */}
                {(() => {
                  const targetNum = Number(withdrawInputAmount) || 0;
                  const calcFee = targetNum >= AFFILIATE_MIN_PAYOUT_USD ? Math.min(20.00, Math.round(targetNum * 0.02 * 100) / 100) : 0;
                  const calcNet = Math.max(0, Math.round((targetNum - calcFee) * 100) / 100);

                  return (
                    <div className="p-3.5 border-2 border-black bg-white space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 block">
                        Payout Breakdown Summary
                      </span>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-black">
                          <span className="text-[11px] font-bold text-gray-700">Gross Settled from Balance:</span>
                          <span className="font-mono font-black">${targetNum.toFixed(2)} USD</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-900">
                          <span className="text-[11px] font-bold">PayPal Gateway Outbound Fee (2%, max $20):</span>
                          <span className="font-mono font-black">-${calcFee.toFixed(2)} USD</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-black/20 text-green-950 font-black">
                          <span className="text-[11px] uppercase tracking-wider">Estimated Net Received in PayPal:</span>
                          <span className="font-mono text-sm text-green-900 font-black">~${calcNet.toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Recipient Account Detail */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-black/10">
                    <span className="font-bold text-gray-600 uppercase text-[11px]">PayPal Destination</span>
                    <span className="font-mono font-bold text-black bg-gray-100 px-2 py-0.5 border border-black/20 text-xs">
                      {affiliate.paypal_email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-black/10">
                    <span className="font-bold text-gray-600 uppercase text-[11px]">Partner Code</span>
                    <span className="font-mono font-bold text-black">{affiliate.affiliate_code}</span>
                  </div>
                </div>

                {/* Warning Callout */}
                <div className="p-3 border-2 border-black bg-amber-50 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-black uppercase text-amber-950 text-[11px]">
                    <AlertCircle size={14} className="text-amber-700 shrink-0" />
                    <span>Double-Check Recipient Email</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-snug">
                    Please ensure the recipient PayPal address above is accurate and active. Transfers sent to an incorrect PayPal account cannot be reversed or refunded by the platform.
                  </p>
                </div>

                {withdrawError && (
                  <div className="p-3 border-2 border-red-600 bg-red-50 text-red-900 text-xs font-bold">
                    {withdrawError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowWithdrawModal(false); setWithdrawError(''); }}
                    disabled={isWithdrawing}
                    className="flex-1 py-3 border-2 border-black bg-gray-100 hover:bg-gray-200 text-black text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeWithdrawal}
                    disabled={isWithdrawing}
                    className="flex-1 py-3 border-2 border-black bg-[#FF5C00] text-black hover:bg-black hover:text-white text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isWithdrawing ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Zap size={13} /> Confirm & Send
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AffiliatePortal;
