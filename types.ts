export interface Axis {
    tag: string;
    name: string;
    min: number;
    max: number;
    default: number;
    step?: number;
    unit?: string;
}

export interface OpenTypeFeature {
    tag: string;
    name: string;
}

export interface FontConfig {
    name: string;
    family: string;
    description: string;
    tags: string[];
    axes: Axis[];
    features: OpenTypeFeature[];
}