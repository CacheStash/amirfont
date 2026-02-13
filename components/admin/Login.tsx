import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom'; // TAMBAHKAN INI

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // INISIALISASI NAVIGATE

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
    } else if (data.session) {
      // JIKA BERHASIL, PINDAH KE ADMIN
      navigate('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-20 p-8 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-3xl font-normal uppercase mb-6 border-b-2 border-black pb-2 tracking-tight">Admin Access</h2>
      <form onSubmit={handleLogin} className="space-y-4 text-sm">
        <div>
          <label className="block mb-1 font-bold text-xs uppercase tracking-wider text-gray-500">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full border border-black p-3 outline-none font-bold focus:bg-yellow-50 transition-colors uppercase text-xs" 
            placeholder="ADMIN@SUBQI.STUDIO"
            required 
          />
        </div>
        <div>
          <label className="block mb-1 font-bold text-xs uppercase tracking-wider text-gray-500">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full border border-black p-3 outline-none font-bold focus:bg-yellow-50 transition-colors text-xs" 
            required 
          />
        </div>
        <button 
          disabled={loading} 
          className="w-full bg-black text-white p-4 font-bold uppercase hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          {loading ? 'Verifying...' : 'Enter Dashboard'}
        </button>
      </form>
    </div>
  );
};

export default Login;