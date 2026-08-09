import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CollectionState } from "./types";

const STORAGE_KEY = "vistytis.collection.v1";

const emptyCollection: CollectionState = {
  collectedIds: [],
};

export async function readCollection(): Promise<CollectionState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyCollection;

    const parsed = JSON.parse(stored) as Partial<CollectionState>;
    return {
      collectedIds: Array.isArray(parsed.collectedIds)
        ? parsed.collectedIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return emptyCollection;
  }
}

export async function writeCollection(collection: CollectionState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}
