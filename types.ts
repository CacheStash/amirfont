// Definition for a Variable Font Axis
export interface FontAxis {
  tag: string;       // e.g., 'wght', 'wdth'
  name: string;      // Label shown to user
  min: number;
  max: number;
  default: number;
  step?: number;
  unit?: string;
}

// Definition for an OpenType Feature
export interface FontFeature {
  tag: string;       // e.g., 'liga', 'ss01', 'swsh'
  name: string;      // Label shown to user
  default?: boolean; // Initial state
}

// The Master Configuration Object for a Font
export interface FontConfig {
  name: string;
  family: string;
  description: string;
  tags: string[]; // e.g., ['Variable', 'Sans', 'Humanist']
  axes: FontAxis[];     // If empty, it's not a variable font
  features: FontFeature[]; // If empty, no toggleable features shown
}

export interface FontSettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  // Dynamic map for variable axes values (key: tag, value: number)
  axisValues: Record<string, number>;
  // Dynamic map for feature toggle states (key: tag, value: boolean)
  featureStates: Record<string, boolean>;
}

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export interface ToggleProps {
  label: string;
  isActive: boolean;
  onToggle: () => void;
}