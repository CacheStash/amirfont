import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, ShoppingBag, ArrowRight } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`w-full border-b border-black sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-[#EDEBE6]/80 backdrop-blur-md' : 'bg-transparent'
    }`}>
      <div className="w-full flex justify-between items-center h-14 md:h-16 px-0 relative z-50 overflow-hidden">
        
        {/* LEFT SECTION: LOGO & MENU */}
        <div className="flex items-center gap-2 md:gap-4 h-full border-r border-black px-4 md:px-8 flex-1 md:flex-none md:w-[450px]">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black shrink-0"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="font-mono font-bold tracking-tighter text-lg md:text-xl uppercase hover:opacity-70 transition-opacity truncate">
            Subqi Studio
          </Link>
        </div>

        {/* RIGHT SECTION: SEARCH & CART (FIXED OVERFLOW) */}
        <div className="flex items-center justify-end gap-2 md:gap-4 h-full border-l border-black px-4 md:px-8 shrink-0 bg-inherit">
           <button
             onClick={() => setIsSearchOpen(!isSearchOpen)}
             className={`p-1 transition-colors border border-transparent ${isSearchOpen ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
           >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
           </button>

           <button className="flex items-center gap-2 font-mono text-[10px] md:text-sm font-bold border border-black px-2 md:px-3 py-1 hover:bg-black hover:text-white transition-all whitespace-nowrap">
              <ShoppingBag size={16} className="shrink-0" />
              <span>CART (0)</span>
           </button>
        </div>
      </div>

      {/* SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 w-full border-b border-black bg-[#EDEBE6]/90 px-4 md:px-8 py-4 z-40 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center w-full border border-black bg-transparent">
                <div className="p-3 border-r border-black"><Search size={20} className="opacity-50 text-black"/></div>
                <input 
                  type="text" 
                  placeholder="TYPE TO SEARCH..." 
                  className="w-full p-3 font-mono text-sm uppercase bg-transparent outline-none placeholder:text-gray-400 text-black"
                  autoFocus
                />
                <button className="p-3 hover:bg-black hover:text-white border-l border-black transition-colors text-black">
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
      )}

      {/* MENU OVERLAY */}
      {isOpen && (
        <div className="fixed top-[57px] md:top-[65px] left-0 w-full h-[calc(100vh-60px)] bg-[#EDEBE6]/95 border-t border-black z-40 flex flex-col md:flex-row backdrop-blur-xl overflow-y-auto">
            <div className="w-full md:w-1/2 border-r-0 md:border-r border-black p-8 md:p-12 flex flex-col gap-6">
                 {['Fonts', 'License', 'Blog', 'About', 'Contact'].map((item) => (
                    <Link 
                      key={item} 
                      to={`/${item.toLowerCase()}`} 
                      className="text-4xl md:text-6xl font-black uppercase tracking-tight hover:italic hover:translate-x-4 transition-all text-black" 
                      onClick={() => setIsOpen(false)}
                    >
                      {item}
                    </Link>
                 ))}
            </div>
            <div className="hidden md:flex w-1/2 p-12 flex-col justify-between">
                <div className="font-mono text-sm text-black">
                    <p className="font-bold mb-4 uppercase">Office</p>
                    <p>Subqi Studio HQ</p>
                    <p>Jakarta, Indonesia</p>
                </div>
                <div className="text-9xl font-black opacity-5 pointer-events-none select-none text-black">MENU</div>
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;