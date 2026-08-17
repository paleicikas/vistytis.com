export type Locale = "lt" | "en" | "pl" | "de" | "lv" | "et" | "fr" | "uk";

export type Category =
  | "Gamta"
  | "Kultūros paveldas"
  | "Apžvalgos vietos"
  | "Takai"
  | "Poilsis ir nakvynė"
  | "Lankytojų paslaugos"
  | string;

export type LocalizedPlaceText = {
  name: string;
  description: string;
  text: string;
  notice?: string;
};

export type Place = {
  id: string;
  collectible: boolean;
  name: string;
  categories: Category[];
  topics: string[];
  description: string;
  text: string;
  notice?: string;
  address: string | null;
  city: string | null;
  municipality: string | null;
  coordinates: [number, number];
  i18n?: Partial<Record<Exclude<Locale, "lt">, LocalizedPlaceText>>;
};

export type Rarity = "common" | "rare" | "epic";

export type GameRules = {
  rarity: Record<Rarity, { points: number; color: string; topics: string[] }>;
  defaultRadiusM: number;
  radiusByCategory: Record<string, number>;
  minAccuracyM: number;
  nearbyThresholdM: number;
  categoryColors: Record<string, string>;
  sets: GameSet[];
  levels: {
    base: number;
    exponent: number;
  };
};

export type GameSet = {
  id: string;
  match: {
    topics?: string[];
    city?: string[];
    categories?: string[];
  };
  bonusPoints: number;
};

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type CollectionState = {
  collectedIds: string[];
};

export type CollectionSummary = {
  collected: number;
  total: number;
  points: number;
  level: number;
  nextLevelPoints: number;
};

export type CollectResult =
  | { ok: true; points: number }
  | {
      ok: false;
      reason:
        | "already-collected"
        | "not-collectible"
        | "location-required"
        | "low-accuracy"
        | "too-far";
      distanceM?: number;
      radiusM?: number;
      accuracyM?: number;
    };
