import React from 'react';
import { Plus } from 'lucide-react';

// Shared Bullet Style - Menggunakan Icon Plus (Hitam)
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

  // --- KOMPONEN GARIS SOBEKAN FISIK (The Rip Line) ---
  // Ini adalah kunci kestabilan. Bukan masking, tapi deretan div nyata.
  const PerforationLine = () => (
    // Container vertikal sempit di antara dua bagian kartu
    <div className="relative z-20 w-8 flex flex-col items-center overflow-hidden py-4 -mx-[1px] select-none pointer-events-none">
      {/* Kita buat banyak "lubang". Flexbox akan mengatur jaraknya.
        Jika konten kartu panjang, jarak antar lubang akan merenggang otomatis (justify-between).
      */}
      {[...Array(40)].map((_, i) => (
        // "Lubang" ini sebenarnya div dengan warna background halaman (#EDEBE6)
        // dan border hitam, menciptakan ilusi lubang karcis fisik.
        <div
          key={i}
          className="w-4 h-4 min-h-[1rem] bg-[#EDEBE6] border border-black rounded-full shrink-0 mb-4 last:mb-0"
        />
      ))}
    </div>
  );


  // --- KOMPONEN KARTU KARCIS FISIK (The 3-Part Ticket) ---
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    // Container utama flex row dengan sedikit drop shadow untuk kedalaman
    <div className="flex w-full mb-24 relative filter drop-shadow-[15px_15px_0px_rgba(0,0,0,0.05)] group">
      
      {/* --- BAGIAN 1: BODY KIRI (Konten Utama) --- */}
      <div className="flex-1 bg-white border-y border-l border-black rounded-l-[3rem] p-10 md:p-20 flex flex-col relative z-10">
        {/* Headline di Kiri Atas */}
        <h3 className="text-3xl md:text-6xl font-normal tracking-tighter uppercase leading-none mb-12">
          {title}
        </h3>
        
        {/* Separator */}
        <div className="w-full border-b-2 border-black/10 mb-12" />

        {/* Konten di Bawahnya */}
        <div className="space-y-12 normal-case text-black flex-grow leading-relaxed">
          {children}
        </div>
      </div>

      {/* --- BAGIAN 2: GARIS SOBEKAN TENGAH --- */}
      <PerforationLine />

      {/* --- BAGIAN 3: STUB KANAN (Nomor) --- */}
      {/* Lebar fix (w-32 md:w-60) untuk memastikan bentuk karcis yang sempit di kanan */}
      <div className="w-32 md:w-60 bg-white border-y border-r border-black rounded-r-[3rem] flex items-center justify-center p-4 relative z-10">
        {/* Nomor Besar */}
        <span className="text-6xl md:text-[10rem] font-black opacity-20 tracking-tighter -rotate-90 md:rotate-0">
          {number}
        </span>
      </div>

    </div>
  );


  // --- MAIN RENDER ---
  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-[#EDEBE6] overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right opacity-30" />
      <div className="grain-orb-base orb-bottom-left opacity-30" />

      <div className="w-full relative z-10">
        {/* HEADER SECTION */}
        <header className="px-6 py-16 md:px-8 border-b border-black mb-24 bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-8">
            License Agreement
          </h2>
          <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">
            Clear Additive Terms for Creative Freedom
          </p>
        </header>

        {/* CONTENT MAIN */}
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
            <p className="text-xl md:text-2xl font-normal normal-case leading-relaxed text-gray-800 mb-10 italic">
              Our licensing is tailored to your industry scale, ensuring fair value based on specific usage metrics.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[
                { title: 'Desktop / Print', metric: 'Based on Number of Users (1, 30, 100, or Unlimited).' },
                { title: 'Digital Media (Social/Web)', metric: 'Based on Monthly Impressions/Views (50K, 500K, 2M, or Unlimited).' },
                { title: 'Logo & Branding', metric: 'Based on Total Organization Employees (Personal, 10, 50, 250, or 251+).' },
                { title: 'App / Game / Ebook', metric: 'Based on Number of Titles (1, 10, 50, or Unlimited).' },
                { title: 'Server', metric: 'Based on Number of Active Servers (Single, 50, or Unlimited).' },
                { title: 'Broadcast', metric: 'Based on Geographical Distribution Reach (Regional, National, or Worldwide).' }
              ].map((item) => (
                <BrutalBox key={item.title} className="bg-transparent border-black/20 p-10">
                   <span className="font-black text-sm tracking-widest block mb-4 uppercase">{item.title}</span>
                   <span className="text-sm normal-case text-gray-600 block leading-tight italic">{item.metric}</span>
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

              <div className="flex gap-8 items-start bg-orange-50 p-12 border border-orange-200 rounded-2xl">
                <PlusBullet />
                <div className="space-y-8">
                  <h4 className="font-black text-lg tracking-widest uppercase text-orange-600">Bundle Discount Rules:</h4>
                  <div className="flex flex-wrap gap-6 text-sm font-black uppercase">
                    <span className="bg-white px-6 py-3 border border-orange-200 shadow-sm rounded-lg">3 LICENSES: 15% OFF</span>
                    <span className="bg-white px-6 py-3 border border-orange-200 shadow-sm rounded-lg">4 LICENSES: 20% OFF</span>
                    <span className="bg-white px-6 py-3 border border-orange-200 shadow-sm rounded-lg">5+ LICENSES: 25% OFF</span>
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
                { title: "D. App / Game / Ebook", desc: "Embed font software into mobile applications, games, or electronic publications." },
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
              <div className="mt-10 bg-black text-white p-14 border border-black shadow-[15px_15px_0px_0px_rgba(234,88,12,1)] rounded-3xl">
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
            <BrutalBox className="bg-[#fffafa] border-red-200 p-16 rounded-3xl">
              <p className="text-xl md:text-4xl font-normal normal-case leading-relaxed text-black">
                <span className="font-black uppercase tracking-widest mr-6 italic text-red-600 underline decoration-8 underline-offset-[12px]">Violation:</span>
                Subqi Studio reserves the right to terminate the license immediately if the Licensee fails to comply with any terms, including using tiers lower than their actual industry scale.
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