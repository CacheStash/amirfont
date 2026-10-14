import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Layout & Global Components
import Navbar from './components/Navbar';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import CartCard from './components/CartCard';
import ContextMenu from './components/ContextMenu';

// Admin Components
import Login from './components/admin/Login';
import AdminDashboard from './components/admin/AdminLayout';
import AdminLoginModal from './components/admin/AdminLoginModal';

// Maintenance Screen
import MaintenanceScreen from './components/MaintenanceScreen';

// Pages
import Home from './pages/Home';
import Fonts from './pages/Fonts';
import License from './pages/License';
import FAQ from './pages/Faq'; 
import Policy from './pages/Policy';
import About from './pages/About';
import Contact from './pages/Contact';
import UserAuth from './pages/user/UserAuth';
import UserDashboard from './pages/user/Dashboard';
import { CartProvider, useCart } from './context/CartContext';
import CartPage from './pages/shop/CartPage';
import Checkout from './pages/shop/Checkout';
import LicenseReceipt from './pages/user/LicenseReceipt';
import FontDetail from './pages/FontDetail';
import CanvasLanding from './pages/CanvasLanding';
import AffiliateLanding from './pages/AffiliateLanding';

const ScrollToHash = () => {
  const { hash } = useLocation();
  React.useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [hash]);
  return null;
};

const CartConfiguratorModal = () => {
  const { isModalOpen, selectedFont, closeConfigurator } = useCart();
  if (!isModalOpen || !selectedFont) return null;
  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeConfigurator} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative z-[210] animate-in zoom-in-95 duration-300">
          <CartCard 
            fontId={selectedFont.id} 
            fontName={selectedFont.name} 
            prices={selectedFont.license_prices} 
            initialOption={selectedFont.initialOption}
            font_files={selectedFont.font_files}
            trialFileUrl={selectedFont.trial_file_url}
            discount={selectedFont.activeDiscount || 0}
            directCheckout={selectedFont.directCheckout} 
          />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isNavActive, setIsNavActive] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpenAdminAuth = () => setIsAdminLoginModalOpen(true);
    window.addEventListener('open-admin-auth', handleOpenAdminAuth);
    return () => window.removeEventListener('open-admin-auth', handleOpenAdminAuth);
  }, []);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('c');
      if (ref) {
        localStorage.setItem('affiliate_ref', ref.trim().toUpperCase());
      }
    } catch (_) {}
  }, []);

  React.useEffect(() => {
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
      } catch (err) {
        console.error("Failed to check maintenance mode:", err);
      }
    };

    const checkAdminStatus = async (user: any) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('fontadmin')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      setIsAdmin(!!data);
    };

    fetchMaintenanceStatus();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdminStatus(session?.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdminStatus(session?.user);
    });

    const maintenanceChannel = supabase
      .channel('public:site_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        fetchMaintenanceStatus();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(maintenanceChannel);
    };
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
        <ScrollToHash />
        {isMaintenance && !isAdmin ? (
          <>
            <Routes>
              <Route 
                path="/backstage" 
                element={session && isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/backstage/*" 
                element={session && isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} 
              />
              {/* Silent Decoy Redirects */}
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/admin/*" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<MaintenanceScreen />} />
            </Routes>
            <AdminLoginModal 
              isOpen={isAdminLoginModalOpen} 
              onClose={() => setIsAdminLoginModalOpen(false)} 
            />
          </>
        ) : (
          <div className="min-h-screen bg-[#EDEBE6] text-black font-sans selection:bg-black selection:text-white relative flex flex-col">
            <Navbar onStateChange={setIsNavActive} />
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/fonts" element={<Fonts />} />
                <Route path="/canvas" element={<CanvasLanding />} />
                <Route path="/license" element={<License />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/policy" element={<Policy />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/insights" element={<Navigate to="/" replace />} />
                <Route path="/insight/:id" element={<Navigate to="/" replace />} />

                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/font/:id" element={<FontDetail />} />

                {/* USER / BUYER ROUTES */}
                <Route 
                  path="/user/auth" 
                  element={!session ? <UserAuth /> : <Navigate to="/user/dashboard" />} 
                />
                <Route 
                  path="/user/dashboard/*" 
                  element={session ? <UserDashboard /> : <Navigate to="/user/auth" />} 
                />

                <Route path="/user/receipt/:orderId" element={<LicenseReceipt />} />
                
                {/* Stealth Affiliate Route (Hidden from public, admin only) */}
                <Route 
                  path="/affiliate" 
                  element={session && isAdmin ? <AffiliateLanding /> : <Navigate to="/" replace />} 
                />

                {/* ADMIN ROUTES (Stealth: /backstage) */}
                <Route 
                  path="/backstage" 
                  element={session && isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} 
                />
                <Route 
                  path="/backstage/*" 
                  element={session && isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} 
                />

                {/* Silent Decoy Redirects for /admin and /login */}
                <Route path="/admin" element={<Navigate to="/" replace />} />
                <Route path="/admin/*" element={<Navigate to="/" replace />} />
                <Route path="/login" element={<Navigate to="/" replace />} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>

            <CartConfiguratorModal />
            <ContextMenu />

            {!isNavActive && <BackToTop />}
            
            <footer className="relative z-50 bg-[#EDEBE6]">
              <Footer />
            </footer>

            <AdminLoginModal 
              isOpen={isAdminLoginModalOpen} 
              onClose={() => setIsAdminLoginModalOpen(false)} 
            />
          </div>
        )}
      </Router>
    </CartProvider>
  );
};

export default App;