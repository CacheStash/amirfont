import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PromotionsManager = () => {
  const [promos, setPromos] = useState<any[]>([]);
  const [fonts, setFonts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [promoName, setPromoName] = useState('');
  const [discount, setDiscount] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('specific');
  const [selectedFonts, setSelectedFonts] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchPromos();
    fetchFonts();
  }, []);

  const fetchPromos = async () => {
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (data) setPromos(data);
    setLoading(false);
  };

  const fetchFonts = async () => {
    const { data } = await supabase.from('fonts').select('id, name');
    if (data) setFonts(data);
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

      const { error } = await supabase.from('promotions').insert([payload]);
      if (error) throw error;

      alert("Promotion '" + promoName + "' launched successfully!");
      setIsAdding(false);
      fetchPromos();
      // Reset form fields
      setPromoName(''); 
      setDiscount(''); 
      setEndDate(''); 
      setSelectedFonts([]);
    } catch (err: any) {
      console.error("Supabase Database Error:", err);
      alert("Gagal membuat promo: " + (err.message || "Cek koneksi database atau pastikan tabel sudah dibuat."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus promo ini?")) return;
    await supabase.from('promotions').delete().eq('id', id);
    fetchPromos();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-black">Promotions</h2>
          <p className="font-mono text-xs text-gray-500">Set discounts for specific fonts or store-wide.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-6 py-3 font-bold uppercase text-xs flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          <Plus size={16} /> Create Promo
        </button>
      </div>

      {/* PROMO LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-20 text-center font-mono text-xs uppercase animate-pulse">Loading campaigns...</div>
        ) : promos.length === 0 ? (
          <div className="col-span-2 p-20 border-2 border-dashed border-gray-300 text-center text-gray-400 font-mono text-xs uppercase">No active promotions.</div>
        ) : (
          promos.map(p => (
            <div key={p.id} className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-yellow-300 px-2 py-1 text-[10px] font-black uppercase border border-black">{p.discount_percent}% OFF</span>
                <span className="font-mono text-[9px] uppercase">Ends: {p.end_date}</span>
              </div>
              <h3 className="text-xl font-bold uppercase mb-1">{p.name}</h3>
              <p className="text-[10px] font-mono text-gray-500 mb-4 uppercase">{p.type === 'global' ? 'Store-wide Sale' : `${p.font_ids?.length} Fonts Selected`}</p>
              <button onClick={() => handleDelete(p.id)} className="text-red-500 font-bold uppercase text-[10px] border-b-2 border-red-500">End Campaign</button>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM PROMO */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold uppercase">Configure Promo</h3>
              <button onClick={() => setIsAdding(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-bold uppercase">Campaign Name</label>
                <input type="text" value={promoName} onChange={e => setPromoName(e.target.value)} className="w-full border border-black p-2 font-bold uppercase text-sm outline-none focus:bg-yellow-50" placeholder="E.G. RAMADAN SALE" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-bold uppercase">Discount (%)</label>
                  <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full border border-black p-2 font-bold text-sm outline-none" placeholder="30" />
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-bold uppercase">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-black p-2 font-mono text-xs outline-none" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block font-mono text-[10px] font-bold uppercase">Target Fonts</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 font-mono text-[10px] cursor-pointer">
                    <input type="radio" checked={targetType === 'all'} onChange={() => setTargetType('all')} /> ALL FONTS
                  </label>
                  <label className="flex items-center gap-2 font-mono text-[10px] cursor-pointer">
                    <input type="radio" checked={targetType === 'specific'} onChange={() => setTargetType('specific')} /> SELECT FONTS
                  </label>
                </div>

                {targetType === 'specific' && (
                  <div className="max-h-32 overflow-y-auto border border-black p-2 space-y-1 bg-gray-50">
                    {fonts.map(f => (
                      <label key={f.id} className="flex items-center gap-2 font-mono text-[9px] uppercase cursor-pointer hover:bg-white p-1">
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