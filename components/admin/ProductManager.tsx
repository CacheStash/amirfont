import React, { useState } from 'react'; // Tambahkan ini
import { Plus } from 'lucide-react'; // Tambahkan ini
import FontUploadForm from './FontUploadForm'; // Tambahkan ini
import { supabase } from '../../lib/supabase'; // Import koneksi database

const ProductManager = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [fonts, setFonts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchFonts();
  }, []);

  const fetchFonts = async () => {
    const { data } = await supabase.from('fonts').select('*').order('created_at', { ascending: false });
    if (data) setFonts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm("Hapus font ini selamanya?")) return;
    
    try {
      // 1. Hapus di Database
      const { error } = await supabase.from('fonts').delete().eq('id', id);
      if (error) throw error;

      // 2. Refresh List
      setFonts(fonts.filter(f => f.id !== id));
      alert("Font berhasil dihapus.");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tighter">Inventory</h2>
          <p className="text-gray-500 font-mono text-sm">Manage your typeface collection</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 font-bold uppercase text-sm hover:bg-gray-800 transition-all"
        >
          <Plus size={18} /> Add New Font
        </button>
      </div>

      {/* TABEL SIMPEL */}
      <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black uppercase font-mono text-xs bg-gray-50">
              <th className="p-4 border-r border-black">Font Name</th>
              <th className="p-4 border-r border-black">Price</th>
              <th className="p-4 border-r border-black">Sales</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {fonts.map((f) => (
              <tr key={f.id} className="border-b border-black hover:bg-gray-50 transition-colors">
                <td className="p-4 border-r border-black font-bold">{f.name}</td>
                <td className="p-4 border-r border-black">${f.price || '0.00'}</td>
                <td className="p-4 border-r border-black">0</td>
                <td className="p-4 flex justify-between items-center">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase border ${f.is_active ? 'bg-green-100 text-green-700 border-green-700' : 'bg-red-100 text-red-700 border-red-700'}`}>
                    {f.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button 
                    onClick={() => handleDelete(f.id, f.file_url)} 
                    className="text-red-500 hover:underline text-[10px] font-bold"
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            ))}
            {fonts.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400 italic">No fonts found in inventory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL / OVERLAY UNTUK FORM UPLOAD */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold uppercase">Upload New Typeface</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-black">✕ Close</button>
            </div>
            <FontUploadForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;