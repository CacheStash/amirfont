import React from 'react';
import { Plus } from 'lucide-react';

const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 md:p-10 bg-white ${className}`}>
    {children}
  </div>
);

const Policy: React.FC = () => {
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="mb-12 w-full border border-black bg-white relative z-10">
      <div className="border-b border-black p-6 md:p-10 bg-white">
        <h3 className="text-3xl md:text-6xl font-normal tracking-tighter uppercase leading-none">
          <span className="opacity-20 mr-4 md:mr-8">{number}</span>
          {title}
        </h3>
      </div>
      <div className="p-6 md:p-14 space-y-10 normal-case text-gray-800 leading-relaxed text-base md:text-xl">
        {children}
      </div>
    </div>
  );

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* VIBRANT BACKGROUND ORBS - Fixed Back-Layering & Pointer-Events */}
      <div className="grain-orb-base orb-top-right !-z-10 pointer-events-none" />
      <div className="grain-orb-base orb-bottom-left !-z-10 pointer-events-none" />
      <div className="grain-orb-base orb-top-right !top-auto !bottom-0 !-right-[10%] !bg-red-600/20 !-z-10 pointer-events-none" />
      

      <div className="max-w-full mx-auto relative z-10">
        <header className="px-6 py-16 md:px-8 border-b border-black mb-12 bg-transparent text-left">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            Refund & <br className="hidden md:block" /> Exchange Policy
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-widest">
              Software is permanent. Selection should be too.
            </p>
            <p className="text-[10px] md:text-xs font-semibold text-black/40 uppercase tracking-widest">
              — LAST UPDATED: FEBRUARY 21, 2026
            </p>
          </div>
        </header>

        <main className="px-3 md:px-8 max-w-full mx-auto text-left">
          {/* SECTION 1: Digital Nature */}
          <TermCard number="01" title="Digital Nature of Products">
            <p>Due to the nature of digital software, all sales of font licenses from Subqi Studio are considered final and non-refundable. Once a font file has been downloaded, we cannot "reclaim" the software, and therefore cannot offer a refund or credit.</p>
          </TermCard>

          {/* NEW SECTION: Personal Vault */}
          <TermCard number="02" title="The Personal Vault (No Email Links)">
            <p>To ensure long-term security and asset integrity, **Subqi Studio does not send download links via email.** Email links are prone to expiration and security breaches.</p>
            <BrutalBox className="bg-black text-white">
              <p className="italic font-normal">All purchased licenses are stored permanently in your **User Dashboard (Vault)**. This is the only official way to access your files, ensuring you can re-download them anytime, forever.</p>
            </BrutalBox>
          </TermCard>

          {/* SECTION 2: Try Before You Buy */}
          <TermCard number="03" title="Try Before You Buy Requirement">
            <p>To ensure the font meets your technical and aesthetic requirements, we strongly encourage all customers to download our Free for Personal Use (Demo Version) before making a purchase.</p>
            <ul className="space-y-6">
              <li className="flex gap-4 items-start">
                <PlusBullet />
                <span>Use the Demo version to test software compatibility and glyph availability.</span>
              </li>
              <li className="flex gap-4 items-start">
                <PlusBullet />
                <span>By purchasing a commercial license, you acknowledge that you have tested the font and found it suitable.</span>
              </li>
            </ul>
          </TermCard>

          {/* SECTION 3: Technical Issues */}
          <TermCard number="04" title="Technical Issues & Replacements">
            <p>If you experience a technical problem with the font file (e.g., corruption), please contact us within 7 days. We will first attempt to provide a fixed version. If the file is proven defective and unrepairable, a refund or exchange may be issued at our sole discretion.</p>
          </TermCard>

          {/* SECTION 4: Limited Exceptions */}
          <TermCard number="05" title="Limited Exceptions">
            <p>Refunds or exchanges are generally not granted for accidental purchases, compatibility issues with specific software, or change of mind after the download has been initiated.</p>
          </TermCard>

          {/* SECTION 5: License Upgrades */}
          <TermCard number="06" title="License Upgrades">
            <p>If you realize you need a higher tier (e.g., from Individual to Corporate), please reach out. We can often provide a "credit" for your initial purchase toward the cost of the upgraded license.</p>
          </TermCard>

          {/* SECTION 6: Contact */}
          <TermCard number="07" title="Contact Information">
             <BrutalBox className="bg-transparent">
                <p className="text-base md:text-3xl font-bold tracking-tight text-black">amisubqisetiaji@gmail.com</p>
                <p className="text-xs md:text-sm font-normal normal-case text-gray-500 mt-2">Please include your order number and a detailed description of the issue.</p>
              </BrutalBox>
          </TermCard>
        </main>
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default Policy;