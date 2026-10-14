/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Share2, Users, DollarSign, Clock, CheckCircle2, 
  AlertCircle, Download, Check, ShieldCheck, RefreshCw, ExternalLink 
} from 'lucide-react';

const AffiliateManager: React.FC = () => {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingPayout, setProcessingPayout] = useState(false);

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
      setAffiliates(affData || []);
      setCommissions(commData || []);
    } catch (err) {
      console.error("Failed to load affiliate data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Financial Metrics Calculation
  const totalGrossSales = commissions.reduce((sum, c) => sum + Number(c.gross_amount || 0), 0);
  const totalPayPalFees = commissions.reduce((sum, c) => sum + Number(c.paypal_inbound_fee || 0), 0);
  const totalNetStore = commissions.reduce((sum, c) => sum + Number(c.net_store_amount || 0), 0);
  
  const affiliateReservedPool = commissions
    .filter(c => c.status === 'pending_clearance' || c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  const safeToWithdraw = Math.max(0, totalNetStore - affiliateReservedPool);
  const clearedPayouts = commissions.filter(c => c.status === 'approved');

  // Filter commissions
  const filteredCommissions = commissions.filter(c => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const handleExportPayoutCSV = () => {
    if (clearedPayouts.length === 0) {
      alert("No cleared payouts available to export at this moment.");
      return;
    }

    const payoutMap = new Map<string, { email: string; amount: number; ids: string[] }>();
    
    clearedPayouts.forEach(c => {
      const aff = affiliates.find(a => a.id === c.affiliate_id);
      const email = aff?.paypal_email || c.buyer_email || 'unknown';
      const existing = payoutMap.get(email) || { email, amount: 0, ids: [] };
      existing.amount += Number(c.commission_amount || 0);
      existing.ids.push(c.id);
      payoutMap.set(email, existing);
    });

    let csvContent = "data:text/csv;charset=utf-8,Email,Amount,Currency,Note\n";
    payoutMap.forEach((entry) => {
      const payoutAmount = Math.max(0, entry.amount - 1.00).toFixed(2);
      csvContent += `${entry.email},${payoutAmount},USD,Subqi Partner Commission Payout\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Subqi_PayPal_Payouts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkCommissionsAsPaid = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Mark ${ids.length} commission(s) as officially PAID via PayPal?`)) return;

    setProcessingPayout(true);
    try {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;
      await fetchData();
      alert("Commissions status updated to PAID.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessingPayout(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF5C00] block">
            Stealth Partner Command
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight">Affiliates & Financial Ledger</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-gray-50 flex items-center gap-2 transition-all"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> REFRESH
          </button>
          <button 
            onClick={handleExportPayoutCSV}
            className="px-5 py-2 text-xs font-black uppercase tracking-wider bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-[#FF5C00] flex items-center gap-2 transition-all"
          >
            <Download size={14} /> EXPORT PAYPAL CSV
          </button>
        </div>
      </div>

      {/* 4 FINANCIAL RECONCILIATION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 block">Gross Sales Inbound</span>
          <div className="text-3xl font-black tracking-tight text-black">
            ${totalGrossSales.toFixed(2)}
          </div>
          <p className="text-[10px] text-gray-400 font-mono">Total paid by buyers via PayPal</p>
        </div>

        <div className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 block">PayPal Inbound Fees</span>
          <div className="text-3xl font-black tracking-tight text-red-600">
            -${totalPayPalFees.toFixed(2)}
          </div>
          <p className="text-[10px] text-gray-400 font-mono">Payment gateway transaction cost</p>
        </div>

        <div className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 block">Affiliate Reserved Pool</span>
          <div className="text-3xl font-black tracking-tight text-[#FF5C00]">
            ${affiliateReservedPool.toFixed(2)}
          </div>
          <p className="text-[10px] text-gray-400 font-mono">Pending + cleared partner earnings</p>
        </div>

        <div className="p-5 border-2 border-black bg-[#E2F7D8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-800 block">
            SAFE TO WITHDRAW (NET PROFIT)
          </span>
          <div className="text-3xl font-black tracking-tight text-emerald-900">
            ${safeToWithdraw.toFixed(2)}
          </div>
          <p className="text-[10px] text-emerald-800/80 font-mono">Safe to sweep to personal bank</p>
        </div>
      </div>

      {/* AFFILIATE PARTNERS DIRECTORY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black uppercase tracking-tight">Registered Partners ({affiliates.length})</h3>
          <span className="text-[10px] font-mono font-bold text-gray-400">Clean Vanity Path Active</span>
        </div>

        {affiliates.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-black/20 text-center font-mono text-xs text-gray-400 bg-white">
            No affiliates registered yet. Activate a partner code from the /affiliate landing page to test.
          </div>
        ) : (
          <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-gray-100 text-[10px] font-black uppercase tracking-wider">
                  <th className="p-3 border-r-2 border-black">Partner Code</th>
                  <th className="p-3 border-r-2 border-black">Vanity Path</th>
                  <th className="p-3 border-r-2 border-black">PayPal Payout Email</th>
                  <th className="p-3 border-r-2 border-black text-right">Commission Rate</th>
                  <th className="p-3 border-r-2 border-black text-center">Status</th>
                  <th className="p-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y border-black font-mono text-[11px]">
                {affiliates.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-3 border-r-2 border-black font-black text-[#FF5C00]">
                      {a.affiliate_code}
                    </td>
                    <td className="p-3 border-r-2 border-black font-bold">
                      <a 
                        href={`/c/${a.affiliate_code}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:underline flex items-center gap-1 text-black"
                      >
                        /c/{a.affiliate_code} <ExternalLink size={10} className="opacity-50" />
                      </a>
                    </td>
                    <td className="p-3 border-r-2 border-black font-bold truncate">
                      {a.paypal_email}
                    </td>
                    <td className="p-3 border-r-2 border-black text-right font-bold">
                      {(Number(a.commission_rate || 0.20) * 100).toFixed(0)}% Net
                    </td>
                    <td className="p-3 border-r-2 border-black text-center">
                      <span className="px-2 py-0.5 border border-black text-[9px] uppercase font-black bg-black text-white">
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMMISSIONS & PAYOUTS LEDGER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xl font-black uppercase tracking-tight">Attribution & Clearance Ledger ({commissions.length})</h3>
          
          <div className="flex items-center gap-2">
            {['all', 'pending_clearance', 'approved', 'paid'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black transition-all ${
                  statusFilter === f 
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-white text-gray-500 hover:text-black'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredCommissions.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-black/20 text-center font-mono text-xs text-gray-400 bg-white">
            No commissions matching the selected filter.
          </div>
        ) : (
          <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-gray-100 text-[10px] font-black uppercase tracking-wider">
                  <th className="p-3 border-r-2 border-black">Order ID</th>
                  <th className="p-3 border-r-2 border-black">Font</th>
                  <th className="p-3 border-r-2 border-black text-right">Gross Paid</th>
                  <th className="p-3 border-r-2 border-black text-right">PayPal Fee</th>
                  <th className="p-3 border-r-2 border-black text-right">Net Store</th>
                  <th className="p-3 border-r-2 border-black text-right">Commission</th>
                  <th className="p-3 border-r-2 border-black">Clearance Date</th>
                  <th className="p-3 border-r-2 border-black text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-black font-mono text-[11px]">
                {filteredCommissions.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-3 border-r-2 border-black font-bold truncate max-w-[120px]">
                        {c.order_id}
                      </td>
                      <td className="p-3 border-r-2 border-black font-sans font-black">
                        {c.font_name || 'Font License'}
                      </td>
                      <td className="p-3 border-r-2 border-black text-right font-bold">
                        ${Number(c.gross_amount || 0).toFixed(2)}
                      </td>
                      <td className="p-3 border-r-2 border-black text-right text-red-600 font-bold">
                        -${Number(c.paypal_inbound_fee || 0).toFixed(2)}
                      </td>
                      <td className="p-3 border-r-2 border-black text-right font-bold">
                        ${Number(c.net_store_amount || 0).toFixed(2)}
                      </td>
                      <td className="p-3 border-r-2 border-black text-right font-black text-emerald-600">
                        +${Number(c.commission_amount || 0).toFixed(2)}
                      </td>
                      <td className="p-3 border-r-2 border-black text-[10px] text-gray-500">
                        {new Date(c.cleared_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 border-r-2 border-black text-center">
                        <span className={`px-2 py-0.5 text-[9px] uppercase font-black border border-black ${
                          c.status === 'paid' ? 'bg-emerald-400 text-black' :
                          c.status === 'approved' ? 'bg-blue-300 text-black' :
                          c.status === 'pending_clearance' ? 'bg-amber-300 text-black' :
                          'bg-red-300 text-black'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {c.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkCommissionsAsPaid([c.id])}
                            disabled={processingPayout}
                            className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-black text-white hover:bg-[#FF5C00] transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        {c.status === 'paid' && (
                          <span className="text-[10px] text-emerald-600 font-black uppercase inline-flex items-center gap-1">
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

    </div>
  );
};

export default AffiliateManager;
