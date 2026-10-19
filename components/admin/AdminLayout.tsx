import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Type, ShoppingCart, LogOut, Tag, 
  Menu, X, Mail, FileText, Power, Loader2, CreditCard, SendHorizontal, Megaphone,
  Sparkles, ExternalLink, Share2, Users
} from 'lucide-react';
import { openCanvasWithSession } from '../../lib/canvasSession';
import { Globe } from 'lucide-react';
import WebAnalytics from './WebAnalytics';
import ProductManager from './ProductManager';
import ContentManager from './ContentManager';
import PromotionsManager from './PromotionsManager'; 
import Orders from './Orders';
import Statistics from './Statistics';
import BroadcastStudio from './BroadcastStudio';
import EmailStudio from './EmailStudio';
import AffiliateManager from './AffiliateManager';
import AudienceDirectory from './AudienceDirectory';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({ products: true });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Settings states
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false);
  const [updatingSandbox, setUpdatingSandbox] = useState(false);

  useEffect(() => {
    // Concurrent initial data loading for minimal dashboard latency
    Promise.all([fetchUnreadCount(), fetchSiteSettings()]);

    const handleSwitchTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
        setVisitedTabs(prev => ({ ...prev, [e.detail]: true }));
      }
    };
    window.addEventListener('admin-switch-tab', handleSwitchTab);
    return () => window.removeEventListener('admin-switch-tab', handleSwitchTab);
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (data) {
        data.forEach((setting: any) => {
          if (setting.key === 'maintenance_mode') {
            setIsMaintenance(setting.value === true || setting.value === 'true');
          }
          if (setting.key === 'paypal_sandbox_mode') {
            setIsSandbox(setting.value === true || setting.value === 'true');
          }
        });
      }
    } catch (e) {
      console.error('Failed to fetch site settings:', e);
    }
  };

  const handleToggleMaintenance = async () => {
    const nextState = !isMaintenance;
    const confirmMsg = nextState 
      ? 'Enable MAINTENANCE MODE? Public visitors will not be able to access the site (admin only).'
      : 'Disable MAINTENANCE MODE? The site will become publicly accessible again.';
    
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
      alert('Failed to update maintenance mode: ' + err.message);
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  const handleToggleSandbox = async () => {
    const nextState = !isSandbox;
    const confirmMsg = nextState 
      ? 'Enable PAYPAL SANDBOX MODE for testing transactions?'
      : 'Switch to PAYPAL LIVE MODE to accept real customer transactions?';
    
    if (!window.confirm(confirmMsg)) return;

    setUpdatingSandbox(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'paypal_sandbox_mode',
          value: nextState,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setIsSandbox(nextState);
    } catch (err: any) {
      alert('Failed to update PayPal mode: ' + err.message);
    } finally {
      setUpdatingSandbox(false);
    }
  };

  const fetchUnreadCount = async () => {
    // Read local session directly to avoid redundant network round-trip of getUser()
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
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
    setVisitedTabs(prev => ({ ...prev, [tab]: true }));
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Failed to sign out: " + error.message);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-black font-sans">
      {/* MOBILE ADMIN NAV */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-black bg-white sticky top-0 z-50">
        <h1 className="font-black uppercase tracking-tighter text-lg italic">Admin_Panel</h1>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-black text-white p-2 border border-black transition-all"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed md:sticky md:top-0 w-full md:w-64 border-r-0 md:border-r border-black bg-white flex flex-col transition-all duration-300 z-40 ${isMenuOpen ? 'top-[61px] h-[calc(100vh-61px)] border-b border-black' : 'top-[-100%] md:top-0 h-0 md:h-screen overflow-hidden md:overflow-visible'}`}>
        <div className="p-8 border-b border-black hidden md:block">
          <h1 className="font-normal uppercase tracking-tighter text-xl italic">Studio Admin</h1>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button onClick={() => handleTabChange('stats')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'stats' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <LayoutDashboard size={18} /> Statistics
          </button>
          <button onClick={() => handleTabChange('broadcast')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'broadcast' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Megaphone size={18} /> Broadcast Studio
          </button>
          <button onClick={() => handleTabChange('audience')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'audience' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Users size={18} /> Audience Directory
          </button>
          <button onClick={() => handleTabChange('products')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'products' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Type size={18} /> Products
          </button>
          <button onClick={() => handleTabChange('promotions')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'promotions' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Tag size={18} /> Promotions
          </button>
          <button onClick={() => handleTabChange('affiliates')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'affiliates' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Share2 size={18} /> Affiliates
          </button>
          <button onClick={() => handleTabChange('orders')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <ShoppingCart size={18} /> Orders
          </button>
          <button onClick={() => handleTabChange('email_studio')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'email_studio' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <SendHorizontal size={18} /> Email Studio
          </button>
          <button onClick={() => handleTabChange('content')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'content' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <FileText size={18} /> Content Mgr
          </button>
          <button onClick={() => handleTabChange('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'analytics' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Globe size={18} /> Web Analytics
          </button>

          {/* Quick External Link: FontCanvas Studio with auto-login / God Mode */}
          <button
            onClick={() => openCanvasWithSession('https://canvas.subqi.com')}
            className="w-full flex items-center justify-between px-4 py-3 font-bold uppercase text-xs transition-all bg-black/5 hover:bg-black hover:text-white border border-dashed border-black/30 mt-3 group"
            title="Launch FontCanvas with Admin God Mode"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-[#FF5C00]" />
              <span>FontCanvas Studio</span>
            </div>
            <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </nav>

        {/* Maintenance Toggle, PayPal Mode Toggle & Logout */}
        <div className="p-4 border-t border-black space-y-2">
          {/* Maintenance Switch */}
          <button
            onClick={handleToggleMaintenance}
            disabled={updatingMaintenance}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all border border-black ${ isMaintenance ? 'bg-amber-500 text-black' : 'bg-gray-100 text-black hover:bg-gray-200' }`}
          >
            <div className="flex items-center gap-2">
              {updatingMaintenance ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Power size={14} className={isMaintenance ? 'text-black animate-pulse' : 'opacity-40'} />
              )}
              <span>MAINTENANCE</span>
            </div>
            <span className={`px-1.5 py-0.5 text-[9px] font-black border border-black ${ isMaintenance ? 'bg-black text-white' : 'bg-white text-black' }`}>
              {isMaintenance ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* PayPal Sandbox / Live Switch */}
          <button
            onClick={handleToggleSandbox}
            disabled={updatingSandbox}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all border border-black ${ isSandbox ? 'bg-[#0070BA] text-white' : 'bg-gray-100 text-black hover:bg-gray-200' }`}
          >
            <div className="flex items-center gap-2">
              {updatingSandbox ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CreditCard size={14} className={isSandbox ? 'text-white' : 'opacity-40'} />
              )}
              <span>PAYPAL MODE</span>
            </div>
            <span className={`px-1.5 py-0.5 text-[9px] font-black border border-black ${ isSandbox ? 'bg-white text-black' : 'bg-black text-white' }`}>
              {isSandbox ? 'SANDBOX' : 'LIVE'}
            </span>
          </button>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs hover:bg-red-50 text-red-600 transition-all cursor-pointer">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-6 md:p-10 overflow-x-hidden overflow-y-auto w-full">
        {visitedTabs['products'] && (
          <div className={activeTab === 'products' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <ProductManager />
          </div>
        )}
        {visitedTabs['promotions'] && (
          <div className={activeTab === 'promotions' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <PromotionsManager onNavigateTab={handleTabChange} />
          </div>
        )}
        {visitedTabs['affiliates'] && (
          <div className={activeTab === 'affiliates' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <AffiliateManager />
          </div>
        )}
        {visitedTabs['content'] && (
          <div className={activeTab === 'content' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <ContentManager />
          </div>
        )}
        {visitedTabs['stats'] && (
          <div className={activeTab === 'stats' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <Statistics />
          </div>
        )}
        {(visitedTabs['broadcast'] || visitedTabs['inbox']) && (
          <div className={activeTab === 'broadcast' || activeTab === 'inbox' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <BroadcastStudio />
          </div>
        )}
        {visitedTabs['audience'] && (
          <div className={activeTab === 'audience' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <AudienceDirectory />
          </div>
        )}
        {visitedTabs['orders'] && (
          <div className={activeTab === 'orders' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <Orders />
          </div>
        )}
        {visitedTabs['email_studio'] && (
          <div className={activeTab === 'email_studio' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <EmailStudio />
          </div>
        )}
        {visitedTabs['analytics'] && (
          <div className={activeTab === 'analytics' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <WebAnalytics />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;