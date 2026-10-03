/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Send, Megaphone, Users, ShieldAlert, Sparkles, CheckCircle2, 
  AlertCircle, RefreshCw, Eye, History, Clock, ArrowRight, 
  Tag, HelpCircle, Layers, Mail, Check, Search, Upload, Image as ImageIcon, X,
  Plus, Trash2, ChevronUp, ChevronDown, Type, AlignLeft, ExternalLink,
  Calculator, Calendar, Ticket, UserCheck
} from 'lucide-react';

export interface BroadcastBlock {
  id: string;
  type: 'heading' | 'text' | 'button' | 'image' | 'coupon';
  title?: string;
  subtitle?: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  imageCaption?: string;
  couponCode?: string;
  couponDiscount?: number;
  couponEndDate?: string;
  couponMaxUses?: number;
  couponUrgencyText?: string;
}

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
    id: 'new_coupon',
    name: 'Exclusive Coupon / Private Buyer Deal',
    subject: 'Exclusive [DISCOUNT]% Off Privilege — [BUYER_NAME]',
    title: 'EXCLUSIVE CLIENT PRIVILEGE',
    subtitle: 'Private Typographic License Voucher',
    bodyText: 'Dear [BUYER_NAME],\n\nThank you for your interest in our typeface library. As negotiated, we are pleased to grant you an exclusive [DISCOUNT]% discount privilege on your upcoming font licensing purchase.\n\nPlease apply your personal voucher code at checkout to claim this special rate.',
    buttonText: 'CLAIM PRIVILEGE & BROWSE FONTS',
    buttonUrl: 'https://subqi.com/fonts',
    couponCode: 'VIP25OFF'
  },
  {
    id: 'new_promotion',
    name: 'Seasonal Promotion / Event Sale (Site-wide Discount)',
    subject: '[EVENT_NAME] Celebration: Up to [DISCOUNT]% Off Site-Wide',
    title: '[EVENT_NAME] SPECIAL SALE',
    subtitle: 'Store-Wide Price Reduction Across All Fonts',
    bodyText: 'To celebrate [EVENT_NAME], we are offering a limited-time site-wide holiday promotion. All font licenses and family bundles are automatically discounted at checkout — no coupon code required.\n\nElevate your visual identity projects with our latest typographic specimens.',
    buttonText: 'EXPLORE [EVENT_NAME] DEALS',
    buttonUrl: 'https://subqi.com/fonts',
    couponCode: ''
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

  // Database Coupons State (Integrated with Supabase 'coupons' table)
  const [dbCoupons, setDbCoupons] = useState<any[]>([]);
  const [isAddingNewCoupon, setIsAddingNewCoupon] = useState<string | null>(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('20');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState('1');
  const [newCouponEndDate, setNewCouponEndDate] = useState('');
  const [isSavingNewCoupon, setIsSavingNewCoupon] = useState(false);

  // Private Buyer & Deal Negotiator State (for 'new_coupon' preset)
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [buyersList, setBuyersList] = useState<any[]>([]);
  const [selectedBuyerEmail, setSelectedBuyerEmail] = useState('');
  const [selectedBuyerName, setSelectedBuyerName] = useState('');
  const [showBuyerSuggestions, setShowBuyerSuggestions] = useState(false);
  const [calcOriginalPrice, setCalcOriginalPrice] = useState('350');
  const [calcTargetPrice, setCalcTargetPrice] = useState('270');
  const [targetMode, setTargetMode] = useState<'single' | 'audience'>('single');
  const buyerSearchRef = React.useRef<HTMLDivElement>(null);

  // Seasonal Promotion Event State (for 'new_promotion' preset)
  const [selectedEventName, setSelectedEventName] = useState('Eid Mubarak');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState('30');

  // Banner Upload & Google Drive Auto-Converter State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);

  // Helper to generate promotional urgency text
  const computeUrgencyText = (c: any) => {
    const parts: string[] = [];
    if (c.end_date) {
      try {
        const d = new Date(c.end_date);
        parts.push(`⏳ Limited Time: Valid until ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
      } catch (_) {
        parts.push(`⏳ Valid until ${c.end_date}`);
      }
    }
    if (c.max_uses && c.max_uses > 0) {
      parts.push(`⚡ Strictly limited to first ${c.max_uses} redemption${c.max_uses > 1 ? 's' : ''}`);
    }
    return parts.length > 0 ? parts.join(' • ') : '⏳ Limited Availability • Claim at Checkout';
  };

  // Email Builder: Modular Content Blocks
  const [blocks, setBlocks] = useState<BroadcastBlock[]>([]);

  const addBlock = (type: 'heading' | 'text' | 'button' | 'image' | 'coupon') => {
    let initialCouponCode = couponCode || 'SUBQIVIP20';
    let initialDiscount = 20;
    let initialEndDate: string | undefined = undefined;
    let initialMaxUses: number | undefined = 1;
    let initialUrgency = '⏳ Limited Time Promotion • Apply at Checkout';

    if (type === 'coupon' && dbCoupons.length > 0) {
      const topCoupon = dbCoupons[0];
      initialCouponCode = topCoupon.code;
      initialDiscount = topCoupon.discount_value || 20;
      initialEndDate = topCoupon.end_date;
      initialMaxUses = topCoupon.max_uses;
      initialUrgency = computeUrgencyText(topCoupon);
    }

    const newBlock: BroadcastBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      title: type === 'heading' ? 'NEW SECTION HEADING' : undefined,
      subtitle: type === 'heading' ? 'Section Subtitle' : undefined,
      text: type === 'text' ? 'Write additional announcement or details here...' : undefined,
      buttonText: type === 'button' ? 'LEARN MORE' : undefined,
      buttonUrl: type === 'button' ? 'https://subqi.com' : undefined,
      imageUrl: type === 'image' ? '' : undefined,
      imageCaption: type === 'image' ? '' : undefined,
      couponCode: type === 'coupon' ? initialCouponCode : undefined,
      couponDiscount: type === 'coupon' ? initialDiscount : undefined,
      couponEndDate: type === 'coupon' ? initialEndDate : undefined,
      couponMaxUses: type === 'coupon' ? initialMaxUses : undefined,
      couponUrgencyText: type === 'coupon' ? initialUrgency : undefined,
    };
    if (type === 'coupon') {
      setCouponCode(initialCouponCode);
    }
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleCreateDbCoupon = async (blockId: string) => {
    if (!newCouponCode || !newCouponDiscount || !newCouponEndDate) {
      alert('Please complete all coupon fields (Token Code, Discount %, Expiry Date).');
      return;
    }
    setIsSavingNewCoupon(true);
    try {
      const codeUpper = newCouponCode.trim().toUpperCase();
      const discNum = parseFloat(newCouponDiscount) || 20;
      const usesNum = parseInt(newCouponMaxUses) || 1;
      const payload = {
        code: codeUpper,
        discount_type: 'percentage',
        discount_value: discNum,
        max_uses: usesNum,
        start_date: new Date().toISOString().split('T')[0],
        end_date: newCouponEndDate,
        is_active: true
      };

      const { error } = await supabase.from('coupons').insert([payload]);
      if (error) throw error;

      alert(`Coupon "${codeUpper}" registered in database! It will appear in the Promotions menu as well.`);
      const { data: updatedCoupons } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (updatedCoupons) setDbCoupons(updatedCoupons);

      const urgency = computeUrgencyText(payload);
      updateBlock(blockId, {
        couponCode: codeUpper,
        couponDiscount: discNum,
        couponEndDate: newCouponEndDate,
        couponMaxUses: usesNum,
        couponUrgencyText: urgency
      });
      setCouponCode(codeUpper);
      setIsAddingNewCoupon(null);
      setNewCouponCode('');
      setNewCouponDiscount('20');
      setNewCouponEndDate('');
    } catch (err: any) {
      alert('Failed to register coupon: ' + err.message);
    } finally {
      setIsSavingNewCoupon(false);
    }
  };

  const handleComputeDeal = async () => {
    const orig = parseFloat(calcOriginalPrice) || 0;
    const target = parseFloat(calcTargetPrice) || 0;
    if (orig <= 0 || target <= 0 || target >= orig) {
      alert('Deal target price must be lower than original price!');
      return;
    }
    const percent = Math.round(((orig - target) / orig) * 100);
    const suggestedCode = `DEAL${percent}OFF`;

    const d = new Date();
    d.setDate(d.getDate() + 14);
    const defaultEndDate = d.toISOString().split('T')[0];

    if (window.confirm(`Computed Discount: ${percent}% OFF\nSuggested Token: ${suggestedCode}\nValid for: 14 days (1 use limit)\n\nRegister this coupon into database and link it to this deal?`)) {
      try {
        const payload = {
          code: suggestedCode,
          discount_type: 'percentage',
          discount_value: percent,
          max_uses: 1,
          start_date: new Date().toISOString().split('T')[0],
          end_date: defaultEndDate,
          is_active: true
        };
        const { error } = await supabase.from('coupons').insert([payload]);
        if (error) throw error;

        const { data: updatedCoupons } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
        if (updatedCoupons) setDbCoupons(updatedCoupons);

        setCouponCode(suggestedCode);
        setSubject(prev => prev.replace(/\[DISCOUNT\]/g, `${percent}`).replace(/\[COUPON_CODE\]/g, suggestedCode));
        setHeadline(prev => prev.replace(/\[DISCOUNT\]/g, `${percent}`));
        setBodyText(prev => prev.replace(/\[DISCOUNT\]/g, `${percent}`));

        // Update or add coupon block
        const existingCouponBlock = blocks.find(b => b.type === 'coupon');
        if (existingCouponBlock) {
          updateBlock(existingCouponBlock.id, {
            couponCode: suggestedCode,
            couponDiscount: percent,
            couponEndDate: defaultEndDate,
            couponMaxUses: 1,
            couponUrgencyText: computeUrgencyText(payload)
          });
        } else {
          setBlocks(prev => [...prev, {
            id: `blk_deal_${Date.now()}`,
            type: 'coupon',
            couponCode: suggestedCode,
            couponDiscount: percent,
            couponEndDate: defaultEndDate,
            couponMaxUses: 1,
            couponUrgencyText: computeUrgencyText(payload)
          }]);
        }
        alert(`Privilege Token "${suggestedCode}" registered and applied!`);
      } catch (err: any) {
        alert('Error saving coupon: ' + err.message);
      }
    }
  };

  const handleSelectBuyer = (buyer: any) => {
    setSelectedBuyerEmail(buyer.email);
    const name = buyer.name || 'Client';
    setSelectedBuyerName(name);
    setBuyerSearchQuery(`${buyer.email} (${name})`);
    setShowBuyerSuggestions(false);

    setSubject(prev => prev.replace(/\[BUYER_NAME\]/g, name));
    setHeadline(prev => prev.replace(/\[BUYER_NAME\]/g, name));
    setBodyText(prev => prev.replace(/\[BUYER_NAME\]/g, name));
  };

  const handleSelectEvent = (eventName: string) => {
    setSelectedEventName(eventName);
    const disc = promoDiscountPercent || '30';
    setSubject(`[${eventName}] Celebration: Up to ${disc}% Off Site-Wide`);
    setHeadline(`${eventName.toUpperCase()} SPECIAL SALE`);
    setSubtitle('Store-Wide Price Reduction Across All Fonts');
    setBodyText(`To celebrate ${eventName}, we are offering a limited-time site-wide holiday promotion. All font licenses and family bundles are automatically discounted at checkout — no coupon code required.\n\nElevate your visual identity projects with our latest typographic specimens.`);
    setButtonText(`EXPLORE ${eventName.toUpperCase()} DEALS`);
  };

  const filteredBuyers = buyersList.filter(b => {
    const q = buyerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (b.email || '').toLowerCase().includes(q) ||
      (b.name || '').toLowerCase().includes(q) ||
      (b.transaction_id || '').toLowerCase().includes(q)
    );
  });

  const updateBlock = (id: string, updates: Partial<BroadcastBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);
    setBlocks(updated);
  };

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
    fetchCouponsAndBuyers();

    const handleClickOutside = (e: MouseEvent) => {
      if (buyerSearchRef.current && !buyerSearchRef.current.contains(e.target as Node)) {
        setShowBuyerSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCouponsAndBuyers = async () => {
    try {
      const { data: cData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (cData) setDbCoupons(cData);

      const { data: buyers } = await supabase.from('fontbuyer').select('id, email, full_name');
      const { data: history } = await supabase.from('font_history').select('user_id, transaction_id, created_at').order('created_at', { ascending: false });
      if (buyers) {
        const buyerMap: Record<string, { email: string; name: string }> = {};
        buyers.forEach(b => {
          buyerMap[b.id] = { email: b.email || '', name: b.full_name || 'Customer' };
        });
        const combined: any[] = [];
        const seen = new Set<string>();
        (history || []).forEach(h => {
          const b = buyerMap[h.user_id];
          if (b && b.email && !seen.has(`${b.email}-${h.transaction_id}`)) {
            seen.add(`${b.email}-${h.transaction_id}`);
            combined.push({ email: b.email, name: b.name, transaction_id: h.transaction_id || 'N/A' });
          }
        });
        buyers.forEach(b => {
          if (b.email && !combined.some(c => c.email.toLowerCase() === b.email.toLowerCase())) {
            combined.push({ email: b.email, name: b.full_name || 'Customer', transaction_id: 'REGISTERED_BUYER' });
          }
        });
        setBuyersList(combined);
      }
    } catch (e) {
      console.warn('Failed fetching coupons or buyers:', e);
    }
  };

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
    const isCouponPreset = presetId === 'new_coupon';
    const isPromoPreset = presetId === 'new_promotion';

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
    } else if (isCouponPreset) {
      const bName = selectedBuyerName || 'Client';
      subj = subj.replace(/\[BUYER_NAME\]/g, bName).replace(/\[DISCOUNT\]/g, '25');
      head = head.replace(/\[BUYER_NAME\]/g, bName).replace(/\[DISCOUNT\]/g, '25');
      body = body.replace(/\[BUYER_NAME\]/g, bName).replace(/\[DISCOUNT\]/g, '25');
      setCampaignTitle(`Private Deal - ${bName}`);
      setTargetMode('single');

      // Auto ensure a coupon block exists in blocks
      if (!blocks.some(b => b.type === 'coupon')) {
        const topCoupon = dbCoupons[0];
        const newBlk: BroadcastBlock = {
          id: `blk_coupon_${Date.now()}`,
          type: 'coupon',
          couponCode: topCoupon ? topCoupon.code : 'VIP25OFF',
          couponDiscount: topCoupon ? topCoupon.discount_value : 25,
          couponEndDate: topCoupon ? topCoupon.end_date : undefined,
          couponMaxUses: topCoupon ? topCoupon.max_uses : 1,
          couponUrgencyText: topCoupon ? computeUrgencyText(topCoupon) : '⏳ Limited Time Exclusive • 1 Use Only'
        };
        setBlocks(prev => [...prev, newBlk]);
        setCouponCode(newBlk.couponCode || 'VIP25OFF');
      }
    } else if (isPromoPreset) {
      const evt = selectedEventName || 'Eid Mubarak';
      const disc = promoDiscountPercent || '30';
      subj = subj.replace(/\[EVENT_NAME\]/g, evt).replace(/\[DISCOUNT\]/g, disc);
      head = head.replace(/\[EVENT_NAME\]/g, evt).replace(/\[DISCOUNT\]/g, disc);
      subt = subt.replace(/\[EVENT_NAME\]/g, evt);
      body = body.replace(/\[EVENT_NAME\]/g, evt);
      setCampaignTitle(`Event Sale - ${evt}`);
      setButtonText(`EXPLORE ${evt.toUpperCase()} DEALS`);
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
    const isSingleMode = selectedPreset === 'new_coupon' && targetMode === 'single';
    if (isSingleMode) {
      if (!selectedBuyerEmail || !selectedBuyerEmail.includes('@')) {
        alert("Please select or enter a valid recipient email address for this private coupon deal.");
        return;
      }
    }

    const targetCount = isSingleMode ? 1 : getTargetAudienceCount();
    if (targetCount === 0) {
      alert("No recipients found in selected audience.");
      return;
    }

    if (data.gas.allowedToday <= 0) {
      alert("Daily quota limit reached (15 emails reserved for real-time customer orders). Please continue tomorrow.");
      return;
    }

    const campId = existingCampaignId || `camp_${Date.now()}`;
    const willSendCount = isSingleMode ? 1 : Math.min(targetCount, data.gas.allowedToday);
    const confirmMsg = isSingleMode
      ? `Dispatch Private Deal Voucher to:\n${selectedBuyerName || 'Client'} <${selectedBuyerEmail}>\n\nProceed with dispatch?`
      : `Launch Broadcast Batch?\n\n- Sending Today: ${willSendCount} emails\n- Safety Reserve: 15 emails protected for incoming customer orders\n- Audience: ${audience.toUpperCase()}\n- Accounts: Balanced across all active GAS senders\n\nProceed with dispatch?`;

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
          audience: isSingleMode ? 'single' : audience,
          recipientEmail: isSingleMode ? selectedBuyerEmail : undefined,
          recipientName: isSingleMode ? selectedBuyerName : undefined,
          subject,
          preset: selectedPreset,
          templateData: {
            title: headline,
            subtitle,
            bodyText,
            bannerUrl,
            buttonText,
            buttonUrl,
            couponCode,
            blocks
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
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* 1. AUDIENCE SELECTOR CARD */}
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

          {/* 2. PRESET SELECTOR */}
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

          {/* 3. TYPEFACE SELECTOR (FOR RELEASE & UPDATE PRESETS) */}
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

          {/* 3B. DIRECT BUYER & DEAL NEGOTIATOR (FOR NEW_COUPON PRESET) */}
          {selectedPreset === 'new_coupon' && (
            <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-orange-50/50 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <Calculator size={16} className="text-[#ff5c00]" />
                  <span className="text-xs uppercase tracking-widest font-black">
                    Direct Buyer &amp; Deal Negotiator
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-500">Single Client or Broadcast Deal</span>
              </div>

              {/* TARGET MODE SELECTOR */}
              <div className="flex flex-wrap gap-4 text-xs font-black uppercase">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="couponTargetMode"
                    checked={targetMode === 'single'}
                    onChange={() => setTargetMode('single')}
                    className="cursor-pointer"
                  />
                  <span>Single Buyer / Prospective Client (Direct 1-on-1)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="couponTargetMode"
                    checked={targetMode === 'audience'}
                    onChange={() => setTargetMode('audience')}
                    className="cursor-pointer"
                  />
                  <span>Audience Broadcast (All / Buyers / Subscribers)</span>
                </label>
              </div>

              {targetMode === 'single' && (
                <div className="space-y-3 pt-1">
                  <div className="relative" ref={buyerSearchRef}>
                    <label className="text-[10px] font-black uppercase tracking-wider block mb-1">
                      Search Existing Buyer or Enter Candidate Email
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={buyerSearchQuery}
                          onChange={(e) => {
                            setBuyerSearchQuery(e.target.value);
                            setSelectedBuyerEmail(e.target.value);
                            setShowBuyerSuggestions(true);
                          }}
                          onFocus={() => setShowBuyerSuggestions(true)}
                          placeholder="Type customer email, name, or transaction ID..."
                          className="w-full border-2 border-black p-2.5 text-xs bg-white outline-none font-bold"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      </div>
                      <input
                        type="text"
                        value={selectedBuyerName}
                        onChange={(e) => {
                          setSelectedBuyerName(e.target.value);
                          setSubject(prev => prev.replace(/\[BUYER_NAME\]/g, e.target.value));
                          setHeadline(prev => prev.replace(/\[BUYER_NAME\]/g, e.target.value));
                          setBodyText(prev => prev.replace(/\[BUYER_NAME\]/g, e.target.value));
                        }}
                        placeholder="Recipient Name (e.g. Alex Studio)"
                        className="w-full sm:w-56 border-2 border-black p-2.5 text-xs bg-white outline-none font-bold"
                      />
                    </div>

                    {/* AUTOCOMPLETE SUGGESTIONS */}
                    {showBuyerSuggestions && filteredBuyers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto border-2 border-black bg-white shadow-xl divide-y divide-black/10">
                        {filteredBuyers.slice(0, 10).map((b, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectBuyer(b)}
                            className="p-2.5 hover:bg-black/5 cursor-pointer text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-black text-black">{b.email}</span>
                              <span className="text-[10px] text-gray-500 ml-2 font-mono">({b.name})</span>
                            </div>
                            <span className="text-[9px] font-mono text-[#ff5c00] font-black uppercase bg-orange-100 px-2 py-0.5 border border-[#ff5c00]/30">
                              {b.transaction_id}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BARGAIN / PRICE REQUEST CALCULATOR */}
              <div className="border-2 border-black/40 bg-white p-4 space-y-3 mt-2 shadow-[2px_2px_0px_#000000]">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-black border-b-2 border-black/10 pb-1">
                  <span className="flex items-center gap-1.5"><Calculator size={14} className="text-[#ff5c00]" /> Price Request / Deal Calculator</span>
                  <span className="text-[9px] text-[#ff5c00] font-mono font-bold">Negotiate &amp; Generate Token</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase block mb-1">Original Catalog Price ($)</label>
                    <input
                      type="number"
                      value={calcOriginalPrice}
                      onChange={(e) => setCalcOriginalPrice(e.target.value)}
                      placeholder="350"
                      className="w-full border-2 border-black p-2 text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase block mb-1">Agreed Deal Target ($)</label>
                    <input
                      type="number"
                      value={calcTargetPrice}
                      onChange={(e) => setCalcTargetPrice(e.target.value)}
                      placeholder="270"
                      className="w-full border-2 border-black p-2 text-xs font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-1">
                  <div className="text-xs font-mono font-bold">
                    {parseFloat(calcOriginalPrice) > 0 && parseFloat(calcTargetPrice) > 0 && parseFloat(calcTargetPrice) < parseFloat(calcOriginalPrice) && (
                      <span className="text-emerald-700 font-black">
                        Calculated Deal: {Math.round(((parseFloat(calcOriginalPrice) - parseFloat(calcTargetPrice)) / parseFloat(calcOriginalPrice)) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleComputeDeal}
                    className="px-4 py-2 bg-black text-white text-[10px] uppercase font-black tracking-wider hover:bg-[#ff5c00] hover:text-black border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0px_#000000]"
                  >
                    Compute &amp; Apply Coupon
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3C. SEASONAL EVENT SELECTOR (FOR NEW_PROMOTION PRESET) */}
          {selectedPreset === 'new_promotion' && (
            <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-orange-50/50 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#ff5c00]" />
                  <span className="text-xs uppercase tracking-widest font-black">
                    Seasonal Event Selector (Site-Wide Discount)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-500">Direct Sale (No Token Required)</span>
              </div>

              {/* QUICK EVENT CHIPS */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider block text-black/70">
                  Select Event Celebration:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Eid Mubarak', 'Christmas & New Year', 'Halloween', 'Black Friday & Cyber Monday', 'Summer Sale', 'Studio Anniversary'].map((evt) => (
                    <button
                      key={evt}
                      type="button"
                      onClick={() => handleSelectEvent(evt)}
                      className={`px-3 py-1.5 text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                        selectedEventName === evt
                          ? 'bg-[#ff5c00] text-black border-black shadow-[2px_2px_0px_#000000]'
                          : 'bg-white text-black border-black/40 hover:border-black'
                      }`}
                    >
                      {evt}
                    </button>
                  ))}
                </div>
              </div>

              {/* PROMO DISCOUNT PERCENTAGE */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider block mb-1">
                    Store-Wide Discount (%)
                  </label>
                  <input
                    type="number"
                    value={promoDiscountPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPromoDiscountPercent(val);
                      if (selectedEventName) {
                        setSubject(`[${selectedEventName}] Celebration: Up to ${val}% Off Site-Wide`);
                      }
                    }}
                    placeholder="30"
                    className="w-36 border-2 border-black p-2 text-xs font-black outline-none bg-white"
                  />
                </div>
                <div className="text-[11px] text-gray-600 font-bold self-end sm:pb-2">
                  Applied to email subject line, headlines, and call to action automatically.
                </div>
              </div>
            </div>
          )}

          {/* 4. EMAIL PREVIEW (PLACED PROMINENTLY UNDER PRESET & TYPEFACE SELECTOR) */}
          <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-white space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest font-black border-b-2 border-black pb-2">
              <span className="flex items-center gap-2">
                <Eye size={15} /> Subqi Email Preview
              </span>
              <span className="text-[10px] font-normal opacity-60">Recipient Live View</span>
            </div>

            {/* PREVIEW CONTAINER (FULL WIDTH WITH REALISTIC READING WIDTH) */}
            <div className="max-w-2xl mx-auto border-2 border-black shadow-[6px_6px_0px_#000000] bg-white p-6 sm:p-8 text-black">
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

              {/* Default Coupon Box (only if no modular coupon block is added) */}
              {!blocks.some(b => b.type === 'coupon') && couponCode && (
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

              {/* Additional Modular Blocks Preview */}
              {blocks.map((block, idx) => {
                if (block.type === 'coupon') {
                  const cCode = block.couponCode || couponCode || '';
                  const cDiscount = block.couponDiscount ? `${block.couponDiscount}% OFF` : '';
                  const cUrgency = block.couponUrgencyText || '';
                  if (!cCode) return null;
                  return (
                    <div key={block.id || idx} className="border-2 border-black bg-orange-50 p-5 text-center my-6 shadow-[4px_4px_0px_#000000]">
                      <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#ff5c00] mb-1">
                        EXCLUSIVE CLIENT PRIVILEGE VOUCHER
                      </div>
                      {cDiscount && (
                        <div className="font-sans font-black text-2xl text-black my-1">
                          {cDiscount}
                        </div>
                      )}
                      <div className="font-mono text-xl font-black text-black bg-white inline-block px-4 py-1.5 border-2 border-black tracking-widest my-1 shadow-[2px_2px_0px_#000000]">
                        {cCode}
                      </div>
                      <div className="text-[10px] font-bold text-black/70 mt-1.5 uppercase">
                        Apply this voucher at checkout to claim your privileged rate.
                      </div>
                      {cUrgency && (
                        <div className="mt-2 text-[9px] font-black text-black bg-[#ff5c00] inline-block px-2.5 py-1 border border-black uppercase tracking-wider">
                          {cUrgency}
                        </div>
                      )}
                    </div>
                  );
                }
                if (block.type === 'heading') {
                  return (
                    <div key={block.id || idx} className="text-center my-6 pt-5 border-t border-black/20">
                      <h3 className="font-sans font-black text-base uppercase tracking-tight leading-tight">
                        {block.title || 'SECTION HEADING'}
                      </h3>
                      {block.subtitle && (
                        <p className="text-[11px] font-bold text-[#ff5c00] uppercase tracking-wider mt-1">
                          {block.subtitle}
                        </p>
                      )}
                    </div>
                  );
                }
                if (block.type === 'text') {
                  return (
                    <div key={block.id || idx} className="text-xs leading-relaxed text-black/80 whitespace-pre-line my-4 font-sans">
                      {block.text || 'Message paragraph...'}
                    </div>
                  );
                }
                if (block.type === 'button') {
                  return (
                    <div key={block.id || idx} className="text-center my-5">
                      <span className="inline-block bg-black text-white text-[11px] font-black uppercase tracking-[0.1em] px-5 py-2.5 border-2 border-black shadow-[3px_3px_0px_#ff5c00]">
                        {block.buttonText || 'BUTTON'} &rarr;
                      </span>
                    </div>
                  );
                }
                if (block.type === 'image') {
                  return block.imageUrl ? (
                    <div key={block.id || idx} className="my-5 text-center">
                      <div className="border-2 border-black overflow-hidden inline-block w-full">
                        <img src={block.imageUrl} alt={block.imageCaption || 'Studio image'} className="w-full h-auto object-cover" />
                      </div>
                      {block.imageCaption && (
                        <div className="text-[10px] font-mono text-black/60 uppercase tracking-wider mt-1 font-bold">
                          {block.imageCaption}
                        </div>
                      )}
                    </div>
                  ) : null;
                }
                return null;
              })}

              {/* Footer */}
              <div className="text-center pt-4 border-t-2 border-black text-[10px] text-black/60 leading-relaxed font-bold">
                <div className="text-black uppercase tracking-wider mb-0.5">
                  Subqi Type Studio
                </div>
                <div>You are receiving this communication as a registered buyer or subscriber.</div>
              </div>
            </div>
          </div>

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
            </div>

            {/* EMAIL BUILDER: MODULAR ADDITIONAL CONTENT SECTIONS */}
            <div className="border-2 border-black shadow-[4px_4px_0px_#000000] p-5 bg-white space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-black gap-2">
                <div>
                  <label className="uppercase tracking-widest font-black text-xs flex items-center gap-2">
                    <Layers size={14} className="text-[#ff5c00]" /> Additional Sections (Email Builder)
                  </label>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                    Add extra announcements, messages, coupons, secondary CTAs, or imagery to this broadcast
                  </p>
                </div>
                <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 uppercase">
                  {blocks.length} {blocks.length === 1 ? 'Section' : 'Sections'}
                </span>
              </div>

              {/* ACTION TOOLBAR: ADD BUTTONS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="p-2 border-2 border-black bg-zinc-100 hover:bg-[#ff5c00] hover:text-white font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000000]"
                >
                  <Type size={13} /> + Heading
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('text')}
                  className="p-2 border-2 border-black bg-zinc-100 hover:bg-[#ff5c00] hover:text-white font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000000]"
                >
                  <AlignLeft size={13} /> + Message
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('coupon')}
                  className="p-2 border-2 border-black bg-zinc-100 hover:bg-[#ff5c00] hover:text-white font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000000]"
                >
                  <Tag size={13} /> + Coupon
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('button')}
                  className="p-2 border-2 border-black bg-zinc-100 hover:bg-[#ff5c00] hover:text-white font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000000]"
                >
                  <ExternalLink size={13} /> + CTA Button
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="p-2 border-2 border-black bg-zinc-100 hover:bg-[#ff5c00] hover:text-white font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000000]"
                >
                  <ImageIcon size={13} /> + Image
                </button>
              </div>

              {/* LIST OF BLOCKS */}
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 p-6 text-center text-gray-400 font-bold">
                  No additional sections added yet. Use the buttons above to append extra headings, announcements, buttons, or images.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {blocks.map((block, idx) => (
                    <div key={block.id} className="border-2 border-black p-4 bg-zinc-50 shadow-[3px_3px_0px_#000000] space-y-3">
                      {/* Block Header */}
                      <div className="flex items-center justify-between border-b border-black/20 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-black uppercase tracking-wider text-[11px] text-black">
                            {block.type === 'heading' && 'Section Heading'}
                            {block.type === 'text' && 'Text Message'}
                            {block.type === 'button' && 'CTA Button'}
                            {block.type === 'image' && 'Image Banner'}
                            {block.type === 'coupon' && 'Voucher / Coupon Offer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 'up')}
                            disabled={idx === 0}
                            title="Move Up"
                            className="p-1 border border-black bg-white hover:bg-black hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 'down')}
                            disabled={idx === blocks.length - 1}
                            title="Move Down"
                            className="p-1 border border-black bg-white hover:bg-black hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            title="Delete Section"
                            className="p-1 border border-black bg-white text-red-600 hover:bg-red-600 hover:text-white cursor-pointer ml-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Block Form Fields */}
                      {block.type === 'heading' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-black tracking-wider block mb-1">Heading Title</label>
                            <input
                              type="text"
                              value={block.title || ''}
                              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                              placeholder="e.g. SPECIAL ANNOUNCEMENT"
                              className="w-full border-2 border-black p-2 bg-white outline-none font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-black tracking-wider block mb-1">Sub-heading (Optional)</label>
                            <input
                              type="text"
                              value={block.subtitle || ''}
                              onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                              placeholder="e.g. Limited Edition Offering"
                              className="w-full border-2 border-black p-2 bg-white outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'text' && (
                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider block mb-1">Message Text</label>
                          <textarea
                            rows={4}
                            value={block.text || ''}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            placeholder="Type additional announcement or details here..."
                            className="w-full border-2 border-black p-2 bg-white outline-none font-sans text-xs leading-relaxed"
                          />
                        </div>
                      )}

                      {block.type === 'button' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-black tracking-wider block mb-1">Button Label</label>
                            <input
                              type="text"
                              value={block.buttonText || ''}
                              onChange={(e) => updateBlock(block.id, { buttonText: e.target.value })}
                              placeholder="e.g. READ DOCUMENTATION"
                              className="w-full border-2 border-black p-2 bg-white outline-none font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-black tracking-wider block mb-1">Target Link URL</label>
                            <input
                              type="url"
                              value={block.buttonUrl || ''}
                              onChange={(e) => updateBlock(block.id, { buttonUrl: e.target.value })}
                              placeholder="https://..."
                              className="w-full border-2 border-black p-2 bg-white outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'image' && (
                        <div className="space-y-3">
                          {block.imageUrl ? (
                            <div className="flex items-center gap-3 bg-white p-2 border-2 border-black">
                              <img src={block.imageUrl} alt="Block Preview" className="w-20 h-14 object-cover border border-black" />
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
                                  <Check size={12} /> Image Ready
                                </div>
                                <div className="text-[9px] font-mono text-gray-500 truncate" title={block.imageUrl}>
                                  {block.imageUrl}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateBlock(block.id, { imageUrl: '' })}
                                className="px-2 py-1 bg-red-100 text-red-700 border border-red-400 text-[9px] font-black uppercase hover:bg-red-200 cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="flex-1 border-2 border-dashed border-black/40 hover:border-black p-3 bg-white text-center cursor-pointer transition-all">
                                  <span className="text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                                    <Upload size={13} /> Click to Upload Image
                                  </span>
                                  <span className="text-[9px] text-gray-400 block mt-0.5 font-bold">PNG, JPG, WEBP, SVG</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        if (!session) throw new Error('Session expired.');
                                        const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
                                        const res = await fetch(`/api/admin/upload/${uniqueFileName}`, {
                                          method: 'PUT',
                                          headers: {
                                            'Authorization': `Bearer ${session.access_token}`,
                                            'Content-Type': file.type
                                          },
                                          body: file
                                        });
                                        if (!res.ok) throw new Error('Upload failed');
                                        const publicUrl = `${window.location.origin}/api/images/${uniqueFileName}`;
                                        updateBlock(block.id, { imageUrl: publicUrl });
                                      } catch (err: any) {
                                        alert('Upload error: ' + err.message);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-black tracking-wider block mb-1">Or Paste Direct / Google Drive URL</label>
                                <input
                                  type="url"
                                  value={block.imageUrl || ''}
                                  onChange={(e) => updateBlock(block.id, { imageUrl: convertDriveUrl(e.target.value) })}
                                  placeholder="https://drive.google.com/file/d/... or https://..."
                                  className="w-full border-2 border-black p-2 bg-white outline-none text-xs"
                                />
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="text-[10px] uppercase font-black tracking-wider block mb-1">Image Caption / Alt Text (Optional)</label>
                            <input
                              type="text"
                              value={block.imageCaption || ''}
                              onChange={(e) => updateBlock(block.id, { imageCaption: e.target.value })}
                              placeholder="e.g. Type specimen comparison"
                              className="w-full border-2 border-black p-2 bg-white outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'coupon' && (
                        <div className="space-y-3 bg-white p-3 border-2 border-black shadow-[2px_2px_0px_#000000]">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-[11px] uppercase font-black tracking-wider flex items-center gap-1.5 text-black">
                              <Tag size={13} className="text-[#ff5c00]" /> Select Active Coupon from Database
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsAddingNewCoupon(isAddingNewCoupon === block.id ? null : block.id)}
                              className="text-[10px] font-black uppercase tracking-wider text-[#ff5c00] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} /> {isAddingNewCoupon === block.id ? 'Cancel New Coupon' : 'Create New Coupon'}
                            </button>
                          </div>

                          {/* SELECT FROM DB COUPONS */}
                          <div>
                            <select
                              value={block.couponCode || ''}
                              onChange={(e) => {
                                const selCode = e.target.value;
                                const found = dbCoupons.find(c => c.code === selCode);
                                if (found) {
                                  const urgency = computeUrgencyText(found);
                                  updateBlock(block.id, {
                                    couponCode: found.code,
                                    couponDiscount: found.discount_value,
                                    couponEndDate: found.end_date,
                                    couponMaxUses: found.max_uses,
                                    couponUrgencyText: urgency
                                  });
                                  setCouponCode(found.code);
                                } else {
                                  updateBlock(block.id, { couponCode: selCode });
                                  setCouponCode(selCode);
                                }
                              }}
                              className="w-full border-2 border-black p-2 bg-white outline-none font-bold text-xs"
                            >
                              <option value="">-- Choose Coupon from Database ({dbCoupons.length} Active) --</option>
                              {dbCoupons.map(c => (
                                <option key={c.id} value={c.code}>
                                  {c.code} — {c.discount_value}% OFF {c.end_date ? `(Valid until ${c.end_date})` : ''} {c.max_uses ? `[Limit: ${c.max_uses} uses]` : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* INLINE NEW COUPON CREATOR */}
                          {isAddingNewCoupon === block.id && (
                            <div className="border-2 border-black p-4 bg-orange-50/50 space-y-3 mt-3 shadow-[2px_2px_0px_#000000]">
                              <div className="text-[11px] font-black uppercase tracking-wider text-black border-b border-black/20 pb-1 flex items-center justify-between">
                                <span>Register New Coupon to Supabase</span>
                                <span className="text-[9px] text-[#ff5c00] font-bold">Auto-syncs with Promotions menu</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[9px] font-black uppercase block mb-1">Coupon Token</label>
                                  <input
                                    type="text"
                                    value={newCouponCode}
                                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. VIP25OFF"
                                    className="w-full border-2 border-black p-2 text-xs font-bold uppercase outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase block mb-1">Discount (%)</label>
                                  <input
                                    type="number"
                                    value={newCouponDiscount}
                                    onChange={(e) => setNewCouponDiscount(e.target.value)}
                                    placeholder="25"
                                    className="w-full border-2 border-black p-2 text-xs font-bold outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase block mb-1">Max Redemptions / Uses</label>
                                  <input
                                    type="number"
                                    value={newCouponMaxUses}
                                    onChange={(e) => setNewCouponMaxUses(e.target.value)}
                                    placeholder="1"
                                    className="w-full border-2 border-black p-2 text-xs font-bold outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase block mb-1">Expiry Date</label>
                                  <input
                                    type="date"
                                    value={newCouponEndDate}
                                    onChange={(e) => setNewCouponEndDate(e.target.value)}
                                    className="w-full border-2 border-black p-2 text-xs font-bold outline-none cursor-pointer"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleCreateDbCoupon(block.id)}
                                  disabled={isSavingNewCoupon}
                                  className="px-4 py-2 bg-black text-white text-[10px] uppercase font-black tracking-wider hover:bg-[#ff5c00] hover:text-black border-2 border-black transition-all cursor-pointer disabled:opacity-40"
                                >
                                  {isSavingNewCoupon ? 'Registering...' : 'Save & Link Coupon'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* DETECTED URGENCY TEXT */}
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider block mb-1 text-black/70">
                              Promotional Urgency Note (Auto-detected from expiry / usage limit)
                            </label>
                            <input
                              type="text"
                              value={block.couponUrgencyText || ''}
                              onChange={(e) => updateBlock(block.id, { couponUrgencyText: e.target.value })}
                              placeholder="e.g. ⏳ Limited Time: Valid until Oct 31 • ⚡ Strictly limited to 1 use"
                              className="w-full border-2 border-black p-2 bg-white outline-none text-xs font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                className="w-full md:w-auto px-8 py-3 bg-black text-white text-xs uppercase font-black tracking-widest hover:bg-[#ff5c00] hover:text-black border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
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
                          className="px-5 py-2.5 bg-black text-white text-xs uppercase font-black tracking-wider hover:bg-[#ff5c00] hover:text-black border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer self-start md:self-auto"
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
