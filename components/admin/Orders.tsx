import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(''); // Teks input
  const [searchTerm, setSearchTerm] = useState('');   // Trigger query
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setCurrentPage(1);
  };

  // --- REWRITE TOTAL UNTUK fetchOrders ---

const fetchOrders = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      const lowerTerm = searchTerm.toLowerCase();
      const isEmail = searchTerm.includes('@');
      const isOrderId = searchTerm.toUpperCase().startsWith('SQ-');
      const isTrialSearch = lowerTerm === 'trial';
      const isFullSearch = lowerTerm === 'full';

      // Senior Logic: Fonts SELALU !inner agar pencarian nama font (partial) diproses di level root.
      // Buyer hanya !inner jika benar-benar sedang mencari email.
      let query = supabase
        .from('font_history')
        .select(`
          id,
          transaction_id,
          download_type,
          download_date,
          tier,
          usages,
          metadata,
          fontbuyer${isEmail ? '!inner' : ''} ( email ),
          fonts!inner ( name )
        `, { count: 'exact' });

      if (searchTerm) {
        const usageKeywords = ['personal', 'desktop', 'logo', 'branding', 'app', 'server', 'broadcast', 'social', 'web'];
        const isUsageSearch = usageKeywords.some(k => lowerTerm === k);

        if (isEmail) {
          query = query.ilike('fontbuyer.email', `%${lowerTerm}%`);
        } else if (isOrderId) {
          query = query.ilike('transaction_id', `%${searchTerm.toUpperCase()}%`);
        } else if (isTrialSearch || isFullSearch) {
          query = query.eq('download_type', lowerTerm);
        } else if (isUsageSearch) {
         const searchTag = searchTerm.replace(' ', '_').toUpperCase();
          query = query.overlaps('usages', [searchTerm.toUpperCase(), searchTag, searchTerm.toLowerCase()]);
        } else {
          // SENIOR SOLUTION: Gunakan sintaks 'fonts(name)' tanpa spasi sama sekali.
          // fonts!inner di select memastikan baris yang nggak punya font (nggak mungkin ada) terbuang.
          // Kita sertakan 'tier' dan 'transaction_id' untuk backup pencarian umum.
          const filterStr = `transaction_id.ilike.%${searchTerm}%,tier.ilike.%${searchTerm}%,fonts(name).ilike.%${searchTerm}%`;
          query = query.or(filterStr);
        }
      }

      const { data, error, count } = await query
        .order('download_date', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("SUPABASE_QUERY_ERROR:", error.message);
        setOrders([]);
        setTotalCount(0);
      } else {
        setOrders(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("SYSTEM_FETCH_ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-8 font-mono uppercase selection:bg-black selection:text-white">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-normal tracking-tight italic">Sales_History</h2>
          <p className="text-xs font-bold text-gray-400 mt-1 tracking-wider">Monitor transactions & licenses</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-auto">
          <input 
            type="text" 
            placeholder="SEARCH ID/EMAIL/FONT..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-white border-2 border-black px-10 py-3 text-xs font-bold outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full md:w-80 uppercase"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black hover:underline">CLEAR</button>
          )}
        </form>
      </div>

      {/* TABLE */}
      <div className="border-2 border-black bg-white overflow-x-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b-2 border-black bg-gray-50 text-[10px] font-black tracking-widest text-gray-500">
              <th className="p-4">Date</th>
              <th className="p-4">Order_ID</th>
              <th className="p-4">Buyer_Email</th>
              <th className="p-4">Typeface</th>
              <th className="p-4 text-center">Price</th>
              <th className="p-4 text-center">Type</th>
              <th className="p-4">Tier_&_Reach</th>
              <th className="p-4">Usage_Terms</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-20 text-center animate-pulse font-bold">FETCHING_SALES_DATA...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="p-20 text-center opacity-30 font-bold">NO_RESULTS_FOUND_FOR: "{searchTerm}"</td></tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="border-b border-black hover:bg-yellow-50 transition-colors">
                <td className="p-4 text-[11px] font-bold">{new Date(order.download_date).toLocaleDateString()}</td>
                <td className="p-4"><span className="bg-black text-white px-2 py-1 text-[10px] font-bold">{order.transaction_id}</span></td>
                <td className="p-4 text-[10px] font-bold lowercase">{order.fontbuyer?.email || 'N/A'}</td>
                <td className="p-4 font-black text-sm italic">{order.fonts?.name || 'UNKNOWN'}</td>
                <td className="p-4 text-center font-black text-sm">${order.metadata?.price_at_purchase ?? (order.download_type === 'trial' ? '0' : 'N/A')}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 text-[9px] font-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${order.download_type === 'trial' ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'}`}>
                    {order.download_type?.toUpperCase() || 'N/A'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black">{order.tier || 'SOLO'}</span>
                    {order.metadata?.mpv && <span className="text-[9px] bg-black text-white px-1 w-fit font-bold italic">{order.metadata.mpv} MPV_REACH</span>}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {order.usages?.map((u: string) => (
                      <span key={u} className="text-[9px] bg-gray-100 border border-black px-1 font-bold uppercase">{u.replace('_', ' ')}</span>
                    )) || <span className="text-[9px] opacity-30 italic">NO_DATA</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"><ChevronLeft size={20} /></button>
          <span className="font-black text-xs tracking-widest">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"><ChevronRight size={20} /></button>
        </div>
      )}
    </div>
  );
};

export default Orders;