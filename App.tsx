import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

import FontUploadForm from './components/admin/FontUploadForm';



import BackToTop from './components/BackToTop';
import Home from './pages/Home';
import Fonts from './pages/Fonts'; // Pastikan file ini ada (dari jawaban sebelumnya)
import Blog from './pages/Blog';   // Pastikan file ini ada (dari jawaban sebelumnya)


const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white relative flex flex-col">
        {/* Menu Navigasi Sticky */}
        <Navbar />
        
        {/* Konten Halaman Berubah di Sini */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fonts" element={<Fonts />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/license" element={<div className="p-20 text-center font-mono uppercase">License Page (Coming Soon)</div>} />
            <Route path="/admin" element={
              <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-8 font-mono uppercase border-b-2 border-black pb-4">
                  Admin Dashboard
                </h1>
                <FontUploadForm />
              </div>
            } />
            <Route path="/about" element={<div className="p-20 text-center font-mono uppercase">About Page (Coming Soon)</div>} />
            <Route path="/contact" element={<div className="p-20 text-center font-mono uppercase">Contact Page (Coming Soon)</div>} />
          </Routes>
        </div>

        <BackToTop />
        
        {/* Footer Global (Akan muncul di semua halaman) */}
        <footer className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-8 border-t-[4px] border-black pt-12 text-xs font-mono uppercase tracking-wider text-gray-500 mb-20 mt-32 px-4 md:px-0">
          <div>
            <span className="block text-black font-bold mb-2">License</span>
            <p>Desktop, Web, App, Epub</p>
          </div>
          <div>
            <span className="block text-black font-bold mb-2">Support</span>
            <p>info@subqistudio.com</p>
          </div>
          <div>
            <span className="block text-black font-bold mb-2">Social</span>
            <p>Instagram / Twitter / Behance</p>
          </div>
          <div className="md:text-right">
            &copy; SUBQI STUDIO 2026
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;