import React, { useRef, useEffect } from 'react';
import { TypeTester } from './components/TypeTester';
import { MousePointer2 } from 'lucide-react';
import { FontConfig } from './types';

// -- FONT CONFIGURATIONS --

const FONT_ROBOTO_FLEX: FontConfig = {
  name: 'Roboto Flex',
  family: '"Roboto Flex"',
  description: 'Our flagship super-family. A highly versatile variable font featuring optical sizing, width, and weight axes.',
  tags: ['Weight Axis', 'Width Axis', 'Slant Axis'],
  axes: [
    { tag: 'wght', name: 'Weight', min: 100, max: 1000, default: 400 },
    { tag: 'wdth', name: 'Width', min: 25, max: 151, default: 100, unit: '%' },
    { tag: 'slnt', name: 'Slant', min: -10, max: 0, default: 0, unit: '°' },
  ],
  features: [] 
};

// Recursive Font Configuration (Variable + OpenType)
const FONT_RECURSIVE: FontConfig = {
  name: 'Recursive',
  family: '"Recursive"',
  description: 'The ultimate hybrid. A variable font that interpolates between Monospace and Sans, Linear and Casual. Packed with OpenType features.',
  tags: ['Variable', 'OpenType', 'Hybrid', 'Mono/Sans'],
  axes: [
    { tag: 'wght', name: 'Weight', min: 300, max: 1000, default: 400 },
    { tag: 'CASL', name: 'Casual', min: 0, max: 1, default: 0, step: 0.1 },
    { tag: 'MONO', name: 'Mono', min: 0, max: 1, default: 0, step: 0.1 },
    { tag: 'slnt', name: 'Slant', min: -15, max: 0, default: 0, unit: '°' },
  ],
  features: [
    { tag: 'ss01', name: 'Single-story a' },
    { tag: 'ss02', name: 'Simplified g' },
    { tag: 'dlig', name: 'Discretionary Ligs' },
    { tag: 'titl', name: 'Titling' },
  ]
};

const FONT_SPACE_MONO: FontConfig = {
  name: 'Space Mono',
  family: '"Space Mono"',
  description: 'A geometric monospace typeface with a brutalist edge. Standard static font (OTF/TTF).',
  tags: ['Monospaced', 'Coding', 'Display'],
  axes: [], 
  features: []
};

const FONT_INTER_OT: FontConfig = {
  name: 'Inter',
  family: '"Inter"',
  description: 'A masterpiece of versatility. Features extensive OpenType capabilities including alternate characters and ligatures.',
  tags: ['OpenType Features', 'Sans-Serif', 'Neutral'],
  axes: [], 
  features: [
    { tag: 'dlig', name: 'Discretionary Ligatures' }, 
    { tag: 'ss01', name: 'Alt Digits' },
    { tag: 'cv05', name: 'Alt Lowercase l' },
    { tag: 'cv11', name: 'Single Story a' },
  ]
};

// -- FLUID TEXT COMPONENT --
const FluidText: React.FC<{ text: string; className?: string; baseWeight?: number; maxWeight?: number }> = ({ 
  text, 
  className = "",
  baseWeight = 400,
  maxWeight = 1000
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Ensure ref array is sized correctly
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

        // CRITICAL FIX: "opsz" MUST be set explicitly, otherwise Chrome resets it when wght/wdth change
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
          className="inline-block transition-[font-variation-settings] duration-200 ease-out will-change-[font-variation-settings]"
          style={{ 
            fontFamily: '"Roboto Flex", sans-serif',
            // Set initial state including opsz
            fontVariationSettings: `"wght" ${baseWeight}, "wdth" 100, "opsz" 14` 
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
};

// -- MAIN APP COMPONENT --
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-black p-4 md:p-8 font-sans selection:bg-black selection:text-white relative">
      
      {/* Site Header */}
      <header className="max-w-7xl mx-auto mb-16 border-b-4 border-black pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div className="group cursor-default relative">
                <h1 
                    className="text-6xl md:text-9xl font-black tracking-tighter uppercase mb-2"
                    style={{ fontFamily: '"Roboto Flex", sans-serif' }}
                >
                    SUBQI<span className="text-transparent text-stroke-2">STUDIO</span>
                </h1>
                <p className="font-mono text-xs md:text-sm text-gray-600 uppercase tracking-widest pl-2">
                    Experimental Type Foundry &middot; Est. 2024
                </p>
            </div>
        </div>

        {/* Tagline & Subtext Grid */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="flex flex-col items-start gap-0">
                <FluidText 
                  text="Crafted in Silence," 
                  className="text-4xl md:text-7xl leading-[0.9] tracking-tight"
                  baseWeight={500}
                  maxWeight={1000}
                />
                <FluidText 
                  text="Read Everywhere." 
                  className="text-4xl md:text-7xl leading-[0.9] tracking-tight text-gray-500 hover:text-black transition-colors duration-300"
                  baseWeight={300}
                  maxWeight={900}
                />
            </div>
            
            {/* Right Column aligned with Tagline */}
            <div className="flex flex-col items-end gap-4 text-right">
                {/* Interactive Preview Label */}
                <div className="hidden md:flex items-center gap-2 text-sm font-bold border border-black px-3 py-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <MousePointer2 size={16} />
                    <span>INTERACTIVE PREVIEW</span>
                </div>
                
                {/* Subtext */}
                <div className="font-mono text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed">
                    <p>Own the Craft.</p>
                    <p>Start Now.</p>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto">
        
        {/* Product 01: Roboto Flex (Variable) */}
        <section className="mb-24">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-black block shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"></span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">01. {FONT_ROBOTO_FLEX.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono uppercase text-gray-500 mb-2">
                   {FONT_ROBOTO_FLEX.tags.map(tag => (
                     <span key={tag} className="border border-gray-300 px-2 py-0.5 rounded-full">{tag}</span>
                   ))}
                </div>
                <p className="text-gray-600 max-w-xl text-sm leading-relaxed">
                    {FONT_ROBOTO_FLEX.description}
                </p>
            </div>
            <div className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
                <TypeTester config={FONT_ROBOTO_FLEX} />
            </div>
        </section>

        {/* Product 02: Recursive (NEW: Var + OTF) */}
        <section className="mb-24">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-gradient-to-tr from-black to-gray-500 block shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"></span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">02. {FONT_RECURSIVE.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono uppercase text-gray-500 mb-2">
                   {FONT_RECURSIVE.tags.map(tag => (
                     <span key={tag} className="border border-black bg-black text-white px-2 py-0.5 rounded-full">{tag}</span>
                   ))}
                </div>
                <p className="text-gray-600 max-w-xl text-sm leading-relaxed">
                    {FONT_RECURSIVE.description}
                </p>
            </div>
            <div className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
                <TypeTester 
                    config={FONT_RECURSIVE} 
                    defaultText="Move the sliders. I change from Sans to Mono, Linear to Casual. Turn on 'Single-story a' below!"
                />
            </div>
        </section>

        {/* Product 03: Space Mono (Static) */}
        <section className="mb-24">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 border-2 border-black block shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"></span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">03. {FONT_SPACE_MONO.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono uppercase text-gray-500 mb-2">
                   {FONT_SPACE_MONO.tags.map(tag => (
                     <span key={tag} className="border border-gray-300 px-2 py-0.5 rounded-full">{tag}</span>
                   ))}
                </div>
                <p className="text-gray-600 max-w-xl text-sm leading-relaxed">
                    {FONT_SPACE_MONO.description}
                </p>
            </div>
            <div className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
                <TypeTester 
                    config={FONT_SPACE_MONO} 
                    defaultText="function init() { console.log('Hello World'); }"
                />
            </div>
        </section>

        {/* Product 04: Inter (OpenType Features) */}
        <section className="mb-24">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-gray-400 block shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"></span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">04. {FONT_INTER_OT.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono uppercase text-gray-500 mb-2">
                   {FONT_INTER_OT.tags.map(tag => (
                     <span key={tag} className="border border-gray-300 px-2 py-0.5 rounded-full">{tag}</span>
                   ))}
                </div>
                <p className="text-gray-600 max-w-xl text-sm leading-relaxed">
                    {FONT_INTER_OT.description}
                </p>
            </div>
            <div className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
                <TypeTester 
                    config={FONT_INTER_OT} 
                    defaultText="Illegible? -> Legible. 1234567890 -> 01234. arrows -> <->. Try the toggles below."
                />
            </div>
        </section>

        {/* Footer / Specs */}
        <footer className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t-2 border-black pt-8 text-xs font-mono uppercase tracking-wider text-gray-500">
            <div>
                <span className="block text-black font-bold mb-2">License</span>
                <p>Desktop, Web, App, Epub</p>
            </div>
            <div>
                <span className="block text-black font-bold mb-2">Support</span>
                <p>info@subqistudio.com</p>
            </div>
            <div>
                <span className="block text-black font-bold mb-2">Social</span>
                <p>Instagram / Twitter / Behance</p>
            </div>
            <div className="md:text-right">
               &copy; SUBQI STUDIO 2024
            </div>
        </footer>
      </main>
    </div>
  );
};

export default App;