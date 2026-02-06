import React, { useRef } from 'react';
import TypeTester from '../components/TypeTester';
import { FontConfig } from '../types';
import { MousePointer2, MoveRight, Circle, Square, Triangle } from 'lucide-react';

// --- IMPORTS FONT ASSETS ---
// Pastikan path ini sesuai dengan struktur foldermu
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

// --- FONT CONFIGURATIONS ---
const FONT_ROYAL_GRANDE: FontConfig = {
  name: 'Royal Grande',
  family: '"Royal Grande Variable"',
  price: 25,
  styleCount: 1,
  file: RoyalGrandeFile,
  description: 'A custom variable font with OpenType capabilities. Testing weight axis and ligatures.',
  tags: ['Variable', 'Serif', 'Custom'],
  axes: [
    { tag: 'wght', name: 'Weight', min: 100, max: 900, default: 400 },
  ],
  features: [
    { tag: 'liga', name: 'Standard Ligatures' },
    { tag: 'dlig', name: 'Discretionary Lig' },
    { tag: 'calt', name: 'Contextual Alt' },
    { tag: 'kern', name: 'Kerning' },
  ]
};

const FONT_THANJAVUR: FontConfig = {
  name: 'Thanjavur',
  family: '"Thanjavur Variable"',
  file: ThanjavurFile,
  description: 'Testing Thanjavur variable font features and glyph detection.',
  tags: ['Variable', 'Display', 'Custom'],
  axes: [
    { tag: 'wght', name: 'Weight', min: 100, max: 900, default: 400 },
  ],
  features: [
    { tag: 'liga', name: 'Standard Ligatures' },
    { tag: 'ss01', name: 'Stylistic Set 1' },
  ]
};

const FONT_SPACE_MONO: FontConfig = {
  name: 'Space Mono',
  family: '"Space Mono"',
  file: SpaceMonoFile,
  description: 'A geometric monospace typeface with a brutalist edge. Standard static font.',
  tags: ['Monospaced', 'Static', 'Display'],
  axes: [], 
  features: [
      { tag: 'liga', name: 'Ligatures' }
  ]
};

const FONT_INTER_OT: FontConfig = {
  name: 'Inter',
  family: '"Inter"',
  file: '../fonts/Inter/Inter-VariableFont_slnt,wght.ttf', 
  description: 'A masterpiece of versatility. Features extensive OpenType capabilities.',
  tags: ['OpenType', 'Sans-Serif', 'Neutral'],
  axes: [
      { tag: 'wght', name: 'Weight', min: 100, max: 900, default: 400 },
      { tag: 'slnt', name: 'Slant', min: -10, max: 0, default: 0, unit: 'deg' }
  ], 
  features: [
    { tag: 'calt', name: 'Contextual Alt' },
    { tag: 'dlig', name: 'Discretionary Lig' },
    { tag: 'ss01', name: 'Alt. Digits' },
    { tag: 'ss02', name: 'Alt. G & a' },
    { tag: 'zero', name: 'Slashed Zero' },
  ]
};

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
  return (
    <>
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent">
        
        {/* HEADER */}
        
        {/* UPDATED: Tambahkan relative dan overflow-hidden agar circle tidak bocor keluar header jika tidak diinginkan */}
        <header className="w-full border-b border-black bg-transparent relative overflow-hidden">
          
          {/* NEW: Blurry Circle di Header (Kanan Atas) */}
          <div className="absolute -top-20 -right-20 w-[600px] h-[400px] pointer-events-none z-0">
             <div 
                className="w-full h-full mix-blend-multiply blur-[60px]"
                style={{ 
                  // Copy gradient yang sama dari TypeTester
                  background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.8) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(253, 186, 116, 0) 100%)',
                }}
             />
          </div>

          {/* Pastikan konten grid memiliki relative z-10 agar muncul di DEPAN circle */}
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

        {/* MAIN LOOP */}
        <main className="w-full px-0">
          {[FONT_ROYAL_GRANDE, FONT_THANJAVUR, FONT_SPACE_MONO, FONT_INTER_OT].map((font, index) => {
            const isEven = index % 2 === 0; 
            const gridLayoutClass = isEven ? "md:grid-cols-[450px_1fr_150px]" : "md:grid-cols-[150px_1fr_450px]";

            return (
              <section 
                key={font.name} 
                id={index === 0 ? "collection-start" : undefined}
                className={`border-b border-black grid grid-cols-1 ${gridLayoutClass}`}
              >
                
                {/* 1. INFO COLUMN */}
                <div className={`p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 ${isEven ? 'md:order-1 md:border-r border-black' : 'md:order-3 md:border-l border-black'}`}>
                  <div>
                    <h2 className="text-3xl font-normal uppercase tracking-tight mb-1">{font.name}</h2>
                    <span className="block font-mono text-base font-bold text-gray-500 mb-8">
                        {font.styleCount || 1} STYLES
                    </span>
                    <div className="mb-8"><BrutalistGraphic /></div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase text-gray-500 mb-6">
                      {font.tags.map(tag => (
                        <span key={tag} className="border border-gray-300 px-2 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                     <div className="text-9xl font-light tracking-tighter mb-4 -ml-1">
                        ${font.price || 25}
                     </div>
                     <p className="text-gray-600 text-sm leading-relaxed font-mono">{font.description}</p>
                  </div>
                </div>

                {/* 2. TESTER COLUMN (Middle) */}
                <div className="md:order-2 h-full border-b md:border-b-0 relative">
                   <div className="h-full">
                      {/* PASSING 'isEven' PROP HERE */}
                      <TypeTester 
                        config={font} 
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
          })}
        </main>
      </div>
    </>
  );
};

export default Home;