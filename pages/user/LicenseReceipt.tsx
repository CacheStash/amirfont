import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

const LicenseReceipt = () => {
  const { orderId } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchReceipt = async () => {
      // 1. Ambil email user aktif
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      // 2. Ambil detail transaksi
      const { data, error } = await supabase
        .from('font_history')
        .select(`*, fonts(name)`)
        .eq('transaction_id', orderId);
      
      if (!error) setData(data);
      setLoading(false);
    };
    fetchReceipt();
  }, [orderId]);

  if (loading) return <div className="p-10 font-mono">LOADING_RECEIPT...</div>;

  // DATABASE TEKS LISENSI STATIS
  const LICENSE_DB: any = {
    trial: {
      title: 'PERSONAL USE (DEMO)',
      grant: 'Permitted exclusively for personal, non-commercial use, such as educational assignments, portfolio pieces, or preliminary testing.',
      charSet: 'The Demo version is a trial asset and contains a limited glyph set.',
      restrictions: 'Commercial utilization, business promotion, social media advertising, or revenue-generating activities are strictly prohibited.'
    },
    desktop: 'Grants the right to install the font software on a local machine to create static visual content (PNG, JPG, PDF) for digital and print media, including commercial projects.',
    logo_branding: 'Grants the right to utilize the font as a core element of a visual identity system, including logos and wordmarks. This license includes all permissions associated with a standard Desktop License.',
    social_web: 'Specifically for digital platforms, including website embedding and social media content (Instagram, TikTok, YouTube, etc.). Tiered by monthly impressions: Small (50k), Medium (500k), Large (5m), Enterprise (Unlimited).',
    app: 'Grants the right to embed the font software into mobile applications, software, or SaaS platforms. This license includes all permissions associated with a standard Desktop License.',
    broadcast: 'Grants the right to utilize the font software in motion graphics, television, cinema, streaming services, and video advertisements. This license includes all permissions associated with a standard Desktop License.',
    server: 'Grants the right to install the font software on a server to facilitate end-user product customization (Web-to-Print). This license includes all permissions associated with a standard Desktop License.',
    corporate: 'A comprehensive, all-encompassing license covering every usage category (Desktop, Web, Logo, App, Broadcast, and Server) for an entire organization with no user or impression limits.'
  };

  const getSeatDetail = (tier: string) => {
    const map: any = {
      'solo': '1 SEAT',
      'team': 'UP TO 25 SEATS',
      'studio': 'UP TO 100 SEATS',
      'enterprise': 'UNLIMITED SEATS'
    };
    return map[tier?.toLowerCase()] || '1 SEAT';
  };

  return (
    <div className="min-h-screen bg-[#EDEBE6] py-12 px-4 font-mono uppercase text-black">
      {/* CSS FIX: Menghilangkan Navbar, Footer, dan Elemen Luar saat Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, footer, header:not(.receipt-header), .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .min-h-screen { min-height: 0 !important; padding: 0 !important; }
          .shadow-\\[12px_12px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { shadow: none !important; border: 1px solid black !important; }
        }
      `}} />

      {/* TOOLBAR */}
      <div className="max-w-2xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link to="/user/dashboard" className="flex items-center gap-2 text-[10px] font-bold">
          <ArrowLeft size={14} /> BACK_TO_DASHBOARD
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-[10px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Printer size={14} /> PRINT_LICENSE_PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto bg-white border border-black p-8 md:p-16 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] print:shadow-none">
        <header className="receipt-header text-center border-b border-black border-dashed pb-8 mb-8">
          <h1 className="text-4xl font-black italic">SUBQI STUDIO</h1>
          <p className="text-[10px] tracking-widest mt-2">OFFICIAL_LICENSE_CERTIFICATE</p>
        </header>

        <div className="space-y-4 mb-10 text-xs">
          <div className="flex justify-between"><span>ORDER_ID</span> <span>{orderId}</span></div>
          <div className="flex justify-between"><span>LICENSE_HOLDER</span> <span>{userEmail || 'N/A'}</span></div>
          <div className="flex justify-between"><span>ISSUE_DATE</span> <span>{new Date(data[0]?.download_date).toLocaleDateString()}</span></div>
        </div>

        <div className="border-y border-black py-8 mb-10 space-y-12">
          {data.map((item: any) => {
            const isTrial = item.download_type === 'trial';
            const usages = isTrial ? ['trial'] : (item.usages || ['desktop']);
            const currentTier = isTrial ? 'SOLO' : (item.tier || 'SOLO');

            return (
              <div key={item.id} className="space-y-8">
                <div className="flex justify-between items-baseline">
                  <span className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none">{item.fonts.name}</span>
                  <span className={`text-[10px] font-bold border border-black px-2 py-1 ${isTrial ? 'bg-yellow-400 text-black' : 'bg-black text-white'}`}>
                    {isTrial ? 'DEMO' : 'COMMERCIAL'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-black opacity-40 block uppercase">01. Seat Tiers:</span>
                  <div className="flex justify-between items-center bg-gray-50 p-4 border border-black text-sm font-black">
                    <span>{currentTier} TIER</span>
                    <span className="text-[10px] italic opacity-60">AUTHORIZED FOR {getSeatDetail(currentTier)}</span>
                  </div>
                </div>

                <div className="h-4 bg-black w-full" />

                <div className="space-y-6">
                  <span className="text-[10px] font-black opacity-40 block uppercase">02. Usage Terms:</span>
                  {usages.map((u: string, idx: number) => (
                    <div key={idx} className="space-y-4">
                      <div className="text-[13px] md:text-base normal-case space-y-3 leading-relaxed">
                        <p className="font-black text-xs md:text-sm underline uppercase italic">
                          {isTrial ? 'Personal Use Only (Demo)' : `${u.replace('_', ' & ').toUpperCase()} LICENSE`}
                        </p>
                        {isTrial ? (
                          <>
                            <p>{LICENSE_DB.trial.grant}</p>
                            <p><span className="font-black underline uppercase">Character Set:</span> {LICENSE_DB.trial.charSet}</p>
                            <p><span className="font-black underline uppercase">Restrictions:</span> {LICENSE_DB.trial.restrictions}</p>
                          </>
                        ) : (
                          <p>{LICENSE_DB[u] || LICENSE_DB.desktop}</p>
                        )}
                      </div>
                      {idx < usages.length - 1 && <div className="h-2 bg-black w-full" />}
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-black w-full" />
              </div>
            );
          })}
        </div>

        <div className="space-y-6 text-[11px] md:text-[13px] normal-case leading-snug">
          <p className="font-black uppercase italic text-sm border-b border-black pb-2">GENERAL_RULES:</p>
          <div className="space-y-4 opacity-80">
            <p>1. You may not sell, rent, sublicense, or redistribute the font files to any third party.</p>
            <p>2. You may not modify, adapt, or decompile the font software.</p>
            <p>3. The font software and its intellectual property remain the sole property of Subqi Studio.</p>
          </div>
        </div>

        <div className="mt-16 text-center border-t border-black border-dashed pt-8">
          <p className="text-[10px] font-black">SUBQI-STUDIO</p>
        </div>
      </div>
    </div>
  );
};

export default LicenseReceipt;