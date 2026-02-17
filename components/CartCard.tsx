import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Info, ArrowRight, Check, X, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

interface TierPrices {
  solo: number;
  team: number;
  studio: number;
  enterprise: number;
}

interface WebTierPrices {
  small_50k: number;
  medium_500k: number;
  large_5m: number;
  enterprise_unlimited: number;
}

interface LicensePrices {
  desktop: TierPrices;
  logo_branding: TierPrices;
  app: TierPrices;
  broadcast: TierPrices;
  server: TierPrices;
  social_web: WebTierPrices;
  corporate_full_suite: number;
}

interface CartCardProps {
  fontId: string; // FIXED: Tambahkan ID ke props interface
  fontName: string;
  prices: LicensePrices;
  discount?: number;
}

import { useNavigate } from 'react-router-dom'; // FIXED: Wajib tambah ini

const CartCard: React.FC<CartCardProps> = ({ fontId, fontName, prices, discount = 0 }) => {
  const { addToCart, closeConfigurator } = useCart();
  const navigate = useNavigate(); // FIXED: Inisialisasi navigasi
  const [selectedTier, setSelectedTier] = useState<'solo' | 'team' | 'studio' | 'enterprise'>('solo');
  const [selectedUsages, setSelectedUsages] = useState<string[]>(['desktop']);

  // DEFINISI LISENSI TINGGI: Pilihan ini otomatis sudah include hak Desktop
  const higherTierUsages = ['logo_branding', 'app', 'broadcast', 'server'];
  const hasHigherTier = useMemo(() => selectedUsages.some(u => higherTierUsages.includes(u)), [selectedUsages]);
  const [webTier, setWebTier] = useState<'small' | 'medium' | 'large' | 'enterprise'>('small');
  const [isCorporate, setIsCorporate] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // AUTO-SWITCH LOGIC: Jika Enterprise + 6 Usages dipilih, otomatis pindah ke Corporate
  useEffect(() => {
    if (!isCorporate && selectedTier === 'enterprise' && selectedUsages.length === 6) {
      handleCorporateToggle();
    }
  }, [selectedTier, selectedUsages]);

  const seatDetails = {
    solo: '1 SEAT',
    team: 'UP TO 25 SEATS',
    studio: 'UP TO 100 SEATS',
    enterprise: 'UNLIMITED SEATS'
  };

  const webTierDetails = {
    small: 'UP TO 50K VIEWS',
    medium: 'UP TO 500K VIEWS',
    large: 'UP TO 5M VIEWS',
    enterprise: 'UNLIMITED VIEWS'
  };

  const totalPrice = useMemo(() => {
    if (!prices) return 0;
    if (isTrial) return 0;
    
    let baseTotal = 0;
    if (isCorporate) {
      baseTotal = prices.corporate_full_suite || 0;
    } else {
      selectedUsages.forEach(usage => {
        if (usage === 'social_web') {
          const webKey = webTier === 'small' ? 'small_50k' : 
                         webTier === 'medium' ? 'medium_500k' : 
                         webTier === 'large' ? 'large_5m' : 'enterprise_unlimited';
          baseTotal += prices.social_web?.[webKey as keyof WebTierPrices] || 0;
        } else {
          const categoryData = prices[usage as keyof Omit<LicensePrices, 'corporate_full_suite' | 'social_web'>];
          if (categoryData) baseTotal += categoryData[selectedTier] || 0;
        }
      });
    }

  // APLIKASI DISKON: Gunakan Math.round agar sinkron dengan .toFixed(0) di Homepage
    const discountedPrice = discount > 0 ? Math.round(baseTotal * (1 - discount / 100)) : baseTotal;
    return discountedPrice;
  }, [selectedTier, selectedUsages, webTier, isCorporate, isTrial, prices, discount]);

  const handleAdd = (redirect: boolean = false) => {
    // LOGIKA METADATA: Jika lisensi tinggi dipilih, pastikan 'desktop' masuk ke metadata
    const finalUsages = [...selectedUsages];
    if (hasHigherTier && !finalUsages.includes('desktop')) {
      finalUsages.push('desktop');
    }

    addToCart({
      cartId: crypto.randomUUID(),
      id: fontId, 
      fontId: fontName, 
      name: fontName,
      price: totalPrice,
      tier: isTrial ? 'TRY IT FIRST / DEMO' : (isCorporate ? 'CORPORATE FULL SUITE' : `${selectedTier.toUpperCase()} TIER`),
      usages: isTrial ? ['PERSONAL USE'] : (isCorporate ? ['ALL-IN-ONE'] : finalUsages),
      webTierLabel: selectedUsages.includes('social_web') && !isCorporate && !isTrial ? webTier : undefined
    });

    if (redirect) {
      navigate('/checkout'); // FIXED: Langsung ke halaman checkout
      closeConfigurator();
    } else {
      setIsAdded(true);
    }
  };

  const toggleUsage = (id: string) => {
    if (isCorporate || isTrial) return;
    setSelectedUsages(prev => {
      const isSelected = prev.includes(id);
      let next = isSelected ? prev.filter(u => u !== id) : [...prev, id];
      
      // LOGIKA AUTO-DESELECT: Jika pilih Logo/App/dsb, otomatis lepas Desktop manual
      if (!isSelected && higherTierUsages.includes(id)) {
        next = next.filter(u => u !== 'desktop');
      }
      return next;
    });
  };

  const handleCorporateToggle = () => {
    setIsCorporate(!isCorporate);
    setIsTrial(false);
    if (!isCorporate) setSelectedUsages(['desktop', 'logo_branding', 'social_web', 'app', 'broadcast', 'server']);
    else setSelectedUsages(['desktop']);
  };

  const handleTrialToggle = () => {
    setIsTrial(!isTrial);
    setIsCorporate(false);
    if (!isTrial) {
      setSelectedTier('solo');
      setSelectedUsages([]);
    } else {
      setSelectedUsages(['desktop']);
    }
  };

  const TicketEdges = () => (
    <div className="flex justify-between w-full px-2 -mx-2 overflow-hidden pointer-events-none select-none">
      {[...Array(25)].map((_, i) => (
        <div key={i} className="w-4 h-4 bg-[#EDEBE6] rounded-full -mt-2" />
      ))}
    </div>
  );

  return (
    <div className="w-[95vw] max-w-[850px] bg-white border-x border-black relative font-sans text-black overflow-hidden uppercase shadow-2xl">
      <div className="absolute top-0 left-0 w-full z-20"><TicketEdges /></div>
      
      <button onClick={closeConfigurator} className="absolute top-6 right-6 z-30 p-1 hover:bg-black hover:text-white transition-colors border border-black">
        <X size={20} />
      </button>

      <div className="p-6 md:p-12 pt-14 pb-14">
        <div className="border-b border-black pb-8 mb-10 text-left">
          <span className="text-[10px] tracking-[0.3em] font-bold text-gray-400 block mb-2">LICENSE CONFIGURATOR</span>
          <h2 className="text-5xl md:text-7xl font-normal tracking-tighter leading-[0.8]">{fontName}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* 01. SEATS LEVELS */}
          <div className={`md:col-span-5 border-r-0 md:border-r border-black md:pr-10 transition-opacity duration-300 ${isCorporate || isTrial ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            <label className="text-[10px] font-bold tracking-[0.2em] mb-6 block text-black/40">01. SEATS LEVELS</label>
            <div className="flex flex-col gap-2">
              {Object.entries(seatDetails).map(([tier, seats]) => (
                <button key={tier} onClick={() => setSelectedTier(tier as any)}
                  className={`py-4 px-5 border border-black text-[11px] font-black tracking-widest text-left transition-all flex justify-between items-center group ${selectedTier === tier ? 'bg-black text-white' : 'hover:bg-black/5'}`}>
                  <span>{tier.toUpperCase()}</span>
                  <span className={`text-[9px] ${selectedTier === tier ? 'text-white/60' : 'text-black/40'}`}>{seats}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 02. USAGE TERMS */}
          <div className="md:col-span-7">
            <label className="text-[10px] font-bold tracking-[0.2em] mb-6 block text-black/40">02. USAGE TERMS (CAN SELECT MULTIPLE)</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { id: 'desktop', label: 'DESKTOP' },
                { id: 'logo_branding', label: 'LOGO' },
                { id: 'social_web', label: 'SOCIAL/WEB' },
                { id: 'app', label: 'APP/SAAS' },
                { id: 'broadcast', label: 'BROADCAST' },
                { id: 'server', label: 'SERVER' },
              ].map((u) => (
                <button key={u.id} onClick={() => toggleUsage(u.id)} 
                  disabled={isCorporate || isTrial || (u.id === 'desktop' && hasHigherTier)} // FIXED: Disable desktop jika ada lisensi tinggi
                  className={`flex items-center justify-between p-4 border border-black transition-all ${
                    (isCorporate || isTrial || (u.id === 'desktop' && hasHigherTier)) ? 'opacity-20 cursor-not-allowed' : 
                    selectedUsages.includes(u.id) ? 'bg-black text-white' : 'bg-transparent hover:bg-black/5'
                  }`}>
                  <span className="text-[10px] font-black tracking-widest">{u.label}</span>
                  <Plus size={14} className={`transition-transform duration-300 ${selectedUsages.includes(u.id) ? 'rotate-45' : ''}`} />
                </button>
              ))}
              
              {/* CORPORATE BUTTON (Grid Row 4) */}
              <button onClick={handleCorporateToggle} disabled={isTrial}
                className={`flex items-center justify-between p-4 border border-black transition-all ${isTrial ? 'opacity-20' : isCorporate ? 'bg-black text-white' : 'bg-transparent hover:bg-black/5'}`}>
                <span className="text-[10px] font-black tracking-widest">CORPORATE</span>
                {isCorporate ? <Check size={14} /> : <Plus size={14} />}
              </button>

              {/* TRY IT FIRST BUTTON (Grid Row 4) */}
              <button onClick={handleTrialToggle} disabled={isCorporate}
                className={`flex items-center justify-between p-4 border border-black transition-all ${isCorporate ? 'opacity-20' : isTrial ? 'bg-black text-white' : 'bg-transparent hover:bg-black/5'}`}>
                <span className="text-[10px] font-black tracking-widest">TRY IT FIRST</span>
                {isTrial ? <Check size={14} /> : <Plus size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* INFO BOXES (Conditional) */}
        {isTrial && (
          <div className="mt-6 p-4 bg-[#EDEBE6] border border-black border-dashed animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-black block mb-1 tracking-widest">FREE VERSION TERMS:</span>
            <p className="text-[9px] normal-case leading-relaxed font-bold italic text-gray-600">
              PERSONAL USE ONLY. FREE VERSION FILES HAVE LIMITED CHARACTER SETS. NO COMMERCIAL OR CLIENT WORK ALLOWED.
            </p>
          </div>
        )}

        {isCorporate && (
          <div className="mt-6 p-4 bg-[#EDEBE6] border border-black border-dashed animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-black block mb-1 tracking-widest">CORPORATE TERMS:</span>
            <p className="text-[9px] normal-case leading-relaxed font-bold italic text-gray-600">
              COMPREHENSIVE ALL-IN-ONE LICENSE COVERING ALL USAGES (DESKTOP, WEB, LOGO, APP, BROADCAST, AND SERVER) WITH UNLIMITED SEATS. 
            </p>
          </div>
        )}

{/* INFO BOX: Muncul jika memilih lisensi yang otomatis include Desktop */}
        {hasHigherTier && !isCorporate && !isTrial && (
          <div className="mt-6 p-4 bg-[#EDEBE6] border border-black border-dashed animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-black block mb-1 tracking-widest">LICENSE INCLUSION:</span>
            <p className="text-[9px] normal-case leading-relaxed font-bold italic text-gray-600 uppercase">
              SELECTING LOGO, APP, BROADCAST, OR SERVER LICENSE AUTOMATICALLY INCLUDES ALL TERMS AND PERMISSIONS OF THE STANDARD DESKTOP LICENSE.
            </p>
          </div>
        )}

        {selectedUsages.includes('social_web') && !isCorporate && !isTrial && (
          <div className="mt-6 p-5 bg-[#EDEBE6] border border-black border-dashed animate-in fade-in slide-in-from-top-2">
            <label className="text-[10px] font-bold tracking-[0.2em] mb-4 block">MONTHLY IMPRESSIONS REACH</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(webTierDetails).map(([key, label]) => (
                <button key={key} onClick={() => setWebTier(key as any)}
                  className={`px-2 py-3 text-[10px] font-black tracking-widest border border-black transition-all flex flex-col items-center gap-1 ${webTier === key ? 'bg-black text-white' : 'bg-white hover:bg-black/5'}`}>
                  <span>{key.toUpperCase()}</span>
                  <span className={`text-[7px] ${webTier === key ? 'text-white/50' : 'text-black/40'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER SECTION */}
        <div className="border-t-2 border-black border-dashed mt-10 pt-8 flex flex-col md:flex-row justify-between items-center md:items-end gap-8">
          <div className="flex flex-col text-center md:text-left">
            <span className="text-[10px] font-bold tracking-[0.2em] text-black/40 mb-2">INVESTMENT TOTAL</span>
            <div className="flex items-start justify-center md:justify-start">
              <span className="text-2xl font-bold mt-2 mr-1 tracking-tighter">$</span>
              <span className="text-8xl font-normal tracking-tighter leading-[0.7]">{totalPrice}</span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
            <Link to="/license" className="text-[10px] font-black underline flex items-center gap-2 hover:text-red-600 transition-colors">
              <Info size={14} /> LICENSE INFORMATION
            </Link>
            
            {!isAdded ? (
              <div className="flex gap-2 w-full md:w-auto">
                {/* TOMBOL ADD TO CART */}
                <button onClick={() => handleAdd(false)} className="flex-1 md:w-[180px] bg-white text-black border border-black py-5 px-4 flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all group font-black text-[10px] tracking-widest uppercase">
                  ADD TO CART
                </button>
                {/* TOMBOL DIRECT CHECKOUT */}
                <button onClick={() => handleAdd(true)} className="flex-1 md:w-[180px] bg-black text-white py-5 px-4 flex items-center justify-center gap-3 hover:bg-gray-800 transition-all group font-black text-[10px] tracking-widest uppercase">
                  CHECKOUT
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full md:w-[280px] animate-in fade-in zoom-in-95 duration-300">
                <Link to="/cart" onClick={closeConfigurator} className="w-full bg-black text-white py-5 px-8 flex items-center justify-center gap-4 hover:invert transition-all">
                  <ShoppingCart size={18} /> <span className="text-sm font-black tracking-[0.3em]">CHECKOUT</span>
                </Link>
                <button onClick={closeConfigurator} className="w-full py-3 text-[10px] font-black border border-black hover:bg-black hover:text-white transition-all">
                  CONTINUE SHOPPING
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full z-20 rotate-180"><TicketEdges /></div>
    </div>
  );
};

export default CartCard;