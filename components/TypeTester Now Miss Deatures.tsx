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
  const [text, setText] = useState(defaultText);
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
    const currentFiles = Array.isArray(config.font_files) ? config.font_files : [config.file_url];
    const targetFile = currentFiles[activeStyleIndex] ? `/api/fonts/${currentFiles[activeStyleIndex]}` : config.file;
    
    if (!targetFile) return;

    setIsLoadingGlyphs(true);

    opentype.load(targetFile, (err, font) => {
      setIsLoadingGlyphs(false);
      if (err || !font) {
        console.error('Could not load font:', err);
        return;
      }

      // 1. Glyphs
      const glyphs: string[] = [];
      for (let i = 0; i < font.glyphs.length && i < 600; i++) {
        const glyph = font.glyphs.get(i);
        if (glyph.unicode) glyphs.push(String.fromCharCode(glyph.unicode));
      }
      setDetectedGlyphs(glyphs);

      // 2. Axes
      if (font.tables.fvar?.axes?.length > 0) {
          const autoAxes = font.tables.fvar.axes.map((axis: any) => ({
              tag: axis.tag,
              name: axis.name?.en || axis.tag,
              min: axis.minValue,
              max: axis.maxValue,
              default: axis.defaultValue
          }));
          setDetectedAxes(autoAxes);

          const newAxesValues: Record<string, number> = {};
          autoAxes.forEach((axis: any) => {
              newAxesValues[axis.tag] = axis.default;
          });
          setAxesValues(prev => ({ ...prev, ...newAxesValues }));
      }

      // 3. Features
      const foundTags = new Set<string>();
      if (font.tables.gsub?.features) {
        font.tables.gsub.features.forEach((f: any) => {
           if (f.tag && ALLOWED_TAGS.has(f.tag)) foundTags.add(f.tag);
        });
      }

      const detectedList = Array.from(foundTags).sort().map(tag => {
        const configFeature = config.features?.find(cf => cf.tag === tag);
        if (configFeature) return { tag, name: configFeature.name };
        if (FEATURE_NAMES[tag]) return { tag, name: FEATURE_NAMES[tag] };
        if (tag.startsWith('ss')) return { tag, name: `Stylistic Set ${parseInt(tag.slice(2))}` };
        return { tag, name: tag.toUpperCase() };
      });
      setDynamicFeatures(detectedList);

      const detectedActive: Record<string, boolean> = {};
      foundTags.forEach(tag => {
        if (['liga', 'calt'].includes(tag)) detectedActive[tag] = true;
      });
      setActiveFeatures(prev => ({ ...prev, ...detectedActive }));
    });
  }, [config.file, activeStyleIndex]); // Ditambahkan activeStyleIndex agar font reload saat style berubah

  // --- EFFECT: RESET ON CONFIG CHANGE ---
  useEffect(() => {
    const initialAxes: Record<string, number> = {};
    if (config.axes) {
      config.axes.forEach(axis => initialAxes[axis.tag] = axis.default);
    }
    setAxesValues(initialAxes);

    const initialFeatures: Record<string, boolean> = {};
    if (config.features) {
      config.features.forEach(feat => {
        initialFeatures[feat.tag] = ['liga', 'calt', 'kern'].includes(feat.tag);
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

  const fontStyle = {
    fontFamily: `"${config.name}-${activeStyleIndex}"`,
    fontVariationSettings: Object.entries(axesValues).map(([tag, val]) => `"${tag}" ${val}`).join(', '),
    fontFeatureSettings: Object.entries(activeFeatures).length > 0 
      ? Object.entries(activeFeatures).map(([tag, active]) => `"${tag}" ${active ? 'on' : 'off'}`).join(', ')
      : 'normal',
    lineHeight: lineHeight,
    letterSpacing: `${letterSpacing}em`,
  };

  return (
    <div className="w-full mb-16 border-b border-black relative group">
      <div 
        className="absolute z-0 pointer-events-none overflow-visible"
        style={{
            left: isEven ? '-380px' : 'auto',
            right: isEven ? 'auto' : '-380px',
            top: '15%',
            width: '600px', 
            height: '400px'
        }}
      >
          <div 
            className="w-full h-full mix-blend-multiply blur-[60px]"
            style={{ background: 'radial-gradient(closest-side, rgba(255, 80, 80, 0.8) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(253, 186, 116, 0) 100%)' }}
          />
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-stretch justify-between border-b border-black bg-white/10 backdrop-blur-[2px]">
          <div className="flex items-stretch">
            <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
               <button onClick={() => setViewMode('type')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase ${viewMode === 'type' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}>
                  <Keyboard size={14}/> Type
               </button>
               <button onClick={() => setViewMode('glyphs')} className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase ${viewMode === 'glyphs' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}>
                  <Grid size={14}/> Map
               </button>
            </div>

            {viewMode === 'type' && (
              <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                <Type size={16} />
                <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-12 text-sm font-bold bg-transparent outline-none" />
                <span className="text-xs font-mono text-gray-500">PX</span>
              </div>
            )}
            
            {viewMode === 'type' && (
              <div className="flex items-center gap-2 px-4 md:px-8 py-6 md:py-8 border-r border-black">
                  <button onClick={() => setAlign('left')} className={`p-2 ${align === 'left' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignLeft size={16}/></button>
                  <button onClick={() => setAlign('center')} className={`p-2 ${align === 'center' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignCenter size={16}/></button>
                  <button onClick={() => setAlign('right')} className={`p-2 ${align === 'right' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignRight size={16}/></button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6 px-4 md:px-8 py-6 md:py-8 border-l border-black ml-auto">
              {Array.isArray(config.font_files) && config.font_files.length > 1 && (
                <div className="flex items-center gap-2 border-r border-black pr-6">
                  <span className="font-mono text-[10px] text-gray-400 uppercase">Style</span>
                  <select value={activeStyleIndex} onChange={(e) => setActiveStyleIndex(parseInt(e.target.value))} className="bg-transparent font-bold text-xs uppercase outline-none">
                    {config.font_files.map((_, i) => <option key={i} value={i}>Style 0{i+1}</option>)}
                  </select>
                </div>
              )}
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                {isLoadingGlyphs ? 'LOADING...' : `${config.styleCount || 1} STYLES / ${detectedGlyphs.length} GLYPHS`}
              </span>
          </div>
        </div>

        <div className="min-h-[300px] mb-8 relative">
          {viewMode === 'type' ? (
              <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-full min-h-[300px] bg-transparent outline-none resize-none p-4 relative z-10"
                  style={{ ...fontStyle, fontSize: `${fontSize}px`, textAlign: align }}
                  spellCheck={false}
                />
          ) : (
              <div className="w-full grid gap-px content-start" style={{ gridTemplateColumns: `repeat(${mapGridSize}, minmax(0, 1fr))` }}>
                {detectedGlyphs.slice(mapPage * (mapGridSize * 8), (mapPage + 1) * (mapGridSize * 8)).map((char, idx) => (
                    <div key={idx} className="aspect-square flex items-center justify-center hover:bg-black hover:text-white cursor-default">
                        <span style={{ fontFamily: config.family, fontSize: mapGridSize === 10 ? '60px' : '20px' }}>{char}</span>
                    </div>
                ))}
              </div>
          )}
        </div>

        <div className="bg-transparent border-t border-black">
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-black">
              <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8 border-b md:border-b-0 md:border-r border-black">
                  <label className="w-24 font-mono text-xs font-bold uppercase">Leading</label>
                  <input type="range" min="0.8" max="2.0" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="flex-grow accent-black"/>
                  <span className="w-12 text-right font-mono text-xs">{lineHeight.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8">
                  <label className="w-24 font-mono text-xs font-bold uppercase">Tracking</label>
                  <input type="range" min="-0.1" max="0.5" step="0.01" value={letterSpacing} onChange={(e) => setLetterSpacing(parseFloat(e.target.value))} className="flex-grow accent-black"/>
                  <span className="w-12 text-right font-mono text-xs">{letterSpacing.toFixed(2)}</span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4 px-4 md:px-8 py-6 md:py-8">
                <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">Variable Axes</h4>
                {(detectedAxes.length > 0 ? detectedAxes : (config.axes || [])).map((axis: any) => (
                  <div key={axis.tag} className="flex items-center gap-4">
                    <label className="w-16 font-mono text-xs font-bold uppercase truncate">{axis.name}</label>
                    <input type="range" min={axis.min} max={axis.max} step={1} value={axesValues[axis.tag] ?? axis.default} onChange={(e) => handleAxisChange(axis.tag, parseFloat(e.target.value))} className="flex-grow accent-black"/>
                    <span className="w-12 text-right font-mono text-xs">{Math.round(axesValues[axis.tag] ?? axis.default)}</span>
                  </div>
                ))}
              </div>

              <div className="md:col-span-1 border-l border-black px-4 md:px-8 py-6 md:py-8">
                <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">Features</h4>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {dynamicFeatures.map((feat) => (
                    <label key={feat.tag} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm font-bold uppercase group-hover:text-gray-600">
                        {feat.name} <span className="text-gray-400 font-mono text-xs ml-2">.{feat.tag}</span>
                      </span>
                      <input type="checkbox" className="accent-black" checked={activeFeatures[feat.tag] || false} onChange={() => toggleFeature(feat.tag)} />
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