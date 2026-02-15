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

// Brutalist Table Component
const BrutalTable: React.FC<{ headers: string[], rows: string[][], title?: string }> = ({ headers, rows, title }) => (
  <div className="w-full overflow-x-auto md:overflow-hidden border border-black mb-10">
    {title && (
      <div className="bg-black text-white p-4 font-bold text-xs md:text-sm tracking-[0.2em] uppercase">
        {title}
      </div>
    )}
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-black bg-white/10">
          {headers.map((h, i) => (
            <th key={i} className="p-4 border-r border-black last:border-0 font-bold text-[10px] md:text-xs uppercase tracking-widest text-gray-500">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-black last:border-0">
            {row.map((cell, j) => (
              <td key={j} className={`p-4 border-r border-black last:border-0 font-normal text-xs md:text-sm normal-case leading-tight ${cell === '❌' ? 'text-red-500 font-bold' : cell === '✅' ? 'text-green-600 font-bold' : 'text-black'}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FAQ: React.FC = () => {
  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden uppercase">
      {/* BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION - IDENTIK DENGAN PAGE FONTS & LICENSE */}
        <header className="px-6 py-12 md:px-8 border-b border-black bg-transparent">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            Frequently Asked <br className="hidden md:block" /> Questions
          </h2>
          <p className="text-xs md:text-sm font-normal text-gray-600 uppercase tracking-widest">
            Clarity for Your Creative Workflow
          </p>
        </header>

        {/* CONTENT MAIN */}
        <main className="w-full">
          
          {/* ========================== 
              STRUCTURE: [600px] | [1fr] | [250px - SMALLER BLANK]
          ========================== */}

          {/* Q1: Free for Personal Use */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start bg-transparent">
               <h3 className="text-2xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Can I use the <br/> "Free for Personal <br/> Use" version for <br/> my business?
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800 italic">
                No. The Free/Demo version is strictly for non-commercial testing, student projects, or personal use.
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <PlusBullet />
                  <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">It also contains a limited character set.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <PlusBullet />
                  <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">For any revenue-generating activity, social media promotion, or client work, you must purchase a commercial license.</span>
                </li>
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* Q2: Seat Tier */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-2xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Which seat <br/> tier should <br/> I choose?
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                The tier depends on how many people in your organization will have the font installed on their computers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { l: 'Solo', v: '1 User/Workstation.' },
                  { l: 'Team', v: 'Up to 25 Users/Workstations.' },
                  { l: 'Studio', v: 'Up to 100 Users/Workstations.' },
                  { l: 'Enterprise', v: 'Unlimited Users within organization.' }
                ].map((tier) => (
                  <BrutalBox key={tier.l} className="bg-[#F3F2EF]/30">
                     <span className="font-bold text-sm tracking-widest block mb-2">{tier.l}</span>
                     <span className="text-xs normal-case text-gray-600 block leading-tight">{tier.v}</span>
                  </BrutalBox>
                ))}
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* Q3: Small Team / Solo */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-2xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Small team, <br/> but we only <br/> want a Solo <br/> license?
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                Yes, but with strict limitations. A Solo License allows the font to be installed on only one (1) computer at a time.
              </p>
              <ul className="space-y-6">
                {[
                  "If multiple people need to use it, they must share that specific workstation.",
                  "Alternatively, uninstall the font from one machine before installing on another.",
                  "For simultaneous use on multiple computers, a Team or Studio license is required."
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <PlusBullet />
                    <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* Q4: Traffic Exceed */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-2xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 What if my <br/> traffic exceeds <br/> my current <br/> license?
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                Our licenses are based on monthly pageviews/impressions.
              </p>
              <BrutalBox className="bg-transparent">
                 <p className="text-base md:text-lg normal-case text-gray-700 leading-relaxed italic">
                  If your traffic grows and consistently exceeds your current tier (e.g., Small reaching 100,000 views), you are required to upgrade to the next tier (Medium) to remain in compliance.
                 </p>
              </BrutalBox>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* Q5: Logo vs Desktop */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-2xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Do I need a <br/> Logo license <br/> if I have a <br/> Desktop license?
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                Yes. A Desktop License allows you to use the font for general design work (flyers, posters, etc.).
              </p>
              <div className="flex gap-6 items-start">
                <PlusBullet />
                <p className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">
                  However, if the font becomes a core part of a brand's identity (a permanent logo or wordmark), a Logo & Branding License is required to cover the specific legal rights for trademarking.
                </p>
              </div>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* Q6: Sending files */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-2xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Can I send the <br/> font file to my <br/> client or <br/> printer?
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-8">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800">
                No. You may not distribute the font files. 
              </p>
              <ul className="space-y-6">
                {[
                  "Provide your client with outlined vector files (AI/EPS) or a PDF.",
                  "If your client needs to install the font on their own system to make edits, they must purchase their own license from Subqi Studio."
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <PlusBullet /> 
                    <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* Q7: Corporate Suite */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-2xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 What is the <br/> "Corporate <br/> Full Suite"?
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800 italic">
                This is our most comprehensive option.
              </p>
              <BrutalBox className="bg-black text-white">
                <p className="text-base md:text-xl font-normal normal-case leading-relaxed">
                  It removes the need to track seats or pageviews by granting your entire company the right to use the font across all platforms—Desktop, Web, Logo, App, and Broadcast—without any limitations.
                </p>
              </BrutalBox>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>
           
           {/* Q8: Account Benefits */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start bg-transparent">
               <h3 className="text-2xl md:text-5xl font-normal tracking-tight leading-[1.1] mt-1">
                 Why should I <br/> create a <br/> member account?
               </h3>
            </div>
            <div className="p-6 md:p-10 md:border-r border-black space-y-10">
              <p className="text-lg md:text-xl font-normal normal-case leading-relaxed text-gray-800 italic">
                Your dashboard acts as a permanent vault for your assets.
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <PlusBullet />
                  <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">Any font license you purchase is stored there forever, allowing you to re-download your files anytime.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <PlusBullet />
                  <span className="text-base md:text-lg normal-case text-gray-600 leading-relaxed">Accounts that only contain "Free Trial" fonts are automatically cleared every 30 days to maintain database health.</span>
                </li>
              </ul>
            </div>
            <div className="hidden md:block bg-transparent" />
          </section>

          {/* ========================== 
              COMPARISON TABLES SECTION
          ========================== */}
          <section className="grid grid-cols-1 md:grid-cols-[600px_1fr_250px] border-b border-black items-stretch bg-white/5">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-black flex items-start">
               <h3 className="text-3xl md:text-6xl font-normal tracking-tighter leading-[1.1]">
                 License <br/> Comparison
               </h3>
            </div>

            <div className="p-6 md:p-10 md:border-r border-black space-y-16">
              {/* Table 1 */}
              <BrutalTable 
                title="1. Standard Commercial Licenses (Seat-Based)"
                headers={["License Tier", "Users/Seats", "Ideal For", "Installation Rule"]}
                rows={[
                  ["Solo", "1 User", "Freelancers", "1 Workstation (transferable)"],
                  ["Team", "Up to 25", "Startups", "25 Workstations simultaneous"],
                  ["Studio", "Up to 100", "Mid-sized Studios", "100 Workstations simultaneous"],
                  ["Enterprise", "Unlimited", "Large Corps", "Unlimited Workstations"]
                ]}
              />

              {/* Table 2 */}
              <BrutalTable 
                title="2. Social Media & Web License (Reach-Based)"
                headers={["Tier", "Monthly Views", "Best For"]}
                rows={[
                  ["Small", "Up to 50,000", "Personal blogs / Micro-influencers"],
                  ["Medium", "Up to 500,000", "Small businesses / Growing creators"],
                  ["Large", "Up to 5,000,000", "Large publications / Viral brands"],
                  ["Enterprise", "Unlimited", "High-traffic platforms / Global campaigns"]
                ]}
              />

              {/* Table 3 */}
              <BrutalTable 
                title="3. Comparison at a Glance"
                headers={["Feature", "Free Demo", "Commercial", "Corporate Full Suite"]}
                rows={[
                  ["Commercial Use", "❌", "✅", "✅"],
                  ["Full Glyph Set", "❌ (Limited)", "✅", "✅"],
                  ["Desktop / Print", "✅ (Personal Only)", "✅", "✅"],
                  ["Web / Social Media", "❌", "✅ (Tiered)", "✅ (Unlimited)"],
                  ["Logo / Branding", "❌", "✅ (Optional)", "✅"],
                  ["App / Broadcast", "❌", "✅ (Optional)", "✅"],
                  ["Multiple Users", "❌", "Depends on Tier", "✅ (Unlimited)"]
                ]}
              />

              {/* Pro-Tip Section */}
              <div className="border border-black p-8 md:p-12 space-y-4">
                <h4 className="font-bold text-sm md:text-base tracking-[0.2em] uppercase flex items-center gap-4">
                  <span className="bg-black text-white px-2 py-1">Pro-Tip</span> for your Website:
                </h4>
                <p className="text-lg md:text-2xl font-normal normal-case leading-tight text-black">
                  Need it all? If your organization requires multi-user access across multiple platforms, the Corporate Full Suite is our most cost-effective and legally secure option.
                </p>
              </div>
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

export default FAQ;