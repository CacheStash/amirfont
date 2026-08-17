import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Type, Grid, Keyboard, ChevronDown, ChevronLeft, ChevronRight, Layers, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { FontConfig } from '../types';
import opentype from 'opentype.js';

interface TypeTesterProps {
  config: FontConfig & { 
    metadata?: { 
      primary_font_index?: number;
      is_layered?: boolean;
      layer_font_indices?: number[];
    } 
  };
  defaultText?: string;
  isEven?: boolean;
}

interface FontLayerItem {
  id: string;
  fontIndex: number;
  isInverted: boolean;
  isVisible: boolean;
  color?: string;
}

interface AlternateGlyph {
  char: string;
  glyphIndex: number;
  featureTag: string;
}

const TypeTester: React.FC<TypeTesterProps> = ({ 
  config, 
  defaultText = "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.",
  isEven = true 
}) => {
  const [text, setText] = useState(config.randomText || defaultText);
  const [charOverrides, setCharOverrides] = useState<Record<number, string>>({});
  const [glyphOverrides, setGlyphOverrides] = useState<Record<number, number>>({});
  const [fontSize, setFontSize] = useState(64);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [viewMode, setViewMode] = useState<'type' | 'glyphs'>('type');
  
  // Fitur Layered
  const isLayeredSupported = !!config.metadata?.is_layered && Array.isArray(config.font_files) && config.font_files.length > 1;
  const [isLayeredMode, setIsLayeredMode] = useState<boolean>(false);
  const [layers, setLayers] = useState<FontLayerItem[]>([
    { id: 'layer-top', fontIndex: config.metadata?.primary_font_index || 0, isInverted: false, isVisible: true, color: '#000000' },
    ...(Array.isArray(config.font_files) && config.font_files.length > 1
      ? [{ id: 'layer-bottom', fontIndex: (config.metadata?.primary_font_index || 0) === 0 ? 1 : 0, isInverted: false, isVisible: true, color: '#888888' }]
      : [])
  ]);
  const [draggedLayerIdx, setDraggedLayerIdx] = useState<number | null>(null);
  const [isAddLayerOpen, setIsAddLayerOpen] = useState(false);

  const layerContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [detectedGlyphs, setDetectedGlyphs] = useState<any[]>([]); 
  const [filteredGlyphs, setFilteredGlyphs] = useState<any[]>([]); 
  const [isLoadingGlyphs, setIsLoadingGlyphs] = useState(false);
  const [detectedAxes, setDetectedAxes] = useState<any[]>([]);
  const [axesValues, setAxesValues] = useState<Record<string, number>>({});
  
  const [activeStyleIndex, setActiveStyleIndex] = useState(config.metadata?.primary_font_index || 0);
  const [detectedStyleNames, setDetectedStyleNames] = useState<Record<number, string>>({});

  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({});
  const [dynamicFeatures, setDynamicFeatures] = useState<{ tag: string; name: string }[]>([]);
  
  const [lineHeight, setLineHeight] = useState(1.1);
  const [letterSpacing, setLetterSpacing] = useState(0);
  
  const [mapPage, setMapPage] = useState(0);
  const [mapGridSize, setMapGridSize] = useState(10);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const PRESET_SIZES = [12, 14, 16, 18, 20, 24, 32, 36, 48, 64, 72, 96, 120, 144, 200];

  // Alternates State Cache
  const [loadedFontObj, setLoadedFontObj] = useState<opentype.Font | null>(null);
  const [loadedFontsMap, setLoadedFontsMap] = useState<Record<number, opentype.Font>>({});
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [alternateGlyphs, setAlternateGlyphs] = useState<AlternateGlyph[]>([]);
  const [selectedCharIndex, setSelectedCharIndex] = useState<number | null>(null);

  const FEATURE_NAMES: Record<string, string> = {
    liga: 'Standard Ligatures',
    dlig: 'Discretionary Lig',
    calt: 'Contextual Alt',
    salt: 'Stylistic Alt',
    swsh: 'Swash',
    titl: 'Titling Alt'
  };

  // DI-DISABLE: 'aalt' sudah dicabut dari list ALLOWED_TAGS
  const ALLOWED_TAGS = new Set([
      'liga', 'dlig', 'calt', 'salt', 'swsh', 'titl',
      ...Array.from({ length: 20 }, (_, i) => `ss${String(i + 1).padStart(2, '0')}`) 
  ]);

  const rowsPerPage = mapGridSize === 10 ? 3 : mapGridSize === 20 ? 5 : 7;
  const glyphsPerPage = mapGridSize * rowsPerPage;

  const availableLayerIndices: number[] = React.useMemo(() => {
    if (!Array.isArray(config.font_files)) return [];
    if (config.metadata?.layer_font_indices && config.metadata.layer_font_indices.length > 0) {
      return config.metadata.layer_font_indices;
    }
    return config.font_files.map((_, idx) => idx);
  }, [config.font_files, config.metadata?.layer_font_indices]);

  // Sync scroll on Layer mode switch
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      textareaRef.current.scrollLeft = 0;
    }
    Object.values(layerContainerRefs.current).forEach((el) => {
      if (el) {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
    });
  }, [isLayeredMode]);

  useLayoutEffect(() => {
    if (!textareaRef.current) return;
    const currentTop = textareaRef.current.scrollTop;
    const currentLeft = textareaRef.current.scrollLeft;

    Object.values(layerContainerRefs.current).forEach((el) => {
      if (el) {
        el.scrollTop = currentTop;
        el.scrollLeft = currentLeft;
      }
    });
  }, [layers]);

  useEffect(() => {
    const files = Array.isArray(config.font_files) ? config.font_files : [];
    if (files.length === 0) return;

    const configAny = config as any;
    const version = new Date(configAny.updated_at || configAny.created_at || Date.now()).getTime();

    files.forEach((file, index) => {
      const url = file.startsWith('http') || file.startsWith('/') ? file : `/api/fonts/${file}?v=${version}`;
      const fontNameIdentifier = `${config.name}-${index}`;

      try {
        const fontFace = new FontFace(fontNameIdentifier, `url("${url}")`);
        fontFace.load().then((loadedFace) => {
          document.fonts.add(loadedFace);
        }).catch((err) => console.error(err));
      } catch (e) {
        console.error("FontFace API error:", e);
      }

      if (detectedStyleNames[index] && loadedFontsMap[index]) return;

      opentype.load(url, (err, font) => {
        if (!err && font) {
          const names = font.names as any;
          const isVariable = font.tables.fvar?.axes?.length > 0;
          const detectedName = names.preferredSubfamily?.en || names.fontSubfamily?.en;
          const styleName = isVariable ? "Variable" : detectedName;

          if (styleName) {
            setDetectedStyleNames(prev => ({ ...prev, [index]: styleName }));
          }
          setLoadedFontsMap(prev => ({ ...prev, [index]: font }));
        }
      });
    });
  }, [config.font_files])

  useEffect(() => {
    let targetFile = '';
    const files = Array.isArray(config.font_files) && config.font_files.length > 0 
      ? config.font_files 
      : (config.file_url ? [config.file_url] : (config.file ? [config.file] : []));

    if (files[activeStyleIndex]) {
       const f = files[activeStyleIndex];
       const configAny = config as any;
       const version = new Date(configAny.updated_at || configAny.created_at || Date.now()).getTime();
       targetFile = f.startsWith('http') || f.startsWith('/') ? f : `/api/fonts/${f}?v=${version}`;
    }
    if (!targetFile) return;

    setIsLoadingGlyphs(true);
    
    opentype.load(targetFile, (err, font) => {
      setIsLoadingGlyphs(false);
      if (err || !font) return;

      setLoadedFontObj(font);
      const names = font.names as any;
      const isVariable = font.tables.fvar?.axes?.length > 0;
      const detectedName = names.preferredSubfamily?.en || names.fontSubfamily?.en;
      const rawStyleName = isVariable ? "Variable" : detectedName;
      
      if (rawStyleName) {
        setDetectedStyleNames(prev => ({ ...prev, [activeStyleIndex]: rawStyleName }));
      }

      const glyphs = [];
      for (let i = 0; i < font.glyphs.length && i < 2500; i++) { 
        const glyph = font.glyphs.get(i);
        if (!glyph) continue;
        if (glyph.name === '.notdef' && (!glyph.path || glyph.path.commands.length === 0)) continue;

        glyphs.push({ 
            index: i, 
            char: glyph.unicode ? String.fromCharCode(glyph.unicode) : '', 
            unicode: glyph.unicode,
            name: glyph.name || `glyph_${i}`
        });
      }
      setDetectedGlyphs(glyphs);
      setFilteredGlyphs(glyphs); 

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
      } else {
          setDetectedAxes([]);
      }

      const foundTags = new Set<string>();
      if (font.tables.gsub?.features) {
        font.tables.gsub.features.forEach((f: any) => {
           if (f.tag && ALLOWED_TAGS.has(f.tag)) foundTags.add(f.tag);
        });
      }

      setDynamicFeatures(Array.from(foundTags).sort().map(tag => ({
        tag, name: FEATURE_NAMES[tag] || (tag.startsWith('ss') ? `Stylistic Set ${parseInt(tag.slice(2))}` : tag.toUpperCase())
      })));

      setActiveFeatures({});
      setPopoverPos(null);
      setSelectedCharIndex(null);
    });
  }, [config, activeStyleIndex]);

  useEffect(() => {
    setFilteredGlyphs(detectedGlyphs); 
  }, [detectedGlyphs]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'glyphs') {
        setViewMode('type');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Alternate Selection Logic
  const handleTextSelect = () => {
    if (!textareaRef.current || !loadedFontObj) {
      setPopoverPos(null);
      setSelectedCharIndex(null);
      return;
    }

    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start === end || end - start !== 1) {
      setPopoverPos(null);
      setSelectedCharIndex(null);
      return;
    }

    const targetChar = text.charAt(start);
    if (!targetChar || targetChar === '\n' || targetChar === ' ') {
      setPopoverPos(null);
      setSelectedCharIndex(null);
      return;
    }

    const glyphIndex = loadedFontObj.charToGlyphIndex(targetChar);
    if (!glyphIndex) return;

    const alternates: AlternateGlyph[] = [];
    const gsub = loadedFontObj.tables.gsub;

    if (gsub && gsub.features && gsub.lookups) {
      // aalt di hilangkan dari deteksi alternate
     gsub.features.forEach((featureRecord: any) => {
        featureRecord.feature.lookupListIndexes.forEach((lookupIndex: number) => {
          const lookup = gsub.lookups[lookupIndex];
          if (!lookup || !lookup.subtables) return;
          
          // HANYA proses Type 1 (Single) dan Type 3 (Alternate) agar tidak crash dari Ligature/Contextual
          if (lookup.lookupType !== 1 && lookup.lookupType !== 3) return;

          lookup.subtables.forEach((subtable: any) => {
            try {
              if (!subtable.coverage) return;
              
              let covIdx = -1;
              if (Array.isArray(subtable.coverage.glyphs)) {
                covIdx = subtable.coverage.glyphs.indexOf(glyphIndex);
              } else if (Array.isArray(subtable.coverage)) {
                covIdx = subtable.coverage.indexOf(glyphIndex);
              }
              
              if (covIdx === -1) return;

              let extractedIndices: number[] = [];

              // Deteksi Type 1 Format 1 (deltaGlyphId)
              if (subtable.deltaGlyphId !== undefined) {
                extractedIndices.push((glyphIndex + subtable.deltaGlyphId) % 65536);
              }

              // Scraping ekstrim: ekstrak paksa dari SEMUA property berbentuk Array (substitute, alternateSets, dll)
              Object.keys(subtable).forEach((key) => {
                if (key === 'coverage') return;
                const arr = subtable[key];
                if (Array.isArray(arr) && arr.length > covIdx) {
                  const target = arr[covIdx];
                  // Ekstraksi angka rekursif untuk membongkar TypedArray / nested object
                  const extractNums = (obj: any): number[] => {
                    if (typeof obj === 'number') return [obj];
                    if (Array.isArray(obj) || (obj && obj.length !== undefined && typeof obj !== 'string')) {
                      return Array.from(obj as any).flatMap(extractNums);
                    }
                    if (obj && typeof obj === 'object') {
                      return extractNums(Object.values(obj));
                    }
                    return [];
                  };
                  extractedIndices.push(...extractNums(target));
                }
              });

              extractedIndices.forEach((altIdx: any) => {
                const numIdx = Number(altIdx);
                if (isNaN(numIdx) || numIdx === glyphIndex || numIdx === 0) return;
                
                const targetGlyph = loadedFontObj.glyphs.get(numIdx);
                if (!targetGlyph) return;

                const charStr = targetGlyph.unicode 
                  ? String.fromCharCode(targetGlyph.unicode) 
                  : targetChar;

                // Masukkan asalkan beda tag (memungkinkan K.ss05 muncul di 'salt' dan 'ss05' sekaligus)
                if (!alternates.some(a => a.glyphIndex === numIdx && a.featureTag === featureRecord.tag)) {
                  alternates.push({ char: charStr, glyphIndex: numIdx, featureTag: featureRecord.tag });
                }
              });
            } catch (e) {
              // Silent fail aman
            }
          });
        });
      });
    }

    if (alternates.length > 0) {
      setSelectedCharIndex(start);
      let posX = 24;
      let posY = 16;
      const targetCharEl = document.getElementById(`char-span-${start}`);
      if (targetCharEl && textareaRef.current) {
        const containerRect = textareaRef.current.getBoundingClientRect();
        const charRect = targetCharEl.getBoundingClientRect();
        posX = charRect.left - containerRect.left;
        posY = charRect.top - containerRect.top;
      }
      setPopoverPos({ x: posX, y: posY });
      setAlternateGlyphs(alternates);
    } else {
      setPopoverPos(null);
      setSelectedCharIndex(null);
    }
  };

  const applyAlternate = (alt: AlternateGlyph) => {
    if (selectedCharIndex === null) return;

    setGlyphOverrides(prev => {
      const next = { ...prev };
      if (!alt.glyphIndex || next[selectedCharIndex] === alt.glyphIndex) {
        delete next[selectedCharIndex];
      } else {
        next[selectedCharIndex] = alt.glyphIndex;
      }
      return next;
    });

    const targetGlyph = loadedFontObj?.glyphs?.get(alt.glyphIndex);
    if (targetGlyph && targetGlyph.unicode && targetGlyph.unicode !== text.charCodeAt(selectedCharIndex)) {
      const replacementChar = String.fromCharCode(targetGlyph.unicode);
      const newText = text.slice(0, selectedCharIndex) + replacementChar + text.slice(selectedCharIndex + 1);
      setText(newText);
    }

    const effectiveTag = alt.featureTag;
    setCharOverrides(prev => {
      const next = { ...prev };
      if (!effectiveTag || next[selectedCharIndex] === effectiveTag) {
        delete next[selectedCharIndex];
      } else {
        next[selectedCharIndex] = effectiveTag;
      }
      return next;
    });

    setPopoverPos(null);
    setSelectedCharIndex(null);
  };

  // SVGs Builder & Helper
  const renderGlyphSvg = (glyphIdx: number, size: number = 24) => {
    if (!loadedFontObj) return null;
    const glyph = loadedFontObj.glyphs.get(glyphIdx);
    if (!glyph) return null;

    const unitsPerEm = loadedFontObj.unitsPerEm || 1000;
    const scale = (size * 0.75) / unitsPerEm;
    const baseline = size * 0.75;
    const advanceWidth = (glyph.advanceWidth || unitsPerEm * 0.6) * scale;
    const xOffset = Math.max(0, (size - advanceWidth) / 2);

    try {
      const pathData = glyph.getPath(xOffset, baseline, size * 0.75).toPathData(2);
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fill-current pointer-events-none">
          <path d={pathData} />
        </svg>
      );
    } catch (e) {
      return null;
    }
  };

  const renderInlineGlyphSvg = (glyphIdx: number, targetSize: number, fontIdx: number) => {
    const targetFontObj = loadedFontsMap[fontIdx] || loadedFontObj;
    if (!targetFontObj) return null;

    const glyph = targetFontObj.glyphs.get(glyphIdx);
    if (!glyph) return null;

    const unitsPerEm = targetFontObj.unitsPerEm || 1000;
    const ascender = targetFontObj.tables.os2?.sTypoAscender || targetFontObj.tables.hhea?.ascender || (unitsPerEm * 0.8);
    const descender = Math.abs(targetFontObj.tables.os2?.sTypoDescender || targetFontObj.tables.hhea?.descender || (unitsPerEm * 0.2));
    const totalHeight = ascender + descender;

    const scale = targetSize / unitsPerEm;
    const advanceWidth = (glyph.advanceWidth || unitsPerEm * 0.6) * scale;
    const svgHeight = totalHeight * scale;
    const baselineY = ascender * scale;

    try {
      const pathData = glyph.getPath(0, baselineY, targetSize).toPathData(2);
      return (
        <span 
          className="inline relative pointer-events-none select-none"
          style={{ 
            display: 'inline-block',
            width: `${advanceWidth}px`, 
            height: 0,
            lineHeight: 0,
            verticalAlign: 'baseline'
          }}
        >
          <svg 
            style={{ 
              width: `${advanceWidth}px`, 
              height: `${svgHeight}px`,
              position: 'absolute',
              top: `-${baselineY}px`,
              left: 0,
              overflow: 'visible'
            }} 
            viewBox={`0 0 ${advanceWidth} ${svgHeight}`} 
            className="fill-current pointer-events-none"
          >
            <path d={pathData} />
          </svg>
        </span>
      );
    } catch (e) {
      return null;
    }
  };

  const toggleFeature = (tag: string) => {
    setActiveFeatures(prev => ({ ...prev, [tag]: !prev[tag] }));
  };

  // Setup Styles and Typography Settings
  const globalActiveFeatureString = Object.entries(activeFeatures)
    .filter(([_, on]) => on)
    .map(([t]) => `"${t}" 1`)
    .join(', ') || 'normal';

  const fontVariationSettings = Object.entries(axesValues).map(([t, v]) => `"${t}" ${v}`).join(', ');

  const activeTextareaFontIndex = isLayeredMode 
    ? (layers[0]?.fontIndex ?? config.metadata?.primary_font_index ?? 0)
    : activeStyleIndex;

  const commonFontStyle = {
    fontFamily: `"${config.name}-${activeTextareaFontIndex}"`,
    fontVariationSettings,
  };

  const activeAxes = detectedAxes.length > 0 ? detectedAxes : config.axes;
  const hasAxes = activeAxes && activeAxes.length > 0;
  const hasFeatures = dynamicFeatures.length > 0;

  // Layer Helpers
  const addSpecificLayer = (fontIndex: number) => {
    const COLOR_PALETTE = ['#000000', '#555555', '#888888', '#aaaaaa'];
    const assignedColor = COLOR_PALETTE[layers.length % COLOR_PALETTE.length];
    const newLayer: FontLayerItem = {
      id: `layer-${Date.now()}`,
      fontIndex: fontIndex,
      isInverted: false,
      isVisible: true,
      color: assignedColor
    };
    setLayers(prev => [...prev, newLayer]);
    setIsAddLayerOpen(false);
  };
  const removeLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
  };
  const moveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;
    const next = [...layers];
    const item = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = item;
    setLayers(next);
  };
  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));
  };
  const changeLayerFont = (id: string, fontIndex: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, fontIndex } : l));
  };
  const changeLayerColor = (id: string, color: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, color } : l));
  };

  const handleScrollSync = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    Object.values(layerContainerRefs.current).forEach((el) => {
      if (el) {
        el.scrollTop = scrollTop;
        el.scrollLeft = scrollLeft;
      }
    });
  };

  // Rendering Helper for Overlays
  const renderTextSpans = (fontIdx: number) => {
    const styleFontFamily = `"${config.name}-${fontIdx}"`;
    return text.split('').map((char, i) => {
      const overrideGlyphIdx = glyphOverrides[i];
      const overrideFeature = charOverrides[i];

      if (overrideGlyphIdx !== undefined) {
        return (
          <React.Fragment key={i}>
            {renderInlineGlyphSvg(overrideGlyphIdx, fontSize, fontIdx) || char}
          </React.Fragment>
        );
      }

      const activeCharFeatures = overrideFeature 
        ? (globalActiveFeatureString === 'normal' ? `"${overrideFeature}" 1` : `"${overrideFeature}" 1, ${globalActiveFeatureString}`)
        : globalActiveFeatureString;

      return (
        <span 
          key={i}
          id={fontIdx === (layers[0]?.fontIndex ?? activeStyleIndex) ? `char-span-${i}` : undefined}
          style={{
            fontFamily: styleFontFamily,
            fontFeatureSettings: activeCharFeatures,
            WebkitFontFeatureSettings: activeCharFeatures
          }}
        >
          {char}
        </span>
      );
    });
  };


  return (
    <div className="w-full h-full relative group bg-transparent">
      <div className="relative z-10 h-full flex flex-col">
        <div className="grid grid-cols-2 lg:flex lg:flex-nowrap items-stretch justify-between border-b border-black bg-white/10 backdrop-blur-[2px] relative z-40">

          <div className="hidden lg:flex items-center gap-2 px-4 lg:px-8 py-4 lg:py-8 border-r border-black justify-start">
              <button 
                onClick={() => setViewMode(viewMode === 'type' ? 'glyphs' : 'type')} 
                className="flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase transition-colors bg-black text-white hover:bg-gray-800"
              >
                {viewMode === 'type' ? <Grid size={14}/> : <Keyboard size={14}/>}
                <span>{viewMode === 'type' ? 'Map View' : 'Type View'}</span>
              </button>
              
              {/* Layered mode trigger ditambahkan pada view mode standar style 1 */}
              {isLayeredSupported && viewMode === 'type' && (
                <button
                  onClick={() => setIsLayeredMode(!isLayeredMode)}
                  className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase transition-colors border ${isLayeredMode ? 'bg-black text-white border-black' : 'bg-transparent text-black border-black hover:bg-gray-200'}`}
                >
                  <Layers size={14}/>
                  <span>Layer Mode {isLayeredMode ? 'ON' : 'OFF'}</span>
                </button>
              )}
          </div>

          <div className="col-span-2 lg:col-span-1 lg:ml-auto flex items-center gap-6 px-4 lg:px-8 py-4 lg:py-8 border-b lg:border-b-0 lg:border-l border-black justify-between lg:justify-end lg:order-last">
              {!isLayeredMode && (
                <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
                  <span className="font-bold text-xs text-gray-400 uppercase lg:hidden">Style</span>
                  <div className="relative z-[100]">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 appearance-none font-bold text-xs uppercase outline-none cursor-pointer py-1 pl-0 pr-2 bg-transparent hover:text-gray-600 transition-colors border-b border-transparent hover:border-black min-w-[80px] justify-between relative z-10"
                    >
                        <span>
                          {detectedStyleNames[activeStyleIndex] || (
                            Array.isArray(config.font_files) && config.font_files.length > 0 
                              ? `Style ${String(activeStyleIndex + 1).padStart(2, '0')}`
                              : 'Style 01'
                          )}
                      </span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-black z-50 overflow-hidden shadow-none">
                            {Array.isArray(config.font_files) && config.font_files.length > 0 ? (
                              config.font_files.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => { 
                                      e.stopPropagation();
                                      setActiveStyleIndex(i); 
                                      setIsDropdownOpen(false); 
                                  }}
                                  className={`w-full text-left px-4 py-3 text-xs font-bold uppercase transition-colors block ${
                                    activeStyleIndex === i 
                                      ? 'bg-black text-white' 
                                      : 'text-black hover:bg-black hover:text-white'
                                  }`}
                                >
                                  {detectedStyleNames[i] || `Style ${String(i + 1).padStart(2, '0')}`}
                                </button>
                              ))
                            ) : (
                              <button className="w-full text-left px-4 py-3 text-xs font-bold uppercase text-black cursor-default">
                                Style 01
                              </button>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
          </div>

          <div className="flex items-center gap-2 px-4 lg:px-8 py-4 lg:py-8 border-r border-black justify-center lg:justify-start">
             {viewMode === 'type' ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-400 uppercase lg:hidden">Size</span>
                    <div className="relative z-[110]">
                       <button 
                          onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                          className="flex items-center gap-2 appearance-none font-bold text-xs uppercase outline-none cursor-pointer py-1 pl-0 pr-2 bg-transparent hover:text-gray-600 transition-colors border-b border-transparent hover:border-black min-w-[65px] justify-between relative z-10"
                       >
                          <span>{fontSize} PX</span>
                          <ChevronDown size={14} className={`transition-transform duration-200 ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
                       </button>

                       {isSizeDropdownOpen && (
                         <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsSizeDropdownOpen(false)} />
                          <div className="absolute left-0 top-full mt-2 w-32 bg-white/95 backdrop-blur-xl border border-black z-50 overflow-y-auto max-h-[300px] shadow-none custom-scrollbar">
                              {PRESET_SIZES.map((size) => (
                                <button
                                  key={size}
                                  onClick={(e) => { 
                                      e.stopPropagation();
                                      setFontSize(size); 
                                      setIsSizeDropdownOpen(false); 
                                  }}
                                  className={`w-full text-left px-4 py-3 text-xs font-bold uppercase transition-colors block ${
                                    fontSize === size 
                                      ? 'bg-black text-white' 
                                      : 'text-black hover:bg-black hover:text-white'
                                  }`}
                                >
                                  {size} PX
                                </button>
                              ))}
                          </div>
                         </>
                       )}
                    </div>
                  </div>
                </>
             ) : (
               [10, 20, 30].map(size => (
                  <button key={size} onClick={() => { setMapGridSize(size); setMapPage(0); }} className={`px-3 py-1 text-xs font-bold border border-black ${mapGridSize === size ? 'bg-black text-white' : 'bg-transparent hover:bg-gray-200 uppercase'}`}>{size}</button>
                ))
             )}
          </div>

          <div className="flex items-center gap-2 px-4 lg:px-8 py-4 lg:py-8 justify-center xl:border-r xl:border-black lg:justify-start">
             {viewMode === 'type' ? (
                <>
                  <button onClick={() => setAlign('left')} className={`p-2 ${align === 'left' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignLeft size={16}/></button>
                  <button onClick={() => setAlign('center')} className={`p-2 ${align === 'center' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignCenter size={16}/></button>
                  <button onClick={() => setAlign('right')} className={`p-2 ${align === 'right' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}><AlignRight size={16}/></button>
                </>
             ) : (
              <div className="flex gap-1 items-center">
                  <button 
                    onClick={() => setMapPage(Math.max(0, mapPage - 1))} 
                    disabled={mapPage === 0} 
                    className="p-2 border border-black disabled:opacity-20 hover:bg-black hover:text-white transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setMapPage(mapPage + 1)} 
                    disabled={(mapPage + 1) * glyphsPerPage >= filteredGlyphs.length} 
                    className="p-2 border border-black disabled:opacity-20 hover:bg-black hover:text-white transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
               </div>
             )}
          </div>

        </div>

        <div className="min-h-[300px] mb-8 relative">
          {viewMode === 'type' ? (
              <div className="relative w-full min-h-[300px]">
                
                {/* RENDER LAYER/SINGLE OVERLAYS (Visual Text Area) */}
                {!isLayeredMode ? (
                  <div 
                    ref={(el) => { layerContainerRefs.current['single'] = el; }}
                    className="absolute inset-0 pt-4 pr-4 pb-4 pl-6 md:pl-8 pointer-events-none whitespace-pre-wrap wrap-break-word overflow-hidden select-none"
                    style={{ 
                      ...commonFontStyle, 
                      fontSize: `${fontSize}px`, 
                      textAlign: align, 
                      lineHeight: lineHeight, 
                      letterSpacing: `${letterSpacing}em` 
                    }}
                    aria-hidden="true"
                  >
                    {renderTextSpans(activeStyleIndex)}
                  </div>
                ) : (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {layers.map((layer, stackIdx) => {
                      if (!layer.isVisible) return null;
                      const calculatedZIndex = layers.length - stackIdx;
                      return (
                        <div 
                          key={layer.id}
                          ref={(el) => { layerContainerRefs.current[layer.id] = el; }}
                          className="absolute inset-0 pt-4 pr-4 pb-4 pl-6 md:pl-8 whitespace-pre-wrap wrap-break-word select-none overflow-hidden"
                          style={{ 
                            ...commonFontStyle,
                            fontFamily: `"${config.name}-${layer.fontIndex}"`,
                            fontSize: `${fontSize}px`, 
                            textAlign: align, 
                            lineHeight: lineHeight, 
                            letterSpacing: `${letterSpacing}em`,
                            zIndex: calculatedZIndex,
                            color: layer.color
                          }}
                          aria-hidden="true"
                        >
                          {renderTextSpans(layer.fontIndex)}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* INVISIBLE INTERACTIVE TEXTAREA */}
                <textarea 
                  ref={textareaRef}
                  value={text} 
                  onChange={(e) => { setText(e.target.value); setCharOverrides({}); setPopoverPos(null); setSelectedCharIndex(null); }} 
                  onSelect={handleTextSelect}
                  onKeyUp={handleTextSelect}
                  onMouseUp={handleTextSelect}
                  onScroll={handleScrollSync}
                  className="w-full min-h-[300px] bg-transparent outline-none resize-none pt-4 pr-4 pb-4 pl-6 md:pl-8 relative z-30 text-transparent caret-black selection:bg-black/30 selection:text-transparent" 
                  style={{ 
                      ...commonFontStyle,
                      fontSize: `${fontSize}px`, 
                      textAlign: align,
                      lineHeight: lineHeight,
                      letterSpacing: `${letterSpacing}em`,
                      fontFeatureSettings: globalActiveFeatureString,
                      WebkitFontFeatureSettings: globalActiveFeatureString
                  }} 
                  spellCheck={false} 
                />

                {/* POPOVER ALTERNATE GLYPHS */}
                {popoverPos && alternateGlyphs.length > 0 && selectedCharIndex !== null && (
                  <div 
                    className="absolute z-[60] bg-white border border-black shadow-xl p-2 flex items-center gap-2 pointer-events-auto"
                    style={{
                      left: `${Math.max(16, Math.min(popoverPos.x - 20, (textareaRef.current?.clientWidth || 600) - 280))}px`,
                      top: `${popoverPos.y > 70 ? popoverPos.y - 65 : popoverPos.y + fontSize + 15}px`
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase text-gray-400 border-r border-black pr-2">Alts</span>
                    <div className="flex items-center gap-1 overflow-x-auto max-w-[300px] custom-scrollbar">
                      <button
                          type="button"
                          onClick={() => applyAlternate({ char: text.charAt(selectedCharIndex), glyphIndex: 0, featureTag: '' })}
                          className={`h-10 min-w-10 px-2 flex flex-col items-center justify-center border transition-all ${
                            !charOverrides[selectedCharIndex] 
                              ? 'bg-black text-white border-black' 
                              : 'border-transparent hover:bg-black hover:text-white bg-transparent text-black'
                          }`}
                          title="Default Style"
                        >
                          <div className="h-6 flex items-center justify-center">
                            {renderGlyphSvg(loadedFontObj ? loadedFontObj.charToGlyphIndex(text.charAt(selectedCharIndex)) : 0, 20) || (
                              <span style={{ ...commonFontStyle, fontSize: '16px', fontFeatureSettings: 'normal' }}>
                                {text.charAt(selectedCharIndex)}
                              </span>
                            )}
                          </div>
                      </button>

                      {alternateGlyphs.map((alt, idx) => {
                        const isSelected = glyphOverrides[selectedCharIndex] === alt.glyphIndex || (!glyphOverrides[selectedCharIndex] && charOverrides[selectedCharIndex] === alt.featureTag && idx === 0);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyAlternate(alt)}
                            className={`h-10 min-w-10 px-2 flex flex-col items-center justify-center border transition-all shrink-0 ${
                              isSelected 
                                ? 'bg-black text-white border-black' 
                                : 'border-transparent hover:bg-black hover:text-white bg-transparent text-black'
                            }`}
                            title={`Glyph #${alt.glyphIndex}`}
                          >
                            <div className="h-6 flex items-center justify-center">
                              {renderGlyphSvg(alt.glyphIndex, 20) || (
                                <span style={{ ...commonFontStyle, fontSize: '16px', fontFeatureSettings: `"${alt.featureTag}" 1` }}>
                                  {alt.char}
                                </span>
                              )}
                            </div>
                            <span className="text-[7px] uppercase font-sans mt-0.5 opacity-60">
                              {alt.featureTag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
          ) : (
              <div className="w-full grid content-start" style={{ gridTemplateColumns: `repeat(${mapGridSize}, minmax(0, 1fr))` }}>
                {filteredGlyphs.slice(mapPage * glyphsPerPage, (mapPage + 1) * glyphsPerPage).map((item, idx) => (
                  <div key={idx} className="aspect-square flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-default border border-transparent hover:border-black" title={item.name}>
                        <div className="flex items-center justify-center pointer-events-none">
                            {/* Update fitur Map View perender SVG otomatis */}
                            {renderGlyphSvg(item.index, mapGridSize === 10 ? 60 : mapGridSize === 20 ? 32 : 20) || (
                              item.char ? (
                                <span style={{ 
                                  ...commonFontStyle,
                                  fontSize: mapGridSize === 10 ? '60px' : mapGridSize === 20 ? '32px' : '20px' 
                                }}>
                                  {item.char}
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono opacity-30">#{item.index}</span>
                              )
                            )}
                        </div>
                    </div>
                ))}
              </div>
          )}
        </div>

        {/* SETTINGS PANEL */}
        <div className="bg-transparent border-t border-black relative z-40">
          
          {/* PANEL LAYERED MODE SETTINGS (Muncul saat dipicu) */}
          {isLayeredMode && viewMode === 'type' && (
             <div className="px-4 md:px-8 py-6 border-b border-black bg-gray-50/50">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={14} />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Layer Settings</span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setIsAddLayerOpen(!isAddLayerOpen)}
                      className="px-3 py-1 text-[10px] font-bold uppercase border border-black hover:bg-black hover:text-white transition-all flex items-center gap-1.5 relative z-10"
                    >
                      <Plus size={12} /> ADD LAYER
                    </button>
                    {isAddLayerOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAddLayerOpen(false)} />
                          <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-black z-50 shadow-xl overflow-hidden">
                            <div className="px-3 py-2 text-[9px] font-bold uppercase text-gray-500 border-b border-gray-200 bg-gray-100">
                              Select Font
                            </div>
                            {availableLayerIndices.map((fIdx) => (
                              <button
                                key={fIdx}
                                onClick={() => addSpecificLayer(fIdx)}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase border-b border-gray-100 hover:bg-black hover:text-white transition-colors"
                              >
                                {detectedStyleNames[fIdx] || `Style ${fIdx + 1}`}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                  </div>
               </div>

               <div className="flex flex-col gap-2">
                {layers.map((layer, idx) => (
                  <div 
                    key={layer.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                        if (draggedLayerIdx === null || draggedLayerIdx === idx) return;
                        const updated = [...layers];
                        const item = updated.splice(draggedLayerIdx, 1)[0];
                        updated.splice(idx, 0, item);
                        setLayers(updated);
                        setDraggedLayerIdx(null);
                    }}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border transition-all gap-3 ${
                      !layer.isVisible ? 'opacity-50 border-gray-200 bg-transparent' : 'border-black bg-white'
                    } ${draggedLayerIdx === idx ? 'border-dashed opacity-30' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        draggable
                        onDragStart={() => setDraggedLayerIdx(idx)}
                        onDragEnd={() => setDraggedLayerIdx(null)}
                        className="cursor-grab text-gray-400 hover:text-black p-1 -m-1"
                      >
                        <GripVertical size={14} />
                      </div>
                      <span className="text-[10px] font-mono font-bold opacity-40 w-4">#{idx + 1}</span>
                      
                      <select 
                        value={layer.fontIndex}
                        onChange={(e) => changeLayerFont(layer.id, parseInt(e.target.value))}
                        className="bg-transparent border border-gray-300 px-2 py-1 text-xs font-bold uppercase outline-none cursor-pointer"
                      >
                        {availableLayerIndices.map((fIdx) => (
                          <option key={fIdx} value={fIdx}>
                            {detectedStyleNames[fIdx] || `Style ${fIdx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5 border border-gray-300 px-2 py-1 relative cursor-pointer hover:border-black transition-colors">
                        <input 
                          type="color"
                          value={layer.color || '#000000'}
                          onChange={(e) => changeLayerColor(layer.id, e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div className="w-3 h-3 border border-gray-400" style={{ backgroundColor: layer.color || '#000000' }} />
                        <span className="text-[9px] font-mono font-bold uppercase text-black">
                          {layer.color || '#000000'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleLayerVisibility(layer.id)}
                          className="p-1.5 border border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
                        >
                          {layer.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          disabled={idx === 0}
                          onClick={() => moveLayer(idx, 'up')}
                          className="p-1.5 border border-gray-300 text-gray-600 hover:border-black hover:text-black disabled:opacity-20 transition-colors"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          disabled={idx === layers.length - 1}
                          onClick={() => moveLayer(idx, 'down')}
                          className="p-1.5 border border-gray-300 text-gray-600 hover:border-black hover:text-black disabled:opacity-20 transition-colors"
                        >
                          <ArrowDown size={13} />
                        </button>
                        {layers.length > 1 && (
                          <button
                            onClick={() => removeLayer(layer.id)}
                            className="p-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
             </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 ${(hasAxes || hasFeatures) ? 'border-b border-black' : ''}`}>
              <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8 border-b md:border-b-0 md:border-r border-black">
               <label className="w-24 font-bold text-xs uppercase">Leading</label>
                  <input type="range" min="0.8" max="2.0" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"/>
                  <span className="w-12 text-right font-bold text-xs">{lineHeight.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-4 px-4 md:px-8 py-6 md:py-8">
                  <label className="w-24 font-bold text-xs uppercase">Tracking</label>
                  <input type="range" min="-0.1" max="0.5" step="0.01" value={letterSpacing} onChange={(e) => setLetterSpacing(parseFloat(e.target.value))} className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"/>
                  <span className="w-12 text-right font-bold text-xs">{letterSpacing.toFixed(2)}</span>
              </div>
          </div>

          {(hasAxes || hasFeatures) && (
            <div className={`grid grid-cols-1 ${hasAxes && hasFeatures ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
                {hasAxes && (
                  <div className={`${hasFeatures ? 'md:col-span-2 border-b md:border-b-0' : 'md:col-span-1'} space-y-4 px-4 md:px-8 py-6 md:py-8 border-black`}>
                    <h4 className="font-bold text-xs uppercase text-gray-400 mb-4 tracking-widest">Variable Axes</h4>
                    {activeAxes.map((axis: any) => (
                      <div key={axis.tag} className="flex items-center gap-4">
                        <label className="w-16 font-bold text-xs uppercase truncate">{axis.name}</label>
                        <input type="range" min={axis.min} max={axis.max} step={1} value={axesValues[axis.tag] ?? axis.default} onChange={(e) => setAxesValues(p => ({...p, [axis.tag]: parseFloat(e.target.value)}))} className="flex-grow h-px bg-black appearance-none cursor-pointer accent-black"/>
                        <span className="w-12 text-right font-bold text-xs">{Math.round(axesValues[axis.tag] ?? axis.default)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {hasFeatures && (
                  <div className={`${hasAxes ? 'md:col-span-1 md:border-l' : 'md:col-span-1'} border-black px-4 md:px-8 py-6 md:py-8`}>
                    <h4 className="font-bold text-xs uppercase text-gray-400 mb-4 tracking-widest">Features</h4>
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {dynamicFeatures.map((feat) => (
                        <label key={feat.tag} className="flex items-center justify-between cursor-pointer group select-none">
                          <span className="text-sm font-bold uppercase group-hover:text-gray-600 transition-colors">
                            {feat.name} <span className="text-gray-400 font-bold text-[10px] ml-2">.{feat.tag}</span>
                          </span>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={activeFeatures[feat.tag] || false} onChange={() => toggleFeature(feat.tag)} />
                            <div className="w-9 h-5 rounded-full bg-transparent border border-black peer-checked:bg-black peer-checked:border-black after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-black after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-white"></div>
                          </div>
                        </label>
                      ))}
                    </div>
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