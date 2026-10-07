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
  Layers,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FileText,
  Check
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

function formatGasSender(sender: string | undefined): string {
  if (!sender) return 'System Default';
  if (sender.includes('AKfycbzO') || sender.includes('subqistudio')) return 'subqistudio@gmail.com';
  if (sender.includes('AKfycbzg') || sender.includes('amirsubqi')) return 'amirsubqisetiaji@gmail.com';
  if (sender.includes('AKfycbw9') || sender.includes('ameervg')) return 'ameervg@gmail.com';
  return sender;
}

const MASTER_TIER_LABELS: Record<string, Record<string, string>> = {
  desktop: { solo: '1 USER ONLY', team: 'UP TO 30 USER', studio: 'UP TO 100 USER', enterprise: 'UNLIMITED USER' },
  social_web: { small_50k: '50K VIEWS', medium_500k: '500K VIEWS', large_5m: '2M VIEWS', enterprise_unlimited: 'UNLIMITED VIEWS' },
  logo_branding: { personal: 'PERSONAL BRANDING', solo: '1-10 EMPLOYEES', team: '11-50 EMPLOYEES', studio: '51-250 EMPLOYEES', enterprise: '251+ EMPLOYEES' },
  app: { solo: '1 TITLE', team: 'UP TO 10 TITLES', studio: 'UP TO 50 TITLES', enterprise: 'UNLIMITED TITLES' },
  server: { solo: 'SINGLE', studio: 'UP TO 50 SERVERS', enterprise: 'UNLIMITED' },
  broadcast: { solo: 'REGIONAL', studio: 'NATIONAL', enterprise: 'WORLDWIDE' }
};

export default function EmailStudio() {
  const [activeTab, setActiveTab] = useState<'order' | 'sent'>('order');
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

  // Sent Emails (Outbox) State
  const [sentOrders, setSentOrders] = useState<any[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [sentPage, setSentPage] = useState(1);
  const [sentSearchTerm, setSentSearchTerm] = useState('');
  const [sentSenderFilter, setSentSenderFilter] = useState('ALL');
  const [selectedSentOrder, setSelectedSentOrder] = useState<any | null>(null);
  const [resendingOrderId, setResendingOrderId] = useState<string | null>(null);
  const [modalPreviewDevice, setModalPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const sentItemsPerPage = 10;

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
    fetchSentOrders();
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
        if (data) {
          setConfig({ ...DEFAULT_CONFIG, ...data });
        }
      }
    } catch (e) {
      console.error("Failed to fetch template:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentOrders = async () => {
    setLoadingSent(true);
    try {
      const { data, error } = await supabase
        .from('admin_order_view')
        .select('*')
        .order('download_date', { ascending: false });

      if (error) {
        console.error("Failed to load sent orders from admin_order_view:", error);
      } else if (data) {
        const formatted = data.map((item: any) => ({
          ...item,
          fontbuyer: { 
            email: item.buyer_email,
            full_name: item.metadata?.buyer_name || ''
          },
          fonts: { name: item.font_name }
        }));
        setSentOrders(formatted);
      }
    } catch (err) {
      console.error("SYSTEM_FETCH_ERROR:", err);
    } finally {
      setLoadingSent(false);
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
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save template");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Error saving template: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      alert("Please provide a valid test recipient email address.");
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
      fetchGasPool();
    } catch (err: any) {
      setTestStatus({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const handleResendSentEmail = async (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetEmail = order.fontbuyer?.email || order.buyer_email;
    if (!targetEmail) return alert("No valid buyer email found for this record.");

    if (!window.confirm(`Resend order license delivery email to ${targetEmail} for Order #${order.transaction_id}?`)) {
      return;
    }

    setResendingOrderId(order.transaction_id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return alert("Session expired. Please login again.");

      const res = await fetch('/api/admin/resend-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ orderId: order.transaction_id })
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);

      // Optimistically update order metadata in local state
      setSentOrders(prev => prev.map(o => {
        if (o.transaction_id === order.transaction_id) {
          return {
            ...o,
            metadata: {
              ...o.metadata,
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              email_sent_by: json.sender
            }
          };
        }
        return o;
      }));

      if (selectedSentOrder && selectedSentOrder.transaction_id === order.transaction_id) {
        setSelectedSentOrder({
          ...selectedSentOrder,
          metadata: {
            ...selectedSentOrder.metadata,
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            email_sent_by: json.sender
          }
        });
      }

      alert(`Delivery email dispatched successfully via ${formatGasSender(json.sender)}!`);
      fetchGasPool();
    } catch (err: any) {
      console.error("RESEND_EMAIL_ERROR:", err);
      alert("Failed to send email: " + err.message);
    } finally {
      setResendingOrderId(null);
    }
  };

  // Live HTML Generation for Template Preview
  const previewHtml = useMemo(() => {
    const dummyBuyerName = "Alexander Wright";
    const dummyOrderId = "ORD-849201";
    const heading = (config.heading || DEFAULT_CONFIG.heading)
      .replace(/\[BUYER_NAME\]/g, dummyBuyerName)
      .replace(/\[ORDER_ID\]/g, dummyOrderId);
    const introText = (config.intro_text || DEFAULT_CONFIG.intro_text)
      .replace(/\[BUYER_NAME\]/g, dummyBuyerName)
      .replace(/\[ORDER_ID\]/g, dummyOrderId);
    const warningText = (config.warning_text || DEFAULT_CONFIG.warning_text)
      .replace(/\[BUYER_NAME\]/g, dummyBuyerName)
      .replace(/\[ORDER_ID\]/g, dummyOrderId);

    const dummyItems = [
      { name: "Wiltasso Display Serif", tier: "Desktop License (Solo)" },
      { name: "Deglise Grotesk Variable", tier: "Studio Commercial All-In-One" }
    ];

    const itemsHtml = dummyItems.map(item => `
      <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; padding: 18px 20px; margin-bottom: 14px;">
        <div style="font-size: 18px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 6px;">${item.name}</div>
        <div style="font-size: 12px; color: #262626; margin-bottom: 14px;">
          LICENSE TIER: <strong style="background-color: #ff5c00; color: #ffffff; border: 1.5px solid #000000; padding: 2px 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">${item.tier}</strong>
        </div>
        <a href="#" style="display: inline-block; background-color: #000000; color: #ffffff; font-weight: 900; font-size: 12px; text-decoration: none; padding: 12px 22px; border: 2px solid #000000; box-shadow: 3px 3px 0px #ff5c00; text-transform: uppercase; letter-spacing: 0.05em;">Download Font & License (.ZIP)</a>
      </div>
    `).join('');

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
            <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 2px 2px 0px #000000; padding: 14px 16px; margin-bottom: 14px; font-size: 13px; line-height: 2;">
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-family: monospace; font-size: 9px; font-weight: 900; padding: 1px 6px; margin-right: 8px; vertical-align: middle; border: 1.5px solid #000000;">URL</span>
                <strong>APP URL:</strong> <a href="${config.canvas_url}" style="color: #2563eb; font-weight: 800; text-decoration: underline;">${config.canvas_url}</a>
              </div>
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; background-color: #000000; color: #ffffff; font-family: monospace; font-size: 9px; font-weight: 900; padding: 1px 6px; margin-right: 8px; vertical-align: middle; border: 1.5px solid #000000;">USER</span>
                <strong>USERNAME:</strong> <span style="font-family: monospace; font-weight: 800; background-color: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1;">${testEmail || "alexander@wright.design"}</span>
              </div>
              <div>
                <span style="display: inline-block; background-color: #000000; color: #ffffff; font-family: monospace; font-size: 9px; font-weight: 900; padding: 1px 6px; margin-right: 8px; vertical-align: middle; border: 1.5px solid #000000;">PASS</span>
                <strong>PASSWORD:</strong> <span style="font-family: monospace; font-weight: 800; background-color: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1;">${dummyOrderId}</span>
              </div>
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
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000000; line-height: 1.5;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 3px solid #000000; box-shadow: 8px 8px 0px #000000; text-align: left;" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 3px solid #000000; background-color: #ffffff; text-align: center;">
              <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #000000; margin-bottom: 4px;">SUBQI STUDIO</div>
              <div style="font-size: 11px; font-weight: 900; letter-spacing: 0.15em; color: #ff5c00; text-transform: uppercase; margin-bottom: 16px;">CONTEMPORARY TYPE DESIGN</div>
              <div style="font-family: monospace; color: #000000; font-size: 12px; font-weight: 900; letter-spacing: 0.05em; margin-bottom: 8px;">ORDER #${dummyOrderId}</div>
              <h1 style="margin: 0; color: #000000; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">${heading}</h1>
              <p style="margin: 12px auto 0 auto; color: #525252; font-size: 14px; line-height: 1.6; max-width: 480px; font-weight: 500;">${introText}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 12px 32px;">
              <div style="font-size: 12px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">PURCHASED FONT ASSETS</div>
              ${itemsHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <div style="background-color: #fff7ed; border: 2px solid #000000; box-shadow: 4px 4px 0px #ea580c; padding: 18px 20px;">
                <div style="margin-bottom: 6px;">
                  <strong style="color: #c2410c; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900;">⚠️ ${config.warning_title || DEFAULT_CONFIG.warning_title}</strong>
                </div>
                <p style="margin: 0; color: #431407; font-size: 13px; line-height: 1.6; font-weight: 500;">${warningText}</p>
                <div style="margin-top: 14px;">
                  <a href="${config.vault_url || DEFAULT_CONFIG.vault_url}" style="display: inline-block; background-color: #ffffff; color: #000000; border: 2px solid #000000; padding: 8px 16px; font-weight: 900; font-size: 11px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 2px 2px 0px #000000;">Open User Vault (Permanent Access) →</a>
                </div>
              </div>
            </td>
          </tr>
          ${canvasHtml}
          <tr>
            <td style="padding: 20px 32px; border-top: 3px solid #000000; background-color: #fafafa; text-align: center; font-size: 11px; color: #737373; line-height: 1.6; font-weight: 600;">
              ${config.footer_text || DEFAULT_CONFIG.footer_text}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }, [config, testEmail]);

  // Generate Personalized Sent Email HTML for Selected Order
  const generateSentEmailHtml = (order: any) => {
    if (!order) return '';
    const buyerEmail = order.fontbuyer?.email || order.buyer_email || 'client@example.com';
    const buyerName = order.fontbuyer?.full_name || order.metadata?.buyer_name || buyerEmail.split('@')[0];
    const orderId = order.transaction_id || 'ORD-000000';
    const fontName = order.fonts?.name || order.font_name || 'Typeface Asset';
    const tier = order.tier ? (MASTER_TIER_LABELS[order.tier.toLowerCase()]?.solo || order.tier.toUpperCase()) : 'COMMERCIAL LICENSE';
    const downloadUrl = `${window.location.origin}/api/download-zip?file=${encodeURIComponent(fontName)}&order=${encodeURIComponent(orderId)}&email=${encodeURIComponent(buyerEmail)}`;

    const heading = (config.heading || DEFAULT_CONFIG.heading)
      .replace(/\[BUYER_NAME\]/g, buyerName)
      .replace(/\[ORDER_ID\]/g, orderId);

    const introText = (config.intro_text || DEFAULT_CONFIG.intro_text)
      .replace(/\[BUYER_NAME\]/g, buyerName)
      .replace(/\[ORDER_ID\]/g, orderId);

    const warningText = (config.warning_text || DEFAULT_CONFIG.warning_text)
      .replace(/\[BUYER_NAME\]/g, buyerName)
      .replace(/\[ORDER_ID\]/g, orderId);

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
            <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 2px 2px 0px #000000; padding: 14px 16px; margin-bottom: 14px; font-size: 13px; line-height: 2;">
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-family: monospace; font-size: 9px; font-weight: 900; padding: 1px 6px; margin-right: 8px; vertical-align: middle; border: 1.5px solid #000000;">URL</span>
                <strong>APP URL:</strong> <a href="${config.canvas_url}" style="color: #2563eb; font-weight: 800; text-decoration: underline;">${config.canvas_url}</a>
              </div>
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; background-color: #000000; color: #ffffff; font-family: monospace; font-size: 9px; font-weight: 900; padding: 1px 6px; margin-right: 8px; vertical-align: middle; border: 1.5px solid #000000;">USER</span>
                <strong>USERNAME:</strong> <span style="font-family: monospace; font-weight: 800; background-color: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1;">${buyerEmail}</span>
              </div>
              <div>
                <span style="display: inline-block; background-color: #000000; color: #ffffff; font-family: monospace; font-size: 9px; font-weight: 900; padding: 1px 6px; margin-right: 8px; vertical-align: middle; border: 1.5px solid #000000;">PASS</span>
                <strong>PASSWORD:</strong> <span style="font-family: monospace; font-weight: 800; background-color: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1;">${orderId}</span>
              </div>
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
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000000; line-height: 1.5;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 3px solid #000000; box-shadow: 8px 8px 0px #000000; text-align: left;" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 3px solid #000000; background-color: #ffffff; text-align: center;">
              <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #000000; margin-bottom: 4px;">SUBQI STUDIO</div>
              <div style="font-size: 11px; font-weight: 900; letter-spacing: 0.15em; color: #ff5c00; text-transform: uppercase; margin-bottom: 16px;">CONTEMPORARY TYPE DESIGN</div>
              <div style="font-family: monospace; color: #000000; font-size: 12px; font-weight: 900; letter-spacing: 0.05em; margin-bottom: 8px;">ORDER #${orderId}</div>
              <h1 style="margin: 0; color: #000000; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">${heading}</h1>
              <p style="margin: 12px auto 0 auto; color: #525252; font-size: 14px; line-height: 1.6; max-width: 480px; font-weight: 500;">${introText}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 12px 32px;">
              <div style="font-size: 12px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">PURCHASED FONT ASSETS</div>
              <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; padding: 18px 20px; margin-bottom: 14px;">
                <div style="font-size: 18px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 6px;">${fontName}</div>
                <div style="font-size: 12px; color: #262626; margin-bottom: 14px;">
                  LICENSE TIER: <strong style="background-color: #ff5c00; color: #ffffff; border: 1.5px solid #000000; padding: 2px 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">${tier}</strong>
                </div>
                <a href="${downloadUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; font-weight: 900; font-size: 12px; text-decoration: none; padding: 12px 22px; border: 2px solid #000000; box-shadow: 3px 3px 0px #ff5c00; text-transform: uppercase; letter-spacing: 0.05em;">Download Font & License (.ZIP)</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <div style="background-color: #fff7ed; border: 2px solid #000000; box-shadow: 4px 4px 0px #ea580c; padding: 18px 20px;">
                <div style="margin-bottom: 6px;">
                  <strong style="color: #c2410c; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900;">⚠️ ${config.warning_title || DEFAULT_CONFIG.warning_title}</strong>
                </div>
                <p style="margin: 0; color: #431407; font-size: 13px; line-height: 1.6; font-weight: 500;">${warningText}</p>
                <div style="margin-top: 14px;">
                  <a href="${config.vault_url || DEFAULT_CONFIG.vault_url}" style="display: inline-block; background-color: #ffffff; color: #000000; border: 2px solid #000000; padding: 8px 16px; font-weight: 900; font-size: 11px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 2px 2px 0px #000000;">Open User Vault (Permanent Access) →</a>
                </div>
              </div>
            </td>
          </tr>
          ${canvasHtml}
          <tr>
            <td style="padding: 20px 32px; border-top: 3px solid #000000; background-color: #fafafa; text-align: center; font-size: 11px; color: #737373; line-height: 1.6; font-weight: 600;">
              ${config.footer_text || DEFAULT_CONFIG.footer_text}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  // Filter & Pagination for Sent Orders
  const filteredSentOrders = useMemo(() => {
    return sentOrders.filter((order) => {
      const isSent = Boolean(order.metadata?.email_sent || order.metadata?.email_sent_by || order.metadata?.email_sent_at);
      if (!isSent) return false;

      if (sentSenderFilter !== 'ALL') {
        const cleanSender = formatGasSender(order.metadata?.email_sent_by);
        if (cleanSender !== sentSenderFilter) return false;
      }

      if (!sentSearchTerm.trim()) return true;
      const q = sentSearchTerm.toLowerCase();
      const orderId = (order.transaction_id || '').toLowerCase();
      const buyerEmail = (order.buyer_email || order.fontbuyer?.email || '').toLowerCase();
      const buyerName = (order.fontbuyer?.full_name || order.metadata?.buyer_name || '').toLowerCase();
      const fontName = (order.font_name || '').toLowerCase();
      const sender = formatGasSender(order.metadata?.email_sent_by).toLowerCase();
      return orderId.includes(q) || buyerEmail.includes(q) || buyerName.includes(q) || fontName.includes(q) || sender.includes(q);
    });
  }, [sentOrders, sentSenderFilter, sentSearchTerm]);

  const totalSentPages = Math.ceil(filteredSentOrders.length / sentItemsPerPage) || 1;
  const paginatedSentOrders = useMemo(() => {
    const from = (sentPage - 1) * sentItemsPerPage;
    return filteredSentOrders.slice(from, from + sentItemsPerPage);
  }, [filteredSentOrders, sentPage, sentItemsPerPage]);

  const allSendersList = useMemo(() => {
    const s = new Set<string>();
    sentOrders.forEach(o => {
      if (o.metadata?.email_sent_by) {
        s.add(formatGasSender(o.metadata.email_sent_by));
      }
    });
    return Array.from(s);
  }, [sentOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-black font-mono text-xs font-bold">
          <RefreshCw className="w-5 h-5 animate-spin text-[#ff5c00]" />
          LOADING SUBQI EMAIL STUDIO CONFIG...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-black pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white shadow-[2px_2px_0px_#ff5c00]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                Email Studio
                <span className="text-[10px] font-mono font-black px-2 py-0.5 border border-black bg-yellow-300 text-black">
                  GAS RELAY ACTIVE
                </span>
              </h1>
              <p className="text-xs text-gray-600 font-bold mt-0.5">
                Customize transactional buyer receipts and inspect dispatched order email outbox.
              </p>
            </div>
          </div>
        </div>

        {activeTab !== 'sent' && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`bg-black text-white hover:bg-zinc-800 border-2 border-black px-6 py-2.5 text-xs font-black uppercase flex items-center gap-2 shadow-[4px_4px_0px_#000] active:shadow-none transition-all cursor-pointer ${
                saveSuccess ? 'bg-green-600 border-green-600 text-white' : ''
              }`}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'SAVING...' : saveSuccess ? 'SAVED TO DB!' : 'SAVE TEMPLATE'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation: Order Fulfillment Receipt | Sent Emails */}
      <div className="flex items-center border-b-2 border-black gap-2">
        <button
          onClick={() => setActiveTab('order')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'order'
              ? 'border-black text-black bg-black/5 shadow-[2px_2px_0px_#ff5c00]'
              : 'border-transparent text-gray-500 hover:text-black hover:border-black/30'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Order Fulfillment Receipt</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('sent');
            fetchSentOrders();
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'sent'
              ? 'border-black text-black bg-black/5 shadow-[2px_2px_0px_#ff5c00]'
              : 'border-transparent text-gray-500 hover:text-black hover:border-black/30'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Sent Emails (Outbox)</span>
          <span className="text-[10px] font-mono font-black px-1.5 py-0.2 bg-[#ff5c00] text-black border border-black">
            {filteredSentOrders.length}
          </span>
        </button>
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
              title="Query remaining quotas"
              className="px-2.5 py-1 text-[10px] font-black uppercase border border-black bg-gray-100 hover:bg-black hover:text-white flex items-center gap-1 shadow-[2px_2px_0px_#000] active:shadow-none transition-all disabled:opacity-40 cursor-pointer"
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: TEMPLATE WORKSPACE (STACKING ATAS-BAWAH SEPERTI BROADCAST STUDIO) */}
      {/* ========================================================================= */}
      {activeTab === 'order' && (
        <div className="space-y-6">
          
          {/* 1. LIVE BUYER PREVIEW (TOP - PROMINENT STACKED PREVIEW CONTAINER) */}
          <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_#000] space-y-4">
            
            {/* Preview Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-black"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black"></span>
                <span className="text-xs font-black uppercase ml-2 text-black flex items-center gap-1.5">
                  <Eye size={14} className="text-[#ff5c00]" />
                  LIVE BUYER PREVIEW (ORDER RECEIPT)
                </span>
              </div>

              <div className="flex items-center gap-1 bg-zinc-100 border-2 border-black p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>DESKTOP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>MOBILE</span>
                </button>
              </div>
            </div>

            {/* Centered Realistic Preview Container */}
            <div className="flex justify-center bg-zinc-900 p-3 sm:p-6 border-2 border-black overflow-hidden min-h-[640px]">
              <div 
                className={`transition-all duration-300 bg-[#09090b] ${
                  previewDevice === 'mobile' ? 'w-[375px] border-4 border-zinc-700 rounded-3xl overflow-hidden shadow-2xl' : 'w-full max-w-[620px]'
                }`}
              >
                <iframe
                  title="Email Live Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[680px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            <div className="text-[10px] text-gray-500 font-bold text-center">
              Real-time HTML render • Updates automatically as you edit the settings below
            </div>
          </div>

          {/* 2. CONTROLS & FORM (STACKED UNDERNEATH PREVIEW) */}
          <div className="space-y-5">
            
            {/* Card 1: Email Header & Intro */}
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_#000]">
              <h3 className="text-xs font-black uppercase bg-black text-white px-2 py-1 mb-4 inline-block">
                1. Email Header & Intro
              </h3>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                      Subject Line:
                    </label>
                    <input
                      type="text"
                      value={config.subject}
                      onChange={(e) => setConfig(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full border-2 border-black p-2 text-xs font-mono font-bold focus:outline-none focus:bg-yellow-50"
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
                      className="w-full border-2 border-black p-2 text-xs font-mono font-bold focus:outline-none focus:bg-yellow-50"
                      placeholder="e.g. Thank you for your purchase, [BUYER_NAME]!"
                    />
                  </div>
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

            {/* Card 2: Security Notice */}
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-black uppercase bg-[#FF5C00] text-black px-2 py-1 inline-block border border-black">
                  2. Security Notice (7D / 7x Limit)
                </span>
                <ShieldAlert className="w-4 h-4 text-[#FF5C00]" />
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                      Notice Title:
                    </label>
                    <input
                      type="text"
                      value={config.warning_title}
                      onChange={(e) => setConfig(prev => ({ ...prev, warning_title: e.target.value }))}
                      className="w-full border-2 border-black p-2 text-xs font-mono font-bold focus:outline-none focus:bg-yellow-50"
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
                      className="w-full border-2 border-black p-2 text-xs font-mono font-bold focus:outline-none focus:bg-yellow-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                    Notice Description:
                  </label>
                  <textarea
                    rows={2}
                    value={config.warning_text}
                    onChange={(e) => setConfig(prev => ({ ...prev, warning_text: e.target.value }))}
                    className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Font Canvas VIP Bonus */}
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase bg-blue-600 text-white px-2 py-1 inline-block">
                  3. Font Canvas VIP Bonus
                </span>
                
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-black">
                  <input
                    type="checkbox"
                    checked={config.canvas_vip_enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, canvas_vip_enabled: e.target.checked }))}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <span>Include Card in Delivery Email</span>
                </label>
              </div>

              {config.canvas_vip_enabled && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                        Bonus Title:
                      </label>
                      <input
                        type="text"
                        value={config.canvas_heading}
                        onChange={(e) => setConfig(prev => ({ ...prev, canvas_heading: e.target.value }))}
                        className="w-full border-2 border-black p-2 text-xs font-mono font-bold focus:outline-none focus:bg-yellow-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1 uppercase text-[11px]">
                        Bonus Description:
                      </label>
                      <input
                        type="text"
                        value={config.canvas_text}
                        onChange={(e) => setConfig(prev => ({ ...prev, canvas_text: e.target.value }))}
                        className="w-full border-2 border-black p-2 text-xs font-mono focus:outline-none focus:bg-yellow-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: Test Email Dispatch */}
            <div className="bg-[#FFE600] border-2 border-black p-5 shadow-[4px_4px_0px_#000]">
              <h3 className="text-xs font-black uppercase text-black mb-1 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Send Live Test to Your Inbox</span>
              </h3>
              <p className="text-[11px] font-bold text-black/80 mb-3">
                Dispatches a test letter via one of the 3 active GAS accounts to check deliverability
              </p>

              <form onSubmit={handleSendTest} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="flex-1 bg-white border-2 border-black p-2 text-xs font-mono font-bold text-black focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="bg-black text-white hover:bg-zinc-800 border-2 border-black px-6 py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_#000] active:shadow-none"
                  >
                    {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{sendingTest ? 'SENDING...' : 'DISPATCH TEST'}</span>
                  </button>
                </div>

                {testStatus && (
                  <div className={`p-2.5 border-2 border-black text-xs font-bold mt-2 ${testStatus.success ? 'bg-white text-green-900' : 'bg-red-100 text-red-900'}`}>
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

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SENT EMAILS / EMAIL TERKIRIM TAB (OUTBOX) */}
      {/* ========================================================================= */}
      {activeTab === 'sent' && (
        <div className="space-y-6">
          
          {/* Top Bar: Search, Filters, Refresh */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by Order ID, Buyer Email, Font Name, or Sender..."
                value={sentSearchTerm}
                onChange={(e) => {
                  setSentSearchTerm(e.target.value);
                  setSentPage(1);
                }}
                className="w-full bg-transparent border-2 border-black pl-8 pr-4 py-2 text-xs font-mono font-bold text-black outline-none focus:bg-yellow-50 placeholder:text-gray-400"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              {sentSearchTerm && (
                <button
                  onClick={() => setSentSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase font-black text-gray-500 hover:text-black cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Filter by Sender Gmail */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 whitespace-nowrap">
                  Admin Sender:
                </span>
                <select
                  value={sentSenderFilter}
                  onChange={(e) => {
                    setSentSenderFilter(e.target.value);
                    setSentPage(1);
                  }}
                  className="border-2 border-black bg-white px-2.5 py-1.5 text-xs font-mono font-black text-black outline-none cursor-pointer"
                >
                  <option value="ALL">ALL SENDERS ({sentOrders.length})</option>
                  {allSendersList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchSentOrders}
                disabled={loadingSent}
                className="bg-black text-white hover:bg-zinc-800 border-2 border-black px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] active:shadow-none transition-all"
                title="Reload sent orders ledger"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSent ? 'animate-spin' : ''}`} />
                <span>REFRESH</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border-2 border-black bg-white shadow-[4px_4px_0px_#000]">
            <table className="w-full text-left border-collapse min-w-[840px]">
              <thead>
                <tr className="bg-black text-white text-[10px] font-black tracking-widest uppercase">
                  <th className="p-4">Sent Date</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Buyer / Client</th>
                  <th className="p-4">Purchased Font</th>
                  <th className="p-4 text-center">Amount</th>
                  <th className="p-4 text-center">Admin Sender (Gmail)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Live Email Design</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y-2 divide-black/10">
                {loadingSent ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center animate-pulse italic opacity-40 font-bold">
                      Loading Dispatched Email Records...
                    </td>
                  </tr>
                ) : paginatedSentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center opacity-40 italic font-bold">
                      {sentSearchTerm ? `No sent emails matching "${sentSearchTerm}"` : "No sent emails recorded in the database yet."}
                    </td>
                  </tr>
                ) : (
                  paginatedSentOrders.map((order) => {
                    const cleanSender = formatGasSender(order.metadata?.email_sent_by);
                    const sentAt = order.metadata?.email_sent_at || order.download_date;
                    const buyerEmail = order.fontbuyer?.email || order.buyer_email || 'N/A';
                    const buyerName = order.fontbuyer?.full_name || order.metadata?.buyer_name || '';

                    return (
                      <tr 
                        key={order.id || order.transaction_id}
                        onClick={() => setSelectedSentOrder(order)}
                        className="hover:bg-yellow-50/60 transition-colors cursor-pointer group"
                      >
                        {/* Sent Date */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-black text-black">
                            {new Date(sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] font-mono text-gray-500 font-bold">
                            {new Date(sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Order ID */}
                        <td className="p-4 font-mono font-black text-[#ff5c00] text-xs">
                          #{order.transaction_id ? order.transaction_id.slice(0, 14) : 'N/A'}
                        </td>

                        {/* Buyer */}
                        <td className="p-4">
                          <div className="font-black text-black lowercase truncate max-w-[200px]" title={buyerEmail}>
                            {buyerEmail}
                          </div>
                          {buyerName && (
                            <div className="text-[10px] text-gray-500 font-bold truncate max-w-[200px]">
                              {buyerName}
                            </div>
                          )}
                        </td>

                        {/* Font & Tier */}
                        <td className="p-4">
                          <div className="font-black text-sm uppercase">
                            {order.fonts?.name || order.font_name || 'Typeface Asset'}
                          </div>
                          <div className="text-[9px] font-mono uppercase font-bold text-gray-600">
                            {order.tier ? (MASTER_TIER_LABELS[order.tier.toLowerCase()]?.solo || order.tier) : 'Commercial License'}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="p-4 text-center font-mono font-black text-black">
                          ${order.metadata?.price_at_purchase ?? (order.download_type === 'trial' ? '0' : '—')}
                        </td>

                        {/* Sender Account */}
                        <td className="p-4 text-center">
                          <span 
                            className="inline-block px-2.5 py-1 text-[10px] font-mono font-black border border-black bg-white text-black max-w-[170px] truncate shadow-[1px_1px_0px_#000]"
                            title={cleanSender}
                          >
                            {cleanSender}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[8px] font-black border border-black bg-[#00F59B] text-black uppercase tracking-widest shadow-[1px_1px_0px_#000]">
                            <Check size={10} /> SENT
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedSentOrder(order)}
                              title="View full personalized live email layout"
                              className="px-2.5 py-1 border-2 border-black bg-white hover:bg-black hover:text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000]"
                            >
                              <Eye size={12} />
                              <span>VIEW EMAIL</span>
                            </button>

                            <button
                              onClick={(e) => handleResendSentEmail(order, e)}
                              disabled={resendingOrderId === order.transaction_id}
                              title="Resend this delivery email to buyer"
                              className="px-2 py-1 border border-black bg-yellow-300 hover:bg-yellow-400 text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 shadow-[1px_1px_0px_#000]"
                            >
                              <Mail size={11} className={resendingOrderId === order.transaction_id ? 'animate-spin' : ''} />
                              <span>{resendingOrderId === order.transaction_id ? '...' : 'RESEND'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {filteredSentOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono font-bold pt-2">
              <div className="text-gray-600">
                SHOWING <strong className="text-black">{(sentPage - 1) * sentItemsPerPage + 1}</strong> TO{' '}
                <strong className="text-black">{Math.min(sentPage * sentItemsPerPage, filteredSentOrders.length)}</strong> OF{' '}
                <strong className="text-black">{filteredSentOrders.length}</strong> SENT EMAILS
              </div>

              {totalSentPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSentPage(p => Math.max(1, p - 1))}
                    disabled={sentPage === 1}
                    className="p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 cursor-pointer transition-all shadow-[2px_2px_0px_#000]"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalSentPages }, (_, i) => i + 1).map((pg) => {
                    if (totalSentPages > 7 && Math.abs(pg - sentPage) > 2 && pg !== 1 && pg !== totalSentPages) {
                      if (Math.abs(pg - sentPage) === 3) return <span key={pg} className="px-1">...</span>;
                      return null;
                    }
                    return (
                      <button
                        key={pg}
                        onClick={() => setSentPage(pg)}
                        className={`w-7 h-7 text-xs font-black border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0px_#000] ${
                          sentPage === pg
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-yellow-200'
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setSentPage(p => Math.min(totalSentPages, p + 1))}
                    disabled={sentPage === totalSentPages}
                    className="p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 cursor-pointer transition-all shadow-[2px_2px_0px_#000]"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIVE DESIGN EMAIL PREVIEW WITH BUYER INFO */}
      {/* ========================================================================= */}
      {selectedSentOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border-3 border-black shadow-[10px_10px_0px_#000] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b-3 border-black bg-black text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#ff5c00] text-black font-black">
                    DISPATCHED EMAIL
                  </span>
                  <span className="font-mono text-xs font-black tracking-wider text-white">
                    #{selectedSentOrder.transaction_id}
                  </span>
                </div>
                <div className="text-xs font-sans mt-1 opacity-90 flex flex-wrap items-center gap-x-3 gap-y-1 font-bold">
                  <span>Buyer: <strong>{selectedSentOrder.fontbuyer?.email || selectedSentOrder.buyer_email}</strong></span>
                  {selectedSentOrder.fontbuyer?.full_name && (
                    <span>({selectedSentOrder.fontbuyer?.full_name})</span>
                  )}
                  <span>•</span>
                  <span>Dispatched via: <strong className="text-yellow-300 font-mono">{formatGasSender(selectedSentOrder.metadata?.email_sent_by)}</strong></span>
                </div>
              </div>

              {/* View Controls & Close */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center border border-white p-0.5 bg-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModalPreviewDevice('desktop')}
                    className={`px-2.5 py-1 text-[10px] uppercase font-black transition-all cursor-pointer ${
                      modalPreviewDevice === 'desktop'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPreviewDevice('mobile')}
                    className={`px-2.5 py-1 text-[10px] uppercase font-black transition-all cursor-pointer ${
                      modalPreviewDevice === 'mobile'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Mobile
                  </button>
                </div>

                <button
                  onClick={() => handleResendSentEmail(selectedSentOrder)}
                  disabled={resendingOrderId === selectedSentOrder.transaction_id}
                  className="px-3 py-1.5 bg-[#ff5c00] hover:bg-[#ff7728] text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 border border-black shadow-[2px_2px_0px_#fff]"
                  title="Resend this exact email to buyer"
                >
                  <Send size={12} className={resendingOrderId === selectedSentOrder.transaction_id ? 'animate-spin' : ''} />
                  <span>{resendingOrderId === selectedSentOrder.transaction_id ? 'SENDING...' : 'RESEND EMAIL'}</span>
                </button>

                <button
                  onClick={() => setSelectedSentOrder(null)}
                  className="p-1.5 hover:bg-zinc-800 border border-white text-white cursor-pointer ml-1"
                  title="Close viewer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Authentic Email Iframe */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-zinc-900 flex justify-center min-h-[500px]">
              <div 
                className={`transition-all duration-300 bg-[#09090b] ${
                  modalPreviewDevice === 'mobile' ? 'w-[375px] border-4 border-zinc-700 rounded-3xl overflow-hidden shadow-2xl' : 'w-full max-w-[620px]'
                }`}
              >
                <iframe
                  title="Dispatched Email Viewer"
                  srcDoc={generateSentEmailHtml(selectedSentOrder)}
                  className="w-full h-[720px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            {/* Modal Footer info */}
            <div className="p-3 border-t-2 border-black bg-gray-100 text-[10px] font-mono font-bold text-gray-700 flex items-center justify-between">
              <div>
                Typeface: <strong className="text-black">{selectedSentOrder.fonts?.name || selectedSentOrder.font_name}</strong> •{' '}
                Tier: <strong className="text-black">{selectedSentOrder.tier || 'Commercial'}</strong> •{' '}
                Price: <strong className="text-black">${selectedSentOrder.metadata?.price_at_purchase || 0}</strong>
              </div>
              <button
                onClick={() => setSelectedSentOrder(null)}
                className="text-black font-black hover:underline cursor-pointer uppercase tracking-wider"
              >
                CLOSE VIEWER ✕
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
