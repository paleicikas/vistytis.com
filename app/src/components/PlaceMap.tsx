import { forwardRef, useImperativeHandle, useRef } from "react";
import MapView, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import { Platform, StyleSheet, Text, View } from "react-native";
import { categoryLabel, localizePlace, translate } from "../i18n";
import { categoryColors, colors, mapCategory } from "../theme";
import type { Locale, Place, UserLocation } from "../types";

export type PlaceMapRef = {
  fitToCoordinates: (
    coordinates: Array<{ latitude: number; longitude: number }>,
    options: {
      edgePadding: { top: number; right: number; bottom: number; left: number };
      animated: boolean;
    }
  ) => void;
  animateToRegion: (region: Region, duration: number) => void;
};

export type PlaceMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type PlaceMapProps = {
  activeCategories?: readonly string[];
  locale: Locale;
  mapRef?: React.Ref<PlaceMapRef>;
  onPlacePress: (place: Place) => void;
  userLocation: UserLocation | null;
  visiblePlaces: Place[];
  initialRegion?: PlaceMapRegion;
};

const initialRegion: Region = {
  latitude: 54.455,
  longitude: 22.735,
  latitudeDelta: 0.15,
  longitudeDelta: 0.19,
};

export const PlaceMap = forwardRef<PlaceMapRef, Omit<PlaceMapProps, "mapRef">>(
  function PlaceMap(
    {
      activeCategories,
      initialRegion: requestedRegion,
      locale,
      onPlacePress,
      userLocation,
      visiblePlaces,
    },
    ref
  ) {
    const nativeMapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      fitToCoordinates: (coordinates, options) => {
        nativeMapRef.current?.fitToCoordinates(coordinates, options);
      },
      animateToRegion: (region, duration) => {
        nativeMapRef.current?.animateToRegion(region, duration);
      },
    }));

    return (
      <MapView
        ref={nativeMapRef}
        initialRegion={requestedRegion ?? initialRegion}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        showsMyLocationButton={false}
        showsUserLocation={Boolean(userLocation)}
        style={styles.map}
      >
        {visiblePlaces.map((place) => {
          const category = mapCategory(place.categories, activeCategories);
          const content = localizePlace(place, locale);

          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.coordinates[1],
                longitude: place.coordinates[0],
              }}
              pinColor={categoryColors[category] ?? colors.primary}
              title={content.name}
            >
              <Callout onPress={() => onPlacePress(place)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{content.name}</Text>
                  <Text style={styles.calloutCategory}>
                    {categoryLabel(locale, category)}
                  </Text>
                  <Text style={styles.calloutAction}>
                    {translate(locale, "place.open")} →
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    );
  }
);

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  callout: {
    width: 190,
    padding: 2,
  },
  calloutTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  calloutCategory: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },
  calloutAction: {
    marginTop: 7,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },
});
