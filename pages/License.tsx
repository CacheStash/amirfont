import React from 'react';

const License: React.FC = () => {
  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION */}
        <header className="px-6 py-12 md:px-8 border-b border-black bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal tracking-tighter leading-[0.85] mb-6">
            License Agreement
          </h2>
          <p className="text-xs md:text-sm font-bold text-gray-600 tracking-widest">
            Terms and Conditions
          </p>
        </header>

        {/* CONTENT GRID */}
        <main className="w-full">
          
          {/* 1. FREE FOR PERSONAL USE */}
          <section className="grid grid-cols-1 md:grid-cols-[150px_1fr] border-b border-black group hover:bg-white/40 transition-colors">
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex items-start">
              <span className="text-3xl md:text-5xl font-normal text-gray-300 group-hover:text-black transition-colors leading-none">01</span>
            </div>
            <div className="p-6 md:p-8 space-y-6 max-w-4xl">
              <h3 className="text-2xl md:text-4xl font-normal tracking-tight">Free for Personal Use (Demo Version)</h3>
              <p className="text-sm font-normal normal-case leading-relaxed text-gray-700">This license applies specifically to the "Demo" versions of our font software.</p>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-2">
                  <span className="min-w-[150px] font-bold text-xs text-black">Usage Grant:</span>
                  <span className="text-sm normal-case text-gray-600">Permitted only for personal, non-commercial projects (e.g., student assignments, personal portfolio pieces, or non-profit testing).</span>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <span className="min-w-[150px] font-bold text-xs text-black">Character Set:</span>
                  <span className="text-sm normal-case text-gray-600">The Demo version is a "Trial" file and contains a limited glyph set.</span>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <span className="min-w-[150px] font-bold text-xs text-black">Restrictions:</span>
                  <span className="text-sm normal-case text-gray-600">You may not use the Demo version for any business, promotional, social media advertising, or revenue-generating activities. To use the font for commercial purposes, a paid license is required.</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. STANDARD LICENSE TIERS */}
          <section className="grid grid-cols-1 md:grid-cols-[150px_1fr] border-b border-black group hover:bg-white/40 transition-colors">
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex items-start">
              <span className="text-3xl md:text-5xl font-normal text-gray-300 group-hover:text-black transition-colors leading-none">02</span>
            </div>
            <div className="p-6 md:p-8 space-y-6 max-w-4xl">
              <h3 className="text-2xl md:text-4xl font-normal tracking-tight">Standard License Tiers (User/Seat Based)</h3>
              <p className="text-sm font-normal normal-case leading-relaxed text-gray-700">Our licenses are granted based on the number of users (seats) who have the font software installed.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Solo: 1 User', 'Team: Up to 25', 'Studio: Up to 100', 'Enterprise: Unlimited'].map((tier) => (
                  <div key={tier} className="border border-black p-4 text-center font-bold text-[10px] md:text-xs hover:bg-black hover:text-white transition-all cursor-default">
                    {tier}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. UNDERSTANDING SEAT BASED */}
          <section className="grid grid-cols-1 md:grid-cols-[150px_1fr] border-b border-black group hover:bg-white/40 transition-colors">
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex items-start">
              <span className="text-3xl md:text-5xl font-normal text-gray-300 group-hover:text-black transition-colors leading-none">03</span>
            </div>
            <div className="p-6 md:p-8 space-y-6 max-w-4xl">
              <h3 className="text-2xl md:text-4xl font-normal tracking-tight">Understanding "Seat-Based" Installation</h3>
              <p className="text-sm font-normal normal-case leading-relaxed text-gray-700">A "Seat" or "User" refers to a single installation on a single computer.</p>
              <ul className="space-y-4 text-sm normal-case text-gray-600">
                <li className="flex gap-4"><span className="font-bold text-black uppercase text-xs shrink-0">— 01</span> <span>If a studio purchases a Solo License, the font may only be installed on one (1) workstation at any given time.</span></li>
                <li className="flex gap-4"><span className="font-bold text-black uppercase text-xs shrink-0">— 02</span> <span>Multiple people may use the font if they share the same physical computer.</span></li>
                <li className="flex gap-4"><span className="font-bold text-black uppercase text-xs shrink-0">— 03</span> <span>If the font needs to be moved to a different computer, it must be uninstalled from the previous machine before being installed on the new one.</span></li>
              </ul>
            </div>
          </section>

          {/* 4. LICENSE CATEGORIES */}
          <section className="grid grid-cols-1 md:grid-cols-[150px_1fr] border-b border-black group hover:bg-white/40 transition-colors">
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex items-start">
              <span className="text-3xl md:text-5xl font-normal text-gray-300 group-hover:text-black transition-colors leading-none">04</span>
            </div>
            <div className="p-6 md:p-8 space-y-8 max-w-6xl">
              <h3 className="text-2xl md:text-4xl font-normal tracking-tight">License Categories & Usage Terms</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {[
                  { title: "A. Desktop License", desc: "Allows installation on a computer to create static designs, printed materials, and commercial projects." },
                  { title: "B. Social & Web (Reach)", desc: "Tiered by monthly impressions: Small (50k), Medium (500k), Large (5m), Enterprise (Unlimited)." },
                  { title: "C. Logo & Branding", desc: "Required when the font is a primary element of a brand identity system." },
                  { title: "D. App / SaaS", desc: "Required for embedding font files into mobile applications, software, or SaaS platforms." },
                  { title: "E. Broadcast", desc: "Required for use in television, cinema, and large-scale video advertisements." },
                  { title: "F. Server", desc: "Required for platforms that allow customers to generate their own custom products (web-to-print)." },
                ].map((item) => (
                  <div key={item.title} className="space-y-2 border-l-2 border-black pl-4">
                    <h4 className="font-bold text-sm tracking-wide">{item.title}</h4>
                    <p className="text-xs normal-case text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
                <div className="col-span-full bg-black text-white p-6 md:p-8">
                  <h4 className="font-bold text-lg mb-2">G. Corporate Full Suite</h4>
                  <p className="text-sm normal-case text-gray-400">A comprehensive "All-in-One" license covering all usages (Desktop, Web, Logo, App, Broadcast, and Server) for an entire corporation with no limits on seats or impressions.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. GENERAL RESTRICTIONS */}
          <section className="grid grid-cols-1 md:grid-cols-[150px_1fr] border-b border-black group hover:bg-white/40 transition-colors">
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex items-start">
              <span className="text-3xl md:text-5xl font-normal text-gray-300 group-hover:text-black transition-colors leading-none">05</span>
            </div>
            <div className="p-6 md:p-8 space-y-6 max-w-4xl">
              <h3 className="text-2xl md:text-4xl font-normal tracking-tight">General Restrictions</h3>
              <ul className="space-y-3 text-sm font-bold tracking-tight">
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-black rotate-45" /> <span>NO RESALE OR REDISTRIBUTION</span></li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-black rotate-45" /> <span>NO MODIFICATION OR DECOMPILATION</span></li>
                <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-black rotate-45" /> <span>SUBQI STUDIO RETAINS INTELLECTUAL PROPERTY</span></li>
              </ul>
            </div>
          </section>

          {/* 6. TERMINATION */}
          <section className="grid grid-cols-1 md:grid-cols-[150px_1fr] border-b border-black group hover:bg-white/40 transition-colors">
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex items-start">
              <span className="text-3xl md:text-5xl font-normal text-gray-300 group-hover:text-black transition-colors leading-none">06</span>
            </div>
            <div className="p-6 md:p-8 space-y-6 max-w-4xl">
              <h3 className="text-2xl md:text-4xl font-normal tracking-tight">Termination</h3>
              <p className="text-sm font-normal normal-case leading-relaxed text-red-600 bg-red-50 p-4 border-l-4 border-red-600">
                Subqi Studio reserves the right to terminate the license immediately if the Licensee fails to comply with any of the terms stated above, including exceeding the authorized seat count.
              </p>
            </div>
          </section>

        </main>

        {/* FOOTER SPACER */}
        <div className="h-24 md:h-32 bg-transparent" />
      </div>
    </div>
  );
};

export default License;