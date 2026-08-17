import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Grid, Keyboard, ChevronDown, ChevronLeft, ChevronRight, Layers, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from 'lucide-react';
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
  const [fontSize, setFontSize] = useState(64);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [viewMode, setViewMode] = useState<'type' | 'glyphs'>('type');
  
  // Layered Mode States
  const isLayeredSupported = !!config.metadata?.is_layered && Array.isArray(config.font_files) && config.font_files.length > 1;
  const [isLayeredMode, setIsLayeredMode] = useState<boolean>(false);

  const [layers, setLayers] = useState<FontLayerItem[]>([
    { id: 'layer-top', fontIndex: config.metadata?.primary_font_index || 0, isInverted: false, isVisible: true, color: '#000000' },
    ...(Array.isArray(config.font_files) && config.font_files.length > 1
      ? [{ id: 'layer-bottom', fontIndex: (config.metadata?.primary_font_index || 0) === 0 ? 1 : 0, isInverted: false, isVisible: true, color: '#666666' }]
      : [])
  ]);

  const [draggedLayerIdx, setDraggedLayerIdx] = useState<number | null>(null);
  const layerContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
  const [isAddLayerOpen, setIsAddLayerOpen] = useState(false);
  const PRESET_SIZES = [12, 14, 16, 18, 20, 24, 32, 36, 48, 64, 72, 96, 120, 144, 200];

  // Alternates State
  const [loadedFontObj, setLoadedFontObj] = useState<opentype.Font | null>(null);
  const [loadedFontsMap, setLoadedFontsMap] = useState<Record<number, opentype.Font>>({});
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [alternateGlyphs, setAlternateGlyphs] = useState<AlternateGlyph[]>([]);
  const [selectedCharIndex, setSelectedCharIndex] = useState<number | null>(null);
  const [glyphOverrides, setGlyphOverrides] = useState<Record<number, number>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const FEATURE_NAMES: Record<string, string> = {
    liga: 'Standard Ligatures',
    dlig: 'Discretionary Lig',
    calt: 'Contextual Alt',
    aalt: 'Access All Alt',
    salt: 'Stylistic Alt',
  };

  const ALLOWED_TAGS = new Set([
    'liga', 'dlig', 'calt', 'aalt', 'salt', 'swsh', 'titl',
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

  useEffect(() => {
    const files = Array.isArray(config.font_files) ? config.font_files : [];
    if (files.length === 0) return;

    const configAny = config as any;
    const version = new Date(configAny.updated_at || configAny.created_at || Date.now()).getTime();

    files.forEach((file, index) => {
      if (!file) return;
      const url = file.startsWith('http') || file.startsWith('/') ? file : `/api/fonts/${file}?v=${version}`;
      const fontNameIdentifier = `${config.name}-${index}`;

      try {
        const fontFace = new FontFace(fontNameIdentifier, `url("${url}")`);
        fontFace.load().then((loadedFace) => {
          document.fonts.add(loadedFace);
        }).catch((err) => {
          console.error(`Failed to register FontFace ${fontNameIdentifier}:`, err);
        });
      } catch (e) {
        console.error("FontFace API error:", e);
      }

      opentype.load(url, (err, font) => {
        if (!err && font) {
          const names = font.names as any;
          const isVariable = font.tables.fvar?.axes?.length > 0;
          const detectedName = names.preferredSubfamily?.en || names.fontSubfamily?.en;
          const styleName = isVariable ? "Variable" : detectedName;

          if (styleName) {
            setDetectedStyleNames(prev => ({ ...prev, [index]: styleName }));
            setLoadedFontsMap(prev => ({ ...prev, [index]: font }));
          }
        }
      });
    });
  }, [config.font_files]);

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
          name: glyph.name || `glyph_${i}`,
          char: glyph.unicode ? String.fromCharCode(glyph.unicode) : '',
          unicode: glyph.unicode 
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
  }, [activeFeatures, detectedGlyphs]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'glyphs') {
        setViewMode('type');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

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
    if (!glyphIndex) {
      setPopoverPos(null);
      setSelectedCharIndex(null);
      return;
    }

    const alternates: AlternateGlyph[] = [];
    const gsub = loadedFontObj.tables.gsub;

    if (gsub && gsub.features && gsub.lookups) {
      const altFeatureTags = [
        'aalt', 'salt', 'swsh', 'titl', 'calt', 'dlig',
        ...Array.from({ length: 20 }, (_, i) => `ss${String(i + 1).padStart(2, '0')}`)
      ];
      
      gsub.features.forEach((featureRecord: any) => {
        if (!altFeatureTags.includes(featureRecord.tag)) return;

        featureRecord.feature.lookupListIndexes.forEach((lookupIndex: number) => {
          const lookup = gsub.lookups[lookupIndex];
          if (!lookup || !lookup.subtables) return;

          lookup.subtables.forEach((subtable: any) => {
            if (lookup.lookupType === 1) {
              if (subtable.coverage && subtable.coverage.glyphs) {
                const covIdx = subtable.coverage.glyphs.indexOf(glyphIndex);
                if (covIdx !== -1) {
                  const targetGlyphIdx = Array.isArray(subtable.substitute) 
                    ? subtable.substitute[covIdx] 
                    : (glyphIndex + subtable.deltaGlyphId) % 65536;
                  
                  const targetGlyph = loadedFontObj.glyphs.get(targetGlyphIdx);
                  const charStr = (targetGlyph && targetGlyph.unicode) 
                    ? String.fromCharCode(targetGlyph.unicode) 
                    : targetChar;

                  if (!alternates.some(a => a.glyphIndex === targetGlyphIdx)) {
                    alternates.push({ char: charStr, glyphIndex: targetGlyphIdx, featureTag: featureRecord.tag });
                  }
                }
              }
            } else if (lookup.lookupType === 3) {
              if (subtable.coverage && subtable.coverage.glyphs) {
                const covIdx = subtable.coverage.glyphs.indexOf(glyphIndex);
                if (covIdx !== -1) {
                  const altSets = subtable.alternateSets || subtable.alternateSet || [];
                  const targetSet = altSets[covIdx];

                  if (targetSet) {
                    const glyphIndices: number[] = Array.isArray(targetSet)
                      ? targetSet
                      : (targetSet.alternateGlyphs || targetSet.glyphs || targetSet.alternateSet || []);

                    glyphIndices.forEach((altIdx: number) => {
                      const targetGlyph = loadedFontObj.glyphs.get(altIdx);
                      const charStr = (targetGlyph && targetGlyph.unicode) 
                        ? String.fromCharCode(targetGlyph.unicode) 
                        : targetChar;

                      if (!alternates.some(a => a.glyphIndex === altIdx)) {
                        alternates.push({ char: charStr, glyphIndex: altIdx, featureTag: featureRecord.tag });
                      }
                    });
                  }
                }
              }
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

    setPopoverPos(null);
    setSelectedCharIndex(null);
  };

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setGlyphOverrides({});
    setPopoverPos(null);
    setSelectedCharIndex(null);
  };

  const toggleFeature = (tag: string) => {
    setActiveFeatures(prev => ({ ...prev, [tag]: !prev[tag] }));
  };

  const addSpecificLayer = (fontIndex: number) => {
    const MONO_COLOR_PALETTE = ['#000000', '#555555', '#888888', '#B33939', '#2C3A47', '#D6A2E8'];
    const assignedColor = MONO_COLOR_PALETTE[layers.length % MONO_COLOR_PALETTE.length];

    const newLayer: FontLayerItem = {
      id: `layer-${Date.now()}`,
      fontIndex: fontIndex,
      isInverted: false,
      isVisible: true,
      color: assignedColor
    };
    setLayers(prev => {
      const next = [...prev, newLayer];
      requestAnimationFrame(() => {
        if (textareaRef.current && layerContainerRefs.current[newLayer.id]) {
          layerContainerRefs.current[newLayer.id]!.scrollTop = textareaRef.current.scrollTop;
          layerContainerRefs.current[newLayer.id]!.scrollLeft = textareaRef.current.scrollLeft;
        }
      });
      return next;
    });
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

  const handleLayerDragStart = (idx: number) => {
    setDraggedLayerIdx(idx);
  };

  const handleLayerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleLayerDrop = (targetIdx: number) => {
    if (draggedLayerIdx === null || draggedLayerIdx === targetIdx) return;
    const updated = [...layers];
    const item = updated.splice(draggedLayerIdx, 1)[0];
    updated.splice(targetIdx, 0, item);
    setLayers(updated);
    setDraggedLayerIdx(null);
  };

  const globalActiveFeatureString = Object.entries(activeFeatures)
    .filter(([_, on]) => on)
    .map(([t]) => `"${t}" 1`)
    .join(', ') || 'normal';

  const renderTextSpans = (fontIdx: number) => {
    const styleFontFamily = `"${config.name}-${fontIdx}"`;
    const overrideIndices = Object.keys(glyphOverrides).map(Number).sort((a, b) => a - b);

    // JIKA TIDAK ADA ALTERNATE: Render teks utuh tanpa pemotongan
    if (overrideIndices.length === 0) {
      return (
        <span
          style={{
            fontFamily: styleFontFamily,
            fontFeatureSettings: globalActiveFeatureString,
            WebkitFontFeatureSettings: globalActiveFeatureString
          }}
        >
          {text}
        </span>
      );
    }

    // JIKA ADA ALTERNATE: Potong hanya pada karakter yang diganti (Segment/Chunk Rendering)
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    overrideIndices.forEach((idx) => {
      // 1. Teks utuh sebelum huruf alternate agar lowercase & contextual kerning tidak pecah
      if (idx > lastIndex) {
        elements.push(
          <span
            key={`chunk-${lastIndex}-${idx}`}
            style={{
              fontFamily: styleFontFamily,
              fontFeatureSettings: globalActiveFeatureString,
              WebkitFontFeatureSettings: globalActiveFeatureString
            }}
          >
            {text.slice(lastIndex, idx)}
          </span>
        );
      }

      // 2. Karakter alternate spesifik
      const overrideGlyphIdx = glyphOverrides[idx];
      elements.push(
        <React.Fragment key={`alt-${idx}`}>
          {renderInlineGlyphSvg(overrideGlyphIdx, fontSize, fontIdx) || text[idx]}
        </React.Fragment>
      );

      lastIndex = idx + 1;
    });

    // 3. Sisa teks utuh sampai akhir kalimat
    if (lastIndex < text.length) {
      elements.push(
        <span
          key={`chunk-${lastIndex}-end`}
          style={{
            fontFamily: styleFontFamily,
            fontFeatureSettings: globalActiveFeatureString,
            WebkitFontFeatureSettings: globalActiveFeatureString
          }}
        >
          {text.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  const hasAnyOverride = Object.keys(glyphOverrides).length > 0;
  const isMultiLayerActive = isLayeredMode || hasAnyOverride;

  const currentFontFamily = `"${config.name}-${activeStyleIndex}"`;
  const fontFeatureSettings = Object.entries(activeFeatures).map(([t, on]) => `"${t}" ${on ? 'on' : 'off'}`).join(', ') || 'normal';
  const fontVariationSettings = Object.entries(axesValues).map(([t, v]) => `"${t}" ${v}`).join(', ');

  const commonFontStyle = {
    fontFamily: currentFontFamily,
    fontVariationSettings,
    fontFeatureSettings,
  };

  const activeAxes = detectedAxes.length > 0 ? detectedAxes : config.axes;
  const hasAxes = activeAxes && activeAxes.length > 0;
  const hasFeatures = dynamicFeatures.length > 0;

  return (
    <div className="w-full h-full relative group bg-transparent">
      <div className="relative z-10 h-full flex flex-col">
        {/* SUBQI TOP TOOLBAR */}
        <div className="grid grid-cols-2 lg:flex lg:flex-nowrap items-stretch justify-between border-b border-black bg-white/10 backdrop-blur-[2px] relative z-40">
          
          {/* GRID 1: View Mode Toggle & Layered Mode Toggle (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center gap-2 px-4 lg:px-8 py-4 lg:py-8 border-r border-black justify-start">
              <button 
                onClick={() => setViewMode(viewMode === 'type' ? 'glyphs' : 'type')} 
                className="flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase transition-colors bg-black text-white hover:bg-gray-800"
              >
                {viewMode === 'type' ? <Grid size={14}/> : <Keyboard size={14}/>}
                <span>{viewMode === 'type' ? 'Map View' : 'Type View'}</span>
              </button>

              {isLayeredSupported && viewMode === 'type' && (
                <button 
                  onClick={() => setIsLayeredMode(!isLayeredMode)}
                  className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase transition-colors border border-black ${
                    isLayeredMode ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-black/5'
                  }`}
                >
                  <Layers size={14} />
                  <span>Layered: {isLayeredMode ? 'ON' : 'OFF'}</span>
                </button>
              )}
          </div>

          {/* GRID 2: Style Dropdown */}
          <div className="col-span-2 lg:col-span-1 lg:ml-auto flex items-center gap-6 px-4 lg:px-8 py-4 lg:py-8 border-b lg:border-b-0 lg:border-l border-black justify-between lg:justify-end lg:order-last">
              {!isLayeredMode ? (
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
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-black z-50 overflow-y-auto max-h-64 shadow-none">
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
              ) : (
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Stacked Layer Controls Active Below
                </div>
              )}
          </div>

          {/* GRID 3: Size (Type) / Map Grid (Map) - LEFT COLUMN */}
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

          {/* GRID 4: Align (Type) / Pagination (Map) - RIGHT COLUMN */}
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

        {/* MAIN DISPLAY AREA */}
        <div className="min-h-[300px] mb-8 relative">
          {viewMode === 'type' ? (
              <div className="relative w-full min-h-[300px]">
                {!isMultiLayerActive ? (
                  <textarea 
                    ref={textareaRef}
                    value={text} 
                    onChange={handleTextChange} 
                    onSelect={handleTextSelect}
                    onKeyUp={handleTextSelect}
                    onMouseUp={handleTextSelect}
                    className="w-full min-h-[300px] bg-transparent outline-none resize-none pt-4 pr-4 pb-4 pl-6 md:pl-8 relative z-10 text-black caret-black" 
                    style={{ 
                        ...commonFontStyle,
                        fontSize: `${fontSize}px`, 
                        textAlign: align,
                        lineHeight: lineHeight,
                        letterSpacing: `${letterSpacing}em`
                    }} 
                    spellCheck={false} 
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {layers.map((layer, stackIdx) => {
                        if (!layer.isVisible) return null;
                        const calculatedZIndex = layers.length - stackIdx;
                        return (
                          <div 
                            key={layer.id}
                            ref={(el) => { layerContainerRefs.current[layer.id] = el; }}
                            className="absolute inset-0 pt-4 pr-4 pb-4 pl-6 md:pl-8 whitespace-pre-wrap select-none overflow-hidden"
                            style={{ 
                              ...commonFontStyle,
                              fontFamily: `"${config.name}-${layer.fontIndex}"`,
                              fontSize: `${fontSize}px`, 
                              textAlign: align, 
                              lineHeight: lineHeight, 
                              letterSpacing: `${letterSpacing}em`,
                              zIndex: calculatedZIndex,
                              color: layer.color || '#000000'
                            }}
                            aria-hidden="true"
                          >
                            {renderTextSpans(layer.fontIndex)}
                          </div>
                        );
                      })}
                    </div>

                    <textarea 
                      ref={textareaRef}
                      value={text} 
                      onChange={handleTextChange} 
                      onSelect={handleTextSelect}
                      onKeyUp={handleTextSelect}
                      onMouseUp={handleTextSelect}
                      onScroll={handleScrollSync}
                      className="w-full min-h-[300px] bg-transparent outline-none resize-none pt-4 pr-4 pb-4 pl-6 md:pl-8 relative z-10 text-transparent caret-black selection:bg-black/20 selection:text-transparent" 
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
                  </>
                )}

                {/* ALTERNATES POPOVER */}
                {popoverPos && alternateGlyphs.length > 0 && selectedCharIndex !== null && (
                  <div 
                    className="absolute z-50 bg-white border border-black shadow-lg p-2 flex items-center gap-2 pointer-events-auto"
                    style={{
                      left: `${Math.max(16, Math.min(popoverPos.x - 20, (textareaRef.current?.clientWidth || 600) - 280))}px`,
                      top: `${popoverPos.y > 70 ? popoverPos.y - 65 : popoverPos.y + fontSize + 15}px`
                    }}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 border-r border-black/10 pr-2">
                      Alts
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto max-w-xs">
                      <button
                        type="button"
                        onClick={() => applyAlternate({ char: text.charAt(selectedCharIndex), glyphIndex: 0, featureTag: '' })}
                        className={`h-10 min-w-10 px-1.5 flex flex-col items-center justify-center border transition-all ${
                          !glyphOverrides[selectedCharIndex] 
                            ? 'bg-black text-white border-black' 
                            : 'border-black/20 hover:bg-black hover:text-white bg-transparent text-black'
                        }`}
                        title="Default Style"
                      >
                        <div className="h-5 flex items-center justify-center">
                          {renderGlyphSvg(loadedFontObj ? loadedFontObj.charToGlyphIndex(text.charAt(selectedCharIndex)) : 0, 20) || (
                            <span style={{ ...commonFontStyle, fontSize: '16px', fontFeatureSettings: 'normal' }}>
                              {text.charAt(selectedCharIndex)}
                            </span>
                          )}
                        </div>
                        <span className="text-[6px] opacity-40 uppercase mt-0.5">DEFAULT</span>
                      </button>

                      {alternateGlyphs.map((alt, idx) => {
                        const isSelected = glyphOverrides[selectedCharIndex] === alt.glyphIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyAlternate(alt)}
                            className={`h-10 min-w-10 px-1.5 flex flex-col items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-black text-white border-black' 
                                : 'border-black/20 hover:bg-black hover:text-white bg-transparent text-black'
                            }`}
                            title={`Glyph #${alt.glyphIndex} (${alt.featureTag.toUpperCase()})`}
                          >
                            <div className="h-5 flex items-center justify-center">
                              {renderGlyphSvg(alt.glyphIndex, 20) || (
                                <span 
                                  style={{ 
                                    ...commonFontStyle, 
                                    fontSize: '16px', 
                                    fontFeatureSettings: `"${alt.featureTag}" 1` 
                                  }}
                                >
                                  {alt.char}
                                </span>
                              )}
                            </div>
                            <span className="text-[6px] opacity-40 uppercase mt-0.5">
                              {alt.featureTag === 'aalt' ? 'SALT' : alt.featureTag.toUpperCase()}
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
                  <div key={item.index ?? idx} className="aspect-square flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-default border-none p-2">
                    <div className="w-12 h-12 flex items-center justify-center pointer-events-none">
                      {renderGlyphSvg(item.index, mapGridSize === 10 ? 44 : mapGridSize === 20 ? 28 : 18) || (
                        <span style={{ 
                          ...commonFontStyle,
                          fontSize: mapGridSize === 10 ? '60px' : mapGridSize === 20 ? '32px' : '20px' 
                        }}>
                          {item.char}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
          )}
        </div>

        {/* LAYER STACKING MANAGER PANEL */}
        {isLayeredMode && viewMode === 'type' && (
          <div className="p-4 md:p-6 border-t border-black bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-black" />
                <span className="text-xs font-bold uppercase tracking-widest text-black">Layer Stacking Order (Top to Bottom)</span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAddLayerOpen(!isAddLayerOpen)}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-gray-800 transition-all flex items-center gap-1.5"
                >
                  <Plus size={12} /> ADD LAYER
                </button>

                {isAddLayerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAddLayerOpen(false)} />
                    <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-black z-50 shadow-none overflow-hidden">
                      <div className="px-3 py-1.5 text-[9px] font-bold uppercase text-gray-500 border-b border-black/10 tracking-widest bg-gray-50">
                        Select Layer Font
                      </div>
                      {availableLayerIndices.map((fIdx) => (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() => addSpecificLayer(fIdx)}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase border-b border-black/5 last:border-0 hover:bg-black hover:text-white transition-colors"
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
                  onDragOver={handleLayerDragOver}
                  onDrop={() => handleLayerDrop(idx)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 border transition-all gap-2 bg-white ${
                    draggedLayerIdx === idx ? 'opacity-30 border-dashed border-black' : 'border-black'
                  } ${!layer.isVisible ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      draggable
                      onDragStart={() => handleLayerDragStart(idx)}
                      onDragEnd={() => setDraggedLayerIdx(null)}
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-black p-1 -m-1"
                      title="Drag to Reorder Layer"
                    >
                      <GripVertical size={14} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gray-400 w-4">#{idx + 1}</span>
                    
                    <select 
                      value={layer.fontIndex}
                      onChange={(e) => changeLayerFont(layer.id, parseInt(e.target.value))}
                      className="bg-transparent border border-black px-2 py-1 text-xs font-bold uppercase outline-none cursor-pointer"
                    >
                      {availableLayerIndices.map((fIdx) => (
                        <option key={fIdx} value={fIdx}>
                          {detectedStyleNames[fIdx] || `Style ${fIdx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5 border border-black px-2 py-1 relative cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="color"
                        value={layer.color || '#000000'}
                        onChange={(e) => changeLayerColor(layer.id, e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        title="Pick Layer Color"
                      />
                      <div 
                        className="w-3.5 h-3.5 border border-black/30" 
                        style={{ backgroundColor: layer.color || '#000000' }} 
                      />
                      <span className="text-[9px] font-mono font-bold uppercase text-black">
                        {layer.color || '#000000'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="p-1 border border-black text-black hover:bg-black hover:text-white transition-colors"
                        title={layer.isVisible ? "Hide Layer" : "Show Layer"}
                      >
                        {layer.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveLayer(idx, 'up')}
                        className="p-1 border border-black text-black hover:bg-black hover:text-white disabled:opacity-20 transition-colors"
                        title="Move Up in Stack"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === layers.length - 1}
                        onClick={() => moveLayer(idx, 'down')}
                        className="p-1 border border-black text-black hover:bg-black hover:text-white disabled:opacity-20 transition-colors"
                        title="Move Down in Stack"
                      >
                        <ArrowDown size={13} />
                      </button>

                      {layers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLayer(layer.id)}
                          className="p-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          title="Remove Layer"
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

        {/* SETTINGS PANEL */}
        <div className="bg-transparent border-t border-black">
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