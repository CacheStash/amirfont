import React, { useState } from 'react';
import { Mail, Copy, Check, MessageSquare, ShieldCheck, FileText, Sparkles, ExternalLink, LifeBuoy } from 'lucide-react';

const Support: React.FC = () => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const supportEmail = 'subqistudio@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER */}
      <div className="border-b-2 border-black pb-6">
        <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">Support & Direct Desk</h2>
        <p className="text-xs font-black tracking-widest text-black/60 uppercase mt-2 flex items-center gap-2">
          <LifeBuoy size={14} className="text-[#FF5C00]" /> Studio Assistance, Licensing & Account Help
        </p>
      </div>

      {/* MAIN BRUTALIST SUPPORT HERO CARD */}
      <div className="border-2 border-black p-8 sm:p-12 text-center bg-white space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-[0.25em] uppercase bg-black text-[#FF5C00] px-3 py-1 inline-block border border-black">
            Independent Type Studio Desk
          </span>
          <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
            How Can We Help You?
          </h3>
          <p className="text-xs sm:text-sm text-black/80 font-medium max-w-xl mx-auto leading-relaxed">
            Need help with your font download files, license upgrades, custom corporate tiers, or your affiliate creator commission account? Contact our studio directly.
          </p>
        </div>

        {/* EMAIL ACTION BOX */}
        <div className="max-w-md mx-auto p-4 border-2 border-black bg-gray-50 space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between gap-2 border-2 border-black bg-white p-2">
            <div className="flex items-center gap-2 px-2 overflow-hidden">
              <Mail size={16} className="text-[#FF5C00] shrink-0" />
              <span className="font-mono text-xs sm:text-sm font-black text-black truncate">
                {supportEmail}
              </span>
            </div>
            <button
              onClick={handleCopyEmail}
              className="bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-all py-1.5 px-3.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 border border-black cursor-pointer"
            >
              {copiedEmail ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              {copiedEmail ? 'COPIED' : 'COPY'}
            </button>
          </div>

          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent('[Subqi Studio Support Request]')}`}
            className="w-full py-3 px-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-[#FF5C00] text-black border-2 border-black hover:bg-black hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
          >
            <MessageSquare size={14} /> Send Us an Email
          </a>
        </div>

        {/* HONEST, CASUAL INDEPENDENT FOUNDRY DISCLAIMER */}
        <div className="max-w-xl mx-auto p-4 border-2 border-black bg-yellow-100 text-left text-xs text-black leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider text-black">
            <Sparkles size={13} className="text-[#FF5C00]" /> Studio Note
          </div>
          <p className="font-medium text-[11px] sm:text-xs">
            Subqi is an independent type design studio. Every inquiry is personally reviewed and replied to by the actual designer behind the fonts—no automated bot responses. While response times might not be instantaneous (typically within 24 to 48 hours), you are guaranteed direct, honest communication and solutions. Thanks for supporting independent type!
          </p>
        </div>
      </div>

      {/* QUICK ASSISTANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border-2 border-black bg-white space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <ShieldCheck size={16} className="text-[#FF5C00]" />
            <span>Commercial Rights</span>
          </div>
          <p className="text-xs text-black/75 leading-relaxed font-medium">
            Need an enterprise tier, mobile application packaging, or custom broadcast licensing? Let us know your project scope for custom quotes.
          </p>
        </div>

        <div className="p-6 border-2 border-black bg-white space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <FileText size={16} className="text-[#FF5C00]" />
            <span>Orders & Downloads</span>
          </div>
          <p className="text-xs text-black/75 leading-relaxed font-medium">
            Need file re-delivery (OTF, TTF, WOFF2) or updated transaction receipts? Access them anytime in your <strong>My Library</strong> or email us.
          </p>
        </div>

        <div className="p-6 border-2 border-black bg-white space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <ExternalLink size={16} className="text-[#FF5C00]" />
            <span>Affiliate Hub</span>
          </div>
          <p className="text-xs text-black/75 leading-relaxed font-medium">
            Inquiries regarding payout schedules, attribution logs, or custom coupon codes can be answered directly via email assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Support;
