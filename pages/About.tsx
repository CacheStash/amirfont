import React from 'react';
import { Plus } from 'lucide-react';

// Shared Bullet Style - Menggunakan Icon Plus (Hitam)
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style - Border 1px konsisten
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 ${className}`}>
    {children}
  </div>
);

const About: React.FC = () => {
  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS - Konsisten dengan Home */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION */}
        <header className="px-6 py-12 md:px-8 border-b border-black bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            A Quiet Corner <br className="hidden md:block" /> in a Noisy World
          </h2>
          <p className="text-xs md:text-sm font-normal text-gray-600 tracking-widest normal-case">
            Born in silence. Made for your voice.
          </p>
        </header>

        {/* CONTENT MAIN */}
        <main className="w-full">
          
          {/* ========================== 
              STRUCTURE: [600px] | [1fr] | [250px]
          ========================== */}

          {/* SECTION 1: The View */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start bg-transparent">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 The View from <br/> My Window
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800 italic">
                I work from a small house in a quiet village in Sleman, Yogyakarta.
              </p>
              <div className="space-y-6">
                <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">
                  If you were to stand in my studio, you would see the village cemetery right next door. While some might find that unusual, for me, it is the ultimate source of peace. 
                </p>
                <div className="flex gap-4 items-start">
                  <PlusBullet />
                  <p className="text-base md:text-lg normal-case text-black font-medium leading-relaxed">
                    In a world that never stops shouting, the stillness of that place reminds me to slow down, to breathe, and to craft every letter with intention.
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 2: The One-Man "We" */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 The One-Man <br/> "We"
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                Subqi Studio is a solo operation. I draw the fonts, I handle the support, and I even built this website myself.
              </p>
              <BrutalBox className="bg-black text-white">
                <p className="text-base md:text-lg normal-case leading-relaxed">
                  But the "we" in this story includes you. In this digital era, where everyone is an anonymous username, I believe the connection between the maker and the user is the only thing that actually matters.
                </p>
              </BrutalBox>
              <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">
                My quiet village life reaches out to wherever you are—bridging the gap between my desk in Indonesia and your screen, anywhere in the world.
              </p>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 3: A Shared Journey */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 A Shared <br/> Journey
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <div className="space-y-6">
                <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                  The future is unpredictable, and the world can feel heavy and uncertain.
                </p>
                <div className="flex gap-4 items-start">
                  <PlusBullet />
                  <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">
                    As we navigate these challenges together, I hope ini tools bring a sense of clarity and soul to your work.
                  </p>
                </div>
              </div>

              <div className="border border-black p-8 md:p-12 bg-white/5 space-y-6">
                 <p className="text-xl md:text-3xl font-normal normal-case leading-tight tracking-tight text-black">
                   Wherever you are in this big, beautiful, and sometimes chaotic world, may we all be kept safe through the challenges of the future.
                 </p>
                 <p className="text-base md:text-lg font-bold uppercase tracking-widest text-red-600">
                   May you find peace in what you create.
                 </p>
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

        </main>

        {/* FOOTER SPACER */}
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default About;