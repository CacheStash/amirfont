import React from 'react';
import { Plus, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

// Shared Bullet Style
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 ${className}`}>
    {children}
  </div>
);

const Insights: React.FC = () => {
  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION */}
        <header className="px-6 py-12 md:px-8 border-b border-black bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            The Type Lab
          </h2>
          <p className="text-xs md:text-sm font-normal text-gray-600 tracking-widest normal-case">
            Tips, Tricks, and Typography Trends.
          </p>
        </header>

        {/* CONTENT MAIN */}
        <main className="w-full">
          
          {/* ========================== 
              STRUCTURE: [600px] | [1fr] | [250px]
          ========================== */}

          

          {/* ARTICLE 1: The Art of the Slow Curve */}
          <article className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch group cursor-pointer hover:bg-black/5 transition-colors">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex flex-col justify-between">
               <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-8 uppercase">Philosophy / Story</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] group-hover:translate-x-2 transition-transform duration-500">
                 The Art of the <br/> Slow Curve
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <div className="flex gap-4 items-start">
                <PlusBullet />
                <p className="text-base md:text-lg normal-case text-gray-700 leading-relaxed">
                  In my studio in Sleman, time moves differently. In this post, I talk about why I still prefer to sketch by hand before touching the computer, and how "slowing down" actually makes your designs feel more human.
                </p>
              </div>
              <Link to="#" className="inline-flex items-center gap-4 group/link">
                <span className="text-xl md:text-2xl font-bold tracking-tighter uppercase border-b-2 border-black group-hover/link:border-red-600 transition-colors">Read the Story</span>
                <ArrowRight size={24} className="group-hover/link:translate-x-2 transition-transform" />
              </Link>
            </div>
            <div className="hidden md:block bg-transparent" />
          </article>

          {/* ARTICLE 2: Choosing the Right Seat */}
          <article className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch group cursor-pointer hover:bg-black/5 transition-colors">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex flex-col justify-between">
               <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-8 uppercase">Technical / Licensing</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] group-hover:translate-x-2 transition-transform duration-500">
                 Choosing the <br/> Right "Seat"
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <div className="flex gap-4 items-start">
                <PlusBullet />
                <p className="text-base md:text-lg normal-case text-gray-700 leading-relaxed">
                  Licensing can feel like a headache. Let’s break down our Solo, Team, and Studio tiers in plain English so you can focus on creating, knowing your legal bases are covered.
                </p>
              </div>
              <Link to="#" className="inline-flex items-center gap-4 group/link">
                <span className="text-xl md:text-2xl font-bold tracking-tighter uppercase border-b-2 border-black group-hover/link:border-red-600 transition-colors">Read the Guide</span>
                <ArrowRight size={24} className="group-hover/link:translate-x-2 transition-transform" />
              </Link>
            </div>
            <div className="hidden md:block bg-transparent" />
          </article>

          {/* ARTICLE 3: Finding Peace */}
          <article className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch group cursor-pointer hover:bg-black/5 transition-colors">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex flex-col justify-between">
               <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-8 uppercase">Life / Routine</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] group-hover:translate-x-2 transition-transform duration-500">
                 Finding Peace <br/> in the Noise
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <div className="flex gap-4 items-start">
                <PlusBullet />
                <p className="text-base md:text-lg normal-case text-gray-700 leading-relaxed">
                  How do we stay creative when the world feels loud? I share my routine for staying focused in a one-man studio and how the peace of my surroundings helps shape the fonts you use.
                </p>
              </div>
              <Link to="#" className="inline-flex items-center gap-4 group/link">
                <span className="text-xl md:text-2xl font-bold tracking-tighter uppercase border-b-2 border-black group-hover/link:border-red-600 transition-colors">Read More</span>
                <ArrowRight size={24} className="group-hover/link:translate-x-2 transition-transform" />
              </Link>
            </div>
            <div className="hidden md:block bg-transparent" />
          </article>

          

        </main>

        {/* FOOTER SPACER */}
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default Insights;