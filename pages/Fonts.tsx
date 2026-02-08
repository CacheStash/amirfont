import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';

const resolvePreviewUrl = (url: string) => {
  if (!url) return null;
  // Jika sudah URL lengkap (http/https) atau path absolut (/), gunakan langsung
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  // Jika hanya nama file, tambahkan prefix path (sesuaikan dengan folder public/api Anda)
  return `/api/previews/${url}`; 
};

const DUMMY_LIBRARY = [
  "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.",
  "The quick brown fox jumps over the lazy dog, showcasing the elegant curves and sharp terminals of this unique typeface.",
  "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.",
  "A wonderful serenity has taken possession of my entire soul, like these sweet mornings of spring which I enjoy with my whole heart.",
  "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account."
];


// --- SUB-COMPONENT: DUAL IMAGE SLIDER ---
const PreviewSlider: React.FC<{ images: string[] }> = ({ images }) => {
  const [index, setIndex] = useState(0);
  // Pastikan ada gambar dummy jika database kosong
  const hasImages = images && images.length > 0;
  const displayImages = hasImages ? images : ['/api/placeholder/400/200', '/api/placeholder/400/201'];

  useEffect(() => {
    if (!hasImages) return; // Jangan auto-slide jika hanya placeholder
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % displayImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [displayImages.length, hasImages]);

  // Handler jika gambar gagal di-load (broken link)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/api/placeholder/400/200'; // Fallback ke placeholder
    e.currentTarget.onerror = null; // Mencegah loop error
  };

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
  const [promos, setPromos] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fontsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (fonts.length > 0) {
      const styleId = 'library-fonts-css';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      const fontFaceRules = fonts.flatMap(f => {
        const files = Array.isArray(f.font_files) ? f.font_files : [f.file_url];
        // Pastikan path sesuai dengan API route Anda (mirip Home.tsx)
        return files.map((file: string, idx: number) => `
          @font-face {
            font-family: "${f.name}-${idx}";
            src: url("/api/fonts/${file}");
            font-display: swap;
          }
        `);
      }).join('\n');
      styleEl.innerHTML = fontFaceRules;
    }
  }, [fonts]);

  const fetchData = async () => {
    setLoading(true);
    const [fontsRes, promosRes] = await Promise.all([
      supabase.from('fonts').select('*').order('created_at', { ascending: false }),
      supabase.from('promotions').select('*').eq('is_active', true)
    ]);
    
    if (fontsRes.data) setFonts(fontsRes.data);
    if (promosRes.data) setPromos(promosRes.data);
    setLoading(false);
  };

  const getActivePromo = (fontId: string) => {
    const now = new Date();
    return promos.find(p => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      const isTargeted = p.type === 'global' || p.font_ids?.includes(fontId);
      return now >= start && now <= end && isTargeted;
    });
  };

  const calculateDaysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    if (days <= 0) return "Ends today";
    return `${days} day${days > 1 ? 's' : ''} left`;
  };

  // Logic Pagination
  const totalPages = Math.ceil(fonts.length / fontsPerPage);
  const currentFonts = fonts.slice((currentPage - 1) * fontsPerPage, currentPage * fontsPerPage);

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden">
      {/* Background Orbs agar selaras dengan Home */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />
      
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
              const promo = getActivePromo(font.id);
              const basePrice = font.price || 25;

              // Pilih teks random berdasarkan index
              const randomText = DUMMY_LIBRARY[idx % DUMMY_LIBRARY.length];
              // Gunakan index 0 sebagai default view
              const fontFamilyStyle = `"${font.name}-0"`;

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
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block border border-black rounded-full px-3 py-0.5 font-mono italic text-[10px] titlecase">
                          starting at
                        </span>
                        {promo && (
                           <span className="inline-block border border-orange-600 rounded-full px-2 py-0.5 font-mono font-bold text-[10px] uppercase text-red-600 bg-transparent leading-none">
                             {promo.discount_percent}% OFF
                           </span>
                        )}
                      </div>

                      {promo ? (
                        <div className="flex flex-col items-start">
                           <div className="flex items-baseline gap-3">
                             <span className="text-6xl font-light tracking-tighter leading-none text-black">
                               ${(basePrice * (1 - (promo.discount_percent / 100))).toFixed(0)}
                             </span>
                             <div className="relative">
                               <span className="text-2xl font-bold text-red-600 font-mono leading-none">
                                 ${basePrice}
                               </span>
                               <div className="absolute top-[50%] left-[-10%] w-[120%] h-[2px] bg-orange-600"></div>
                             </div>
                           </div>
                           <span className="text-[10px] font-mono font-bold uppercase text-red-600 mt-1">
                             {calculateDaysLeft(promo.end_date)}
                           </span>
                        </div>
                      ) : (
                        <div className="text-6xl font-light tracking-tighter leading-none">
                          ${basePrice}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* b. TYPE VIEW COLUMN */}
                  <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex items-center overflow-hidden bg-transparent">
                    <span 
                      className="text-4xl md:text-6xl break-words md:whitespace-nowrap opacity-90 transition-opacity group-hover:opacity-100"
                      style={{ fontFamily: fontFamilyStyle }}
                    >
                      {randomText}
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