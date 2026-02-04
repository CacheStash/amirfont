export interface Axis {
    tag: string;
    name: string;
    min: number;
    max: number;
    default: number;
    step?: number;
    unit?: string;
}
// src/types.ts
export interface FontConfig {
  name: string;
  family: string;
  file?: string;
  description: string;
  tags: string[];
  axes: {
    tag: string;
    name: string;
    min: number;
    max: number;
    default: number;
    step?: number;
    unit?: string;
  }[];
  // Tambahkan ini:
  features?: {
    tag: string;
    name: string;
  }[];
}