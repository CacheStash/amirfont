export interface Axis {
    tag: string;
    name: string;
    min: number;
    max: number;
    default: number;
    step?: number;
    unit?: string;
}

export interface FontConfig {
  name: string;
  family: string;
  file?: string;
  description: string;
  tags: string[];
  
  // Array URL gambar untuk background oval (Opsional)
  previewImages?: string[];

  // Properti tambahan agar tidak error di Home.tsx
  price?: number;
  styleCount?: number;

  axes: {
    tag: string;
    name: string;
    min: number;
    max: number;
    default: number;
    step?: number;
    unit?: string;
  }[];
  
  features?: {
    tag: string;
    name: string;
  }[];
}