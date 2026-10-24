import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TypeTester from '../components/TypeTester';
import { useCart } from '../context/CartContext';
import { getCachedFontByIdOrSlug, getCachedPromos, getFontSlug } from '../utils/fontCache';
import { ChevronLeft, ChevronDown } from 'lucide-react';

const resolvePreviewUrl = (filename: string) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `/api/images/${filename}`; 
};

const FontDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const initialCachedFont = useMemo(() => getCachedFontByIdOrSlug(id || ''), [id]);
  const [font, setFont] = useState<any>(initialCachedFont);
  const navigate = useNavigate();
  const location = useLocation();
  const { openConfigurator } = useCart(); 
  const [promos, setPromos] = useState<any[]>(() => getCachedPromos());
  const [loading, setLoading] = useState(!initialCachedFont);
  const [isAdmin, setIsAdmin] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateCopied, setAffiliateCopied] = useState(false);

  useEffect(() => {
    if (initialCachedFont && !font) {
      setFont(initialCachedFont);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  // Canonical URL Enforcer: Automatically upgrade /font/[uuid] to SEO-friendly /font/[slug] in address bar
  useEffect(() => {
    if (font && font.name) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
      if (isUuid) {
        const slug = getFontSlug(font);
        if (slug) {
          navigate(`/font/${slug}${location.search}`, { replace: true });
        }
      }
    }
  }, [font, id, navigate, location.search]);

  const fetchData = async () => {
    if (!initialCachedFont && !font) {
      setLoading(true);
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
    let fontQuery = supabase.from('fonts').select('*');
    if (isUuid) {
      fontQuery = fontQuery.eq('id', id);
    } else {
      const cleanName = (id || '').replace(/-/g, ' ').trim();
      fontQuery = fontQuery.ilike('name', cleanName);
    }

    const [fontRes, promosRes, { data: { session } }] = await Promise.all([
      fontQuery.maybeSingle(),
      supabase.from('promotions').select('*').eq('is_active', true),
      supabase.auth.getSession()
    ]);
    
    if (fontRes.data) setFont(fontRes.data);
    if (promosRes.data) setPromos(promosRes.data);

    if (session?.user) {
      const [{ data: adminCheck }, { data: affData }] = await Promise.all([
        supabase.from('fontadmin').select('id').eq('id', session.user.id).maybeSingle(),
        supabase.from('affiliates').select('affiliate_code').eq('user_id', session.user.id).maybeSingle()
      ]);
      if (adminCheck) setIsAdmin(true);
      if (affData) setAffiliateCode(affData.affiliate_code);
    }

    setLoading(false);
  };

  const activePromo = useMemo(() => {
    if (!font) return null;
    const now = new Date();
    return promos.find(p => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      const fontIds = typeof p.font_ids === 'string' ? JSON.parse(p.font_ids) : (p.font_ids || []);
      return now >= start && now <= end && (p.type === 'global' || fontIds.includes(font.id));
    });
  }, [font, promos]);

  const calculateDaysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days <= 0 ? "Ends today" : `${days} day${days > 1 ? 's' : ''} left`;
  };

  const basePrice = font?.price || 25;
  const styleCount = Array.isArray(font?.font_files) ? font.font_files.length : 1;
  const discountPrice = activePromo ? (basePrice * (1 - (activePromo.discount_percent / 100))).toFixed(0) : basePrice;
  const tags = Array.isArray(font?.tags) ? font.tags : (typeof font?.tags === 'string' ? font.tags.split(',') : []);
  const fontPreviews = Array.isArray(font?.preview_images) ? font.preview_images : [];

  // Dynamic SEO Title & Schema.org Product Structured Data injection (Must execute before any early returns to obey React hook rules)
  useEffect(() => {
    if (!font?.name) return;

    const originalTitle = document.title;
    document.title = `${font.name} Font Family — Official Commercial Typeface | Subqi Studio`;

    const scriptId = 'subqi-font-product-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const currentUrl = window.location.href.split('?')[0];
    const primaryImage = fontPreviews.length > 0 ? resolvePreviewUrl(fontPreviews[0]) : null;
    const absoluteImage = primaryImage?.startsWith('http') 
      ? primaryImage 
      : (primaryImage ? `${window.location.origin}${primaryImage}` : undefined);

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `${font.name} Typeface`,
      "description": font.description || `${font.name} digital font family designed by Amir Subqi Setiaji.`,
      "image": absoluteImage,
      "brand": {
        "@type": "Brand",
        "name": "Subqi Studio"
      },
      "creator": {
        "@type": "Person",
        "name": "Amir Subqi Setiaji",
        "url": "https://subqi.com"
      },
      "offers": {
        "@type": "Offer",
        "price": discountPrice || basePrice,
        "priceCurrency": "USD",
        "priceValidUntil": "2027-12-31",
        "availability": "https://schema.org/InStock",
        "url": currentUrl,
        "seller": {
          "@type": "Organization",
          "name": "Subqi Studio Type Foundry",
          "url": "https://subqi.com"
        }
      },
      "category": "Digital Typography / Desktop & Web Font"
    };

    scriptTag.textContent = JSON.stringify(productSchema);

    return () => {
      document.title = originalTitle;
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [font, basePrice, discountPrice, fontPreviews]);

  if (loading) return <div className="p-20 text-center uppercase font-bold animate-pulse tracking-widest">Loading Font Details...</div>;
  if (!font) return <div className="p-20 text-center uppercase font-bold">Font not found.</div>;

  return (
    <div className="relative z-10 text-black font-sans selection:bg-black selection:text-white min-h-screen bg-transparent overflow-x-hidden">
      {/* BACKGROUND ORBS - Selaras dengan Home */}
      <div className="grain-orb-base orb-top-right" />
      <div className="grain-orb-base orb-bottom-left" />

      {/* 1. HEADER: CLEAN SECTION (No Images) */}
      <header className="relative w-full border-b border-black bg-transparent overflow-hidden">
        {/* HEADER ORB EFFECT (Atas Kanan) - Identik dengan Home */}
        <div className="absolute -top-20 -right-20 w-[600px] h-[400px] pointer-events-none z-0">
           <div 
              className="w-full h-full mix-blend-multiply blur-[60px]"
              style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.8) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(253, 186, 116, 0) 100%)' }}
           />
        </div>
        {/* FIXED: Mengubah breakpoint dari 'md' ke 'lg' agar header bertumpuk pada tablet portrait, selaras dengan TypeTester */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] relative z-10">
          {/* FIXED: Border bawah aktif di resolusi < 1024px (lg:border-b-0) dan border kanan aktif di >= 1024px (lg:border-r) */}
          <div className="p-6 md:p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-black bg-white/10 backdrop-blur-md text-left">
            <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.3em] block mb-4">Specimen Details</span>
            <h1 className="text-6xl md:text-9xl font-normal uppercase tracking-tighter leading-[0.8] break-words">
              {font.name}
            </h1>
            <span className="block text-sm md:text-base font-bold uppercase tracking-widest mt-4 text-black/50">
              {styleCount} STYLES AVAILABLE
              {activePromo && ` | ${activePromo.name} - ${activePromo.discount_percent}% OFF`}
            </span>
          </div>
          
          {/* FIXED: Alignment tombol menyesuaikan breakpoint (lg:justify-end) */}
          <div className="flex flex-col justify-center lg:justify-end p-6 md:p-8 items-end bg-white/10 backdrop-blur-md gap-3">
            {/* FIXED: Efek hover diubah menjadi outline mode (bg-white & text-black saat hover) */}
            <button 
              onClick={() => {
                const discountPercent = activePromo ? activePromo.discount_percent : 0;
                openConfigurator({ 
                  ...font, 
                  trialFileUrl: font.trial_file_url,
                  activeDiscount: discountPercent,
                  directCheckout: true 
                });
              }}
              className="w-full md:w-64 bg-black text-white px-8 py-5 text-xs font-bold uppercase tracking-widest border border-black hover:bg-[#FF5C00] hover:text-black transition-all flex items-center justify-center cursor-pointer shadow-xs"
            >
              BUY LICENSE
            </button>
            <button 
              onClick={() => {
                const discountPercent = activePromo ? activePromo.discount_percent : 0;
                openConfigurator({ 
                  ...font, 
                  trialFileUrl: font.trial_file_url,
                  activeDiscount: discountPercent,
                  initialOption: 'trial' // Mengaktifkan opsi trial/demo secara otomatis
                });
              }}
              className="w-full md:w-64 bg-white text-black border border-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
            >
              Free Trial
            </button>

            <button 
              onClick={() => navigate(-1)} 
              className="w-full md:w-64 bg-white text-black border border-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs"
            >
              <ChevronLeft size={16} /> Back to Collection
            </button>
          </div>
        </div>
      </header>

      {/* AFFILIATE BAR (Active Affiliate Session) - Diposisikan di bawah Header dan di atas TypeTester */}
      {Boolean(affiliateCode) && (
        <div className="w-full border-b border-black bg-white/90 backdrop-blur-md p-3 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono relative z-20">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-black/50 text-[10px]">AFFILIATE_SHARE:</span>
            <code className="font-bold text-[#FF5C00]">{`${window.location.origin}/c/${affiliateCode}/${font.id}`}</code>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/c/${affiliateCode}/${font.id}`);
              setAffiliateCopied(true);
              setTimeout(() => setAffiliateCopied(false), 2000);
            }}
            className="bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 hover:bg-[#FF5C00] hover:text-black transition-all cursor-pointer"
          >
            {affiliateCopied ? 'COPIED' : 'COPY LINK'}
          </button>
        </div>
      )}

      {/* 2. MAIN CONTENT GRID */}
      <main className="w-full">
        {/* FIXED: Mengubah grid menjadi 2 kolom (450px untuk info dan sisa untuk tester) */}
        <section className="relative border-b border-black grid grid-cols-1 lg:grid-cols-[450px_1fr] overflow-hidden">
          
          {/* CONTENT ORB EFFECT (Tengah Kiri) - Identik dengan posisi ganjil di Home */}
          <div className="absolute z-0 pointer-events-none overflow-visible hidden md:block" 
               style={{ 
                 width: '1000px', 
                 height: '600px',
                 top: '50%',
                 left: '22%', 
                 transform: 'translate(-50%, -50%)',
                 opacity: 0.8
               }}>
               <div className="w-full h-full mix-blend-multiply blur-[60px]" 
                    style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.8) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(253, 186, 116, 0) 100%)' }} />
          </div>

          {/* COLUMN A: INFO */}
          {/* FIXED: Menambahkan 'relative z-10' agar konten berada di atas orb */}
          <div className="relative z-10 p-6 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-black bg-transparent">
            <div>
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block border border-black rounded-full px-3 py-1 font-regular italic text-[11px] md:text-[14px] lowercase leading-none">starting at</span>
                  {activePromo && (
                    <span className="inline-block border border-orange-600 rounded-full px-3 py-1 font-bold text-[11px] md:text-[14px] uppercase text-red-600 leading-none">
                      {activePromo.discount_percent}% OFF
                    </span>
                  )}
                </div>
                
                {activePromo ? (
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-8xl md:text-9xl font-light tracking-tighter leading-[0.8]">
                      ${(basePrice * (1 - (activePromo.discount_percent / 100))).toFixed(0)}
                    </span>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="relative w-fit text-center">
                        <span className="text-3xl md:text-4xl font-bold text-red-600 leading-none">${basePrice}</span>
                        <div className="absolute top-[50%] left-[-5%] w-[110%] h-[2px] bg-orange-600"></div>
                      </div>
                      <span className="inline-block border border-orange-600 rounded-full px-2 md:px-3 py-1 font-bold text-[9px] md:text-[10px] uppercase text-red-600 whitespace-nowrap">
                        {calculateDaysLeft(activePromo.end_date)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-8xl md:text-9xl font-light tracking-tighter leading-[0.8]">${basePrice}</div>
                )}
              </div>
            </div>

            <div className="pb-10 lg:pb-0">
              <p className="text-gray-600 text-sm leading-relaxed normal-case italic">{font.description}</p>
            </div>
          </div>

          {/* COLUMN C: FULL TYPE TESTER */}
          <div className="relative z-10 flex items-stretch bg-transparent overflow-hidden">
            <TypeTester 
              config={{
                ...font,
                family: `"${font.name}"`,
                styleCount: styleCount,
                randomText: font.random_text || "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin."
              }} 
              isEven={true} // isEven true untuk menjaga konsistensi Align Left
            />
          </div>
        </section>

        {/* 3. SPACER: Muncul di semua ukuran layar (Mobile, Tablet, & Desktop) */}
        <div className="relative z-20 h-12 border-b border-black w-full bg-orange-500/10" />

        {/* 4. PREVIEW IMAGES GALLERY */}
        <section className="relative z-20 w-full grid grid-cols-1 lg:grid-cols-2 border-black border-t-0 bg-transparent">
          {fontPreviews.map((img: string, idx: number) => {
            const imageUrl = resolvePreviewUrl(img);
            if (!imageUrl) return null;
            return (
              <div key={idx} className="w-full border-b lg:even:border-l border-black overflow-hidden bg-transparent">
                <img 
                  src={imageUrl} 
                  alt={`${font.name} Preview ${idx + 1}`} 
                  className="w-full h-auto block object-cover"
                />
              </div>
            );
          })}
        </section>

        {/* 5. CRAWLABLE SPECIFICATIONS (Subqi Studio Brutalist Style) */}
        <section className="relative z-20 w-full border-b border-black bg-white p-6 md:p-10 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-black">
            <div>
              <div className="text-xs font-black tracking-widest uppercase mb-3 text-orange-600">DELIVERABLES</div>
              <ul className="text-xs space-y-1.5 opacity-80">
                <li>• OpenType (.OTF) Font Files</li>
                <li>• Official Commercial License Document (LICENSE.txt)</li>
                <li>• VIP Creator Account &amp; Access on canvas.subqi.com</li>
              </ul>
              <p className="mt-3 text-[11px] opacity-70 leading-relaxed">
                *License is included in your ZIP and also viewable online in your Buyer Dashboard.<br />
                Need TTF or Webfonts (.WOFF / .WOFF2)? Convert instantly for free with our official converter at{' '}
                <a 
                  href="https://fontshift.subqi.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline hover:text-orange-600 font-bold"
                >
                  fontshift.subqi.com
                </a>.
              </p>
            </div>
            <div>
              <div className="text-xs font-black tracking-widest uppercase mb-3 text-orange-600">OPENTYPE FEATURES</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['liga', 'calt', 'ss01-ss20', 'swsh', 'dlig', 'PUA'].map((item) => (
                  <span key={item} className="border border-black px-2 py-0.5 text-[10px] font-bold">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-[11px] opacity-70">
                Accessible via Adobe Creative Cloud, Affinity, Corel, Figma, and Font Book.
              </p>
            </div>
            <div>
              <div className="text-xs font-black tracking-widest uppercase mb-3 text-orange-600">DESIGN &amp; FOUNDRY</div>
              <p className="text-xs leading-relaxed opacity-80 mb-2">
                Designed &amp; developed by <strong>Amir Subqi Setiaji</strong> for <strong>Subqi Studio</strong>.
              </p>
              <p className="text-[11px] opacity-70">
                Extensive Latin language coverage (Western, Central &amp; South-Eastern Europe).
              </p>
            </div>
          </div>

          {/* Dedicated Full-Width Typographic Tags & Classification Row */}
          {tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-black/10">
              <div className="text-xs font-black tracking-widest uppercase mb-3 text-orange-600">
                TYPOGRAPHIC TAGS &amp; CLASSIFICATION
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span key={tag} className="border border-black px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-transparent hover:bg-black hover:text-white transition-colors">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default FontDetail;