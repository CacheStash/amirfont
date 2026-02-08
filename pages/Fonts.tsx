import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';

// --- SUB-COMPONENT: DUAL IMAGE SLIDER ---
const PreviewSlider: React.FC<{ images: string[] }> = ({ images }) => {
  const [index, setIndex] = useState(0);
  // Pastikan ada gambar dummy jika database kosong
  const displayImages = images && images.length > 0 ? images : ['/api/placeholder/400/200', '/api/placeholder/400/201'];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % displayImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [displayImages.length]);

  // Baris atas (Geser Kanan) dan Baris bawah (Geser Kiri)
  // Logic: Index yang berbeda agar gambar tidak sama persis atas-bawah
  const topIndex = index;
  const bottomIndex = (index + 1) % displayImages.length;

  return (
    <div className="hidden md:grid grid-rows-2 h-full w-[300px] border-r border-black">
      {/* Baris Atas */}
      <div className="border-b border-black relative overflow-hidden bg-white">
        <div 
          className="flex h-full transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${topIndex * 100}%)` }}
        >
          {displayImages.map((img, i) => (
            <img key={i} src={img} className="min-w-full h-full object-cover grayscale" alt="Font Preview Top" />
          ))}
        </div>
      </div>
      {/* Baris Bawah */}
      <div className="relative overflow-hidden bg-white">
        <div 
          className="flex h-full transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${bottomIndex * 100}%)` }}
        >
          {displayImages.map((img, i) => (
            <img key={i} src={img} className="min-w-full h-full object-cover grayscale" alt="Font Preview Bottom" />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const Fonts: React.FC = () => {
  const [fonts, setFonts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const fontsPerPage = 10;

  useEffect(() => {
    fetchFonts();
  }, []);

  const fetchFonts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('fonts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setFonts(data);
    setLoading(false);
  };

  // Logic Pagination
  const totalPages = Math.ceil(fonts.length / fontsPerPage);
  const currentFonts = fonts.slice((currentPage - 1) * fontsPerPage, currentPage * fontsPerPage);

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden">
      {/* Background Orbs agar selaras dengan Home */}
      <div className="grain-orb-base orb-top-right opacity-50" />
      
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <header className="px-6 py-12 md:px-8 border-b border-black">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            All Fonts
          </h2>
          <p className="font-mono text-xs md:text-sm text-gray-600 uppercase tracking-widest">
            Retail & Custom Typefaces
          </p>
        </header>

        {/* Fonts List Container */}
        <main className="w-full">
          {loading ? (
            <div className="p-20 text-center font-mono uppercase text-gray-400 animate-pulse">
              Loading Library...
            </div>
          ) : currentFonts.length > 0 ? (
            currentFonts.map((font, idx) => {
              const styleCount = Array.isArray(font.font_files) ? font.font_files.length : 1;
              const fontPreviews = Array.isArray(font.font_previews) ? font.font_previews : [];

              return (
                <section key={font.id || idx} className="grid grid-cols-1 md:grid-cols-[280px_1fr_300px_100px] border-b border-black group transition-colors hover:bg-white/50">
                  
                  {/* a. INFO COLUMN */}
                  <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-normal uppercase tracking-tight leading-none mb-1">{font.name}</h3>
                      <span className="block font-mono text-[10px] font-bold text-gray-500 uppercase">
                        {styleCount} STYLES
                      </span>
                    </div>
                    <div className="mt-8">
                      <span className="inline-block border border-black rounded-full px-3 py-0.5 font-mono italic text-[10px] titlecase mb-2">
                        starting at
                      </span>
                      <div className="text-6xl font-light tracking-tighter leading-none">
                        ${font.price || 25}
                      </div>
                    </div>
                  </div>

                  {/* b. TYPE VIEW COLUMN */}
                  <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex items-center overflow-hidden bg-transparent">
                    <span 
                      className="text-4xl md:text-6xl break-words md:whitespace-nowrap opacity-90 transition-opacity group-hover:opacity-100"
                      style={{ fontFamily: `"${font.name}-0"` }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </span>
                  </div>

                  {/* c. PREVIEW IMAGES COLUMN (Dual Slider) */}
                  <PreviewSlider images={fontPreviews} />

                  {/* d. ACTION COLUMN */}
                  <div className="p-4 flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer group/arrow">
                    <MoveRight size={48} strokeWidth={1} className="transition-transform duration-500 group-hover/arrow:scale-125" />
                  </div>

                  {/* 4. MOBILE SPACER (GRID KOSONG): Diperbarui agar selaras dengan Home */}
                  <div className="md:hidden h-12 border-t border-black w-full bg-orange-500/10" />
                </section>
              );
            })
          ) : (
            <div className="p-20 text-center font-mono uppercase text-gray-400">
              No fonts available in the library.
            </div>
          )}
        </main>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <footer className="p-8 flex justify-center items-center gap-8 border-t border-black bg-white/20 backdrop-blur-sm">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border border-black p-3 disabled:opacity-20 hover:bg-black hover:text-white transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="font-mono text-sm font-bold uppercase tracking-widest">
              Page {currentPage} / {totalPages}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border border-black p-3 disabled:opacity-20 hover:bg-black hover:text-white transition-all active:scale-95"
            >
              <ChevronRight size={24} />
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Fonts;