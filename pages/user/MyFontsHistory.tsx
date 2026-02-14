import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Info } from 'lucide-react';

const MyFontsHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Join tabel font_history dengan fonts untuk ambil nama dan link
    const { data, error } = await supabase
      .from('font_history')
      .select(`
        id,
        download_type,
        download_date,
        fonts (
          name,
          trial_file_url,
          font_files
        )
      `)
      .eq('user_id', user.id)
      .order('download_date', { ascending: false });

    if (!error) setHistory(data);
    setLoading(false);
  };

  if (loading) return <div className="text-[10px] font-bold animate-pulse">LOADING_DATABASE...</div>;

  return (
    <div className="space-y-8 font-mono">
      <div className="border-b-2 border-black pb-4">
        <h2 className="text-4xl font-black italic">MY_LIBRARY</h2>
        <p className="text-[10px] opacity-40">All your fonts / Trial & Full version</p>
      </div>

      {history.length === 0 ? (
        <div className="border-2 border-dashed border-black p-20 text-center">
          <p className="opacity-30 font-bold">YOUR LIBRARY IS EMPTY.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((item) => (
            <div key={item.id} className="border border-black p-6 bg-white flex justify-between items-center group hover:bg-black hover:text-white transition-all">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black opacity-40 group-hover:text-white/50">
                  {new Date(item.download_date).toLocaleDateString()} — {item.download_type}
                </span>
                <h3 className="text-2xl font-black italic">{item.fonts.name}</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 text-[10px] font-black border border-black ${item.download_type === 'trial' ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'}`}>
                  {item.download_type === 'trial' ? 'DEMO' : 'FULL'}
                </div>
                <button 
                  onClick={() => alert("Re-downloading...")} // Nanti kita arahkan ke URL file
                  className="bg-black text-white p-3 border border-white group-hover:bg-white group-hover:text-black transition-all"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFontsHistory;