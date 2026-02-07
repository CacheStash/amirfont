import React, { useRef, useState, useEffect } from 'react';
import TypeTester from '../components/TypeTester';
import { supabase } from '../lib/supabase';
import { FontConfig } from '../types';
import { MousePointer2, MoveRight, Circle, Square, Triangle, X } from 'lucide-react';

// --- GRAPHIC COMPONENT ---
const BrutalistGraphic = () => (
  <div className="flex gap-1">
    <Circle size={24} strokeWidth={1.5} className="fill-transparent stroke-black" />
    <Square size={24} strokeWidth={1.5} className="fill-black stroke-black" />
    <Triangle size={24} strokeWidth={1.5} className="fill-transparent stroke-black" />
  </div>
);

const DUMMY_LIBRARY = [
  "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.",
  "The quick brown fox jumps over the lazy dog, showcasing the elegant curves and sharp terminals of this unique typeface.",
  "Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.",
  "A wonderful serenity has taken possession of my entire soul, like these sweet mornings of spring which I enjoy with my whole heart.",
  "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account."
];

// --- FLUID TEXT COMPONENT ---
const FluidText: React.FC<{ text: string; className?: string; baseWeight?: number; maxWeight?: number }> = ({ 
  text, 
  className = "",
  baseWeight = 900,
  maxWeight = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);

  if (charsRef.current.length !== text.length) {
    charsRef.current = Array(text.length).fill(null);
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    
    charsRef.current.forEach((span) => {
      if (!span) return;
      const rect = span.getBoundingClientRect();
      const distance = Math.sqrt(Math.pow(e.clientX - (rect.left + rect.width / 2), 2) + Math.pow(e.clientY - (rect.top + rect.height / 2), 2));
      const maxDistance = 250; 

      if (distance < maxDistance) {
        const proximity = 1 - (distance / maxDistance);
        const ease = proximity * proximity; 
        const newWeight = baseWeight + ((maxWeight - baseWeight) * ease);
        span.style.fontVariationSettings = `"wght" ${newWeight}`;
      } else {
        span.style.fontVariationSettings = `"wght" ${baseWeight}`;
      }
    });
  };

  const handleMouseLeave = () => {
    charsRef.current.forEach((span) => {
      if (span) span.style.fontVariationSettings = `"wght" ${baseWeight}`;
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block cursor-default ${className}`}
      aria-label={text}
    >
      {text.split('').map((char, i) => (
        <span
          key={i}
          ref={(el) => { charsRef.current[i] = el }}
          className="inline-block transition-[font-variation-settings] duration-150 ease-out will-change-[font-variation-settings]"
          style={{ 
            fontFamily: '"Roboto Flex", sans-serif', 
            fontVariationSettings: `"wght" ${baseWeight}` 
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
};

// --- MAIN HOME COMPONENT ---
const Home: React.FC = () => {
  const [fonts, setFonts] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

  useEffect(() => {
    if (fonts.length > 0) {
      const styleId = 'dynamic-fonts-css';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      const fontFaceRules = fonts.flatMap(f => {
        const files = Array.isArray(f.font_files) ? f.font_files : [f.file_url];
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

  const filteredFonts = activeTag 
    ? fonts.filter(font => {
        const tags = Array.isArray(font.tags) ? font.tags : (typeof font.tags === 'string' ? font.tags.split(',') : []);
        return tags.some((t: string) => t.trim().toLowerCase() === activeTag.toLowerCase());
      })
    : fonts;

  return (
    <>
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      {/* OVERFLOW-X-HIDDEN ADDED HERE TO FIX MOBILE SCROLL ISSUE */}
      <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden">
        <header className="w-full border-b border-black bg-transparent relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[600px] h-[400px] pointer-events-none z-0">
             <div 
                className="w-full h-full mix-blend-multiply blur-[60px]"
                style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.8) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(253, 186, 116, 0) 100%)' }}
             />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_450px] relative z-10">
            <div className="p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-black">
              <div className="flex flex-col items-start gap-0 w-full uppercase">
                <FluidText text="Made of Quiet Lines," className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.9] md:leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
                <FluidText text="Shaped Into Living Type," className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.9] md:leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
                <FluidText text="Read In Every Place." className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.9] md:leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
              </div>
            </div>
            <div className="flex flex-col justify-between p-6 md:p-8 min-h-[250px] md:min-h-auto">
              <div className="hidden md:block"></div>
              <div className="flex flex-col items-end gap-6 text-right">
                <button 
                  onClick={() => document.getElementById('collection-start')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group flex items-center gap-2 text-sm font-bold border border-black px-4 py-2 bg-transparent hover:bg-black hover:text-white transition-all"
                >
                  <MousePointer2 size={16} />
                  <span>START YOUR COLLECTION</span>
                </button>
                <div className="font-mono text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed">
                  <p>Find Your Typeface.</p>
                  <p>Begin Today.</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {activeTag && (
          <div className="w-full border-b border-black bg-white/10 backdrop-blur-md px-6 py-4 md:px-8 flex justify-between items-center sticky top-0 z-50 transition-all">
            <div className="font-mono text-xs uppercase font-bold flex items-center gap-2">
              FILTER ACTIVE: <span className="bg-black text-white px-2 py-1 rounded-full">{activeTag}</span>
            </div>
            <button onClick={() => setActiveTag(null)} className="flex items-center gap-1 text-xs font-bold uppercase hover:underline">
              <X size={14} /> Clear Filter
            </button>
          </div>
        )}

        <main id="collection-start" className="w-full px-0">
          {filteredFonts.length > 0 ? (
            filteredFonts.map((font, index) => {
              const isEven = index % 2 === 0; 
              // DESKTOP: Zig Zag logic
              // MOBILE: Always single column grid
              const gridLayoutClass = isEven ? "md:grid-cols-[450px_1fr_150px]" : "md:grid-cols-[150px_1fr_450px]";
              
              const displayFont = {
                ...font,
                family: `"${font.name}"`,
                tags: Array.isArray(font.tags) ? font.tags : (typeof font.tags === 'string' ? font.tags.split(',') : []),
                styleCount: Array.isArray(font.font_files) ? font.font_files.length : 1,
                randomText: DUMMY_LIBRARY[index % DUMMY_LIBRARY.length]
              };
              const promo = getActivePromo(font.id || '');
              const basePrice = font.price || 25;

              return (
                <section key={font.id} className={`border-b border-black grid grid-cols-1 ${gridLayoutClass}`}>
                  
                  {/* 1. INFO COLUMN */}
                  {/* MOBILE: Always Order 1. DESKTOP: Zig-Zag (Order 1 or 3) */}
                  <div className={`p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 order-1 ${isEven ? 'md:order-1 md:border-r border-black' : 'md:order-3 md:border-l border-black'}`}>
                    <div>
                      {/* Header: Title Only (Tags moved to bottom for mobile) */}
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="flex-1">
                          <h2 className="text-2xl md:text-3xl font-normal uppercase tracking-tight leading-none mb-1">{font.name}</h2>
                          <span className="block font-mono text-[10px] md:text-base font-bold text-gray-500 uppercase">
                              {displayFont.styleCount} STYLES
                          </span>
                        </div>
                      </div>

                      <div className="hidden md:block mb-8"><BrutalistGraphic /></div>
                      
                      {/* Desktop Tags (Hidden on Mobile) */}
                      <div className="hidden md:flex flex-wrap gap-2 text-[10px] font-mono uppercase mb-6">
                        {displayFont.tags.map((tag: string) => (
                          <button 
                            key={tag} 
                            onClick={() => setActiveTag(activeTag === tag.trim() ? null : tag.trim())} 
                            className={`border px-3 py-1 rounded-full font-bold ${activeTag === tag.trim() ? 'bg-black text-white border-black' : 'border-black text-black hover:bg-black hover:text-white'}`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                           <span className="inline-block border border-black rounded-full px-3 py-1 font-mono italic text-[11px] md:text-[12px] titlecase text-black bg-transparent leading-none">
                             starting at
                           </span>
                           {promo && (
                             <span className="inline-block border border-orange-600 rounded-full px-3 py-1 font-mono font-bold text-[11px] md:text-[12px] uppercase text-red-600 bg-transparent leading-none">
                               {promo.discount_percent}% OFF
                             </span>
                           )}
                        </div>
                        <div className="flex flex-col">
                           {promo ? (
                             <div className="flex items-start gap-3 md:gap-5">
                               <span className="text-8xl sm:text-8xl md:text-9xl font-light tracking-tighter text-black leading-[0.8]">
                                 ${(basePrice * (1 - (promo.discount_percent / 100))).toFixed(0)}
                               </span>
                               <div className="flex flex-col items-center gap-1 md:gap-2 mt-2 md:mt-4 w-fit">
                                 <div className="relative w-full text-center">
                                   <span className="text-4xl md:text-5xl font-bold text-red-600 font-mono leading-none">
                                     ${basePrice}
                                   </span>
                                   <div className="absolute top-[50%] left-[-5%] w-[110%] h-[2px] bg-orange-600"></div>
                                 </div>
                                 <span className="inline-block border border-orange-600 rounded-full px-2 md:px-3 py-1 font-mono font-bold text-[9px] md:text-[10px] uppercase text-red-600 bg-transparent whitespace-nowrap text-center w-full min-w-max">
                                   {calculateDaysLeft(promo.end_date)}
                                 </span>
                               </div>
                             </div>
                           ) : (
                             <div className="text-8xl sm:text-8xl md:text-9xl font-light tracking-tighter text-black leading-[0.8]">
                               ${basePrice}
                             </div>
                           )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed font-mono mt-4">{font.description}</p>

                      {/* MOBILE TAGS: Moved here (Below Description - Bottom Left) */}
                      <div className="flex flex-wrap gap-2 mt-6 md:hidden">
                        {displayFont.tags.map((tag: string) => (
                          <button 
                            key={tag} 
                            onClick={() => setActiveTag(activeTag === tag.trim() ? null : tag.trim())}
                            className="border border-black px-2 py-1 rounded-full font-bold text-[10px] uppercase whitespace-nowrap bg-transparent text-black"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. TESTER COLUMN */}
                  {/* MOBILE: Always Order 2. DESKTOP: Always Middle (Order 2) */}
                  <div className="md:order-2 h-full border-b md:border-b-0 relative order-2">
                     <div className="h-full">
                        <TypeTester 
                          config={displayFont} 
                          isEven={isEven}
                          defaultText={isEven ? "The quick brown fox jumps over the lazy dog." : undefined} 
                        />
                     </div>
                  </div>

                  {/* 3. ACTION COLUMN */}
                  {/* MOBILE: Always Order 3. DESKTOP: Zig-Zag (Order 3 or 1) */}
                  <div className={`p-4 flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer group order-3 ${isEven ? 'md:order-3 md:border-l border-black' : 'md:order-1 md:border-r border-black'}`}>
                     <MoveRight size={48} strokeWidth={1} className="transition-transform duration-500 group-hover:scale-125" />
                  </div>
                </section>
              );
            })
          ) : (
             <div className="p-20 text-center font-mono uppercase text-gray-400">
               No fonts found with tag "{activeTag}". 
               <button onClick={() => setActiveTag(null)} className="underline ml-2 text-black font-bold">Clear Filter</button>
             </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Home;