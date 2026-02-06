import React from 'react';
import { Plus } from 'lucide-react'; // Tambahkan ini

const FontUploadForm = () => {
  return (
    <form className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block font-mono text-xs font-bold uppercase">Font Name</label>
          <input type="text" className="w-full border border-black p-3 outline-none focus:bg-yellow-50" placeholder="e.g. Royal Grande" />
        </div>
        <div className="space-y-2">
          <label className="block font-mono text-xs font-bold uppercase">Base Price ($)</label>
          <input type="number" className="w-full border border-black p-3 outline-none focus:bg-yellow-50" placeholder="25" />
        </div>
      </div>

      {/* UPLOAD AREA FONT FILE */}
      <div className="space-y-2">
        <label className="block font-mono text-xs font-bold uppercase">Font File (.ttf, .otf, .woff2)</label>
        <div className="border-2 border-dashed border-black p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
          <input type="file" className="hidden" id="fontFile" />
          <label htmlFor="fontFile" className="cursor-pointer">
            <Plus className="mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-mono uppercase">Click to upload font binary</p>
          </label>
        </div>
      </div>

      {/* UPLOAD AREA PREVIEW IMAGES */}
      <div className="space-y-2">
        <label className="block font-mono text-xs font-bold uppercase">Preview Images (Gallery)</label>
        <div className="grid grid-cols-4 gap-2">
          <div className="aspect-square border border-dashed border-gray-400 flex items-center justify-center hover:border-black cursor-pointer">
            <Plus size={16} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-mono text-xs font-bold uppercase">Description</label>
        <textarea className="w-full border border-black p-3 outline-none h-32 focus:bg-yellow-50" placeholder="Tell the story of this font..."></textarea>
      </div>

      <button className="w-full bg-black text-white p-4 font-bold uppercase tracking-widest hover:translate-x-[2px] hover:translate-y-[2px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]">
        Save & Publish Product
      </button>
    </form>
  );
};

export default FontUploadForm;