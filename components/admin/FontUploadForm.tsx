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

const FontUploadForm = () => {
  // 1. State untuk Form
  const [fontName, setFontName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 2. Handler Upload & Save
  const handleSaveProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedFile || !fontName || !price) return alert("Lengkapi data!");

  setIsUploading(true);
  try {
    // 1. KIRIM FILE KE R2
    const formData = new FormData();
    formData.append('file', selectedFile);

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    // Memberikan Type Assertion agar TypeScript mengenali properti .success dan .fileName
    const uploadResult = (await uploadRes.json()) as { success: boolean; fileName: string; error?: string };

    if (!uploadResult.success) throw new Error(uploadResult.error || "Gagal simpan ke R2");

    // 2. SIMPAN DATA KE SUPABASE
    const { error: dbError } = await supabase
      .from('fonts')
      .insert([{
        name: fontName,
        price: parseFloat(price),
        description: description,
        file_url: uploadResult.fileName, // Nama file di R2
      }]);

    if (dbError) throw dbError;

    alert("Gokil! Font berhasil dipublikasikan.");
    // Reset form di sini...
    
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
          <label className="block font-mono text-xs font-bold uppercase">Font Name</label>
          <input 
            type="text" 
            required
            value={fontName}
            onChange={(e) => setFontName(e.target.value)}
            className="w-full border border-black p-3 outline-none focus:bg-yellow-50" 
            placeholder="e.g. Royal Grande" 
          />
        </div>
        <div className="space-y-2">
          <label className="block font-mono text-xs font-bold uppercase">Base Price ($)</label>
          <input 
            type="number" 
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-black p-3 outline-none focus:bg-yellow-50" 
            placeholder="25" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-mono text-xs font-bold uppercase">Font File (.ttf, .otf)</label>
        <div className={`border-2 border-dashed border-black p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group ${selectedFile ? 'bg-green-50 border-green-500' : ''}`}>
          <input 
            type="file" 
            className="hidden" 
            id="fontFile" 
            accept=".ttf,.otf,.woff2"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="fontFile" className="cursor-pointer">
            <Plus className="mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-mono uppercase">
              {selectedFile ? `Selected: ${selectedFile.name}` : "Click to upload font binary"}
            </p>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-mono text-xs font-bold uppercase">Description</label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-black p-3 outline-none h-32 focus:bg-yellow-50" 
          placeholder="Tell the story of this font..."
        />
      </div>

      <button 
        type="submit"
        disabled={isUploading}
        className="w-full bg-black text-white p-4 font-bold uppercase tracking-widest hover:translate-x-[2px] hover:translate-y-[2px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {isUploading ? (
          <><Loader2 className="animate-spin" /> Processing...</>
        ) : "Save & Publish Product"}
      </button>
    </form>
  );
};

export default FontUploadForm;