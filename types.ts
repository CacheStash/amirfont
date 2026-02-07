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
  id?: string;
  name: string;
  family: string;
  file?: string;
  file_url?: string;      // Untuk single file
  font_files?: string[];  // Untuk multiple styles
  description: string;
  tags: string[];
  price?: number;
  styleCount?: number;
  randomText?: string;    // Untuk dummy text unik per kartu
  previewImages?: string[];
  axes: Axis[];
  features?: {
    tag: string;
    name: string;
  }[];
}