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

const BrutalTable: React.FC<{ headers: string[], rows: string[][], title?: string }> = ({ headers, rows, title }) => (
  <div className="w-full border border-black mb-10 overflow-hidden">
    {title && <div className="bg-black text-white p-4 font-bold text-xs md:text-sm tracking-[0.2em] uppercase">{title}</div>}
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-black bg-[#f9f9f9]">
          {headers.map((h, i) => (
            <th key={i} className="p-4 border-r border-black last:border-0 font-bold text-[10px] md:text-xs uppercase tracking-widest text-gray-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-black last:border-0">
            {row.map((cell, j) => (
              <td key={j} className={`p-4 border-r border-black last:border-0 font-normal text-xs md:text-sm normal-case leading-tight ${cell === '❌' ? 'text-red-500 font-bold' : cell === '✅' ? 'text-green-600 font-bold' : 'text-black'}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
            <p>No. The Free/Demo version is strictly for non-commercial testing, student projects, or personal use. For any revenue-generating activity, social media promotion, or client work, a commercial license is mandatory.</p>
          </TermCard>

          {/* Q2: Dashboard Logic */}
          <TermCard number="Q2" title="Why do I need an account to download?">
            <p>Security and longevity. We do not send files or download links via email because email links can be intercepted, expire, or get buried in spam. Your email acts as a key to your **Permanent Asset Vault** on our dashboard, ensuring you can re-download your fonts anytime, for life.</p>
          </TermCard>

          {/* Q3: Seat Tiers */}
          <TermCard number="Q3" title="Which tier should I choose for my team?">
            <p>Desktop/Print tiers depend on how many workstations will have the font installed. If you have 5 designers using the font simultaneously, you need a tier that covers up to 30 users. For Digital Media, it is based on your monthly pageviews/impressions.</p>
          </TermCard>

          {/* Q4: Additive Logic */}
          <TermCard number="Q4" title="How does the Additive Pricing work?">
            <p>Our system is retail-based. Selecting one category (e.g., Logo) does not automatically cover others (e.g., Web). You only pay for exactly what you need. If you purchase multiple categories, bundle discounts will be applied automatically to items over $250.</p>
          </TermCard>

          {/* Q5: Logo vs Desktop */}
          <TermCard number="Q5" title="Do I need a Logo license if I have Desktop?">
            <p>Yes. If the font becomes a core part of a brand's identity (a permanent logo or wordmark), a Logo & Branding License is required to cover the specific legal rights for trademarking.</p>
          </TermCard>

          {/* Q6: Sending to Clients */}
          <TermCard number="Q6" title="Can I send the font file to my client?">
            <p>No. You may not redistribute the font software. You should provide your client with outlined vector files (AI/EPS) or a PDF. If they need to install it to make edits, they must purchase their own license.</p>
          </TermCard>

          {/* Q7: Corporate Switch */}
          <TermCard number="Q7" title="What is the Automatic Corporate Switch?">
            <p>If your selection's total price (after discounts) reaches or exceeds our Corporate value, the system will automatically upgrade your order to the **All-In-One Corporate License**, granting unlimited use across all categories for your entire global organization.</p>
          </TermCard>

          {/* Q8: Account Maintenance */}
          <TermCard number="Q8" title="Will my account be cleared?">
            <p>Accounts containing paid commercial licenses are permanent. However, accounts that only contain "Free Trial" fonts are automatically cleared every 30 days to maintain database health.</p>
          </TermCard>

          {/* TABLES */}
          <BrutalTable 
            title="Commercial Seats (Desktop/Print)"
            headers={["Tier", "Users/Seats", "Ideal For"]}
            rows={[
              ["Solo", "1 User", "Freelancers"],
              ["Team", "Up to 30", "Small Studios"],
              ["Studio", "Up to 100", "Mid-sized Agency"],
              ["Unlimited", "Organization Wide", "Large Corporations"]
            ]}
          />
          <BrutalTable 
            title="Digital Media Reach (Monthly Views)"
            headers={["Tier", "Impressions", "Best For"]}
            rows={[
              ["Small", "Up to 50K", "Personal Blogs"],
              ["Medium", "Up to 500K", "Growing Creators"],
              ["Large", "Up to 2M", "Viral Brands"],
              ["Unlimited", "No Limit", "High-traffic Platforms"]
            ]}
          />
        </main>
        <div className="h-40 md:h-60 bg-transparent" />
      </div>
    </div>
  );
};

export default FAQ;