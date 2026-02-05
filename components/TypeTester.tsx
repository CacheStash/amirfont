import React, { useState, useEffect } from 'react';
import { RefreshCw, AlignLeft, AlignCenter, AlignRight, Type, Grid, Keyboard } from 'lucide-react';
import { FontConfig } from '../types';
// --- PARTIAL FIX ---
import opentype from 'opentype.js';

interface TypeTesterProps {
  config: FontConfig;
  defaultText?: string;
}

const TypeTester: React.FC<TypeTesterProps> = ({ config, defaultText = "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections." }) => {
  const [text, setText] = useState(defaultText);
  const [fontSize, setFontSize] = useState(64);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [viewMode, setViewMode] = useState<'type' | 'glyphs'>('type');
  
  // State untuk Glyph Map
  const [detectedGlyphs, setDetectedGlyphs] = useState<string[]>([]);
  const [isLoadingGlyphs, setIsLoadingGlyphs] = useState(false);

  const [axesValues, setAxesValues] = useState<Record<string, number>>({});
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({});

  const [featureCounts, setFeatureCounts] = useState<Record<string, number>>({});

  const [mapPage, setMapPage] = useState(0);
  const [mapGridSize, setMapGridSize] = useState(10); // Default 10 columns
  const [dynamicFeatures, setDynamicFeatures] = useState<{ tag: string; name: string }[]>([]);

  const [detectedAxes, setDetectedAxes] = useState<any[]>([]);

  const [lineHeight, setLineHeight] = useState(1.1);
  const [letterSpacing, setLetterSpacing] = useState(0);

  // Map View Settings
  const FEATURE_NAMES: Record<string, string> = {
    liga: 'Standard Ligatures',
    dlig: 'Discretionary Lig',
    calt: 'Contextual Alt',
    aalt: 'Access All Alt',
    salt: 'Stylistic Alt',
    // ss01-ss20 akan di-handle otomatis
  };

  // WHITELIST STRICT: Hanya fitur ini yang boleh muncul
  const ALLOWED_TAGS = new Set([
      'liga', 'dlig', 'calt', 'aalt', 'salt',
      // Generate ss01 sampai ss20
      ...Array.from({ length: 20 }, (_, i) => `ss${String(i + 1).padStart(2, '0')}`) 
  ]);

  // 1. Load Font Glyphs & Auto-Detect (Features + Axes)
  useEffect(() => {
    if (!config.file) return;

    setIsLoadingGlyphs(true);
    setDetectedGlyphs([]);
    setDetectedAxes([]); // Reset detected axes

    opentype.load(config.file, (err, font) => {
      setIsLoadingGlyphs(false);
      if (err) {
        console.error('Could not load font: ' + err);
        return;
      }
      if (!font) return;

      // --- A. GLYPH EXTRACTION ---
      const glyphs: string[] = [];
      for (let i = 0; i < font.glyphs.length && i < 600; i++) {
        const glyph = font.glyphs.get(i);
        if (glyph.unicode) {
          glyphs.push(String.fromCharCode(glyph.unicode));
        }
      }
      setDetectedGlyphs(glyphs);

      // --- B. DYNAMIC AXES DETECTION (VARIABLE FONT) ---
      // Cek apakah font memiliki tabel 'fvar'
      if (font.tables.fvar && font.tables.fvar.axes && font.tables.fvar.axes.length > 0) {
          const autoAxes = font.tables.fvar.axes.map((axis: any) => ({
              tag: axis.tag,
              // Coba ambil nama dari properti name (biasanya object {en: "Weight"}) atau fallback ke tag
              name: axis.name && axis.name.en ? axis.name.en : (axis.name || axis.tag),
              min: axis.minValue,
              max: axis.maxValue,
              default: axis.defaultValue
          }));
          setDetectedAxes(autoAxes);

          // Update state value slider agar sesuai default font
          const newAxesValues: Record<string, number> = {};
          autoAxes.forEach((axis: any) => {
              newAxesValues[axis.tag] = axis.default;
          });
          setAxesValues(prev => ({ ...prev, ...newAxesValues }));
      }

      // --- C. FILTERED FEATURE DETECTION ---
      const foundTags = new Set<string>();

      // Hanya scan GSUB (Substitusi) karena fitur desain (liga, ss01) ada di sini.
      if (font.tables.gsub && font.tables.gsub.features) {
        font.tables.gsub.features.forEach((f: any) => {
           // Logic: Tag ada di file && Tag ada di daftar keinginan (Whitelist)
           if (f.tag && ALLOWED_TAGS.has(f.tag)) {
               foundTags.add(f.tag);
           }
        });
      }

      // Convert ke Array Object untuk UI
      const detectedList = Array.from(foundTags).sort().map(tag => {
        // Cek nama custom di config dulu
        const configFeature = config.features?.find(cf => cf.tag === tag);
        if (configFeature) return { tag, name: configFeature.name };

        // Cek kamus nama umum
        if (FEATURE_NAMES[tag]) return { tag, name: FEATURE_NAMES[tag] };
        
        // Handle Stylistic Sets (SS01 - SS20) secara dinamis
        if (tag.startsWith('ss')) {
            return { tag, name: `Stylistic Set ${parseInt(tag.slice(2))}` };
        }

        return { tag, name: tag.toUpperCase() };
      });

      setDynamicFeatures(detectedList);

      // --- D. AUTO ACTIVATE (Hanya Standard: Liga & Calt) ---
      const detectedActive: Record<string, boolean> = {};
      const standards = ['liga', 'calt']; 
      
      foundTags.forEach(tag => {
        if (standards.includes(tag)) detectedActive[tag] = true;
      });
      
      // Update Feature Counts (Simpel 1/0)
      const simpleCounts: Record<string, number> = {};
      foundTags.forEach(tag => simpleCounts[tag] = 1);
      setFeatureCounts(simpleCounts);
      
      setActiveFeatures(prev => ({ ...prev, ...detectedActive }));

    });
  }, [config.file]);


  // Reset saat font berubah
  useEffect(() => {
    // 1. Reset Axes
    const initialAxes: Record<string, number> = {};
    config.axes.forEach(axis => {
      initialAxes[axis.tag] = axis.default;
    });
    setAxesValues(initialAxes);

    // 2. Reset Features
    const initialFeatures: Record<string, boolean> = {};
    if (config.features) {
      config.features.forEach(feat => {
        // Fitur standar seperti Ligatures (liga) & Contextual Alt (calt) biasanya default ON
        // Fitur opsional seperti ss01, zero, dlig default OFF
        const isStandard = ['liga', 'calt', 'kern'].includes(feat.tag);
        initialFeatures[feat.tag] = isStandard;
      });
    }
    setActiveFeatures(initialFeatures);
  }, [config]);

  const handleAxisChange = (tag: string, value: number) => {
    setAxesValues(prev => ({ ...prev, [tag]: value }));
  };

  const toggleFeature = (tag: string) => {
    setActiveFeatures(prev => ({ ...prev, [tag]: !prev[tag] }));
  };

  // Generate CSS Variable Settings
  const getFontVariationSettings = () => {
    return Object.entries(axesValues)
      .map(([tag, val]) => `"${tag}" ${val}`)
      .join(', ');
  };

  // Generate CSS Feature Settings (Fix Logic)
  const getFontFeatureSettings = () => {
    // Kita paksa output "tag" 1 (ON) atau "tag" 0 (OFF)
    const settings = Object.entries(activeFeatures)
      .map(([tag, isActive]) => `"${tag}" ${isActive ? 'on' : 'off'}`);
    
    // Default 'normal' kadang mereset liga, jadi lebih baik return string kosong jika tidak ada custom
    if (settings.length === 0) return 'normal';
    return settings.join(', ');
  };

  const resetSettings = () => {
    const initialAxes: Record<string, number> = {};
    config.axes.forEach(axis => initialAxes[axis.tag] = axis.default);
    setAxesValues(initialAxes);
    
    const initialFeatures: Record<string, boolean> = {};
    if (config.features) {
        config.features.forEach(feat => {
            const isStandard = ['liga', 'calt'].includes(feat.tag);
            initialFeatures[feat.tag] = isStandard;
        });
    }
    setActiveFeatures(initialFeatures);
    
    setFontSize(64);
    setAlign('left');
    setLineHeight(1.1);
    setLetterSpacing(0);
    setMapPage(0);
  };

  const fontStyle = {
    fontFamily: config.family,
    fontVariationSettings: getFontVariationSettings(),
    fontFeatureSettings: getFontFeatureSettings(),
    lineHeight: lineHeight,
    letterSpacing: `${letterSpacing}em`,
  };

  return (
    <div className="w-full mb-16 border-b border-black">
      
      {/* Controls Header - Grid System */}
      <div className="flex flex-wrap items-stretch justify-between mb-0 border-b border-black">
        <div className="flex items-stretch">
            
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
             <button 
                onClick={() => setViewMode('type')}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase transition-colors ${viewMode === 'type' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
             >
                <Keyboard size={14}/> Type
             </button>
             <button 
                onClick={() => setViewMode('glyphs')}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase transition-colors ${viewMode === 'glyphs' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
             >
                <Grid size={14}/> Map
             </button>
          </div>

          {/* Font Size - Only in Type Mode */}
          {viewMode === 'type' && (
            <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
              <Type size={16} />
              <input 
                type="number" 
                value={fontSize} 
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-12 text-sm font-bold bg-transparent outline-none border-b border-transparent focus:border-black"
              />
              <span className="text-xs font-mono text-gray-500">PX</span>
            </div>
          )}
          
          {/* Alignment (Type Mode) */}
          {viewMode === 'type' && (
            <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                <button onClick={() => setAlign('left')} className={`p-2 hover:bg-gray-200 transition-colors ${align === 'left' ? 'bg-black text-white' : ''}`}><AlignLeft size={16}/></button>
                <button onClick={() => setAlign('center')} className={`p-2 hover:bg-gray-200 transition-colors ${align === 'center' ? 'bg-black text-white' : ''}`}><AlignCenter size={16}/></button>
                <button onClick={() => setAlign('right')} className={`p-2 hover:bg-gray-200 transition-colors ${align === 'right' ? 'bg-black text-white' : ''}`}><AlignRight size={16}/></button>
            </div>
          )}

           {/* Grid Size & Pagination (Map Mode) */}
           {viewMode === 'glyphs' && (
            <>
              <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                 <span className="text-[10px] font-mono uppercase text-gray-400 mr-2">Grid</span>
                 {[10, 20, 30].map(size => (
                   <button 
                     key={size}
                     onClick={() => { setMapGridSize(size); setMapPage(0); }}
                     className={`px-2 py-1 text-[10px] font-bold border border-black ${mapGridSize === size ? 'bg-black text-white' : 'bg-transparent hover:bg-gray-200'}`}
                   >
                     {size}
                   </button>
                 ))}
              </div>

              {/* Pagination Controls - Conditional Render */}
              {detectedGlyphs.length > mapGridSize * 8 && (
                <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                    <span className="text-[10px] font-mono uppercase text-gray-500 whitespace-nowrap">
                        Page {mapPage + 1}
                    </span>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setMapPage(Math.max(0, mapPage - 1))} 
                            disabled={mapPage === 0}
                            className="px-2 py-1 text-[10px] font-bold border border-black disabled:opacity-20 hover:bg-black hover:text-white transition-colors"
                        >
                            PREV
                        </button>
                        <button 
                            onClick={() => setMapPage(mapPage + 1)} 
                            disabled={(mapPage + 1) * (mapGridSize * 8) >= detectedGlyphs.length}
                            className="px-2 py-1 text-[10px] font-bold border border-black disabled:opacity-20 hover:bg-black hover:text-white transition-colors"
                        >
                            NEXT
                        </button>
                    </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Font Info (Glyph Count) - Pushed Right with Left Border */}
        <div className="flex items-center px-4 md:px-8 py-6 md:py-8 border-l border-black ml-auto">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
              {detectedGlyphs.length > 0 ? `${detectedGlyphs.length} GLYPHS` : 'LOADING...'}
            </span>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="min-h-[300px] mb-8 relative">
        {viewMode === 'type' ? (
             <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-full min-h-[300px] bg-transparent outline-none resize-none p-4 placeholder-gray-300"
                style={{
                  ...fontStyle,
                  fontSize: `${fontSize}px`,
                  textAlign: align,
                }}
                spellCheck={false}
              />
        ) : (
            <div className="w-full flex flex-col min-h-[400px]">
                {isLoadingGlyphs && <div className="p-8 font-mono text-xs">Loading Glyphs from file...</div>}
                
                {!isLoadingGlyphs && detectedGlyphs.length === 0 && (
                   <div className="p-8 font-mono text-xs text-red-500">
                      No glyphs detected. Check config.file path in Home.tsx
                   </div>
                )}

                {!isLoadingGlyphs && (
                  <div 
                      className="grid gap-px content-start w-full"
                      style={{ gridTemplateColumns: `repeat(${mapGridSize}, minmax(0, 1fr))` }}
                  >
                    {detectedGlyphs
                        .slice(mapPage * (mapGridSize * 8), (mapPage + 1) * (mapGridSize * 8))
                        .map((char, idx) => (
                        <div 
                            key={idx} 
                            className="aspect-square flex flex-col items-center justify-center hover:bg-black hover:text-white transition-colors cursor-default group"
                            title={`U+${char.codePointAt(0)?.toString(16).toUpperCase()}`}
                        >
                            <span style={{ 
                                fontFamily: config.family, 
                                fontSize: mapGridSize === 10 ? '60px' : mapGridSize === 20 ? '32px' : '20px' 
                            }}>
                                {char}
                            </span>
                        </div>
                    ))}
                  </div>
                )}
            </div>
        )}
      </div>

      {/* Settings Panel Area */}
      <div className="bg-transparent border-t border-black">
         
         {/* 1. Layout Settings (MOVED UP) - Leading & Tracking */}
         <div className="grid grid-cols-1 md:grid-cols-2 border-b border-black">
            <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8 border-b md:border-b-0 md:border-r border-black">
                <label className="w-24 font-mono text-xs font-bold uppercase shrink-0">Leading</label>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"
                />
                <span className="w-12 text-right font-mono text-xs">{lineHeight.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8">
                <label className="w-24 font-mono text-xs font-bold uppercase shrink-0">Tracking</label>
                <input
                  type="range"
                  min="-0.1"
                  max="0.5"
                  step="0.01"
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                  className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"
                />
                <span className="w-12 text-right font-mono text-xs">{letterSpacing.toFixed(2)}</span>
            </div>
         </div>

         {/* 2. Variable Axes & OpenType Features (MOVED DOWN) */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            
            <div className="md:col-span-2 space-y-4 px-4 md:px-8 py-6 md:py-8">
              <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">Variable Axes</h4>
              {/* Gunakan Detected Axes (dari File) jika ada, jika tidak fallback ke Config Manual */}
              {(detectedAxes.length > 0 ? detectedAxes : config.axes).length > 0 ? (
                (detectedAxes.length > 0 ? detectedAxes : config.axes).map((axis) => (
                  <div key={axis.tag} className="flex items-center gap-4">
                    <label className="w-16 font-mono text-xs font-bold uppercase truncate" title={axis.name}>{axis.name}</label>
                    <input
                      type="range"
                      min={axis.min}
                      max={axis.max}
                      step={axis.step || 1} // Detected axes biasanya tidak punya step, default 1
                      value={axesValues[axis.tag] !== undefined ? axesValues[axis.tag] : axis.default}
                      onChange={(e) => handleAxisChange(axis.tag, parseFloat(e.target.value))}
                      className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"
                    />
                    <span className="w-12 text-right font-mono text-xs">
                      {axesValues[axis.tag] !== undefined ? Math.round(axesValues[axis.tag]) : axis.default}
                      {/* Detected axes tidak punya unit string, jadi kosongkan atau hardcode jika perlu */}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No variable axes detected.</p>
              )}
            </div>

            {/* OpenType Features Toggles */}
            <div className="md:col-span-1 border-l border-black px-4 md:px-8 py-6 md:py-8">
              <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">OpenType Features</h4>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {/* Fix: Gunakan 'dynamicFeatures' (Scan File) bukan 'config.features' (Manual Home.tsx) */}
                {dynamicFeatures.length > 0 ? (
                  dynamicFeatures.map((feat) => (
                    <label key={feat.tag} className="flex items-center justify-between cursor-pointer group select-none">
                      <span className="text-sm font-bold uppercase group-hover:text-gray-600 transition-colors">
                        {feat.name} 
                        {/* Fix: Hapus counter angka, ganti dengan Tag Code (misal .liga) */}
                        <span className="text-gray-400 font-mono text-xs ml-2">.{feat.tag}</span>
                      </span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={activeFeatures[feat.tag] || false}
                          onChange={() => toggleFeature(feat.tag)}
                        />
                        {/* CUSTOM TOGGLE STYLE */}
                        <div className="w-9 h-5 rounded-full peer-focus:outline-none 
                                    bg-transparent border border-black 
                                    peer-checked:bg-black peer-checked:border-black
                                    after:content-[''] after:absolute after:top-[3px] after:left-[3px] 
                                    after:bg-black after:border-gray-300 after:rounded-full 
                                    after:h-3.5 after:w-3.5 after:transition-all 
                                    peer-checked:after:translate-x-full peer-checked:after:bg-white"></div>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">
                     {isLoadingGlyphs ? 'Scanning font file...' : 'No features detected.'}
                  </p>
                )}
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TypeTester;