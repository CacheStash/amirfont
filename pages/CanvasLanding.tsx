import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Layers, Sparkles, Sliders, PenTool, ShieldCheck, Download, Move, Smartphone } from 'lucide-react';

const CanvasLanding: React.FC = () => {
  const CANVAS_APP_URL = "https://canvas.subqi.com";

  return (
    <div className="min-h-screen bg-[#EDEBE6] text-black font-mono selection:bg-black selection:text-white pb-24 relative overflow-x-hidden">
      {/* Background Orbs agar selaras dengan Home & Fonts */}
      <div className="grain-orb-base orb-top-right pointer-events-none" />
      <div className="grain-orb-base orb-bottom-left pointer-events-none" />

      {/* 1. HEADER ORB (Atas Kanan) */}
      <div className="absolute top-[-100px] right-[-100px] w-[800px] h-[600px] pointer-events-none z-0 hidden md:block opacity-60">
        <div
          className="w-full h-full mix-blend-multiply blur-[80px]" 
          style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.45) 0%, rgba(253, 186, 116, 0.25) 50%, rgba(253, 186, 116, 0) 100%)' }}
        />
      </div>

      {/* 2. MIDDLE ORB (Tengah Kiri) */}
      <div className="absolute top-[40%] left-[-200px] w-[800px] h-[800px] pointer-events-none z-0 hidden md:block opacity-35">
        <div
          className="w-full h-full mix-blend-multiply blur-[100px]" 
          style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.3) 0%, rgba(253, 186, 116, 0.15) 50%, rgba(253, 186, 116, 0) 100%)' }}
        />
      </div>

      {/* 3. BOTTOM ORB (Bawah Kanan) */}
      <div className="absolute bottom-[10%] right-[-200px] w-[800px] h-[800px] pointer-events-none z-0 hidden md:block opacity-45">
        <div
          className="w-full h-full mix-blend-multiply blur-[100px]" 
          style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.4) 0%, rgba(253, 186, 116, 0.2) 50%, rgba(253, 186, 116, 0) 100%)' }}
        />
      </div>

      {/* 1. HERO HEADER */}
      <header className="relative z-10 px-4 md:px-8 py-14 md:py-20 border-b border-black bg-white/30 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="bg-black text-[#FF5C00] px-3 py-1 text-xs font-black uppercase tracking-widest">
              NEW RELEASE
            </span>
            <span className="text-xs uppercase tracking-widest text-black/60 font-semibold">
              IN-BROWSER VECTOR TYPOGRAPHY ENGINE
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-normal uppercase tracking-tighter leading-[0.85] mb-8 font-sans">
            FONTCANVAS <br className="hidden sm:block" />
            <span className="italic font-serif">STUDIO LAB.</span>
          </h1>

          <p className="text-base md:text-xl font-normal max-w-3xl leading-relaxed text-black/80 mb-10 normal-case">
            An in-browser vector laboratory designed to test, distort, stack, and sculpt Subqi Studio fonts with mathematical precision before buying or downloading.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={CANVAS_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-all px-8 py-4 font-bold text-sm uppercase tracking-widest flex items-center gap-3 border border-black group"
            >
              <span>Launch FontCanvas Editor</span>
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <Link
              to="/fonts"
              className="bg-white text-black hover:bg-black hover:text-white transition-all px-8 py-4 font-bold text-sm uppercase tracking-widest border border-black"
            >
              Explore Fonts
            </Link>
          </div>
        </div>
      </header>

      {/* 2. INTERACTIVE DEMO / PREVIEW SHOWCASE */}
      <section className="relative z-10 px-4 md:px-8 py-12 border-b border-black bg-white/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="border border-black bg-[#EDEBE6]/80 p-4 md:p-8 relative overflow-hidden backdrop-blur-xs">
            {/* Top Bar Simulator */}
            <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-black inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-black/40 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-black/20 inline-block"></span>
                <span className="text-xs uppercase font-bold tracking-widest ml-2 hidden sm:inline">
                  CANVAS_STUDIO_VIEWPORT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FF5C00] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                  LINKED FAMILY SYNC
                </span>
                <span className="border border-black px-2 py-0.5 text-[10px] font-bold uppercase bg-white">
                  ZOOM: 100%
                </span>
              </div>
            </div>

            {/* Canvas Artwork Mockup */}
            <div className="min-h-[320px] md:min-h-[460px] bg-white border border-black flex flex-col items-center justify-center p-6 md:p-12 relative text-center group cursor-pointer">
              {/* Grid dots background */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Bézier cage mockup guides */}
              <div className="absolute inset-8 border border-dashed border-black/20 pointer-events-none flex items-center justify-center">
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-black border border-white"></div>
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-black border border-white"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-black border border-white"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-black border border-white"></div>
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#FF5C00] border border-white"></div>
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#FF5C00] border border-white"></div>
              </div>

              {/* Typography Preview */}
              <div className="relative z-10">
                <div className="text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter text-black select-none font-sans drop-shadow-sm">
                  SUBQI
                </div>
                <div className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest text-[#FF5C00] -mt-2 md:-mt-4 select-none font-sans">
                  FONTCANVAS
                </div>
                <p className="text-xs uppercase tracking-widest text-black/50 mt-4">
                  [ 4-POINT BEZIER ENVELOPE + CHROMATIC LAYER STACKING ]
                </p>
              </div>

              {/* Hover Launch Overlay */}
              <a
                href={CANVAS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 bg-black/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 p-4"
              >
                <span className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
                  Launch Live Editor
                </span>
                <span className="text-xs uppercase tracking-widest text-[#FF5C00] font-bold">
                  Open canvas.subqi.com in new tab ↗
                </span>
              </a>
            </div>

            {/* Bottom feature badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 text-[10px] uppercase font-bold tracking-wider">
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> 4-Point Envelope Warping
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> Linked Layered Families
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> Text on Curved Path
              </div>
              <div className="flex items-center gap-1.5 border border-black bg-white p-2">
                <span className="text-[#FF5C00]">■</span> Clean SVG Outline Export
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES GRID (BRUTALIST CARDS) */}
      <section className="relative z-10 px-4 md:px-8 py-16 md:py-24 border-b border-black bg-white/20 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-[#FF5C00] font-bold">
              LAB CAPABILITIES
            </span>
            <h2 className="text-3xl md:text-6xl font-normal uppercase tracking-tight mt-2 font-sans">
              BEYOND STANDARD TYPE TESTING
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">01</span>
                  <Sliders size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Bezier Envelope Warping
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Warp and deform live fonts into custom shapes, arches, waves, banners, and asymmetric envelopes with real-time 4-point Bézier cages and interactive tangent handles.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                15+ CURVE & WARP PRESETS
              </div>
            </div>

            {/* Card 2 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">02</span>
                  <Layers size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Linked Layered System
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Work with chromatic and layered font families seamlessly. Linked layers synchronize font metrics, alternate glyph replacements, and transformations without vertical shifts or misalignment.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                SYNCHRONIZED METRICS & ALTS
              </div>
            </div>

            {/* Card 3 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">03</span>
                  <PenTool size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Text On Path & Vector Pen
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Attach typography to arbitrary Bézier paths or shapes. Drag text interactively along curved perimeters with smooth baseline alignment, or draw custom vector paths directly on the artboard.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                COREL-STYLE PERIMETER SLIDING
              </div>
            </div>

            {/* Card 4 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">04</span>
                  <Sparkles size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Alternate Glyph Access
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Click any character on canvas to reveal and apply contextual alternates, swashes, stylistic sets, and discretionary ligatures without digging through complex OpenType menus.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                ONE-CLICK GLYPH SWAP
              </div>
            </div>

            {/* Card 5 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">05</span>
                  <Smartphone size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Touch & iPad Gestures
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case mb-2">
                  Full multi-touch interaction support for iPad and tablet browsers. Smooth 2-finger pinch zoom, fluid single-finger canvas panning, and tap-and-hold marquee multi-selection.
                </p>
                <p className="text-[11px] leading-relaxed text-black/90 font-medium normal-case bg-black/5 p-2 border-l border-black">
                  Desktop Recommended: While touch devices are supported, using a desktop computer with a larger screen and mouse/trackpad precision is strongly recommended for the most optimal design workflow.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                DESKTOP OPTIMAL • TOUCH READY
              </div>
            </div>

            {/* Card 6 */}
            <div className="border border-black bg-white p-8 flex flex-col justify-between hover:border-[#FF5C00] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black">06</span>
                  <Download size={24} className="text-[#FF5C00]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">
                  Vector SVG & PNG Export
                </h3>
                <p className="text-xs leading-relaxed text-black/70 normal-case">
                  Export your typographic layouts, outlines, and warped wordmarks as production-ready clean SVGs or high-resolution PNGs ready for Illustrator, Figma, or print production.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/10 text-[10px] uppercase font-bold tracking-widest text-black/50">
                PRODUCTION-GRADE OUTLINES
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LICENSING & COMMERCIAL POLICY */}
      <section className="relative z-10 px-4 md:px-8 py-16 md:py-20 border-b border-black bg-white/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="border border-black bg-white/90 backdrop-blur-xs p-8 md:p-14 relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={20} className="text-[#FF5C00]" />
                  <span className="text-xs uppercase font-bold tracking-widest text-[#FF5C00]">
                    LAB POLICY & LICENSING
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-normal uppercase tracking-tight mb-4 font-sans">
                  Free In-Browser Access & Crucial Pro Workflows
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-black/80 normal-case mb-3">
                  FontCanvas Studio is free for anyone to use and experiment without restriction (*). Designers and typographers can freely draft custom lettering layouts, explore stylistic alternates, test warping envelopes, and preview typography directly in their browser.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-black/80 normal-case mb-4">
                  To unlock crucial production capabilities—including clean unwatermarked vector SVG & high-res PNG exports, access to full font families, chromatic layer stacking, and all extra ornaments—simply purchase at least one paid font from our collection.
                </p>
                <p className="text-[11px] leading-relaxed text-black/60 italic normal-case border-l-2 border-[#FF5C00] pl-3 py-0.5">
                  * Continuous Development & In-Browser Simplicity: We actively maintain and update FontCanvas regularly to resolve critical bugs and introduce refined tools. FontCanvas is intentionally engineered to stay clean, fast, and focused on essential typographic design workflows—allowing our buyers to compose, customize, and export production-ready vector artwork directly in-browser without requiring complex 3rd-party graphic software.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <a
                  href={CANVAS_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-all px-7 py-4 text-xs font-bold uppercase tracking-widest text-center border border-black flex items-center justify-center gap-2"
                >
                  <span>Launch FontCanvas Editor</span>
                  <ArrowUpRight size={16} />
                </a>
                <Link
                  to="/fonts"
                  className="bg-[#FF5C00] text-black hover:bg-black hover:text-white transition-all px-7 py-4 text-xs font-bold uppercase tracking-widest text-center border border-black"
                >
                  Buy Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <section className="relative z-10 px-4 md:px-8 pt-16 md:pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="border border-black bg-black text-white p-10 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="text-xs uppercase tracking-widest text-[#FF5C00] font-bold block mb-4">
                READY TO SCULPT TYPE?
              </span>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-normal uppercase tracking-tighter leading-none mb-8 font-sans">
                START CREATING IN FONTCANVAS NOW.
              </h2>
              <a
                href={CANVAS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#FF5C00] text-black hover:bg-white hover:text-black transition-all px-10 py-5 font-black text-sm uppercase tracking-widest"
              >
                <span>Launch FontCanvas Studio</span>
                <ArrowUpRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CanvasLanding;
