import React from 'react';
import { Plus } from 'lucide-react';

// Shared Bullet Style - Menggunakan Icon Plus (Hitam)
const PlusBullet = () => (
  <Plus size={14} className="shrink-0 mt-[0.4em] text-black" strokeWidth={3} />
);

// Shared Box Style - Border 1px konsisten
const BrutalBox: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`border border-black p-8 md:p-10 bg-white ${className}`}>
    {children}
  </div>
);

// Brutalist Table Component
const BrutalTable: React.FC<{ headers: string[], rows: string[][], title?: string }> = ({ headers, rows, title }) => (
  <div className="w-full border border-black mb-10 overflow-hidden">
    {title && (
      <div className="bg-black text-white p-4 font-bold text-xs md:text-sm tracking-[0.2em] uppercase">
        {title}
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-black bg-[#f9f9f9]">
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
  </div>
);

const FAQ: React.FC = () => {
  const TermCard: React.FC<{ number: string, title: string, children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="mb-12 w-full border border-black bg-white relative z-10">
      <div className="border-b border-black p-6 md:p-10 bg-white">
        <h3 className="text-2xl md:text-5xl font-normal tracking-tighter uppercase leading-tight">
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
      {/* VIBRANT BACKGROUND ORBS */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left !top-[40%] !-left-[15%] !opacity-40" />
      <div className="grain-orb-base orb-top-right !top-auto !bottom-0 !-right-[10%] !bg-red-600/20" />

      <div className="max-w-full mx-auto relative z-10">
        {/* HEADER SECTION */}
        <header className="px-6 py-16 md:px-8 border-b border-black mb-12 bg-transparent text-left">
          <h2 className="text-5xl md:text-8xl font-normal uppercase tracking-tighter leading-[0.85] mb-6">
            Frequently Asked <br className="hidden md:block" /> Questions
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-widest">
              Clarity for Your Creative Workflow
            </p>
            <p className="text-[10px] md:text-xs font-semibold text-black/40 uppercase tracking-widest">
              — LAST UPDATED: FEBRUARY 21, 2026
            </p>
          </div>
        </header>

        <main className="px-3 md:px-8 max-w-full mx-auto text-left">
          {/* Q1: Business Demo */}
          <TermCard number="Q1" title="Can I use the Demo version for my business?">
            <p>No. The Free/Demo version is strictly for non-commercial testing, student projects, or personal use. It contains a limited glyph set and no OpenType features. For any revenue-generating activity or promotional content, a commercial license is required.</p>
          </TermCard>

          {/* Q2: Access & Credentials Flow */}
          <TermCard number="Q2" title="How do I access my files and license credentials?">
            <div className="space-y-8">
              <p>To ensure maximum security and prevent link expiration, **Subqi Studio does not distribute download links via email**.</p>
              
              <div className="space-y-4">
                <p className="font-bold uppercase tracking-tight">Instant Delivery & Manual Login:</p>
                <ul className="space-y-6">
                  <li className="flex gap-4 items-start border-l-2 border-black/10 pl-6 py-2">
                    <PlusBullet />
                    <span>**Instant Access:** Upon successful payment, secure download buttons are generated immediately on your **Checkout Receipt**. You can download your assets instantly without leaving the page.</span>
                  </li>
                  <li className="flex gap-4 items-start border-l-2 border-black/10 pl-6 py-2">
                    <PlusBullet />
                    <span>**Manual Login:** To access your permanent library, navigate to the **User Dashboard**. Use your **Registered Email** and the **Checkout Code (Order ID)** as your initial password.</span>
                  </li>
                </ul>
              </div>

              <BrutalBox className="bg-black text-white space-y-6">
                <div className="space-y-2">
                  <h4 className="font-black text-xs tracking-[0.2em] text-orange-500 uppercase">Vital Record: LICENSE.TXT</h4>
                  <p className="text-sm normal-case italic opacity-80 leading-relaxed">
                    Every downloaded .zip package contains a **license.txt** file. This document explicitly lists your **registered email** and the **Checkout Code** required for dashboard access. **Please keep this file safe as your primary credential record.**
                  </p>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm normal-case leading-relaxed">
                    **Lost Access?** Your Checkout Code functions as a perpetual **Password Resetter**. If you perform multiple transactions using the same email, each subsequent Checkout Code is added to your account as a valid resetter; it does not overwrite your existing password.
                  </p>
                </div>
              </BrutalBox>
            </div>
          </TermCard>

          {/* Q3: Picking Levels */}
          <TermCard number="Q3" title="Which level should buyer pick for their needs?">
            <p>Our licenses are tailored to your industry scale. Select the specific level within each category based on these metrics:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { t: "Desktop / Print", d: "Based on total users: 1, 30, 100, or Unlimited." },
                { t: "Digital Media", d: "Based on monthly views/impressions: 50K, 500K, 2M, or Unlimited." },
                { t: "Logo & Branding", d: "Based on organization size: Personal, 10, 50, 250, or 251+ employees." },
                { t: "App / Game / Ebook", d: "Based on total number of titles: 1, 10, 50, or Unlimited." },
                { t: "Server", d: "Based on active servers: Single, 50, or Unlimited." },
                { t: "Broadcast", d: "Based on distribution reach: Regional, National, or Worldwide." }
              ].map((lvl) => (
                <div key={lvl.t} className="p-6 border border-black/10 bg-[#f9f9f9]">
                  <span className="font-bold text-xs uppercase tracking-widest block mb-1">{lvl.t}</span>
                  <span className="text-xs normal-case italic opacity-60">{lvl.d}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 font-bold">Need it all? The **Corporate All-In-One** covers all categories with unlimited scale for your entire global corporation.</p>
          </TermCard>

          {/* Q4: Additive Logic */}
          <TermCard number="Q4" title="How does the Additive Pricing work?">
            <p>Licenses are sold individually. Selecting one category (e.g., Logo) does not cover others (e.g., App). You only pay for the specific usages you need. If your total meets the Corporate value, the system automatically upgrades you to the All-In-One license.</p>
          </TermCard>

          {/* Q5: Logo vs Desktop */}
          <TermCard number="Q5" title="Do I need a Logo license if I have Desktop?">
            <p>Yes. A Desktop License covers general design work. However, if the font is used as a permanent wordmark or core visual identity element, a Logo & Branding License is mandatory to cover trademarking rights.</p>
          </TermCard>

          {/* Q6: Sending to Clients */}
          <TermCard number="Q6" title="Can I send the font file to my client?">
            <p>No. You may not redistribute the font software. You should provide outlined vector files (AI/EPS) or a PDF. If the client needs to install the font for edits, they must purchase their own license.</p>
          </TermCard>

          {/* Q7: Corporate Switch */}
          <TermCard number="Q7" title="What is the Automatic Corporate Switch?">
            <p>If the total price of your custom selections (after bundle discounts) meets or exceeds our Corporate Package value, the system will automatically upgrade your order to the **All-In-One Corporate License**.</p>
          </TermCard>

          {/* COMPREHENSIVE TABLES */}
          <BrutalTable 
            title="1. License Metrics (Industry Scales)"
            headers={["Category", "Primary Metric", "Tiers / Levels"]}
            rows={[
              ["Desktop / Print", "Number of Users", "1 | 30 | 100 | Unlimited"],
              ["Digital Media", "Monthly Views", "50K | 500K | 2M | Unlimited"],
              ["Logo & Branding", "Total Employees", "Personal | 10 | 50 | 250 | 251+"],
              ["App / Game", "Number of Titles", "1 | 10 | 50 | Unlimited"],
              ["Server", "Number of Servers", "Single | 50 | Unlimited"],
              ["Broadcast", "Distribution Reach", "Regional | National | Worldwide"]
            ]}
          />

          <BrutalTable 
            title="2. Usage Coverage Comparison"
            headers={["Usage Rights", "Individual Additive", "Corporate All-In-One"]}
            rows={[
              ["Commercial Use", "✅ (Category Specific)", "✅ (Full Access)"],
              ["Global Scaling", "❌ (Tier Limited)", "✅ (Unlimited)"],
              ["Internal Sharing", "✅ (User Limited)", "✅ (Organization-Wide)"],
              ["Embed in Software", "✅ (Category Only)", "✅ (Included)"],
              ["TV / Cinema", "✅ (Category Only)", "✅ (Included)"]
            ]}
          />

        </main>
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default FAQ;