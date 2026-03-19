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
  const FONT_TAGS_LIBRARY = [
    // Dasar & Teknis
    "Sans Serif", "Serif", "Slab Serif", "Monospace", "Variable Font", "Display", "Text", "Stencil", "Blackletter", "Script", "Handwritten",
    // Sub-Klasifikasi Serif
    "Didone", "Old Style", "Transitional", "Modern Serif", "Glyphic", "Didot", "Garalde", "Humanist Serif",
    // Sub-Klasifikasi Sans
    "Geometric Sans", "Grotesque", "Neo-Grotesque", "Humanist Sans", "Grotesk",
    // Gaya & Era
    "Art Deco", "Art Nouveau", "Bauhaus", "Vintage", "Retro", "Victorian", "Mid-Century", "Y2K", "90s", "80s", "Cyberpunk", "Futuristic",
    // Vibe & Mood
    "Minimalist", "Brutalism", "Acid", "Experimental", "Liquid", "Distorted", "Elegant", "Luxury", "Classic", "Editorial", "Fashion", "Corporate",
    // Khusus & Dekoratif
    "Horror", "Gothic", "Old English", "Fraktur", "Calligraphy", "Signature", "Brush", "Marker", "Comic", "Pixel", "Gaming", "Sports", "Techno",
    // Karakteristik Fisik
    "Condensed", "Expanded", "Narrow", "Wide", "Outline", "Inline", "Shadow", "Soft Edges", "Rounded", "Sharp", "High Contrast", "Low Contrast"
  ].sort();
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || ''); 
  
  // Matriks Harga sesuai EULA 2026 (User Seats, Traffic Tiers, & Corporate)
  const [licensePrices, setLicensePrices] = useState(initialData?.license_prices || {
    desktop: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    logo_branding: { personal: 0, solo: 0, team: 0, studio: 0, enterprise: 0 },
    social_web: { small_50k: 0, medium_500k: 0, large_5m: 0, enterprise_unlimited: 0 },
    app: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    broadcast: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    server: { solo: 0, team: 0, studio: 0, enterprise: 0 },
    corporate_full_suite: 0
  })

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
  const [driveResults, setDriveResults] = useState<{images: any[], fonts: any[]} | null>(null);
  const [isSearchingDrive, setIsSearchingDrive] = useState(false);

  const fetchFromDrive = async () => {
    if (!fontName) return alert("Tulis nama font dulu!");
    setIsSearchingDrive(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/drive-search?q=${fontName}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = (await res.json()) as { images: any[]; fonts: any[] };
      setDriveResults(data);
    } catch (err) { alert("Drive Search Error"); }
    finally { setIsSearchingDrive(false); }
  };

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

  const removeExistingTrial = () => setExistingTrialFile('');

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
      if (previewImages.length + files.length > 20) return alert("Maksimal 20 gambar!");
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
          <button 
            type="button" 
            onClick={fetchFromDrive}
            disabled={isSearchingDrive}
            className="text-[9px] bg-blue-600 text-white px-3 py-1 font-bold uppercase hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSearchingDrive ? "Searching..." : "⚡ Sync Drive"}
          </button>
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
              // Fungsi pembulatan bawah untuk harga psikologis
              const calc = (m: number) => m > 0 ? (m === 1 ? base : Math.floor(base * m)) : 0;
              
              setLicensePrices({
                // Desktop: 1x, 3x, 7x, 15x
                desktop: { solo: calc(1), team: calc(3), studio: calc(7), enterprise: calc(15) },
                // Social / Web: 1x, 3x, 7x, 15x
                social_web: { small_50k: calc(1), medium_500k: calc(3), large_5m: calc(7), enterprise_unlimited: calc(15) },
                // Logo & Branding: 2.5x, 5x, 10x, 20x, 30x
                logo_branding: { personal: calc(2.5), solo: calc(5), team: calc(10), studio: calc(20), enterprise: calc(30) },
                // App / Game: 5x, 12x, 25x, 55x
                app: { solo: calc(5), team: calc(12), studio: calc(25), enterprise: calc(55) },
                // Server: 5x, 25x, 50x (Mapping: Single, 50, Unlimited)
                server: { solo: calc(5), team: 0, studio: calc(25), enterprise: calc(50) },
                // Broadcast: 5x, 25x, 50x (Mapping: Regional, National, Worldwide)
                broadcast: { solo: calc(5), team: 0, studio: calc(25), enterprise: calc(50) },
                // Corporate: All-In-One (150x)
                corporate_full_suite: calc(150.0)
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
            list="font-tags-suggestions"
            className="w-full border border-black p-3 outline-none focus:bg-yellow-50" 
            placeholder="Variable, Serif, Display" 
          />
          <datalist id="font-tags-suggestions">
            {FONT_TAGS_LIBRARY.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
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
                <span key={`new-f-${i}`} className="bg-black text-white text-[9px] px-2 py-1 uppercase flex items-center gap-2">
                  {f.name}
                  <button 
                    type="button" 
                    onClick={() => setFontFiles(prev => prev.filter((_, idx) => idx !== i))} 
                    className="text-red-400 font-bold hover:text-red-200 transition-colors"
                  >
                    ×
                  </button>
                </span>
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
            <div className="flex justify-between items-center mt-2">
              <p className="text-[9px] font-bold uppercase text-black">
                STATUS: {trialFile ? `NEW: ${trialFile.name}` : `EXISTING: ${existingTrialFile}`}
              </p>
              {/* Tombol hapus untuk file trial baru yang baru dipilih */}
              {trialFile && (
                <button 
                  type="button" 
                  onClick={() => setTrialFile(null)}
                  className="text-red-500 font-bold text-[10px] hover:underline"
                >
                  CANCEL NEW ×
                </button>
              )}
              {/* Tombol hapus trial file yang sudah ada di database */}
              {existingTrialFile && !trialFile && (
                <button 
                  type="button" 
                  onClick={() => setExistingTrialFile('')}
                  className="text-red-500 font-bold text-[10px] hover:underline"
                >
                  REMOVE EXISTING ×
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-bold text-xs uppercase tracking-wider text-gray-500">Preview Images (Max 20)</label>
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropFiles(e, 'previews')}
          className="grid grid-cols-4 md:grid-cols-6 gap-2 border-2 border-black p-4 bg-gray-100"
        >
          {/* Hasil dari Google Drive */}
          {Array.isArray(driveResults?.images) && driveResults.images.map((img, i) => (
            <div key={`dr-p-${i}`} className="aspect-square bg-blue-50 border border-blue-200 relative group overflow-hidden">
              <img src={img.url} className="w-full h-full object-cover" alt="drive" />
              <button
                type="button"
                onClick={() => setExistingPreviewImages(prev => [...prev, img.id])}
                className="absolute inset-0 bg-blue-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-[8px]"
              >
                USE DRIVE FILE
              </button>
              <div className="absolute top-0 left-0 bg-blue-600 text-white text-[7px] px-1">DRIVE</div>
            </div>
          ))}

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

          {previewImages.length + existingPreviewImages.length < 20 && (
            <label className="aspect-square border border-dashed border-black flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
              <input 
                type="file" multiple accept="image/*" className="hidden" 
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (previewImages.length + existingPreviewImages.length + files.length > 20) {
                    alert("Maksimal 20 gambar!");
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