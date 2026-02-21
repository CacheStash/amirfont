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
  // Komponen Kartu Term dengan Efek Bolong Transparan & Spacing Konsisten
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="relative mb-16 w-full group">
      {/* 1. BACKGROUND LAYER (Karcis Putih + Border + Masker Bolong) */}
      <div 
        className="absolute inset-0 bg-white border border-black pointer-events-none shadow-xl"
        style={{
          // FIXED: Menggunakan masker radial-gradient berulang untuk lubang yang benar-benar transparan
          WebkitMaskImage: 'radial-gradient(circle at 12px 12px, transparent 7px, black 7.5px)',
          WebkitMaskSize: '24px 24px',
          WebkitMaskPosition: '-12px -12px'
        }}
      />

      {/* 2. CONTENT LAYER (Isi Konten) */}
      <div className="relative z-10 p-10 md:p-20">
        {/* Title in one line */}
        <div className="flex items-baseline gap-4 mb-6">
          <span className="text-xl md:text-3xl font-black opacity-20">{number}</span>
          <h3 className="text-2xl md:text-6xl font-normal tracking-tighter uppercase">{title}</h3>
        </div>

        {/* Separator line --------------------------- */}
        <div className="w-full border-b-2 border-black/10 mb-12" />

        {/* Konten bla bla bla */}
        <div className="space-y-10">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-[#EDEBE6] overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right opacity-30" />
      <div className="grain-orb-base orb-bottom-left opacity-30" />

      <div className="w-full relative z-10">
        {/* HEADER SECTION - Aligned with Navbar Padding */}
        <header className="px-3 md:px-8 py-16 md:py-24 border-b border-black mb-16">
          <h2 className="text-6xl md:text-[11rem] font-normal uppercase tracking-tighter leading-[0.8] mb-8">
            License Agreement
          </h2>
          <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">
            Clear Additive Terms for Creative Freedom
          </p>
        </header>

        {/* CONTENT MAIN - Padding menyesuaikan Navbar */}
        <main className="px-3 md:px-8 max-w-full mx-auto">
          
          {/* 01. PERSONAL USE */}
          <TermCard number="01" title="Personal Use (Demo)">
            <p className="text-lg md:text-2xl font-normal normal-case leading-relaxed text-gray-800 italic">
              This license applies specifically to the "Demo" versions of our font software.
            </p>
            <div className="space-y-6">
              {[
                { label: "Usage Grant:", val: "Permitted only for personal, non-commercial projects (e.g., student assignments or portfolio pieces)." },
                { label: "Character Set:", val: "The Demo version is a 'Trial' file and contains a limited glyph set." },
                { label: "Restrictions:", val: "You may not use the Demo version for any business, promotional, or revenue-generating activities." }
              ].map((item) => (
                <div key={item.label} className="flex gap-4 items-start">
                  <PlusBullet />
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-[10px] tracking-widest text-black uppercase">{item.label}</span>
                    <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </TermCard>

          {/* 02. INDUSTRY METRICS */}
          <TermCard number="02" title="Industry Metrics">
            <p className="text-lg md:text-2xl font-normal normal-case leading-relaxed text-gray-800 italic mb-4">
              Our licensing is tailored to your scale, ensuring fair value based on industry-specific usage metrics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { t: 'Desktop / Print', m: 'Based on Number of Users (1, 30, 100, or Unlimited).' },
                { t: 'Digital Media', m: 'Based on Monthly Impressions/Views (50K, 500K, 2M, or Unlimited).' },
                { t: 'Logo & Branding', m: 'Based on Total Organization Employees (Personal, 10, 50, 250, or 251+).' },
                { t: 'App / Game / Ebook', m: 'Based on Number of Titles (1, 10, 50, or Unlimited).' },
                { t: 'Server', m: 'Based on Number of Active Servers (Single, 50, or Unlimited).' },
                { t: 'Broadcast', m: 'Based on Geographical Distribution Reach (Regional, National, or Worldwide).' }
              ].map((item) => (
                <BrutalBox key={item.t} className="bg-[#f9f9f9] border-black/10 p-6">
                   <span className="font-black text-xs tracking-widest block mb-2 uppercase">{item.t}</span>
                   <span className="text-xs normal-case text-gray-500 block leading-tight italic">{item.m}</span>
                </BrutalBox>
              ))}
            </div>
          </TermCard>

          {/* 03. PRICING LOGIC */}
          <TermCard number="03" title="Pricing & Bundle Logic">
            <div className="space-y-10">
              <div className="flex gap-4 items-start">
                <PlusBullet />
                <div className="space-y-2">
                  <h4 className="font-black text-sm tracking-widest uppercase">Additive Selection</h4>
                  <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">Licenses are sold individually. Selecting one category does not cover others. You only pay for the specific usages you need.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-orange-50 p-8 border border-orange-200">
                <PlusBullet />
                <div className="space-y-4">
                  <h4 className="font-black text-sm tracking-widest uppercase text-orange-600">Bundle Discount Rules:</h4>
                  <div className="flex flex-wrap gap-6 text-xs font-black uppercase">
                    <span className="bg-white px-4 py-2 border border-orange-200">3 LICENSES: 15% OFF</span>
                    <span className="bg-white px-4 py-2 border border-orange-200">4 LICENSES: 20% OFF</span>
                    <span className="bg-white px-4 py-2 border border-orange-200">5+ LICENSES: 25% OFF</span>
                  </div>
                  <p className="text-[11px] font-bold normal-case text-orange-800 italic">
                    *Bundle discounts apply only to license categories with a tier value of $250 or higher.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <PlusBullet />
                <div className="space-y-2">
                  <h4 className="font-black text-sm tracking-widest uppercase">Automatic Corporate Switch</h4>
                  <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">If your selection's total price meets or exceeds the Corporate package value, the system automatically upgrades you to the All-In-One Corporate License.</p>
                </div>
              </div>
            </div>
          </TermCard>

          {/* 04. USAGE TERMS */}
          <TermCard number="04" title="Usage Terms">
            <div className="grid grid-cols-1 gap-y-10">
              {[
                { title: "A. Desktop / Print", desc: "For workstations to create static content (PNG, JPG, PDF) for digital and print media." },
                { title: "B. Digital Media (Social/Web)", desc: "Specifically for digital platforms, including website embedding and social media advertising." },
                { title: "C. Logo & Branding", desc: "Utilize the font as a core element of a visual identity system (Logos, Wordmarks)." },
                { title: "D. App / Game / Ebook", desc: "Embed font software into mobile applications, games, or electronic publications." },
                { title: "E. Broadcast", desc: "For motion graphics, television, cinema, streaming, and video advertisements." },
                { title: "F. Server", desc: "Install on a server to facilitate automated end-user customization (Web-to-Print)." },
              ].map((item) => (
                 <div key={item.title} className="flex gap-4 items-start">
                   <PlusBullet />
                   <div className="space-y-1">
                      <h4 className="font-black text-sm tracking-widest uppercase">{item.title}</h4>
                      <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">{item.desc}</p>
                   </div>
                 </div>
              ))}
              <div className="mt-6 bg-black text-white p-10 border border-black shadow-[10px_10px_0px_0px_rgba(234,88,12,1)]">
                <h4 className="font-bold text-2xl md:text-4xl mb-4 tracking-tight uppercase">G. Corporate All-In-One</h4>
                <p className="text-base md:text-xl normal-case leading-relaxed text-gray-400 italic">
                  The ultimate comprehensive package. Covers all six categories with unlimited scale for the entire global corporation.
                </p>
              </div>
            </div>
          </TermCard>

          {/* 05. GENERAL RULES */}
          <TermCard number="05" title="General Rules">
            <ul className="space-y-8">
              {[
                "You may not sell, rent, sublicense, or redistribute font files to third parties.",
                "You may not modify, adapt, or decompile the font software binaries.",
                "The font software and its intellectual property remain the sole property of Subqi Studio.",
                "Backup copies are permitted for internal archival purposes only."
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-6">
                  <PlusBullet /> 
                  <span className="font-normal text-base md:text-xl tracking-tight normal-case text-gray-700 leading-tight">{rule}</span>
                </li>
              ))}
            </ul>
          </TermCard>

          {/* 06. LEGAL BREACH */}
          <TermCard number="06" title="Legal Breach">
            <BrutalBox className="bg-transparent border-black p-10">
              <p className="text-base md:text-3xl font-normal normal-case leading-relaxed text-black">
                <span className="font-black uppercase tracking-widest mr-2 italic text-red-600 underline decoration-4 underline-offset-8">Violation Notice:</span>
                Subqi Studio reserves the right to terminate the license immediately if the Licensee fails to comply with any terms, including using tiers lower than their actual industry scale.
              </p>
            </BrutalBox>
          </TermCard>

        </main>

        {/* FOOTER SPACER */}
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default License;