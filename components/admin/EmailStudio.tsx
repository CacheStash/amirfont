import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Save, 
  Send, 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EmailTemplateConfig {
  subject: string;
  heading: string;
  intro_text: string;
  warning_title: string;
  warning_text: string;
  vault_url: string;
  canvas_vip_enabled: boolean;
  canvas_url: string;
  canvas_heading: string;
  canvas_text: string;
  footer_text: string;
}

const DEFAULT_CONFIG: EmailTemplateConfig = {
  subject: "Your Font Order #[ORDER_ID] is Ready! - Subqi Studio",
  heading: "Thank you for your purchase, [BUYER_NAME]!",
  intro_text: "Here are your font download packages and commercial licenses. Keep your order ID safe as your proof of license.",
  warning_title: "Important Security Notice (7 Days / 7 Downloads)",
  warning_text: "These quick-access download links are valid for 7 days or up to 7 downloads (whichever comes first) to protect against unauthorized link distribution. For permanent, lifetime unlimited access, you can log in to your User Vault anytime.",
  vault_url: "https://subqi.com/user/auth",
  canvas_vip_enabled: true,
  canvas_url: "https://canvas.subqi.com",
  canvas_heading: "Font Canvas VIP Access Unlocked!",
  canvas_text: "As our commercial customer, you get free VIP access to our web-based typography creator app:",
  footer_text: "Questions or assistance? Reply directly to this email.<br>© Subqi Studio. All rights reserved."
};

export default function EmailStudio() {
  const [config, setConfig] = useState<EmailTemplateConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; sender?: string; error?: string } | null>(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/email-template', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.template) {
          setConfig({ ...DEFAULT_CONFIG, ...data.template });
        }
      }
    } catch (err) {
      console.error("Failed to load email template:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const res = await fetch('/api/admin/email-template', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ template: config })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save template");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("ERROR: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      alert("Please provide a valid email address");
      return;
    }

    setSendingTest(true);
    setTestStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetEmail: testEmail.trim(),
          templateConfig: config
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch test email");
      }

      setTestStatus({ success: true, sender: data.sender });
    } catch (err: any) {
      setTestStatus({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  // Live HTML Generation for Preview
  const previewHtml = useMemo(() => {
    const dummyOrderId = "SUBQI-9824X";
    const dummyBuyerName = "Alex Designer";
    const dummyBuyerEmail = testEmail || "alex.designer@example.com";

    const heading = (config.heading || DEFAULT_CONFIG.heading)
      .replace(/\[BUYER_NAME\]/g, dummyBuyerName)
      .replace(/\[ORDER_ID\]/g, dummyOrderId);

    const introText = (config.intro_text || DEFAULT_CONFIG.intro_text)
      .replace(/\[BUYER_NAME\]/g, dummyBuyerName)
      .replace(/\[ORDER_ID\]/g, dummyOrderId);

    const warningText = (config.warning_text || DEFAULT_CONFIG.warning_text)
      .replace(/\[BUYER_NAME\]/g, dummyBuyerName)
      .replace(/\[ORDER_ID\]/g, dummyOrderId);

    const sampleItems = [
      { name: "Royal Grande (13 Styles)", tier: "SOLO (1 USER ONLY)" },
      { name: "Thanjavur Variable Serif", tier: "STUDIO (UP TO 50 USERS)" }
    ];

    const itemsHtml = sampleItems.map(item => `
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 16px 20px; margin-bottom: 12px;">
        <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 4px; letter-spacing: -0.01em;">${item.name}</div>
        <div style="font-size: 12px; color: #a1a1aa; margin-bottom: 14px;">License Tier: <strong style="color: #22c55e;">${item.tier}</strong></div>
        <a href="#" onclick="return false;" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; font-size: 12px; text-decoration: none; padding: 10px 18px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Download Font & License (.ZIP)</a>
      </div>
    `).join("");

    const canvasHtml = config.canvas_vip_enabled ? `
      <tr>
        <td style="padding: 0 32px 28px 32px;">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #172554 100%); border: 1px solid #3b82f6; border-radius: 12px; padding: 22px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="background-color: #2563eb; color: #ffffff; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.08em;">VIP BONUS</span>
              <span style="color: #ffffff; font-size: 16px; font-weight: 800; margin-left: 10px;">${config.canvas_heading}</span>
            </div>
            <p style="font-size: 13px; color: #cbd5e1; margin: 8px 0 14px 0; line-height: 1.5;">
              ${config.canvas_text}
            </p>

            <div style="background-color: rgba(0,0,0,0.4); border: 1px dashed #60a5fa; border-radius: 8px; padding: 14px; margin-bottom: 14px; font-size: 13px;">
              <div style="margin-bottom: 6px;">🌐 <strong>App URL:</strong> <a href="${config.canvas_url}" style="color: #93c5fd; text-decoration: none; font-weight: 700;">${config.canvas_url}</a></div>
              <div style="margin-bottom: 6px;">👤 <strong>Username:</strong> <span style="color: #f8fafc; font-family: monospace;">${dummyBuyerEmail}</span></div>
              <div>🔑 <strong>Password:</strong> <span style="color: #f8fafc; font-family: monospace; font-weight: 700;">${dummyOrderId}</span></div>
            </div>

            <div style="font-size: 12px; color: #e2e8f0; line-height: 1.6;">
              <strong>Your VIP Perks:</strong>
              <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                <li><strong>Purchased Fonts Unlocked:</strong> All fonts in this order are automatically activated in your Canvas suite.</li>
                <li><strong>Catalog-Wide Bonus Extras & Dingbats:</strong> Free access to all exclusive ornaments and dingbats across our entire collection.</li>
                <li><strong>Full Pro Tools Access:</strong> All locked creator features (Export, High-Res Canvas, etc.) are completely unlocked.</li>
              </ul>
            </div>
          </div>
        </td>
      </tr>
    ` : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${config.subject.replace(/\[ORDER_ID\]/g, dummyOrderId)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; line-height: 1.5;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #121215; border: 1px solid #27272a; border-radius: 14px; overflow: hidden; text-align: left;" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #27272a;">
              <span style="display: inline-block; background-color: #ffffff; color: #000000; font-family: monospace; font-size: 11px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px;">SUBQI STUDIO™</span>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">${heading}</h1>
              <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">${introText}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 10px 32px;">
              <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 12px 16px; font-size: 13px;">
                <span style="color: #71717a; text-transform: uppercase; font-size: 11px; font-weight: 700; letter-spacing: 0.05em;">Order Reference:</span>
                <span style="color: #ffffff; font-family: monospace; font-weight: 800; font-size: 14px; margin-left: 8px;">${dummyOrderId}</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 10px 32px 16px 32px;">
              <h2 style="color: #ffffff; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin: 12px 0;">YOUR FONT PACKAGES & COMMERCIAL LICENSES</h2>
              ${itemsHtml}
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #1c1917; border: 1px solid #ea580c; border-left: 4px solid #f97316; border-radius: 8px; padding: 14px 18px;">
                <div style="margin-bottom: 6px;">
                  <strong style="color: #fdba74; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">⚠️ ${config.warning_title}</strong>
                </div>
                <p style="margin: 0; color: #fed7aa; font-size: 12px; line-height: 1.6;">
                  ${warningText}
                </p>
                <div style="margin-top: 10px;">
                  <a href="${config.vault_url}" style="display: inline-block; color: #fb923c; font-size: 12px; font-weight: 700; text-decoration: underline;">Open User Vault (Unlimited Access) →</a>
                </div>
              </div>
            </td>
          </tr>

          ${canvasHtml}

          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center; font-size: 12px; color: #71717a; line-height: 1.6;">
              ${config.footer_text}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }, [config, testEmail]);

  return (
    <div className="space-y-6 font-mono selection:bg-black selection:text-white">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#FFE600] border border-black px-2 py-0.5 text-[10px] font-black uppercase">
              MULTI-ACCOUNT RELAY
            </span>
            <span className="text-[10px] text-gray-500 font-bold">
              Synced across 3 Google Apps Script accounts
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Email Studio</h2>
          <p className="text-xs text-gray-500 font-bold mt-1">
            Customize automated order emails, security warnings, and preview live before sending
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`
              px-6 py-2.5 text-xs font-black uppercase border-2 border-black flex items-center gap-2 shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all
              ${saveSuccess ? 'bg-[#00F59B] text-black' : 'bg-black text-white hover:bg-gray-800'}
            `}
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'SAVING...' : saveSuccess ? 'SAVED TO DB!' : 'SAVE TEMPLATE'}</span>
          </button>
        </div>
      </div>

      {/* MAIN SPLIT-SCREEN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CONTROLS & FORM */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Card: Basic Settings */}
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
            <h3 className="text-xs font-black uppercase bg-black text-white px-2 py-1 mb-4 inline-block">
              1. Email Header & Intro
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={config.subject}
                  onChange={(e) => setConfig(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                  placeholder="e.g. Your Font Order #[ORDER_ID] is Ready!"
                />
                <span className="text-[10px] text-gray-400 font-bold">Use [ORDER_ID] and [BUYER_NAME] as placeholders</span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                  Greeting / Heading:
                </label>
                <input
                  type="text"
                  value={config.heading}
                  onChange={(e) => setConfig(prev => ({ ...prev, heading: e.target.value }))}
                  className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                  placeholder="e.g. Thank you for your purchase, [BUYER_NAME]!"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                  Intro Message:
                </label>
                <textarea
                  rows={2}
                  value={config.intro_text}
                  onChange={(e) => setConfig(prev => ({ ...prev, intro_text: e.target.value }))}
                  className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                />
              </div>
            </div>
          </div>

          {/* Card: Security Notice (7 Days / 7 Downloads) */}
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-black uppercase bg-[#FF5C00] text-black px-2 py-1 inline-block border border-black">
                2. Security Notice (7D / 7x Limit)
              </span>
              <ShieldAlert className="w-4 h-4 text-[#FF5C00]" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                  Notice Title:
                </label>
                <input
                  type="text"
                  value={config.warning_title}
                  onChange={(e) => setConfig(prev => ({ ...prev, warning_title: e.target.value }))}
                  className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                  Notice Description:
                </label>
                <textarea
                  rows={3}
                  value={config.warning_text}
                  onChange={(e) => setConfig(prev => ({ ...prev, warning_text: e.target.value }))}
                  className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                  User Vault URL:
                </label>
                <input
                  type="text"
                  value={config.vault_url}
                  onChange={(e) => setConfig(prev => ({ ...prev, vault_url: e.target.value }))}
                  className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                />
              </div>
            </div>
          </div>

          {/* Card: VIP Font Canvas Bonus */}
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase bg-blue-600 text-white px-2 py-1 inline-block">
                3. Font Canvas VIP Bonus
              </span>
              
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                <input
                  type="checkbox"
                  checked={config.canvas_vip_enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, canvas_vip_enabled: e.target.checked }))}
                  className="w-4 h-4 accent-black"
                />
                <span>Include Card</span>
              </label>
            </div>

            {config.canvas_vip_enabled && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                    Bonus Title:
                  </label>
                  <input
                    type="text"
                    value={config.canvas_heading}
                    onChange={(e) => setConfig(prev => ({ ...prev, canvas_heading: e.target.value }))}
                    className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                    Bonus Intro:
                  </label>
                  <textarea
                    rows={2}
                    value={config.canvas_text}
                    onChange={(e) => setConfig(prev => ({ ...prev, canvas_text: e.target.value }))}
                    className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card: Test Email Dispatch */}
          <div className="bg-[#FFE600] border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
            <h3 className="text-xs font-black uppercase text-black mb-1 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              <span>Send Live Test to Your Inbox</span>
            </h3>
            <p className="text-[11px] font-bold text-black/80 mb-3">
              Dispatches sample email via one of the 3 active GAS accounts to check deliverability
            </p>

            <form onSubmit={handleSendTest} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="flex-1 bg-white border-2 border-black p-2 text-xs font-mono text-black focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="bg-black text-white hover:bg-zinc-800 border-2 border-black px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 disabled:opacity-50"
                >
                  {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{sendingTest ? 'SENDING...' : 'DISPATCH'}</span>
                </button>
              </div>

              {testStatus && (
                <div className={`p-2.5 border border-black text-xs font-bold mt-2 ${testStatus.success ? 'bg-white text-green-900' : 'bg-red-100 text-red-900'}`}>
                  {testStatus.success ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Successfully sent via: <strong>{testStatus.sender}</strong></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Failed: {testStatus.error}</span>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW */}
        <div className="lg:col-span-7 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
          
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-black"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black"></span>
              <span className="text-xs font-black uppercase ml-2 text-gray-700">
                LIVE BUYER PREVIEW
              </span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 border border-black p-0.5">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase flex items-center gap-1 transition-all ${previewDevice === 'desktop' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>DESKTOP</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase flex items-center gap-1 transition-all ${previewDevice === 'mobile' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>MOBILE</span>
              </button>
            </div>
          </div>

          {/* Iframe Frame Container */}
          <div className="flex justify-center bg-zinc-900 p-2 sm:p-4 border border-black overflow-hidden">
            <div 
              className={`transition-all duration-300 bg-[#09090b] ${previewDevice === 'mobile' ? 'w-[375px] border-4 border-zinc-700 rounded-3xl overflow-hidden shadow-2xl' : 'w-full'}`}
              style={{ minHeight: '620px' }}
            >
              <iframe
                title="Email Live Preview"
                srcDoc={previewHtml}
                className="w-full h-[620px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-bold text-center mt-3">
            Real-time HTML render • Updates automatically as you edit controls on the left
          </div>

        </div>

      </div>

    </div>
  );
}
