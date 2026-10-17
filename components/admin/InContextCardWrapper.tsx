/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAdmin, EditableContentItem } from '../../context/AdminContext';
import { supabase } from '../../lib/supabase';
import { Edit3, Copy, Trash2, Plus } from 'lucide-react';

interface InContextCardWrapperProps {
  item: EditableContentItem;
  category: string;
  pagePath: string;
  onRefresh?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const InContextCardWrapper: React.FC<InContextCardWrapperProps> = ({
  item,
  category,
  pagePath,
  onRefresh,
  children,
  className = ''
}) => {
  const { isLiveEditMode, openEditorModal } = useAdmin();
  const [actionLoading, setActionLoading] = useState(false);

  if (!isLiveEditMode) {
    return <div className={className}>{children}</div>;
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditorModal(item, category, pagePath, onRefresh);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionLoading) return;
    setActionLoading(true);

    try {
      const copyPayload = {
        title: `${item.title} (COPY)`,
        content: item.content,
        category,
        page_path: pagePath,
        section_id: `${item.section_id}_CP`,
        sort_order: (item.sort_order || 0) + 1,
        type: item.type || 'page',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('site_content')
        .insert(copyPayload);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to duplicate section:', err);
      alert(`Duplicate failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionLoading) return;
    if (!item.id) {
      alert('Cannot delete item without database ID');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to delete section:', err);
      alert(`Delete failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={`relative group border border-dashed border-[#FF5C00] p-2 sm:p-4 my-2 transition-all ${className}`}>
      {/* Top Floating Controls Bar */}
      <div className="absolute -top-3.5 right-4 z-40 flex items-center gap-1.5 bg-black text-white px-2 py-0.5 border border-[#FF5C00] text-[10px] font-sans uppercase font-bold tracking-wider">
        <span className="text-[#FF5C00] font-mono">
          {item.section_id}
        </span>
        <button
          onClick={handleEdit}
          className="flex items-center gap-1 hover:text-[#FF5C00] transition-colors px-1 cursor-pointer"
          title="Edit this section"
        >
          <Edit3 size={11} /> EDIT
        </button>
        <span className="opacity-30">|</span>
        <button
          onClick={handleDuplicate}
          disabled={actionLoading}
          className="flex items-center gap-1 hover:text-[#FF5C00] transition-colors px-1 cursor-pointer disabled:opacity-40"
          title="Duplicate this section"
        >
          <Copy size={11} /> CLONE
        </button>
        <span className="opacity-30">|</span>
        <button
          onClick={handleDelete}
          disabled={actionLoading}
          className="flex items-center gap-1 hover:text-red-400 transition-colors px-1 cursor-pointer text-red-300 disabled:opacity-40"
          title="Delete this section"
        >
          <Trash2 size={11} /> DELETE
        </button>
      </div>

      {children}
    </div>
  );
};

export const InContextAddSectionButton: React.FC<{
  category: string;
  pagePath: string;
  onRefresh?: () => void;
}> = ({ category, pagePath, onRefresh }) => {
  const { isLiveEditMode, openEditorModal } = useAdmin();

  if (!isLiveEditMode) return null;

  return (
    <div className="w-full my-8 flex justify-center">
      <button
        onClick={() => openEditorModal(null, category, pagePath, onRefresh)}
        className="w-full max-w-xl border-2 border-dashed border-black bg-white hover:bg-black hover:text-white py-4 px-6 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs transition-all cursor-pointer shadow-xs"
      >
        <Plus size={16} className="text-[#FF5C00]" />
        ADD NEW SECTION / TABLE TO /{category.toUpperCase()}
      </button>
    </div>
  );
};
