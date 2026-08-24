import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Loader2, Search, Send, Calculator, MailCheck, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PromotionsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'coupons'>('coupons');
  const [promos, setPromos] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [fonts, setFonts] = useState<any[]>([]);
  const [buyersList, setBuyersList] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [isSendingCoupon, setIsSendingCoupon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // Kalkulator Tawar-Menawar State
  const [calcOriginalPrice, setCalcOriginalPrice] = useState<string>('350');
  const [calcTargetPrice, setCalcTargetPrice] = useState<string>('270');

  // Form State Kupon
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponMaxUses, setCouponMaxUses] = useState('1');
  const [couponEndDate, setCouponEndDate] = useState('');

  // Form State Dispatch Kupon ke Buyer
  const [searchTxOrEmail, setSearchTxOrEmail] = useState('');
  const [selectedBuyerEmail, setSelectedBuyerEmail] = useState('');
  const [selectedBuyerName, setSelectedBuyerName] = useState('');
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Form State Campaign
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [promoName, setPromoName] = useState('');
  const [discount, setDiscount] = useState('');
  const [fontSearch, setFontSearch] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('specific');
  const [selectedFonts, setSelectedFonts] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchPromos();
    fetchFonts();
    fetchCoupons();
    fetchBuyersData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPromos = async () => {
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (data) setPromos(data);
    setLoading(false);
  };

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) {
      setCoupons(data);
      if (data.length > 0 && !selectedCouponId) {
        setSelectedCouponId(data[0].id);
      }
    }
  };

  const fetchFonts = async () => {
    const { data } = await supabase.from('fonts').select('id, name');
    if (data) setFonts(data);
  };

  const fetchBuyersData = async () => {
    try {
      const { data: buyers } = await supabase
        .from('fontbuyer')
        .select('id, email, full_name');

      const { data: history } = await supabase
        .from('font_history')
        .select('user_id, transaction_id, created_at')
        .order('created_at', { ascending: false });

      if (buyers && buyers.length > 0) {
        const buyerMap: Record<string, { email: string, name: string }> = {};
        buyers.forEach(b => {
          buyerMap[b.id] = {
            email: b.email || '',
            name: b.full_name || 'Customer'
          };
        });

        const combinedList: any[] = [];
        const seenTx = new Set<string>();

        (history || []).forEach(h => {
          const profile = buyerMap[h.user_id];
          if (profile && profile.email && !seenTx.has(`${profile.email}-${h.transaction_id}`)) {
            seenTx.add(`${profile.email}-${h.transaction_id}`);
            combinedList.push({
              email: profile.email,
              name: profile.name,
              transaction_id: h.transaction_id || 'N/A'
            });
          }
        });

        buyers.forEach(b => {
          if (!combinedList.some(item => item.email.toLowerCase() === b.email.toLowerCase())) {
            combinedList.push({
              email: b.email,
              name: b.full_name || 'Customer',
              transaction_id: 'REGISTERED_BUYER'
            });
          }
        });

        setBuyersList(combinedList);
      }
    } catch (e) {
      console.error("Failed to load buyers:", e);
    }
  };

  const handleEdit = (p: any) => {
    setEditingPromo(p);
    setPromoName(p.name);
    setDiscount(p.discount_percent.toString());
    setTargetType(p.type === 'global' ? 'all' : 'specific');
    setSelectedFonts(p.font_ids || []);
    setStartDate(p.start_date);
    setEndDate(p.end_date);
    setIsAdding(true);
  };

  const handleClose = () => {
    setIsAdding(false);
    setEditingPromo(null);
    setPromoName('');
    setDiscount('');
    setEndDate('');
    setSelectedFonts([]);
  };

  const handleApplyBargain = () => {
    const orig = parseFloat(calcOriginalPrice) || 0;
    const target = parseFloat(calcTargetPrice) || 0;
    if (orig <= 0 || target <= 0 || target >= orig) {
      return alert("Target price must be lower than original price!");
    }
    const percent = (((orig - target) / orig) * 100).toFixed(2);
    setCouponDiscount(percent);
    setCouponCode(`DEAL${Math.round(parseFloat(percent))}OFF`);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponDiscount || !couponEndDate) return alert("Complete coupon details!");
    
    setIsSaving(true);
    try {
      const payload = {
        code: couponCode.trim().toUpperCase(),
        discount_type: 'percentage',
        discount_value: parseFloat(couponDiscount),
        max_uses: parseInt(couponMaxUses) || 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: couponEndDate,
        is_active: true
      };

      const { error } = await supabase.from('coupons').insert([payload]);
      if (error) throw error;

      alert("Coupon created successfully!");
      setIsAddingCoupon(false);
      setCouponCode('');
      setCouponDiscount('');
      setCouponEndDate('');
      fetchCoupons();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await supabase.from('coupons').delete().eq('id', id);
    fetchCoupons();
  };

  const handleSelectBuyerSuggestion = (buyer: any) => {
    setSelectedBuyerEmail(buyer.email);
    setSelectedBuyerName(buyer.name || 'Customer');
    setSearchTxOrEmail(`${buyer.email} (${buyer.transaction_id})`);
    setShowSuggestions(false);
  };

  const handleOpenSendModal = (coupon?: any) => {
    if (coupon) {
      setSelectedCouponId(coupon.id);
    } else if (coupons.length > 0) {
      setSelectedCouponId(coupons[0].id);
    }
    setIsSendingCoupon(true);
  };

  const activeCouponData = coupons.find(c => c.id === selectedCouponId);

  const handleDispatchCouponEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyerEmail || !activeCouponData) {
      return alert("Please select a buyer and an active coupon!");
    }

    setIsDispatching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload = {
        email: selectedBuyerEmail.trim().toLowerCase(),
        name: selectedBuyerName.trim() || "Customer",
        couponCode: activeCouponData.code,
        discountText: `${activeCouponData.discount_value}% OFF`,
        validUntil: new Date(activeCouponData.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        usageLimit: `Valid for ${activeCouponData.max_uses || 1} use only`
      };

      const res = await fetch('/api/admin/send-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json() as any;
      if (!res.ok) throw new Error(resData.error || "FAILED_TO_SEND");

      alert(`COUPON EMAIL DISPATCHED TO: ${selectedBuyerEmail}`);
      setIsSendingCoupon(false);
      setSearchTxOrEmail('');
      setSelectedBuyerEmail('');
      setSelectedBuyerName('');
    } catch (err: any) {
      alert("Dispatch error: " + err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName || !discount || !endDate) return alert("Lengkapi data promo!");
    
    setIsSaving(true);
    try {
      const payload = {
        name: promoName,
        discount_percent: parseFloat(discount),
        start_date: startDate,
        end_date: endDate,
        type: targetType === 'all' ? 'global' : 'bundle',
        font_ids: targetType === 'all' ? fonts.map(f => f.id) : selectedFonts,
        is_active: true
      };

      const { error } = editingPromo 
        ? await supabase.from('promotions').update(payload).eq('id', editingPromo.id)
        : await supabase.from('promotions').insert([payload]);

      if (error) throw error;

      alert(editingPromo ? "Promotion updated!" : "Promotion launched!");
      handleClose();
      fetchPromos();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus promo ini?")) return;
    await supabase.from('promotions').delete().eq('id', id);
    fetchPromos();
  };

  const filteredBuyers = buyersList.filter(b => {
    const q = searchTxOrEmail.toLowerCase().trim();
    if (!q) return true;
    return (
      b.email.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.transaction_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 font-sans">
      {/* HEADER DAN TAB SWITCHER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-black pb-6 gap-4">
        <div>
          <h2 className="text-4xl font-normal uppercase tracking-tight">Promotions & Coupons</h2>
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setActiveTab('campaigns')}
              className={`text-xs font-black uppercase tracking-wider pb-1 border-b-2 transition-all ${
                activeTab === 'campaigns' ? 'border-black text-black' : 'border-transparent text-gray-400'
              }`}
            >
              Store Campaigns
            </button>
            <button 
              onClick={() => setActiveTab('coupons')}
              className={`text-xs font-black uppercase tracking-wider pb-1 border-b-2 transition-all ${
                activeTab === 'coupons' ? 'border-black text-black' : 'border-transparent text-gray-400'
              }`}
            >
              Buyer Coupons (Bargain)
            </button>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap gap-3">
          {activeTab === 'campaigns' ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-black text-white px-6 py-3 font-bold uppercase text-xs flex items-center gap-2 hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              <Plus size={16} /> Create Promo
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleOpenSendModal()}
                disabled={coupons.length === 0}
                className="bg-[#FF5C00] text-black px-6 py-3 font-black uppercase text-xs flex items-center gap-2 border border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none disabled:opacity-40"
              >
                <Send size={15} /> Send Coupon to Buyer
              </button>
              <button 
                onClick={() => setIsAddingCoupon(true)}
                className="bg-black text-white px-6 py-3 font-bold uppercase text-xs flex items-center gap-2 hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
              >
                <Plus size={16} /> Generate Coupon
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: PROMO LIST (STORE CAMPAIGNS) */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 p-20 text-center font-bold text-xs uppercase animate-pulse tracking-widest text-gray-400">Loading campaigns...</div>
          ) : promos.length === 0 ? (
            <div className="col-span-2 p-20 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">No active promotions.</div>
          ) : (
            promos.map(p => (
              <div key={p.id} className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-yellow-300 px-2 py-1 text-[10px] font-bold uppercase border border-black">
                    {p.discount_percent}% OFF
                  </span>
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    Ends: {p.end_date}
                  </span>
                </div>
                <h3 className="text-xl font-bold uppercase mb-1">{p.name}</h3>
                <p className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-wide">
                  {p.type === 'global' ? 'Store-wide Sale' : `${p.font_ids?.length} Fonts Selected`}
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleEdit(p)} 
                    className="text-xs font-bold border-b-2 border-black uppercase"
                  >
                    Edit Campaign
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 font-bold uppercase text-xs border-b-2 border-red-500">
                    End Campaign
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: COUPONS LIST (BARGAIN DEALS) */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.length === 0 ? (
            <div className="col-span-2 p-20 border-2 border-dashed border-gray-300 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
              No coupons generated yet.
            </div>
          ) : (
            coupons.map(c => (
              <div key={c.id} className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-orange-500 text-white px-2 py-1 text-xs font-black uppercase border border-black tracking-widest">
                      {c.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                      Ends: {c.end_date}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black uppercase mb-1">{c.discount_value}% OFF</h3>
                  <p className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-wide">
                    Usage: {c.used_count} / {c.max_uses || '∞'} Redemptions
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-black/10">
                  <button 
                    onClick={() => handleOpenSendModal(c)}
                    className="text-xs font-black uppercase text-black hover:text-orange-600 flex items-center gap-1.5 transition-colors"
                  >
                    <Send size={13} /> Send to Buyer
                  </button>
                  <button onClick={() => handleDeleteCoupon(c.id)} className="text-red-500 font-bold uppercase text-xs border-b-2 border-red-500">
                    Revoke
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: GENERATOR KUPON & KALKULATOR TAWARAN (PORTAL) */}
      {isAddingCoupon && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-black p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
              <h3 className="text-2xl font-black uppercase">Bargain Coupon Generator</h3>
              <button onClick={() => setIsAddingCoupon(false)} className="p-1 hover:bg-black hover:text-white transition-colors"><X size={20} /></button>
            </div>

            {/* KALKULATOR SECTION */}
            <div className="p-4 bg-[#EDEBE6] border border-black border-dashed mb-6 space-y-3">
              <span className="text-[10px] font-black tracking-widest uppercase block text-gray-600 flex items-center gap-1.5">
                <Calculator size={14} /> BARGAIN CALCULATOR (Auto Percentage)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase block text-gray-500">Original Price ($)</label>
                  <input 
                    type="number" 
                    value={calcOriginalPrice} 
                    onChange={e => setCalcOriginalPrice(e.target.value)} 
                    className="w-full border border-black p-2 font-mono font-bold text-xs bg-white" 
                    placeholder="350"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase block text-gray-500">Deal Price ($)</label>
                  <input 
                    type="number" 
                    value={calcTargetPrice} 
                    onChange={e => setCalcTargetPrice(e.target.value)} 
                    className="w-full border border-black p-2 font-mono font-bold text-xs bg-white" 
                    placeholder="270"
                  />
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleApplyBargain}
                className="w-full py-2 bg-black text-white text-[10px] font-black uppercase hover:bg-gray-800 transition-all"
              >
                Calculate & Apply Percentage
              </button>
            </div>

            {/* FORM KUPON */}
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Coupon Code</label>
                  <input 
                    type="text" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                    className="w-full border border-black p-2 font-mono font-bold uppercase text-sm outline-none focus:bg-yellow-50" 
                    placeholder="SAVE23" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Discount (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={couponDiscount} 
                    onChange={e => setCouponDiscount(e.target.value)} 
                    className="w-full border border-black p-2 font-bold text-sm outline-none" 
                    placeholder="22.86" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Max Usage (Limit)</label>
                  <input 
                    type="number" 
                    value={couponMaxUses} 
                    onChange={e => setCouponMaxUses(e.target.value)} 
                    className="w-full border border-black p-2 font-bold text-sm outline-none" 
                    placeholder="1" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Expiry Date</label>
                  <input 
                    type="date" 
                    value={couponEndDate} 
                    onChange={e => setCouponEndDate(e.target.value)} 
                    className="w-full border border-black p-2 font-bold uppercase text-xs outline-none focus:bg-yellow-50" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-black text-white p-4 font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex justify-center items-center gap-2 mt-4"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Save & Activate Coupon"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: DISPATCH COUPON TO BUYER (PORTAL - SUBQI STYLE) */}
      {isSendingCoupon && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-black max-w-2xl w-full p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto font-mono text-black">
            <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00] block mb-1">Direct Outreach</span>
                <h3 className="text-3xl font-black uppercase flex items-center gap-2">
                  <MailCheck size={28} /> Send Coupon Gift
                </h3>
              </div>
              <button onClick={() => setIsSendingCoupon(false)} className="p-1 hover:bg-black hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleDispatchCouponEmail} className="space-y-6">
              {/* Search Buyer / Order ID */}
              <div ref={searchContainerRef} className="space-y-2 relative">
                <label className="block text-[10px] font-black uppercase tracking-wider text-black">
                  Search Order ID or Buyer Email
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchTxOrEmail}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setSearchTxOrEmail(e.target.value);
                      setSelectedBuyerEmail(e.target.value);
                      setShowSuggestions(true);
                    }}
                    placeholder="Type SQ-123456 or buyer@domain.com..."
                    className="w-full border-2 border-black p-3 text-xs font-bold outline-none uppercase placeholder:normal-case placeholder:text-black/30 pr-8"
                    required
                  />
                  <Search className="absolute right-3 top-3.5 opacity-40 pointer-events-none" size={16} />
                </div>

                {/* Autocomplete Dropdown List */}
                {showSuggestions && filteredBuyers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto divide-y divide-black/10">
                    {filteredBuyers.slice(0, 8).map((b, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleSelectBuyerSuggestion(b)}
                        className="p-3 text-xs hover:bg-[#FFE500] cursor-pointer flex justify-between items-center transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-black">{b.email}</span>
                          <span className="text-[10px] opacity-60 italic">{b.name}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5">
                          {b.transaction_id}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recipient Full Name */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-black">Buyer Name</label>
                  {selectedBuyerName && (
                    <span className="text-[9px] text-green-700 font-bold flex items-center gap-1">
                      <UserCheck size={12} /> Synced with Buyer Record
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={selectedBuyerName} 
                  onChange={e => setSelectedBuyerName(e.target.value.replace(/\b\w/g, l => l.toUpperCase()))} 
                  className="w-full border-2 border-black p-3 font-bold text-xs outline-none" 
                  placeholder="Customer / Full Name" 
                />
              </div>

              {/* Coupon Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-black">
                  Select Active Coupon to Send
                </label>
                <select 
                  value={selectedCouponId}
                  onChange={e => setSelectedCouponId(e.target.value)}
                  className="w-full border-2 border-black p-3 font-bold text-xs uppercase outline-none cursor-pointer bg-white"
                  required
                >
                  {coupons.map(c => (
                    <option key={c.id} value={c.id} className="font-mono font-bold">
                      {c.code} — {c.discount_value}% OFF (Expires: {new Date(c.end_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Preview Box */}
              {activeCouponData && (
                <div className="p-4 border-2 border-dashed border-black bg-[#EDEBE6] space-y-2 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00] block mb-2">Live Template Data:</span>
                  <div className="flex justify-between border-b border-black/10 pb-1">
                    <span className="opacity-50">Recipient:</span>
                    <span className="font-bold">{selectedBuyerEmail || "Pending Selection..."}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/10 pb-1">
                    <span className="opacity-50">Greeting:</span>
                    <span className="font-bold">Hello {selectedBuyerName || "Customer"},</span>
                  </div>
                  <div className="flex justify-between border-b border-black/10 pb-1">
                    <span className="opacity-50">Coupon Code:</span>
                    <span className="font-black bg-black text-white px-2 py-0.5">{activeCouponData.code}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/10 pb-1">
                    <span className="opacity-50">Discount:</span>
                    <span className="font-bold">{activeCouponData.discount_value}% OFF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Valid Until:</span>
                    <span className="font-bold">{new Date(activeCouponData.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isDispatching || !selectedBuyerEmail}
                className="w-full bg-black text-white py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-[#FF5C00] hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none disabled:opacity-40 flex justify-center items-center gap-2"
              >
                {isDispatching ? <Loader2 className="animate-spin" size={16} /> : "Dispatch Email via GAS"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL FORM CAMPAIGN */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-black p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold uppercase">Configure Promo</h3>
              <button onClick={handleClose}><X size={20} /></button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Campaign Name</label>
                <input type="text" value={promoName} onChange={e => setPromoName(e.target.value)} className="w-full border border-black p-2 font-bold uppercase text-sm outline-none focus:bg-yellow-50" placeholder="E.G. RAMADAN SALE" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Discount (%)</label>
                  <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full border border-black p-2 font-bold text-sm outline-none" placeholder="30" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-black p-2 font-bold uppercase text-xs outline-none focus:bg-yellow-50" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Target Fonts</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                    <input type="radio" checked={targetType === 'all'} onChange={() => setTargetType('all')} /> ALL FONTS
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                    <input type="radio" checked={targetType === 'specific'} onChange={() => setTargetType('specific')} /> SELECT FONTS
                  </label>
                </div>

                {targetType === 'specific' && (
                  <div className="max-h-32 overflow-y-auto border border-black p-2 space-y-1 bg-gray-50">
                    <div className="sticky top-0 bg-gray-50 pb-2 mb-2 border-b border-black/10 z-10">
                      <input 
                        type="text"
                        placeholder="Search font..."
                        className="w-full p-2 text-[10px] font-bold uppercase border border-black outline-none focus:bg-yellow-50"
                        value={fontSearch}
                        onChange={(e) => setFontSearch(e.target.value)}
                      />
                    </div>
                    {fonts
                      .filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase()))
                      .map(f => (
                      <label key={f.id} className="flex items-center gap-2 text-[10px] font-bold uppercase cursor-pointer hover:bg-white p-1">
                        <input 
                          type="checkbox" 
                          checked={selectedFonts.includes(f.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedFonts([...selectedFonts, f.id]);
                            else setSelectedFonts(selectedFonts.filter(id => id !== f.id));
                          }}
                        /> {f.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-black text-white p-4 font-bold uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex justify-center items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Launch Campaign"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsManager;