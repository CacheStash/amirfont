import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Fonts', path: '/fonts' },
    { name: 'License', path: '/license' },
    { name: 'Blog', path: '/blog' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b-0">
      {/* KUNCI: Struktur container ini harus SAMA PERSIS dengan di Home.tsx */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Logo - Kiri Rata */}
        <Link to="/" className="group cursor-pointer">
          <h1 className="text-2xl font-black tracking-tighter uppercase" style={{ fontFamily: '"Roboto Flex", sans-serif' }}>
            SUBQI<span className="text-transparent text-stroke-1 group-hover:text-black transition-colors">STUDIO</span>
          </h1>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-sm font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4 ${
                isActive(item.path) ? 'underline' : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
          {/* Cart Button - Kanan Rata */}
          <button className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-all">
            Cart (0)
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t-[3px] border-black bg-white absolute w-full left-0">
          <div className="flex flex-col p-4 gap-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="text-lg font-bold uppercase tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;