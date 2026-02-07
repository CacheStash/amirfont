import React, { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Type, Grid, Keyboard } from 'lucide-react';
import { FontConfig } from '../types';
import opentype from 'opentype.js';

interface TypeTesterProps {
  config: FontConfig;
  defaultText?: string;
  isEven?: boolean;
}

const TypeTester: React.FC<TypeTesterProps> = ({ 
  config, 
  defaultText = "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.",
  isEven = true 
}) => {
  // --- STATE MANAGEMENT ---
  const [text, setText] = useState(config.randomText || defaultText);
  const [fontSize, setFontSize] = useState(64);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [viewMode, setViewMode] = useState<'type' | 'glyphs'>('type');
  
  const [detectedGlyphs, setDetectedGlyphs] = useState<string[]>([]);
  const [isLoadingGlyphs, setIsLoadingGlyphs] = useState(false);
  const [detectedAxes, setDetectedAxes] = useState<any[]>([]);
  const [axesValues, setAxesValues] = useState<Record<string, number>>({});
  
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({});
  const [dynamicFeatures, setDynamicFeatures] = useState<{ tag: string; name: string }[]>([]);
  
  const [lineHeight, setLineHeight] = useState(1.1);
  const [letterSpacing, setLetterSpacing] = useState(0);
  
  // RESTORED: Map View Controls
  const [mapPage, setMapPage] = useState(0);
  const [mapGridSize, setMapGridSize] = useState(10);

  const FEATURE_NAMES: Record<string, string> = {
    liga: 'Standard Ligatures',
    dlig: 'Discretionary Lig',
    calt: 'Contextual Alt',
    aalt: 'Access All Alt',
    salt: 'Stylistic Alt',
  };

  const ALLOWED_TAGS = new Set([
      'liga', 'dlig', 'calt', 'aalt', 'salt',
      ...Array.from({ length: 20 }, (_, i) => `ss${String(i + 1).padStart(2, '0')}`) 
  ]);

  // --- EFFECT: LOAD FONT & DETECT FEATURES ---
  useEffect(() => {
    const currentFiles = Array.isArray(config.font_files) ? config.font_files : (config.file_url ? [config.file_url] : []);
    const targetFile = currentFiles[activeStyleIndex] 
      ? (currentFiles[activeStyleIndex].startsWith('http') ? currentFiles[activeStyleIndex] : `/api/fonts/${currentFiles[activeStyleIndex]}`)
      : config.file;
    
    if (!targetFile) return;

    setIsLoadingGlyphs(true);
    opentype.load(targetFile, (err, font) => {
      setIsLoadingGlyphs(false);
      if (err || !font) return;

      // 1. Glyphs
      const glyphs: string[] = [];
      for (let i = 0; i < font.glyphs.length && i < 2000; i++) { // Limit raised slightly
        const glyph = font.glyphs.get(i);
        if (glyph.unicode) glyphs.push(String.fromCharCode(glyph.unicode));
      }
      setDetectedGlyphs(glyphs);

      // 2. Axes
      if (font.tables.fvar?.axes?.length > 0) {
          const autoAxes = font.tables.fvar.axes.map((axis: any) => ({
              tag: axis.tag,
              name: axis.name?.en || axis.tag,
              min: axis.minValue, max: axis.maxValue, default: axis.defaultValue
          }));
          setDetectedAxes(autoAxes);
          const vals: Record<string, number> = {};
          autoAxes.forEach((axis: any) => vals[axis.tag] = axis.default);
          setAxesValues(prev => ({ ...prev, ...vals }));
      }

      // 3. Features
      const foundTags = new Set<string>();
      if (font.tables.gsub?.features) {
        font.tables.gsub.features.forEach((f: any) => {
           if (f.tag && ALLOWED_TAGS.has(f.tag)) foundTags.add(f.tag);
        });
      }

      setDynamicFeatures(Array.from(foundTags).sort().map(tag => ({
        tag, name: FEATURE_NAMES[tag] || (tag.startsWith('ss') ? `Stylistic Set ${parseInt(tag.slice(2))}` : tag.toUpperCase())
      })));

      const defaults: Record<string, boolean> = {};
      foundTags.forEach(tag => { if (['liga', 'calt'].includes(tag)) defaults[tag] = true; });
      setActiveFeatures(prev => ({ ...prev, ...defaults }));
    });
  }, [config, activeStyleIndex]);

  const toggleFeature = (tag: string) => setActiveFeatures(prev => ({ ...prev, [tag]: !prev[tag] }));

  const fontStyle = {
    fontFamily: `"${config.name}-${activeStyleIndex}"`,
    fontSize: `${fontSize}px`,
    textAlign: align,
    lineHeight: lineHeight,
    letterSpacing: `${letterSpacing}em`,
    fontVariationSettings: Object.entries(axesValues).map(([t, v]) => `"${t}" ${v}`).join(', '),
    fontFeatureSettings: Object.entries(activeFeatures).map(([t, on]) => `"${t}" ${on ? 'on' : 'off'}`).join(', ') || 'normal'
  };

  return (
    <div className="w-full mb-16 border-b border-black relative group bg-transparent">
      {/* BACKGROUND DECORATION */}
      <div className="absolute z-0 pointer-events-none overflow-visible" style={{ left: isEven ? '-380px' : 'auto', right: isEven ? 'auto' : '-380px', top: '15%', width: '600px', height: '400px' }}>
          <div className="w-full h-full mix-blend-multiply blur-[60px]" style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.8) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(253, 186, 116, 0) 100%)' }} />
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-stretch justify-between border-b border-black bg-white/10 backdrop-blur-[2px]">
          <div className="flex items-stretch">
            {/* 1. VIEW MODE */}
            <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
               <button onClick={() => setViewMode('type')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase transition-colors ${viewMode === 'type' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><Keyboard size={14}/> Type</button>
               <button onClick={() => setViewMode('glyphs')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase transition-colors ${viewMode === 'glyphs' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><Grid size={14}/> Map</button>
            </div>

            {/* 2A. TYPE CONTROLS */}
            {viewMode === 'type' && (
              <>
                <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                  <Type size={16} /><input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-12 text-sm font-bold bg-transparent outline-none"/><span className="text-xs font-mono text-gray-500">PX</span>
                </div>
                <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                  <button onClick={() => setAlign('left')} className={`p-2 ${align === 'left' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignLeft size={16}/></button>
                  <button onClick={() => setAlign('center')} className={`p-2 ${align === 'center' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignCenter size={16}/></button>
                  <button onClick={() => setAlign('right')} className={`p-2 ${align === 'right' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignRight size={16}/></button>
                </div>
              </>
            )}

            {/* 2B. MAP CONTROLS (RESTORED) */}
            {viewMode === 'glyphs' && (
              <>
                {/* Grid Size Buttons (10/20/30) */}
                <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                  {[10, 20, 30].map(size => (
                    <button key={size} onClick={() => { setMapGridSize(size); setMapPage(0); }} className={`px-2 py-1 text-[10px] font-bold border border-black ${mapGridSize === size ? 'bg-black text-white' : 'bg-transparent hover:bg-gray-200'}`}>{size}</button>
                  ))}
                </div>
                {/* Pagination Controls */}
                {detectedGlyphs.length > mapGridSize * 8 && (
                  <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                      <div className="flex gap-1">
                          <button onClick={() => setMapPage(Math.max(0, mapPage - 1))} disabled={mapPage === 0} className="px-2 py-1 text-[10px] font-bold border border-black disabled:opacity-20 hover:bg-black hover:text-white">PREV</button>
                          <button onClick={() => setMapPage(mapPage + 1)} disabled={(mapPage + 1) * (mapGridSize * 8) >= detectedGlyphs.length} className="px-2 py-1 text-[10px] font-bold border border-black disabled:opacity-20 hover:bg-black hover:text-white">NEXT</button>
                      </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* 3. RIGHT SIDE: Dropdown ONLY (Info Removed) */}
          <div className="flex items-center gap-6 px-4 md:px-8 py-6 md:py-8 border-l border-black ml-auto">
              {Array.isArray(config.font_files) && config.font_files.length > 1 && (
                <div className="flex items-center gap-2 pr-6">
                  <span className="font-mono text-[10px] text-gray-400 uppercase">Style</span>
                  <select value={activeStyleIndex} onChange={(e) => setActiveStyleIndex(parseInt(e.target.value))} className="bg-transparent font-bold text-xs uppercase outline-none cursor-pointer">
                    {config.font_files.map((_, i) => <option key={i} value={i} className="text-black">Style 0{i+1}</option>)}
                  </select>
                </div>
              )}
              {/* REMOVED: Style/Glyph count info here as requested */}
          </div>
        </div>

        <div className="min-h-[300px] mb-8 relative">
          {viewMode === 'type' ? (
              <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full min-h-[300px] bg-transparent outline-none resize-none p-4 relative z-10" style={fontStyle as any} spellCheck={false} />
          ) : (
              // MAP VIEW: REMOVED GAP-PX (Grid White Lines Removed)
              <div className="w-full grid content-start" style={{ gridTemplateColumns: `repeat(${mapGridSize}, minmax(0, 1fr))` }}>
                {detectedGlyphs.slice(mapPage * (mapGridSize * 8), (mapPage + 1) * (mapGridSize * 8)).map((char, idx) => (
                    <div key={idx} className="aspect-square flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-default border-none">
                        <span style={{ 
                          fontFamily: `"${config.name}-${activeStyleIndex}"`, 
                          // DYNAMIC FONT SIZING BASED ON GRID
                          fontSize: mapGridSize === 10 ? '60px' : mapGridSize === 20 ? '32px' : '20px' 
                        }}>
                          {char}
                        </span>
                    </div>
                ))}
              </div>
          )}
        </div>

        {/* SETTINGS PANEL */}
        <div className="bg-transparent border-t border-black">
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-black">
              <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8 border-b md:border-b-0 md:border-r border-black">
                  <label className="w-24 font-mono text-xs font-bold uppercase">Leading</label>
                  <input type="range" min="0.8" max="2.0" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"/>
                  <span className="w-12 text-right font-mono text-xs">{lineHeight.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8">
                  <label className="w-24 font-mono text-xs font-bold uppercase">Tracking</label>
                  <input type="range" min="-0.1" max="0.5" step="0.01" value={letterSpacing} onChange={(e) => setLetterSpacing(parseFloat(e.target.value))} className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"/>
                  <span className="w-12 text-right font-mono text-xs">{letterSpacing.toFixed(2)}</span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4 px-4 md:px-8 py-6 md:py-8 border-b md:border-b-0 border-black">
                <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">Variable Axes</h4>
                {(detectedAxes.length > 0 ? detectedAxes : config.axes).map((axis: any) => (
                  <div key={axis.tag} className="flex items-center gap-4">
                    <label className="w-16 font-mono text-xs font-bold uppercase truncate">{axis.name}</label>
                    <input type="range" min={axis.min} max={axis.max} step={1} value={axesValues[axis.tag] ?? axis.default} onChange={(e) => setAxesValues(p => ({...p, [axis.tag]: parseFloat(e.target.value)}))} className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"/>
                    <span className="w-12 text-right font-mono text-xs">{Math.round(axesValues[axis.tag] ?? axis.default)}</span>
                  </div>
                ))}
              </div>
              <div className="md:col-span-1 border-l border-black px-4 md:px-8 py-6 md:py-8">
                <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">Features</h4>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {dynamicFeatures.map((feat) => (
                    <label key={feat.tag} className="flex items-center justify-between cursor-pointer group select-none">
                      <span className="text-sm font-bold uppercase group-hover:text-gray-600 transition-colors">{feat.name} <span className="text-gray-400 font-mono text-xs ml-2">.{feat.tag}</span></span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={activeFeatures[feat.tag] || false} onChange={() => toggleFeature(feat.tag)} />
                        <div className="w-9 h-5 rounded-full bg-transparent border border-black peer-checked:bg-black peer-checked:border-black after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-black after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-white"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypeTester;