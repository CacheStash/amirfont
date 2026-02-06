import React, { useState } from 'react';
import { LayoutDashboard, Type, ShoppingCart, LogOut } from 'lucide-react';
import ProductManager from './ProductManager'; // Tambahkan ini
import { supabase } from '../../lib/supabase'; // Import koneksi database

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Gagal keluar: " + error.message);
    } else {
      // Halaman akan otomatis redirect karena session di App.tsx berubah
      console.log("Logged out successfully");
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-50 text-black font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-black bg-white flex flex-col">
        <div className="p-8 border-b border-black">
          <h1 className="font-bold uppercase tracking-tighter text-xl">Fontshop Admin</h1>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'stats' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <LayoutDashboard size={18} /> Stats
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'products' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <Type size={18} /> My Fonts
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs transition-all ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
            <ShoppingCart size={18} /> Orders
          </button>
        </nav>

        <div className="p-4 border-t border-black">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 font-bold uppercase text-xs hover:bg-red-50 text-red-600 transition-all cursor-pointer"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-8 overflow-y-auto">
        {activeTab === 'products' && <ProductManager />}
        {/* Tab lain bisa ditambahkan nanti */}
      </main>
    </div>
  );
};

export default AdminDashboard;