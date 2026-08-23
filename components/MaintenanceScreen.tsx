import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const MaintenanceScreen: React.FC = () => {
  const [typedText, setTypedText] = useState('');
  const fullText = "SYSTEM UPGRADE & INFRASTRUCTURE MAINTENANCE IN PROGRESS...";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, index));
      index = (index + 1) % (fullText.length + 5);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#EDEBE6] text-black font-sans selection:bg-black selection:text-white relative flex flex-col justify-between overflow-hidden">
      
      {/* Subqi Signature Background Grain Orbs */}
      <div className="grain-orb-base orb-top-right pointer-events-none" />
      <div className="grain-orb-base orb-bottom-left pointer-events-none" />

      {/* Radial Gradient Glow Effect (Subqi Home Style) */}
      <div className="absolute -top-24 -right-24 w-[600px] h-[500px] pointer-events-none z-0">
        <div 
          className="w-full h-full mix-blend-multiply blur-[80px]"
          style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.7) 0%, rgba(253, 186, 116, 0.45) 50%, rgba(253, 186, 116, 0) 100%)' }}
        />
      </div>

      <div className="absolute -bottom-24 -left-24 w-[600px] h-[500px] pointer-events-none z-0">
        <div 
          className="w-full h-full mix-blend-multiply blur-[80px]"
          style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.6) 0%, rgba(253, 186, 116, 0.35) 50%, rgba(253, 186, 116, 0) 100%)' }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full border-b border-black bg-transparent px-6 sm:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black">Status: Under Construction</span>
        </div>
        <Link 
          to="/admin" 
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/50 hover:text-black hover:underline transition-all"
        >
          Staff Portal →
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-3xl mx-auto my-auto py-12 px-6 text-center flex flex-col items-center">
        
        {/* Brand Logo Subqi (Bersih tanpa bintang yang nabrak) */}
        <div className="mb-6 flex justify-center items-center">
          <img 
            src="/Logo.png" 
            alt="Subqi Studio" 
            className="h-12 sm:h-16 w-auto object-contain transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Routine Engine Indicator */}
        <div className="flex items-center gap-2 mb-6 text-black/60 text-xs font-bold uppercase tracking-widest">
          <Settings className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Routine Engine Maintenance</span>
        </div>

        {/* Subqi Terminal Subtitle */}
        <div className="border border-black px-4 py-2 bg-transparent text-black font-mono text-xs sm:text-sm tracking-widest uppercase mb-6 shadow-sm">
          {typedText}
          <span className="animate-pulse">_</span>
        </div>

        {/* System Message */}
        <p className="max-w-lg text-sm sm:text-base text-black/80 font-serif leading-relaxed mb-8">
          We are currently performing some necessary system maintenance, server optimizations, and backend upgrades. Everything will be back up and running smoothly in just a short while.
        </p>

        {/* Brutalist Status Card */}
        <div className="w-full max-w-md border border-black bg-white/40 backdrop-blur-sm p-4 text-left font-sans text-xs space-y-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between border-b border-black/10 pb-1.5">
            <span className="text-black/60 uppercase tracking-wider text-[10px] font-bold">Estimated Uptime</span>
            <span className="font-bold uppercase tracking-wider text-[10px]">Moments Away</span>
          </div>
          <div className="flex justify-between border-b border-black/10 pb-1.5">
            <span className="text-black/60 uppercase tracking-wider text-[10px] font-bold">Direct Inquiries</span>
            <a href="mailto:subqistudio@gmail.com" className="font-bold underline text-black hover:text-orange-600 transition-colors">
              subqistudio@gmail.com
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60 uppercase tracking-wider text-[10px] font-bold">Core Server</span>
            <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">Optimizing...</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-black bg-transparent py-4 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">
        © {new Date().getFullYear()} Subqi Studio. All Rights Reserved.
      </footer>
    </div>
  );
};

export default MaintenanceScreen;