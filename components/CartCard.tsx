import React, { useState, useMemo } from 'react';
import { Plus, Info, ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Interface sesuai dengan struktur JSON di kolom license_prices database
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
  fontName: string;
  prices: LicensePrices;
}

const CartCard: React.FC<CartCardProps> = ({ fontName, prices }) => {
  const { addToCart, closeConfigurator } = useCart();
  const [selectedTier, setSelectedTier] = useState<'solo' | 'team' | 'studio' | 'enterprise'>('solo');
  const [selectedUsages, setSelectedUsages] = useState<string[]>(['desktop']);
  const [webTier, setWebTier] = useState<'small' | 'medium' | 'large' | 'enterprise'>('small');
  const [isCorporate, setIsCorporate] = useState(false);

  const totalPrice = useMemo(() => {
    if (!prices) return 0;
    if (isCorporate) return prices.corporate_full_suite || 0;

    let total = 0;
    selectedUsages.forEach(usage => {
      if (usage === 'social_web') {
        const webKey = webTier === 'small' ? 'small_50k' : 
                       webTier === 'medium' ? 'medium_500k' : 
                       webTier === 'large' ? 'large_5m' : 'enterprise_unlimited';
        total += prices.social_web?.[webKey as keyof WebTierPrices] || 0;
      } else {
        const categoryData = prices[usage as keyof Omit<LicensePrices, 'corporate_full_suite' | 'social_web'>];
        if (categoryData) total += categoryData[selectedTier] || 0;
      }
    });
    return total;
  }, [selectedTier, selectedUsages, webTier, isCorporate, prices]);

  const handleAdd = () => {
    addToCart({
      cartId: crypto.randomUUID(),
      fontId: fontName,
      name: fontName,
      price: totalPrice,
      tier: isCorporate ? 'Corporate' : selectedTier,
      usages: selectedUsages,
      webTierLabel: selectedUsages.includes('social_web') ? webTier : undefined
    });
  };
// --- END FIX ---
  const toggleUsage = (id: string) => {
    if (isCorporate) return;
    setSelectedUsages(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const handleCorporateToggle = () => {
    setIsCorporate(!isCorporate);
    if (!isCorporate) setSelectedUsages(['corporate_full_suite']);
    else setSelectedUsages(['desktop']);
  };

  const TicketEdges = () => (
    <div className="flex justify-between w-full px-2 -mx-2 overflow-hidden pointer-events-none select-none">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="w-3 h-3 bg-[#EDEBE6] border border-black rounded-full -mt-[7px]" />
      ))}
    </div>
  );

  return (
    <div className="w-[90vw] max-w-[500px] bg-white border border-black relative font-sans text-black overflow-hidden uppercase">
      {/* Top Edge Texture */}
      <div className="absolute top-0 left-0 w-full z-20"><TicketEdges /></div>
      
      <button onClick={closeConfigurator} className="absolute top-4 right-4 z-30 p-1 hover:bg-black hover:text-white transition-colors">
        <X size={20} />
      </button>

      <div className="p-8 pt-12 pb-12">
        <div className="border-b border-black pb-6 mb-8 text-center">
          <span className="text-[10px] tracking-[0.3em] font-bold text-gray-400 block mb-2">License Configurator</span>
          <h2 className="text-4xl md:text-5xl font-normal tracking-tighter leading-none">{fontName}</h2>
        </div>

        {/* 1. SEAT TIER SELECTION */}
        <div className={`mb-10 transition-all ${isCorporate ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          <label className="text-[10px] font-bold tracking-[0.2em] mb-4 block">01. Select Organization Size (Seats)</label>
          <div className="grid grid-cols-2 gap-2">
            {['solo', 'team', 'studio', 'enterprise'].map((t) => (
              <button key={t} onClick={() => setSelectedTier(t as any)}
                className={`py-3 border border-black text-[10px] font-bold tracking-widest transition-all ${selectedTier === t ? 'bg-black text-white' : 'hover:bg-black/5'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 2. USAGE RIGHTS SELECTION */}
        <div className="mb-10">
          <label className="text-[10px] font-bold tracking-[0.2em] mb-4 block">02. Select Usage Terms</label>
          <div className="space-y-2">
            {[
              { id: 'desktop', label: 'Desktop / Print' },
              { id: 'logo_branding', label: 'Logo & Branding' },
              { id: 'social_web', label: 'Social Media & Web' },
              { id: 'app', label: 'App / SaaS' },
              { id: 'broadcast', label: 'Broadcast' },
              { id: 'server', label: 'Server' },
            ].map((u) => (
              <button key={u.id} onClick={() => toggleUsage(u.id)} disabled={isCorporate}
                className={`w-full flex items-center justify-between p-4 border border-black transition-all ${
                  isCorporate ? 'opacity-20' : 
                  selectedUsages.includes(u.id) ? 'bg-black text-white scale-[1.01] z-10' : 'bg-transparent hover:bg-black/5'
                }`}>
                <span className="text-xs font-bold tracking-widest">{u.label}</span>
                <Plus size={16} className={`transition-transform duration-300 ${selectedUsages.includes(u.id) ? 'rotate-45' : ''}`} />
              </button>
            ))}

            <button onClick={handleCorporateToggle}
              className={`w-full flex items-center justify-between p-5 border-2 border-black mt-6 transition-all ${isCorporate ? 'bg-black text-white' : 'bg-transparent hover:bg-black/5'}`}>
              <div className="text-left">
                <span className="text-sm font-black tracking-widest block italic">CORPORATE FULL SUITE</span>
                <span className={`text-[9px] normal-case block mt-1 ${isCorporate ? 'text-gray-400' : 'text-gray-500'}`}>All-in-one / Unlimited access for entire corp</span>
              </div>
              {isCorporate && <Check size={20} />}
            </button>
          </div>
        </div>

        {/* 3. CONDITIONAL WEB TIER SUB-OPTIONS */}
        {selectedUsages.includes('social_web') && !isCorporate && (
          <div className="mb-10 p-5 bg-[#EDEBE6] border border-black border-dashed animate-in fade-in slide-in-from-top-4 duration-500">
            <label className="text-[10px] font-bold tracking-[0.2em] mb-4 block">Monthly Impressions / Reach</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'small', label: 'Small (Up to 50k)' },
                { id: 'medium', label: 'Medium (Up to 500k)' },
                { id: 'large', label: 'Large (Up to 5m)' },
                { id: 'enterprise', label: 'Enterprise (Unlimited)' },
              ].map((w) => (
                <button key={w.id} onClick={() => setWebTier(w.id as any)}
                  className={`text-left px-4 py-3 text-[10px] font-bold tracking-widest flex justify-between items-center border ${
                    webTier === w.id ? 'bg-black text-white border-black' : 'border-transparent hover:border-black'
                  }`}>
                  <span>{w.label}</span>
                  {webTier === w.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. TOTAL INVESTMENT */}
        <div className="border-t-2 border-black border-dashed pt-8 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-1">Estimated Investment</span>
            <div className="flex items-start">
              <span className="text-xl font-bold mt-1 mr-1 tracking-tighter text-black">$</span>
              <span className="text-7xl font-normal tracking-tighter leading-none text-black">{totalPrice}</span>
            </div>
          </div>
          <Link to="/license" className="text-[10px] font-bold underline flex items-center gap-1 hover:text-red-600 transition-colors mb-2">
            <Info size={14} /> View License Policy
          </Link>
        </div>
      </div>

      {/* FOOTER BUTTON */}
      <button 
        onClick={handleAdd}
        className="w-full bg-black text-white py-8 flex items-center justify-center gap-6 hover:bg-gray-900 transition-all group border-t border-black"
      >
        <span className="text-base font-black tracking-[0.4em]">ADD TO ORDER</span>
        <ArrowRight size={24} className="group-hover:translate-x-3 transition-transform" />
      </button>

      {/* Bottom Edge Texture */}
      <div className="absolute bottom-[88px] left-0 w-full z-20 rotate-180"><TicketEdges /></div>
    </div>
  );
};

export default CartCard;