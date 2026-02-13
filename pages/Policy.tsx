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

const Policy: React.FC = () => {
  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION - IDENTIK DENGAN PAGE FONTS, LICENSE, & FAQ */}
        <header className="px-6 py-12 md:px-8 border-b border-black bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            Refund & <br className="hidden md:block" /> Exchange Policy
          </h2>
          <p className="text-xs md:text-sm font-normal text-gray-600 uppercase tracking-widest">
            Software is permanent. Selection should be too.
          </p>
        </header>

        {/* CONTENT MAIN */}
        <main className="w-full">
          
          {/* ========================== 
              STRUCTURE: 
              Mobile: Stacked (Col 1 atas, Col 2 bawah)
              Desktop: [600px] | [1fr] | [250px]
          ========================== */}

          {/* SECTION 1: Digital Nature */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start bg-transparent">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Digital Nature <br/> of Products
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                Due to the nature of digital software, all sales of font licenses from Subqi Studio are considered final and non-refundable. 
              </p>
              <BrutalBox className="bg-white/5">
                <p className="text-base md:text-lg normal-case text-gray-700 leading-relaxed italic">
                  Once a font file has been downloaded, we cannot "reclaim" the software, and therefore cannot offer a refund or credit.
                </p>
              </BrutalBox>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 2: Try Before You Buy */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Try Before You Buy <br/> Requirement
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                To ensure the font meets your technical and aesthetic requirements, we strongly encourage all customers to download our Free for Personal Use (Demo Version) before making a purchase.
              </p>
              <ul className="space-y-8">
                <li className="flex gap-4 items-start">
                  <PlusBullet />
                  <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed italic">Use the Demo version to test software compatibility, glyph availability, and overall fit for your project.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <PlusBullet />
                  <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed italic">By purchasing a commercial license, you acknowledge that you have tested the font and found it suitable for your needs.</span>
                </li>
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 3: Technical Issues */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Technical Issues <br/> & Replacements
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                If you experience a technical problem with the font file (e.g., the file is corrupted or does not install correctly), please contact us within 7 days of purchase.
              </p>
              <ul className="space-y-8">
                <li className="flex gap-4 items-start">
                  <PlusBullet />
                  <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">We will first attempt to provide a fixed or updated version of the font file.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <PlusBullet />
                  <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">If the file is proven to be technically defective and cannot be repaired by our team, a refund or exchange may be issued at our sole discretion.</span>
                </li>
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 4: Limited Exceptions */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Limited <br/> Exceptions
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                Refunds or exchanges are generally not granted for:
              </p>
              <ul className="space-y-6">
                {[
                  { t: "Accidental Purchases", d: "Buying the wrong font or license tier by mistake." },
                  { t: "Compatibility Issues", d: "Purchasing a font for software that does not support OpenType features or specific font formats." },
                  { t: "Change of Mind", d: "Deciding you no longer need the font after the download has been initiated." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <PlusBullet />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-black tracking-widest uppercase">{item.t}</span>
                      <span className="text-base normal-case text-gray-600 leading-relaxed italic">{item.d}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 5: License Upgrades */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 License <br/> Upgrades
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                If you have purchased a license tier (e.g., Solo) and realize you need a higher tier (e.g., Team or Studio), please contact us. 
              </p>
              <BrutalBox className="bg-black text-white">
                <p className="text-base md:text-xl font-normal normal-case leading-relaxed">
                  We can often provide a "credit" for your initial purchase toward the cost of the upgraded license, provided it is requested within a reasonable timeframe.
                </p>
              </BrutalBox>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* SECTION 6: Contact */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Contact <br/> Information
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                For technical support or inquiries regarding your purchase, please reach out to us:
              </p>
              <BrutalBox className="bg-transparent">
                <p className="text-base md:text-2xl font-bold tracking-tight text-black">
                  amisubqisetiaji@gmail.com
                </p>
                <p className="text-xs md:text-sm font-normal normal-case text-gray-500 mt-2">
                  Please include your order number and a detailed description of the issue.
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

export default Policy;