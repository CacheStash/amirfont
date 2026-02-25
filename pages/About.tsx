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
  // Component AboutCard - Consistent with License.tsx style
  const AboutCard: React.FC<{ 
    number: string, 
    title: string, 
    category: string, 
    children: React.ReactNode 
  }> = ({ number, title, category, children }) => (
    <div className="mb-12 w-full border border-black bg-white relative z-10">
      {/* Title Section: Number on the left with identical font style */}
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
      <div className="grain-orb-base orb-bottom-left" />
      <div className="grain-orb-base orb-top-right !top-auto !bottom-0 !-right-[10%] !bg-red-600/20" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION - Theme Updated to $0 Dollar Cost */}
        <header className="px-6 py-16 md:px-8 border-b border-black mb-12 bg-transparent text-left">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            The Zero-Dollar <br className="hidden md:block" /> Architecture
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-widest">
              100% Indie. Built Natively. No CMS.
            </p>
            <p className="text-[10px] md:text-xs font-semibold text-black/40 uppercase tracking-widest">
              — LAST UPDATED: FEBRUARY 21, 2026
            </p>
          </div>
        </header>

        {/* CONTENT MAIN */}
        <main className="px-3 md:px-8 max-w-full mx-auto text-left">
          
          {/* SECTION 01: THE ORIGIN */}
          <AboutCard 
            number="01" 
            category="The Core Hypothesis" 
            title="Is a $0 Overhead Possible?"
          >
            <p className="text-lg md:text-2xl italic font-normal text-black">
              Subqi Studio began as a technical curiosity: Can a professional-grade font commerce platform exist with zero operational infrastructure costs?
            </p>
            <div className="flex gap-6 items-start">
              <PlusBullet />
              <p className="text-lg md:text-xl text-gray-600 normal-case">
                This website is the answer. Built from scratch without the bloat of traditional CMS or third-party marketplaces, it serves as proof that lean, native code can outperform expensive, templated systems.
              </p>
            </div>
          </AboutCard>

          {/* SECTION 02: THE NATIVE BADGE */}
          <AboutCard 
            number="02" 
            category="Technical Identity" 
            title="The workers.dev Manifesto"
          >
            <div className="space-y-8">
              <p className="text-lg md:text-xl text-gray-800 normal-case">
                You might notice the **workers.dev** domain. It is not a temporary placeholder; it is a badge of technical efficiency.
              </p>
              <BrutalBox className="bg-black text-white">
                 <p className="text-base md:text-xl italic font-normal leading-relaxed">
                   "By leveraging native cloud technologies, I have achieved a seamless, high-performance shopping experience with zero server maintenance and zero upfront costs."
                 </p>
              </BrutalBox>
              <div className="flex gap-6 items-start pt-4">
                <PlusBullet />
                <p className="text-lg md:text-xl text-gray-600 normal-case">
                  This native approach ensures that every micro-interaction and typographic detail is executed exactly as intended, without the constraints of generic e-commerce plugins.
                </p>
              </div>
            </div>
          </AboutCard>

          {/* SECTION 03: AUTONOMY BY DESIGN */}
          <AboutCard 
            number="03" 
            category="Creative Freedom" 
            title="Absolute Native Control"
          >
            <p className="text-lg md:text-xl text-gray-800 normal-case">
              Native development grants me total autonomy over the studio's features and aesthetic. I am not a user of a platform; I am the architect of my own tools.
            </p>
            <ul className="space-y-6">
               <li className="flex gap-4 items-start">
                 <PlusBullet />
                 <span className="text-lg normal-case opacity-70">Custom-built licensing engines tailored for modern workflows.</span>
               </li>
               <li className="flex gap-4 items-start">
                 <PlusBullet />
                 <span className="text-lg normal-case opacity-70">A direct, unmediated link between the type designer and the end user.</span>
               </li>
               <li className="flex gap-4 items-start">
                 <PlusBullet />
                 <span className="text-lg normal-case opacity-70">Performance-first architecture with zero tracking and zero bloat.</span>
               </li>
            </ul>
          </AboutCard>

          {/* SECTION 04: CLOSING STATEMENT */}
          <section className="mt-12 w-full border border-black bg-black text-white p-10 md:p-20 relative z-10 overflow-hidden">
             {/* Subtle internal decorative orb */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
             
             <div className="relative z-10 space-y-10">
                <h3 className="text-4xl md:text-7xl font-normal tracking-tighter uppercase italic leading-[0.9]">
                  Born in silence. <br className="hidden md:block" /> Engineered for clarity.
                </h3>
                <p className="text-lg md:text-2xl normal-case text-gray-400 font-normal leading-relaxed max-w-4xl">
                  Whether you are a solo creator or a global agency, I hope these natively-crafted tools bring a sense of soul and precision to your typography. 
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