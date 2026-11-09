export interface LatestItem {
  date: string;
  price: number | null;
  unit: string;
  change_7d_pct: number | null;
  spike: boolean;
}

export interface Latest {
  updated_at: string;
  source: string;
  regions: Record<string, Record<string, LatestItem>>;
}

export interface Named {
  id: string;
  name: string;
}

export interface Commodity extends Named {
  category: string;
  unit: string;
}

export interface Meta {
  categories: Named[];
  regions: Named[];
  commodities: Commodity[];
}

export interface Point {
  date: string;
  price: number | null;
}

export interface History {
  commodity: string;
  unit: string;
  series: Record<string, Point[]>;
}

export interface MapData {
  source: string;
  viewBox: number[];
  projection: { lonMin: number; latMax: number; kx: number; scale: number; pad: number };
  regions: Record<string, { d: string; label: number[] }>;
}
