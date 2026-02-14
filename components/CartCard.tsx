import React, { useState, useMemo } from 'react';
import { Plus, Info, ArrowRight, Check, X, ShoppingCart, ArrowLeft } from 'lucide-react';
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
  const [isAdded, setIsAdded] = useState(false); // State untuk menampilkan tombol post-action

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
      tier: isCorporate ? `Corporate (${selectedTier.toUpperCase()})` : selectedTier,
      usages: selectedUsages,
      webTierLabel: selectedUsages.includes('social_web') ? webTier : undefined
    });
    setIsAdded(true); // Tampilkan pilihan checkout/belanja lagi
  };

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
      {[...Array(30)].map((_, i) => (
        <div key={i} className="w-3 h-3 bg-[#EDEBE6] border border-black rounded-full -mt-[7px]" />
      ))}
    </div>
  );

  return (
    <div className="w-[95vw] max-w-[800px] bg-white border border-black relative font-sans text-black overflow-hidden uppercase shadow-2xl">
      {/* Top Edge Texture */}
      <div className="absolute top-0 left-0 w-full z-20"><TicketEdges /></div>
      
      <button onClick={closeConfigurator} className="absolute top-4 right-4 z-30 p-1 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black">
        <X size={20} />
      </button>

      <div className="p-6 md:p-10 pt-12 pb-12">
        <div className="border-b border-black pb-6 mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] font-bold text-gray-400 block mb-1">License Configurator</span>
            <h2 className="text-4xl md:text-5xl font-normal tracking-tighter leading-none">{fontName}</h2>
          </div>
          <div className="text-right hidden md:block">
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 block">Status</span>
            <span className="text-xs font-bold text-green-600">● Available for Licensing</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* LEFT COLUMN: SEAT SIZE */}
          <div className="md:col-span-4 border-r-0 md:border-r border-black md:pr-8">
            <label className="text-[10px] font-bold tracking-[0.2em] mb-4 block">01. Organization Size</label>
            <div className="flex flex-col gap-2">
              {['solo', 'team', 'studio', 'enterprise'].map((t) => (
                <button key={t} onClick={() => setSelectedTier(t as any)}
                  className={`py-3 px-4 border border-black text-[10px] font-bold tracking-widest text-left transition-all flex justify-between items-center ${selectedTier === t ? 'bg-black text-white' : 'hover:bg-black/5'}`}>
                  {t}
                  {selectedTier === t && <Check size={12} />}
                </button>
              ))}
            </div>
            <p className="text-[8px] normal-case text-gray-400 mt-4 leading-relaxed italic">
              Organization size determines the number of users & devices allowed to install the font software.
            </p>
          </div>

          {/* RIGHT COLUMN: USAGE TERMS */}
          <div className="md:col-span-8">
            <label className="text-[10px] font-bold tracking-[0.2em] mb-4 block">02. Usage Terms (Select multiple)</label>
            
            {/* 2 COLUMN GRID FOR USAGES */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { id: 'desktop', label: 'Desktop' },
                { id: 'logo_branding', label: 'Logo' },
                { id: 'social_web', label: 'Social/Web' },
                { id: 'app', label: 'App/SaaS' },
                { id: 'broadcast', label: 'Broadcast' },
                { id: 'server', label: 'Server' },
              ].map((u) => (
                <button key={u.id} onClick={() => toggleUsage(u.id)} disabled={isCorporate}
                  className={`flex items-center justify-between p-3 border border-black transition-all ${
                    isCorporate ? 'opacity-20' : 
                    selectedUsages.includes(u.id) ? 'bg-black text-white' : 'bg-transparent hover:bg-black/5'
                  }`}>
                  <span className="text-[10px] font-bold tracking-widest">{u.label}</span>
                  <Plus size={14} className={`transition-transform duration-300 ${selectedUsages.includes(u.id) ? 'rotate-45' : ''}`} />
                </button>
              ))}
            </div>

            {/* CORPORATE FULL WIDTH BELOW */}
            <button onClick={handleCorporateToggle}
              className={`w-full flex items-center justify-between p-4 border-2 border-black mt-2 transition-all ${isCorporate ? 'bg-black text-white' : 'bg-transparent hover:bg-black/10'}`}>
              <div className="text-left">
                <span className="text-[11px] font-black tracking-widest block italic">CORPORATE FULL SUITE</span>
                <span className={`text-[8px] normal-case block mt-1 ${isCorporate ? 'text-gray-400' : 'text-gray-500'}`}>All-in-one / Unlimited access for all terms</span>
              </div>
              {isCorporate && <Check size={20} />}
            </button>
          </div>
        </div>

        {/* WEB TIER - ONLY IF SELECTED */}
        {selectedUsages.includes('social_web') && !isCorporate && (
          <div className="mt-8 p-4 bg-[#EDEBE6] border border-black border-dashed">
            <label className="text-[9px] font-bold tracking-[0.2em] mb-3 block">Monthly Web/Social Impressions</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['small', 'medium', 'large', 'enterprise'].map((w) => (
                <button key={w} onClick={() => setWebTier(w as any)}
                  className={`px-2 py-2 text-[9px] font-bold tracking-widest border border-black transition-all ${webTier === w ? 'bg-black text-white' : 'bg-white hover:bg-black/5'}`}>
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TOTAL & POLICY */}
        <div className="border-t-2 border-black border-dashed mt-10 pt-8 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-1">Total Investment</span>
            <div className="flex items-start">
              <span className="text-xl font-bold mt-1 mr-1">$</span>
              <span className="text-7xl font-normal tracking-tighter leading-none">{totalPrice}</span>
            </div>
          </div>
          <Link to="/license" className="text-[10px] font-bold underline flex items-center gap-1 hover:text-red-600 transition-colors mb-2">
            <Info size={14} /> License Info
          </Link>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      {!isAdded ? (
        <button 
          onClick={handleAdd}
          className="w-full bg-black text-white py-8 flex items-center justify-center gap-6 hover:invert transition-all group border-t border-black"
        >
          <span className="text-base font-black tracking-[0.4em]">ADD TO ORDER</span>
          <ArrowRight size={24} className="group-hover:translate-x-3 transition-transform" />
        </button>
      ) : (
        <div className="flex flex-col md:flex-row w-full border-t border-black animate-in fade-in slide-in-from-bottom-2 duration-500">
          <button 
            onClick={closeConfigurator}
            className="flex-1 bg-white text-black py-8 flex items-center justify-center gap-4 hover:bg-gray-100 transition-all border-b md:border-b-0 md:border-r border-black font-black tracking-[0.2em] text-sm"
          >
            <ArrowLeft size={18} /> CONTINUE BROWSING
          </button>
          <Link 
            to="/cart"
            onClick={closeConfigurator}
            className="flex-1 bg-black text-white py-8 flex items-center justify-center gap-4 hover:invert transition-all font-black tracking-[0.2em] text-sm"
          >
            <ShoppingCart size={18} /> GO TO CHECKOUT <ArrowRight size={18} />
          </Link>
        </div>
      )}

      {/* Bottom Edge Texture */}
      <div className="absolute bottom-[88px] left-0 w-full z-20 rotate-180"><TicketEdges /></div>
    </div>
  );
};

export default CartCard;