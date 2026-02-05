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

  // 1. Load Font Glyphs menggunakan opentype.js
  useEffect(() => {
    if (!config.file) return;

    setIsLoadingGlyphs(true);
    setDetectedGlyphs([]); // Reset

    opentype.load(config.file, (err, font) => {
      setIsLoadingGlyphs(false);
      if (err) {
        console.error('Could not load font: ' + err);
        return;
      }
      if (!font) return;

      const glyphs: string[] = [];
      // Loop melalui glyphs (limit 2000 untuk performa jika font CJK)
      for (let i = 0; i < font.glyphs.length && i < 600; i++) {
        const glyph = font.glyphs.get(i);
        // Hanya ambil glyph yang memiliki unicode (karakter terbaca)
        if (glyph.unicode) {
          glyphs.push(String.fromCharCode(glyph.unicode));
        }
      }
      setDetectedGlyphs(glyphs);
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
  };

  const fontStyle = {
    fontFamily: config.family,
    fontVariationSettings: getFontVariationSettings(),
    fontFeatureSettings: getFontFeatureSettings(),
  };

  return (
    <div className="w-full mb-16">
      
      {/* Controls Header */}
      {/* Update Padding Header: pt-8 agar sejajar font name, px-8 kiri/kanan */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-0 border-b border-black pb-4 pt-6 px-4 md:pt-8 md:px-8">
        <div className="flex items-center gap-4">
            
          {/* View Mode Toggle (Type vs Map) */}
          <div className="flex border border-black p-1 gap-1">
             <button 
                onClick={() => setViewMode('type')}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase ${viewMode === 'type' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
             >
                <Keyboard size={14}/> Type
             </button>
             <button 
                onClick={() => setViewMode('glyphs')}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase ${viewMode === 'glyphs' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
             >
                <Grid size={14}/> Map
             </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <div className="flex items-center gap-2 border border-black px-2 py-1">
            <Type size={16} />
            <input 
              type="number" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-12 text-sm font-bold bg-transparent outline-none"
            />
            <span className="text-xs font-mono text-gray-500">PX</span>
          </div>
          
          {viewMode === 'type' && (
            <div className="flex border border-black">
                <button onClick={() => setAlign('left')} className={`p-2 hover:bg-gray-100 ${align === 'left' ? 'bg-black text-white' : ''}`}><AlignLeft size={16}/></button>
                <button onClick={() => setAlign('center')} className={`p-2 hover:bg-gray-100 ${align === 'center' ? 'bg-black text-white' : ''}`}><AlignCenter size={16}/></button>
                <button onClick={() => setAlign('right')} className={`p-2 hover:bg-gray-100 ${align === 'right' ? 'bg-black text-white' : ''}`}><AlignRight size={16}/></button>
            </div>
          )}
        </div>

        <button onClick={resetSettings} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:text-red-500 transition-colors">
          <RefreshCw size={14} /> Reset
        </button>
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-px bg-gray-200 border border-black max-h-[500px] overflow-y-auto custom-scrollbar p-0.5">
                {isLoadingGlyphs && <div className="p-4 col-span-full font-mono text-xs">Loading Glyphs from file...</div>}
                
                {!isLoadingGlyphs && detectedGlyphs.length === 0 && (
                   <div className="p-4 col-span-full font-mono text-xs text-red-500">
                      No glyphs detected. Check config.file path in Home.tsx
                   </div>
                )}

                {detectedGlyphs.map((char, idx) => (
                    <div 
                        key={idx} 
                        className="aspect-square flex flex-col items-center justify-center bg-white hover:bg-black hover:text-white transition-colors cursor-default group"
                        title={`U+${char.codePointAt(0)?.toString(16).toUpperCase()}`}
                    >
                        <span style={{ fontFamily: config.family, fontSize: '24px' }}>{char}</span>
                    </div>
                ))}
            </div>
        )}
            </div>

      {/* Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-transparent pt-6 border-t border-black">
        
        <div className="md:col-span-2 space-y-4 pl-4 md:pl-8 pb-8">
          <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">Variable Axes</h4>
          {config.axes.length > 0 ? (
            config.axes.map((axis) => (
              <div key={axis.tag} className="flex items-center gap-4">
                <label className="w-16 font-mono text-xs font-bold uppercase">{axis.name}</label>
                <input
                  type="range"
                  min={axis.min}
                  max={axis.max}
                  step={axis.step || 1}
                  value={axesValues[axis.tag] || axis.default}
                  onChange={(e) => handleAxisChange(axis.tag, parseFloat(e.target.value))}
                  className="flex-grow h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <span className="w-12 text-right font-mono text-xs">
                  {axesValues[axis.tag]}
                  {axis.unit}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic">No variable axes available.</p>
          )}
        </div>

        {/* OpenType Features Toggles */}
        <div className="md:col-span-1 border-l border-gray-300 pl-4 md:pl-8 pr-4 md:pr-8 pb-8">
          <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">OpenType Features</h4>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
            {config.features && config.features.length > 0 ? (
              config.features.map((feat) => (
                <label key={feat.tag} className="flex items-center justify-between cursor-pointer group select-none">
                  <span className="text-sm font-bold uppercase group-hover:text-gray-600 transition-colors">
                    {feat.name} <span className="text-gray-400 font-mono text-xs ml-1">.{feat.tag}</span>
                  </span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={activeFeatures[feat.tag] || false}
                      onChange={() => toggleFeature(feat.tag)}
                    />
                    {/* CUSTOM TOGGLE STYLE: Off=Border Black+BgWeb, On=BgBlack. Circle reversed. */}
                    <div className="w-9 h-5 rounded-full peer-focus:outline-none 
                                    bg-[#EDEBE6] border border-black 
                                    peer-checked:bg-black peer-checked:border-black
                                    after:content-[''] after:absolute after:top-[3px] after:left-[3px] 
                                    after:bg-black after:border-gray-300 after:rounded-full 
                                    after:h-3.5 after:w-3.5 after:transition-all 
                                    peer-checked:after:translate-x-full peer-checked:after:bg-white"></div>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No features defined.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TypeTester;