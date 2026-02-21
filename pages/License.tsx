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


          {/* 2. INDUSTRY METRICS & TIERS */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start gap-8">
               <span className="text-8xl md:text-[120px] font-normal tracking-tighter leading-none -mt-2">02</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Industry <br/> Metrics
               </h3>
            </div>
            
            <div className="p-6 md:p-10 md:border-r border-black space-y-12">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
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
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>


          {/* 3. ADDITIVE PRICING & BUNDLE SAVINGS */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start gap-8">
               <span className="text-8xl md:text-[120px] font-normal tracking-tighter leading-none -mt-2">03</span>
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Pricing <br/> Logic
               </h3>
            </div>

            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <div className="space-y-8">
                <div className="flex gap-4 items-start">
                  <PlusBullet />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm tracking-widest uppercase">Additive Selection:</h4>
                    <p className="text-base normal-case text-gray-600 leading-relaxed">Licenses are sold individually. Selecting one license category (e.g., Logo) does not automatically cover others (e.g., Web). You only pay for exactly what you need.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-orange-50/50 p-4 border border-orange-200">
                  <PlusBullet />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm tracking-widest uppercase text-orange-600">Bundle Discount Rules:</h4>
                    <p className="text-base normal-case text-gray-600 leading-relaxed italic">Get automated savings when purchasing multiple categories:</p>
                    <ul className="text-xs font-bold space-y-1 mt-2 uppercase tracking-tighter">
                      <li>• 3 Licenses: 15% OFF</li>
                      <li>• 4 Licenses: 20% OFF</li>
                      <li>• 5 Licenses: 25% OFF</li>
                    </ul>
                    <p className="text-[10px] normal-case text-gray-400 mt-2">*Note: Discounts only apply to license tiers with a minimum value of $250 each.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <PlusBullet />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm tracking-widest uppercase">Automatic Corporate Switch:</h4>
                    <p className="text-base normal-case text-gray-600 leading-relaxed">If the cumulative price of your selection (after bundle discounts) meets or exceeds the Corporate All-In-One price, the system will automatically upgrade your license to the Corporate tier.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>


          {/* 4. LICENSE DEFINITIONS */}
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
                <div className="mt-4 bg-black text-white p-8 border border-black shadow-[8px_8px_0px_0px_rgba(234,88,12,1)]">
                  <h4 className="font-bold text-xl md:text-2xl mb-4 tracking-tight uppercase">G. Corporate All-In-One</h4>
                  <p className="text-base md:text-lg normal-case leading-relaxed text-gray-400 italic">
                    The ultimate comprehensive license. Covers all six categories (Desktop, Web, Logo, App, Broadcast, and Server) with unlimited scale for the entire corporation.
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>


          {/* 5. INTELLECTUAL PROPERTY */}
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
                  "You may not modify, adapt, or decompile the font software binaries.",
                  "The font software and its intellectual property remain the sole property of Subqi Studio.",
                  "Backup copies are permitted for archival purposes only on the Licensee's secure server."
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
                  <span className="font-bold uppercase tracking-wider mr-2 italic text-red-600">Violation:</span>
                  Subqi Studio reserves the right to terminate the license immediately if the Licensee fails to comply with any terms, including using tiers lower than their actual industry scale.
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