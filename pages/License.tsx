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
  // Komponen Kartu Term dengan Efek Perforasi 4 Sisi & Outline Mengikuti Lekukan
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="relative mb-24 w-full group">
      {/* 1. BACKGROUND LAYER (Card Shape with Edge Punches & True Transparency) */}
      <div 
        className="absolute inset-0 bg-white pointer-events-none"
        style={{
          // MASK LOGIC:
          // Layer 1: Kotak solid di tengah (Menjamin bagian dalam TIDAK bolong)
          // Layer 2-5: Pola lingkaran transparan di setiap sisi (Atas, Bawah, Kiri, Kanan)
          WebkitMaskImage: `
            linear-gradient(black, black),
            radial-gradient(circle at 20px 0px, transparent 12px, black 13px),
            radial-gradient(circle at 20px 100%, transparent 12px, black 13px),
            radial-gradient(circle at 0px 25px, transparent 12px, black 13px),
            radial-gradient(circle at 100% 25px, transparent 12px, black 13px)
          `,
          WebkitMaskSize: `
            calc(100% - 40px) calc(100% - 50px),
            40px 100%,
            40px 100%,
            100% 50px,
            100% 50px
          `,
          WebkitMaskPosition: `
            center center,
            0 0,
            0 0,
            0 0,
            0 0
          `,
          WebkitMaskRepeat: 'no-repeat, repeat-x, repeat-x, repeat-y, repeat-y',
          
          // OUTLINE LOGIC:
          // Menggunakan drop-shadow tajam untuk membuat border hitam yang mengikuti lekukan lubang
          filter: `
            drop-shadow(1px 0 0 black) 
            drop-shadow(-1px 0 0 black) 
            drop-shadow(0 1px 0 black) 
            drop-shadow(0 -1px 0 black)
            drop-shadow(25px 25px 0px rgba(0,0,0,0.05))
          `
        }}
      />

      {/* 2. CONTENT LAYER (Isi Konten) */}
      <div className="relative z-10 p-12 md:p-24">
        {/* Title in one line */}
        <div className="flex items-baseline gap-6 mb-8">
          <span className="text-2xl md:text-4xl font-black opacity-20">{number}</span>
          <h3 className="text-3xl md:text-7xl font-normal tracking-tighter uppercase leading-none">{title}</h3>
        </div>

        {/* Separator line */}
        <div className="w-full border-b-2 border-black/10 mb-14" />

        <div className="space-y-12">
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
        <header className="px-3 md:px-8 py-20 md:py-36 border-b border-black mb-24">
          <h2 className="text-7xl md:text-[13rem] font-normal uppercase tracking-tighter leading-[0.75] mb-10">
            License Agreement
          </h2>
          <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.4em]">
            Clear Additive Terms for Creative Freedom
          </p>
        </header>

        <main className="px-3 md:px-8 max-w-full mx-auto">
          
          {/* 01. PERSONAL USE */}
          <TermCard number="01" title="Personal Use (Demo)">
            <p className="text-xl md:text-3xl font-normal normal-case leading-relaxed text-gray-800 italic">
              This license applies specifically to the "Demo" versions of our font software.
            </p>
            <div className="space-y-10">
              {[
                { label: "Usage Grant:", val: "Permitted only for personal, non-commercial projects (e.g., student assignments, personal portfolio pieces, or non-profit testing)." },
                { label: "Character Set:", val: "The Demo version is a 'Trial' file and contains a limited glyph set." },
                { label: "Restrictions:", val: "You may not use the Demo version for any business, promotional, social media advertising, or revenue-generating activities." }
              ].map((item) => (
                <div key={item.label} className="flex gap-6 items-start">
                  <PlusBullet />
                  <div className="flex flex-col gap-2">
                    <span className="font-black text-xs text-black tracking-widest uppercase">{item.label}</span>
                    <span className="text-lg md:text-xl normal-case text-gray-600 leading-relaxed italic">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </TermCard>

          {/* 02. INDUSTRY METRICS */}
          <TermCard number="02" title="Industry Metrics">
            <p className="text-xl md:text-2xl font-normal normal-case leading-relaxed text-gray-800 mb-10">
              Our licensing is tailored to your industry scale, ensuring fair value based on specific usage metrics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: 'Desktop / Print', metric: 'Based on Number of Users (1, 30, 100, or Unlimited).' },
                { title: 'Digital Media', metric: 'Based on Monthly Views (50K, 500K, 2M, or Unlimited).' },
                { title: 'Logo & Branding', metric: 'Based on Total Company Employees (Personal, 10, 50, 250, or 251+).' },
                { title: 'App / Game / Ebook', metric: 'Based on Number of Titles (1, 10, 50, or Unlimited).' },
                { title: 'Server', metric: 'Based on Number of Servers (Single, 50, or Unlimited).' },
                { title: 'Broadcast', metric: 'Based on Distribution Reach (Regional, National, or Worldwide).' }
              ].map((item) => (
                <BrutalBox key={item.title} className="bg-[#fcfcfc] border-black/10 p-12">
                   <span className="font-black text-sm tracking-widest block mb-4 uppercase">{item.title}</span>
                   <span className="text-sm normal-case text-gray-500 block leading-tight italic">{item.metric}</span>
                </BrutalBox>
              ))}
            </div>
          </TermCard>

          {/* 03. PRICING LOGIC */}
          <TermCard number="03" title="Pricing & Bundle Logic">
            <div className="space-y-14">
              <div className="flex gap-8 items-start">
                <PlusBullet />
                <div className="space-y-4">
                  <h4 className="font-black text-lg tracking-widest uppercase">Additive Selection</h4>
                  <p className="text-lg md:text-xl normal-case text-gray-600 leading-relaxed">Licenses are sold individually. Selecting one category does not cover others. You only pay for the specific usages you need for your project.</p>
                </div>
              </div>

              <div className="flex gap-8 items-start bg-orange-50 p-12 border border-orange-200">
                <PlusBullet />
                <div className="space-y-8">
                  <h4 className="font-black text-lg tracking-widest uppercase text-orange-600">Bundle Discount Rules:</h4>
                  <div className="flex flex-wrap gap-10 text-sm font-black uppercase">
                    <span className="bg-white px-6 py-3 border border-orange-200 shadow-sm">3 LICENSES: 15% OFF</span>
                    <span className="bg-white px-6 py-3 border border-orange-200 shadow-sm">4 LICENSES: 20% OFF</span>
                    <span className="bg-white px-6 py-3 border border-orange-200 shadow-sm">5+ LICENSES: 25% OFF</span>
                  </div>
                  <p className="text-xs font-bold normal-case text-orange-800 italic leading-relaxed">
                    *IMPORTANT: Bundle discounts automatically apply only to license categories with a tier value of $250 or higher.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start">
                <PlusBullet />
                <div className="space-y-4">
                  <h4 className="font-black text-lg tracking-widest uppercase">Automatic Corporate Switch</h4>
                  <p className="text-lg md:text-xl normal-case text-gray-600 leading-relaxed">If the cumulative price of your selection meets or exceeds the Corporate package value, the system automatically upgrades you to the All-In-One Corporate License.</p>
                </div>
              </div>
            </div>
          </TermCard>

          {/* 04. USAGE TERMS */}
          <TermCard number="04" title="Usage Terms">
            <div className="grid grid-cols-1 gap-y-12">
              {[
                { title: "A. Desktop / Print", desc: "For workstations to create static content (PNG, JPG, PDF) for digital and print media." },
                { title: "B. Digital Media (Social/Web)", desc: "Specifically for digital platforms, including website embedding and social media advertising." },
                { title: "C. Logo & Branding", desc: "Utilize the font as a core element of a visual identity system (Logos, Wordmarks)." },
                { title: "D. App / Game / Ebook", desc: "Embed font software into mobile applications, software, games, or electronic publications." },
                { title: "E. Broadcast", desc: "For motion graphics, television, cinema, streaming, and video advertisements." },
                { title: "F. Server", desc: "Install on a server to facilitate automated end-user customization (Web-to-Print)." },
              ].map((item) => (
                 <div key={item.title} className="flex gap-8 items-start">
                   <PlusBullet />
                   <div className="space-y-4">
                      <h4 className="font-black text-lg tracking-widest uppercase">{item.title}</h4>
                      <p className="text-lg md:text-xl normal-case text-gray-600 leading-relaxed">{item.desc}</p>
                   </div>
                 </div>
              ))}
              <div className="mt-10 bg-black text-white p-14 border border-black shadow-[20px_20px_0px_0px_rgba(234,88,12,1)]">
                <h4 className="font-bold text-3xl md:text-5xl mb-8 tracking-tight uppercase italic underline decoration-orange-600 underline-offset-8">G. Corporate All-In-One</h4>
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