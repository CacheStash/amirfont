import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, ChevronLeft, ChevronRight, Download, FileText, ShieldCheck } from 'lucide-react';

const MASTER_TIER_LABELS: Record<string, Record<string, string>> = {
  desktop: { solo: '1 USER ONLY', team: 'UP TO 30 USER', studio: 'UP TO 100 USER', enterprise: 'UNLIMITED USER' },
  social_web: { small_50k: '50K VIEWS', medium_500k: '500K VIEWS', large_5m: '2M VIEWS', enterprise_unlimited: 'UNLIMITED VIEWS' },
  logo_branding: { personal: 'PERSONAL BRANDING', solo: '1-10 EMPLOYEES', team: '11-50 EMPLOYEES', studio: '51-250 EMPLOYEES', enterprise: '251+ EMPLOYEES' },
  app: { solo: '1 TITLE', team: 'UP TO 10 TITLES', studio: 'UP TO 50 TITLES', enterprise: 'UNLIMITED TITLES' },
  server: { solo: 'SINGLE', studio: 'UP TO 50 SERVERS', enterprise: 'UNLIMITED' },
  broadcast: { solo: 'REGIONAL', studio: 'NATIONAL', enterprise: 'WORLDWIDE' }
};

const TEXT_DB: Record<string, any> = {
  trial: {
    title: "01. PERSONAL USE ONLY (DEMO)",
    grant: "Permitted exclusively for personal, non-commercial use (e.g. educational assignments, portfolio pieces, or non-profit testing).",
    charSet: "The Demo version is a trial asset and contains a limited glyph set.",
    restrictions: "Commercial utilization, business promotion, or revenue-generating activities are strictly prohibited."
  },
  desktop: "DESKTOP / PRINT: Install on workstations to create static visual content (PNG, JPG, PDF) for digital and print media.",
  social_web: "DIGITAL MEDIA (SOCIAL/WEB): Specifically for digital platforms, including website embedding and social media advertising.",
  logo_branding: "LOGO & BRANDING: Utilize the font as a core element of a visual identity system (Logos, Wordmarks).",
  app: "APP / GAME / EBOOK: Embed font software into mobile applications, software, games, or electronic publications.",
  broadcast: "BROADCAST: For motion graphics, television, cinema, streaming, and video advertisements.",
  server: "SERVER: Install on a server to facilitate automated end-user customization (Web-to-Print).",
  corporate: "CORPORATE ALL-IN-ONE: A comprehensive license covering all categories for an entire organization with no limits on seats or impressions."
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(''); // Teks input
  const [searchTerm, setSearchTerm] = useState('');   // Trigger query
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [downloadingTx, setDownloadingTx] = useState<string | null>(null);
  const itemsPerPage = 20;

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      let query = supabase.from('admin_order_view').select('*');
      
      if (searchTerm) {
        query = query.or(`transaction_id.ilike.%${searchTerm}%,buyer_email.ilike.%${searchTerm}%,font_name.ilike.%${searchTerm}%,tier.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('download_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return alert('NO DATA TO EXPORT');

      // Generate CSV Content
      const headers = ['Date', 'Order_ID', 'Email', 'Typeface', 'Type', 'Price', 'Tier', 'Usages'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => [
          new Date(row.download_date).toLocaleDateString(),
          row.transaction_id,
          row.buyer_email || 'N/A',
          `"${row.font_name}"`,
          row.download_type,
          row.metadata?.price_at_purchase || 0,
          row.tier,
          `"${(row.usages || []).join(' | ')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `SALES_REPORT_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("EXPORT_ERROR:", err);
    } finally {
      setIsExporting(false);
    }
  };


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

      // Menembak VIEW virtual yang sudah digabung (FLAT)
      let query = supabase
        .from('admin_order_view')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        // Filter OR menjadi sangat stabil karena semua kolom kini berada di satu tabel yang sama
        query = query.or(`transaction_id.ilike.%${searchTerm}%,buyer_email.ilike.%${searchTerm}%,font_name.ilike.%${searchTerm}%,tier.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order('download_date', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("SUPABASE_QUERY_ERROR:", error.message);
        setOrders([]);
        setTotalCount(0);
      } else {
        // RE-MAPPING: Mengembalikan struktur data agar sesuai dengan komponen Tabel (fontbuyer & fonts)
        const formattedData = data?.map(item => ({
          ...item,
          fontbuyer: { email: item.buyer_email },
          fonts: { name: item.font_name }
        }));
        setOrders(formattedData || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("SYSTEM_FETCH_ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleDownloadLicenseTxt = async (order: any) => {
    setDownloadingTx(order.transaction_id);
    try {
      let buyerName = 'N/A';
      let buyerAddress = 'N/A';
      let buyerEmail = order.fontbuyer?.email || order.buyer_email || 'N/A';

      // 1. Ambil detail fontbuyer untuk mengisi LICENSE.txt resmi
      const { data: historyRows } = await supabase
        .from('font_history')
        .select(`
          fontbuyer (
            full_name,
            address,
            email
          )
        `)
        .eq('transaction_id', order.transaction_id)
        .limit(1);

      if (historyRows && historyRows.length > 0 && historyRows[0].fontbuyer) {
        const buyer = historyRows[0].fontbuyer as any;
        if (buyer.full_name) buyerName = buyer.full_name;
        if (buyer.address) buyerAddress = buyer.address;
        if (buyer.email) buyerEmail = buyer.email;
      } else if (buyerEmail && buyerEmail !== 'N/A') {
        const { data: directBuyer } = await supabase
          .from('fontbuyer')
          .select('full_name, address, email')
          .eq('email', buyerEmail)
          .maybeSingle();

        if (directBuyer) {
          if (directBuyer.full_name) buyerName = directBuyer.full_name;
          if (directBuyer.address) buyerAddress = directBuyer.address;
          if (directBuyer.email) buyerEmail = directBuyer.email;
        }
      }

      const isTrial = (order.download_type || '').toLowerCase() === 'trial' || (order.download_type || '').toLowerCase() === 'demo';
      const rawTier = (order.tier || 'solo').toLowerCase();
      const usages: string[] = isTrial ? ['trial'] : (order.usages && order.usages.length > 0 ? order.usages : ['desktop']);
      const issueDate = order.download_date ? new Date(order.download_date).toLocaleDateString() : new Date().toLocaleDateString();
      const fontDisplayName = order.fonts?.name || order.font_name || 'Subqi Font';

      // 2. Susun isi LICENSE.txt sesuai protokol resmi Subqi Studio
      let licenseBody = `SUBQI STUDIO — OFFICIAL LICENSE CERTIFICATE\n`;
      licenseBody += `========================================================================\n`;
      licenseBody += `ORDER ID       : ${order.transaction_id || 'N/A'} (USE AS PASSWORD RESETTER)\n`;
      licenseBody += `LICENSE HOLDER : ${buyerEmail} (USERNAME)\n`;
      licenseBody += `LICENSEE NAME  : ${buyerName}\n`;
      licenseBody += `ADDRESS        : ${buyerAddress}\n`;
      licenseBody += `ISSUE DATE     : ${issueDate}\n`;
      licenseBody += `ASSET NAME     : ${fontDisplayName}\n`;
      licenseBody += `------------------------------------------------------------------------\n\n`;

      licenseBody += `LICENSED USAGE TERMS:\n\n`;
      usages.forEach((u: string, i: number) => {
        if (isTrial) {
          licenseBody += `${i + 1}. ${TEXT_DB.trial.title}:\n`;
          licenseBody += `${TEXT_DB.trial.grant}\n\n`;
          licenseBody += `CHARACTER SET: ${TEXT_DB.trial.charSet}\n\n`;
          licenseBody += `RESTRICTIONS: ${TEXT_DB.trial.restrictions}\n\n`;
        } else {
          const specificLabel = MASTER_TIER_LABELS[u]?.[rawTier] || rawTier.toUpperCase();
          const title = `${u.replace('_', ' & ').toUpperCase()} LICENSE: ( ${specificLabel} )`;
          licenseBody += `${i + 1}. ${title}\n`;
          licenseBody += `${TEXT_DB[u] || TEXT_DB.desktop}\n\n`;
        }
      });

      licenseBody += `GENERAL RULES:\n`;
      licenseBody += `1. This license is non-transferable and belongs strictly to the buyer.\n`;
      licenseBody += `2. You may not sell, rent, sublicense, or redistribute the font files.\n`;
      licenseBody += `3. The font software remains the sole property of Subqi Studio.\n\n`;
      licenseBody += `FULL DIGITAL RECEIPT:\n${window.location.origin}/user/receipt/${order.transaction_id} *LOGIN FIRST TO ACCESS*\n`;

      // 3. Trigger download .txt
      const blob = new Blob([licenseBody.trim()], { type: 'text/plain;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const cleanFont = fontDisplayName.replace(/\s+/g, '_');
      link.download = `LICENSE_${cleanFont}_${order.transaction_id?.slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("LICENSE_DOWNLOAD_ERROR:", err);
      alert("Failed to generate license .txt: " + err.message);
    } finally {
      setDownloadingTx(null);
    }
  };

  return (
    <div className="space-y-8 font-mono uppercase selection:bg-black selection:text-white">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-normal tracking-tight italic">Sales_History</h2>
          <p className="text-xs font-bold text-gray-400 mt-1 tracking-wider">Monitor transactions & licenses</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            disabled={isExporting || loading}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] font-black hover:bg-gray-800 disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none transition-all uppercase"
          >
            <Download size={14} />
            {isExporting ? 'EXPORTING...' : 'EXPORT_CSV'}
          </button>

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
              <th className="p-4 text-center">License_Certificate</th>
              <th className="p-4">Tier_&_Reach</th>
              <th className="p-4">Usage_Terms</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-20 text-center animate-pulse font-bold">FETCHING_SALES_DATA...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="p-20 text-center opacity-30 font-bold">NO_RESULTS_FOUND_FOR: "{searchTerm}"</td></tr>
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
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <button 
                      onClick={() => handleDownloadLicenseTxt(order)}
                      disabled={downloadingTx === order.transaction_id}
                      title="Download License (.txt)"
                      className="px-2.5 py-1 border border-black bg-white hover:bg-black hover:text-white text-[9px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all flex items-center gap-1 group disabled:opacity-40"
                    >
                      <FileText size={12} />
                      <span>{downloadingTx === order.transaction_id ? '...' : '.TXT'}</span>
                    </button>
                    <a 
                      href={`/user/receipt/${order.transaction_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View Web License Certificate"
                      className="px-2.5 py-1 border border-black bg-white hover:bg-yellow-400 text-black text-[9px] font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all flex items-center gap-1 group"
                    >
                      <ShieldCheck size={12} />
                      <span>VIEW</span>
                    </a>
                  </div>
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