/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Copy, Check, ArrowRight, Clock, CheckCircle2, DollarSign, 
  AlertCircle, Share2, ExternalLink, Settings, Save, RefreshCw, Mail, Hash 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AffiliatePortal: React.FC = () => {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  // Account Settings Form State
  const [editPaypalEmail, setEditPaypalEmail] = useState('');
  const [editVanityCode, setEditVanityCode] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    fetchAffiliateData();
  }, []);

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
        setEditPaypalEmail(affData.paypal_email || '');
        setEditVanityCode(affData.affiliate_code || '');

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

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');
    setSettingsError('');

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

    setSavingSettings(true);
    try {
      // Check if another affiliate already uses this code
      if (cleanCode !== affiliate.affiliate_code) {
        const { data: codeCheck } = await supabase
          .from('affiliates')
          .select('id, user_id')
          .ilike('affiliate_code', cleanCode)
          .maybeSingle();

        if (codeCheck && codeCheck.id !== affiliate.id) {
          throw new Error(`The vanity code "${cleanCode}" is already taken by another creator. Please select another.`);
        }
      }

      const { data: updated, error } = await supabase
        .from('affiliates')
        .update({
          paypal_email: cleanEmail,
          affiliate_code: cleanCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliate.id)
        .select()
        .single();

      if (error) throw error;

      setAffiliate(updated);
      setEditPaypalEmail(updated.paypal_email);
      setEditVanityCode(updated.affiliate_code);
      setSettingsSuccess('Affiliate account & payout settings saved successfully!');
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to update account settings.');
    } finally {
      setSavingSettings(false);
    }
  };

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
          className="inline-flex items-center gap-2 bg-black text-[#EDEBE6] px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#FF5C00] hover:text-black transition-colors"
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
      
      {/* HEADER SECTION WITH SUB-NAV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF5C00] font-black block">
            AFFILIATE GUILD PARTNER
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight">
            CODE: {affiliate.affiliate_code}
          </h2>
        </div>

        {/* SUB TAB CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-black transition-all ${
              activeTab === 'overview'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Overview & Sales
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-black transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Settings size={14} /> Account Settings
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SALES LEDGER */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* VANITY LINK BOX */}
          <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider block">
                YOUR PERSONAL VANITY SHARE LINK (30-DAY ATTRIBUTION)
              </label>
              <button 
                onClick={() => setActiveTab('settings')}
                className="text-[10px] font-mono font-bold uppercase underline hover:text-[#FF5C00] flex items-center gap-1"
              >
                <Settings size={12} /> Edit Code / Payout
              </button>
            </div>
            
            <div className="flex items-center border-2 border-black bg-gray-50 p-2">
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                className="w-full bg-transparent font-mono text-xs font-bold uppercase outline-none"
              />
              <button 
                onClick={handleCopyLink}
                className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0 hover:bg-[#FF5C00] hover:text-black transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-black/60 gap-2">
              <span>Visitors tagged via HttpOnly server cookie for 30 full days.</span>
              <span className="font-bold text-black">
                Payout Destination: <span className="text-[#FF5C00]">{affiliate.paypal_email}</span>
              </span>
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
              <p className="text-[10px] font-mono text-black/50">14-day warranty hold against refund disputes</p>
            </div>

            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-black/60">
                <span>READY_FOR_PAYOUT</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-700">
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
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black uppercase tracking-tight">REFERRAL SALES & COMMISSION LEDGER</h4>
              <span className="text-xs font-mono text-black/50 font-bold">{commissions.length} ATTRIBUTED ORDERS</span>
            </div>
            
            {commissions.length === 0 ? (
              <div className="p-12 border-2 border-black text-center font-mono text-xs text-black/50 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                NO REFERRAL TRANSACTIONS RECORDED YET. SHARE YOUR VANITY LINK TO START EARNING.
              </div>
            ) : (
              <div className="border-2 border-black overflow-x-auto bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-50 font-mono text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-3 border-r-2 border-black">DATE</th>
                      <th className="p-3 border-r-2 border-black">FONT</th>
                      <th className="p-3 border-r-2 border-black text-right">GROSS</th>
                      <th className="p-3 border-r-2 border-black text-right">NET_STORE</th>
                      <th className="p-3 border-r-2 border-black text-right">COMMISSION</th>
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
                          <td className="p-3 border-r-2 border-black text-[11px]">{dateStr}</td>
                          <td className="p-3 border-r-2 border-black font-bold uppercase">{c.font_name || 'Specimen License'}</td>
                          <td className="p-3 border-r-2 border-black text-right">${Number(c.gross_amount || 0).toFixed(2)}</td>
                          <td className="p-3 border-r-2 border-black text-right opacity-60">${Number(c.net_store_amount || 0).toFixed(2)}</td>
                          <td className="p-3 border-r-2 border-black text-right font-black text-emerald-700">
                            +${Number(c.commission_amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            {c.status === 'pending_clearance' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold uppercase">
                                <Clock size={10} /> CLEARING (14D)
                              </span>
                            )}
                            {c.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold uppercase">
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
      )}

      {/* TAB 2: ACCOUNT & PAYOUT SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-2 border-black p-8 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            
            <div className="border-b-2 border-black pb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF5C00] font-black block">
                CONFIGURATION
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight">
                AFFILIATE ACCOUNT & PAYOUT PREFERENCES
              </h3>
              <p className="text-xs text-black/60 font-mono mt-1">
                Keep your payout email and custom vanity route up to date.
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-4 border-2 border-black bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2">
                <Check size={16} /> {settingsSuccess}
              </div>
            )}
            {settingsError && (
              <div className="p-4 border-2 border-black bg-red-100 text-red-900 font-bold text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {settingsError}
              </div>
            )}

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              
              {/* PayPal Email Field */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider block flex items-center gap-1.5">
                  <Mail size={14} className="text-[#FF5C00]" /> PAYPAL PAYOUT EMAIL ADDRESS
                </label>
                <input 
                  type="email"
                  required
                  value={editPaypalEmail}
                  onChange={(e) => setEditPaypalEmail(e.target.value)}
                  placeholder="payouts@yourdomain.com"
                  className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-gray-50 focus:bg-white outline-none"
                />
                <span className="text-[11px] font-mono text-black/50 block">
                  All monthly cleared commission earnings will be disbursed directly to this PayPal address.
                </span>
              </div>

              {/* Vanity Code Field */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider block flex items-center gap-1.5">
                  <Hash size={14} className="text-[#FF5C00]" /> CUSTOM VANITY CODE
                </label>
                <div className="flex items-center border-2 border-black bg-white">
                  <span className="px-4 py-3 bg-gray-100 border-r-2 border-black text-xs font-mono font-bold text-black/60 select-none">
                    subqi.com/c/
                  </span>
                  <input 
                    type="text"
                    required
                    value={editVanityCode}
                    onChange={(e) => setEditVanityCode(e.target.value.toUpperCase())}
                    placeholder="STUDIO_NAME"
                    className="grow px-4 py-3 font-mono text-sm font-bold uppercase bg-transparent outline-none"
                  />
                </div>
                <span className="text-[11px] font-mono text-black/50 block">
                  Alphanumeric only (3–20 chars). Updating your code updates your referral URL immediately.
                </span>
              </div>

              {/* Fixed Details Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-2 border-dashed border-black/30 bg-gray-50 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Commission Rate:</span>
                  <span className="font-black text-sm text-black">
                    {(Number(affiliate.commission_rate || 0.20) * 100).toFixed(0)}% Net Received Sales
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Minimum Payout Threshold:</span>
                  <span className="font-black text-sm text-black">$50.00 USD</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Holding Period:</span>
                  <span className="font-black text-black">14-Day Customer Dispute Warranty</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Account Status:</span>
                  <span className="font-black text-emerald-700 uppercase">{affiliate.status || 'ACTIVE'}</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-all px-8 py-3.5 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
                >
                  <Save size={16} />
                  <span>{savingSettings ? 'SAVING CHANGES...' : 'SAVE SETTINGS'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditPaypalEmail(affiliate.paypal_email || '');
                    setEditVanityCode(affiliate.affiliate_code || '');
                    setSettingsError('');
                    setSettingsSuccess('');
                  }}
                  className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider border-2 border-black bg-white hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AffiliatePortal;
