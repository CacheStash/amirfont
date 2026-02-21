import React from 'react';
import { Plus } from 'lucide-react';

// Shared Bullet Style
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 md:p-10 bg-white ${className}`}>
    {children}
  </div>
);

const About: React.FC = () => {
  // Komponen AboutCard - Mengikuti Style TermCard License.tsx
  const AboutCard: React.FC<{ 
    number: string, 
    title: string, 
    category: string, 
    children: React.ReactNode 
  }> = ({ number, title, category, children }) => (
    <div className="mb-12 w-full border border-black bg-white relative z-10">
      {/* Title Section */}
      <div className="border-b border-black p-6 md:p-10 bg-white">
        <span className="text-[10px] font-black tracking-[0.3em] text-orange-600 block mb-4 uppercase">
          {category}
        </span>
        <h3 className="text-3xl md:text-6xl font-normal tracking-tighter uppercase leading-none">
          <span className="opacity-20 mr-4 md:mr-8">{number}</span>
          {title}
        </h3>
      </div>

      {/* Content Section */}
      <div className="p-6 md:p-14 space-y-10 normal-case text-gray-800 leading-relaxed text-base md:text-xl">
        {children}
      </div>
    </div>
  );

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      
      {/* VIBRANT BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left !top-[40%] !-left-[15%] !opacity-40" />
      <div className="grain-orb-base orb-top-right !top-auto !bottom-0 !-right-[10%] !bg-red-600/20" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION - Konsisten dengan License/Policy/FAQ */}
        <header className="px-6 py-16 md:px-8 border-b border-black mb-12 bg-transparent text-left">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            A Quiet Corner <br className="hidden md:block" /> In A Noisy World
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-widest">
              Born in silence. Built with code.
            </p>
            <p className="text-[10px] md:text-xs font-semibold text-black/40 uppercase tracking-widest">
              — LAST UPDATED: FEBRUARY 21, 2026
            </p>
          </div>
        </header>

        {/* CONTENT MAIN */}
        <main className="px-3 md:px-8 max-w-full mx-auto text-left">
          
          {/* SECTION 01: ORIGIN STORY */}
          <AboutCard 
            number="01" 
            category="The Origin" 
            title="The View from My Window"
          >
            <p className="text-lg md:text-2xl italic font-normal text-black">
              I operate from a small house in a quiet village in Sleman, Yogyakarta.
            </p>
            <div className="flex gap-6 items-start">
              <PlusBullet />
              <p className="text-lg md:text-xl text-gray-600 normal-case">
                Right next door is the village cemetery—a constant source of silence and perspective. In a digital landscape that never stops shouting, this stillness reminds me to craft every letter with human intention rather than corporate speed.
              </p>
            </div>
          </AboutCard>

          {/* SECTION 02: THE EXPERIMENT */}
          <AboutCard 
            number="02" 
            category="Technical Philosophy" 
            title="The Zero-Cost Experiment"
          >
            <div className="space-y-8">
              <p className="text-lg md:text-xl text-gray-800 normal-case">
                This project began as a curious technical challenge: Is it possible to build a fully functional, professional font shop from scratch without using a CMS or third-party marketplace? Could it be done natively for nearly zero dollars?
              </p>
              <BrutalBox className="bg-black text-white">
                 <p className="text-base md:text-xl italic font-normal leading-relaxed">
                   "This website is the answer. It is 100% indie, built natively with code to prove that lean development is not just possible, but superior."
                 </p>
              </BrutalBox>
              <div className="flex gap-6 items-start pt-4">
                <PlusBullet />
                <p className="text-lg md:text-xl text-gray-600 normal-case">
                  That is why you see the **workers.dev** domain. It is not a placeholder; it is a testament to native performance and the power of cloudflare workers in delivering a seamless experience with zero bloat.
                </p>
              </div>
            </div>
          </AboutCard>

          {/* SECTION 03: NATIVE AUTONOMY */}
          <AboutCard 
            number="03" 
            category="Design Autonomy" 
            title="Native Control"
          >
            <p className="text-lg md:text-xl text-gray-800 normal-case">
              Because I built this platform natively, I am not restricted by the templates of standard e-commerce tools. Every brutalist line, every typographic quirk, and every feature is implemented exactly as I envisioned. 
            </p>
            <ul className="space-y-6">
               <li className="flex gap-4 items-start">
                 <PlusBullet />
                 <span className="text-lg normal-case opacity-70">No bloated plugins or heavy frameworks.</span>
               </li>
               <li className="flex gap-4 items-start">
                 <PlusBullet />
                 <span className="text-lg normal-case opacity-70">Direct connection between the font maker and the user.</span>
               </li>
            </ul>
          </AboutCard>

          {/* SECTION 04: CLOSING */}
          <section className="mt-12 w-full border border-black bg-black text-white p-10 md:p-20 relative z-10 overflow-hidden">
             {/* Subtle internal orb */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
             
             <div className="relative z-10 space-y-10">
                <h3 className="text-4xl md:text-7xl font-normal tracking-tighter uppercase italic leading-[0.9]">
                  May you find peace <br className="hidden md:block" /> in what you create.
                </h3>
                <p className="text-lg md:text-2xl normal-case text-gray-400 font-normal leading-relaxed max-w-4xl">
                  Wherever you are in this chaotic world, I hope these tools bring a sense of clarity and soul to your work. Stay safe through the challenges of the future.
                </p>
                <div className="pt-6">
                   <p className="text-base md:text-lg font-bold uppercase tracking-[0.3em] text-orange-600">
                     Sleman, Yogyakarta — 2026
                   </p>
                </div>
             </div>
          </section>

        </main>

        {/* Footer Spacer */}
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default About;