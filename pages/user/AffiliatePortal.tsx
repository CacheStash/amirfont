import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Copy, Check, ArrowRight, Clock, CheckCircle2, DollarSign, AlertCircle, Share2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const AffiliatePortal: React.FC = () => {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchAffiliateData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: affData } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setAffiliate(affData);

        if (affData) {
          const { data: commData } = await supabase
            .from('affiliate_commissions')
            .select('*')
            .eq('affiliate_id', affData.id)
            .order('created_at', { ascending: false });

          setCommissions(commData || []);
        }
      }
      setLoading(false);
    };
    fetchAffiliateData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
        LOADING_AFFILIATE_LEDGER...
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="border-2 border-black p-10 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-4">
        <Share2 size={36} className="mx-auto" />
        <h3 className="text-3xl font-black uppercase tracking-tight">BECOME A SUBQI AFFILIATE</h3>
        <p className="text-xs font-serif text-black/70 max-w-md mx-auto leading-relaxed">
          Recommend our typefaces to your clients and followers. Earn 20% net revenue on every font license purchased.
        </p>
        <Link 
          to="/affiliate" 
          className="inline-flex items-center gap-2 bg-black text-[#EDEBE6] px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
        >
          ACTIVATE PARTNER ACCOUNT <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/c/${affiliate.affiliate_code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingAmount = commissions
    .filter(c => c.status === 'pending_clearance')
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  const readyAmount = commissions
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  const totalPaidAmount = Number(affiliate.total_paid || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-black/50 block">PARTNER_IDENTIFIER</span>
          <h2 className="text-3xl font-black uppercase tracking-tight">CODE: {affiliate.affiliate_code}</h2>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-mono uppercase tracking-widest text-black/50 block">PAYPAL_DESTINATION</span>
          <span className="font-mono text-xs font-bold">{affiliate.paypal_email}</span>
        </div>
      </div>

      {/* VANITY LINK BOX */}
      <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider block">
          YOUR VANITY LINK (100% ANTI-ADBLOCKER IMMUNE)
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-black/60 gap-2">
          <span>Visitors tagged via HttpOnly server cookie for 30 days.</span>
          <Link to="/affiliate" className="underline font-bold text-black uppercase flex items-center gap-1">
            PARTNER POLICIES <ExternalLink size={10} />
          </Link>
        </div>
      </div>

      {/* 3 STAT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-black/60">
            <span>CLEARANCE_HOLD</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700">
            ${pendingAmount.toFixed(2)}
          </div>
          <p className="text-[10px] font-mono text-black/50">14-day safety hold against refund disputes</p>
        </div>

        <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-black/60">
            <span>READY_FOR_PAYOUT</span>
            <CheckCircle2 size={16} className="text-green-600" />
          </div>
          <div className="text-3xl font-black text-green-700">
            ${readyAmount.toFixed(2)}
          </div>
          <p className="text-[10px] font-mono text-black/50">Disbursed monthly (Min. $50 threshold)</p>
        </div>

        <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-black/60">
            <span>TOTAL_DISBURSED</span>
            <DollarSign size={16} className="text-black" />
          </div>
          <div className="text-3xl font-black">
            ${totalPaidAmount.toFixed(2)}
          </div>
          <p className="text-[10px] font-mono text-black/50">All-time PayPal payouts completed</p>
        </div>
      </div>

      {/* COMMISSIONS TABLE */}
      <div className="space-y-4">
        <h4 className="text-lg font-black uppercase tracking-tight">REFERRAL SALES & COMMISSION LEDGER</h4>
        
        {commissions.length === 0 ? (
          <div className="p-12 border-2 border-black text-center font-mono text-xs text-black/50 bg-white">
            NO REFERRAL TRANSACTIONS RECORDED YET. SHARE YOUR VANITY LINK TO START EARNING.
          </div>
        ) : (
          <div className="border-2 border-black overflow-x-auto bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50 font-mono text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-3 border-r border-black">DATE</th>
                  <th className="p-3 border-r border-black">FONT</th>
                  <th className="p-3 border-r border-black text-right">GROSS</th>
                  <th className="p-3 border-r border-black text-right">NET_STORE</th>
                  <th className="p-3 border-r border-black text-right">COMMISSION</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y border-black font-mono">
                {commissions.map((c) => {
                  const dateStr = new Date(c.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  });

                  return (
                    <tr key={c.id} className="hover:bg-yellow-50/50">
                      <td className="p-3 border-r border-black text-[11px]">{dateStr}</td>
                      <td className="p-3 border-r border-black font-bold uppercase">{c.font_name || 'Specimen License'}</td>
                      <td className="p-3 border-r border-black text-right">${Number(c.gross_amount || 0).toFixed(2)}</td>
                      <td className="p-3 border-r border-black text-right opacity-60">${Number(c.net_store_amount || 0).toFixed(2)}</td>
                      <td className="p-3 border-r border-black text-right font-black text-green-700">
                        +${Number(c.commission_amount || 0).toFixed(2)}
                      </td>
                      <td className="p-3">
                        {c.status === 'pending_clearance' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold uppercase">
                            <Clock size={10} /> CLEARING (14D)
                          </span>
                        )}
                        {c.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-700 font-bold uppercase">
                            <CheckCircle2 size={10} /> READY_PAYOUT
                          </span>
                        )}
                        {c.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-black font-bold uppercase">
                            <Check size={10} /> PAID_PAYPAL
                          </span>
                        )}
                        {c.status === 'voided' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-bold uppercase">
                            <AlertCircle size={10} /> VOIDED
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

export default AffiliatePortal;
