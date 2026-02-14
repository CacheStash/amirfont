import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Layout & Global Components
import Navbar from './components/Navbar';
import BackToTop from './components/BackToTop';

// Admin Components
import Login from './components/admin/Login';
import AdminDashboard from './components/admin/AdminLayout';

// Pages - Pastikan penamaan file FAQ.tsx menggunakan huruf BESAR semua
import Home from './pages/Home';
import Fonts from './pages/Fonts';
import License from './pages/License';
import FAQ from './pages/Faq'; 
import Policy from './pages/Policy';
import About from './pages/About';
import Contact from './pages/Contact';
import Insights from './pages/Insights';
import { CartProvider, useCart } from './context/CartContext';
import CartPage from './pages/shop/CartPage';
import CartCard from './components/CartCard';



// Placeholders

const CartConfiguratorModal = () => {
  const { isModalOpen, selectedFont, closeConfigurator } = useCart();
  if (!isModalOpen || !selectedFont) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeConfigurator} />
      <div className="relative z-[210] animate-in zoom-in-95 duration-300">
        <CartCard fontName={selectedFont.name} prices={selectedFont.prices} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  
  // STATE BARU: Untuk memantau apakah menu/search sedang terbuka
  const [isNavActive, setIsNavActive] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEBE6] flex items-center justify-center font-sans uppercase tracking-widest text-sm">
        Verifying Access...
      </div>
    );
  }

  return (

    <CartProvider>
    <Router>
      <div className="min-h-screen bg-[#EDEBE6] text-black font-sans selection:bg-black selection:text-white relative flex flex-col uppercase">
        
        {/* Kirim fungsi setIsNavActive ke Navbar */}
        <Navbar onStateChange={setIsNavActive} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fonts" element={<Fonts />} />
            <Route path="/license" element={<License />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/insights" element={<Insights />} />

            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<div className="p-20 text-center uppercase tracking-widest min-h-[50vh]">Checkout Coming Soon</div>} />

            <Route path="/login" element={!session ? <Login /> : <Navigate to="/admin" />} />
            <Route 
              path="/admin/*" 
              element={session ? <AdminDashboard /> : <Navigate to="/login" />} 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <CartConfiguratorModal />

        {/* Tombol BackToTop hanya muncul jika Navigasi (Menu/Search) sedang TIDAK aktif */}
        {!isNavActive && <BackToTop />}
        
        <footer className="w-full border-t border-black bg-transparent py-16 px-6 md:px-8">
          <div className="max-w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-[10px] md:text-xs font-normal tracking-[0.2em] text-gray-500 uppercase">
            <div className="space-y-4">
              <span className="block text-black font-bold">License</span>
              <p className="normal-case leading-relaxed">Desktop, Web, App, Social Media, Broadcast, and Corporate Full Suite.</p>
            </div>
            <div className="space-y-4">
              <span className="block text-black font-bold">Support</span>
              <p className="text-black font-bold">amisubqisetiaji@gmail.com</p>
            </div>
            <div className="space-y-4">
              <span className="block text-black font-bold">Social</span>
              <div className="flex flex-col gap-2">
                <a href="#" className="hover:text-black transition-colors">Instagram</a>
                <a href="#" className="hover:text-black transition-colors">Twitter (X)</a>
                <a href="#" className="hover:text-black transition-colors">Behance</a>
              </div>
            </div>
            <div className="md:text-right flex flex-col justify-end">
              <span className="text-black font-bold">&copy; SUBQI STUDIO 2026</span>
              <p className="mt-1">Jakarta, Indonesia</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
    </CartProvider>
  );
};

export default App;