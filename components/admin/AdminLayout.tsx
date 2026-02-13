import React, { useState } from 'react';
import { LayoutDashboard, Type, ShoppingCart, LogOut, Tag } from 'lucide-react';
import ProductManager from './ProductManager';
import PromotionsManager from './PromotionsManager'; 
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Gagal keluar: " + error.message);
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-black font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-black bg-white flex flex-col">
        <div className="p-8 border-b border-black">
         <h1 className="font-normal uppercase tracking-tighter text-xl">Studio Admin</h1>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'stats' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <LayoutDashboard size={18} /> Statistics
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'products' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Type size={18} /> Products
          </button>
          <button onClick={() => setActiveTab('promotions')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'promotions' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Tag size={18} /> Promotions
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <ShoppingCart size={18} /> Orders
          </button>
        </nav>

        <div className="p-4 border-t border-black">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs hover:bg-red-50 text-red-600 transition-all cursor-pointer">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-10 overflow-y-auto">
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'promotions' && <PromotionsManager />}
        {activeTab === 'stats' && <div className="p-20 text-center font-bold opacity-20 uppercase text-xs tracking-[0.2em]">Stats Dashboard (Coming Soon)</div>}
        {activeTab === 'orders' && <div className="p-20 text-center font-bold opacity-20 uppercase text-xs tracking-[0.2em]">Orders History (Coming Soon)</div>}
      </main>
    </div>
  );
};

export default AdminDashboard;