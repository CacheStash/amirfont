import React, { useState, useEffect } from 'react'; // Tambahkan useEffect
import { supabase } from '../../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Tambahkan useSearchParams

const UserAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Mengambil parameter dari URL

  // Sinkronisasi data dari URL ke dalam form
  useEffect(() => {
    const preEmail = searchParams.get('email');
    const preKey = searchParams.get('key');
    if (preEmail) setEmail(preEmail);
    if (preKey) setPassword(preKey);
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // PROSES MASUK (SIGN IN) - MURNI LOGIN
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
    } else if (data.session) {
      navigate('/user/dashboard'); 
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-20 p-8 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono">
      <div className="flex justify-between items-baseline mb-6 border-b-2 border-black pb-2">
        <h2 className="text-3xl font-black uppercase tracking-tight">
          Buyer Login
        </h2>
        <span className="text-[10px] font-bold opacity-30">EXISTING_BUYER</span>
      </div>

      <form onSubmit={handleAuth} className="space-y-4 text-sm">
        <div>
          <label className="block mb-1 font-black text-[10px] uppercase tracking-wider text-gray-500">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full border border-black p-3 outline-none font-bold focus:bg-yellow-50 transition-colors uppercase text-xs" 
            placeholder="YOUR@EMAIL.COM"
            required 
          />
        </div>
        <div>
          <label className="block mb-1 font-black text-[10px] uppercase tracking-wider text-gray-500">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full border border-black p-3 outline-none font-bold focus:bg-yellow-50 transition-colors text-xs" 
            required 
          />
        </div>

        {/* CLOUDFLARE TURNSTILE GUARD */}
        <div 
          className="cf-turnstile py-2 flex justify-center" 
          data-sitekey="0x4AAAAAACcxxQ0Q2-zEqr8s"
          data-theme="light"
        ></div>

        <button 
          disabled={loading} 
          className="w-full bg-black text-white p-4 font-black uppercase hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          {loading ? 'Processing...' : 'Access My Fonts'}
        </button>
      </form>

      {/* FOOTER NOTICE - MENGARAHKAN USER BARU KE SHOP */}
      <div className="mt-6 pt-6 border-t border-black border-dashed flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase text-center">
          New buyer? Your account is created automatically during checkout.
        </p>
        <button 
          onClick={() => navigate('/fonts')}
          className="text-xs font-black uppercase underline hover:text-red-600 transition-colors"
        >
          Go to Font Collection
        </button>
      </div>
    </div>
  );
};

export default UserAuth;