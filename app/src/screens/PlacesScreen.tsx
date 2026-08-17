import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../AppState";
import { categories, places } from "../data";
import { categoryLabel, localizePlace, translate } from "../i18n";
import { categoryColors, colors, spacing } from "../theme";
import { LanguagePicker } from "../components/LanguagePicker";
import { BrandMark } from "../components/BrandMark";
import { PlaceCard } from "../components/PlaceCard";
import { PlaceMap, type PlaceMapRef } from "../components/PlaceMap";
import type { Place } from "../types";
import type { AppNavigationProp } from "../navigation/types";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

type ViewMode = "map" | "list";

const LOCATION_REFRESH_INTERVAL_MS = 10_000;

export default function PlacesScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const isFocused = useIsFocused();
  const {
    locale,
    setLocale,
    summary,
    userLocation,
    isHydrated,
    isLocating,
    locationError,
    requestLocation,
    distanceFor,
    isCollected,
  } = useApp();
  const mapRef = useRef<PlaceMapRef>(null);
  const searchInputRef = useRef<TextInput>(null);
  const locationRequestInFlight = useRef(false);
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>(categories);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const visiblePlaces = useMemo(() => {
    const searchTerm = normalize(query.trim());
    return places.filter((place) => {
      const categoryMatch = place.categories.some((category) =>
        activeCategories.includes(category)
      );
      if (!categoryMatch) return false;
      if (!searchTerm) return true;

      const content = localizePlace(place, locale);
      return normalize(
        [
          content.name,
          content.description,
          content.text,
          place.city,
          place.municipality,
          place.address,
          ...place.topics,
          ...place.categories,
        ]
          .filter(Boolean)
          .join(" ")
      ).includes(searchTerm);
    });
  }, [activeCategories, locale, query]);

  const listPlaces = useMemo(
    () =>
      visiblePlaces
        .map((place, index) => ({
          distanceM: distanceFor(place),
          index,
          place,
        }))
        .sort((left, right) => {
          if (left.distanceM === null && right.distanceM === null) {
            return left.index - right.index;
          }
          if (left.distanceM === null) return 1;
          if (right.distanceM === null) return -1;
          return left.distanceM - right.distanceM || left.index - right.index;
        })
        .map(({ place }) => place),
    [distanceFor, visiblePlaces]
  );

  const allCategoriesActive = activeCategories.length === categories.length;

  function toggleCategory(category?: string) {
    if (!category) {
      setActiveCategories(allCategoriesActive ? [] : categories);
      return;
    }
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function openPlace(place: Place) {
    navigation.navigate("PlaceDetails", { id: place.id });
  }

  function closeSearch() {
    setQuery("");
    setIsSearchOpen(false);
  }

  const focusPlaces = useCallback((nextPlaces: Place[]) => {
    const coordinates = nextPlaces.map((place) => ({
      latitude: place.coordinates[1],
      longitude: place.coordinates[0],
    }));

    if (!coordinates.length) return;

    if (coordinates.length === 1) {
      const [coordinate] = coordinates;
      mapRef.current?.animateToRegion(
        {
          ...coordinate,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        500
      );
      return;
    }

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, []);

  useEffect(() => {
    if (viewMode === "map") {
      focusPlaces(visiblePlaces);
    }
  }, [focusPlaces, viewMode, visiblePlaces]);

  const refreshLocation = useCallback(async () => {
    if (locationRequestInFlight.current) return;

    locationRequestInFlight.current = true;
    try {
      await requestLocation();
    } finally {
      locationRequestInFlight.current = false;
    }
  }, [requestLocation]);

  useEffect(() => {
    if (!isFocused || viewMode !== "list") return;

    void refreshLocation();
    const interval = setInterval(() => {
      void refreshLocation();
    }, LOCATION_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isFocused, refreshLocation, viewMode]);

  function fitVisible() {
    focusPlaces(visiblePlaces);
  }

  async function locateMe() {
    const location = await requestLocation();
    if (location && Platform.OS !== "web") {
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        500
      );
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headingGroup}>
          <BrandMark />
          <View style={styles.heading}>
            <Text style={styles.title}>{translate(locale, "app.title")}</Text>
            <Text style={styles.eyebrow}>{translate(locale, "app.tagline")}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.headerActionRow}>
            <LanguagePicker value={locale} onChange={setLocale} />
          </View>
          <Pressable
            accessibilityLabel={translate(locale, "nav.collection")}
            onPress={() => navigation.navigate("Collection")}
            style={styles.collectionButton}
          >
            <Ionicons color={colors.primary} name="ribbon-outline" size={19} />
            <View style={styles.collectionCopy}>
              <Text numberOfLines={1} style={styles.collectionCount}>
                {summary.collected}/{summary.total} ·{" "}
                {translate(locale, "progress.xp", { xp: summary.points })}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View accessibilityRole="tablist" style={styles.viewSwitcher}>
        <Pressable
          accessibilityLabel={translate(locale, "places.map")}
          accessibilityRole="tab"
          accessibilityState={{ selected: viewMode === "map" }}
          onPress={() => setViewMode("map")}
          style={[styles.viewTab, viewMode === "map" && styles.viewTabActive]}
        >
          <Ionicons
            color={viewMode === "map" ? colors.white : colors.primary}
            name="map-outline"
            size={18}
          />
          <Text style={[styles.viewTabText, viewMode === "map" && styles.viewTabTextActive]}>
            {translate(locale, "places.map")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={translate(locale, "places.list")}
          accessibilityRole="tab"
          accessibilityState={{ selected: viewMode === "list" }}
          onPress={() => setViewMode("list")}
          style={[styles.viewTab, viewMode === "list" && styles.viewTabActive]}
        >
          <Ionicons
            color={viewMode === "list" ? colors.white : colors.primary}
            name="list-outline"
            size={18}
          />
          <Text style={[styles.viewTabText, viewMode === "list" && styles.viewTabTextActive]}>
            {translate(locale, "places.list")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={translate(locale, "common.search")}
          accessibilityRole="button"
          onPress={() => setIsSearchOpen(true)}
          style={[styles.searchToggle, isSearchOpen && styles.searchToggleActive]}
        >
          <Ionicons color={colors.primary} name="search-outline" size={19} />
        </Pressable>
      </View>

      {isSearchOpen ? (
        <View style={styles.searchBox}>
          <Ionicons color={colors.primary} name="search-outline" size={19} />
          <TextInput
            ref={searchInputRef}
            accessibilityLabel={translate(locale, "common.search")}
            autoCapitalize="none"
            onChangeText={setQuery}
            placeholder={translate(locale, "common.search")}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityLabel={translate(locale, "common.search")}
              onPress={() => setQuery("")}
            >
              <Ionicons color={colors.muted} name="close-circle" size={19} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel={translate(locale, "common.close")}
            accessibilityRole="button"
            onPress={closeSearch}
          >
            <Ionicons color={colors.muted} name="close" size={20} />
          </Pressable>
        </View>
      ) : null}

      {locationError ? (
        <View style={styles.locationNotice}>
          <Ionicons color={colors.danger} name="information-circle-outline" size={18} />
          <Text style={styles.locationNoticeText}>
            {locationError === "permission-denied"
              ? translate(locale, "collect.locationDenied")
              : translate(locale, "common.error")}
          </Text>
        </View>
      ) : null}

      <View style={styles.contentArea}>
        {viewMode === "map" ? (
          <View style={styles.mapCard}>
            <PlaceMap
              activeCategories={activeCategories}
              ref={mapRef}
              locale={locale}
              onPlacePress={openPlace}
              userLocation={userLocation}
              visiblePlaces={visiblePlaces}
            />
            {visiblePlaces.length === 0 ? (
              <View pointerEvents="none" style={styles.mapEmpty}>
                <Ionicons color={colors.muted} name="search-outline" size={28} />
                <Text style={styles.mapEmptyText}>{translate(locale, "empty.noResults")}</Text>
              </View>
            ) : null}
            <View style={styles.mapActions}>
              <Pressable
                accessibilityLabel={translate(locale, "nav.locate")}
                disabled={isLocating}
                onPress={() => void locateMe()}
                style={styles.mapAction}
              >
                {isLocating ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Ionicons color={colors.primary} name="locate-outline" size={20} />
                )}
              </Pressable>
              <Pressable
                accessibilityLabel={translate(locale, "places.map")}
                disabled={!visiblePlaces.length}
                onPress={fitVisible}
                style={[styles.mapAction, !visiblePlaces.length && styles.mapActionDisabled]}
              >
                <Ionicons color={colors.primary} name="scan-outline" size={20} />
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={[styles.list, styles.listWithFilters]}
            data={listPlaces}
            extraData={{
              isLocating,
              userLocation,
            }}
            keyExtractor={(place) => place.id}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons color={colors.muted} name="search-outline" size={30} />
                <Text style={styles.emptyText}>{translate(locale, "empty.noResults")}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <PlaceCard
                collected={isCollected(item)}
                distanceM={distanceFor(item)}
                locale={locale}
                onPress={() => openPlace(item)}
                place={item}
              />
            )}
            style={styles.listView}
          />
        )}
        <View style={styles.filtersOverlay}>
          <ScrollView
            contentContainerStyle={styles.filters}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            <Pressable
              onPress={() => toggleCategory()}
              style={[styles.filter, allCategoriesActive && styles.filterActive]}
            >
              <Text style={[styles.filterText, allCategoriesActive && styles.filterTextActive]}>
                {translate(locale, "filters.all")}
              </Text>
            </Pressable>
            {categories.map((category) => {
              const active = activeCategories.includes(category);
              return (
                <Pressable
                  key={category}
                  onPress={() => toggleCategory(category)}
                  style={[styles.filter, active && styles.filterActive]}
                >
                  <View
                    style={[
                      styles.filterDot,
                      { backgroundColor: categoryColors[category] ?? colors.primary },
                    ]}
                  />
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {categoryLabel(locale, category)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View pointerEvents="none" style={styles.resultOverlay}>
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>
              {translate(locale, "places.visible", { count: visiblePlaces.length })}
            </Text>
            {!isHydrated ? <ActivityIndicator color={colors.primary} size="small" /> : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    zIndex: 20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  heading: {
    flex: 1,
  },
  headingGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  eyebrow: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 2,
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", default: undefined }),
    fontSize: 28,
    fontWeight: "800",
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  headerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  collectionCopy: {
    flexShrink: 1,
  },
  collectionCount: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "900",
  },
  searchToggle: {
    width: 42,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchToggleActive: {
    backgroundColor: colors.primaryLight,
    borderColor: "rgba(222, 33, 25, 0.32)",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: colors.ink,
    fontSize: 14,
  },
  viewSwitcher: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.paperSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  viewTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 40,
    borderRadius: 10,
  },
  viewTabActive: {
    backgroundColor: colors.primary,
  },
  viewTabText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  viewTabTextActive: {
    color: colors.white,
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  mapCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 0,
    backgroundColor: colors.map,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  mapFallbackTitle: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  mapFallbackText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
  mapActions: {
    position: "absolute",
    right: 10,
    bottom: 10,
    gap: 8,
  },
  mapAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.paper,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  mapActionDisabled: {
    opacity: 0.5,
  },
  mapEmpty: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(250, 248, 242, 0.72)",
  },
  mapEmptyText: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
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
  locationNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: "#f7e9e4",
  },
  locationNoticeText: {
    flex: 1,
    color: colors.danger,
    fontSize: 11,
    lineHeight: 16,
  },
  filtersOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 10,
    height: 56,
    backgroundColor: "rgba(250, 248, 242, 0.92)",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  filters: {
    alignItems: "center",
    gap: 7,
    height: 56,
    paddingHorizontal: spacing.md,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 56,
  },
  listView: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  listWithFilters: {
    paddingTop: 94,
  },
  resultOverlay: {
    position: "absolute",
    top: 60,
    right: 0,
    left: 0,
    zIndex: 9,
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(250, 248, 242, 0.92)",
    borderWidth: 1,
    borderColor: colors.line,
  },
  resultBadgeText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  filterTextActive: {
    color: colors.primaryDark,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surfaceMuted,
  },
  empty: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
  },
});
