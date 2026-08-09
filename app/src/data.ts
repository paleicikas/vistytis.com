import placesJson from "../assets/data/places.json";
import rulesJson from "../assets/data/game-rules.json";
import type { GameRules, Place } from "./types";

export const places = placesJson as Place[];
export const gameRules = rulesJson as GameRules;

export const categories = [
  ...new Set(places.flatMap((place) => place.categories)),
].sort((left, right) => left.localeCompare(right, "lt"));

export function getPlace(id: string | string[] | undefined) {
  const normalizedId = Array.isArray(id) ? id[0] : id;
  return places.find((place) => place.id === normalizedId);
}
