import React, { useState, useEffect } from 'react';
import { Library, Settings, LifeBuoy, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MyFontsHistory from './MyFontsHistory';
import AccountSettings from './AccountSettings'; 

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('');

  // Tutup menu otomatis saat tab berpindah (Mobile)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  // Ambil data user saat dashboard dibuka
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data } = await supabase
          .from('fontbuyer')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (data?.full_name) setFullName(data.full_name);
      }
    };
    fetchProfile();
  }, []);
// --- END FIX ---


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
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-50 bg-black text-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-black bg-white flex flex-col transition-transform duration-300
        md:relative md:translate-x-0
        ${isMenuOpen ? 'translate-x-0 shadow-[10px_0px_50px_rgba(0,0,0,0.1)]' : '-translate-x-full'}
      `}>
        <div className="p-8 border-b border-black flex flex-col gap-2">
          <Link to="/" className="flex items-center gap-1 text-[10px] font-black opacity-30 hover:opacity-100 transition-opacity">
            <ArrowLeft size={10} /> BACK TO STORE
          </Link>
          <h1 className="font-normal tracking-tighter text-lg md:text-xl italic break-all uppercase">
            Hello,<br />
            {fullName ? fullName.split(' ')[0] : (userEmail ? userEmail.split('@')[0] : 'FELLAS!')}
          </h1>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button 
            onClick={() => handleTabChange('library')} 
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold text-xs transition-all ${activeTab === 'library' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            <Library size={18} /> My Library
          </button>
          <button 
            onClick={() => handleTabChange('settings')} 
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold text-xs transition-all ${activeTab === 'settings' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            <Settings size={18} /> Change Password
          </button>
          <button 
            onClick={() => handleTabChange('support')} 
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

      {/* Overlay Mobile */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto w-full">
        {activeTab === 'library' && <MyFontsHistory />}
        {activeTab === 'settings' && <AccountSettings />}
        {activeTab === 'support' && <div className="p-20 text-center font-bold opacity-20 text-xs tracking-[0.2em]">Need help? Email support@subqi.studio</div>}
      </main>
    </div>
  );
};

export default UserDashboard;