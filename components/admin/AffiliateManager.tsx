/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Share2, Users, DollarSign, Clock, CheckCircle2, 
  AlertCircle, Download, Check, ShieldCheck, RefreshCw, 
  ExternalLink, Calendar, Eye, FileText, ArrowUpRight, 
  Search, X, Filter, ChevronRight, Wallet, Zap, Tag
} from 'lucide-react';
import { AFFILIATE_MIN_PAYOUT_USD, getNextMonthlyPayoutDate } from '../../utils/affiliateGeo';

interface AffiliateRecord {
  id: string;
  user_id: string;
  affiliate_code: string;
  paypal_email: string;
  commission_rate: number;
  status: string;
  phone_code?: string;
  phone_number?: string;
  country?: string;
  state_province?: string;
  city?: string;
  postal_code?: string;
  street_address?: string;
  auto_payout_enabled?: boolean;
  created_at: string;
}

interface CommissionRecord {
  id: string;
  order_id: string;
  affiliate_id: string;
  gross_amount: number;
  paypal_inbound_fee: number;
  net_store_amount: number;
  commission_amount: number;
  commission_rate: number;
  font_name?: string;
  buyer_email?: string;
  cleared_at: string;
  status: 'pending_clearance' | 'approved' | 'paid' | 'reversed';
  paid_at?: string;
  payout_reference?: string;
  coupon_code?: string;
  attribution_type?: string;
  created_at: string;
}

interface PayoutRecord {
  id: string;
  affiliate_id: string;
  affiliate_code?: string;
  paypal_email: string;
  amount: number;
  fee?: number;
  net_amount?: number;
  currency: string;
  payout_batch_id: string;
  status: string;
  paid_at: string;
  commission_count: number;
  notes?: string;
}

const AffiliateManager: React.FC = () => {
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'due_payouts' | 'partners' | 'commissions' | 'history'>('due_payouts');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settledSearchQuery, setSettledSearchQuery] = useState('');
  const [settledPage, setSettledPage] = useState(1);
  const SETTLED_PER_PAGE = 10;
  const [userEmailsMap, setUserEmailsMap] = useState<Record<string, string>>({});

  // Live PayPal balance state
  const [paypalLiveBalance, setPaypalLiveBalance] = useState<{
    available: number;
    total: number;
    asOf: string;
    isSandbox: boolean;
  } | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  
  // Modal states
  const [inspectedPartner, setInspectedPartner] = useState<AffiliateRecord | null>(null);
  const [payoutModalAffiliate, setPayoutModalAffiliate] = useState<{
    affiliate: AffiliateRecord;
    dueCommissions: CommissionRecord[];
    totalAmount: number;
  } | null>(null);
  const [payoutBatchId, setPayoutBatchId] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const nextPayoutInfo = getNextMonthlyPayoutDate();

  useEffect(() => {
    fetchData();
    fetchPayPalBalance();
  }, []);

  const fetchPayPalBalance = async () => {
    setIsFetchingBalance(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/paypal-balance', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json() as any;
      if (data.success) {
        setPaypalLiveBalance({
          available: Number(data.available_balance || 0),
          total: Number(data.total_balance || 0),
          asOf: data.as_of_time,
          isSandbox: data.is_sandbox
        });
      }
    } catch (err) {
      console.warn("Could not fetch live PayPal balance:", err);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: affData }, { data: commData }] = await Promise.all([
        supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_commissions').select('*').order('created_at', { ascending: false })
      ]);
      
      const loadedAffiliates = affData || [];

      // Fetch registered account emails for each affiliate
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const uRes = await fetch('/api/admin/affiliate-users', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (uRes.ok) {
            const uData = await uRes.json() as any;
            if (uData.success && uData.users) {
              setUserEmailsMap(uData.users);
            }
          }
        }
      } catch (uErr) {
        console.warn("Could not load affiliate user emails:", uErr);
      }
      
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

      const loadedCommissions = (commData || []).map((c: any) => {
        const meta = orderMetaMap.get(c.order_id);
        return {
          ...c,
          coupon_code: c.coupon_code || meta?.coupon_code || null,
          attribution_type: c.attribution_type || meta?.attribution_type || (meta?.coupon_code ? 'coupon' : 'referral_link')
        };
      });

      setAffiliates(loadedAffiliates);
      setCommissions(loadedCommissions);

      // Attempt to load from affiliate_payouts table; if missing/empty, synthesize from paid commissions
      try {
        const { data: payoutData, error: payoutErr } = await supabase
          .from('affiliate_payouts')
          .select('*')
          .order('paid_at', { ascending: false });

        if (!payoutErr && payoutData && payoutData.length > 0) {
          const mappedPayouts = payoutData.map((p: any) => {
            const aff = loadedAffiliates.find(a => a.id === p.affiliate_id);
            const commIds = Array.isArray(p.commission_ids) ? p.commission_ids : [];
            const amount = Number(p.amount || 0);
            const fee = Number(p.payout_fee ?? p.fee ?? Math.min(20, +(amount * 0.02).toFixed(2)));
            const netAmount = Number(p.net_amount ?? Math.max(0, +(amount - fee).toFixed(2)));
            return {
              id: p.id,
              affiliate_id: p.affiliate_id,
              affiliate_code: aff?.affiliate_code || 'PARTNER',
              paypal_email: p.paypal_email || aff?.paypal_email || '—',
              amount,
              fee,
              net_amount: netAmount,
              currency: p.currency || 'USD',
              payout_batch_id: p.payout_batch_id || 'PAYPAL-MASS',
              status: p.status || 'completed',
              paid_at: p.paid_at || p.created_at || new Date().toISOString(),
              commission_count: commIds.length || 1,
              notes: p.notes
            };
          });
          setPayouts(mappedPayouts);
        } else {
          synthesizePayoutHistory(loadedCommissions, loadedAffiliates);
        }
      } catch (err) {
        synthesizePayoutHistory(loadedCommissions, loadedAffiliates);
      }
    } catch (err) {
      console.error("Failed to load affiliate data:", err);
    } finally {
      setLoading(false);
    }
  };

  const synthesizePayoutHistory = (allComms: CommissionRecord[], allAffs: AffiliateRecord[]) => {
    const paidComms = allComms.filter(c => c.status === 'paid');
    const groupMap = new Map<string, {
      affiliate_id: string;
      paid_at: string;
      amount: number;
      commIds: string[];
      reference: string;
    }>();

    paidComms.forEach(c => {
      // Group per withdrawal event instead of combining entire days
      const withdrawKey = c.payout_batch_id || c.payout_reference || (c.paid_at ? c.paid_at.substring(0, 19) : c.created_at ? c.created_at.substring(0, 19) : `item-${c.id}`);
      const key = `${c.affiliate_id}_${withdrawKey}`;
      const existing = groupMap.get(key) || {
        affiliate_id: c.affiliate_id,
        paid_at: c.paid_at || c.created_at,
        amount: 0,
        commIds: [],
        reference: c.payout_batch_id || c.payout_reference || 'PP-DISBURSEMENT'
      };
      existing.amount += Number(c.commission_amount || 0);
      existing.commIds.push(c.id);
      groupMap.set(key, existing);
    });

    const synthList: PayoutRecord[] = [];
    groupMap.forEach((val, k) => {
      const aff = allAffs.find(a => a.id === val.affiliate_id);
      const amount = val.amount;
      const fee = +(Math.min(20, amount * 0.02)).toFixed(2);
      const netAmount = +(Math.max(0, amount - fee)).toFixed(2);
      synthList.push({
        id: k,
        affiliate_id: val.affiliate_id,
        affiliate_code: aff?.affiliate_code || 'PARTNER',
        paypal_email: aff?.paypal_email || '—',
        amount,
        fee,
        net_amount: netAmount,
        currency: 'USD',
        payout_batch_id: val.reference,
        status: 'completed',
        paid_at: val.paid_at,
        commission_count: val.commIds.length
      });
    });

    synthList.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
    setPayouts(synthList);
  };

  // Financial Metrics Calculation across store
  const totalGrossSales = commissions.reduce((sum, c) => sum + Number(c.gross_amount || 0), 0);
  const totalPayPalFees = commissions.reduce((sum, c) => sum + Number(c.paypal_inbound_fee || 0), 0);
  const totalNetStore = commissions.reduce((sum, c) => sum + Number(c.net_store_amount || 0), 0);
  
  const affiliateReservedPool = commissions
    .filter(c => c.status === 'pending_clearance' || c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  const safeToWithdraw = paypalLiveBalance !== null
    ? Math.max(0, paypalLiveBalance.available - affiliateReservedPool)
    : Math.max(0, totalNetStore - affiliateReservedPool);

  // Group due balances by affiliate
  const now = new Date();
  const affiliateDueBalances = affiliates.map(aff => {
    const affComms = commissions.filter(c => c.affiliate_id === aff.id);
    
    const dueCommissions = affComms.filter(c => 
      c.status === 'approved' || (c.status === 'pending_clearance' && new Date(c.cleared_at) <= now)
    );
    const dueAmount = dueCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const holdingCommissions = affComms.filter(c => 
      c.status === 'pending_clearance' && new Date(c.cleared_at) > now
    );
    const holdingAmount = holdingCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const paidAmount = affComms
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const lifetimeReferredGross = affComms.reduce((sum, c) => sum + Number(c.gross_amount || 0), 0);
    const lifetimeTotalEarnings = dueAmount + holdingAmount + paidAmount;

    const isQualified = dueAmount >= AFFILIATE_MIN_PAYOUT_USD;

    return {
      affiliate: aff,
      dueAmount,
      dueCommissions,
      holdingAmount,
      holdingCommissions,
      paidAmount,
      lifetimeReferredGross,
      lifetimeTotalEarnings,
      orderCount: affComms.length,
      isQualified
    };
  });

  // For monthly auto-disburse, respect creator preference (auto_payout_enabled !== false)
  const qualifiedPayouts = affiliateDueBalances.filter(item => item.isQualified && (item.affiliate.auto_payout_enabled !== false));
  const manualOnlyQualifiedPayouts = affiliateDueBalances.filter(item => item.isQualified && item.affiliate.auto_payout_enabled === false);
  const accumulatingPayouts = affiliateDueBalances.filter(item => item.dueAmount > 0 && !item.isQualified);
  const holdingOnlyPayouts = affiliateDueBalances.filter(item => item.dueAmount === 0 && item.holdingAmount > 0);

  // Direct instant single-partner payout via PayPal REST API
  const handleDirectPayPalPayout = async (item: typeof affiliateDueBalances[0]) => {
    const { affiliate, dueCommissions, dueAmount } = item;
    const commissionIds = dueCommissions.map(c => c.id);
    const fee = Math.min(20.00, Math.round(dueAmount * 0.02 * 100) / 100);
    const netAmount = Math.max(0.01, Math.round((dueAmount - fee) * 100) / 100);

    const confirmMsg = `EXECUTE DIRECT PAYPAL TRANSFER?\n\n- Partner: ${affiliate.affiliate_code}\n- Recipient: ${affiliate.paypal_email}\n- Gross Settled Balance: $${dueAmount.toFixed(2)} USD\n- PayPal Gateway Fee (2%, max $20): -$${fee.toFixed(2)} USD\n- Net Amount Sent to PayPal: $${netAmount.toFixed(2)} USD\n- Orders to Settle: ${commissionIds.length}\n\nThis will trigger an immediate live transfer from your PayPal account via PayPal REST API.\n\nProceed?`;
    if (!window.confirm(confirmMsg)) return;

    setIsSubmittingPayout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const res = await fetch('/api/admin/paypal-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payouts: [{
            affiliate_id: affiliate.id,
            affiliate_code: affiliate.affiliate_code,
            paypal_email: affiliate.paypal_email,
            amount: dueAmount,
            currency: 'USD',
            commission_ids: commissionIds
          }],
          notes: `Direct admin payout for ${affiliate.affiliate_code}`
        })
      });

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || data.message || "Payout request failed.");

      alert(`PAYPAL TRANSFER SUCCESSFUL!\n\nPayPal Batch ID: ${data.payoutBatchId}\nStatus: ${data.batchStatus}\nGross Settled: $${dueAmount.toFixed(2)} USD\nPayPal Fee: -$${fee.toFixed(2)} USD\nNet Transferred: $${netAmount.toFixed(2)} USD to ${affiliate.paypal_email}!\nCommissions updated to paid.`);
      await fetchData();
      fetchPayPalBalance();
    } catch (err: any) {
      alert("PayPal Payout Failed: " + err.message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Export PayPal Mass Payment CSV for Qualified Affiliates
  const handleExportPayPalCSV = () => {
    if (qualifiedPayouts.length === 0) {
      alert("No affiliates currently meet the $50.00 minimum threshold for batch payout.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Email,Amount,Currency,Custom_ID,Note\n";
    qualifiedPayouts.forEach(item => {
      csvContent += `${item.affiliate.paypal_email},${item.dueAmount.toFixed(2)},USD,${item.affiliate.affiliate_code},SubqiFont Monthly Partner Disbursement\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SubqiFont_Monthly_PayPal_Payouts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open payout dialog for an affiliate
  const handleOpenPayoutModal = (item: typeof affiliateDueBalances[0]) => {
    setPayoutModalAffiliate({
      affiliate: item.affiliate,
      dueCommissions: item.dueCommissions,
      totalAmount: item.dueAmount
    });
    setPayoutBatchId(`SQ-MONTHLY-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${item.affiliate.affiliate_code}`);
    setPayoutNotes(`Monthly disbursement for ${item.affiliate.affiliate_code} via PayPal.`);
  };

  // Execute live PayPal REST API payout for a single affiliate
  const handleLivePayPalPayout = async () => {
    if (!payoutModalAffiliate) return;
    const { affiliate, dueCommissions, totalAmount } = payoutModalAffiliate;
    const commissionIds = dueCommissions.map(c => c.id);

    if (commissionIds.length === 0) {
      alert("No commissions to settle.");
      return;
    }

    const confirmMsg = `EXECUTE LIVE PAYPAL TRANSFER?\n\n- Recipient: ${affiliate.paypal_email}\n- Partner Code: ${affiliate.affiliate_code}\n- Amount: $${totalAmount.toFixed(2)} USD\n- Orders: ${commissionIds.length}\n\nThis will trigger an immediate transfer from your PayPal account via PayPal REST API.\nProceed?`;
    if (!window.confirm(confirmMsg)) return;

    setIsSubmittingPayout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const res = await fetch('/api/admin/paypal-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payouts: [
            {
              affiliate_id: affiliate.id,
              affiliate_code: affiliate.affiliate_code,
              paypal_email: affiliate.paypal_email,
              amount: totalAmount,
              commission_ids: commissionIds
            }
          ],
          notes: payoutNotes || `Subqi Monthly Payout for ${affiliate.affiliate_code}`
        })
      });

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || data.message || "Payout request failed.");

      setPayoutModalAffiliate(null);
      await fetchData();
      alert(`SUCCESS! PayPal Payout Batch ID: ${data.payoutBatchId}\nStatus: ${data.batchStatus}\nAmount: $${totalAmount.toFixed(2)} USD successfully transferred to ${affiliate.paypal_email}!`);
    } catch (err: any) {
      alert("PayPal Payout Failed: " + err.message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Execute live PayPal REST API batch payout for ALL qualified affiliates (>= $50)
  const handleBatchLivePayPalPayout = async () => {
    if (qualifiedPayouts.length === 0) {
      alert("No affiliates currently meet the $50.00 minimum threshold for batch payout.");
      return;
    }

    const totalBatchAmount = qualifiedPayouts.reduce((sum, item) => sum + item.dueAmount, 0);
    const confirmMsg = `EXECUTE BATCH PAYPAL PAYOUT?\n\n- Qualified Creators: ${qualifiedPayouts.length}\n- Total Transfer Amount: $${totalBatchAmount.toFixed(2)} USD\n\nFunds will be sent to their registered PayPal accounts via PayPal REST API.\nProceed with live disbursement?`;
    if (!window.confirm(confirmMsg)) return;

    setIsSubmittingPayout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const payloadPayouts = qualifiedPayouts.map(item => ({
        affiliate_id: item.affiliate.id,
        affiliate_code: item.affiliate.affiliate_code,
        paypal_email: item.affiliate.paypal_email,
        amount: item.dueAmount,
        commission_ids: item.dueCommissions.map(c => c.id)
      }));

      const res = await fetch('/api/admin/paypal-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payouts: payloadPayouts,
          notes: "Subqi Monthly Automated Batch Payout"
        })
      });

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || data.message || "Batch payout failed.");

      await fetchData();
      alert(`BATCH PAYPAL PAYOUT SUCCESSFUL!\n\n- Batch ID: ${data.payoutBatchId}\n- Creators Paid: ${data.itemCount}\n- Total Disbursed: $${Number(data.totalAmount || 0).toFixed(2)} USD\n\nAll records updated in Supabase!`);
    } catch (err: any) {
      alert("Batch Payout Failed: " + err.message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Record payout execution (Manual / Offline Fallback)
  const handleExecutePayout = async () => {
    if (!payoutModalAffiliate) return;
    const { affiliate, dueCommissions, totalAmount } = payoutModalAffiliate;
    const commissionIds = dueCommissions.map(c => c.id);

    if (commissionIds.length === 0) {
      alert("No commissions to settle.");
      return;
    }

    setIsSubmittingPayout(true);
    const nowIso = new Date().toISOString();
    const batchId = payoutBatchId.trim() || `SQ-PP-${Date.now()}`;

    try {
      const { error: commError } = await supabase
        .from('affiliate_commissions')
        .update({ 
          status: 'paid', 
          paid_at: nowIso,
          payout_reference: batchId
        })
        .in('id', commissionIds);

      if (commError) throw commError;

      try {
        await supabase
          .from('affiliate_payouts')
          .insert({
            affiliate_id: affiliate.id,
            payout_batch_id: batchId,
            amount: totalAmount,
            currency: 'USD',
            paypal_email: affiliate.paypal_email,
            status: 'completed',
            commission_ids: commissionIds,
            paid_at: nowIso,
            notes: payoutNotes
          });
      } catch (payoutInsertErr) {
        console.warn("affiliate_payouts table insert bypassed (using synthesis fallback):", payoutInsertErr);
      }

      setPayoutModalAffiliate(null);
      await fetchData();
      alert(`Payout of $${totalAmount.toFixed(2)} USD successfully recorded for ${affiliate.affiliate_code}!`);
    } catch (err: any) {
      alert("Payout failed: " + err.message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Filter commissions for general ledger view
  const filteredCommissions = commissions.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrder = c.order_id?.toLowerCase().includes(q);
      const matchFont = c.font_name?.toLowerCase().includes(q);
      const matchBuyer = c.buyer_email?.toLowerCase().includes(q);
      const aff = affiliates.find(a => a.id === c.affiliate_id);
      const matchCode = aff?.affiliate_code?.toLowerCase().includes(q);
      return matchOrder || matchFont || matchBuyer || matchCode;
    }
    return true;
  });

  // Filter settled payouts history with multi-account search
  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => {
      if (!settledSearchQuery.trim()) return true;
      const q = settledSearchQuery.toLowerCase().trim();
      const aff = affiliates.find(a => a.id === p.affiliate_id);
      const userEmail = (aff?.user_id && userEmailsMap[aff.user_id]?.toLowerCase()) || '';
      const partnerCode = (p.affiliate_code || aff?.affiliate_code || '').toLowerCase();
      const legalName = (aff?.legal_name || '').toLowerCase();
      const paypalEmail = (p.paypal_email || aff?.paypal_email || '').toLowerCase();
      const batchId = (p.payout_batch_id || '').toLowerCase();
      return (
        userEmail.includes(q) ||
        partnerCode.includes(q) ||
        legalName.includes(q) ||
        paypalEmail.includes(q) ||
        batchId.includes(q)
      );
    });
  }, [payouts, settledSearchQuery, affiliates, userEmailsMap]);

  const totalSettledNet = useMemo(() => {
    return filteredPayouts.reduce((sum, p) => sum + (p.net_amount ?? (p.amount - (p.fee || 0))), 0);
  }, [filteredPayouts]);

  const totalSettledPages = Math.ceil(filteredPayouts.length / SETTLED_PER_PAGE) || 1;
  const paginatedSettledPayouts = filteredPayouts.slice((settledPage - 1) * SETTLED_PER_PAGE, settledPage * SETTLED_PER_PAGE);

  return (
    <div className="space-y-8 font-sans text-black">
      
      {/* HEADER SECTION (SUBQI NEO-BRUTALIST) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF5C00] block">
            Partner Treasury & Financial Hub
          </span>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
            Affiliate Command Center
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="border-2 border-black bg-white px-4 py-2.5 font-bold uppercase text-xs flex items-center gap-2 hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={handleExportPayPalCSV}
            className="border-2 border-black bg-white text-black px-4 py-2.5 font-bold uppercase text-xs flex items-center gap-2 hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all cursor-pointer"
            title="Download CSV for PayPal Mass Payments"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={handleBatchLivePayPalPayout}
            disabled={loading || isSubmittingPayout || qualifiedPayouts.length === 0}
            className={`border-2 border-black px-5 py-2.5 font-black uppercase text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none ${
              qualifiedPayouts.length > 0 
                ? 'bg-[#FF5C00] text-black hover:bg-black hover:text-white' 
                : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Zap size={14} className={isSubmittingPayout ? 'animate-spin' : ''} /> Auto-Disburse via PayPal ({qualifiedPayouts.length})
          </button>
        </div>
      </div>

      {/* 4 CORE FINANCIAL CARDS (SUBQI NEO-BRUTALIST) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Gross Sales Inbound</span>
          <div className="text-3xl font-black tracking-tight font-mono">
            ${totalGrossSales.toFixed(2)}
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Paid by buyers via PayPal</p>
        </div>

        <div className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">PayPal Gateway Fees</span>
          <div className="text-3xl font-black tracking-tight font-mono text-red-600">
            -${totalPayPalFees.toFixed(2)}
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Inbound transaction costs</p>
        </div>

        <div className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Affiliate Reserved Pool</span>
          <div className="text-3xl font-black tracking-tight font-mono text-amber-600">
            ${affiliateReservedPool.toFixed(2)}
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Due + in-warranty hold balance</p>
        </div>

        <div className="p-5 border-2 border-black bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-black block">
                SAFE TO WITHDRAW (PROFIT)
              </span>
              {paypalLiveBalance && (
                <span className={`text-[8px] font-black uppercase px-1 py-0.2 border border-black ${
                  paypalLiveBalance.isSandbox ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'
                }`}>
                  {paypalLiveBalance.isSandbox ? 'SANDBOX' : 'LIVE'}
                </span>
              )}
            </div>
            <button
              onClick={fetchPayPalBalance}
              disabled={isFetchingBalance}
              title="Sync live PayPal balance"
              className="text-[9px] font-black uppercase flex items-center gap-1 px-1.5 py-0.5 border border-black bg-white hover:bg-black hover:text-white transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              <RefreshCw size={9} className={isFetchingBalance ? 'animate-spin' : ''} /> {isFetchingBalance ? 'Syncing...' : 'Sync PP'}
            </button>
          </div>
          <div className="text-3xl font-black tracking-tight font-mono text-black">
            ${safeToWithdraw.toFixed(2)}
          </div>
          <p className="text-[11px] font-bold text-black/70 uppercase tracking-wide">
            {paypalLiveBalance !== null
              ? `${paypalLiveBalance.isSandbox ? 'Sandbox' : 'Live'} PayPal ($${paypalLiveBalance.available.toFixed(2)}) - Pool ($${affiliateReservedPool.toFixed(2)})`
              : 'Store net safe to sweep to bank'}
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS (SUBQI NEO-BRUTALIST) */}
      <div className="flex flex-wrap border-b-2 border-black gap-2 pb-0">
        <button
          onClick={() => setActiveTab('due_payouts')}
          className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-2 border-b-0 border-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'due_payouts'
              ? 'bg-black text-white shadow-[3px_-2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          <Clock size={14} /> Due & Scheduled Payouts
          {qualifiedPayouts.length > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] bg-[#FF5C00] text-black font-black font-mono">
              {qualifiedPayouts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-2 border-b-0 border-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'partners'
              ? 'bg-black text-white shadow-[3px_-2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          <Users size={14} /> Partner Accounts ({affiliates.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-2 border-b-0 border-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-black text-white shadow-[3px_-2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          <CheckCircle2 size={14} /> Settled Payouts ({payouts.length})
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-2 border-b-0 border-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'commissions'
              ? 'bg-black text-white shadow-[3px_-2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          <FileText size={14} /> All Attribution Orders ({commissions.length})
        </button>
      </div>

      {/* TAB 1: DUE & SCHEDULED PAYOUTS */}
      {activeTab === 'due_payouts' && (
        <div className="space-y-6">
          {/* Policy Banner */}
          <div className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Calendar size={22} className="text-[#FF5C00] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Monthly Payout Schedule: 1st of Every Month
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Next scheduled payout run on <span className="font-black text-black underline">{nextPayoutInfo.dateString}</span> ({nextPayoutInfo.daysLeft} days remaining). Minimum threshold is <span className="font-black text-black">${AFFILIATE_MIN_PAYOUT_USD.toFixed(2)} USD</span> with 14-day warranty hold. Balances under $50 roll over automatically.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="text-xs font-black px-3 py-1.5 bg-black text-white border border-black uppercase font-mono">
                Threshold: $50.00 USD
              </span>
            </div>
          </div>

          {/* SECTION A: QUALIFIED AFFILIATES (>= $50) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 border border-black"></span>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Qualified for Upcoming Monthly Settlement (Balance &ge; ${AFFILIATE_MIN_PAYOUT_USD.toFixed(2)})
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-gray-500">{qualifiedPayouts.length} creator(s) ready</span>
            </div>

            {qualifiedPayouts.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest bg-white">
                No affiliates currently have cleared balances &ge; ${AFFILIATE_MIN_PAYOUT_USD.toFixed(2)} USD. All qualifying earnings roll over until threshold is met.
              </div>
            ) : (
              <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-yellow-100 text-xs font-black uppercase tracking-wider">
                      <th className="p-3 border-r border-black">Partner Code</th>
                      <th className="p-3 border-r border-black">PayPal Account</th>
                      <th className="p-3 border-r border-black text-right">Cleared Balance (Due)</th>
                      <th className="p-3 border-r border-black text-right">In-Warranty Hold</th>
                      <th className="p-3 border-r border-black text-center">Orders</th>
                      <th className="p-3 border-r border-black text-center">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/20 font-mono text-xs">
                    {qualifiedPayouts.map(item => (
                      <tr key={item.affiliate.id} className="hover:bg-yellow-50">
                        <td className="p-3 border-r border-black/20 font-bold font-sans uppercase">
                          {item.affiliate.affiliate_code}
                          <span className="block font-mono text-[10px] font-normal text-black/60 lowercase">
                            {userEmailsMap[item.affiliate.user_id] || item.affiliate.paypal_email}
                          </span>
                        </td>
                        <td className="p-3 border-r border-black/20 font-bold truncate max-w-[200px]">
                          {item.affiliate.paypal_email}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right font-black text-green-700 text-sm">
                          ${item.dueAmount.toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right text-gray-500">
                          ${item.holdingAmount.toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-center">
                          {item.dueCommissions.length}
                        </td>
                        <td className="p-3 border-r border-black/20 text-center">
                          <span className="px-2 py-0.5 bg-green-200 text-green-900 border border-black text-[10px] font-black uppercase inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Qualified
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleDirectPayPalPayout(item)}
                              disabled={isSubmittingPayout}
                              className="bg-yellow-300 text-black border border-black py-1 px-2.5 text-[10px] font-black uppercase hover:bg-yellow-400 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none flex items-center gap-1"
                              title="Send funds directly to partner PayPal account via REST API"
                            >
                              <Zap size={10} className={isSubmittingPayout ? 'animate-spin' : ''} /> Send PayPal
                            </button>
                            <button
                              onClick={() => handleOpenPayoutModal(item)}
                              className="bg-white text-black border border-black py-1 px-2 text-[10px] font-black uppercase hover:bg-gray-100 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                              title="Record offline / manual payment"
                            >
                              Record Manual
                            </button>
                            <button
                              onClick={() => setInspectedPartner(item.affiliate)}
                              className="p-1 border border-black hover:bg-gray-100 cursor-pointer"
                              title="Inspect Financial Ledger"
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION B: ACCUMULATING BALANCES (< $50) */}
          <div className="space-y-3 pt-4 border-t-2 border-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 border border-black"></span>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Accumulating & Rolling Over (Cleared Balance &lt; ${AFFILIATE_MIN_PAYOUT_USD.toFixed(2)})
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-gray-500">{accumulatingPayouts.length} creator(s) rolling</span>
            </div>

            {accumulatingPayouts.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest bg-white">
                No affiliates currently in accumulating status.
              </div>
            ) : (
              <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-100 text-xs font-black uppercase tracking-wider">
                      <th className="p-3 border-r border-black">Partner Code</th>
                      <th className="p-3 border-r border-black">PayPal Account</th>
                      <th className="p-3 border-r border-black text-right">Cleared Balance</th>
                      <th className="p-3 border-r border-black">Threshold Progress ($50)</th>
                      <th className="p-3 border-r border-black text-right">Amount Remaining</th>
                      <th className="p-3 text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/20 font-mono text-xs">
                    {accumulatingPayouts.map(item => {
                      const percent = Math.min(100, (item.dueAmount / AFFILIATE_MIN_PAYOUT_USD) * 100);
                      const remaining = Math.max(0, AFFILIATE_MIN_PAYOUT_USD - item.dueAmount);

                      return (
                        <tr key={item.affiliate.id} className="hover:bg-yellow-50">
                          <td className="p-3 border-r border-black/20 font-bold font-sans uppercase">
                            {item.affiliate.affiliate_code}
                            <span className="block font-mono text-[10px] font-normal text-black/60 lowercase">
                              {userEmailsMap[item.affiliate.user_id] || item.affiliate.paypal_email}
                            </span>
                          </td>
                          <td className="p-3 border-r border-black/20 font-bold truncate max-w-[200px]">
                            {item.affiliate.paypal_email}
                          </td>
                          <td className="p-3 border-r border-black/20 text-right font-black text-amber-700">
                            ${item.dueAmount.toFixed(2)}
                          </td>
                          <td className="p-3 border-r border-black/20">
                            <div className="w-full bg-gray-100 border border-black h-3 overflow-hidden relative">
                              <div 
                                className="bg-[#FF5C00] h-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase block mt-0.5">
                              {percent.toFixed(0)}% reached
                            </span>
                          </td>
                          <td className="p-3 border-r border-black/20 text-right text-xs font-bold text-gray-600">
                            ${remaining.toFixed(2)} to qualify
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setInspectedPartner(item.affiliate)}
                              className="border border-black bg-white px-2.5 py-1 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                            >
                              <Eye size={10} /> Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PARTNER ACCOUNTS DIRECTORY */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight">Registered Partners ({affiliates.length})</h3>
            <span className="text-xs font-mono font-bold text-gray-500">Vanity Slugs Active</span>
          </div>

          {affiliates.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest bg-white">
              No affiliates registered yet. Activate a partner code from /affiliate landing page.
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100 text-xs font-black uppercase tracking-wider">
                    <th className="p-3 border-r border-black">Partner Code</th>
                    <th className="p-3 border-r border-black">Vanity Route</th>
                    <th className="p-3 border-r border-black">Country / Phone</th>
                    <th className="p-3 border-r border-black">PayPal Account</th>
                    <th className="p-3 border-r border-black text-right">Cleared (Due)</th>
                    <th className="p-3 border-r border-black text-right">Holding</th>
                    <th className="p-3 border-r border-black text-center">Status</th>
                    <th className="p-3 text-center">Audit Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20 font-mono text-xs">
                  {affiliates.map((a) => {
                    const balance = affiliateDueBalances.find(b => b.affiliate.id === a.id);
                    return (
                      <tr key={a.id} className="hover:bg-yellow-50">
                        <td className="p-3 border-r border-black/20 font-bold font-sans uppercase">
                          {a.affiliate_code}
                          <span className="block font-mono text-[10px] font-normal text-black/60 lowercase">
                            {userEmailsMap[a.user_id] || a.paypal_email}
                          </span>
                        </td>
                        <td className="p-3 border-r border-black/20">
                          <a 
                            href={`/c/${a.affiliate_code}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline flex items-center gap-1 font-bold text-black"
                          >
                            /c/{a.affiliate_code} <ExternalLink size={10} className="opacity-50" />
                          </a>
                        </td>
                        <td className="p-3 border-r border-black/20 font-sans">
                          <span className="block font-bold truncate max-w-[150px]">
                            {a.country || 'Not provided'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono block">
                            {a.phone_code} {a.phone_number || ''}
                          </span>
                        </td>
                        <td className="p-3 border-r border-black/20 font-bold truncate max-w-[180px]">
                          {a.paypal_email}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right font-black text-green-700">
                          ${(balance?.dueAmount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right text-gray-500">
                          ${(balance?.holdingAmount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-2 py-0.5 border border-black text-[9px] font-black uppercase bg-gray-100">
                              {a.status}
                            </span>
                            <span className={`px-1.5 py-0.2 border border-black text-[8px] font-black uppercase ${
                              a.auto_payout_enabled === false ? 'bg-amber-100 text-amber-950' : 'bg-green-100 text-green-950'
                            }`}>
                              {a.auto_payout_enabled === false ? 'Manual Only' : 'Auto 1st'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {balance && balance.isQualified && (
                              <button
                                onClick={() => handleDirectPayPalPayout(balance)}
                                disabled={isSubmittingPayout}
                                className="border border-black bg-yellow-300 hover:bg-yellow-400 text-black px-2 py-1 text-[10px] font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none inline-flex items-center gap-1"
                                title="Send live PayPal transfer now"
                              >
                                <Zap size={10} className={isSubmittingPayout ? 'animate-spin' : ''} /> Pay Now (${balance.dueAmount.toFixed(2)})
                              </button>
                            )}
                            <button
                              onClick={() => setInspectedPartner(a)}
                              className="border border-black bg-white px-2.5 py-1 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none inline-flex items-center gap-1"
                            >
                              <Eye size={10} /> View Ledger
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETTLED PAYOUTS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Settled Payouts History ({filteredPayouts.length})</h3>
              <span className="text-xs font-mono font-bold text-gray-500">Official PayPal disbursement records across all partner accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black px-2.5 py-1.5 bg-black text-white border-2 border-black">
                ${totalSettledNet.toFixed(2)} Net Disbursed
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={settledSearchQuery}
              onChange={e => {
                setSettledSearchQuery(e.target.value);
                setSettledPage(1);
              }}
              placeholder="Search by user email, partner code, legal name, or PayPal email..."
              className="w-full pl-9 pr-3 py-2 text-xs font-bold border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none placeholder:text-gray-400 uppercase"
            />
          </div>

          {filteredPayouts.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest bg-white">
              {settledSearchQuery ? 'No disbursements matching your search query.' : 'No completed payouts recorded yet. Payouts recorded via batch execution will appear here.'}
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100 text-xs font-black uppercase tracking-wider">
                    <th className="p-3 border-r border-black">Payout Date</th>
                    <th className="p-3 border-r border-black">Partner / Username</th>
                    <th className="p-3 border-r border-black">User Email</th>
                    <th className="p-3 border-r border-black">PayPal Destination</th>
                    <th className="p-3 border-r border-black">Reference / Batch ID</th>
                    <th className="p-3 border-r border-black text-right">Gross Sent</th>
                    <th className="p-3 border-r border-black text-right">PayPal Fee (2% max $20)</th>
                    <th className="p-3 border-r border-black text-right">Net Received</th>
                    <th className="p-3 border-r border-black text-center">Orders Settled</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20 font-mono text-xs">
                  {paginatedSettledPayouts.map(p => {
                    const aff = affiliates.find(a => a.id === p.affiliate_id);
                    const userEmail = (aff?.user_id && userEmailsMap[aff.user_id]) || '—';
                    const partnerCode = p.affiliate_code || aff?.affiliate_code || 'PARTNER';
                    const legalName = aff?.legal_name;
                    const fee = p.fee ?? Math.min(20, +(p.amount * 0.02).toFixed(2));
                    const netReceived = p.net_amount ?? Math.max(0, +(p.amount - fee).toFixed(2));

                    return (
                      <tr key={p.id} className="hover:bg-yellow-50">
                        <td className="p-3 border-r border-black/20 whitespace-nowrap text-gray-600">
                          {new Date(p.paid_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-3 border-r border-black/20 font-bold font-sans">
                          <span className="block uppercase font-black text-black">{partnerCode}</span>
                          {legalName && (
                            <span className="text-[10px] text-gray-500 font-medium block truncate max-w-[140px]">
                              {legalName}
                            </span>
                          )}
                        </td>
                        <td className="p-3 border-r border-black/20 font-sans font-bold text-gray-700 truncate max-w-[180px]">
                          {userEmail}
                        </td>
                        <td className="p-3 border-r border-black/20 font-bold truncate max-w-[180px] text-black">
                          {p.paypal_email}
                        </td>
                        <td className="p-3 border-r border-black/20 truncate max-w-[180px] text-gray-600 font-mono text-[11px]">
                          {p.payout_batch_id}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right font-bold text-gray-800">
                          ${p.amount.toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right font-mono font-bold text-red-600">
                          -${fee.toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right">
                          <span className="font-black text-green-700 text-sm font-mono block">
                            ${netReceived.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold block">
                            {p.currency}
                          </span>
                        </td>
                        <td className="p-3 border-r border-black/20 text-center font-bold">
                          {p.commission_count}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-green-200 text-green-900 border border-black text-[10px] font-black uppercase inline-flex items-center gap-1">
                            <Check size={10} /> Completed
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* AUTO PAGINATION CONTROLS */}
              {filteredPayouts.length > SETTLED_PER_PAGE && (
                <div className="p-3 border-t-2 border-black bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans">
                  <span className="text-gray-600 font-bold uppercase">
                    Showing <strong className="text-black font-black">{(settledPage - 1) * SETTLED_PER_PAGE + 1}</strong> to <strong className="text-black font-black">{Math.min(settledPage * SETTLED_PER_PAGE, filteredPayouts.length)}</strong> of <strong className="text-black font-black">{filteredPayouts.length}</strong> disbursements
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSettledPage(p => Math.max(1, p - 1))}
                      disabled={settledPage === 1}
                      className="px-3 py-1 border border-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase font-black text-[10px]"
                    >
                      Prev
                    </button>
                    <span className="px-2 font-mono font-black text-black text-[11px]">
                      Page {settledPage} of {totalSettledPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettledPage(p => Math.min(totalSettledPages, p + 1))}
                      disabled={settledPage >= totalSettledPages}
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
      )}

      {/* TAB 4: ALL COMMISSIONS & ATTRIBUTION ORDERS */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black uppercase tracking-tight">Attribution Orders ({filteredCommissions.length})</h3>
              <input
                type="text"
                placeholder="Search order, font, partner..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="border-2 border-black px-3 py-1.5 text-xs font-bold uppercase w-48 sm:w-64 outline-none focus:bg-yellow-50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {['all', 'pending_clearance', 'approved', 'paid'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer ${
                    statusFilter === f 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {filteredCommissions.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest bg-white">
              No commissions matching the selected filter or query.
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100 text-xs font-black uppercase tracking-wider">
                    <th className="p-3 border-r border-black">Order ID</th>
                    <th className="p-3 border-r border-black">Partner</th>
                    <th className="p-3 border-r border-black">Typeface</th>
                    <th className="p-3 border-r border-black">Attribution</th>
                    <th className="p-3 border-r border-black text-right">Gross</th>
                    <th className="p-3 border-r border-black text-right">PayPal Fee</th>
                    <th className="p-3 border-r border-black text-right">Net Store</th>
                    <th className="p-3 border-r border-black text-right">Commission</th>
                    <th className="p-3 border-r border-black">Clearance</th>
                    <th className="p-3 border-r border-black text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20 font-mono text-xs">
                  {filteredCommissions.map((c) => {
                    const aff = affiliates.find(a => a.id === c.affiliate_id);

                    return (
                      <tr key={c.id} className="hover:bg-yellow-50">
                        <td className="p-3 border-r border-black/20 font-bold truncate max-w-[120px]">
                          {c.order_id}
                        </td>
                        <td className="p-3 border-r border-black/20 font-sans font-black uppercase">
                          {aff?.affiliate_code || 'Unknown'}
                        </td>
                        <td className="p-3 border-r border-black/20 font-sans font-bold">
                          {c.font_name || 'Specimen License'}
                        </td>
                        <td className="p-3 border-r border-black/20 whitespace-nowrap">
                          {c.coupon_code || c.attribution_type === 'coupon' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 border border-black bg-purple-100 text-purple-950 font-sans shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                              <Tag size={10} className="text-[#FF5C00]" /> Coupon ({c.coupon_code || 'CODE'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black px-2 py-0.5 border border-black bg-gray-100 text-gray-700 font-sans">
                              <Share2 size={10} className="text-gray-400" /> Vanity Link
                            </span>
                          )}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right">
                          ${Number(c.gross_amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right text-red-600">
                          -${Number(c.paypal_inbound_fee || 0).toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right">
                          ${Number(c.net_store_amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-right font-black text-green-700">
                          +${Number(c.commission_amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-black/20 text-gray-500">
                          {new Date(c.cleared_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 border-r border-black/20 text-center">
                          <span className={`px-2 py-0.5 text-[9px] uppercase font-black border border-black ${
                            c.status === 'paid' ? 'bg-green-200 text-green-950' :
                            c.status === 'approved' ? 'bg-blue-200 text-blue-950' :
                            c.status === 'pending_clearance' ? 'bg-amber-200 text-amber-950' :
                            'bg-red-200 text-red-950'
                          }`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {c.status !== 'paid' && aff && (
                            <button
                              onClick={() => {
                                const balance = affiliateDueBalances.find(b => b.affiliate.id === aff.id);
                                if (balance) handleOpenPayoutModal(balance);
                              }}
                              className="border border-black bg-black text-white py-1 px-2.5 text-[10px] font-black uppercase hover:bg-[#FF5C00] hover:text-black transition-all cursor-pointer"
                            >
                              Pay Partner
                            </button>
                          )}
                          {c.status === 'paid' && (
                            <span className="text-xs text-green-700 font-bold uppercase inline-flex items-center gap-1">
                              <Check size={12} /> Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* INDIVIDUAL PARTNER AUDIT MODAL (SUBQI NEO-BRUTALIST) */}
      {inspectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-black max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-8">
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00] block">
                  Partner Financial Audit Ledger
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {inspectedPartner.affiliate_code}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Registered: {new Date(inspectedPartner.created_at).toLocaleDateString()} &bull; Slug: <span className="font-mono font-bold">/c/{inspectedPartner.affiliate_code}</span> &bull; Promo Code: <span className="font-mono font-bold">{inspectedPartner.affiliate_code}10</span>
                </p>
              </div>
              <button 
                onClick={() => setInspectedPartner(null)}
                className="p-1 hover:bg-black hover:text-white border border-black cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-2 border-black bg-gray-50 text-xs">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Disbursement Details</h4>
                <div className="space-y-1">
                  <p><span className="font-bold">User Account:</span> <span className="font-mono font-bold text-black">{userEmailsMap[inspectedPartner.user_id] || inspectedPartner.paypal_email}</span></p>
                  <p><span className="font-bold">PayPal Account:</span> <span className="font-mono font-bold text-black">{inspectedPartner.paypal_email}</span></p>
                  <p><span className="font-bold">Telephone:</span> {inspectedPartner.phone_code} {inspectedPartner.phone_number || '—'}</p>
                  <p><span className="font-bold">Commission Rate:</span> {(Number(inspectedPartner.commission_rate || 0.20) * 100).toFixed(0)}% Net</p>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Verified Location</h4>
                <div className="space-y-1">
                  <p><span className="font-bold">Street:</span> {inspectedPartner.street_address || '—'}</p>
                  <p><span className="font-bold">City / State:</span> {inspectedPartner.city || '—'}, {inspectedPartner.state_province || '—'} {inspectedPartner.postal_code || ''}</p>
                  <p><span className="font-bold">Country:</span> {inspectedPartner.country || '—'}</p>
                </div>
              </div>
            </div>

            {/* Partner Financial Stats */}
            {(() => {
              const partnerComms = commissions.filter(c => c.affiliate_id === inspectedPartner.id);
              const readyDue = partnerComms
                .filter(c => c.status === 'approved' || (c.status === 'pending_clearance' && new Date(c.cleared_at) <= now))
                .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
              const holding = partnerComms
                .filter(c => c.status === 'pending_clearance' && new Date(c.cleared_at) > now)
                .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
              const paid = partnerComms
                .filter(c => c.status === 'paid')
                .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
              const grossSales = partnerComms.reduce((sum, c) => sum + Number(c.gross_amount || 0), 0);

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="p-3 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[9px] font-black uppercase text-gray-500 block">Ready / Due</span>
                      <div className="text-xl font-mono font-black text-green-700">${readyDue.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{readyDue >= 50 ? 'Qualified' : 'Under $50'}</span>
                    </div>
                    <div className="p-3 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[9px] font-black uppercase text-gray-500 block">In Warranty</span>
                      <div className="text-xl font-mono font-black text-amber-700">${holding.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">14-day hold</span>
                    </div>
                    <div className="p-3 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[9px] font-black uppercase text-gray-500 block">Lifetime Paid</span>
                      <div className="text-xl font-mono font-black text-black">${paid.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Disbursed</span>
                    </div>
                    <div className="p-3 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[9px] font-black uppercase text-gray-500 block">Gross Sales</span>
                      <div className="text-xl font-mono font-black text-black">${grossSales.toFixed(2)}</div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{partnerComms.length} order(s)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Referred Orders & Statement ({partnerComms.length})
                    </h4>

                    {partnerComms.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest bg-gray-50">
                        No orders recorded yet through this partner slug or coupon.
                      </div>
                    ) : (
                      <div className="border-2 border-black max-h-60 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs font-mono">
                          <thead>
                            <tr className="border-b-2 border-black bg-gray-100 text-[10px] font-black uppercase">
                              <th className="p-2 border-r border-black">Order ID</th>
                              <th className="p-2 border-r border-black">Typeface</th>
                              <th className="p-2 border-r border-black text-right">Gross</th>
                              <th className="p-2 border-r border-black text-right">Net Store</th>
                              <th className="p-2 border-r border-black text-right">Commission</th>
                              <th className="p-2 border-r border-black">Clearance</th>
                              <th className="p-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/20 text-xs">
                            {partnerComms.map(c => (
                              <tr key={c.id} className="hover:bg-yellow-50">
                                <td className="p-2 border-r border-black/20 truncate max-w-[120px]">{c.order_id}</td>
                                <td className="p-2 border-r border-black/20 font-sans font-bold uppercase">{c.font_name || 'Specimen'}</td>
                                <td className="p-2 border-r border-black/20 text-right">${Number(c.gross_amount || 0).toFixed(2)}</td>
                                <td className="p-2 border-r border-black/20 text-right">${Number(c.net_store_amount || 0).toFixed(2)}</td>
                                <td className="p-2 border-r border-black/20 text-right font-black text-green-700">+${Number(c.commission_amount || 0).toFixed(2)}</td>
                                <td className="p-2 border-r border-black/20 text-gray-500">{new Date(c.cleared_at).toLocaleDateString()}</td>
                                <td className="p-2 text-center">
                                  <span className={`px-1.5 py-0.2 text-[8px] uppercase font-black border border-black ${
                                    c.status === 'paid' ? 'bg-green-200 text-green-950' :
                                    c.status === 'approved' ? 'bg-blue-200 text-blue-950' :
                                    'bg-amber-200 text-amber-950'
                                  }`}>
                                    {c.status.replace('_', ' ')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            <div className="flex justify-end pt-2 border-t-2 border-black">
              <button
                onClick={() => setInspectedPartner(null)}
                className="border-2 border-black px-6 py-2.5 font-bold uppercase text-xs hover:bg-black hover:text-white transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS PAYOUT DIALOG (SUBQI NEO-BRUTALIST) */}
      {payoutModalAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-2 border-black pb-4">
              <span className="text-[10px] font-black text-[#FF5C00] uppercase tracking-widest block">
                Official Payout Disbursement
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight">Record PayPal Settlement</h3>
            </div>

            <div className="p-4 border-2 border-black bg-yellow-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-gray-600 uppercase">Partner:</span>
                <span className="font-black font-mono uppercase">{payoutModalAffiliate.affiliate.affiliate_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-600 uppercase">PayPal Email:</span>
                <span className="font-bold font-mono">{payoutModalAffiliate.affiliate.paypal_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-600 uppercase">Orders Settled:</span>
                <span className="font-bold font-mono">{payoutModalAffiliate.dueCommissions.length} order(s)</span>
              </div>
              <div className="flex justify-between border-t border-black/20 pt-2 text-sm">
                <span className="font-black uppercase tracking-wider">Total Settlement:</span>
                <span className="font-mono font-black text-black text-xl">
                  ${payoutModalAffiliate.totalAmount.toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1">
                  PayPal Transaction / Batch ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={payoutBatchId}
                  onChange={e => setPayoutBatchId(e.target.value)}
                  className="border-2 border-black p-2.5 font-mono text-xs font-bold w-full outline-none focus:bg-yellow-50"
                  placeholder="e.g. 5TY89123849120"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1">
                  Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  className="border-2 border-black p-2.5 text-xs w-full outline-none focus:bg-yellow-50"
                  placeholder="Sent via PayPal Mass Payment"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setPayoutModalAffiliate(null)}
                disabled={isSubmittingPayout}
                className="border-2 border-black px-4 py-2 text-xs font-bold uppercase hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecutePayout}
                  disabled={isSubmittingPayout}
                  className="border-2 border-black bg-white text-black px-4 py-2 text-xs font-bold uppercase hover:bg-gray-100 transition-all cursor-pointer"
                  title="Record manual payout without triggering PayPal API"
                >
                  Manual Record
                </button>
                <button
                  type="button"
                  onClick={handleLivePayPalPayout}
                  disabled={isSubmittingPayout}
                  className="bg-[#FF5C00] text-black border-2 border-black px-6 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-black hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
                >
                  {isSubmittingPayout ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" /> Processing Transfer...
                    </>
                  ) : (
                    <>
                      <Zap size={14} /> Send Live PayPal Payout (${payoutModalAffiliate.totalAmount.toFixed(2)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AffiliateManager;
