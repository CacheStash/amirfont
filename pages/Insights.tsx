import React from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Shared Bullet Style
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style - Brutalist Standard
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 md:p-10 bg-white ${className}`}>
    {children}
  </div>
);

const Insights: React.FC = () => {
  // Komponen InsightCard - Mengikuti Style TermCard License.tsx
  const InsightCard: React.FC<{ 
    number: string, 
    title: string, 
    category: string, 
    children: React.ReactNode,
    linkText: string 
  }> = ({ number, title, category, children, linkText }) => (
    <div className="mb-12 w-full border border-black bg-white relative z-10">
      {/* Title Section: Nomor di sisi kiri title dengan text yang sama */}
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
        <div className="flex gap-6 items-start">
          <PlusBullet />
          <div className="space-y-10 w-full">
            {children}
            
            {/* Brutalist Action Link */}
            <Link to="#" className="inline-flex items-center gap-6 group/link pt-4">
              <span className="text-2xl md:text-4xl font-normal tracking-tighter uppercase border-b-4 border-black group-hover/link:border-orange-600 transition-colors">
                {linkText}
              </span>
              <ArrowRight size={32} strokeWidth={1.5} className="group-hover/link:translate-x-4 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      
      {/* VIBRANT BACKGROUND ORBS - Posisi Sinkron dengan License.tsx */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left !top-[40%] !-left-[15%] !opacity-40" />
      <div className="grain-orb-base orb-top-right !top-auto !bottom-0 !-right-[10%] !bg-red-600/20" />

      <div className="w-full relative z-10">
        {/* HEADER SECTION - Konsisten dengan License/Policy/FAQ */}
        <header className="px-6 py-16 md:px-8 border-b border-black mb-12 bg-transparent text-left">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            The Type Lab
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-widest">
              Tips, Tricks, and Typography Trends.
            </p>
            <p className="text-[10px] md:text-xs font-semibold text-black/40 uppercase tracking-widest">
              — LAST UPDATED: FEBRUARY 21, 2026
            </p>
          </div>
        </header>

        {/* CONTENT MAIN */}
        <main className="px-3 md:px-8 max-w-full mx-auto text-left">
          
          {/* ARTICLE 01 */}
          <InsightCard 
            number="01" 
            category="Philosophy / Story" 
            title="The Art of the Slow Curve"
            linkText="Read the Story"
          >
            <p className="text-lg md:text-2xl">
              In my studio in Sleman, time moves differently. This insight explores why hand-sketching remains a vital ritual before digital execution, ensuring every curve retains a human heartbeat.
            </p>
            <BrutalBox className="bg-[#f9f9f9] border-black/10">
               <p className="text-sm md:text-lg italic opacity-70">
                 "Slowing down is not a delay; it is the process of embedding intent into every anchor point."
               </p>
            </BrutalBox>
          </InsightCard>

          {/* ARTICLE 02 */}
          <InsightCard 
            number="02" 
            category="Technical / Licensing" 
            title="Choosing the Right Seat"
            linkText="Read the Guide"
          >
            <p className="text-lg md:text-2xl">
              Licensing shouldn't be a barrier to creativity. We break down our Solo, Team, and Studio tiers in plain language, helping you navigate legal compliance with confidence.
            </p>
          </InsightCard>

          {/* ARTICLE 03 */}
          <InsightCard 
            number="03" 
            category="Life / Routine" 
            title="Finding Peace in the Noise"
            linkText="Read More"
          >
            <p className="text-lg md:text-2xl">
              How do we maintain creative focus in an era of constant digital noise? Insights into a one-man studio routine and how tranquil surroundings influence the architecture of type.
            </p>
          </InsightCard>

        </main>

        {/* Footer Spacer */}
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default Insights;