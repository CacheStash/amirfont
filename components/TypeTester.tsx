import React, { useState, useEffect } from 'react';
import { RefreshCw, AlignLeft, AlignCenter, AlignRight, Type, Grid, Keyboard } from 'lucide-react';
import { FontConfig } from '../types';

interface TypeTesterProps {
  config: FontConfig;
  defaultText?: string;
}

// Daftar karakter umum untuk Character Map
const BASIC_GLYPHS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ..."abcdefghijklmnopqrstuvwxyz".split(""),
  ..."0123456789".split(""),
  ..."!@#$%^&*()_+-=[]{}|;':,./<>?".split(""),
  ..."ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ".split("")
];

const TypeTester: React.FC<TypeTesterProps> = ({ config, defaultText = "The quick brown fox jumps over the lazy dog." }) => {
  const [text, setText] = useState(defaultText);
  const [fontSize, setFontSize] = useState(64);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [viewMode, setViewMode] = useState<'type' | 'glyphs'>('type'); // Toggle View
  
  const [axesValues, setAxesValues] = useState<Record<string, number>>({});
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({});

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
      .map(([tag, isActive]) => `"${tag}" ${isActive ? 1 : 0}`);
    
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
    <div className="border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-16">
      
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
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
                className="w-full h-full min-h-[300px] bg-transparent outline-none resize-none p-4"
                style={{
                  ...fontStyle,
                  fontSize: `${fontSize}px`,
                  textAlign: align,
                }}
                spellCheck={false}
              />
        ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2 p-4 border border-gray-100 bg-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                {BASIC_GLYPHS.map((char, idx) => (
                    <div 
                        key={idx} 
                        className="aspect-square flex flex-col items-center justify-center bg-white border border-gray-200 hover:border-black hover:shadow-md transition-all cursor-default group"
                    >
                        <span style={{ ...fontStyle, fontSize: '32px' }}>{char}</span>
                        <span className="text-[8px] font-mono text-gray-400 mt-1 opacity-0 group-hover:opacity-100">{char.codePointAt(0)?.toString(16).toUpperCase()}</span>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50 p-6 border-t border-black">
        
        {/* Variable Axes Sliders */}
        <div className="md:col-span-2 space-y-4">
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
        <div className="md:col-span-1 border-l border-gray-300 pl-0 md:pl-8">
          <h4 className="font-mono text-xs uppercase text-gray-500 mb-4">OpenType Features</h4>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
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
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
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