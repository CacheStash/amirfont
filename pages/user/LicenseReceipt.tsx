import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

const LicenseReceipt = () => {
  const { orderId } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
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

  return (
    <div className="min-h-screen bg-[#EDEBE6] py-12 px-4 font-mono uppercase text-black">
      {/* TOOLBAR: Gak akan muncul pas di-print */}
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

      {/* THE OFFICIAL RECEIPT */}
      <div className="max-w-2xl mx-auto bg-white border border-black p-8 md:p-16 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] print:shadow-none print:border-none">
        <div className="text-center border-b border-black border-dashed pb-8 mb-8">
          <h1 className="text-4xl font-black italic">SUBQI STUDIO</h1>
          <p className="text-[10px] tracking-widest mt-2">OFFICIAL_LICENSE_CERTIFICATE</p>
        </div>

        <div className="space-y-4 mb-10 text-xs">
          <div className="flex justify-between"><span>ORDER_ID</span> <span>{orderId}</span></div>
          <div className="flex justify-between"><span>LICENSE_HOLDER</span> <span>{data[0]?.user_id}</span></div>
          <div className="flex justify-between"><span>ISSUE_DATE</span> <span>{new Date(data[0]?.download_date).toLocaleDateString()}</span></div>
        </div>

        <div className="border-y border-black py-6 mb-10 space-y-4">
          <span className="text-[10px] font-black opacity-40 italic">LICENSED_ASSETS:</span>
          {data.map((item: any) => (
            <div key={item.id} className="flex justify-between items-baseline">
              <span className="text-xl font-black italic">{item.fonts.name}</span>
              <span className="text-[10px] font-bold border border-black px-2 uppercase">{item.download_type}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4 text-[9px] normal-case leading-tight opacity-70">
          <p className="font-black uppercase italic mb-2">TERMS_OF_USAGE:</p>
          <p>1. This license is non-transferable and belongs strictly to the buyer.</p>
          <p>2. The font files may be used across platforms as specified in the purchased tier.</p>
          <p>3. Redistribution or reselling of font files is strictly prohibited.</p>
        </div>

        <div className="mt-16 text-center border-t border-black border-dashed pt-8">
          <p className="text-[10px] font-black">SUBQI-STUDIO.COM</p>
        </div>
      </div>
    </div>
  );
};

export default LicenseReceipt;