import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy } from 'lucide-react';
import FontUploadForm from './FontUploadForm';
import { supabase } from '../../lib/supabase';

const ProductManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingFont, setEditingFont] = useState<any>(null);
  const [fonts, setFonts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFonts(); }, []);

  // FUNGSI: Mengunci scroll background saat modal aktif
  useEffect(() => {
    if (showForm) {
      // Nonaktifkan scroll pada body
      document.body.style.overflow = 'hidden';
    } else {
      // Kembalikan scroll ke kondisi semula
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup: Pastikan scroll kembali normal saat komponen unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  const fetchFonts = async () => {
    const { data } = await supabase.from('fonts').select('*').order('created_at', { ascending: false });
    if (data) setFonts(data);
    setLoading(false);
  };

  const handleEdit = (font: any) => {
    setEditingFont(font);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus font ini selamanya?")) return;
    try {
      const { error } = await supabase.from('fonts').delete().eq('id', id);
      if (error) throw error;
      setFonts(fonts.filter(f => f.id !== id));
      alert("Font berhasil dihapus.");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleDuplicate = async (font: any) => {
    if (!confirm(`Duplicate "${font.name}"?`)) return;
    try {
      const { id, created_at, ...duplicateData } = font;
      const { error } = await supabase
        .from('fonts')
        .insert([{ 
          ...duplicateData, 
          name: `${font.name} COPY`,
          created_at: new Date().toISOString() 
        }]);

      if (error) throw error;
      fetchFonts();
      alert("Font berhasil diduplikasi.");
    } catch (err: any) {
      alert("Gagal menduplikasi: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-normal uppercase tracking-tight">Inventory</h2>
          <p className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-wider">
            Manage Typefaces
          </p>
        </div>
        <button 
          onClick={() => { setEditingFont(null); setShowForm(true); }}
          className="bg-black text-white px-6 py-3 font-bold uppercase text-xs flex items-center gap-2 hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
        >
            <Plus size={16} /> Add New Font
        </button>
      </div>

      <div className="border-2 border-black bg-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black bg-gray-50">
              <th className="p-4 text-xs uppercase font-bold tracking-widest text-gray-500">Name</th>
              <th className="p-4 text-xs uppercase font-bold tracking-widest text-right text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fonts.map((f) => (
              <tr key={f.id} className="border-b border-black hover:bg-yellow-50 transition-colors">
                <td className="p-4 font-bold uppercase">{f.name}</td>
                <td className="p-4 text-right space-x-4">
                  <button onClick={() => handleEdit(f)} className="text-blue-600 font-bold uppercase text-xs hover:underline inline-flex items-center gap-1">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => handleDuplicate(f)} className="text-green-600 font-bold uppercase text-xs hover:underline inline-flex items-center gap-1">
                    <Copy size={12} /> Duplicate
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="text-red-500 font-bold uppercase text-xs hover:underline inline-flex items-center gap-1">
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-normal uppercase tracking-tight">
                {editingFont ? 'Edit Typeface' : 'Upload New Typeface'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-xs font-bold hover:underline uppercase tracking-widest">
                Close [X]
              </button>
            </div>
            <FontUploadForm initialData={editingFont} onSuccess={() => { setShowForm(false); fetchFonts(); }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;