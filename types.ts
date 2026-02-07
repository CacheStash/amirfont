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
  file_url?: string;      // Tambahkan ini
  font_files?: string[];  // Tambahkan ini
  description: string;
  tags: string[];
  price?: number;
  styleCount?: number;
  randomText?: string;    // Untuk fitur dummy text
  
  previewImages?: string[];

  axes: Axis[];
  
  features?: {
    tag: string;
    name: string;
  }[];
}