/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Edit3, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InContextAdminBar: React.FC = () => {
  const { isAdmin, isLiveEditMode, toggleLiveEditMode } = useAdmin();

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-150 flex items-center gap-3 bg-black text-white border border-[#FF5C00] px-4 py-2.5 shadow-[4px_4px_0px_0px_#FF5C00] text-xs font-sans uppercase animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center gap-2 pr-3 border-r border-white/20">
        <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
        <span className="font-bold tracking-widest text-[10px] text-[#FF5C00]">
          ADMIN ACTIVE
        </span>
      </div>

      <button
        onClick={toggleLiveEditMode}
        className={`flex items-center gap-1.5 px-3 py-1 font-bold tracking-wider text-[10px] transition-all cursor-pointer ${
          isLiveEditMode
            ? 'bg-[#FF5C00] text-black shadow-sm'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        <Edit3 size={12} />
        {isLiveEditMode ? 'LIVE EDITOR: ON' : 'EDIT PAGE CONTENT'}
      </button>

      <Link
        to="/backstage"
        className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-white/70 hover:text-white transition-colors pl-2"
        title="Open Backstage Admin Panel"
      >
        BACKSTAGE <ExternalLink size={11} />
      </Link>
    </div>
  );
};
