import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, Plus, ArrowRight } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const menuItems = ['Fonts', 'License', 'About', 'Contact', 'Policy', 'FAQ', 'Insights'];

  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`w-full sticky top-0 z-[100] transition-all duration-300 ${
      isScrolled ? 'bg-[#EDEBE6]/90 backdrop-blur-md' : 'bg-[#EDEBE6]'
    }`}>
      {/* Navbar Inner: Border BUKAN kondisional lagi, tapi PERMANEN black agar tidak hilang saat static */}
      <div className="w-full flex justify-between items-center h-14 md:h-16 px-0 relative z-[110] bg-[#EDEBE6] border-b border-black">
        
        {/* Left: Logo Area - Padding sejajar dengan menu nanti (md:px-8) */}
        <div className="flex items-center gap-2 md:gap-4 h-full border-r border-black px-3 md:px-8 flex-1 md:flex-none md:w-[450px] min-w-0">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-black hover:text-white transition-colors border border-black md:border-transparent md:hover:border-black shrink-0"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="font-normal tracking-tighter text-xl md:text-2xl uppercase hover:opacity-70 transition-opacity truncate">
            Subqi Studio
          </Link>
        </div>

        {/* Right: Search & Cart */}
        <div className="flex items-center justify-end gap-2 md:gap-4 h-full border-l-0 md:border-l border-black px-3 md:px-8 shrink-0 bg-inherit">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1 transition-colors border border-transparent ${isSearchOpen ? 'bg-black text-white' : 'hover:bg-black hover:text-white hover:border-black'}`}
            >
               {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            <button className="flex items-center gap-2 font-bold text-xs md:text-sm border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-all whitespace-nowrap uppercase">
               <Plus size={16} className="shrink-0" />
               <span>CART (0)</span>
            </button>
        </div>
      </div>

      {/* Fullscreen Navigation Menu - Animasi Slide */}
      <div className={`fixed inset-0 top-0 w-full h-screen bg-[#EDEBE6] z-[105] transition-transform duration-700 cubic-bezier(0.85, 0, 0.15, 1) flex flex-col ${
        isOpen ? 'translate-y-0' : '-translate-y-full'
      }`}>
          {/* Spacer di belakang navbar bar */}
          <div className="h-14 md:h-16 w-full border-b border-black bg-[#EDEBE6] flex-shrink-0"></div>

          {/* Menu Items Container: md:pt-10 dipindah ke dalam kolom agar grid line nempel ke atas tanpa gap */}
          <div className="flex-1 overflow-y-auto pt-0"> 
              <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
                  {/* Kolom 1 (4 Items: Fonts, License, About, Contact) */}
                  <div className="flex flex-col border-r-0 md:border-r border-black md:pt-10">
                      {menuItems.slice(0, 4).map((item) => (
                        <Link 
                          key={item} 
                          to={`/${item.toLowerCase()}`}
                          className="text-3xl md:text-6xl font-normal uppercase tracking-tighter px-3 md:px-8 py-6 md:py-10 border-b border-black hover:bg-black hover:text-white transition-all flex justify-between items-center group"
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{item}</span>
                          <ArrowRight size={32} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      ))}
                  </div>

                  {/* Kolom 2 (3 Items: Policy, FAQ, Insights) */}
                  <div className="flex flex-col md:pt-10">
                      {menuItems.slice(4).map((item) => (
                        <Link 
                          key={item} 
                          to={`/${item.toLowerCase()}`}
                          className="text-3xl md:text-6xl font-normal uppercase tracking-tighter px-3 md:px-8 py-6 md:py-10 border-b border-black hover:bg-black hover:text-white transition-all flex justify-between items-center group"
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{item}</span>
                          <ArrowRight size={32} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      ))}
                      {/* Area kosong di bawah menu kanan agar grid tetap melintang penuh */}
                      <div className="flex-1 border-b border-black md:border-b-0"></div>
                  </div>
              </div>

              {/* Sidebar Info Area (Diletakkan di bawah atau samping jika perlu, di sini saya buat minimalis) */}
              <div className="p-3 md:px-8 py-10 opacity-30">
                  <div className="font-bold uppercase text-[10px] tracking-widest">Subqi Studio HQ — Jakarta, ID</div>
              </div>
          </div>
      </div>
    </nav>
  );
};

export default Navbar;