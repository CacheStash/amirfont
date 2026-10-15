/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Share2, Users, DollarSign, Clock, CheckCircle2, 
  AlertCircle, Download, Check, ShieldCheck, RefreshCw, 
  ExternalLink, Calendar, Eye, FileText, ArrowUpRight, 
  Search, X, Filter, ChevronRight, Wallet
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
  created_at: string;
}

interface PayoutRecord {
  id: string;
  affiliate_id: string;
  affiliate_code?: string;
  paypal_email: string;
  amount: number;
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: affData }, { data: commData }] = await Promise.all([
        supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_commissions').select('*').order('created_at', { ascending: false })
      ]);
      
      const loadedAffiliates = affData || [];
      const loadedCommissions = commData || [];
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
            return {
              id: p.id,
              affiliate_id: p.affiliate_id,
              affiliate_code: aff?.affiliate_code || 'PARTNER',
              paypal_email: p.paypal_email || aff?.paypal_email || '—',
              amount: Number(p.amount || 0),
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
      const dateKey = c.paid_at ? c.paid_at.substring(0, 10) : 'settled';
      const key = `${c.affiliate_id}_${dateKey}`;
      const existing = groupMap.get(key) || {
        affiliate_id: c.affiliate_id,
        paid_at: c.paid_at || c.created_at,
        amount: 0,
        commIds: [],
        reference: c.payout_reference || 'PP-DISBURSEMENT'
      };
      existing.amount += Number(c.commission_amount || 0);
      existing.commIds.push(c.id);
      groupMap.set(key, existing);
    });

    const synthList: PayoutRecord[] = [];
    groupMap.forEach((val, k) => {
      const aff = allAffs.find(a => a.id === val.affiliate_id);
      synthList.push({
        id: k,
        affiliate_id: val.affiliate_id,
        affiliate_code: aff?.affiliate_code || 'PARTNER',
        paypal_email: aff?.paypal_email || '—',
        amount: val.amount,
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

  const safeToWithdraw = Math.max(0, totalNetStore - affiliateReservedPool);

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

  const qualifiedPayouts = affiliateDueBalances.filter(item => item.isQualified);
  const accumulatingPayouts = affiliateDueBalances.filter(item => item.dueAmount > 0 && !item.isQualified);
  const holdingOnlyPayouts = affiliateDueBalances.filter(item => item.dueAmount === 0 && item.holdingAmount > 0);

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

  // Record payout execution
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
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="border-2 border-black bg-white px-4 py-2.5 font-bold uppercase text-xs flex items-center gap-2 hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={handleExportPayPalCSV}
            className="border-2 border-black bg-black text-white px-5 py-2.5 font-bold uppercase text-xs flex items-center gap-2 hover:bg-[#FF5C00] hover:text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all cursor-pointer"
          >
            <Download size={14} /> Export Qualified CSV
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

        <div className="p-5 border-2 border-black bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-black block">
            SAFE TO WITHDRAW (PROFIT)
          </span>
          <div className="text-3xl font-black tracking-tight font-mono text-black">
            ${safeToWithdraw.toFixed(2)}
          </div>
          <p className="text-[11px] font-bold text-black/70 uppercase tracking-wide">Store net safe to sweep to bank</p>
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
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenPayoutModal(item)}
                              className="bg-black text-white border border-black py-1 px-3 text-[10px] font-black uppercase hover:bg-[#FF5C00] hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                            >
                              Record Payout
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
                          <span className="px-2 py-0.5 border border-black text-[10px] font-black uppercase bg-gray-100">
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setInspectedPartner(a)}
                            className="border border-black bg-white px-3 py-1 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none inline-flex items-center gap-1"
                          >
                            <Eye size={10} /> View Ledger
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
      )}

      {/* TAB 3: SETTLED PAYOUTS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight">Settled Payouts History ({payouts.length})</h3>
            <span className="text-xs font-mono font-bold text-gray-500">Disbursements Ledger</span>
          </div>

          {payouts.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest bg-white">
              No completed payouts recorded yet. Payouts recorded via batch execution will appear here.
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100 text-xs font-black uppercase tracking-wider">
                    <th className="p-3 border-r border-black">Settled Date</th>
                    <th className="p-3 border-r border-black">Partner Code</th>
                    <th className="p-3 border-r border-black">PayPal Account</th>
                    <th className="p-3 border-r border-black">Batch / Reference ID</th>
                    <th className="p-3 border-r border-black text-right">Amount Disbursed</th>
                    <th className="p-3 border-r border-black text-center">Orders Settled</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20 font-mono text-xs">
                  {payouts.map(p => (
                    <tr key={p.id} className="hover:bg-yellow-50">
                      <td className="p-3 border-r border-black/20">
                        {new Date(p.paid_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 border-r border-black/20 font-bold font-sans uppercase">
                        {p.affiliate_code}
                      </td>
                      <td className="p-3 border-r border-black/20 font-bold truncate max-w-[200px]">
                        {p.paypal_email}
                      </td>
                      <td className="p-3 border-r border-black/20 truncate max-w-[180px] text-gray-600">
                        {p.payout_batch_id}
                      </td>
                      <td className="p-3 border-r border-black/20 text-right font-black text-green-700 text-sm">
                        ${p.amount.toFixed(2)} {p.currency}
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
                  ))}
                </tbody>
              </table>
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

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setPayoutModalAffiliate(null)}
                disabled={isSubmittingPayout}
                className="border-2 border-black px-4 py-2 text-xs font-bold uppercase hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePayout}
                disabled={isSubmittingPayout}
                className="bg-black text-white border-2 border-black px-6 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-[#FF5C00] hover:text-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
              >
                {isSubmittingPayout ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Recording...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Confirm & Mark Paid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AffiliateManager;
