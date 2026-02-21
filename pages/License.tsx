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
  // Komponen Lubang Perforasi Karcis (Texture Bolong-Bolong)
  const TicketEdges = () => (
    <>
      {/* Top Punches */}
      <div className="absolute top-0 left-0 w-full flex justify-around -mt-2 overflow-hidden px-4 pointer-events-none select-none">
        {[...Array(40)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-[#EDEBE6] rounded-full border border-black/5 shrink-0" />
        ))}
      </div>
      {/* Bottom Punches */}
      <div className="absolute bottom-0 left-0 w-full flex justify-around -mb-2 rotate-180 overflow-hidden px-4 pointer-events-none select-none">
        {[...Array(40)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-[#EDEBE6] rounded-full border border-black/5 shrink-0" />
        ))}
      </div>
      {/* Left Punches */}
      <div className="absolute top-0 left-0 h-full flex flex-col justify-around -ml-2 overflow-hidden py-4 pointer-events-none select-none">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-[#EDEBE6] rounded-full border border-black/5 shrink-0" />
        ))}
      </div>
      {/* Right Punches */}
      <div className="absolute top-0 right-0 h-full flex flex-col justify-around -mr-2 overflow-hidden py-4 pointer-events-none select-none">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-[#EDEBE6] rounded-full border border-black/5 shrink-0" />
        ))}
      </div>
    </>
  );

  // Komponen Pembungkus Kartu
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="relative bg-white border border-black p-8 md:p-14 mb-14 mx-auto w-full shadow-[20px_20px_0px_0px_rgba(0,0,0,0.05)]">
      <TicketEdges />
      <div className="relative z-10">
        <h3 className="text-2xl md:text-5xl font-normal tracking-tighter uppercase mb-6 flex items-baseline gap-4">
          <span className="opacity-20 text-xl md:text-3xl font-black">{number}</span>
          {title}
        </h3>
        <div className="border-b-2 border-black w-full mb-10 opacity-10" />
        <div className="space-y-8">
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
        <header className="px-3 md:px-8 py-16 md:py-24 border-b border-black mb-14">
          <h2 className="text-6xl md:text-[10rem] font-normal uppercase tracking-tighter leading-[0.8] mb-8">
            License Agreement
          </h2>
          <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">
            Clear Terms for Creative Freedom
          </p>
        </header>

        <main className="px-3 md:px-8 max-w-full mx-auto">
          
          {/* 01. PERSONAL USE */}
          <TermCard number="01" title="Personal Use (Demo)">
            <p className="text-lg md:text-2xl font-normal normal-case leading-relaxed text-gray-800">
              This license applies specifically to the "Demo" versions of our font software.
            </p>
            <div className="space-y-6">
              {[
                { label: "Usage Grant:", val: "Permitted only for personal, non-commercial projects (e.g., student assignments, personal portfolio pieces, or non-profit testing)." },
                { label: "Character Set:", val: "The Demo version is a 'Trial' file and contains a limited glyph set." },
                { label: "Restrictions:", val: "You may not use the Demo version for any business, promotional, social media advertising, or revenue-generating activities." }
              ].map((item) => (
                <div key={item.label} className="flex gap-4 items-start">
                  <PlusBullet />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-black tracking-widest uppercase">{item.label}</span>
                    <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed italic">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </TermCard>

          {/* 02. INDUSTRY METRICS */}
          <TermCard number="02" title="Industry Metrics">
            <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800 mb-8">
              Our licensing is tailored to your industry scale, ensuring fair value based on specific usage metrics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Desktop / Print', metric: 'Based on Number of Users (1, 30, 100, or Unlimited).' },
                { title: 'Digital Media', metric: 'Based on Monthly Views (50K, 500K, 2M, or Unlimited).' },
                { title: 'Logo & Branding', metric: 'Based on Total Company Employees (Personal, 10, 50, 250, or 251+).' },
                { title: 'App / Game / Ebook', metric: 'Based on Number of Titles (1, 10, 50, or Unlimited).' },
                { title: 'Server', metric: 'Based on Number of Servers (Single, 50, or Unlimited).' },
                { title: 'Broadcast', metric: 'Based on Distribution Reach (Regional, National, or Worldwide).' }
              ].map((item) => (
                <BrutalBox key={item.title} className="bg-transparent border-black/20">
                   <span className="font-bold text-sm tracking-widest block mb-2 uppercase">{item.title}</span>
                   <span className="text-xs normal-case text-gray-600 block leading-tight italic">{item.metric}</span>
                </BrutalBox>
              ))}
            </div>
          </TermCard>

          {/* 03. PRICING LOGIC */}
          <TermCard number="03" title="Pricing Logic">
            <div className="space-y-10">
              <div className="flex gap-4 items-start">
                <PlusBullet />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm tracking-widest uppercase">Additive Selection:</h4>
                  <p className="text-base normal-case text-gray-600 leading-relaxed">Licenses are sold individually. Selecting one license category does not automatically cover others. You only pay for exactly what you need.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start bg-orange-50/50 p-6 border border-orange-200">
                <PlusBullet />
                <div className="space-y-2">
                  <h4 className="font-bold text-sm tracking-widest uppercase text-orange-600">Bundle Discount Rules:</h4>
                  <ul className="text-xs font-bold space-y-2 uppercase tracking-tighter">
                    <li className="flex justify-between border-b border-orange-200 pb-1"><span>3 Licenses</span><span>15% OFF</span></li>
                    <li className="flex justify-between border-b border-orange-200 pb-1"><span>4 Licenses</span><span>20% OFF</span></li>
                    <li className="flex justify-between border-b border-orange-200 pb-1"><span>5 Licenses</span><span>25% OFF</span></li>
                  </ul>
                  <p className="text-[10px] normal-case text-gray-400 mt-4">*Note: Discounts only apply to license tiers with a minimum value of $250 each.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <PlusBullet />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm tracking-widest uppercase">Automatic Corporate Switch:</h4>
                  <p className="text-base normal-case text-gray-600 leading-relaxed">If the cumulative price of your selection (after discounts) meets the Corporate price, the system will automatically upgrade your license to the Corporate tier.</p>
                </div>
              </div>
            </div>
          </TermCard>

          {/* 04. USAGE TERMS */}
          <TermCard number="04" title="Usage Terms">
            <div className="space-y-10">
              {[
                { title: "A. Desktop / Print", desc: "Install on workstations to create static content (PNG, JPG, PDF) for digital and print media. Tiered by number of users." },
                { title: "B. Digital Media (Social/Web)", desc: "Specifically for digital platforms, including website embedding and social media content. Tiered by monthly impressions/views." },
                { title: "C. Logo & Branding", desc: "Utilize the font as a core element of a visual identity system. Tiered by the total number of employees in the organization." },
                { title: "D. App / Game / Ebook", desc: "Embed the font software into mobile applications, software, games, or electronic publications. Tiered by number of titles/projects." },
                { title: "E. Broadcast", desc: "Utilize the font in motion graphics, television, cinema, streaming services, and video advertisements. Tiered by geographical reach." },
                { title: "F. Server", desc: "Install on a server to facilitate end-user product customization (Web-to-Print services). Tiered by number of active servers." },
              ].map((item) => (
                 <div key={item.title} className="flex gap-4 items-start">
                   <PlusBullet />
                   <div className="space-y-1">
                      <h4 className="font-bold text-sm tracking-widest uppercase">{item.title}</h4>
                      <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">{item.desc}</p>
                   </div>
                 </div>
              ))}
              <div className="mt-4 bg-black text-white p-10 border border-black shadow-[10px_10px_0px_0px_rgba(234,88,12,1)]">
                <h4 className="font-bold text-xl md:text-3xl mb-4 tracking-tight uppercase">G. Corporate All-In-One</h4>
                <p className="text-base md:text-xl normal-case leading-relaxed text-gray-400 italic">
                  The ultimate comprehensive license. Covers all six categories with unlimited scale for the entire corporation.
                </p>
              </div>
            </div>
          </TermCard>

          {/* 05. GENERAL RULES */}
          <TermCard number="05" title="General Rules">
            <ul className="space-y-8">
              {[
                "You may not sell, rent, sublicense, or redistribute the font files to any third party.",
                "You may not modify, adapt, or decompile the font software binaries.",
                "The font software and its intellectual property remain the sole property of Subqi Studio.",
                "Backup copies are permitted for archival purposes only on the Licensee's secure server."
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-6">
                  <PlusBullet /> 
                  <span className="font-normal text-base md:text-xl tracking-tight normal-case text-gray-700">{rule}</span>
                </li>
              ))}
            </ul>
          </TermCard>

          {/* 06. LEGAL BREACH */}
          <TermCard number="06" title="Legal Breach">
            <BrutalBox className="bg-transparent border-black">
              <p className="text-base md:text-2xl font-normal normal-case leading-relaxed text-black">
                <span className="font-bold uppercase tracking-wider mr-2 italic text-red-600">Violation:</span>
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