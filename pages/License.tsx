import React from 'react';
import { Plus } from 'lucide-react';

// Shared Bullet Style - Icon Plus Hitam
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style - Untuk elemen di dalam kartu
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`p-8 bg-[#fcfcfc] border border-black/5 ${className}`}>
    {children}
  </div>
);

const License: React.FC = () => {

  // --- KOMPONEN KARTU TERMCARD (Model Karcis Transparan) ---
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="relative mb-20 w-full group">
      {/* 1. BACKGROUND LAYER (True Transparency Masking) */}
      <div 
        className="absolute inset-0 bg-white pointer-events-none"
        style={{
          // MASK LOGIC:
          // Layer 1 (Solid Center): Menutup bagian tengah agar TIDAK bolong.
          // Layer 2-5 (Radial Gradients): Membuat lubang di 4 sisi (Atas, Bawah, Kiri, Kanan).
          // Menggunakan 'transparent' agar lubang 100% tembus pandang ke orbs di belakang.
          WebkitMaskImage: `
            linear-gradient(black, black),
            radial-gradient(circle at 25px 0px, transparent 12px, black 13px),
            radial-gradient(circle at 25px 100%, transparent 12px, black 13px),
            radial-gradient(circle at 0px 25px, transparent 12px, black 13px),
            radial-gradient(circle at 100% 25px, transparent 12px, black 13px)
          `,
          // Ukuran area tengah dibuat sedikit lebih kecil dari total kartu untuk menyisakan ruang lubang di tepi.
          // Menggunakan 'round' agar jumlah lubang menyesuaikan tinggi kartu secara otomatis (tidak numpuk).
          WebkitMaskSize: `
            calc(100% - 50px) calc(100% - 50px),
            50px 100%,
            50px 100%,
            100% 50px,
            100% 50px
          `,
          WebkitMaskPosition: 'center center, 0 0, 0 0, 0 0, 0 0',
          WebkitMaskRepeat: 'no-repeat, repeat-x, repeat-x, repeat-y, repeat-y',
          WebkitMaskComposite: 'source-over, destination-in, destination-in, destination-in, destination-in',
          maskComposite: 'exclude'
        }}
      />

      {/* 2. CONTENT LAYER */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-[300px]">
        
        {/* SISI KIRI: Headline & Konten */}
        <div className="flex-grow p-10 md:p-20 flex flex-col border-r-2 border-dashed border-[#EDEBE6]">
          {/* Headline Atas */}
          <h3 className="text-3xl md:text-7xl font-normal tracking-tighter uppercase mb-8 leading-none">
            {title}
          </h3>
          
          <div className="w-full border-b border-black/5 mb-10" />

          {/* Konten Utama */}
          <div className="space-y-10 normal-case text-gray-700 leading-relaxed text-base md:text-xl">
            {children}
          </div>
        </div>

        {/* SISI KANAN (STUB): Nomor Term */}
        <div className="w-full md:w-64 flex items-center justify-center p-8 md:p-0">
          <span className="text-8xl md:text-[12rem] font-normal tracking-tighter uppercase opacity-10 leading-none select-none">
            {number}
          </span>
        </div>
      </div>
    </div>
  );


  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-[#EDEBE6] overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS - Terlihat menembus lubang kartu */}
      <div className="grain-orb-base orb-top-right opacity-40" />
      <div className="grain-orb-base orb-bottom-left opacity-40" />

      <div className="w-full relative z-10">
        {/* HEADER SECTION - Ukuran disesuaikan dengan Faq/FontDetail */}
        <header className="px-6 py-16 md:px-8 border-b border-black/10 mb-20 bg-transparent">
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
                { label: "Usage Grant:", val: "Permitted only for personal, non-commercial projects (e.g., student assignments or portfolio pieces)." },
                { label: "Character Set:", val: "The Demo version is a 'Trial' file and contains a limited glyph set." },
                { label: "Restrictions:", val: "You may not use the Demo version for any business, promotional, or revenue-generating activities." }
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
                { title: 'Desktop / Print', metric: 'Based on Number of Users (1, 30, 100, or Unlimited).' },
                { title: 'Digital Media (Social/Web)', metric: 'Based on Monthly Impressions/Views (50K, 500K, 2M, or Unlimited).' },
                { title: 'Logo & Branding', metric: 'Based on Total Organization Employees (Personal, 10, 50, 250, or 251+).' },
                { title: 'App / Game / Ebook', metric: 'Based on Number of Titles (1, 10, 50, or Unlimited).' },
                { title: 'Server', metric: 'Based on Number of Active Servers (Single, 50, or Unlimited).' },
                { title: 'Broadcast', metric: 'Based on Geographical Distribution Reach (Regional, National, or Worldwide).' }
              ].map((item) => (
                <BrutalBox key={item.title}>
                   <span className="font-black text-sm tracking-widest block mb-2 uppercase">{item.title}</span>
                   <span className="text-xs normal-case text-gray-500 block leading-tight italic">{item.metric}</span>
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
                  <p className="opacity-70">Licenses are sold individually. Selecting one category does not cover others. You only pay for the specific usages you need for your project.</p>
                </div>
              </div>

              <div className="flex gap-8 items-start bg-orange-50/50 p-12 rounded-lg">
                <PlusBullet />
                <div className="space-y-6">
                  <h4 className="font-black text-lg tracking-widest uppercase text-orange-600">Bundle Discount Rules:</h4>
                  <div className="flex flex-wrap gap-8 text-xs font-black uppercase">
                    <span className="bg-white px-5 py-2">3 LICENSES: 15% OFF</span>
                    <span className="bg-white px-5 py-2">4 LICENSES: 20% OFF</span>
                    <span className="bg-white px-5 py-2">5+ LICENSES: 25% OFF</span>
                  </div>
                  <p className="text-xs font-bold normal-case text-orange-800 italic leading-relaxed">
                    *IMPORTANT: Bundle discounts automatically apply only to license categories with a tier value of $250 or higher.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start">
                <PlusBullet />
                <div className="space-y-2">
                  <h4 className="font-black text-lg tracking-widest uppercase">Automatic Corporate Switch</h4>
                  <p className="opacity-70">If the cumulative price of your selection meets or exceeds the Corporate price, the system automatically upgrades you to the All-In-One Corporate License.</p>
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
              <div className="mt-8 bg-black text-white p-14 rounded-3xl">
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
                "Backup copies are permitted for archival purposes only on secure servers."
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
            <div className="bg-[#fffafa] p-16 rounded-3xl">
              <p className="text-xl md:text-4xl font-normal normal-case leading-relaxed text-black">
                <span className="font-black uppercase tracking-widest mr-6 italic text-red-600 underline decoration-8 underline-offset-[12px]">Violation:</span>
                Subqi Studio reserves the right to terminate the license immediately if terms are not met.
              </p>
            </div>
          </TermCard>

        </main>

        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default License;