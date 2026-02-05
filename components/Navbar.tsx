// --- Context Anchor (Above) ---
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, ShoppingBag, ArrowRight } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // State untuk deteksi scroll
  const location = useLocation();

  // Effect untuk mendeteksi scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logic: Menu Desktop ditiadakan, diganti Hamburger Menu untuk semua ukuran
  
  return (
// --- PARTIAL FIX ---
    // Navbar Container Utama: Transisi warna background & blur saat discroll
    <nav className={`w-full border-b border-black sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-[#EDEBE6]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#EDEBE6]/60' 
        : 'bg-transparent'
    }`}>
     {/* Top Bar Layout */}
      <div className="w-full flex justify-between items-center h-14 md:h-16 px-0 relative z-50">
        
        {/* Left: Menu Trigger & Logo - Boxed with Right Border to align with Grid */}
        <div className="flex items-center gap-4 h-full border-r border-black px-4 md:px-8 w-auto md:w-[450px] shrink-0">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="font-mono font-bold tracking-tighter text-xl uppercase hover:opacity-70 transition-opacity">
            Subqi Studio
          </Link>
        </div>

        {/* Right: Search & Cart */}
        <div className="flex items-center justify-end gap-4 h-full border-l border-black px-4 md:px-8 min-w-[150px] shrink-0">
           {/* Search Trigger */}
           <button
             onClick={() => setIsSearchOpen(!isSearchOpen)}
             className={`p-1 transition-colors border border-transparent ${isSearchOpen ? 'bg-black text-white' : 'hover:bg-black hover:text-white hover:border-black'}`}
           >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
           </button>

           {/* Cart Button */}
           <button className="flex items-center gap-2 font-mono text-xs md:text-sm font-bold border border-black px-3 py-1 hover:bg-black hover:text-white transition-all">
              <ShoppingBag size={16} />
              <span>CART (0)</span>
           </button>
        </div>
      </div>

     {/* Search Form Overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 w-full border-b border-black bg-[#EDEBE6]/90 px-4 md:px-8 py-4 animate-in slide-in-from-top-2 duration-200 z-40 backdrop-blur-md">
            <div className="flex items-center w-full gap-0 border border-black bg-transparent">
                <div className="p-3 border-r border-black bg-transparent">
                    <Search size={20} className="opacity-50"/>
                </div>
                <input 
                    type="text" 
                    placeholder="TYPE TO SEARCH FONTS..." 
                    className="w-full p-3 font-mono text-sm uppercase bg-transparent outline-none placeholder:text-gray-400"
                    autoFocus
                />
                <button className="p-3 hover:bg-black hover:text-white border-l border-black transition-colors">
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
      )}

      {/* Full Screen Menu Overlay (Brutalist Style) */}
      {isOpen && (
        <div className="fixed top-[57px] md:top-[65px] left-0 w-full h-[calc(100vh-60px)] bg-[#EDEBE6]/95 border-t border-black z-40 p-0 flex flex-col md:flex-row backdrop-blur-xl">
            
            {/* Menu Links Column */}
            <div className="w-full md:w-1/2 border-r-0 md:border-r border-black p-8 md:p-12 flex flex-col gap-6">
                 {['Fonts', 'License', 'Blog', 'About', 'Contact'].map((item) => (
                    <Link 
                        key={item} 
                        to={`/${item.toLowerCase()}`}
                        className="text-4xl md:text-6xl font-black uppercase tracking-tight hover:italic hover:translate-x-4 transition-all"
                        onClick={() => setIsOpen(false)}
                    >
                        {item}
                    </Link>
                 ))}
            </div>

            {/* Info Column (Hidden on mobile small) */}
            <div className="hidden md:flex w-1/2 p-12 flex-col justify-between">
                <div className="font-mono text-sm">
                    <p className="uppercase font-bold mb-4">Office</p>
                    <p>Subqi Studio HQ</p>
                    <p>Jakarta, Indonesia</p>
                </div>
                <div className="text-9xl font-black opacity-5 pointer-events-none select-none">
                    MENU
                </div>
            </div>
        </div>
      )}
    </nav>
  );
};
// --- END FIX ---
// --- Context Anchor (Below) ---
export default Navbar;