import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm]);
  const fetchOrders = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      // Menambahkan 'metadata' ke dalam select untuk mengambil data MPV
      // Jika Anda memiliki tabel 'profiles', Anda bisa melakukan join email di sini. 
      // Untuk saat ini kita ambil user_id sebagai identitas buyer.
      let query = supabase
        .from('font_history')
        .select(`
          id,
          transaction_id,
          download_type,
          download_date,
          tier,
          usages,
          user_id,
          fontbuyer ( email ),
          metadata,
          fonts ( name )
        `, { count: 'exact' });

      if (searchTerm) {
        const filterStr = `transaction_id.ilike.%${searchTerm}%,tier.ilike.%${searchTerm}%,fontbuyer(email).ilike.%${searchTerm}%,fonts(name).ilike.%${searchTerm}%`;
        query = query.or(filterStr);
      }
      const { data, error, count } = await query
        .order('download_date', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("DEBUG_QUERY_ERROR:", error.message);
      } else if (data) {
        setOrders(data);
        if (count) setTotalCount(count);
      }
    } catch (err) {
      console.error("FETCH_ERROR:", err);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-8 font-mono">
      {/* HEADER SECTION - Style Konsisten dengan ProductManager */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-normal uppercase tracking-tight italic">Sales_History</h2>
          <p className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-wider">
            Monitor all transactions & licenses
          </p>
        </div>
        
        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            placeholder="SEARCH_BY_ORDER_EMAIL_OR_FONT..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-white border-2 border-black px-10 py-3 text-xs font-bold outline-none focus:bg-yellow-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-72 uppercase"
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* ORDERS TABLE - Tanpa menghapus kolom, ditambah Email & MPV */}
      <div className="border-2 border-black bg-white overflow-x-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
  <table className="w-full text-left border-collapse min-w-[1000px]">
    <thead>
      <tr className="border-b-2 border-black bg-gray-50">
        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-500">Date</th>
        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-500">Order_ID</th>
        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-500">Buyer_Email</th>
        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-500">Typeface</th>
        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-500 text-center">Price</th>
        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-500 text-center">Type</th>
        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-500">Tier_&_Reach</th>
        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-500">Usage_Terms</th>
      </tr>
    </thead>
    <tbody>
      {loading ? (
        <tr><td colSpan={6} className="p-10 text-center animate-pulse font-bold">LOADING_DATABASE...</td></tr>
      ) : orders.length === 0 ? (
        <tr><td colSpan={6} className="p-10 text-center opacity-30 font-bold">NO_ORDERS_FOUND</td></tr>
      ) : orders.map((order) => (
        <tr key={order.id} className="border-b border-black hover:bg-yellow-50 transition-colors">
          <td className="p-4 text-[11px] font-bold">
            {new Date(order.download_date).toLocaleDateString()}
          </td>
          <td className="p-4">
            <span className="bg-black text-white px-2 py-1 text-[10px] font-bold">{order.transaction_id}</span>
          </td>
          <td className="p-4 text-[10px] font-bold">
            {order.fontbuyer?.email || 'N/A'}
          </td>
          <td className="p-4 font-black text-sm uppercase italic">
            {order.fonts?.name || 'UNKNOWN'}
          </td>
          <td className="p-4 text-center font-black text-sm">
            ${order.metadata?.price_at_purchase ?? (order.download_type === 'trial' ? '0' : 'N/A')}
          </td>
          <td className="p-4 text-center">
            <span className={`px-2 py-1 text-[9px] font-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              order.download_type === 'trial' ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'
            }`}>
              {order.download_type?.toUpperCase() || 'N/A'}
            </span>
          </td>
          <td className="p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase">{order.tier || 'SOLO'}</span>
              {order.metadata?.mpv && (
                <span className="text-[9px] bg-black text-white px-1 w-fit font-bold italic">
                  {order.metadata.mpv} MPV_REACH
                </span>
              )}
            </div>
          </td>
          <td className="p-4">
            <div className="flex flex-wrap gap-1">
              {order.usages?.map((u: string) => (
                <span key={u} className="text-[9px] bg-gray-100 border border-black px-1 font-bold uppercase">
                  {u.replace('_', ' ')}
                </span>
              )) || <span className="text-[9px] opacity-30 italic">NO_DATA</span>}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-20 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-black text-xs uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-20 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;