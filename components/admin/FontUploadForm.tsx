import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Pastikan path ini benar sesuai folder lib kamu

// Definisi tipe untuk hasil API agar TypeScript tidak error
interface UploadResponse {
  success: boolean;
  fileName: string;
  url: string;
  error?: string;
}

// Menambahkan props initialData & onSuccess untuk fitur EDIT
const FontUploadForm = ({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) => {
  // 1. State untuk Form (Diambil dari initialData jika sedang mode EDIT)
  const [fontName, setFontName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || ''); 
  
  // Matriks Harga sesuai EULA 2026 (User Seats, Traffic Tiers, & Corporate)
  const [licensePrices, setLicensePrices] = useState(initialData?.license_prices || {
    desktop: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    logo_branding: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    social_web: { small_50k: 0, medium_500k: 0, large_5m: 0, enterprise_unlimited: 0 },
    app: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    broadcast: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    server: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    corporate_full_suite: 0
  });

  const [price, setPrice] = useState(initialData?.price?.toString() || ''); 
  // Preview sederhana (Tetap dipertahankan sesuai backup)
  const [prices, setPrices] = useState({ desktop: 0, web: 0, app: 0 }); 

  // Handler untuk update harga (Tetap dipertahankan sesuai backup)
  const updatePrice = (category: string, subKey: string | null, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLicensePrices((prev: any) => {
      if (category === 'corporate_full_suite') {
        return { ...prev, corporate_full_suite: numValue };
      }
      return {
        ...prev,
        [category]: { 
          ...(prev[category as keyof typeof prev] as object), 
          [subKey!]: numValue 
        }
      };
    });
  };

  const [fontFiles, setFontFiles] = useState<File[]>([]);
  const [trialFile, setTrialFile] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [existingFontFiles, setExistingFontFiles] = useState<string[]>(initialData?.font_files || []);
  const [existingPreviewImages, setExistingPreviewImages] = useState<string[]>(initialData?.preview_images || []);
  const [existingTrialFile, setExistingTrialFile] = useState<string>(initialData?.trial_file_url || '');
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFontName(initialData.name || '');
      setDescription(initialData.description || '');
      setPrice(initialData.price?.toString() || '');
      setLicensePrices(initialData.license_prices || licensePrices);
      setTags(initialData.tags?.join(', ') || '');
      setExistingFontFiles(initialData.font_files || []);
      setExistingPreviewImages(initialData.preview_images || []);
      setExistingTrialFile(initialData.trial_file_url || '');
    }
  }, [initialData]);

  const removeExistingFont = (index: number) => {
    setExistingFontFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPreview = (index: number) => {
    setExistingPreviewImages(prev => prev.filter((_, i) => i !== index));
  };
  // Helper untuk handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropFiles = (e: React.DragEvent, type: 'fonts' | 'previews') => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    
    if (type === 'fonts') {
      const filtered = files.filter(f => f.name.endsWith('.ttf') || f.name.endsWith('.otf') || f.name.endsWith('.woff2'));
      setFontFiles(prev => [...prev, ...filtered]);
    } else {
      if (previewImages.length + files.length > 12) return alert("Maksimal 12 gambar!");
      setPreviewImages(prev => [...prev, ...files]);
    }
  };

  // Fungsi upload helper ke R2 (Tetap dipertahankan sesuai backup)
  const uploadToR2 = async (files: File[]) => {
    const uploadedUrls = [];
    // Ambil token sesi admin untuk verifikasi
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Akses ditolak. Silakan login kembali.");

    for (const file of files) {
     try {
        // Tembak jalur Admin Upload dengan method PUT & Token
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/\s+/g, '_');
        const uniqueFileName = `${timestamp}-${cleanFileName}`;

        // 2. Tembak jalur Admin Upload dengan nama file unik
        const res = await fetch(`/api/admin/upload/${uniqueFileName}`, { 
          method: 'PUT', 
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': file.type
          },
          body: file 
        });

        if (!res.ok) {
          const errorData = (await res.json()) as { error?: string };
          throw new Error(errorData.error || `Server Error: ${res.status}`);
        }

        // 3. Tangkap fileName dari response Worker (Sinkron dengan index.js)
        const data = (await res.json()) as UploadResponse;
        if (data.success && data.fileName) {
          uploadedUrls.push(data.fileName);
        } else {
          throw new Error('Upload gagal tanpa alasan');
        }

      } catch (err: any) {
        console.error("Upload error detail:", err);
        throw new Error(`Gagal mengunggah ${file.name}: ${err.message}`);
      }
    }
    return uploadedUrls;
  };

  // 2. Handler Upload & Save (Disesuaikan untuk INSERT & UPDATE)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    // Jika mode baru, fontFiles wajib. Jika mode edit, boleh kosong (menggunakan file lama).
    if (!initialData && fontFiles.length === 0) return alert("Upload file font dulu!");
    if (!fontName || !price) return alert("Lengkapi data!");

    setIsUploading(true);
    try {
      const uploadedFontUrls = await uploadToR2(fontFiles);
      const uploadedPreviewUrls = await uploadToR2(previewImages);

      let uploadedTrialUrl = existingTrialFile;
      if (trialFile) {
        const trialResult = await uploadToR2([trialFile]);
        uploadedTrialUrl = trialResult[0];
      }

      const payload = {
        name: fontName,
        price: parseFloat(price),
        price_web: licensePrices.social_web.small_50k,
        price_app: licensePrices.app.solo,
        license_prices: licensePrices,
        description: description,
        tags: tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== ""),
        font_files: [...existingFontFiles, ...uploadedFontUrls],
        preview_images: [...existingPreviewImages, ...uploadedPreviewUrls],
        trial_file_url: uploadedTrialUrl,
        has_trial: uploadedTrialUrl !== ''
      };


      if (initialData?.id) {
        // Mode UPDATE
        const { error: dbError } = await supabase.from('fonts').update(payload).eq('id', initialData.id);
        if (dbError) throw dbError;
        alert("Font berhasil diupdate!");
      } else {
        // Mode INSERT
        const { error: dbError } = await supabase.from('fonts').insert([payload]);
        if (dbError) throw dbError;
        alert("Gokil! Font berhasil dipublikasikan.");
      }
      
      onSuccess?.();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSaveProduct}>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block font-bold text-xs uppercase tracking-wider text-gray-500">Font Name</label>
          <input 
            type="text" 
            value={fontName}
            onChange={(e) => setFontName(e.target.value)}
            className="w-full border border-black p-3 outline-none font-normal uppercase text-xl focus:bg-yellow-50 transition-colors" 
            placeholder="E.G. ROYAL GRANDE"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block font-bold text-xs uppercase tracking-wider text-gray-500">Basic Price ($)</label>
          <input 
            type="number" 
            required
            value={price}
            onChange={(e) => {
              const val = e.target.value;
              setPrice(val);
              const base = parseFloat(val) || 0;
              // FIXED: Logika kalkulasi dengan -1 untuk harga psikologis (misal $9.999)
              const calc = (m: number) => m > 1 ? Math.floor(base * m) - 1 : base;
              
              // SEAT TIERS MULTIPLIER (Tetap dipertahankan skalanya)
              const tiers = (m: number) => ({
                solo: calc(m),
                team: calc(m * 4),      // 4x Base
                studio: calc(m * 10),    // 10x Base
                enterprise: calc(m * 40) // 40x Base
              });

              setLicensePrices({
                desktop: tiers(1.0),
                // Skala baru agar Enterprise Server ($20 * 10 * 40 = $8.000) < Corporate ($10.000)
                social_web: {
                  small_50k: calc(2.0),
                  medium_500k: calc(2.0 * 4),
                  large_5m: calc(2.0 * 10),
                  enterprise_unlimited: calc(2.0 * 40)
                },
                logo_branding: tiers(4.0),
                app: tiers(6.0),
                broadcast: tiers(8.0),
                server: tiers(10.0),
                // FIXED: Multiplier 500x untuk mencapai target $10.000 dari base $20
                corporate_full_suite: calc(500.0)
              });
            }}
            className="w-full border border-black p-3 outline-none focus:bg-yellow-50" 
            placeholder="25" 
          />
        </div>
      </div>

      {/* PRICING PREVIEW & TAGS INPUT */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 border border-black text-[10px] space-y-1 leading-tight">
          <p className="font-bold uppercase border-b border-black mb-2 text-black tracking-widest">License Preview (Solo/Base)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-bold uppercase text-gray-600">
            <div className="flex items-center gap-1">
              <span>Desktop: $</span>
              <input 
                type="number" 
                value={licensePrices.desktop.solo} 
                onChange={(e) => updatePrice('desktop', 'solo', e.target.value)}
                className="bg-transparent border-none p-0 w-full font-bold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Social/Web: $</span>
              <input 
                type="number" 
                value={licensePrices.social_web.small_50k} 
                onChange={(e) => updatePrice('social_web', 'small_50k', e.target.value)}
                className="bg-transparent border-none p-0 w-full font-bold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Logo: $</span>
              <input 
                type="number" 
                value={licensePrices.logo_branding.solo} 
                onChange={(e) => updatePrice('logo_branding', 'solo', e.target.value)}
                className="bg-transparent border-none p-0 w-full font-bold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>App: $</span>
              <input 
                type="number" 
                value={licensePrices.app.solo} 
                onChange={(e) => updatePrice('app', 'solo', e.target.value)}
                className="bg-transparent border-none p-0 w-full font-bold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Broadcast: $</span>
              <input 
                type="number" 
                value={licensePrices.broadcast.solo} 
                onChange={(e) => updatePrice('broadcast', 'solo', e.target.value)}
                className="bg-transparent border-none p-0 w-full font-bold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Server: $</span>
              <input 
                type="number" 
                value={licensePrices.server.solo} 
                onChange={(e) => updatePrice('server', 'solo', e.target.value)}
                className="bg-transparent border-none p-0 w-full font-bold focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-1 pt-1 border-t border-black border-dotted flex items-center gap-1">
            <span>Corporate (All-in): $</span>
            <input 
              type="number" 
              value={licensePrices.corporate_full_suite} 
              onChange={(e) => updatePrice('corporate_full_suite', null, e.target.value)}
              className="bg-transparent border-none p-0 w-full font-bold focus:outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block font-bold text-xs uppercase tracking-wider text-gray-500">Tags (Separated by Comma)</label>
          <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-black p-3 outline-none focus:bg-yellow-50" 
            placeholder="Variable, Serif, Display" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-bold text-xs uppercase tracking-wider text-gray-500">Font Binaries (Multiples .ttf, .otf)</label>
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropFiles(e, 'fonts')}
          className="border-2 border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group"
        >
          <input 
            type="file" multiple accept=".ttf,.otf,.woff2" className="hidden" id="fontFiles" 
            onChange={(e) => setFontFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
          />
          <label htmlFor="fontFiles" className="cursor-pointer">
            <Plus className="mx-auto mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Drag & Drop or Click to Add Fonts</p>
          </label>

          {(existingFontFiles.length > 0 || fontFiles.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {existingFontFiles.map((f, i) => (
                <span key={`ex-f-${i}`} className="bg-gray-100 border border-black text-[9px] px-2 py-1 uppercase flex items-center gap-2">
                  {f} 
                  <button type="button" onClick={() => removeExistingFont(i)} className="text-red-500 font-bold hover:scale-125 transition-transform">×</button>
                </span>
              ))}
              {fontFiles.map((f, i) => (
                <span key={`new-f-${i}`} className="bg-black text-white text-[9px] px-2 py-1 uppercase">{f.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-bold text-xs uppercase tracking-wider text-gray-500">
          Trial / Demo Version (.zip / .ttf)
        </label>
        <div className="border-2 border-black p-4 bg-yellow-50/50 relative">
          <input 
            type="file" 
            accept=".zip,.ttf,.otf"
            onChange={(e) => setTrialFile(e.target.files?.[0] || null)}
            className="w-full text-[10px] font-mono cursor-pointer"
          />
          {(existingTrialFile || trialFile) && (
            <p className="text-[9px] mt-2 font-bold uppercase text-black">
              STATUS: {trialFile ? `NEW: ${trialFile.name}` : `EXISTING: ${existingTrialFile}`}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-bold text-xs uppercase tracking-wider text-gray-500">Preview Images (Max 12)</label>
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropFiles(e, 'previews')}
          className="grid grid-cols-4 md:grid-cols-6 gap-2 border-2 border-black p-4 bg-gray-100"
        >
          {existingPreviewImages.map((url, i) => (
            <div key={`ex-p-${i}`} className="aspect-square bg-white border border-black relative group overflow-hidden">
              {/* GUNAKAN /api/images/ agar mendukung format .webp & caching */}
              <img src={`/api/images/${url}`} className="w-full h-full object-cover" alt="preview" />
              <button 
                type="button"
                onClick={() => removeExistingPreview(i)}
                className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold"
              >
                DELETE
              </button>
            </div>
          ))}
          {previewImages.map((file, i) => (
            <div key={`new-p-${i}`} className="aspect-square bg-white border border-black relative group overflow-hidden">
              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
              <button 
                type="button"
                onClick={() => setPreviewImages(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold"
              >
                REMOVE
              </button>
            </div>
          ))}

          {previewImages.length + existingPreviewImages.length < 12 && (
            <label className="aspect-square border border-dashed border-black flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
              <input 
                type="file" multiple accept="image/*" className="hidden" 
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (previewImages.length + existingPreviewImages.length + files.length > 12) {
                    alert("Maksimal 12 gambar!");
                    return;
                  }
                  setPreviewImages(prev => [...prev, ...files]);
                }}
              />
              <Plus size={16} />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-bold text-xs uppercase tracking-wider text-gray-500">Description</label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-black p-4 outline-none h-32 font-normal text-sm focus:bg-yellow-50" 
          placeholder="Tell the story of this font..."
        />
      </div>

      <button 
        type="submit"
        disabled={isUploading}
        className="w-full bg-black text-white p-5 font-bold uppercase tracking-[0.2em] text-xs hover:translate-x-[2px] hover:translate-y-[2px] transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {isUploading ? (
          <><Loader2 className="animate-spin" /> Processing...</>
        ) : initialData ? "Update Typeface" : "Save & Publish Product"}
      </button>
    </form>
  );
};

export default FontUploadForm;