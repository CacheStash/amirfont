import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Copy, Download, DollarSign, 
  CheckSquare, Square, X, Check, RefreshCw 
} from 'lucide-react';
import FontUploadForm from './FontUploadForm';
import { supabase } from '../../lib/supabase';

const ProductManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingFont, setEditingFont] = useState<any>(null);
  const [fonts, setFonts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // LOGIK SEARCH & PAGINATION
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // BATCH SELECTION & PRICE ADJUSTMENT STATE
  const [selectedFontIds, setSelectedFontIds] = useState<string[]>([]);
  const [showBatchPriceModal, setShowBatchPriceModal] = useState(false);
  const [batchScope, setBatchScope] = useState<'all' | 'selected'>('all');
  const [adjustmentSign, setAdjustmentSign] = useState<'+' | '-'>('+');
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('3.00');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // Filter data berdasarkan input search
  const filteredFonts = fonts.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Potong data untuk pagination
  const totalPages = Math.ceil(filteredFonts.length / itemsPerPage);
  const paginatedFonts = filteredFonts.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const isAllCurrentPageSelected = paginatedFonts.length > 0 && paginatedFonts.every(f => selectedFontIds.includes(f.id));

  useEffect(() => { fetchFonts(); }, []);

  // Scroll Lock saat Modal Aktif
  useEffect(() => {
    document.body.style.overflow = (showForm || showBatchPriceModal) ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showForm, showBatchPriceModal]);

  const fetchFonts = async () => {
    setLoading(true);
    const { data } = await supabase.from('fonts').select('*').order('display_order', { ascending: true });
    if (data) setFonts(data);
    setLoading(false);
  };

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newFonts = [...fonts];
    const draggedItem = newFonts[draggedIdx];
    newFonts.splice(draggedIdx, 1);
    newFonts.splice(idx, 0, draggedItem);
    
    const updatedFonts = newFonts.map((f, i) => ({ ...f, display_order: i }));
    setFonts(updatedFonts);
    setDraggedIdx(null);

    const updates = updatedFonts.map(f => 
      supabase.from('fonts').update({ display_order: f.display_order }).eq('id', f.id)
    );
    await Promise.all(updates);
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
      setSelectedFontIds(prev => prev.filter(x => x !== id));
      alert("Font berhasil dihapus.");
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleDuplicate = async (font: any) => {
    if (!confirm(`Duplicate "${font.name}"?`)) return;
    try {
      const { id, created_at, ...duplicateData } = font;
      const { error } = await supabase
        .from('fonts')
        .insert([{ ...duplicateData, name: `${font.name} COPY`, created_at: new Date().toISOString() }]);
      if (error) throw error;
      fetchFonts();
      alert("Berhasil diduplikasi.");
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleDownloadZip = async (font: any) => {
    try {
      setDownloadingId(font.id);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Session expired, please re-login.");
        return;
      }

      const res = await fetch(`/api/admin/download-font-zip?id=${encodeURIComponent(font.id)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Download failed (${res.status})`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;

      const disposition = res.headers.get('Content-Disposition');
      let filename = `SQ_${font.name.replace(/\s+/g, '_')}.zip`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert("Download error: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // --- SELECTION HELPERS ---
  const handleToggleSelectFont = (id: string) => {
    setSelectedFontIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrentPage = () => {
    const pageIds = paginatedFonts.map(f => f.id);
    const allSelected = pageIds.every(id => selectedFontIds.includes(id));
    if (allSelected) {
      setSelectedFontIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedFontIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllArchive = () => {
    if (selectedFontIds.length === fonts.length) {
      setSelectedFontIds([]);
    } else {
      setSelectedFontIds(fonts.map(f => f.id));
    }
  };

  // --- BATCH PRICE ADJUSTMENT LOGIC ---
  const deltaNum = parseFloat(adjustmentAmount) || 0;
  const signedDelta = adjustmentSign === '+' ? deltaNum : -deltaNum;

  const targetFontsForPriceUpdate = batchScope === 'selected' 
    ? fonts.filter(f => selectedFontIds.includes(f.id))
    : fonts;

  const handleExecuteBatchPriceAdjustment = async () => {
    if (targetFontsForPriceUpdate.length === 0) {
      alert("No fonts selected for price adjustment.");
      return;
    }

    if (deltaNum === 0) {
      alert("Please provide an adjustment amount greater than 0.");
      return;
    }

    const actionText = adjustmentSign === '+' ? `add +$${deltaNum.toFixed(2)}` : `subtract -$${deltaNum.toFixed(2)}`;
    const confirmMsg = `Are you sure you want to ${actionText} to the base valuation of ${targetFontsForPriceUpdate.length} font(s)?\n\nCommercial license matrix will be automatically scaled proportionally.`;
    if (!confirm(confirmMsg)) return;

    setIsUpdatingPrices(true);
    try {
      const updates = targetFontsForPriceUpdate.map(font => {
        const oldPrice = Number(font.price || 0);
        const newBase = Math.max(1, Number((oldPrice + signedDelta).toFixed(2)));
        
        // Recalculate proportional license matrix
        const calc = (m: number) => m > 0 ? (m === 1 ? newBase : Math.floor(newBase * m)) : 0;
        const updatedLicensePrices = {
          desktop: { solo: calc(1), team: calc(3), studio: calc(7), enterprise: calc(15) },
          social_web: { small_50k: calc(1), medium_500k: calc(3), large_5m: calc(7), enterprise_unlimited: calc(15) },
          logo_branding: { personal: calc(2.5), solo: calc(5), team: calc(10), studio: calc(20), enterprise: calc(30) },
          app: { solo: calc(5), team: calc(12), studio: calc(25), enterprise: calc(55) },
          server: { solo: calc(5), team: 0, studio: calc(25), enterprise: calc(50) },
          broadcast: { solo: calc(5), team: 0, studio: calc(25), enterprise: calc(50) },
          corporate_full_suite: calc(150.0)
        };

        return supabase
          .from('fonts')
          .update({
            price: newBase,
            price_web: newBase,
            price_app: calc(5),
            license_prices: updatedLicensePrices
          })
          .eq('id', font.id);
      });

      await Promise.all(updates);
      await fetchFonts();
      setShowBatchPriceModal(false);
      alert(`Success! Updated prices for ${targetFontsForPriceUpdate.length} font(s).`);
    } catch (err: any) {
      alert("Batch price adjustment error: " + err.message);
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-black pb-6">
        <div>
          <h2 className="text-4xl font-normal uppercase tracking-tight">Inventory</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {fonts.length} Typefaces
            </span>
            {selectedFontIds.length > 0 && (
              <span className="text-xs font-bold bg-black text-white px-2 py-0.5 uppercase tracking-wider">
                {selectedFontIds.length} Selected
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* SEARCH BAR */}
          <input 
            type="text"
            placeholder="Search fonts..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="bg-white border-2 border-black px-4 py-2.5 text-xs font-bold uppercase outline-none focus:bg-yellow-50 w-40 sm:w-56"
          />

          {/* BATCH PRICE ADJUST TRIGGER BUTTON */}
          <button
            type="button"
            onClick={() => {
              if (selectedFontIds.length > 0) {
                setBatchScope('selected');
              } else {
                setBatchScope('all');
              }
              setShowBatchPriceModal(true);
            }}
            className="bg-yellow-300 text-black border-2 border-black px-4 py-2.5 font-bold uppercase text-xs flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
            title="Batch adjust base prices across all or selected fonts"
          >
            <DollarSign size={14} />
            <span>Batch Price Adjust</span>
            {selectedFontIds.length > 0 && (
              <span className="bg-black text-white px-1.5 py-0.2 text-[9px] rounded-full font-mono">
                {selectedFontIds.length}
              </span>
            )}
          </button>

          {/* ADD NEW FONT BUTTON */}
          <button 
            onClick={() => { setEditingFont(null); setShowForm(true); }}
            className="bg-black text-white px-5 py-2.5 font-bold uppercase text-xs flex items-center gap-2 hover:bg-gray-800 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
          >
            <Plus size={16} /> Add New Font
          </button>
        </div>
      </div>

      {/* QUICK SELECTION CONTROLS BAR */}
      <div className="flex items-center justify-between text-xs py-2 px-1 border-b border-black/20">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSelectAllCurrentPage}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline cursor-pointer"
          >
            {isAllCurrentPageSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            <span>Select Page ({paginatedFonts.length})</span>
          </button>

          <button
            type="button"
            onClick={handleSelectAllArchive}
            className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black underline cursor-pointer"
          >
            {selectedFontIds.length === fonts.length ? 'Deselect All' : `Select All Archive (${fonts.length})`}
          </button>
        </div>

        {selectedFontIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedFontIds([])}
            className="text-xs uppercase font-bold text-red-600 hover:underline cursor-pointer"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="border-2 border-black bg-white overflow-x-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black bg-gray-50 text-xs uppercase font-bold tracking-widest text-gray-500">
              <th className="p-3 w-10 text-center">
                <input 
                  type="checkbox" 
                  checked={isAllCurrentPageSelected} 
                  onChange={handleSelectAllCurrentPage} 
                  className="cursor-pointer accent-black" 
                />
              </th>
              <th className="p-3">Typeface Name</th>
              <th className="p-3 text-right w-32">Base Price</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-16 text-center italic text-gray-400 font-serif">Consulting Archive Ledger...</td>
              </tr>
            ) : paginatedFonts.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-16 text-center italic text-gray-400 font-serif">No typefaces found matching the query.</td>
              </tr>
            ) : (
              paginatedFonts.map((f, i) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + i;
                const isSelected = selectedFontIds.includes(f.id);

                return (
                  <tr 
                    key={f.id} 
                    draggable
                    onDragStart={() => handleDragStart(globalIdx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(globalIdx)}
                    className={`border-b border-black hover:bg-yellow-50 transition-colors cursor-move ${
                      draggedIdx === globalIdx ? 'opacity-20' : ''
                    } ${isSelected ? 'bg-yellow-100/60' : ''}`}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => handleToggleSelectFont(f.id)} 
                        className="cursor-pointer accent-black" 
                      />
                    </td>
                    <td className="p-3 font-bold uppercase font-sans text-sm">
                      {f.name}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-sm">
                      ${Number(f.price || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right space-x-4">
                      <button 
                        type="button" 
                        disabled={downloadingId === f.id} 
                        onClick={() => handleDownloadZip(f)} 
                        className="text-black font-bold uppercase text-xs hover:underline inline-flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                        title="Download font files as .zip"
                      >
                        <Download size={12} className={downloadingId === f.id ? 'animate-bounce' : ''} /> 
                        {downloadingId === f.id ? 'Zipping...' : 'Zip'}
                      </button>
                      <button onClick={() => handleEdit(f)} className="text-blue-600 font-bold uppercase text-xs hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => handleDuplicate(f)} className="text-green-600 font-bold uppercase text-xs hover:underline inline-flex items-center gap-1 cursor-pointer"><Copy size={12} /> Duplicate</button>
                      <button onClick={() => handleDelete(f.id)} className="text-red-500 font-bold uppercase text-xs hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 size={12} /> Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="border-2 border-black px-4 py-2 font-bold uppercase text-[10px] disabled:opacity-30 hover:bg-black hover:text-white transition-colors cursor-pointer">Prev</button>
          <span className="font-bold text-xs uppercase tracking-widest">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="border-2 border-black px-4 py-2 font-bold uppercase text-[10px] disabled:opacity-30 hover:bg-black hover:text-white transition-all cursor-pointer">Next</button>
        </div>
      )}

      {/* BATCH PRICE ADJUSTMENT MODAL */}
      {showBatchPriceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-black p-6 sm:p-8 max-w-xl w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 my-8">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">
                  Bulk Pricing Manager
                </span>
                <h3 className="text-2xl font-bold uppercase tracking-tight">
                  Batch Price Adjust
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Adjust base valuation before discounts for multiple fonts in a single update.
                </p>
              </div>
              <button 
                onClick={() => setShowBatchPriceModal(false)}
                className="p-1 hover:bg-gray-100 border border-black cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider block">
                1. Target Selection Scope
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBatchScope('all')}
                  className={`p-3 text-left border-2 border-black transition-all cursor-pointer ${
                    batchScope === 'all'
                      ? 'bg-black text-white font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]'
                      : 'bg-gray-50 hover:bg-yellow-50 text-black'
                  }`}
                >
                  <span className="block text-xs uppercase tracking-wider font-bold">All Products</span>
                  <span className="text-[10px] font-mono opacity-80">Affects all {fonts.length} fonts in catalog</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedFontIds.length === 0) {
                      alert("Please checklist at least one font in the inventory table first.");
                      return;
                    }
                    setBatchScope('selected');
                  }}
                  className={`p-3 text-left border-2 border-black transition-all cursor-pointer ${
                    batchScope === 'selected'
                      ? 'bg-black text-white font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]'
                      : 'bg-gray-50 hover:bg-yellow-50 text-black'
                  } ${selectedFontIds.length === 0 ? 'opacity-50' : ''}`}
                >
                  <span className="block text-xs uppercase tracking-wider font-bold">Selected Only</span>
                  <span className="text-[10px] font-mono opacity-80">
                    {selectedFontIds.length} font(s) currently checked
                  </span>
                </button>
              </div>
            </div>

            {/* Adjustment Form */}
            <div className="space-y-3 p-4 border-2 border-black bg-yellow-50">
              <label className="text-xs font-bold uppercase tracking-wider block">
                2. Price Change Amount ($ USD)
              </label>

              <div className="flex items-center gap-3">
                {/* Sign Selector (+ or -) */}
                <div className="flex border-2 border-black bg-white">
                  <button
                    type="button"
                    onClick={() => setAdjustmentSign('+')}
                    className={`px-4 py-2 text-sm font-bold uppercase transition-colors cursor-pointer ${
                      adjustmentSign === '+' ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentSign('-')}
                    className={`px-4 py-2 text-sm font-bold uppercase transition-colors cursor-pointer ${
                      adjustmentSign === '-' ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    - Deduct
                  </button>
                </div>

                {/* Amount Input */}
                <div className="relative grow">
                  <span className="absolute left-3 top-2.5 font-bold text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={adjustmentAmount}
                    onChange={e => setAdjustmentAmount(e.target.value)}
                    className="border-2 border-black pl-7 pr-3 py-2 font-mono text-base font-bold w-full bg-white outline-none focus:bg-yellow-100"
                    placeholder="3.00"
                  />
                </div>
              </div>

              {/* Quick Preset Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-gray-600 mr-1">Presets:</span>
                {['1.00', '2.00', '2.50', '3.00', '5.00', '10.00'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAdjustmentAmount(val)}
                    className={`px-2 py-0.5 text-xs font-mono border border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer ${
                      adjustmentAmount === val ? 'font-bold bg-black text-white' : ''
                    }`}
                  >
                    {adjustmentSign}${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Impact Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider block">
                  3. Live Impact Preview ({targetFontsForPriceUpdate.length} Typefaces)
                </label>
                <span className="text-[10px] text-gray-500 font-mono">
                  Floor: Min $1.00 USD
                </span>
              </div>

              <div className="border-2 border-black max-h-48 overflow-y-auto bg-white">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-100 text-[10px] font-bold uppercase">
                      <th className="p-2 border-r border-black">Typeface</th>
                      <th className="p-2 border-r border-black text-right">Current Base</th>
                      <th className="p-2 border-r border-black text-right">Adjustment</th>
                      <th className="p-2 text-right font-bold">New Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/20 text-xs">
                    {targetFontsForPriceUpdate.map(font => {
                      const oldP = Number(font.price || 0);
                      const newP = Math.max(1, Number((oldP + signedDelta).toFixed(2)));
                      return (
                        <tr key={font.id} className="hover:bg-yellow-50">
                          <td className="p-2 border-r border-black font-sans font-bold uppercase">{font.name}</td>
                          <td className="p-2 border-r border-black text-right">${oldP.toFixed(2)}</td>
                          <td className={`p-2 border-r border-black text-right font-bold ${
                            adjustmentSign === '+' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {adjustmentSign}${deltaNum.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-bold">
                            ${newP.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] italic text-gray-500">
                Notice: All extended commercial licenses (Desktop Team/Studio, Web, App, Logo, Broadcast, Corporate) will be automatically scaled proportionally with the new base valuation.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setShowBatchPriceModal(false)}
                disabled={isUpdatingPrices}
                className="border-2 border-black px-4 py-2.5 text-xs font-bold uppercase hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchPriceAdjustment}
                disabled={isUpdatingPrices || targetFontsForPriceUpdate.length === 0}
                className="bg-black text-white border-2 border-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-gray-800 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
              >
                {isUpdatingPrices ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> APPLYING...
                  </>
                ) : (
                  <>
                    <Check size={14} /> APPLY TO {targetFontsForPriceUpdate.length} FONTS
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL FORM (UPLOAD / EDIT) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-normal uppercase tracking-tight">{editingFont ? 'Edit Typeface' : 'Upload New Typeface'}</h3>
              <button onClick={() => setShowForm(false)} className="text-xs font-bold hover:underline uppercase tracking-widest cursor-pointer">Close [X]</button>
            </div>
            <FontUploadForm initialData={editingFont} onSuccess={() => { setShowForm(false); fetchFonts(); }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;