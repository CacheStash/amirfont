import React, { useState } from 'react';
import { Library, Settings, LifeBuoy, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import MyFontsHistory from './MyFontsHistory';
import AccountSettings from './AccountSettings'; // FIXED: Tambahkan import ini

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('library');

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Failed to logout: " + error.message);
    } else {
      window.location.href = '/'; // Kembali ke Storefront
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-black font-sans uppercase">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-black bg-white flex flex-col">
        <div className="p-8 border-b border-black flex flex-col gap-2">
          <Link to="/" className="flex items-center gap-1 text-[10px] font-black opacity-30 hover:opacity-100 transition-opacity">
            <ArrowLeft size={10} /> BACK TO STORE
          </Link>
          <h1 className="font-normal tracking-tighter text-xl italic">SUBQI_MEMBER</h1>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('library')} 
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold text-xs transition-all ${activeTab === 'library' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            <Library size={18} /> My Library
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold text-xs transition-all ${activeTab === 'settings' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            <Settings size={18} /> Change Password
          </button>
          <button 
            onClick={() => setActiveTab('support')} 
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold text-xs transition-all ${activeTab === 'support' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            <LifeBuoy size={18} /> Support / Help
          </button>
        </nav>

        <div className="p-4 border-t border-black">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 font-bold text-xs hover:bg-red-50 text-red-600 transition-all cursor-pointer">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-10 overflow-y-auto">
        {activeTab === 'library' && <MyFontsHistory />}
        {activeTab === 'settings' && <div className="p-20 text-center font-bold opacity-20 text-xs tracking-[0.2em]">Manage your profile (Coming Soon)</div>}
        {activeTab === 'support' && <div className="p-20 text-center font-bold opacity-20 text-xs tracking-[0.2em]">Need help? Email support@subqi.studio</div>}
      </main>
    </div>
  );
};

export default UserDashboard;