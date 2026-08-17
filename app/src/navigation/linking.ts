import type { LinkingOptions } from "@react-navigation/native";
import * as ExpoLinking from "expo-linking";
import type { RootStackParamList } from "./types";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [ExpoLinking.createURL("/"), "vistytis://"],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Places: "",
          Collection: "collection",
          Info: "info",
        },
      },
      PlaceDetails: "place/:id",
    },
  },
};
