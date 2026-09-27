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

  const [gasPool, setGasPool] = useState<{
    accounts: Array<{ email: string; url: string; remaining: number; limit: number; status: string }>;
    totalRemaining: number;
    totalLimit: number;
  } | null>(null);
  const [checkingGas, setCheckingGas] = useState(false);

  const fetchGasPool = async () => {
    setCheckingGas(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/gas-status', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGasPool(data);
      }
    } catch (e) {
      console.error("Failed to fetch gas pool status:", e);
    } finally {
      setCheckingGas(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
    fetchGasPool();
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
      <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; padding: 18px 20px; margin-bottom: 14px;">
        <div style="font-size: 18px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 6px;">${item.name}</div>
        <div style="font-size: 12px; color: #262626; margin-bottom: 14px;">
          LICENSE TIER: <strong style="background-color: #ff5c00; color: #ffffff; border: 1.5px solid #000000; padding: 2px 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">${item.tier}</strong>
        </div>
        <a href="#" onclick="return false;" style="display: inline-block; background-color: #000000; color: #ffffff; font-weight: 900; font-size: 12px; text-decoration: none; padding: 12px 22px; border: 2px solid #000000; box-shadow: 3px 3px 0px #ff5c00; text-transform: uppercase; letter-spacing: 0.05em;">Download Font & License (.ZIP)</a>
      </div>
    `).join("");

    const canvasHtml = config.canvas_vip_enabled ? `
      <tr>
        <td style="padding: 0 32px 24px 32px;">
          <div style="background-color: #eff6ff; border: 2px solid #000000; box-shadow: 4px 4px 0px #2563eb; padding: 20px;">
            <div style="margin-bottom: 10px;">
              <span style="background-color: #2563eb; color: #ffffff; font-size: 10px; font-weight: 900; padding: 3px 8px; border: 1.5px solid #000000; text-transform: uppercase; letter-spacing: 0.08em; display: inline-block;">VIP BONUS</span>
              <span style="color: #000000; font-size: 16px; font-weight: 900; text-transform: uppercase; margin-left: 8px; display: inline-block; vertical-align: middle;">${config.canvas_heading}</span>
            </div>
            <p style="font-size: 13px; color: #1e293b; margin: 8px 0 14px 0; line-height: 1.5; font-weight: 500;">
              ${config.canvas_text}
            </p>

            <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 2px 2px 0px #000000; padding: 14px; margin-bottom: 14px; font-size: 13px; line-height: 1.8;">
              <div>🌐 <strong>APP URL:</strong> <a href="${config.canvas_url}" style="color: #2563eb; font-weight: 800; text-decoration: underline;">${config.canvas_url}</a></div>
              <div>👤 <strong>USERNAME:</strong> <span style="font-family: monospace; font-weight: 800; background-color: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1;">${dummyBuyerEmail}</span></div>
              <div>🔑 <strong>PASSWORD:</strong> <span style="font-family: monospace; font-weight: 800; background-color: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1;">${dummyOrderId}</span></div>
            </div>

            <div style="font-size: 12px; color: #1e293b; line-height: 1.6; font-weight: 500;">
              <strong style="text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900;">Your VIP Perks:</strong>
              <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                <li><strong>Purchased Fonts Unlocked:</strong> All fonts in this order are automatically activated in your Canvas suite.</li>
                <li><strong>Bonus Extras & Dingbats:</strong> Free access to exclusive ornaments and dingbats catalog-wide.</li>
                <li><strong>Full Pro Tools:</strong> High-res export, canvas saving, and SVG generation completely unlocked.</li>
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
<body style="margin: 0; padding: 32px 16px; background-color: #f5f4ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000000; line-height: 1.5;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; text-align: left;" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 32px 32px 20px 32px; border-bottom: 2px solid #000000; background-color: #ffffff;">
              <span style="display: inline-block; background-color: #000000; color: #ffffff; font-family: monospace; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; margin-bottom: 14px;">SUBQI STUDIO™</span>
              <h1 style="margin: 0; color: #000000; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; line-height: 1.2;">${heading}</h1>
              <p style="margin: 8px 0 0 0; color: #262626; font-size: 14px; font-weight: 500; line-height: 1.6;">${introText}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 10px 32px;">
              <div style="background-color: #fef08a; border: 2px solid #000000; box-shadow: 3px 3px 0px #000000; padding: 12px 16px; font-size: 13px;">
                <span style="color: #000000; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.05em;">ORDER REFERENCE:</span>
                <span style="background-color: #000000; color: #ffffff; font-family: monospace; font-weight: 900; font-size: 13px; padding: 3px 8px; margin-left: 8px; display: inline-block;">${dummyOrderId}</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 10px 32px 16px 32px;">
              <h2 style="color: #000000; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; margin: 12px 0;">YOUR FONT PACKAGES & COMMERCIAL LICENSES</h2>
              ${itemsHtml}
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #fff1f2; border: 2px solid #000000; box-shadow: 4px 4px 0px #e11d48; padding: 16px 18px;">
                <div style="margin-bottom: 6px;">
                  <strong style="color: #e11d48; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900;">⚠️ ${config.warning_title}</strong>
                </div>
                <p style="margin: 0; color: #4c0519; font-size: 12px; font-weight: 600; line-height: 1.6;">
                  ${warningText}
                </p>
                <div style="margin-top: 10px;">
                  <a href="${config.vault_url}" style="display: inline-block; background-color: #000000; color: #ffffff; border: 1.5px solid #000000; padding: 6px 12px; font-size: 11px; font-weight: 900; text-decoration: none; text-transform: uppercase;">Open User Vault (Unlimited Access) →</a>
                </div>
              </div>
            </td>
          </tr>

          ${canvasHtml}

          <tr>
            <td style="padding: 22px 32px; border-top: 2px solid #000000; background-color: #fafaf9; text-align: center; font-size: 11px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.6;">
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

      {/* GAS RELAY POOL & DAILY QUOTA STATUS */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_#000] p-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black tracking-wider uppercase">
              GAS RELAY POOL
            </span>
            <span className="text-xs font-black uppercase tracking-tight">
              3 Google Accounts • Auto Load-Balanced
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-bold text-gray-700">
              Total Pool Capacity:{' '}
              <strong className="text-black bg-yellow-300 px-1.5 py-0.5 border border-black font-black">
                {gasPool ? `${gasPool.totalRemaining} / ${gasPool.totalLimit}` : '300 / 300'} Left Today
              </strong>
            </div>
            <button
              onClick={fetchGasPool}
              disabled={checkingGas}
              title="Query remaining quotas (costs 0 email credits)"
              className="px-2.5 py-1 text-[10px] font-black uppercase border border-black bg-gray-100 hover:bg-black hover:text-white flex items-center gap-1 shadow-[2px_2px_0px_#000] active:shadow-none transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${checkingGas ? 'animate-spin' : ''}`} />
              <span>{checkingGas ? 'CHECKING...' : 'REFRESH QUOTAS'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(gasPool?.accounts || [
            { email: "subqistudio@gmail.com", remaining: 100, limit: 100, status: "READY" },
            { email: "amirsubqisetiaji@gmail.com", remaining: 100, limit: 100, status: "READY" },
            { email: "ameervg@gmail.com", remaining: 100, limit: 100, status: "READY" }
          ]).map((acc) => (
            <div key={acc.email} className="border border-black p-3 bg-gray-50 flex flex-col justify-between gap-2 shadow-[2px_2px_0px_#000]">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] font-black lowercase text-black truncate" title={acc.email}>
                  {acc.email}
                </span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 border border-black uppercase ${
                  acc.status === 'ONLINE' ? 'bg-[#00F59B] text-black' : acc.status === 'NEEDS_AUTH' ? 'bg-[#FFE600] text-black' : 'bg-gray-200 text-gray-700'
                }`}>
                  {acc.status === 'NEEDS_AUTH' ? 'AUTHORIZE IN GAS' : acc.status}
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                  <span className="text-gray-500 uppercase">DAILY QUOTA:</span>
                  <span className="font-black text-black">{acc.remaining} / {acc.limit}</span>
                </div>
                <div className="w-full bg-gray-200 border border-black h-2 overflow-hidden">
                  <div 
                    className="bg-black h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, (acc.remaining / acc.limit) * 100))}%` }}
                  />
                </div>
                <span className="text-[8px] text-gray-500 font-bold block mt-1">
                  Resets every 24h (midnight Google PT)
                </span>
              </div>
            </div>
          ))}
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
