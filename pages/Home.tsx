import React, { useRef } from 'react';
import TypeTester from '../components/TypeTester';
import { FontConfig } from '../types';
import { MousePointer2, MoveRight, Circle, Square, Triangle } from 'lucide-react';

// Graphic Component (Simulasi icon lingkaran disilang di desainmu)
const BrutalistGraphic = () => (
  <div className="flex gap-1">
    <Circle size={24} strokeWidth={1.5} className="fill-transparent stroke-black" />
    <Square size={24} strokeWidth={1.5} className="fill-black stroke-black" />
    <Triangle size={24} strokeWidth={1.5} className="fill-transparent stroke-black" />
  </div>
);

import RoyalGrandeFile from '../fonts/RoyalGrande/Royal Grande Variable.ttf';
import ThanjavurFile from '../fonts/Thanjavur/Thanjavur-Var.ttf';


// -- FONT CONFIGURATIONS --
const FONT_ROYAL_GRANDE: FontConfig = {
  name: 'Royal Grande',
  family: '"Royal Grande Variable"', // Pastikan nama ini sama dengan yang ada di CSS/File Font
  file: RoyalGrandeFile,
  description: 'A custom variable font with OpenType capabilities. Testing weight axis and ligatures.',
  tags: ['Variable', 'Serif', 'Custom'],
  axes: [
    { tag: 'wght', name: 'Weight', min: 100, max: 900, default: 400 },
    // Tambahkan axis lain jika ada, misal: 'opsz', 'wdth'
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
  file: '../fonts/Space_Mono/SpaceMono-Regular.ttf',
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
  file: '../fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf',
  description: 'A masterpiece of versatility. Features extensive OpenType capabilities.',
  tags: ['OpenType', 'Sans-Serif', 'Neutral'],
  axes: [], 
  features: [
    { tag: 'calt', name: 'Contextual Alt' },
    { tag: 'dlig', name: 'Discretionary Lig' },
    { tag: 'ss01', name: 'Alt. Digits' },
    { tag: 'ss02', name: 'Alt. G & a' },
    { tag: 'zero', name: 'Slashed Zero' },
  ]
};

// -- FLUID TEXT COMPONENT --
const FluidText: React.FC<{ text: string; className?: string; baseWeight?: number; maxWeight?: number }> = ({ 
  text, 
  className = "",
  baseWeight = 900, // Default Bold
  maxWeight = 100   // Hover Thin
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
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(Math.pow(e.clientX - charCenterX, 2) + Math.pow(e.clientY - charCenterY, 2));
      const maxDistance = 250; 

      if (distance < maxDistance) {
        const proximity = 1 - (distance / maxDistance);
        const ease = proximity * proximity; 
        const addedWeight = (maxWeight - baseWeight) * ease;
        const newWeight = baseWeight + addedWeight;
        const newWidth = 100 + (25 * ease); 

        span.style.fontVariationSettings = `"wght" ${newWeight}, "wdth" ${newWidth}, "opsz" 14`;
      } else {
        span.style.fontVariationSettings = `"wght" ${baseWeight}, "wdth" 100, "opsz" 14`;
      }
    });
  };

  const handleMouseLeave = () => {
    charsRef.current.forEach((span) => {
      if (span) span.style.fontVariationSettings = `"wght" ${baseWeight}, "wdth" 100, "opsz" 14`;
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
            fontVariationSettings: `"wght" ${baseWeight}, "wdth" 100, "opsz" 14` 
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
};

const Home: React.FC = () => {
  return (
    <div className="bg-[#EDEBE6] text-black font-sans selection:bg-black selection:text-white relative min-h-screen">
      
      {/* Site Header / Navbar Brutalist */}
      <header className="w-full border-b border-black bg-[#EDEBE6]">
    
        {/* Hero Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_450px]">
          
          {/* Left Column: Tagline */}
          <div className="p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-black">
             <div className="flex flex-col items-start gap-0 w-full uppercase">
              <FluidText text="Made of Quiet Lines," className="text-5xl md:text-7xl lg:text-8xl leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
              <FluidText text="Shaped Into Living Type," className="text-5xl md:text-7xl lg:text-8xl leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
              <FluidText text="Read In Every Place." className="text-5xl md:text-7xl lg:text-8xl leading-[0.85] tracking-tight hover:text-gray-700 transition-colors duration-300" />
            </div>
          </div>

          {/* Right Column: CTA Area */}
          <div className="bg-[#EDEBE6] flex flex-col justify-between p-6 md:p-8 min-h-[200px] md:min-h-auto">
             <div className="hidden md:block"></div>
            <div className="flex flex-col items-end gap-6 text-right">
              <button 
                onClick={() => document.getElementById('collection-start')?.scrollIntoView({ behavior: 'smooth' })}
                className="group flex items-center gap-2 text-sm font-bold border border-black px-4 py-2 bg-[#EDEBE6] hover:bg-black hover:text-white transition-all"
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


      {/* Main Content Area */}
      <main className="w-full px-0">
        
        {/* Render Font Loop dengan Layout Zig-Zag (Grid Brutalist) */}
        {/* Render Font Loop dengan Layout Zig-Zag (Grid Brutalist) */}
        {[FONT_ROYAL_GRANDE, FONT_THANJAVUR, FONT_SPACE_MONO, FONT_INTER_OT].map((font, index) => {
          const isEven = index % 2 === 0; // Row 1 (Index 0) = Layout Standar (Info - Tester - Action)
          
          // DEFINISI GRID DINAMIS:
          // Row Ganjil (Std): [450px Info] [Flexible Tester] [150px Action]
          // Row Genap (Alt): [150px Action] [Flexible Tester] [450px Info]
          const gridLayoutClass = isEven 
            ? "md:grid-cols-[450px_1fr_150px]" 
            : "md:grid-cols-[150px_1fr_450px]";

          return (
            <section 
              key={font.name} 
              id={index === 0 ? "collection-start" : undefined}
              className={`border-b border-black grid grid-cols-1 ${gridLayoutClass}`}
            >
              
              {/* 1. INFO COLUMN */}
              <div className={`p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 ${isEven ? 'md:order-1 md:border-r border-black' : 'md:order-3 md:border-l border-black'}`}>
                <div>
                  <h2 className="text-3xl font-normal uppercase tracking-tight mb-6">{font.name}</h2>
                  <div className="mb-8"><BrutalistGraphic /></div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase text-gray-500 mb-6">
                    {font.tags.map(tag => (
                      <span key={tag} className="border border-gray-300 px-2 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed font-mono">{font.description}</p>
              </div>

              {/* 2. TESTER COLUMN (Middle) */}
              {/* Tidak perlu border samping karena sudah disediakan oleh tetangganya (Info & Action) */}
              <div className="md:order-2 overflow-hidden h-full border-b md:border-b-0 bg-[#EDEBE6]">
                 <div className="h-full">
                    <TypeTester config={font} defaultText={isEven ? "The quick brown fox jumps over the lazy dog." : undefined} />
                 </div>
              </div>

              {/* 3. ACTION/ARROW COLUMN */}
              <div className={`p-4 flex items-center justify-center bg-[#EDEBE6] hover:bg-black hover:text-white transition-colors cursor-pointer group ${isEven ? 'md:order-3 md:border-l border-black' : 'md:order-1 md:border-r border-black'}`}>
                 <MoveRight size={48} strokeWidth={1} className="transition-transform duration-500 group-hover:scale-125" />
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default Home;