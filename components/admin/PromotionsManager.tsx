import React, { useState, useEffect } from 'react';
import { Plus, Tag, Calendar, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PromotionsManager = () => {
  const [promos, setPromos] = useState<any[]>([]);
  const [fonts, setFonts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchPromos();
    fetchFonts();
  }, []);

  const fetchPromos = async () => {
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (data) setPromos(data);
  };

  const fetchFonts = async () => {
    const { data } = await supabase.from('fonts').select('id, name');
    if (data) setFonts(data);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-black">Promotions</h2>
          <p className="font-mono text-xs text-gray-500">Manage duration-based discounts and bundle packs.</p>
        </div>
        <button className="bg-black text-white px-6 py-3 font-bold uppercase text-xs flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Plus size={16} /> Create Promo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promos.length === 0 && (
          <div className="col-span-2 p-12 border-2 border-dashed border-gray-300 text-center text-gray-400 font-mono text-[10px] uppercase">
            No promotions active. Ready to launch a sale?
          </div>
        )}
        {promos.map(p => (
           <div key={p.id} className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
             <div className="flex justify-between mb-2">
               <span className="bg-yellow-300 px-2 py-1 text-[8px] font-black uppercase border border-black">{p.type}</span>
               <span className="font-mono text-[8px] uppercase">Expires: {new Date(p.end_date).toLocaleDateString()}</span>
             </div>
             <h3 className="text-lg font-bold uppercase">{p.name}</h3>
             <p className="text-[10px] font-mono mb-4 text-gray-500">{p.description}</p>
             <div className="flex gap-2">
                <button className="text-[10px] font-bold border-b-2 border-black uppercase">Edit Duration</button>
                <button className="text-[10px] font-bold text-red-500 border-b-2 border-red-500 uppercase">Delete</button>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsManager; // CRITICAL: Default Export