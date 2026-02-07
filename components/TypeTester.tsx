import React, { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Type, Grid, Keyboard, ChevronDown } from 'lucide-react';
import { FontConfig } from '../types';
import opentype from 'opentype.js';

interface TypeTesterProps { config: FontConfig; defaultText?: string; isEven?: boolean; }

const TypeTester: React.FC<TypeTesterProps> = ({ config, defaultText = "One morning...", isEven = true }) => {
  const [text, setText] = useState(config.randomText || defaultText);
  const [fontSize, setFontSize] = useState(64);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [viewMode, setViewMode] = useState<'type' | 'glyphs'>('type');
  const [detectedGlyphs, setDetectedGlyphs] = useState<any[]>([]); 
  const [filteredGlyphs, setFilteredGlyphs] = useState<any[]>([]); 
  const [isLoadingGlyphs, setIsLoadingGlyphs] = useState(false);
  const [detectedAxes, setDetectedAxes] = useState<any[]>([]);
  const [axesValues, setAxesValues] = useState<Record<string, number>>({});
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({});
  const [dynamicFeatures, setDynamicFeatures] = useState<{ tag: string; name: string }[]>([]);
  const [lineHeight, setLineHeight] = useState(1.1);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [mapPage, setMapPage] = useState(0);
  const [mapGridSize, setMapGridSize] = useState(10);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const FEATURE_NAMES: Record<string, string> = { liga: 'Standard Ligatures', dlig: 'Discretionary Lig', calt: 'Contextual Alt', aalt: 'Access All Alt', salt: 'Stylistic Alt' };
  const ALLOWED_TAGS = new Set(['liga', 'dlig', 'calt', 'aalt', 'salt', ...Array.from({ length: 20 }, (_, i) => `ss${String(i + 1).padStart(2, '0')}`)]);

  const rowsPerPage = mapGridSize === 10 ? 3 : mapGridSize === 20 ? 5 : 7;
  const glyphsPerPage = mapGridSize * rowsPerPage;

  useEffect(() => {
    let targetFile = '';
    const files = Array.isArray(config.font_files) && config.font_files.length > 0 ? config.font_files : [config.file_url || config.file];
    if (files[activeStyleIndex]) {
       const f = files[activeStyleIndex];
       targetFile = f.startsWith('http') || f.startsWith('/') ? f : `/api/fonts/${f}`;
    }
    if (!targetFile) return;
    setIsLoadingGlyphs(true);
    opentype.load(targetFile, (err, font) => {
      setIsLoadingGlyphs(false);
      if (err || !font) return;
      const glyphs = [];
      for (let i = 0; i < font.glyphs.length && i < 2000; i++) {
        const glyph = font.glyphs.get(i);
        if (glyph.unicode) glyphs.push({ char: String.fromCharCode(glyph.unicode), index: i, unicode: glyph.unicode });
      }
      setDetectedGlyphs(glyphs);
      setFilteredGlyphs(glyphs); 
      if (font.tables.fvar?.axes?.length > 0) {
          const autoAxes = font.tables.fvar.axes.map((axis: any) => ({ tag: axis.tag, name: axis.name?.en || axis.tag, min: axis.minValue, max: axis.maxValue, default: axis.defaultValue }));
          setDetectedAxes(autoAxes);
          const vals: Record<string, number> = {};
          autoAxes.forEach((axis: any) => vals[axis.tag] = axis.default);
          setAxesValues(prev => ({ ...prev, ...vals }));
      }
      const foundTags = new Set<string>();
      if (font.tables.gsub?.features) font.tables.gsub.features.forEach((f: any) => { if (f.tag && ALLOWED_TAGS.has(f.tag)) foundTags.add(f.tag); });
      setDynamicFeatures(Array.from(foundTags).sort().map(tag => ({ tag, name: FEATURE_NAMES[tag] || (tag.startsWith('ss') ? `Stylistic Set ${parseInt(tag.slice(2))}` : tag.toUpperCase()) })));
      setActiveFeatures({});
    });
  }, [config, activeStyleIndex]);

  const toggleFeature = (tag: string) => setActiveFeatures(prev => ({ ...prev, [tag]: !prev[tag] }));
  const commonFontStyle = { fontFamily: `"${config.name}-${activeStyleIndex}"`, fontVariationSettings: Object.entries(axesValues).map(([t, v]) => `"${t}" ${v}`).join(', '), fontFeatureSettings: Object.entries(activeFeatures).map(([t, on]) => `"${t}" ${on ? 'on' : 'off'}`).join(', ') || 'normal' };

  return (
    <div className="w-full mb-16 border-b border-black relative bg-transparent">
      <div className="absolute z-0 pointer-events-none" style={{ left: isEven ? '-380px' : 'auto', right: isEven ? 'auto' : '-380px', top: '15%', width: '600px', height: '400px' }}>
          <div className="w-full h-full mix-blend-multiply blur-[60px]" style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.8) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(253, 186, 116, 0) 100%)' }} />
      </div>

      <div className="relative z-10">
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-stretch border-b border-black bg-white/10 backdrop-blur-[2px]">
          {/* GRID 1: VIEW MODE */}
          <div className="flex items-center gap-2 px-4 py-4 md:py-8 border-r border-b md:border-b-0 border-black justify-center md:justify-start">
             <button onClick={() => setViewMode('type')} className={`flex items-center gap-2 px-3 py-1 text-[10px] md:text-xs font-bold uppercase transition-colors whitespace-nowrap ${viewMode === 'type' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><Keyboard size={14}/> <span>Type</span></button>
             <button onClick={() => setViewMode('glyphs')} className={`flex items-center gap-2 px-3 py-1 text-[10px] md:text-xs font-bold uppercase transition-colors whitespace-nowrap ${viewMode === 'glyphs' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><Grid size={14}/> <span>Map</span></button>
          </div>

          {/* GRID 2: STYLE DROPDOWN (Mobile: Top Right) */}
          <div className="flex items-center gap-2 px-4 py-4 md:py-8 border-b md:border-b-0 md:border-l border-black justify-center md:order-last md:ml-auto">
              <span className="hidden md:inline font-mono text-[10px] text-gray-400 uppercase">Style</span>
              <div className="relative">
                 <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 font-bold text-[10px] md:text-xs uppercase outline-none py-1 min-w-[80px] justify-between relative z-10">
                    <span>Style {String(activeStyleIndex + 1).padStart(2, '0')}</span><ChevronDown size={14} className={isDropdownOpen ? 'rotate-180' : ''} />
                 </button>
                 {isDropdownOpen && (
                   <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-black z-50 shadow-none">
                        {config.font_files?.map((_, i) => (<button key={i} onClick={() => { setActiveStyleIndex(i); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold uppercase transition-colors block ${activeStyleIndex === i ? 'bg-black text-white' : 'text-black hover:bg-black hover:text-white'}`}>Style {String(i + 1).padStart(2, '0')}</button>))}
                    </div>
                   </>
                 )}
              </div>
          </div>

          {/* GRID 3: SIZE / GRID SIZE */}
          <div className="flex items-center gap-2 px-4 py-4 md:py-8 border-r border-black justify-center md:justify-start">
            {viewMode === 'type' ? (
              <div className="flex items-center gap-2">
                <Type size={16} /><input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-10 text-xs font-bold bg-transparent outline-none"/><span className="text-[10px] font-mono text-gray-500 uppercase">PX</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {[10, 20, 30].map(size => (<button key={size} onClick={() => { setMapGridSize(size); setMapPage(0); }} className={`px-2 py-1 text-[9px] font-bold border border-black ${mapGridSize === size ? 'bg-black text-white' : 'bg-transparent'}`}>{size}</button>))}
              </div>
            )}
          </div>

          {/* GRID 4: ALIGN / PAGINATION */}
          <div className="flex items-center gap-2 px-4 py-4 md:py-8 justify-center md:border-r md:border-black">
            {viewMode === 'type' ? (
              <div className="flex items-center gap-1">
                <button onClick={() => setAlign('left')} className={`p-1 ${align === 'left' ? 'bg-black text-white' : ''}`}><AlignLeft size={14}/></button>
                <button onClick={() => setAlign('center')} className={`p-1 ${align === 'center' ? 'bg-black text-white' : ''}`}><AlignCenter size={14}/></button>
                <button onClick={() => setAlign('right')} className={`p-1 ${align === 'right' ? 'bg-black text-white' : ''}`}><AlignRight size={14}/></button>
              </div>
            ) : (
              <div className="flex gap-2">
                  <button onClick={() => setMapPage(Math.max(0, mapPage - 1))} disabled={mapPage === 0} className="px-2 py-1 text-[9px] font-bold border border-black disabled:opacity-20">PREV</button>
                  <button onClick={() => setMapPage(mapPage + 1)} disabled={(mapPage + 1) * glyphsPerPage >= filteredGlyphs.length} className="px-2 py-1 text-[9px] font-bold border border-black disabled:opacity-20">NEXT</button>
              </div>
            )}
          </div>
        </div>

        <div className="min-h-[300px] mb-8 relative">
          {viewMode === 'type' ? (
              <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full min-h-[300px] bg-transparent outline-none resize-none p-4" style={{ ...commonFontStyle, fontSize: `${fontSize}px`, textAlign: align, lineHeight, letterSpacing: `${letterSpacing}em` }} spellCheck={false} />
          ) : (
              <div className="w-full grid content-start" style={{ gridTemplateColumns: `repeat(${mapGridSize}, minmax(0, 1fr))` }}>
                {filteredGlyphs.slice(mapPage * glyphsPerPage, (mapPage + 1) * glyphsPerPage).map((item, idx) => (
                  <div key={idx} className="aspect-square flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-default border-none">
                    <span style={{ ...commonFontStyle, fontSize: mapGridSize === 10 ? '60px' : mapGridSize === 20 ? '32px' : '20px' }}>{item.char}</span>
                  </div>
                ))}
              </div>
          )}
        </div>

        <div className="bg-transparent border-t border-black p-4 md:p-8 space-y-6 md:space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-0 md:mb-8">
              <div className="flex items-center gap-4 border-b md:border-none border-black pb-4 md:pb-0"><label className="w-24 font-mono text-xs font-bold uppercase text-black">Leading</label><input type="range" min="0.8" max="2.0" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="flex-grow h-px bg-black appearance-none accent-black"/><span className="font-mono text-xs text-black">{lineHeight.toFixed(1)}</span></div>
              <div className="flex items-center gap-4"><label className="w-24 font-mono text-xs font-bold uppercase text-black">Tracking</label><input type="range" min="-0.1" max="0.5" step="0.01" value={letterSpacing} onChange={(e) => setLetterSpacing(parseFloat(e.target.value))} className="flex-grow h-px bg-black appearance-none accent-black"/><span className="font-mono text-xs text-black">{letterSpacing.toFixed(2)}</span></div>
          </div>
          {(detectedAxes.length > 0 || dynamicFeatures.length > 0) && (
            <div className={`grid grid-cols-1 ${detectedAxes.length > 0 && dynamicFeatures.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-1'} border-t border-black pt-8`}>
                {detectedAxes.length > 0 && (
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="font-mono text-xs uppercase text-gray-500 mb-4 text-black">Variable Axes</h4>
                    {detectedAxes.map(axis => (
                      <div key={axis.tag} className="flex items-center gap-4">
                        <label className="w-16 font-mono text-xs font-bold uppercase truncate text-black">{axis.name}</label>
                        <input type="range" min={axis.min} max={axis.max} step={1} value={axesValues[axis.tag] ?? axis.default} onChange={(e) => setAxesValues(p => ({...p, [axis.tag]: parseFloat(e.target.value)}))} className="flex-grow h-px bg-black appearance-none accent-black"/><span className="font-mono text-xs text-black">{Math.round(axesValues[axis.tag] ?? axis.default)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {dynamicFeatures.length > 0 && (
                  <div className="border-l-0 md:border-l border-black pl-0 md:pl-8 space-y-4 mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0">
                    <h4 className="font-mono text-xs uppercase text-gray-500 mb-4 text-black">Features</h4>
                    {dynamicFeatures.map(feat => (
                      <label key={feat.tag} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-bold uppercase text-black">{feat.name}</span>
                        <input type="checkbox" checked={activeFeatures[feat.tag] || false} onChange={() => toggleFeature(feat.tag)} className="accent-black" />
                      </label>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypeTester;