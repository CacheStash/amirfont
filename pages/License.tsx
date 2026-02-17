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

const License: React.FC = () => {
  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION - IDENTIK DENGAN PAGE FONTS */}
        <header className="px-6 py-12 md:px-8 border-b border-black bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            License Agreement
          </h2>
          <p className="text-xs md:text-sm font-normal text-gray-600 uppercase tracking-widest">
            Clear Terms for Creative Freedom
          </p>
        </header>

        {/* CONTENT MAIN */}
        <main className="w-full">
          
          {/* ========================== 
              STRUCTURE: 
              Mobile: Stacked (Col 1 atas, Col 2 bawah)
              Desktop: [600px] | [1fr] | [250px]
          ========================== */}

          {/* 1. FREE FOR PERSONAL USE */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            {/* COL 1: NUMBER + TITLE (GABUNGAN) 
                border-b di mobile menjadi "grid pemisah" antara judul dan term.
            */}
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start gap-8 bg-transparent">
               <span className="text-8xl md:text-[120px] font-normal tracking-tighter leading-none -mt-2">01</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Personal <br/> Use (Demo)
               </h3>
            </div>

            {/* COL 2: CONTENT */}
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                This license applies specifically to the "Demo" versions of our font software.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-4 items-start">
                  <PlusBullet />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-black tracking-widest uppercase">Usage Grant:</span>
                    <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed italic">Permitted only for personal, non-commercial projects (e.g., student assignments, personal portfolio pieces, or non-profit testing).</span>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <PlusBullet />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-black tracking-widest uppercase">Character Set:</span>
                    <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed italic">The Demo version is a "Trial" file and contains a limited glyph set.</span>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <PlusBullet />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-black tracking-widest uppercase">Restrictions:</span>
                    <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed italic">You may not use the Demo version for any business, promotional, social media advertising, or revenue-generating activities. To use the font for commercial purposes, a paid license is required.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COL 3: SMALLER BLANK */}
            <div className="hidden md:block bg-transparent" />
          </section>


          {/* 2. STANDARD LICENSE TIERS */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start gap-8">
               <span className="text-8xl md:text-[120px] font-normal tracking-tighter leading-none -mt-2">02</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Standard <br/> Tiers
               </h3>
            </div>
            
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                Our licenses are granted based on the number of users (seats) who have the font software installed.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { l: 'Solo', v: 'Authorized for 1 User/Seat.' },
                  { l: 'Team', v: 'Authorized for up to 25 Users/Seats.' },
                  { l: 'Studio', v: 'Authorized for up to 100 Users/Seats.' },
                  { l: 'Enterprise', v: 'Unlimited Users/Seats within a single organization.' }
                ].map((tier) => (
                  <BrutalBox key={tier.l} className="bg-transparent">
                     <span className="font-bold text-sm tracking-widest block mb-2">{tier.l}</span>
                     <span className="text-xs normal-case text-gray-600 block leading-tight">{tier.v}</span>
                  </BrutalBox>
                ))}
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>


          {/* 3. UNDERSTANDING SEAT BASED */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start gap-8">
               <span className="text-8xl md:text-[120px] font-normal tracking-tighter leading-none -mt-2">03</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Installation <br/> Logic
               </h3>
            </div>

            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                A "Seat" or "User" refers to a single installation on a single computer.
              </p>
              <ul className="space-y-8">
                {[
                  { t: "Single Installation", d: "If a studio purchases a Solo License, the font may only be installed on one (1) workstation at any given time." },
                  { t: "Shared Environments", d: "Multiple people may use the font if they share the same physical computer. If moved, it must be uninstalled from the previous machine first." },
                  { t: "Simultaneous Use", d: "To have the font installed on multiple computers at the same time, you must upgrade to the Team or Studio tier according to the number of active workstations." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <PlusBullet />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm tracking-widest uppercase">{item.t}</h4>
                      <p className="text-base normal-case text-gray-600 leading-relaxed">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>


          {/* 4. LICENSE CATEGORIES */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start gap-8">
               <span className="text-8xl md:text-[120px] font-normal tracking-tighter leading-none -mt-2">04</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Usage <br/> Terms
               </h3>
            </div>

            <div className="p-6 md:p-10 md:border-r border-black space-y-12">
              <div className="grid grid-cols-1 gap-y-10">
                {[
                  { title: "A. Desktop License", desc: "Grants the right to install the font software on a local machine to create static visual content (PNG, JPG, PDF) for digital and print media, including commercial projects." },
                  { title: "B. Social Media & Web License (Reach Based)", desc: "Specifically for digital platforms, including website embedding and social media content (Instagram, TikTok, YouTube, etc.). Tiered by monthly impressions: Small (50k), Medium (500k), Large (5m), Enterprise (Unlimited)." },
                  { title: "C. Logo & Branding License", desc: "Grants the right to utilize the font as a core element of a visual identity system, including logos and wordmarks. This license includes all permissions associated with a standard Desktop License." },
                  { title: "D. App / SaaS License", desc: "Grants the right to embed the font software into mobile applications, software, or SaaS platforms. This license includes all permissions associated with a standard Desktop License." },
                  { title: "E. Broadcast License", desc: "Grants the right to utilize the font software in motion graphics, television, cinema, streaming services, and video advertisements. This license includes all permissions associated with a standard Desktop License." },
                  { title: "F. Server License", desc: "Grants the right to install the font software on a server to facilitate end-user product customization (Web-to-Print). This license includes all permissions associated with a standard Desktop License." },
                ].map((item) => (
                   <div key={item.title} className="flex gap-4 items-start">
                     <PlusBullet />
                     <div className="space-y-1">
                        <h4 className="font-bold text-sm tracking-widest uppercase">{item.title}</h4>
                        <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">{item.desc}</p>
                     </div>
                   </div>
                ))}
                <div className="mt-4 bg-black text-white p-8 border border-black">
                  <h4 className="font-bold text-xl md:text-2xl mb-4 tracking-tight uppercase">G. Corporate Full Suite</h4>
                  <p className="text-base md:text-lg normal-case leading-relaxed text-gray-400">
                    A comprehensive "All-in-One" license covering all usages (Desktop, Web, Logo, App, Broadcast, and Server) for an entire corporation with no limits on seats or impressions.
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>


          {/* 5. GENERAL RESTRICTIONS */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start gap-8">
               <span className="text-8xl md:text-[120px] font-normal tracking-tighter leading-none -mt-2">05</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 General <br/> Rules
               </h3>
            </div>

            <div className="p-6 md:p-10 md:border-r border-black space-y-8 flex items-start">
              <ul className="space-y-6">
                {[
                  "You may not sell, rent, sublicense, or redistribute the font files to any third party.",
                  "You may not modify, adapt, or decompile the font software.",
                  "The font software and its intellectual property remain the sole property of Subqi Studio."
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-6">
                    <PlusBullet /> 
                    <span className="font-normal text-base md:text-lg tracking-tight leading-tight normal-case text-gray-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>


          {/* 6. TERMINATION */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start gap-8">
               <span className="text-8xl md:text-[120px] font-normal tracking-tighter leading-none -mt-2">06</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Legal <br/> Breach
               </h3>
            </div>

            <div className="p-6 md:p-10 md:border-r border-black">
              <BrutalBox className="bg-transparent border-black">
                <p className="text-base md:text-xl font-normal normal-case leading-relaxed text-black">
                  <span className="font-bold uppercase tracking-wider mr-2 italic">Warning:</span>
                  Subqi Studio reserves the right to terminate the license immediately if the Licensee fails to comply with any of the terms stated above, including exceeding the authorized seat count.
                </p>
              </BrutalBox>
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

export default License;