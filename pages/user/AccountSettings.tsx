import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Key } from 'lucide-react';

const AccountSettings = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initialPassword, setInitialPassword] = useState('LOADING...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ambil transaction_id pertama sebagai password awal user
    const getInitialCreds = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('font_history')
        .select('transaction_id')
        .eq('user_id', user.id)
        .order('download_date', { ascending: true })
        .limit(1);
      if (data && data[0]) setInitialPassword(data[0].transaction_id);
      else setInitialPassword("NOT_FOUND");
    };
    getInitialCreds();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Passwords do not match!");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert(error.message);
    else {
      alert("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md font-mono uppercase">
      <div className="mb-10 p-6 border-2 border-black bg-yellow-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <label className="block text-[10px] font-black tracking-widest mb-2 opacity-50 flex items-center gap-2">
          <Key size={12} /> YOUR_INITIAL_PASSWORD & PASSWORD_RESETTER
        </label>
        <div className="text-xl font-black tracking-tighter bg-white border border-black p-3 select-all">
          {initialPassword}
        </div>
        <p className="text-[9px] mt-3 font-bold opacity-60 leading-tight">
          * This code was generated during your first checkout. Use it to log in if you haven't changed your password yet. * This code can also be used to reset your password in case you forget your new one.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <h3 className="text-2xl font-black italic border-b-2 border-black pb-2">CHANGE_PASSWORD</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-black p-3 outline-none focus:bg-white bg-gray-100 font-bold" required />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border border-black p-3 outline-none focus:bg-white bg-gray-100 font-bold" required />
          </div>
        </div>
        <button disabled={loading} className="w-full bg-black text-white p-4 font-black hover:bg-green-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2">
          <ShieldCheck size={18} /> {loading ? 'UPDATING...' : 'SAVE_NEW_PASSWORD'}
        </button>
      </form>
    </div>
  );
};
export default AccountSettings;