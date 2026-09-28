/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Send, Megaphone, Users, ShieldAlert, Sparkles, CheckCircle2, 
  AlertCircle, RefreshCw, Eye, History, Clock, ArrowRight, 
  Tag, HelpCircle, Layers, Mail, Check, Search, Upload, Image as ImageIcon, X
} from 'lucide-react';

interface GasAccount {
  email: string;
  url: string;
  remaining: number;
  limit: number;
  isOnline: boolean;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  preset: string;
  audience: string;
  templateData: any;
  totalTarget: number;
  remainingCount?: number;
  sentEmails: string[];
  sentLogs: Array<{
    email: string;
    gas: string;
    sent_at: string;
    status: string;
  }>;
  status: 'in_progress' | 'completed';
  created_at: string;
  last_batch_at?: string;
}

const PRESETS = [
  {
    id: 'new_release',
    name: 'New Typeface Release',
    subject: 'NEW RELEASE: [FONT_NAME] by Subqi Studio',
    title: 'NEW TYPEFACE RELEASE: [FONT_NAME]',
    subtitle: 'Contemporary Display & Editorial Typeface System',
    bodyText: 'We are excited to introduce our latest typeface release, [FONT_NAME]. Crafted with precision geometry, extensive OpenType features, expressive stylistic alternates, and variable axes ready for high-impact visual identity projects.',
    buttonText: 'TEST & BUY LICENSE',
    buttonUrl: 'https://subqi.com/fonts',
    couponCode: 'SUBQIVIP20'
  },
  {
    id: 'update_typeface',
    name: 'Update Typeface (Specimen Upgrade)',
    subject: 'TYPEFACE UPDATE: [FONT_NAME] v2.0 is Here',
    title: 'TYPEFACE UPDATE: [FONT_NAME]',
    subtitle: 'Expanded Glyph Set, Kerning Refinements & Bug Fixes',
    bodyText: 'We have released an important update for [FONT_NAME]. This update includes refined kerning pairs, expanded language support, new stylistic ligatures, and structural outline optimizations for enhanced display rendering.',
    buttonText: 'EXPLORE UPDATE',
    buttonUrl: 'https://subqi.com/fonts',
    couponCode: 'UPDATE20'
  },
  {
    id: 'new_feature',
    name: 'New Product / Canvas Launch',
    subject: 'Introducing FontCanvas — Next-Gen Typography Workspace',
    title: 'INTRODUCING FONTCANVAS',
    subtitle: 'Real-Time Typographic Layout & Composition Suite',
    bodyText: 'Explore, compose, and test fonts in a live interactive design workspace. FontCanvas brings advanced vector manipulation, chromatic layer stacking, and high-res asset generation directly to your browser.',
    buttonText: 'LAUNCH FONTCANVAS',
    buttonUrl: 'https://subqi.com/canvas',
    couponCode: ''
  },
  {
    id: 'maintenance',
    name: 'Scheduled Maintenance Notice',
    subject: 'Notice: Scheduled Studio Infrastructure Maintenance',
    title: 'SCHEDULED MAINTENANCE NOTICE',
    subtitle: 'Edge Network & Delivery Upgrades',
    bodyText: 'Subqi digital storefront and licensing endpoints will undergo brief scheduled maintenance to optimize edge caching and global font delivery performance. Services will resume shortly.',
    buttonText: 'CHECK STATUS',
    buttonUrl: 'https://subqi.com',
    couponCode: ''
  },
  {
    id: 'back_live',
    name: 'We Are Back Online!',
    subject: 'Subqi Studio is Live & Fully Operational',
    title: 'WE ARE BACK ONLINE',
    subtitle: 'System Upgrades Successfully Deployed',
    bodyText: 'Our scheduled infrastructure upgrades are complete. All services, type testers, downloads, and FontCanvas are live with maximum edge speed worldwide. Thank you for your patience.',
    buttonText: 'EXPLORE FOUNDRY',
    buttonUrl: 'https://subqi.com/fonts',
    couponCode: 'RESUME15'
  },
  {
    id: 'custom',
    name: 'Custom Announcement',
    subject: 'An Update from Subqi Type Studio',
    title: 'FOUNDRY ANNOUNCEMENT',
    subtitle: 'News, Design Notes & Exclusive Privileges',
    bodyText: 'Hello,\n\nHere are the latest design developments, catalog additions, and curated typographic insights from Subqi Type Studio.',
    buttonText: 'VIEW CATALOG',
    buttonUrl: 'https://subqi.com',
    couponCode: ''
  }
];

export default function BroadcastStudio() {
  const [activeTab, setActiveTab] = useState<'compose' | 'campaigns' | 'logs'>('compose');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [data, setData] = useState<{
    gas: { accounts: GasAccount[]; totalRemaining: number; safetyReserve: number; allowedToday: number };
    audience: { buyersCount: number; subscribersCount: number; totalUniqueCount: number };
    campaigns: Campaign[];
  }>({
    gas: { accounts: [], totalRemaining: 0, safetyReserve: 15, allowedToday: 0 },
    audience: { buyersCount: 0, subscribersCount: 0, totalUniqueCount: 0 },
    campaigns: []
  });

  // Compose State
  const [selectedPreset, setSelectedPreset] = useState('new_release');
  const [audience, setAudience] = useState<'all' | 'buyers' | 'subscribers'>('all');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [subject, setSubject] = useState(PRESETS[0].subject);
  const [headline, setHeadline] = useState(PRESETS[0].title);
  const [subtitle, setSubtitle] = useState(PRESETS[0].subtitle);
  const [bodyText, setBodyText] = useState(PRESETS[0].bodyText);
  const [bannerUrl, setBannerUrl] = useState('');
  const [buttonText, setButtonText] = useState(PRESETS[0].buttonText);
  const [buttonUrl, setButtonUrl] = useState(PRESETS[0].buttonUrl);
  const [couponCode, setCouponCode] = useState(PRESETS[0].couponCode);

  // Search & Filter
  const [logSearch, setLogSearch] = useState('');

  const [fontsList, setFontsList] = useState<Array<{ id: string; name: string; slug?: string }>>([]);
  const [selectedFontName, setSelectedFontName] = useState('');
  const [fontSearch, setFontSearch] = useState('');

  // Banner Upload & Google Drive Auto-Converter State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);

  const convertDriveUrl = (inputUrl: string) => {
    if (!inputUrl) return '';
    const trimmed = inputUrl.trim();
    const match1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1 && match1[1]) {
      return `https://lh3.googleusercontent.com/d/${match1[1]}`;
    }
    const match2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2 && match2[1]) {
      return `https://lh3.googleusercontent.com/d/${match2[1]}`;
    }
    return trimmed;
  };

  const handleBannerUrlChange = (val: string) => {
    const converted = convertDriveUrl(val);
    setBannerUrl(converted);
  };

  const handleBannerUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }
    setIsUploadingBanner(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again.');

      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/\s+/g, '_');
      const uniqueFileName = `${timestamp}-${cleanFileName}`;

      const res = await fetch(`/api/admin/upload/${uniqueFileName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': file.type
        },
        body: file
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || `Upload failed with HTTP ${res.status}`);
      }

      const publicUrl = `${window.location.origin}/api/images/${uniqueFileName}`;
      setBannerUrl(publicUrl);
    } catch (err: any) {
      console.error('Banner upload error:', err);
      alert('Failed to upload image: ' + err.message);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFontsList();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/broadcast-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed fetching broadcast data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFontsList = async () => {
    try {
      const { data, error } = await supabase
        .from('fonts')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed fetching fonts list:', error);
      } else if (data) {
        setFontsList(data);
      }
    } catch (e) {
      console.warn('Failed fetching fonts list:', e);
    }
  };

  const handleSelectFont = (fontName: string) => {
    setSelectedFontName(fontName);
    if (!fontName) return;

    const isRelease = selectedPreset === 'new_release';
    const isUpdate = selectedPreset === 'update_typeface';

    if (isRelease) {
      setCampaignTitle(`${fontName} - Release`);
    } else if (isUpdate) {
      setCampaignTitle(`${fontName} - Update`);
    }

    const currentPresetObj = PRESETS.find(p => p.id === selectedPreset);
    if (!currentPresetObj) return;

    const replaceToken = (text: string, templateFallback: string) => {
      if (text.includes('[FONT_NAME]')) {
        return text.replace(/\[FONT_NAME\]/g, fontName);
      }
      if (selectedFontName && text.includes(selectedFontName)) {
        return text.split(selectedFontName).join(fontName);
      }
      return templateFallback.replace(/\[FONT_NAME\]/g, fontName);
    };

    setSubject(prev => replaceToken(prev, currentPresetObj.subject));
    setHeadline(prev => replaceToken(prev, currentPresetObj.title));
    setSubtitle(prev => replaceToken(prev, currentPresetObj.subtitle));
    setBodyText(prev => replaceToken(prev, currentPresetObj.bodyText));
  };

  const handleApplyPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = PRESETS.find(item => item.id === presetId);
    if (!p) return;

    const isRelease = presetId === 'new_release';
    const isUpdate = presetId === 'update_typeface';

    let subj = p.subject;
    let head = p.title;
    let subt = p.subtitle;
    let body = p.bodyText;

    if ((isRelease || isUpdate) && selectedFontName) {
      subj = subj.replace(/\[FONT_NAME\]/g, selectedFontName);
      head = head.replace(/\[FONT_NAME\]/g, selectedFontName);
      subt = subt.replace(/\[FONT_NAME\]/g, selectedFontName);
      body = body.replace(/\[FONT_NAME\]/g, selectedFontName);
      setCampaignTitle(isRelease ? `${selectedFontName} - Release` : `${selectedFontName} - Update`);
    } else if (isRelease || isUpdate) {
      setCampaignTitle('');
    }

    setSubject(subj);
    setHeadline(head);
    setSubtitle(subt);
    setBodyText(body);
    setButtonText(p.buttonText);
    setButtonUrl(p.buttonUrl);
    setCouponCode(p.couponCode);
  };

  const getTargetAudienceCount = () => {
    if (audience === 'buyers') return data.audience.buyersCount;
    if (audience === 'subscribers') return data.audience.subscribersCount;
    return data.audience.totalUniqueCount;
  };

  const handleSendBroadcast = async (existingCampaignId?: string) => {
    const targetCount = getTargetAudienceCount();
    if (targetCount === 0) {
      alert("No recipients found in selected audience.");
      return;
    }

    if (data.gas.allowedToday <= 0) {
      alert("Daily quota limit reached (15 emails reserved for real-time customer orders). Please continue tomorrow.");
      return;
    }

    const campId = existingCampaignId || `camp_${Date.now()}`;
    const willSendCount = Math.min(targetCount, data.gas.allowedToday);
    const confirmMsg = `Launch Broadcast Batch?\n\n- Sending Today: ${willSendCount} emails\n- Safety Reserve: 15 emails protected for incoming customer orders\n- Audience: ${audience.toUpperCase()}\n- Accounts: Balanced across all active GAS senders\n\nProceed with dispatch?`;

    if (!window.confirm(confirmMsg)) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/broadcast-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          campaignId: campId,
          campaignTitle: campaignTitle || headline || subject,
          audience,
          subject,
          preset: selectedPreset,
          templateData: {
            title: headline,
            subtitle,
            bodyText,
            bannerUrl,
            buttonText,
            buttonUrl,
            couponCode
          }
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.message || resJson.error || 'Broadcast failed');
      }

      alert(`Broadcast Batch Dispatched!\n\nSent: ${resJson.sentInBatch} emails\nRemaining for Campaign: ${resJson.remainingForCampaign}\nStatus: ${resJson.status.toUpperCase()}`);
      await fetchData();
      setActiveTab('campaigns');
    } catch (err: any) {
      alert("Broadcast Error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const allLogs = (data.campaigns || []).flatMap(c => 
    (c.sentLogs || []).map(l => ({ ...l, campaignTitle: c.title || c.subject, campaignId: c.id }))
  ).sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

  const filteredLogs = allLogs.filter(l => 
    (l.email || '').toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.campaignTitle || '').toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.gas || '').toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-mono">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-black pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-black text-white">
              <Megaphone size={20} />
            </span>
            <h1 className="font-black text-3xl md:text-4xl tracking-tight uppercase">Broadcast Studio</h1>
          </div>
          <p className="text-xs uppercase tracking-widest opacity-60 mt-2">
            Multi-Account Marketing &amp; Release Dispatch System
          </p>
        </div>

        {/* GAS REAL-TIME STATUS BAR */}
        <div className="flex items-center gap-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] p-3 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold opacity-60">Daily Available Quota</span>
            <span className="text-base font-black text-black">
              {data.gas.allowedToday} <span className="text-[10px] font-normal opacity-60">/ {data.gas.totalRemaining} (15 Reserve)</span>
            </span>
          </div>
          <div className="h-8 w-px bg-black/20" />
          <button 
            onClick={fetchData} 
            disabled={loading}
            title="Refresh Real-Time Quota"
            className="p-2 border-2 border-black hover:bg-[#ff5c00] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* THREE GAS ACCOUNTS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.gas.accounts.map((acc, idx) => (
          <div key={idx} className="border-2 border-black shadow-[3px_3px_0px_#000000] p-4 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="font-black flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-[#ff5c00] inline-block" />
                Account #{idx + 1}
              </span>
              <span className="font-bold opacity-70">{acc.remaining} / {acc.limit} Left</span>
            </div>
            <div className="text-[11px] font-bold text-black/80 truncate mb-3">{acc.email}</div>
            <div className="w-full bg-black/10 h-2 border border-black overflow-hidden">
              <div 
                className="bg-[#ff5c00] h-full transition-all" 
                style={{ width: `${Math.min(100, (acc.remaining / acc.limit) * 100)}%` }} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b-2 border-black text-xs font-black uppercase tracking-wider gap-2">
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'compose' 
              ? 'border-black text-black bg-black/5 font-black' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Send size={14} />
          Compose Broadcast
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'campaigns' 
              ? 'border-black text-black bg-black/5 font-black' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Layers size={14} />
          Campaigns &amp; Multi-Day Queue ({data.campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'logs' 
              ? 'border-black text-black bg-black/5 font-black' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <History size={14} />
          Sent Delivery Audit ({allLogs.length})
        </button>
      </div>

      {/* TAB 1: COMPOSE BROADCAST */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: FORM CONTROLS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* AUDIENCE SELECTOR CARD */}
            <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-white space-y-4">
              <label className="text-xs uppercase tracking-widest font-black flex items-center gap-2">
                <Users size={14} /> Target Audience
              </label>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAudience('all')}
                  className={`p-3 border-2 border-black text-left transition-all cursor-pointer ${
                    audience === 'all' 
                      ? 'bg-black text-white shadow-[2px_2px_0px_#ff5c00]' 
                      : 'bg-white hover:bg-black/5'
                  }`}
                >
                  <div className="font-black">ALL AUDIENCE</div>
                  <div className="text-[10px] opacity-70 mt-1">{data.audience.totalUniqueCount} Unique Emails</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('buyers')}
                  className={`p-3 border-2 border-black text-left transition-all cursor-pointer ${
                    audience === 'buyers' 
                      ? 'bg-black text-white shadow-[2px_2px_0px_#ff5c00]' 
                      : 'bg-white hover:bg-black/5'
                  }`}
                >
                  <div className="font-black">BUYERS ONLY</div>
                  <div className="text-[10px] opacity-70 mt-1">{data.audience.buyersCount} Verified Patrons</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('subscribers')}
                  className={`p-3 border-2 border-black text-left transition-all cursor-pointer ${
                    audience === 'subscribers' 
                      ? 'bg-black text-white shadow-[2px_2px_0px_#ff5c00]' 
                      : 'bg-white hover:bg-black/5'
                  }`}
                >
                  <div className="font-black">SUBSCRIBERS</div>
                  <div className="text-[10px] opacity-70 mt-1">{data.audience.subscribersCount} Active Readers</div>
                </button>
              </div>
            </div>

            {/* PRESET SELECTOR */}
            <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-white space-y-3">
              <label className="text-xs uppercase tracking-widest font-black flex items-center justify-between">
                <span>Template Preset</span>
                <span className="text-[10px] font-normal opacity-60">{PRESETS.length} Formats Available</span>
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="w-full border-2 border-black p-3 text-xs uppercase font-bold tracking-wider bg-white outline-none cursor-pointer"
              >
                {PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* TYPEFACE SELECTOR (FOR RELEASE & UPDATE PRESETS) */}
            {(selectedPreset === 'new_release' || selectedPreset === 'update_typeface') && (
              <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-amber-50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-widest font-black flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-600" /> Select Target Typeface
                  </label>
                  <span className="text-[10px] font-bold text-gray-500">
                    {fontsList.length} Fonts Loaded (Recent First)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={fontSearch}
                      onChange={(e) => setFontSearch(e.target.value)}
                      placeholder="SEARCH FONT NAME..."
                      className="w-full border-2 border-black pl-8 pr-3 py-2 text-xs bg-white font-bold outline-none uppercase"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    {fontSearch && (
                      <button
                        type="button"
                        onClick={() => setFontSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold hover:underline"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>

                  <div>
                    <select
                      value={selectedFontName}
                      onChange={(e) => handleSelectFont(e.target.value)}
                      className="w-full border-2 border-black p-2 text-xs uppercase font-bold bg-white outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Typeface --</option>
                      {fontsList
                        .filter(f => !fontSearch || f.name.toLowerCase().includes(fontSearch.toLowerCase().trim()))
                        .map(f => (
                          <option key={f.id} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {selectedFontName ? (
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800 bg-emerald-100 border-2 border-emerald-500 p-2">
                    <Check size={12} />
                    <span>Selected: <strong>{selectedFontName}</strong> — Campaign title & [FONT_NAME] tokens automatically populated</span>
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-amber-700 italic">
                    Choose a typeface above to automatically replace [FONT_NAME] tokens and configure campaign reference.
                  </div>
                )}
              </div>
            )}

            {/* EMAIL FIELDS */}
            <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-white space-y-4 text-xs">
              <div>
                <label className="uppercase tracking-widest font-black block mb-1">Campaign Reference Name</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. Wiltasso Typeface Release"
                  className="w-full border-2 border-black p-2.5 bg-white outline-none font-bold"
                />
              </div>

              <div>
                <label className="uppercase tracking-widest font-black block mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border-2 border-black p-2.5 bg-white outline-none font-sans font-bold text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="uppercase tracking-widest font-black block mb-1">Main Heading</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full border-2 border-black p-2.5 bg-white outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="uppercase tracking-widest font-black block mb-1">Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full border-2 border-black p-2.5 bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="uppercase tracking-widest font-black block mb-1">Message Body</label>
                <textarea
                  rows={6}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full border-2 border-black p-2.5 bg-white outline-none font-sans text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="uppercase tracking-widest font-black block mb-1">CTA Button Label</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full border-2 border-black p-2.5 bg-white outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="uppercase tracking-widest font-black block mb-1">Target Action URL</label>
                  <input
                    type="url"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    className="w-full border-2 border-black p-2.5 bg-white outline-none"
                  />
                </div>
              </div>

              {/* BANNER IMAGE UPLOAD / DRAG & DROP & URL */}
              <div className="border-2 border-dashed border-black/40 p-4 bg-black/[0.02] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="uppercase tracking-widest font-black text-xs flex items-center gap-2">
                    <ImageIcon size={14} /> Header Banner Image (Optional)
                  </label>
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerUrl('')}
                      className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>

                {bannerUrl ? (
                  <div className="flex items-center gap-3 bg-white p-2 border-2 border-black">
                    <img src={bannerUrl} alt="Banner Preview" className="w-20 h-14 object-cover border border-black" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
                        <Check size={12} /> Image Active
                      </div>
                      <div className="text-[9px] font-mono text-gray-500 truncate" title={bannerUrl}>
                        {bannerUrl}
                      </div>
                    </div>
                    <label className="px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase cursor-pointer hover:bg-gray-800 transition-all">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleBannerUpload(f);
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingBanner(true); }}
                    onDragLeave={() => setIsDraggingBanner(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingBanner(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleBannerUpload(f);
                    }}
                    className={`border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
                      isDraggingBanner ? 'border-[#ff5c00] bg-orange-50' : 'border-black/30 hover:border-black bg-white'
                    }`}
                  >
                    <input
                      type="file"
                      id="bannerFileInput"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleBannerUpload(f);
                      }}
                    />
                    <label htmlFor="bannerFileInput" className="cursor-pointer block">
                      <Upload size={20} className="mx-auto mb-1 text-gray-500" />
                      <div className="font-bold text-xs">
                        {isUploadingBanner ? 'Uploading to CDN...' : 'Drop image here, or click to browse'}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5">
                        PNG, JPG, WEBP, SVG (Auto-uploaded to Cloudflare R2)
                      </div>
                    </label>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-bold text-gray-500 mb-1">
                    Or paste direct image URL (Google Drive share links auto-convert):
                  </div>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => handleBannerUrlChange(e.target.value)}
                    placeholder="https://... or Google Drive share link"
                    className="w-full border-2 border-black p-2 text-xs bg-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="uppercase tracking-widest font-black block mb-1">Promo Coupon Code (Optional)</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. SUBQIVIP20"
                  className="w-full border-2 border-black p-2.5 bg-white outline-none uppercase font-black"
                />
              </div>
            </div>

            {/* LAUNCH BUTTON */}
            <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs">
                <span className="font-black text-black">Batch Size Today: </span>
                <span className="text-[#ff5c00] font-black text-sm">
                  {Math.min(getTargetAudienceCount(), data.gas.allowedToday)} emails
                </span>
                {getTargetAudienceCount() > data.gas.allowedToday && (
                  <div className="text-[10px] text-black/70 mt-0.5">
                    Remaining {getTargetAudienceCount() - data.gas.allowedToday} emails queued for Day 2 continuation.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSendBroadcast()}
                disabled={sending || getTargetAudienceCount() === 0 || data.gas.allowedToday === 0}
                className="w-full md:w-auto px-8 py-3 bg-black text-white text-xs uppercase font-black tracking-widest hover:bg-[#ff5c00] hover:text-black border-2 border-black shadow-[3px_3px_0px_#000000] transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {sending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Dispatching Batch...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Launch Broadcast Batch
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE VISUAL EMAIL PREVIEW */}
          <div className="lg:col-span-5 sticky top-20 space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest font-black border-b-2 border-black pb-2">
              <span className="flex items-center gap-2">
                <Eye size={14} /> Subqi Email Preview
              </span>
              <span className="text-[10px] font-normal opacity-60">Recipient View</span>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="border-2 border-black shadow-[6px_6px_0px_#000000] bg-white p-6 text-black max-h-[750px] overflow-y-auto">
              {/* Header Branding */}
              <div className="text-center pb-5 mb-5 border-b-2 border-black">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff5c00]">
                  OFFICIAL FOUNDRY DISPATCH
                </div>
                <div className="font-sans font-black text-2xl tracking-tight uppercase mt-1">
                  SUBQI TYPE FOUNDRY
                </div>
                <div className="text-[9px] font-mono tracking-widest text-black/60 uppercase mt-1 font-bold">
                  CONTEMPORARY &amp; EDITORIAL TYPE DESIGN
                </div>
              </div>

              {/* Banner Image */}
              {bannerUrl && (
                <div className="mb-5 border-2 border-black overflow-hidden">
                  <img src={bannerUrl} alt="Banner" className="w-full h-auto object-cover" />
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="text-center mb-5">
                <h2 className="font-sans font-black text-xl uppercase tracking-tight leading-tight">
                  {headline || "MAIN HEADLINE"}
                </h2>
                {subtitle && (
                  <p className="text-xs font-bold text-[#ff5c00] uppercase tracking-wider mt-1">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="text-xs leading-relaxed text-black/80 whitespace-pre-line mb-6 font-sans">
                {bodyText || "Your broadcast announcement will appear here with clean contemporary styling."}
              </div>

              {/* Coupon Box */}
              {couponCode && (
                <div className="bg-[#ff5c00] border-2 border-black shadow-[4px_4px_0px_#000000] p-4 text-center my-5 text-white">
                  <div className="text-[10px] uppercase tracking-[0.15em] font-black mb-1">
                    VIP EXCLUSIVE VOUCHER
                  </div>
                  <div className="font-mono text-lg font-black text-black bg-white inline-block px-3 py-1 border-2 border-black tracking-widest">
                    {couponCode}
                  </div>
                  <div className="text-[10px] font-bold text-white uppercase tracking-wider mt-1">
                    Redeem at checkout for an instant discount.
                  </div>
                </div>
              )}

              {/* CTA Button */}
              {buttonText && (
                <div className="text-center my-6">
                  <span className="inline-block bg-black text-white text-[11px] font-black uppercase tracking-[0.1em] px-6 py-3 border-2 border-black shadow-[3px_3px_0px_#ff5c00]">
                    {buttonText} &rarr;
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-4 border-t-2 border-black text-[10px] text-black/60 leading-relaxed font-bold">
                <div className="text-black uppercase tracking-wider mb-0.5">
                  Subqi Type Studio
                </div>
                <div>You are receiving this communication as a registered buyer or subscriber.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGNS & MULTI-DAY QUEUE */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="border-2 border-black shadow-[3px_3px_0px_#000000] p-4 bg-white flex items-center justify-between text-xs">
            <div>
              <span className="font-black uppercase">Multi-Day Queue Engine: </span>
              <span className="opacity-70">
                Large subscriber lists are split into daily batches. Completed emails are never duplicated on subsequent days.
              </span>
            </div>
            <div className="text-[#ff5c00] font-black whitespace-nowrap uppercase">
              Allowed Today: {data.gas.allowedToday} emails
            </div>
          </div>

          {data.campaigns.length === 0 ? (
            <div className="border-2 border-black p-12 text-center text-xs opacity-60">
              NO BROADCAST CAMPAIGNS CREATED YET. COMPOSE YOUR FIRST DISPATCH ABOVE.
            </div>
          ) : (
            <div className="space-y-4">
              {data.campaigns.map((camp) => {
                const total = camp.totalTarget || camp.sentEmails.length;
                const sent = (camp.sentEmails || []).length;
                const remaining = Math.max(0, total - sent);
                const percent = total > 0 ? Math.round((sent / total) * 100) : 100;
                const canContinue = remaining > 0 && data.gas.allowedToday > 0;

                return (
                  <div key={camp.id} className="border-2 border-black shadow-[4px_4px_0px_#000000] p-6 bg-white space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-lg uppercase">{camp.title || camp.subject}</h3>
                          <span className={`text-[9px] px-2 py-0.5 uppercase font-black border-2 border-black ${
                            camp.status === 'completed'
                              ? 'bg-emerald-300 text-black'
                              : 'bg-amber-300 text-black'
                          }`}>
                            {camp.status === 'completed' ? 'Completed' : 'In Progress (Queued)'}
                          </span>
                        </div>
                        <div className="text-[11px] opacity-60 mt-1">
                          Subject: {camp.subject} &bull; Audience: {camp.audience.toUpperCase()} &bull; Created: {new Date(camp.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {remaining > 0 ? (
                        <button
                          onClick={() => handleSendBroadcast(camp.id)}
                          disabled={sending || !canContinue}
                          className="px-5 py-2.5 bg-black text-white text-xs uppercase font-black tracking-wider hover:bg-[#ff5c00] hover:text-black border-2 border-black shadow-[3px_3px_0px_#000000] transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer self-start md:self-auto"
                        >
                          <Send size={12} />
                          Continue Next Batch ({Math.min(remaining, data.gas.allowedToday)} emails)
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1.5 uppercase">
                          <CheckCircle2 size={16} /> All Recipients Reached
                        </span>
                      )}
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Progress: {sent} / {total} sent</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-black/10 h-3 border border-black overflow-hidden">
                        <div 
                          className="bg-[#ff5c00] h-full transition-all" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] opacity-60 pt-0.5">
                        <span>Remaining: {remaining} emails</span>
                        <span>Last Batch: {camp.last_batch_at ? new Date(camp.last_batch_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SENT DELIVERY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Search recipient email, campaign title, or GAS account..."
              className="w-full md:w-96 border-2 border-black p-2.5 text-xs bg-white outline-none font-bold"
            />
            <span className="text-xs opacity-60 font-bold">Showing {filteredLogs.length} Delivery Records</span>
          </div>

          <div className="border-2 border-black shadow-[4px_4px_0px_#000000] overflow-x-auto bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-white uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Campaign</th>
                  <th className="p-3">Recipient Email</th>
                  <th className="p-3">Sender Account</th>
                  <th className="p-3 text-right">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center opacity-50">
                      NO DELIVERY LOGS MATCHING CRITERIA.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-black/5">
                      <td className="p-3 whitespace-nowrap opacity-70">
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                      <td className="p-3 font-black text-black">
                        {log.campaignTitle}
                      </td>
                      <td className="p-3 font-bold text-black">
                        {log.email}
                      </td>
                      <td className="p-3 text-black/70">
                        {log.gas}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-black bg-emerald-300 px-2 py-0.5 border border-black font-black text-[10px]">
                          <Check size={11} /> DELIVERED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
