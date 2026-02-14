import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const UserAuth = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      // PROSES DAFTAR (SIGN UP)
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(error.message);
      } else {
        alert("Verification email sent! Please check your inbox.");
      }
    } else {
      // PROSES MASUK (SIGN IN)
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
      } else if (data.session) {
        navigate('/user/dashboard'); // Arahkan ke dashboard buyer
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-20 p-8 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono">
      <div className="flex justify-between items-baseline mb-6 border-b-2 border-black pb-2">
        <h2 className="text-3xl font-black uppercase tracking-tight">
          {isRegister ? 'Create Account' : 'Buyer Login'}
        </h2>
        <span className="text-[10px] font-bold opacity-30">TYPE_02_USER</span>
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

        <button 
          disabled={loading} 
          className="w-full bg-black text-white p-4 font-black uppercase hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          {loading ? 'Processing...' : isRegister ? 'Join Studio' : 'Access My Fonts'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-black border-dashed flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase">
          {isRegister ? 'Already have an account?' : 'Need to try some fonts?'}
        </p>
        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="text-xs font-black uppercase underline hover:text-red-600 transition-colors"
        >
          {isRegister ? 'Sign In Instead' : 'Create Free Account'}
        </button>
      </div>
    </div>
  );
};

export default UserAuth;