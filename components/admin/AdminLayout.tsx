import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Type, ShoppingCart, LogOut, Tag, 
  Menu, X, Mail, FileText, Power, Loader2 
} from 'lucide-react';
import ProductManager from './ProductManager';
import ContentManager from './ContentManager';
import PromotionsManager from './PromotionsManager'; 
import Orders from './Orders';
import Statistics from './Statistics';
import AdminMessages from './AdminMessages';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      if (data) {
        setIsMaintenance(data.value === true || data.value === 'true');
      }
    } catch (e) {
      console.error('Failed to fetch maintenance status:', e);
    }
  };

  const handleToggleMaintenance = async () => {
    const nextState = !isMaintenance;
    const confirmMsg = nextState 
      ? 'Aktifkan MODE MAINTENANCE? Pengunjung umum tidak akan bisa membuka situs (hanya admin).'
      : 'Matikan MODE MAINTENANCE? Situs akan kembali dapat diakses oleh publik.';
    
    if (!window.confirm(confirmMsg)) return;

    setUpdatingMaintenance(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'maintenance_mode',
          value: nextState,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setIsMaintenance(nextState);
    } catch (err: any) {
      alert('Gagal mengubah mode maintenance: ' + err.message);
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  const fetchUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from('font_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Gagal keluar: " + error.message);
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-black font-sans">
      {/* MOBILE ADMIN NAV */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-black bg-white sticky top-0 z-50">
        <h1 className="font-black uppercase tracking-tighter text-lg italic">Admin_Panel</h1>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-black text-white p-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed md:sticky md:top-0 w-full md:w-64 border-r-0 md:border-r border-black bg-white flex flex-col transition-all duration-300 z-40
        ${isMenuOpen ? 'top-[61px] h-[calc(100vh-61px)] border-b border-black' : 'top-[-100%] md:top-0 h-0 md:h-screen overflow-hidden md:overflow-visible'}
      `}>
        <div className="p-8 border-b border-black hidden md:block">
          <h1 className="font-normal uppercase tracking-tighter text-xl italic">Studio Admin</h1>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button onClick={() => handleTabChange('stats')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'stats' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <LayoutDashboard size={18} /> Statistics
          </button>
          <button onClick={() => handleTabChange('inbox')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all relative ${activeTab === 'inbox' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <div className="relative">
              <Mail size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -left-2.5 bg-red-600 text-white text-[7px] font-black px-1 py-0 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            Inbox & Broadcast
          </button>
          <button onClick={() => handleTabChange('products')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'products' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Type size={18} /> Products
          </button>
          <button onClick={() => handleTabChange('promotions')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'promotions' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Tag size={18} /> Promotions
          </button>
          <button onClick={() => handleTabChange('orders')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <ShoppingCart size={18} /> Orders
          </button>
          <button onClick={() => handleTabChange('content')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'content' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <FileText size={18} /> Content Mgr
          </button>
        </nav>

        {/* Maintenance Toggle & Logout */}
        <div className="p-4 border-t border-black space-y-2">
          <button
            onClick={handleToggleMaintenance}
            disabled={updatingMaintenance}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none ${
              isMaintenance 
                ? 'bg-amber-500 text-black' 
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {updatingMaintenance ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Power size={14} className={isMaintenance ? 'text-black animate-pulse' : 'opacity-40'} />
              )}
              <span>MAINTENANCE</span>
            </div>
            <span className={`px-1.5 py-0.5 text-[9px] font-black border border-black ${
              isMaintenance ? 'bg-black text-white' : 'bg-white text-black'
            }`}>
              {isMaintenance ? 'ON' : 'OFF'}
            </span>
          </button>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs hover:bg-red-50 text-red-600 transition-all cursor-pointer">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-6 md:p-10 overflow-x-hidden overflow-y-auto w-full">
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'promotions' && <PromotionsManager />}
        {activeTab === 'content' && <ContentManager />}
        {activeTab === 'stats' && <Statistics />}
        {activeTab === 'inbox' && <AdminMessages />}
        {activeTab === 'orders' && <Orders />}
      </main>
    </div>
  );
};

export default AdminDashboard;