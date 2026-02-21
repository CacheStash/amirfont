import React from 'react';
import { Plus } from 'lucide-react';

// Shared Bullet Style
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style - Untuk elemen di dalam kartu
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 ${className}`}>
    {children}
  </div>
);

const License: React.FC = () => {

  // --- KOMPONEN LUBANG PERFORASI FISIK ---
  // Kita menggunakan div bulat dengan border untuk menciptakan efek "outline mengikuti tekstur"
  const TicketPunch = ({ size = "small", position }: { size?: "small" | "large", position: string }) => (
    <div className={`absolute z-20 rounded-full bg-[#EDEBE6] border border-black pointer-events-none ${position} ${
      size === "small" ? "w-6 h-6" : "w-12 h-12"
    }`} />
  );

  // --- KOMPONEN KARTU KARCIS (Model App.tsx) ---
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="relative mb-24 w-full group">
      
      {/* Container Utama - overflow-hidden memotong lingkaran jadi setengah (efek gerigi) */}
      <div className="relative bg-white border border-black flex flex-col md:flex-row overflow-hidden shadow-[15px_15px_0px_0px_rgba(0,0,0,0.05)]">
        
        {/* 1. LUBANG TEPI KIRI (Multiple Small Punches) */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-around -ml-3 z-30">
          {[...Array(10)].map((_, i) => <TicketPunch key={i} position="relative" />)}
        </div>

        {/* 2. LUBANG TEPI KANAN (Multiple Small Punches) */}
        <div className="absolute right-0 top-0 h-full flex flex-col justify-around -mr-3 z-30">
          {[...Array(10)].map((_, i) => <TicketPunch key={i} position="relative" />)}
        </div>

        {/* 3. LUBANG PEMISAH (Two Large Notches at Top/Bottom) */}
        {/* Diletakkan di batas antara Body dan Stub */}
        <TicketPunch size="large" position="top-0 right-[25%] -mt-6 -mr-6 hidden md:block" />
        <TicketPunch size="large" position="bottom-0 right-[25%] -mb-6 -mr-6 hidden md:block" />

        {/* --- BAGIAN KIRI: BODY (Headline + Content) --- */}
        <div className="flex-grow p-10 md:p-20 flex flex-col border-b md:border-b-0 md:border-r border-black border-dashed">
          {/* Headline di Kiri Atas */}
          <h3 className="text-3xl md:text-6xl font-normal tracking-tighter uppercase mb-8 leading-none">
            {title}
          </h3>
          
          {/* Separator Line --------------------------- */}
          <div className="w-full border-b border-black/10 mb-12" />

          {/* Konten bla bla bla */}
          <div className="space-y-10 normal-case text-gray-700 leading-relaxed text-base md:text-xl">
            {children}
          </div>
        </div>

        {/* --- BAGIAN KANAN: STUB (Sisi Sempit berisi Nomor) --- */}
        <div className="w-full md:w-64 bg-[#fcfcfc] flex items-center justify-center p-8 md:p-0 relative">
          {/* Nomor Seri Besar - Font sama dengan judul term */}
          <span className="text-8xl md:text-[12rem] font-normal tracking-tighter uppercase opacity-10 leading-none select-none">
            {number}
          </span>
        </div>
      </div>
    </div>
  );


  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-[#EDEBE6] overflow-x-hidden uppercase">
      {/* Background decoration orbs */}
      <div className="grain-orb-base orb-top-right opacity-30" />
      <div className="grain-orb-base orb-bottom-left opacity-30" />

      <div className="w-full relative z-10">
        {/* HEADER matched with Faq/FontDetail size */}
        <header className="px-6 py-16 md:px-8 border-b border-black mb-20 bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-8">
            License Agreement
          </h2>
          <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">
            Clear Additive Terms for Creative Freedom
          </p>
        </header>

        {/* CONTENT MAIN - Padding sinkron dengan Navbar */}
        <main className="px-3 md:px-8 max-w-full mx-auto">
          
          {/* 01. PERSONAL USE */}
          <TermCard number="01" title="Personal Use (Demo)">
            <p className="italic">This license applies specifically to the "Demo" versions of our font software.</p>
            <div className="space-y-8">
              {[
                { label: "Usage Grant:", val: "Permitted only for personal, non-commercial projects (e.g., student assignments, personal portfolio pieces, or non-profit testing)." },
                { label: "Character Set:", val: "The Demo version is a 'Trial' file and contains a limited glyph set and no advanced OpenType features." },
                { label: "Restrictions:", val: "You may not use the Demo version for any business, promotional, social media advertising, or revenue-generating activities." }
              ].map((item) => (
                <div key={item.label} className="flex gap-6 items-start">
                  <PlusBullet />
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-[11px] tracking-widest text-black uppercase">{item.label}</span>
                    <span className="opacity-70">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </TermCard>

          {/* 02. INDUSTRY METRICS */}
          <TermCard number="02" title="Industry Metrics">
            <p className="italic mb-6 opacity-80">Our licensing is tailored to your industry scale, ensuring fair value based on specific usage metrics.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { t: 'Desktop / Print', m: 'Based on Number of Users (1, 30, 100, or Unlimited).' },
                { t: 'Digital Media (Social/Web)', m: 'Based on Monthly Impressions/Views (50K, 500K, 2M, or Unlimited).' },
                { t: 'Logo & Branding', m: 'Based on Total Organization Employees (Personal, 10, 50, 250, or 251+).' },
                { t: 'App / Game / Ebook', m: 'Based on Number of Titles (1, 10, 50, or Unlimited).' },
                { t: 'Server', m: 'Based on Number of Active Servers (Single, 50, or Unlimited).' },
                { t: 'Broadcast', m: 'Based on Geographical Distribution Reach (Regional, National, or Worldwide).' }
              ].map((item) => (
                <BrutalBox key={item.t} className="bg-transparent border-black/10 p-10">
                   <span className="font-black text-sm tracking-widest block mb-2 uppercase">{item.t}</span>
                   <span className="text-xs normal-case text-gray-500 block leading-tight italic">{item.m}</span>
                </BrutalBox>
              ))}
            </div>
          </TermCard>

          {/* 03. PRICING LOGIC */}
          <TermCard number="03" title="Pricing & Bundle Logic">
            <div className="space-y-12">
              <div className="flex gap-8 items-start">
                <PlusBullet />
                <div className="space-y-2">
                  <h4 className="font-black text-lg tracking-widest uppercase">Additive Selection</h4>
                  <p className="opacity-70">Licenses are sold individually. Selecting one category does not cover others. You only pay for the specific usages you need.</p>
                </div>
              </div>

              <div className="flex gap-8 items-start bg-orange-50 p-12 border border-orange-200">
                <PlusBullet />
                <div className="space-y-6">
                  <h4 className="font-black text-lg tracking-widest uppercase text-orange-600">Bundle Discount Rules:</h4>
                  <div className="flex flex-wrap gap-8 text-sm font-black uppercase">
                    <span className="bg-white px-6 py-2 border border-orange-200 shadow-sm">3 LICENSES: 15% OFF</span>
                    <span className="bg-white px-6 py-2 border border-orange-200 shadow-sm">4 LICENSES: 20% OFF</span>
                    <span className="bg-white px-6 py-2 border border-orange-200 shadow-sm">5+ LICENSES: 25% OFF</span>
                  </div>
                  <p className="text-xs font-bold normal-case text-orange-800 italic leading-relaxed">
                    *Bundle discounts apply only to license categories with a tier value of $250 or higher.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start">
                <PlusBullet />
                <div className="space-y-2">
                  <h4 className="font-black text-lg tracking-widest uppercase">Automatic Corporate Switch</h4>
                  <p className="opacity-70">If your selection's cumulative price meets or exceeds the Corporate price, the system automatically upgrades you to the All-In-One Corporate License.</p>
                </div>
              </div>
            </div>
          </TermCard>

          {/* 04. USAGE TERMS */}
          <TermCard number="04" title="Usage Terms">
            <div className="grid grid-cols-1 gap-y-12">
              {[
                { title: "A. Desktop / Print", desc: "For workstations to create static content (PNG, JPG, PDF) for digital and print media." },
                { title: "B. Digital Media", desc: "Specifically for digital platforms, including website embedding and social media advertising." },
                { title: "C. Logo & Branding", desc: "Utilize the font as a core element of a visual identity system (Logos, Wordmarks)." },
                { title: "D. App / Game / Ebook", desc: "Embed font software into mobile applications, games, or electronic publications." },
                { title: "E. Broadcast", desc: "For motion graphics, television, cinema, streaming, and video advertisements." },
                { title: "F. Server", desc: "Install on a server to facilitate automated end-user customization (Web-to-Print)." },
              ].map((item) => (
                 <div key={item.title} className="flex gap-8 items-start">
                   <PlusBullet />
                   <div className="space-y-2">
                      <h4 className="font-black text-lg tracking-widest uppercase">{item.title}</h4>
                      <p className="opacity-70">{item.desc}</p>
                   </div>
                 </div>
              ))}
              <div className="mt-8 bg-black text-white p-14 border border-black shadow-[20px_20px_0px_0px_rgba(234,88,12,1)]">
                <h4 className="font-bold text-3xl md:text-5xl mb-6 tracking-tight uppercase italic underline decoration-orange-600 underline-offset-8">G. Corporate All-In-One</h4>
                <p className="text-xl md:text-2xl normal-case leading-relaxed text-gray-400 italic font-normal">
                  The ultimate comprehensive package. Covers all six categories (Desktop, Web, Logo, App, Broadcast, and Server) with unlimited scale for the entire global corporation.
                </p>
              </div>
            </div>
          </TermCard>

          {/* 05. GENERAL RULES */}
          <TermCard number="05" title="General Rules">
            <ul className="space-y-12">
              {[
                "You may not sell, rent, sublicense, or redistribute font files to any third party.",
                "You may not modify, adapt, or decompile the font software binaries.",
                "The font software and its intellectual property remain the sole property of Subqi Studio.",
                "Backup copies are permitted for internal archival purposes only on secure servers."
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-10">
                  <PlusBullet /> 
                  <span className="font-normal text-xl md:text-2xl tracking-tight normal-case text-gray-700 leading-tight">{rule}</span>
                </li>
              ))}
            </ul>
          </TermCard>

          {/* 06. LEGAL BREACH */}
          <TermCard number="06" title="Legal Breach">
            <BrutalBox className="bg-[#fffafa] border-red-200 p-16">
              <p className="text-xl md:text-4xl font-normal normal-case leading-relaxed text-black">
                <span className="font-black uppercase tracking-widest mr-6 italic text-red-600 underline decoration-8 underline-offset-[12px]">Violation:</span>
                Subqi Studio reserves the right to terminate the license immediately if terms are not met.
              </p>
            </BrutalBox>
          </TermCard>

        </main>

        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default License;