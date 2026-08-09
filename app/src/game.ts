import { gameRules, places } from "./data";
import type {
  CollectionState,
  CollectionSummary,
  CollectResult,
  GameSet,
  Place,
  Rarity,
  UserLocation,
} from "./types";

const EARTH_RADIUS_M = 6_371_000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceToPlace(place: Place, location: UserLocation) {
  const [longitude, latitude] = place.coordinates;
  const latitudeDelta = toRadians(latitude - location.latitude);
  const longitudeDelta = toRadians(longitude - location.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(location.latitude)) *
      Math.cos(toRadians(latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function placeRadius(place: Place) {
  return Math.max(
    gameRules.defaultRadiusM,
    ...(place.categories
      .map((category) => gameRules.radiusByCategory[category])
      .filter((radius): radius is number => typeof radius === "number"))
  );
}

export function placeRarity(place: Place): Rarity {
  if (gameRules.rarity.epic.topics.some((topic) => place.topics.includes(topic))) {
    return "epic";
  }
  if (gameRules.rarity.rare.topics.some((topic) => place.topics.includes(topic))) {
    return "rare";
  }
  return "common";
}

export function placePoints(place: Place) {
  return gameRules.rarity[placeRarity(place)].points;
}

export function checkCollectability(
  place: Place,
  location: UserLocation | null
): CollectResult {
  if (!place.collectible) {
    return { ok: false, reason: "not-collectible" };
  }
  if (!location) {
    return { ok: false, reason: "location-required" };
  }
  if (location.accuracy !== null && location.accuracy > gameRules.minAccuracyM) {
    return {
      ok: false,
      reason: "low-accuracy",
      accuracyM: Math.round(location.accuracy),
    };
  }

  const distanceM = distanceToPlace(place, location);
  const radiusM = placeRadius(place);
  if (distanceM > radiusM) {
    return { ok: false, reason: "too-far", distanceM, radiusM };
  }

  return { ok: true, points: placePoints(place) };
}

function placeMatchesSet(place: Place, set: GameSet) {
  const { match } = set;
  return (
    (!match.topics || match.topics.some((topic) => place.topics.includes(topic))) &&
    (!match.city || match.city.includes(place.city ?? "")) &&
    (!match.categories ||
      match.categories.some((category) => place.categories.includes(category)))
  );
}

export function placesForSet(set: GameSet) {
  return places.filter((place) => place.collectible && placeMatchesSet(place, set));
}

export function completedSets(collection: CollectionState) {
  return gameRules.sets.filter((set) => {
    const setPlaces = placesForSet(set);
    return (
      setPlaces.length > 0 &&
      setPlaces.every((place) => collection.collectedIds.includes(place.id))
    );
  });
}

export function setProgress(set: GameSet, collection: CollectionState) {
  const setPlaces = placesForSet(set);
  const collected = setPlaces.filter((place) =>
    collection.collectedIds.includes(place.id)
  ).length;
  return {
    collected,
    total: setPlaces.length,
    completed: setPlaces.length > 0 && collected === setPlaces.length,
  };
}

function pointsForCollection(collection: CollectionState) {
  const collectedPlaces = places.filter(
    (place) => place.collectible && collection.collectedIds.includes(place.id)
  );
  const badgePoints = collectedPlaces.reduce(
    (total, place) => total + placePoints(place),
    0
  );
  const setPoints = completedSets(collection).reduce(
    (total, set) => total + set.bonusPoints,
    0
  );
  return badgePoints + setPoints;
}

function levelThreshold(level: number) {
  return Math.round(
    gameRules.levels.base * Math.pow(Math.max(level - 1, 0), gameRules.levels.exponent)
  );
}

export function collectionSummary(collection: CollectionState): CollectionSummary {
  const total = places.filter((place) => place.collectible).length;
  const collected = places.filter(
    (place) => place.collectible && collection.collectedIds.includes(place.id)
  ).length;
  const points = pointsForCollection(collection);
  let level = 1;

  while (level < 99 && points >= levelThreshold(level + 1)) {
    level += 1;
  }

  return {
    collected,
    total,
    points,
    level,
    nextLevelPoints: levelThreshold(level + 1),
  };
}

export function formatDistance(distanceM: number) {
  return distanceM < 1000 ? `${distanceM} m` : `${(distanceM / 1000).toFixed(1)} km`;
}
