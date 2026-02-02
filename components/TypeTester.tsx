import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Type, AlignLeft, AlignCenter, AlignRight, Maximize2, Settings2, Grid3X3, ArrowLeft, ArrowRight, Keyboard } from 'lucide-react';
import { BrutalistSlider } from './BrutalistSlider';
import { BrutalistToggle } from './BrutalistToggle';
import { FontConfig, FontSettings } from '../types';

interface TypeTesterProps {
  config: FontConfig;
  defaultText?: string;
}

const DEFAULT_TEXT_CONTENT = "The quick brown fox jumps over the lazy dog.\nType something here to test the font.";

// Generate character ranges for the glyph map
const generateGlyphs = () => {
  const glyphs: string[] = [];
  // Basic Latin
  for (let i = 33; i <= 126; i++) glyphs.push(String.fromCharCode(i));
  // Latin-1 Supplement
  for (let i = 161; i <= 255; i++) glyphs.push(String.fromCharCode(i));
  return glyphs;
};

const ALL_GLYPHS = generateGlyphs();
const GLYPHS_PER_PAGE = 60; // Grid layout optimization

export const TypeTester: React.FC<TypeTesterProps> = ({ 
  config,
  defaultText = DEFAULT_TEXT_CONTENT
}) => {
  const [text, setText] = useState<string>(defaultText);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [viewMode, setViewMode] = useState<'type' | 'glyphs'>('type');
  const [glyphPage, setGlyphPage] = useState(0);
  
  // -- INITIALIZATION LOGIC --
  // We use a function to ensure this runs correctly for each instance
  const getInitialSettings = (): FontSettings => {
    const initialAxes: Record<string, number> = {};
    config.axes.forEach(axis => {
      initialAxes[axis.tag] = axis.default;
    });

    const initialFeatures: Record<string, boolean> = {};
    config.features.forEach(feat => {
      initialFeatures[feat.tag] = feat.default || false;
    });

    return {
      fontSize: 64,
      lineHeight: 1.1,
      letterSpacing: 0,
      axisValues: initialAxes,
      featureStates: initialFeatures
    };
  };

  const [settings, setSettings] = useState<FontSettings>(getInitialSettings);

  // Reset settings if the config prop completely changes (rare but good practice)
  useEffect(() => {
    setSettings(getInitialSettings());
  }, [config.name]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current && viewMode === 'type') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text, settings.fontSize, settings.lineHeight, viewMode]);

  // Handler for standard CSS props
  const updateStandardSetting = (key: keyof Pick<FontSettings, 'fontSize' | 'lineHeight' | 'letterSpacing'>, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handler for Variable Axes
  const updateAxis = (tag: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      axisValues: { ...prev.axisValues, [tag]: value }
    }));
  };

  // Handler for OpenType Features
  const toggleFeature = (tag: string) => {
    setSettings(prev => ({
      ...prev,
      featureStates: { ...prev.featureStates, [tag]: !prev.featureStates[tag] }
    }));
  };

  const resetSettings = () => {
    setSettings(getInitialSettings());
    setText(defaultText);
    setAlignment('left');
    setGlyphPage(0);
  };

  // -- CSS GENERATION --
  
  // Construct font-variation-settings string
  const variationString = Object.entries(settings.axisValues)
    .map(([tag, val]) => `"${tag}" ${val}`)
    .join(', ');

  // Construct font-feature-settings string
  // IMPORTANT: We explicitly set "tag" 1 or "tag" 0 to force the browser to obey
  const featureString = Object.entries(settings.featureStates)
    .map(([tag, isActive]) => `"${tag}" ${isActive ? 1 : 0}`)
    .join(', ');

  const fontStyle: React.CSSProperties = {
    fontFamily: `${config.family}, sans-serif`,
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    letterSpacing: `${settings.letterSpacing}em`,
    textAlign: alignment,
    fontVariationSettings: variationString || 'normal',
    fontFeatureSettings: featureString || 'normal',
    // Force ligatures to respond to feature settings
    fontVariantLigatures: 'common-ligatures contextual', 
    transition: 'all 0.2s ease',
  };

  // Helper to determine active font type for badges
  const isVariable = config.axes.length > 0;
  const hasFeatures = config.features.length > 0;

  // Glyph Pagination Logic
  const totalGlyphPages = Math.ceil(ALL_GLYPHS.length / GLYPHS_PER_PAGE);
  const currentGlyphs = ALL_GLYPHS.slice(
    glyphPage * GLYPHS_PER_PAGE,
    (glyphPage + 1) * GLYPHS_PER_PAGE
  );

  return (
    <div className="relative w-full bg-white flex flex-col min-h-[60vh] font-sans border-2 border-black">
      
      {/* Header / Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center border-b-2 border-black bg-white z-10 sticky top-0">
        <div className="flex items-center gap-3 p-4 border-b md:border-b-0 md:border-r-2 border-black">
            <Type className="w-5 h-5" />
            <span className="font-bold tracking-tight text-lg uppercase">{config.name}</span>
            <div className="flex gap-1 ml-2">
              {isVariable && <span className="text-[10px] bg-black text-white px-2 py-0.5 font-mono uppercase">Var</span>}
              {hasFeatures && <span className="text-[10px] border border-black text-black px-2 py-0.5 font-mono uppercase">OTF</span>}
              {!isVariable && !hasFeatures && <span className="text-[10px] border border-black text-black px-2 py-0.5 font-mono uppercase">Static</span>}
            </div>
        </div>
        
        <div className="flex flex-1 justify-end">
            <div className="flex border-l-0 md:border-l-2 border-black divide-x-2 divide-black w-full md:w-auto">
                {/* View Mode Toggle */}
                <button 
                    onClick={() => setViewMode(viewMode === 'type' ? 'glyphs' : 'type')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 font-mono text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors ${viewMode === 'glyphs' ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                    {viewMode === 'type' ? <Grid3X3 size={14} /> : <Keyboard size={14} />}
                    {viewMode === 'type' ? 'View Map' : 'Type Mode'}
                </button>

                {/* Alignment Controls (Only visible in Type mode) */}
                {viewMode === 'type' && (
                  <>
                    <button 
                        onClick={() => setAlignment('left')}
                        className={`px-4 py-3 hover:bg-black hover:text-white transition-colors ${alignment === 'left' ? 'bg-black text-white' : ''}`}
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setAlignment('center')}
                        className={`px-4 py-3 hover:bg-black hover:text-white transition-colors ${alignment === 'center' ? 'bg-black text-white' : ''}`}
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button 
                        onClick={() => setAlignment('right')}
                        className={`px-4 py-3 hover:bg-black hover:text-white transition-colors ${alignment === 'right' ? 'bg-black text-white' : ''}`}
                    >
                        <AlignRight size={16} />
                    </button>
                  </>
                )}
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow relative w-full bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
        
        {viewMode === 'type' ? (
          /* TYPE VIEW */
          <div className="relative w-full h-full overflow-hidden">
             <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start typing..."
              spellCheck={false}
              className="w-full h-full min-h-[40vh] bg-transparent resize-none outline-none p-8 md:p-16 text-black placeholder:text-gray-300 overflow-hidden"
              style={fontStyle}
            />
            <div className="absolute top-0 left-8 w-px h-full bg-gray-200 pointer-events-none hidden md:block" />
            <div className="absolute top-0 right-8 w-px h-full bg-gray-200 pointer-events-none hidden md:block" />
          </div>
        ) : (
          /* GLYPHS VIEW (CHARACTER MAP) */
          <div className="w-full h-full p-0 flex flex-col">
             <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 border-l border-t border-gray-200 bg-white">
                {currentGlyphs.map((glyph, i) => (
                  <div key={i} className="aspect-square flex flex-col items-center justify-center border-r border-b border-gray-200 hover:bg-black hover:text-white transition-colors group overflow-hidden relative cursor-default">
                      <span 
                        className="text-2xl md:text-3xl" 
                        style={{ 
                          ...fontStyle, 
                          fontSize: undefined, 
                          lineHeight: undefined,
                          marginBottom: '0.25rem'
                        }}
                      >
                        {glyph}
                      </span>
                      <span className="absolute bottom-1 right-1 text-[8px] font-mono text-gray-400 group-hover:text-gray-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {glyph.charCodeAt(0)}
                      </span>
                  </div>
                ))}
             </div>
             
             {/* Pagination Controls */}
             <div className="flex items-center justify-between border-t-2 border-black p-4 bg-white mt-auto sticky bottom-0">
                <button 
                  onClick={() => setGlyphPage(p => Math.max(0, p - 1))}
                  disabled={glyphPage === 0}
                  className="flex items-center gap-2 font-mono text-xs uppercase font-bold disabled:opacity-20 hover:underline"
                >
                  <ArrowLeft size={14} /> Prev
                </button>
                <span className="font-mono text-xs font-bold">
                  PAGE {glyphPage + 1} / {totalGlyphPages}
                </span>
                <button 
                  onClick={() => setGlyphPage(p => Math.min(totalGlyphPages - 1, p + 1))}
                  disabled={glyphPage === totalGlyphPages - 1}
                  className="flex items-center gap-2 font-mono text-xs uppercase font-bold disabled:opacity-20 hover:underline"
                >
                  Next <ArrowRight size={14} />
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Sticky Control Panel (Toolbar) */}
      <div className="sticky bottom-0 z-20 bg-white border-t-2 border-black p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column */}
          <div className="md:col-span-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Standard Sliders */}
            <BrutalistSlider
              label="Size"
              value={settings.fontSize}
              min={12}
              max={200}
              unit="px"
              onChange={(v) => updateStandardSetting('fontSize', v)}
            />

             <BrutalistSlider
              label="Leading"
              value={settings.lineHeight}
              min={0.8}
              max={2.0}
              step={0.1}
              onChange={(v) => updateStandardSetting('lineHeight', v)}
            />

            {/* Dynamic Variable Axis Sliders */}
            {config.axes.map((axis) => (
               <BrutalistSlider
                key={axis.tag}
                label={axis.name}
                value={settings.axisValues[axis.tag] ?? axis.default}
                min={axis.min}
                max={axis.max}
                step={axis.step || 1}
                unit={axis.unit}
                onChange={(v) => updateAxis(axis.tag, v)}
              />
            ))}

            {/* Dynamic Feature Toggles */}
            {config.features.length > 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col gap-3 p-3 border border-gray-200 bg-gray-50 h-full justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Settings2 size={12} className="text-gray-500"/>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">OpenType</span>
                </div>
                {config.features.map(feat => (
                  <BrutalistToggle
                    key={feat.tag}
                    label={feat.name}
                    isActive={settings.featureStates[feat.tag]}
                    onToggle={() => toggleFeature(feat.tag)}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Actions Column */}
          <div className="md:col-span-2 flex flex-row md:flex-col gap-3 justify-end h-full">
            <button 
                onClick={resetSettings}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-black font-mono text-xs uppercase font-bold hover:bg-black hover:text-white transition-all active:translate-y-0.5"
            >
                <RefreshCw size={14} />
                Reset
            </button>
            <button 
                className="hidden md:flex items-center justify-center gap-2 w-full px-4 py-3 bg-black text-white border-2 border-black font-mono text-xs uppercase font-bold hover:bg-white hover:text-black transition-all active:translate-y-0.5"
            >
                <Maximize2 size={14} />
                Buy
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};