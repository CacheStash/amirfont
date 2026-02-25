import React from 'react';
import { Plus } from 'lucide-react';

// Shared Bullet Style - Menggunakan Icon Plus (Hitam)
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style - Brutalist Box standar (Border hitam tegas)
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 md:p-10 bg-white ${className}`}>
    {children}
  </div>
);

const License: React.FC = () => {
  // Komponen Kartu Term - Kotak Biasa Brutalist Style
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="mb-12 w-full border border-black bg-white relative z-10">
      {/* Title Section: Nomor di sisi kiri title dengan text yang sama */}
      <div className="border-b border-black p-6 md:p-10 bg-white">
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
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-[#F5F5F0] overflow-x-hidden uppercase">
      
      {/* 1. BACKGROUND ORBS - Posisi sesuai request (Top Right, Middle Left, Bottom Right) */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />
      <div className="grain-orb-base orb-top-right !top-auto !bottom-0 !-right-[10%] !bg-red-600/20" />

      <div className="w-full relative z-10">
        {/* HEADER SECTION */}
        <header className="px-6 py-16 md:px-8 border-b border-black mb-12 bg-transparent text-left">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            License Agreement
          </h2>
          {/* 2. SUB-HEADER INFO - Tambah info Update Terakhir */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs md:text-sm font-normal text-black uppercase tracking-[0.3em]">
              Clear Additive Terms for Creative Freedom
            </p>
            <p className="text-xs md:text-sm font-normal text-black uppercase tracking-widest">
            — LAST UPDATED: FEBRUARY 21, 2026
            </p>
          </div>
        </header>

        {/* CONTENT MAIN */}
        <main className="px-3 md:px-8 max-w-full mx-auto text-left">
          
          {/* 01. PERSONAL USE */}
          <TermCard number="01" title="Personal Use (Demo)">
            <p className="italic font-medium text-black">This license applies specifically to the "Demo" versions of our font software.</p>
            <div className="space-y-8">
              {[
                { label: "Usage Grant:", val: "Permitted only for personal, non-commercial projects (e.g., student assignments, personal portfolio pieces, or non-profit testing)." },
                { label: "Character Set:", val: "The Demo version is a 'Trial' file and contains a limited glyph set." },
                { label: "Restrictions:", val: "You may not use the Demo version for any business, promotional, social media advertising, or revenue-generating activities." }
              ].map((item) => (
                <div key={item.label} className="flex gap-4 items-start">
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
            <p className="italic mb-6 text-black">Our licensing is tailored to your industry scale, ensuring fair value based on specific usage metrics.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Desktop / Print', metric: 'Based on Number of Users (1, 30, 100, or Unlimited).' },
                { title: 'Digital Media (Social/Web)', metric: 'Based on Monthly Impressions/Views (50K, 500K, 2M, or Unlimited).' },
                { title: 'Logo & Branding', metric: 'Based on Total Organization Employees (Personal, 10, 50, 250, or 251+).' },
                { title: 'App / Game / Ebook', metric: 'Based on Number of Titles (1, 10, 50, or Unlimited).' },
                { title: 'Server', metric: 'Based on Number of Servers (Single, 50, or Unlimited).' },
                { title: 'Broadcast', metric: 'Based on Geographical Distribution Reach (Regional, National, or Worldwide).' }
              ].map((item) => (
                <BrutalBox key={item.title} className="p-8 border-black/10 bg-[#f9f9f9]">
                   <span className="font-black text-sm tracking-widest block mb-2 uppercase text-black">{item.title}</span>
                   <span className="text-xs normal-case text-gray-500 block leading-tight italic">{item.metric}</span>
                </BrutalBox>
              ))}
            </div>
          </TermCard>

          {/* 03. PRICING LOGIC */}
          <TermCard number="03" title="Pricing & Bundle Logic">
            <div className="space-y-12">
              <div className="flex gap-6 items-start">
                <PlusBullet />
                <div className="space-y-2">
                  <h4 className="font-black text-sm tracking-widest uppercase text-black">Additive Selection (Individual Items)</h4>
                  <p className="opacity-70">Licenses are sold individually. Selecting one category does not cover others. You only pay for the specific usages you need for your project.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start bg-orange-50 p-8 border border-orange-200">
                <PlusBullet />
                <div className="space-y-6">
                  <h4 className="font-black text-sm tracking-widest uppercase text-orange-600">Bundle Discount Rules:</h4>
                  <div className="flex flex-wrap gap-4 text-xs font-black uppercase tracking-tighter">
                    <span className="bg-white px-4 py-2 border border-orange-200">3 LICENSES: 15% OFF</span>
                    <span className="bg-white px-4 py-2 border border-orange-200">4 LICENSES: 20% OFF</span>
                    <span className="bg-white px-4 py-2 border border-orange-200">5+ LICENSES: 25% OFF</span>
                  </div>
                  <p className="text-[11px] font-bold normal-case text-orange-800 italic leading-relaxed">
                    *IMPORTANT: Bundle discounts automatically apply only to license categories with a tier value of $250 or higher.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <PlusBullet />
                <div className="space-y-2">
                  <h4 className="font-black text-sm tracking-widest uppercase text-black">Automatic Corporate Upgrade</h4>
                  <p className="opacity-70">If the cumulative price of your selection (after bundling) meets or exceeds the Corporate package value, the system automatically upgrades you to the All-In-One Corporate License.</p>
                </div>
              </div>
            </div>
          </TermCard>

          {/* 04. USAGE TERMS */}
          <TermCard number="04" title="Usage Terms">
            <div className="grid grid-cols-1 gap-y-10">
              {[
                { title: "A. Desktop / Print", desc: "Install on workstations to create static content (PNG, JPG, PDF) for digital and print media." },
                { title: "B. Digital Media (Social/Web)", desc: "Specifically for digital platforms, including website embedding and social media advertising." },
                { title: "C. Logo & Branding", desc: "Utilize the font as a core element of a visual identity system (Logos, Wordmarks)." },
                { title: "D. App / Game / Ebook", desc: "Embed font software into mobile applications, software, games, or electronic publications." },
                { title: "E. Broadcast", desc: "For motion graphics, television, cinema, streaming, and video advertisements." },
                { title: "F. Server", desc: "Install on a server to facilitate automated end-user customization (Web-to-Print)." },
              ].map((item) => (
                 <div key={item.title} className="flex gap-6 items-start">
                   <PlusBullet />
                   <div className="space-y-2">
                      <h4 className="font-black text-sm tracking-widest uppercase text-black">{item.title}</h4>
                      <p className="opacity-70">{item.desc}</p>
                   </div>
                 </div>
              ))}
              <div className="mt-6 bg-black text-white p-10 border border-black">
                <h4 className="font-bold text-2xl md:text-4xl mb-4 tracking-tight uppercase italic text-orange-600">G. Corporate All-In-One</h4>
                <p className="text-base md:text-xl normal-case leading-relaxed text-gray-400 italic">
                  The ultimate comprehensive package. Covers all six categories (Desktop, Web, Logo, App, Broadcast, and Server) with unlimited scale for the entire global corporation.
                </p>
              </div>
            </div>
          </TermCard>

          {/* 05. GENERAL RULES */}
          <TermCard number="05" title="General Rules">
            <ul className="space-y-10">
              {[
                "You may not sell, rent, sublicense, or redistribute font files to any third party.",
                "You may not modify, adapt, or decompile the font software binaries.",
                "The font software and its intellectual property remain the sole property of Subqi Studio.",
                "Backup copies are permitted for internal archival purposes only on secure servers."
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-8">
                  <PlusBullet /> 
                  <span className="font-normal text-base md:text-xl tracking-tight normal-case text-gray-700 leading-tight">{rule}</span>
                </li>
              ))}
            </ul>
          </TermCard>

          {/* 06. LEGAL BREACH */}
          <TermCard number="06" title="Legal Breach">
            <BrutalBox className="bg-[#fffafa] border-red-200">
              <p className="text-base md:text-3xl font-normal normal-case leading-relaxed text-black">
                <span className="font-black uppercase tracking-widest mr-4 italic text-red-600">Violation Notice:</span>
                Subqi Studio reserves the right to terminate the license immediately if the Licensee fails to comply with any terms, including using tiers that do not match the actual organization scale.
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