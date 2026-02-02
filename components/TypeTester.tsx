import React, { useState, useEffect } from 'react';
import BrutalistSlider from './BrutalistSlider';
import { FontConfig } from '../types';
import { RotateCcw, ExternalLink, AlignLeft, AlignCenter, AlignRight, Grid3X3, Keyboard, ChevronLeft, ChevronRight } from 'lucide-react';

interface TypeTesterProps {
  config: FontConfig;
  defaultText?: string;
}

const TypeTester: React.FC<TypeTesterProps> = ({ config, defaultText }) => {
  const [viewMode, setViewMode] = useState<'type' | 'characters'>('type');
  const [text, setText] = useState(defaultText || 'The quick brown fox jumps over the lazy dog.');
  const [size, setSize] = useState(117); // Default size besar untuk meminimalkan gap
  const [leading, setLeading] = useState(1.1);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [axesValues, setAxesValues] = useState<Record<string, number>>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const charsPerPage = 48;
  const allChars = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".split('');
  const totalPages = Math.ceil(allChars.length / charsPerPage);

  useEffect(() => {
    const defaults: Record<string, number> = {};
    if (config.axes) {
      config.axes.forEach(axis => {
        defaults[axis.tag] = axis.default;
      });
    }
    setAxesValues(defaults);
    setCurrentPage(1);
  }, [config]);

  const handleAxisChange = (tag: string, value: number) => {
    setAxesValues(prev => ({ ...prev, [tag]: value }));
  };

  const resetValues = () => {
    setSize(117);
    setLeading(1.1);
    const defaults: Record<string, number> = {};
    if (config.axes) config.axes.forEach(axis => defaults[axis.tag] = axis.default);
    setAxesValues(defaults);
  };

  const variationSettings = Object.entries(axesValues)
    .map(([tag, val]) => `'${tag}' ${val}`)
    .join(', ');

  const indexOfLastChar = currentPage * charsPerPage;
  const indexOfFirstChar = indexOfLastChar - charsPerPage;
  const currentChars = allChars.slice(indexOfFirstChar, indexOfLastChar);

  return (
    <div className="border-[3px] border-black bg-white select-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      
      {/* 1. TOP TOOLBAR (Tinggi & Lega) */}
      <div className="flex flex-wrap items-stretch justify-between border-b-[3px] border-black bg-white min-h-[80px]">
        <div className="flex items-center gap-4 px-8 border-r-[3px] border-black py-4">
            <span className="font-black text-2xl md:text-3xl uppercase tracking-tighter">
                T &nbsp; {config.name}
            </span>
            {(config.tags.includes('Variable') || config.axes.length > 0) && (
                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                    VAR
                </span>
            )}
        </div>

        <div className="flex items-stretch flex-1 md:flex-none">
            {/* Satu-satunya tombol navigasi mode */}
            <button 
              onClick={() => setViewMode(viewMode === 'type' ? 'characters' : 'type')}
              className="px-8 border-r-[3px] border-black hover:bg-gray-100 flex items-center gap-3 font-bold text-xs uppercase tracking-widest transition-colors"
            >
               {viewMode === 'type' ? (
                 <><Grid3X3 size={20} /> ALL CHARACTERS</>
               ) : (
                 <><Keyboard size={20} /> TYPE MODE</>
               )}
            </button>

            {viewMode === 'type' && (
              <div className="flex">
                  <button onClick={() => setAlign('left')} className={`px-6 flex items-center ${align === 'left' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}><AlignLeft size={22} /></button>
                  <button onClick={() => setAlign('center')} className={`px-6 border-l-[3px] border-black flex items-center ${align === 'center' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}><AlignCenter size={22} /></button>
                  <button onClick={() => setAlign('right')} className={`px-6 border-l-[3px] border-black flex items-center ${align === 'right' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}><AlignRight size={22} /></button>
              </div>
            )}
        </div>
      </div>

      {/* 2. MAIN VIEW AREA */}
      <div className="relative overflow-hidden min-h-[500px] bg-[#f8f8f8] bg-grid-pattern flex flex-col">
        
        {viewMode === 'type' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            className="w-full flex-1 p-12 outline-none break-words z-10 relative cursor-text"
            style={{
              fontSize: `${size}px`,
              lineHeight: leading,
              textAlign: align,
              fontFamily: config.family,
              fontVariationSettings: variationSettings,
              fontWeight: axesValues['wght'] || 400,
            }}
            onInput={(e) => setText(e.currentTarget.textContent || '')}
          >
            {text}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-8 z-10 relative">
            {/* Tombol Type Mode hitam bawah sudah dihapus di sini */}

            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 border-l border-t border-gray-300 bg-white shadow-sm mt-4">
                {currentChars.map((char, i) => (
                  <div 
                    key={i} 
                    className="aspect-square border-r border-b border-gray-300 flex items-center justify-center text-3xl md:text-4xl hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: config.family,
                      fontVariationSettings: variationSettings
                    }}
                  >
                    {char}
                  </div>
                ))}
            </div>

            <div className="mt-auto pt-8 border-t border-black flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="flex items-center gap-2 disabled:opacity-30 hover:underline"
                >
                  <ChevronLeft size={14} /> PREV
                </button>
                
                <span>PAGE {currentPage} / {totalPages}</span>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="flex items-center gap-2 disabled:opacity-30 hover:underline"
                >
                  NEXT <ChevronRight size={14} />
                </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROLS */}
      <div className="border-t-[3px] border-black p-8 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-16 gap-y-10">
            <BrutalistSlider label="Size" value={size} min={12} max={300} onChange={setSize} />
            <BrutalistSlider label="Leading" value={leading} min={0.8} max={2.5} step={0.01} onChange={setLeading} />

            {config.axes.map((axis) => (
                <BrutalistSlider
                    key={axis.tag}
                    label={axis.name}
                    value={axesValues[axis.tag] ?? axis.default}
                    min={axis.min}
                    max={axis.max}
                    step={axis.step || 1}
                    onChange={(val) => handleAxisChange(axis.tag, val)}
                />
            ))}
        </div>

        <div className="flex justify-end gap-4 mt-12 pt-6 border-t border-black border-dashed">
            <button 
                onClick={resetValues}
                className="flex items-center gap-2 px-8 py-3 border-2 border-black text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
                <RotateCcw size={16} /> Reset
            </button>
            <button className="flex items-center gap-2 px-10 py-3 bg-black text-white border-2 border-black text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-transform active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
                 Buy <ExternalLink size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default TypeTester;