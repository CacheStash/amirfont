/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin, EditableContentItem } from '../../context/AdminContext';
import { X, Save, Plus, Trash2, FileSpreadsheet } from 'lucide-react';

export const InContextEditorModal: React.FC = () => {
  const { editorModalState, closeEditorModal } = useAdmin();
  const { isOpen, item, category, pagePath, onSaved } = editorModalState;

  const [title, setTitle] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [contentType, setContentType] = useState<'page' | 'table' | 'auto'>('page');
  const [narrativeContent, setNarrativeContent] = useState('');
  
  // Table visual state
  const [tableHeaders, setTableHeaders] = useState<string[]>(['TIER_NAME', 'USERS_CAP', 'USAGE_SCOPE']);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['STANDARD COMMERCIAL', '1-5 USERS', 'PRINT, WEB, LOGOS, BROADCAST']
  ]);

  // Paste modal
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [tsvInput, setTsvInput] = useState('');
  const [firstRowIsHeader, setFirstRowIsHeader] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      setTitle(item.title || '');
      setSectionId(item.section_id || '');
      const t = (item.type === 'table' || item.type === 'auto') ? item.type : 'page';
      setContentType(t);

      if (t === 'table') {
        try {
          const parsed = JSON.parse(item.content);
          if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
            setTableHeaders(parsed.headers);
            setTableRows(parsed.rows);
          }
        } catch {
          setTableHeaders(['Column 1', 'Column 2']);
          setTableRows([['Value 1', 'Value 2']]);
        }
      } else if (t === 'auto') {
        const jsonStartIndex = item.content.indexOf('{');
        if (jsonStartIndex !== -1) {
          const textPart = item.content.substring(0, jsonStartIndex).trim();
          const jsonPart = item.content.substring(jsonStartIndex).trim();
          setNarrativeContent(textPart);
          try {
            const parsed = JSON.parse(jsonPart);
            if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
              setTableHeaders(parsed.headers);
              setTableRows(parsed.rows);
            }
          } catch {}
        } else {
          setNarrativeContent(item.content);
        }
      } else {
        setNarrativeContent(item.content || '');
      }
    } else {
      // New item defaults
      setTitle('');
      setSectionId('');
      setContentType('page');
      setNarrativeContent('');
      setTableHeaders(['COL_1', 'COL_2']);
      setTableRows([['VAL_1', 'VAL_2']]);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  // Table Helpers
  const handleAddColumn = () => {
    setTableHeaders(prev => [...prev, `COL_${prev.length + 1}`]);
    setTableRows(prev => prev.map(row => [...row, '']));
  };

  const handleRemoveColumn = (colIdx: number) => {
    if (tableHeaders.length <= 1) return;
    setTableHeaders(prev => prev.filter((_, i) => i !== colIdx));
    setTableRows(prev => prev.map(row => row.filter((_, i) => i !== colIdx)));
  };

  const handleAddRow = () => {
    const newRow = new Array(tableHeaders.length).fill('');
    setTableRows(prev => [...prev, newRow]);
  };

  const handleRemoveRow = (rowIdx: number) => {
    setTableRows(prev => prev.filter((_, i) => i !== rowIdx));
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    setTableRows(prev => {
      const next = prev.map(r => [...r]);
      next[rIdx][cIdx] = val;
      return next;
    });
  };

  const handleImportTSV = () => {
    if (!tsvInput.trim()) return;
    const lines = tsvInput.trim().split(/\r?\n/).filter(l => l.length > 0);
    if (lines.length === 0) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (firstRowIsHeader) {
      headers = lines[0].split('\t').map(h => h.trim().toUpperCase());
      rows = lines.slice(1).map(l => l.split('\t').map(c => c.trim()));
    } else {
      const firstRowCells = lines[0].split('\t');
      headers = firstRowCells.map((_, i) => `COL_${i + 1}`);
      rows = lines.map(l => l.split('\t').map(c => c.trim()));
    }

    setTableHeaders(headers);
    setTableRows(rows);
    setPasteModalOpen(false);
    setTsvInput('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Title cannot be empty');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      let finalContent = '';
      if (contentType === 'table') {
        finalContent = JSON.stringify({ headers: tableHeaders, rows: tableRows });
      } else if (contentType === 'auto') {
        const tableJson = JSON.stringify({ headers: tableHeaders, rows: tableRows });
        finalContent = `${narrativeContent.trim()}\n\n${tableJson}`;
      } else {
        finalContent = narrativeContent.trim();
      }

      const payload: Partial<EditableContentItem> = {
        title: title.trim(),
        section_id: sectionId.trim() || '01',
        category,
        page_path: pagePath,
        type: contentType,
        content: finalContent,
        updated_at: new Date().toISOString()
      };

      if (item?.id) {
        payload.id = item.id;
        payload.sort_order = item.sort_order;
      } else {
        payload.sort_order = 99;
      }

      const { error } = await supabase
        .from('site_content')
        .upsert(payload);

      if (error) throw error;

      if (onSaved) onSaved();
      closeEditorModal();
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMsg(err.message || 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-200 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border-2 border-black w-full max-w-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative text-black animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-black px-6 py-4 bg-black text-white">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#FF5C00] animate-pulse" />
            <h3 className="text-base font-bold uppercase tracking-wider">
              {item ? `EDIT SECTION (${sectionId || item.section_id})` : `ADD NEW SECTION TO /${category.toUpperCase()}`}
            </h3>
          </div>
          <button
            onClick={closeEditorModal}
            className="p-1 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-700 text-red-900 text-xs font-bold uppercase">
              {errorMsg}
            </div>
          )}

          {/* Title & Section ID */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#FF5C00] block">
                SECTION ID
              </label>
              <input
                type="text"
                value={sectionId}
                onChange={e => setSectionId(e.target.value)}
                placeholder="01"
                className="w-full border border-black p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-black font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#FF5C00] block">
                SECTION TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="SECTION HEADLINE"
                className="w-full border border-black p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-black font-bold uppercase"
                required
              />
            </div>
          </div>

          {/* Content Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#FF5C00] block">
              CONTENT LAYOUT TYPE
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContentType('page')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  contentType === 'page'
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-black text-black/70 hover:bg-black/5'
                }`}
              >
                STANDARD TEXT / HTML
              </button>
              <button
                type="button"
                onClick={() => setContentType('table')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  contentType === 'table'
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-black text-black/70 hover:bg-black/5'
                }`}
              >
                STRUCTURED TABLE
              </button>
              <button
                type="button"
                onClick={() => setContentType('auto')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  contentType === 'auto'
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-black text-black/70 hover:bg-black/5'
                }`}
              >
                COMBINED (TEXT + TABLE)
              </button>
            </div>
          </div>

          {/* Narrative Editor (for 'page' or 'auto') */}
          {(contentType === 'page' || contentType === 'auto') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#FF5C00] block">
                NARRATIVE CONTENT (HTML / PARAGRAPHS)
              </label>
              <textarea
                value={narrativeContent}
                onChange={e => setNarrativeContent(e.target.value)}
                rows={6}
                placeholder="Enter narrative text or HTML markup..."
                className="w-full border border-black p-3 text-sm bg-white outline-none focus:ring-1 focus:ring-black leading-relaxed font-sans"
              />
            </div>
          )}

          {/* Interactive Table Editor (for 'table' or 'auto') */}
          {(contentType === 'table' || contentType === 'auto') && (
            <div className="space-y-3 border border-black p-4 bg-[#EDEBE6]/40">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C00]">
                  INTERACTIVE TABLE BUILDER
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPasteModalOpen(true)}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/10 hover:bg-black hover:text-white transition-colors flex items-center gap-1 border border-black"
                  >
                    <FileSpreadsheet size={12} /> PASTE SPREADSHEET
                  </button>
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/10 hover:bg-black hover:text-white transition-colors flex items-center gap-1 border border-black"
                  >
                    <Plus size={12} /> COL
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} /> ROW
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-black text-white border-b border-black">
                      {tableHeaders.map((header, colIdx) => (
                        <th key={colIdx} className="p-2 border-r border-white/20 last:border-r-0">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={header}
                              onChange={e => {
                                const next = [...tableHeaders];
                                next[colIdx] = e.target.value.toUpperCase();
                                setTableHeaders(next);
                              }}
                              className="w-full bg-black border border-white/40 px-2 py-0.5 text-[11px] font-bold uppercase text-white outline-none"
                            />
                            {tableHeaders.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(colIdx)}
                                className="text-white/60 hover:text-red-400"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="p-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-black/20 hover:bg-black/5">
                        {tableHeaders.map((_, colIdx) => (
                          <td key={colIdx} className="p-1.5 border-r border-black/20 last:border-r-0">
                            <input
                              type="text"
                              value={row[colIdx] || ''}
                              onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                              className="w-full bg-white border border-transparent hover:border-black/30 focus:border-black px-2 py-1 text-xs"
                            />
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(rowIdx)}
                            className="text-black/30 hover:text-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-black">
            <button
              type="button"
              onClick={closeEditorModal}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest border border-black hover:bg-black/5 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              {loading ? 'SAVING...' : 'SAVE TO WEBSITE'}
            </button>
          </div>
        </form>

        {/* Nested Spreadsheet Paste Modal */}
        {pasteModalOpen && (
          <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6">
            <div className="bg-white border-2 border-black p-6 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-[#FF5C00]" />
                  PASTE FROM GOOGLE SHEETS / EXCEL
                </h4>
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(false)}
                  className="text-black/60 hover:text-black"
                >
                  <X size={16} />
                </button>
              </div>
              <textarea
                rows={6}
                value={tsvInput}
                onChange={e => setTsvInput(e.target.value)}
                placeholder="Select cells in Excel / Sheets, copy (Ctrl+C), and paste here..."
                className="w-full border border-black p-3 text-xs font-mono bg-black/5 outline-none focus:border-black"
              />
              <label className="flex items-center gap-2 text-xs text-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={firstRowIsHeader}
                  onChange={e => setFirstRowIsHeader(e.target.checked)}
                  className="accent-black"
                />
                First row contains column headers
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider border border-black"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleImportTSV}
                  className="px-5 py-1.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-[#FF5C00] hover:text-black transition-colors"
                >
                  APPLY TABLE DATA
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
