import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { places } from "./data";
import {
  checkCollectability,
  collectionSummary,
  distanceToPlace,
} from "./game";
import type {
  CollectionState,
  CollectResult,
  Locale,
  Place,
  UserLocation,
} from "./types";
import { readCollection, writeCollection } from "./storage";

const LOCALE_STORAGE_KEY = "vistytis.locale.v1";
const supportedLocales: Locale[] = ["lt", "en", "pl", "de"];

type AppContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  collection: CollectionState;
  summary: ReturnType<typeof collectionSummary>;
  userLocation: UserLocation | null;
  isHydrated: boolean;
  isLocating: boolean;
  locationError: "permission-denied" | "unavailable" | null;
  requestLocation: () => Promise<UserLocation | null>;
  clearLocationError: () => void;
  collectPlace: (
    place: Place,
    locationOverride?: UserLocation | null
  ) => Promise<CollectResult>;
  distanceFor: (place: Place) => number | null;
  isCollected: (place: Place) => boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>("lt");
  const [collection, setCollection] = useState<CollectionState>({
    collectedIds: [],
  });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<
    "permission-denied" | "unavailable" | null
  >(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([readCollection(), AsyncStorage.getItem(LOCALE_STORAGE_KEY)])
      .then(([savedCollection, savedLocale]) => {
        if (!mounted) return;
        setCollection(savedCollection);
        if (savedLocale && supportedLocales.includes(savedLocale as Locale)) {
          setLocaleState(savedLocale as Locale);
        }
      })
      .finally(() => {
        if (mounted) setIsHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    void AsyncStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  }, []);

  const requestLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationError("permission-denied");
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const nextLocation: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      };
      setUserLocation(nextLocation);
      return nextLocation;
    } catch {
      setLocationError("unavailable");
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  const collectPlace = useCallback(
    async (
      place: Place,
      locationOverride?: UserLocation | null
    ): Promise<CollectResult> => {
      if (collection.collectedIds.includes(place.id)) {
        return { ok: false, reason: "already-collected" };
      }

      const result = checkCollectability(
        place,
        locationOverride === undefined ? userLocation : locationOverride
      );
      if (!result.ok) return result;

      const nextCollection: CollectionState = {
        collectedIds: [...collection.collectedIds, place.id],
      };
      setCollection(nextCollection);
      await writeCollection(nextCollection);
      return result;
    },
    [collection.collectedIds, userLocation]
  );

  const summary = useMemo(() => collectionSummary(collection), [collection]);
  const distanceFor = useCallback(
    (place: Place) => (userLocation ? distanceToPlace(place, userLocation) : null),
    [userLocation]
  );
  const isCollected = useCallback(
    (place: Place) => collection.collectedIds.includes(place.id),
    [collection.collectedIds]
  );
  const clearLocationError = useCallback(() => setLocationError(null), []);

  const value = useMemo<AppContextValue>(
    () => ({
      locale,
      setLocale,
      collection,
      summary,
      userLocation,
      isHydrated,
      isLocating,
      locationError,
      requestLocation,
      clearLocationError,
      collectPlace,
      distanceFor,
      isCollected,
    }),
    [
      locale,
      setLocale,
      collection,
      summary,
      userLocation,
      isHydrated,
      isLocating,
      locationError,
      requestLocation,
      clearLocationError,
      collectPlace,
      distanceFor,
      isCollected,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return context;
}

export function collectiblePlaces() {
  return places.filter((place) => place.collectible);
}
