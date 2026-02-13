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
    <nav className={`w-full sticky top-0 z-[100] transition-all duration-300 mb-[-1px] ${
      isScrolled ? 'backdrop-blur-xl bg-[#EDEBE6]/70' : 'bg-[#EDEBE6]'
    }`}>
      
      {/* 1. NAVBAR BAR (LOGO & BUTTONS) 
          Z-INDEX PALING TINGGI (130) Agar selalu menutupi elemen yang slide di belakangnya.
          Background harus SOLID saat Menu/Search terbuka agar tidak 'bocor' lewat blur. */}
      <div className={`w-full flex justify-between items-center h-14 md:h-16 px-0 relative z-[130] border-b border-black transition-colors duration-300 ${
        (isOpen || isSearchOpen) ? 'bg-[#EDEBE6]' : 'bg-transparent'
      }`}>
        
        {/* Left: Logo & Toggle */}
        <div className="flex items-center gap-2 md:gap-4 h-full border-r border-black px-3 md:px-8 flex-1 md:flex-none md:w-[450px] min-w-0">
          <button 
            onClick={() => {
              setIsOpen(!isOpen);
              setIsSearchOpen(false); // Tutup search jika menu dibuka
            }}
            className="p-1 hover:bg-black hover:text-white transition-colors border border-black md:border-transparent md:hover:border-black shrink-0"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="font-normal tracking-tighter text-xl md:text-2xl uppercase hover:opacity-70 transition-opacity truncate">
            Subqi Studio
          </Link>
        </div>

        {/* Right: Search & Cart */}
        <div className="flex items-center justify-end gap-2 md:gap-4 h-full border-l-0 md:border-l border-black px-3 md:px-8 shrink-0">
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsOpen(false); // Tutup menu jika search dibuka
              }}
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

      {/* 2. SEARCH OVERLAY - SLIDE DOWN ANIMATION
          Z-INDEX (120) Di bawah Bar tapi di atas Menu. */}
      <div className={`fixed inset-0 top-0 w-full h-fit bg-[#EDEBE6] z-[120] border-b border-black transition-transform duration-700 cubic-bezier(0.85, 0, 0.15, 1) ${
        isSearchOpen ? 'translate-y-0' : '-translate-y-full'
      }`}>
          {/* Spacer Bar */}
          <div className="h-14 md:h-16 w-full border-b border-black"></div>
          
          {/* Search Content */}
          <div className="p-4 md:p-10 max-w-full">
              <div className="flex items-center w-full gap-0 border border-black bg-transparent overflow-hidden">
                  <div className="p-4 border-r border-black flex items-center justify-center bg-transparent">
                      <Search size={24} className="opacity-50"/>
                  </div>
                  <input 
                      type="text" 
                      placeholder="TYPE TO SEARCH ANYTHING AT THIS SITE..." 
                      className="w-full p-4 md:text-2xl font-normal uppercase bg-transparent outline-none placeholder:text-gray-400"
                      autoFocus={isSearchOpen}
                  />
                  <button className="p-4 px-6 hover:bg-black hover:text-white border-l border-black transition-colors md:text-xl font-bold">
                      SEARCH
                  </button>
              </div>
            
          </div>
      </div>

      {/* 3. FULL NAVIGATION MENU - SLIDE DOWN ANIMATION
          Z-INDEX (110) Layer paling bawah. */}
      <div className={`fixed inset-0 top-0 w-full h-screen bg-[#EDEBE6] z-[110] transition-transform duration-700 cubic-bezier(0.85, 0, 0.15, 1) flex flex-col ${
        isOpen ? 'translate-y-0' : '-translate-y-full'
      }`}>
          {/* Spacer Bar */}
          <div className="h-14 md:h-16 w-full border-b border-black bg-[#EDEBE6] flex-shrink-0"></div>

          <div className="flex-1 overflow-y-auto pt-0"> 
              <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
                  {/* Kolom 1 */}
                  <div className="flex flex-col border-r-0 md:border-r border-black md:pt-10">
                      {menuItems.slice(0, 4).map((item) => (
                        <Link 
                          key={item} 
                          to={`/${item.toLowerCase()}`}
                          className="text-3xl md:text-6xl font-normal uppercase tracking-tighter px-3 md:px-8 py-6 md:py-10 border-b border-black hover:bg-black hover:text-white transition-all flex justify-between items-center group"
                        >
                          <span>{item}</span>
                          <ArrowRight size={32} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      ))}
                  </div>

                  {/* Kolom 2 */}
                  <div className="flex flex-col md:pt-10">
                      {menuItems.slice(4).map((item) => (
                        <Link 
                          key={item} 
                          to={`/${item.toLowerCase()}`}
                          className="text-3xl md:text-6xl font-normal uppercase tracking-tighter px-3 md:px-8 py-6 md:py-10 border-b border-black hover:bg-black hover:text-white transition-all flex justify-between items-center group"
                        >
                          <span>{item}</span>
                          <ArrowRight size={32} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      ))}
                      <div className="flex-1 border-b border-black md:border-b-0"></div>
                  </div>
              </div>

              <div className="p-3 md:px-8 py-10 opacity-30">
                  <div className="font-bold uppercase text-[10px] tracking-widest">Subqi Studio HQ — Jakarta, ID</div>
              </div>
          </div>
      </div>
    </nav>
  );
};

export default Navbar;