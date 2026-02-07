import React, { useRef, useState, useEffect } from 'react';
import TypeTester from '../components/TypeTester';
import { supabase } from '../lib/supabase';
import { FontConfig } from '../types';
import { MousePointer2, MoveRight, Circle, Square, Triangle, X } from 'lucide-react'; // Tambah icon X untuk clear filter

// --- IMPORTS FONT ASSETS ---
import RoyalGrandeFile from '../fonts/RoyalGrande/Royal Grande Variable.ttf';
import ThanjavurFile from '../fonts/Thanjavur/Thanjavur-Var.ttf';
import SpaceMonoFile from '../fonts/Space_Mono/SpaceMono-Regular.ttf'; 

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
  const [activeTag, setActiveTag] = useState<string | null>(null); // State Filter Tag

  useEffect(() => {
    const fetchFonts = async () => {
      const { data } = await supabase
        .from('fonts')
        .select('*')
        .order('created_at', { ascending: false }); // Hapus limit agar filtering efektif

      if (data) {
        setFonts(data);
        
        const styleId = 'dynamic-fonts-css';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }

        const fontFaceRules = data.flatMap(f => {
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
    };
    fetchFonts();
  }, []);

  // LOGIC FILTERING
  const filteredFonts = activeTag 
    ? fonts.filter(font => {
        const tags = Array.isArray(font.tags) ? font.tags : (typeof font.tags === 'string' ? font.tags.split(',') : []);
        // Case insensitive check
        return tags.some((t: string) => t.trim().toLowerCase() === activeTag.toLowerCase());
      })
    : fonts;

  return (
    <>
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent">
        
        {/* HEADER */}
        <header className="w-full border-b border-black bg-transparent relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[600px] h-[400px] pointer-events-none z-0">
             <div 
                className="w-full h-full mix-blend-multiply blur-[60px]"
                style={{ 
                  background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.8) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(253, 186, 116, 0) 100%)',
                }}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_450px] relative z-10">
            <div className="p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-black">
              <div className="flex flex-col items-start gap-0 w-full uppercase">
                <FluidText text="Made of Quiet Lines," className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
                <FluidText text="Shaped Into Living Type," className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
                <FluidText text="Read In Every Place." className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
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

        {/* ACTIVE FILTER BAR (Muncul saat ada tag aktif) */}
        {activeTag && (
          <div className="w-full border-b border-black bg-yellow-50 p-4 flex justify-between items-center sticky top-0 z-50 transition-all">
            <div className="font-mono text-xs uppercase font-bold flex items-center gap-2">
              FILTER ACTIVE: <span className="bg-black text-white px-2 py-1 rounded-full">{activeTag}</span>
            </div>
            <button 
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-1 text-xs font-bold uppercase hover:underline"
            >
              <X size={14} /> Clear Filter
            </button>
          </div>
        )}

        {/* MAIN LOOP */}
        <main id="collection-start" className="w-full px-0">
          {filteredFonts.length > 0 ? (
            filteredFonts.map((font, index) => {
              const isEven = index % 2 === 0; 
              const gridLayoutClass = isEven ? "md:grid-cols-[450px_1fr_150px]" : "md:grid-cols-[150px_1fr_450px]";

              const displayFont = {
                ...font,
                family: `"${font.name}"`,
                tags: Array.isArray(font.tags) ? font.tags : (typeof font.tags === 'string' ? font.tags.split(',') : ['Custom']),
                axes: Array.isArray(font.axes) ? font.axes : [], 
                features: Array.isArray(font.features) ? font.features : [], 
                styleCount: Array.isArray(font.font_files) ? font.font_files.length : 1,
                randomText: DUMMY_LIBRARY[index % DUMMY_LIBRARY.length]
              };

              return (
                <section 
                  key={font.id} 
                  className={`border-b border-black grid grid-cols-1 ${gridLayoutClass}`}
                >
                  
                  {/* 1. INFO COLUMN */}
                  <div className={`p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 ${isEven ? 'md:order-1 md:border-r border-black' : 'md:order-3 md:border-l border-black'}`}>
                    <div>
                      <h2 className="text-3xl font-normal uppercase tracking-tight mb-1">{font.name}</h2>
                      <span className="block font-mono text-base font-bold text-gray-500 mb-8">
                          {Array.isArray(font.font_files) && font.font_files.length > 0 ? font.font_files.length : 1} STYLES
                      </span>
                      <div className="mb-8"><BrutalistGraphic /></div>
                      
                      {/* TAGS FILTER BUTTONS */}
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase mb-6">
                        {displayFont.tags.map((tag: string) => {
                          const isActive = activeTag === tag.trim();
                          return (
                            <button 
                              key={tag} 
                              onClick={() => setActiveTag(isActive ? null : tag.trim())}
                              className={`border px-3 py-1 rounded-full transition-all duration-200 font-bold ${
                                isActive 
                                  ? 'bg-black text-white border-black' 
                                  : 'border-gray-300 text-gray-700 hover:border-black hover:bg-black hover:text-white'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      {/* STARTING AT (OVAL BORDER) */}
                       <span className="inline-block border border-gray-300 rounded-full px-3 py-1 font-mono italic text-[11px] titlecase text-gray-500 mb-4 bg-transparent">
                         Starting at
                       </span>
                       <div className="text-9xl font-light tracking-tighter mb-4 -ml-1">
                        ${font.price || 25}
                       </div>
                       <p className="text-gray-600 text-sm leading-relaxed font-mono">{font.description}</p>
                    </div>
                  </div>

                  {/* 2. TESTER COLUMN (Middle) */}
                  <div className="md:order-2 h-full border-b md:border-b-0 relative">
                     <div className="h-full">
                        <TypeTester 
                          config={displayFont} 
                          isEven={isEven}
                          defaultText={isEven ? "The quick brown fox jumps over the lazy dog." : undefined} 
                        />
                     </div>
                  </div>

                  {/* 3. ACTION COLUMN */}
                  <div className={`p-4 flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer group ${isEven ? 'md:order-3 md:border-l border-black' : 'md:order-1 md:border-r border-black'}`}>
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