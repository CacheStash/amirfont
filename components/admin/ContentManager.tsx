import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  FileText, 
  Eye, 
  Monitor, 
  Smartphone, 
  Table as TableIcon, 
  Code, 
  FileSpreadsheet, 
  Zap, 
  Terminal
} from 'lucide-react';

interface ContentItem {
  id?: string;
  title: string;
  content: string;
  page_path: string;
  section_id: string;
  category: string;
  sort_order: number;
  type: string;
  updated_at?: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface SpecialFooterData {
  italic_text: string;
  body_text: string;
  location: string;
}

// Subqi Brutal Table Component for Live Simulation
const SubqiBrutalTable: React.FC<{ headers: string[]; rows: string[][] }> = ({ headers, rows }) => (
  <div className="w-full border-2 border-black mb-6 overflow-hidden bg-white">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-black bg-black text-white">
            {headers.map((h, i) => (
              <th
                key={i}
                className="p-3 border-r border-white/40 last:border-0 font-black text-xs uppercase tracking-wider whitespace-nowrap"
              >
                {h || `COL_${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-black last:border-0 hover:bg-orange-50 transition-colors">
              {headers.map((_, j) => (
                <td
                  key={j}
                  className="p-3 border-r border-black last:border-0 text-xs font-mono text-black leading-relaxed"
                >
                  {row[j] !== undefined && row[j] !== '' ? row[j] : <span className="opacity-20 italic">NULL</span>}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={Math.max(1, headers.length)} className="p-6 text-center text-xs font-mono text-gray-400">
                // EMPTY_TABLE: ADD ROWS OR PASTE SPREADSHEET CELLS ABOVE
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const ContentManager = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [currentCategory, setCurrentCategory] = useState('faq');

  const categories = ['faq', 'license', 'policy', 'canvas', 'contact', 'affiliate'];

  const [formData, setFormData] = useState<ContentItem>({
    title: '',
    content: '',
    page_path: '/faq',
    section_id: '',
    category: 'faq',
    type: 'page',
    sort_order: 0
  });

  // Visual Editor State
  const [editorMode, setEditorMode] = useState<'visual' | 'raw'>('visual');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Table Visual State
  const [tableHeaders, setTableHeaders] = useState<string[]>(['TIER_NAME', 'USERS_CAP', 'USAGE_SCOPE']);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['STANDARD COMMERCIAL', '1-5 USERS', 'PRINT, WEB, LOGOS, BROADCAST'],
    ['EXTENDED ENTERPRISE', 'UNLIMITED', 'SAAS APPS, OEM EMBEDDING']
  ]);

  // Narrative State for 'auto'
  const [narrativeText, setNarrativeText] = useState<string>('');

  // Special Footer State
  const [footerData, setFooterData] = useState<SpecialFooterData>({
    italic_text: '',
    body_text: '',
    location: ''
  });

  // Spreadsheet Paste Modal State
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [tsvInput, setTsvInput] = useState('');
  const [firstRowIsHeader, setFirstRowIsHeader] = useState(true);

  // Automatic Section ID generation
  const generateSectionId = (category: string, index: number) => {
    const displayIndex = index + 1;
    if (category === 'faq') return `Q${displayIndex}`;
    if (category === 'canvas') return `CV${displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`}`;
    if (category === 'contact') return `CT${displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`}`;
    if (category === 'affiliate') return `AF${displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`}`;
    return displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems.splice(draggedItemIndex, 1)[0];
    newItems.splice(index, 0, draggedItem);

    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      sort_order: idx,
      section_id: generateSectionId(currentCategory, idx),
      updated_at: new Date().toISOString()
    }));

    setItems(updatedItems);
    setDraggedItemIndex(null);

    try {
      const { error } = await supabase.from('site_content').upsert(updatedItems);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to sync sequence:", err);
      alert("SEQUENCE SYNC FAILED. PLEASE REFRESH.");
    }
  };

  useEffect(() => {
    fetchContent();
  }, [currentCategory]);

  const fetchContent = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('category', currentCategory)
      .order('sort_order', { ascending: true });
    
    if (data) setItems(data);
    setLoading(false);
  };

  // Load item into form and initialize visual state
  const loadItemIntoForm = (item: ContentItem) => {
    setFormData(item);
    setIsEditing(true);

    if (item.type === 'table') {
      try {
        const parsed = JSON.parse(item.content);
        if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
          setTableHeaders(parsed.headers);
          setTableRows(parsed.rows);
          setEditorMode('visual');
        } else {
          setEditorMode('raw');
        }
      } catch {
        setEditorMode('raw');
      }
    } else if (item.type === 'auto') {
      const jsonStartIndex = item.content.indexOf('{');
      if (jsonStartIndex !== -1) {
        const textPart = item.content.substring(0, jsonStartIndex).trim();
        const jsonPart = item.content.substring(jsonStartIndex).trim();
        setNarrativeText(textPart);
        try {
          const parsed = JSON.parse(jsonPart);
          if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
            setTableHeaders(parsed.headers);
            setTableRows(parsed.rows);
            setEditorMode('visual');
          } else {
            setEditorMode('raw');
          }
        } catch {
          setEditorMode('raw');
        }
      } else {
        setNarrativeText(item.content);
        setEditorMode('visual');
      }
    } else if (item.type === 'special_footer') {
      try {
        const parsed = JSON.parse(item.content);
        setFooterData({
          italic_text: parsed.italic_text || '',
          body_text: parsed.body_text || '',
          location: parsed.location || parsed.location_info || ''
        });
        setEditorMode('visual');
      } catch {
        setEditorMode('raw');
      }
    } else {
      setEditorMode('raw');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize visual state to formData.content
  const syncVisualToContent = (
    type: string,
    headers: string[],
    rows: string[][],
    narrative: string,
    footer: SpecialFooterData
  ) => {
    if (type === 'table') {
      return JSON.stringify({ headers, rows }, null, 2);
    }
    if (type === 'auto') {
      const jsonStr = JSON.stringify({ headers, rows }, null, 2);
      return narrative.trim() ? `${narrative.trim()}\n\n${jsonStr}` : jsonStr;
    }
    if (type === 'special_footer') {
      return JSON.stringify(footer, null, 2);
    }
    return formData.content;
  };

  const handleHeaderChange = (index: number, val: string) => {
    const updated = [...tableHeaders];
    updated[index] = val;
    setTableHeaders(updated);
    const serialized = syncVisualToContent(formData.type, updated, tableRows, narrativeText, footerData);
    setFormData(prev => ({ ...prev, content: serialized }));
  };

  const handleAddColumn = () => {
    const newHeaders = [...tableHeaders, `COL_${tableHeaders.length + 1}`];
    const newRows = tableRows.map(row => [...row, '']);
    setTableHeaders(newHeaders);
    setTableRows(newRows);
    const serialized = syncVisualToContent(formData.type, newHeaders, newRows, narrativeText, footerData);
    setFormData(prev => ({ ...prev, content: serialized }));
  };

  const handleRemoveColumn = (colIdx: number) => {
    if (tableHeaders.length <= 1) {
      alert("Table must have at least one column.");
      return;
    }
    const newHeaders = tableHeaders.filter((_, idx) => idx !== colIdx);
    const newRows = tableRows.map(row => row.filter((_, idx) => idx !== colIdx));
    setTableHeaders(newHeaders);
    setTableRows(newRows);
    const serialized = syncVisualToContent(formData.type, newHeaders, newRows, narrativeText, footerData);
    setFormData(prev => ({ ...prev, content: serialized }));
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = tableRows.map((row, rI) => {
      if (rI !== rowIdx) return row;
      const newRow = [...row];
      newRow[colIdx] = val;
      return newRow;
    });
    setTableRows(newRows);
    const serialized = syncVisualToContent(formData.type, tableHeaders, newRows, narrativeText, footerData);
    setFormData(prev => ({ ...prev, content: serialized }));
  };

  const handleAddRow = () => {
    const newRow = new Array(tableHeaders.length).fill('');
    const newRows = [...tableRows, newRow];
    setTableRows(newRows);
    const serialized = syncVisualToContent(formData.type, tableHeaders, newRows, narrativeText, footerData);
    setFormData(prev => ({ ...prev, content: serialized }));
  };

  const handleRemoveRow = (rowIdx: number) => {
    const newRows = tableRows.filter((_, idx) => idx !== rowIdx);
    setTableRows(newRows);
    const serialized = syncVisualToContent(formData.type, tableHeaders, newRows, narrativeText, footerData);
    setFormData(prev => ({ ...prev, content: serialized }));
  };

  const handleNarrativeChange = (val: string) => {
    setNarrativeText(val);
    const serialized = syncVisualToContent(formData.type, tableHeaders, tableRows, val, footerData);
    setFormData(prev => ({ ...prev, content: serialized }));
  };

  const handleFooterChange = (field: keyof SpecialFooterData, val: string) => {
    const updated = { ...footerData, [field]: val };
    setFooterData(updated);
    const serialized = syncVisualToContent(formData.type, tableHeaders, tableRows, narrativeText, updated);
    setFormData(prev => ({ ...prev, content: serialized }));
  };

  const handleImportTSV = () => {
    if (!tsvInput.trim()) {
      alert("Please paste text from spreadsheet.");
      return;
    }

    const lines = tsvInput.trim().split(/\r?\n/).filter(line => line.length > 0);
    if (lines.length === 0) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (firstRowIsHeader) {
      headers = lines[0].split('\t').map(h => h.trim());
      rows = lines.slice(1).map(line => line.split('\t').map(c => c.trim()));
    } else {
      const firstRowCells = lines[0].split('\t');
      headers = firstRowCells.map((_, i) => `COL_${i + 1}`);
      rows = lines.map(line => line.split('\t').map(c => c.trim()));
    }

    const maxCols = Math.max(headers.length, ...rows.map(r => r.length));
    while (headers.length < maxCols) {
      headers.push(`COL_${headers.length + 1}`);
    }
    rows = rows.map(r => {
      const fullRow = [...r];
      while (fullRow.length < headers.length) fullRow.push('');
      return fullRow;
    });

    setTableHeaders(headers);
    setTableRows(rows);
    const serialized = syncVisualToContent(formData.type, headers, rows, narrativeText, footerData);
    setFormData(prev => ({ ...prev, content: serialized }));
    setPasteModalOpen(false);
    setTsvInput('');
  };

  const toggleEditorMode = (mode: 'visual' | 'raw') => {
    if (mode === 'visual') {
      if (formData.type === 'table') {
        try {
          const parsed = JSON.parse(formData.content);
          if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
            setTableHeaders(parsed.headers);
            setTableRows(parsed.rows);
            setEditorMode('visual');
            return;
          }
        } catch {
          alert("Cannot switch to Visual Editor: Invalid JSON syntax.");
          return;
        }
      } else if (formData.type === 'auto') {
        const jsonStartIndex = formData.content.indexOf('{');
        if (jsonStartIndex !== -1) {
          const textPart = formData.content.substring(0, jsonStartIndex).trim();
          const jsonPart = formData.content.substring(jsonStartIndex).trim();
          try {
            const parsed = JSON.parse(jsonPart);
            if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
              setNarrativeText(textPart);
              setTableHeaders(parsed.headers);
              setTableRows(parsed.rows);
              setEditorMode('visual');
              return;
            }
          } catch {
            alert("Cannot switch to Visual Editor: Invalid Table JSON.");
            return;
          }
        }
      } else if (formData.type === 'special_footer') {
        try {
          const parsed = JSON.parse(formData.content);
          setFooterData({
            italic_text: parsed.italic_text || '',
            body_text: parsed.body_text || '',
            location: parsed.location || parsed.location_info || ''
          });
          setEditorMode('visual');
          return;
        } catch {
          alert("Cannot switch to Visual Editor: Invalid Footer JSON.");
          return;
        }
      }
    }
    setEditorMode(mode);
  };

  const handleTypeChange = (newType: string) => {
    setFormData(prev => {
      let newContent = prev.content;
      if (newType === 'table') {
        newContent = JSON.stringify({ headers: tableHeaders, rows: tableRows }, null, 2);
      } else if (newType === 'auto') {
        const jsonStr = JSON.stringify({ headers: tableHeaders, rows: tableRows }, null, 2);
        newContent = narrativeText.trim() ? `${narrativeText.trim()}\n\n${jsonStr}` : jsonStr;
      } else if (newType === 'special_footer') {
        newContent = JSON.stringify(footerData, null, 2);
      }
      return { ...prev, type: newType, content: newContent };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      await supabase
        .from('site_content')
        .update({ 
          ...formData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', formData.id);
    } else {
      await supabase.from('site_content').insert([formData]);
    }
    resetForm();
    fetchContent();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('PERMANENTLY DELETE THIS CONTENT RECORD?')) {
      await supabase.from('site_content').delete().eq('id', id);
      fetchContent();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      page_path: `/${currentCategory}`,
      section_id: '',
      category: currentCategory,
      type: 'page',
      sort_order: items.length
    });
    setNarrativeText('');
    setTableHeaders(['TIER_NAME', 'USERS_CAP', 'USAGE_SCOPE']);
    setTableRows([
      ['STANDARD COMMERCIAL', '1-5 USERS', 'PRINT, WEB, LOGOS, BROADCAST'],
      ['EXTENDED ENTERPRISE', 'UNLIMITED', 'SAAS APPS, OEM EMBEDDING']
    ]);
    setFooterData({ italic_text: '', body_text: '', location: '' });
    setEditorMode('visual');
    setIsEditing(false);
  };

  // Compute live preview payload
  const livePreviewData = useMemo(() => {
    if (formData.type === 'table') {
      try {
        const parsed: TableData = JSON.parse(formData.content);
        return { type: 'table', table: parsed };
      } catch {
        return { type: 'table', table: { headers: tableHeaders, rows: tableRows } };
      }
    }
    if (formData.type === 'auto') {
      const jsonStartIndex = formData.content.indexOf('{');
      if (jsonStartIndex !== -1) {
        const textPart = formData.content.substring(0, jsonStartIndex).trim();
        const jsonPart = formData.content.substring(jsonStartIndex).trim();
        try {
          const parsedTable: TableData = JSON.parse(jsonPart);
          return { type: 'auto', text: textPart, table: parsedTable };
        } catch {
          return { type: 'auto', text: textPart, table: { headers: tableHeaders, rows: tableRows } };
        }
      }
      return { type: 'auto', text: formData.content, table: { headers: tableHeaders, rows: tableRows } };
    }
    if (formData.type === 'special_footer') {
      try {
        const parsed = JSON.parse(formData.content);
        return { type: 'special_footer', footer: parsed };
      } catch {
        return { type: 'special_footer', footer: footerData };
      }
    }
    return { type: formData.type, content: formData.content };
  }, [formData.content, formData.type, tableHeaders, tableRows, footerData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-black pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter">Content_Vault</h2>
          <p className="text-xs font-bold opacity-50 uppercase">Manage static pages, legal policies &amp; documentation</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setCurrentCategory(cat);
                setFormData(prev => ({ ...prev, category: cat, page_path: `/${cat}` }));
              }}
              className={`px-5 py-2.5 border-2 border-black font-black text-[10px] uppercase tracking-widest transition-all ${
                currentCategory === cat ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-orange-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 1. FORM SECTION & VISUAL BUILDER (ATAS) */}
      <form onSubmit={handleSubmit} className="border-2 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm tracking-tight">
                {isEditing ? 'EDIT_CONTENT_RECORD' : 'CREATE_NEW_RECORD'}
              </h3>
              <p className="text-[10px] font-mono text-gray-500 uppercase">
                TARGET_CATEGORY: {currentCategory} &bull; ROUTE: {formData.page_path}
              </p>
            </div>
          </div>

          {/* Visual ↔ Raw Code Toggle */}
          {(formData.type === 'table' || formData.type === 'auto' || formData.type === 'special_footer') && (
            <div className="flex items-center gap-1 border border-black p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => toggleEditorMode('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                  editorMode === 'visual' ? 'bg-black text-white' : 'hover:bg-gray-200'
                }`}
              >
                <TableIcon size={12} /> VISUAL_BUILDER
              </button>
              <button
                type="button"
                onClick={() => toggleEditorMode('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                  editorMode === 'raw' ? 'bg-black text-white' : 'hover:bg-gray-200'
                }`}
              >
                <Code size={12} /> RAW_JSON
              </button>
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
              ENTRY_TITLE
            </label>
            <input 
              type="text" 
              placeholder="TITLE (e.g. Standard Commercial License...)" 
              className="w-full p-3 border-2 border-black font-bold uppercase text-xs outline-none focus:bg-orange-50 transition-colors"
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">TYPE</label>
              <select 
                className="w-full p-3 border-2 border-black font-black uppercase text-[10px] outline-none bg-white cursor-pointer"
                value={formData.type}
                onChange={e => handleTypeChange(e.target.value)}
              >
                <option value="page">STANDARD_CARD</option>
                <option value="auto">AUTO (TEXT+TABLE)</option>
                <option value="table">BRUTAL_TABLE</option>
                <option value="special_footer">CLOSING_STATEMENT</option>
                <option value="insight_summary">INSIGHT_SUMMARY</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">SECTION_ID</label>
              <input 
                type="text" 
                placeholder="ID (e.g. 01, Q01)" 
                className="w-full p-3 border-2 border-black font-mono font-bold uppercase text-[10px] outline-none"
                value={formData.section_id} 
                onChange={e => setFormData({ ...formData, section_id: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">ORDER</label>
              <input 
                type="number" 
                placeholder="ORDER" 
                className="w-full p-3 border-2 border-black font-mono font-bold uppercase text-[10px] outline-none"
                value={formData.sort_order} 
                onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* VISUAL TABLE BUILDER */}
        {editorMode === 'visual' && (formData.type === 'table' || formData.type === 'auto') && (
          <div className="space-y-4 pt-2">
            {formData.type === 'auto' && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                  INTRODUCTORY NARRATIVE (HTML / TEXT ALLOWED)
                </label>
                <textarea 
                  rows={3}
                  placeholder="Context narrative that appears directly before the table..." 
                  className="w-full p-3 border-2 border-black font-mono text-xs outline-none focus:bg-orange-50"
                  value={narrativeText} 
                  onChange={e => handleNarrativeChange(e.target.value)}
                />
              </div>
            )}

            {/* Table Builder Box */}
            <div className="border-2 border-black bg-gray-50 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-black text-white">
                    <TableIcon size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase">VISUAL_GRID_BUILDER</h4>
                    <span className="text-[9px] font-mono text-gray-500">
                      {tableHeaders.length} COLUMNS &bull; {tableRows.length} ROWS
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPasteModalOpen(true)}
                    className="px-3 py-1.5 border border-black bg-white hover:bg-black hover:text-white text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={12} /> IMPORT_SPREADSHEET
                  </button>
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="px-3 py-1.5 border border-black bg-white hover:bg-black hover:text-white text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> ADD_COL
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 border border-black bg-black text-white hover:bg-orange-600 text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                  >
                    <Plus size={12} /> ADD_ROW
                  </button>
                </div>
              </div>

              {/* Table Matrix */}
              <div className="overflow-x-auto border-2 border-black bg-white">
                <table className="w-full text-left border-collapse min-w-[550px]">
                  <thead>
                    <tr className="bg-black text-white border-b-2 border-black">
                      <th className="p-2 w-10 text-center text-[9px] font-mono border-r border-white/30">#</th>
                      {tableHeaders.map((header, colIdx) => (
                        <th key={colIdx} className="p-2 border-r border-white/30 last:border-r-0">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={header}
                              onChange={e => handleHeaderChange(colIdx, e.target.value)}
                              placeholder={`HEADER_${colIdx + 1}`}
                              className="w-full bg-white text-black border border-black px-2 py-1 text-[10px] font-black uppercase outline-none focus:bg-orange-100"
                            />
                            {tableHeaders.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(colIdx)}
                                className="text-white hover:text-red-400 p-1"
                                title="Remove column"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="p-2 w-12 text-center text-[9px] font-black text-white/60">ACT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-black last:border-b-0 hover:bg-orange-50/50">
                        <td className="p-2 text-center text-[10px] font-mono font-black border-r border-black bg-gray-100">
                          {rowIdx + 1}
                        </td>
                        {tableHeaders.map((_, colIdx) => (
                          <td key={colIdx} className="p-2 border-r border-black last:border-r-0">
                            <textarea
                              rows={1}
                              value={row[colIdx] || ''}
                              onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                              placeholder="Value..."
                              className="w-full bg-transparent border border-gray-300 focus:border-black focus:bg-white p-1.5 text-xs font-mono outline-none resize-y min-h-[32px]"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(rowIdx)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Delete row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VISUAL SPECIAL FOOTER */}
        {editorMode === 'visual' && formData.type === 'special_footer' && (
          <div className="border-2 border-black p-6 bg-gray-50 space-y-4">
            <h4 className="text-xs font-black uppercase border-b border-black pb-2">
              SPECIAL_CLOSING_BUILDER
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500">ITALIC_HEADLINE</label>
                <input
                  type="text"
                  value={footerData.italic_text}
                  onChange={e => handleFooterChange('italic_text', e.target.value)}
                  placeholder="Born in silence, crafted in stone..."
                  className="w-full p-2.5 border-2 border-black font-bold uppercase text-xs outline-none focus:bg-orange-50"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500">BODY_TEXT</label>
                <textarea
                  rows={3}
                  value={footerData.body_text}
                  onChange={e => handleFooterChange('body_text', e.target.value)}
                  placeholder="Full closing statement or philosophy..."
                  className="w-full p-3 border-2 border-black font-mono text-xs outline-none focus:bg-orange-50"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500">LOCATION_AND_YEAR</label>
                <input
                  type="text"
                  value={footerData.location}
                  onChange={e => handleFooterChange('location', e.target.value)}
                  placeholder="Sleman, Yogyakarta — 2026"
                  className="w-full p-2.5 border-2 border-black font-mono font-bold uppercase text-xs outline-none focus:bg-orange-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* RAW / STANDARD TEXTAREA */}
        {(editorMode === 'raw' || (formData.type !== 'table' && formData.type !== 'auto' && formData.type !== 'special_footer')) && (
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
              {editorMode === 'raw' ? 'RAW_JSON_PAYLOAD' : 'CONTENT (HTML ALLOWED: <b>, <br>, <ul>, etc)'}
            </label>
            <textarea 
              placeholder={editorMode === 'raw' ? '{"headers": [...], "rows": [...]}' : 'CONTENT (HTML ALLOWED: <b>, <br>, <ul>, etc)'} 
              className={`w-full h-36 p-4 border-2 border-black font-mono text-xs outline-none focus:bg-orange-50 ${
                editorMode === 'raw' ? 'bg-gray-50' : 'bg-white'
              }`}
              value={formData.content} 
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex items-center gap-2 bg-black text-white px-8 py-3.5 font-black text-xs uppercase hover:bg-orange-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Save size={16} /> {isEditing ? 'COMMIT_RECORD_UPDATE' : 'PUBLISH_CONTENT_RECORD'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="flex items-center gap-2 border-2 border-black px-6 py-3.5 font-black text-xs uppercase hover:bg-gray-100 transition-all">
              <X size={16} /> CANCEL
            </button>
          )}
        </div>
      </form>

      {/* 2. REAL-TIME LIVE PREVIEW (STACKED VERTICALLY: ATAS-BAWAH) */}
      <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Preview Control Toolbar */}
        <div className="bg-black text-white px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Eye size={16} className="text-orange-500" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                LIVE_SITE_SIMULATION
                <span className="text-[9px] bg-orange-600 px-2 py-0.5 font-mono">
                  {currentCategory.toUpperCase()}
                </span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 border border-black">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase transition-all ${
                previewDevice === 'desktop' ? 'bg-black text-white' : 'text-black hover:bg-gray-200'
              }`}
            >
              <Monitor size={12} /> DESKTOP
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase transition-all ${
                previewDevice === 'mobile' ? 'bg-black text-white' : 'text-black hover:bg-gray-200'
              }`}
            >
              <Smartphone size={12} /> MOBILE
            </button>
          </div>
        </div>

        {/* Live Simulation Surface */}
        <div className="p-6 md:p-10 bg-[#F5F5F0] flex justify-center min-h-[240px] overflow-x-auto">
          <div className={`transition-all duration-300 w-full ${previewDevice === 'mobile' ? 'max-w-md border-2 border-black p-4 bg-[#F5F5F0] shadow-2xl' : 'max-w-4xl'}`}>
            <div className="w-full border border-black bg-white">
              {/* Header */}
              <div className="border-b border-black p-6 md:p-8 bg-white">
                <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                  <span className="opacity-20 mr-4 md:mr-6">{formData.section_id || '01'}</span>
                  {formData.title || 'DRAFT_TITLE'}
                </h3>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 space-y-6 text-gray-800 leading-relaxed text-sm md:text-base">
                {livePreviewData.type === 'table' && livePreviewData.table && (
                  <SubqiBrutalTable 
                    headers={livePreviewData.table.headers || []} 
                    rows={livePreviewData.table.rows || []} 
                  />
                )}

                {livePreviewData.type === 'auto' && (
                  <div className="space-y-6">
                    {livePreviewData.text && (
                      <div 
                        className="prose max-w-none text-black"
                        dangerouslySetInnerHTML={{ __html: livePreviewData.text }} 
                      />
                    )}
                    {livePreviewData.table && (
                      <SubqiBrutalTable 
                        headers={livePreviewData.table.headers || []} 
                        rows={livePreviewData.table.rows || []} 
                      />
                    )}
                  </div>
                )}

                {livePreviewData.type === 'special_footer' && livePreviewData.footer && (
                  <div className="border-2 border-black bg-black text-white p-6 md:p-10 space-y-4">
                    {livePreviewData.footer.italic_text && (
                      <h4 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                        {livePreviewData.footer.italic_text}
                      </h4>
                    )}
                    {livePreviewData.footer.body_text && (
                      <p className="text-xs md:text-sm font-mono text-gray-300 leading-relaxed">
                        {livePreviewData.footer.body_text}
                      </p>
                    )}
                    {livePreviewData.footer.location && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 pt-2 border-t border-white/20">
                        {livePreviewData.footer.location}
                      </p>
                    )}
                  </div>
                )}

                {(livePreviewData.type === 'page' || livePreviewData.type === 'insight_summary') && (
                  <div 
                    className="prose max-w-none text-black"
                    dangerouslySetInnerHTML={{ __html: livePreviewData.content || 'Content text will render here...' }} 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ARCHIVE LIST WITH DRAG AND DROP SEQUENCING (PRESERVED) */}
      <div className="space-y-4 pb-12">
        <div className="flex justify-between items-center border-b-2 border-black pb-2">
          <h3 className="font-black uppercase text-xs tracking-wider">
            REORDER_HIERARCHY [{currentCategory.toUpperCase()}] &mdash; {items.length} ENTRIES
          </h3>
          <span className="text-[10px] font-mono text-gray-500">DRAG TO REORDER</span>
        </div>

        {loading ? (
          <div className="font-black animate-pulse">SYNCING_DATA...</div>
        ) : (
          items.map((item, index) => (
            <div 
              key={item.id} 
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className={`border-2 border-black p-4 bg-white flex justify-between items-center group cursor-move transition-all ${
                draggedItemIndex === index ? 'opacity-30 border-dashed bg-gray-100' : 'hover:border-orange-500 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <div className="flex items-center gap-6">
                <span className="font-black text-2xl opacity-20 italic">#{item.sort_order}</span>
                <div>
                  <h4 className="font-black uppercase text-sm leading-none">{item.title}</h4>
                  <p className="text-[10px] font-bold opacity-50 mt-1 uppercase">
                    ID: {item.section_id} &bull; PATH: {item.page_path} &bull; TYPE: {item.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => loadItemIntoForm(item)} 
                  className="p-2 border border-black hover:bg-black hover:text-white transition-colors"
                  title="Edit entry"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id!)} 
                  className="p-2 border border-black hover:bg-red-600 hover:text-white transition-colors"
                  title="Delete entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SPREADSHEET PASTE MODAL */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="border-4 border-black bg-white max-w-xl w-full p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-orange-600" />
                <h4 className="text-sm font-black uppercase">
                  IMPORT_SPREADSHEET_CELLS (TSV)
                </h4>
              </div>
              <button 
                type="button" 
                onClick={() => setPasteModalOpen(false)}
                className="p-1 hover:bg-black hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-mono text-gray-600">
              Copy cells from Google Sheets / Excel (<kbd className="bg-gray-100 px-1 border border-black">Ctrl+C</kbd>) and paste below. The grid will auto-parse columns and rows.
            </p>

            <textarea
              rows={8}
              value={tsvInput}
              onChange={e => setTsvInput(e.target.value)}
              placeholder="Paste cells here...&#10;TIER	USERS	SCOPE&#10;Standard	1-5	Web & Print"
              className="w-full border-2 border-black p-3 font-mono text-xs outline-none focus:bg-orange-50"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="subqiFirstRowIsHeader"
                checked={firstRowIsHeader}
                onChange={e => setFirstRowIsHeader(e.target.checked)}
                className="cursor-pointer accent-black w-4 h-4"
              />
              <label htmlFor="subqiFirstRowIsHeader" className="text-xs font-black uppercase cursor-pointer">
                FIRST ROW CONTAINS HEADERS
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="px-6 py-2.5 border-2 border-black font-black text-xs uppercase hover:bg-gray-100"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleImportTSV}
                className="px-6 py-2.5 bg-black text-white font-black text-xs uppercase hover:bg-orange-600"
              >
                PARSE_&amp;_POPULATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;