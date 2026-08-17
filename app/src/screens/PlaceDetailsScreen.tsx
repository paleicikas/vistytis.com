import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../AppState";
import { badgeAssets } from "../badges";
import badgeCollectedSound from "../../assets/audio/badge-collected.mp3";
import { getPlace } from "../data";
import {
  formatDistance,
  placePoints,
  placeRadius,
  placeRarity,
} from "../game";
import { categoryLabel, localizePlace, translate } from "../i18n";
import { categoryColors, colors, spacing } from "../theme";
import { LanguagePicker } from "../components/LanguagePicker";
import { PlaceMap } from "../components/PlaceMap";
import type { RootNavigationProp, RootStackParamList } from "../navigation/types";

export default function PlaceDetailsScreen() {
  const collectionSound = useAudioPlayer(badgeCollectedSound);
  const navigation = useNavigation<RootNavigationProp>();
  const { id } = useRoute<RouteProp<RootStackParamList, "PlaceDetails">>().params;
  const place = getPlace(id);
  const {
    locale,
    setLocale,
    requestLocation,
    isLocating,
    collectPlace,
    distanceFor,
    isCollected,
  } = useApp();
  const [isSharing, setIsSharing] = useState(false);
  const [tooFarDetails, setTooFarDetails] = useState<{
    distanceM: number;
    radiusM: number;
  } | null>(null);
  const [isCollectionCelebrationVisible, setIsCollectionCelebrationVisible] =
    useState(false);
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    if (!isCollectionCelebrationVisible) return;

    celebrationOpacity.setValue(0);
    celebrationScale.setValue(0.86);
    Animated.parallel([
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    celebrationOpacity,
    celebrationScale,
    isCollectionCelebrationVisible,
  ]);

  if (!place) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.title}>{translate(locale, "common.error")}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{translate(locale, "common.close")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const selectedPlace = place;
  const content = localizePlace(place, locale);
  const collected = isCollected(place);
  const distanceM = distanceFor(place);
  const radiusM = placeRadius(place);
  const rarity = placeRarity(place);
  const badgeSource = badgeAssets[place.id]?.[collected ? "unlocked" : "locked"];
  const lockedBadgeSource = badgeAssets[place.id]?.locked;
  const unlockedBadgeSource = badgeAssets[place.id]?.unlocked;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coordinates[1]},${place.coordinates[0]}`;
  const placeMapRegion = {
    latitude: place.coordinates[1],
    longitude: place.coordinates[0],
    latitudeDelta: 0.018,
    longitudeDelta: 0.024,
  };

  async function collect() {
    let result = await collectPlace(selectedPlace);
    if (!result.ok && result.reason === "location-required") {
      const location = await requestLocation();
      if (location) result = await collectPlace(selectedPlace, location);
    }

    if (result.ok) {
      collectionSound.play();
      setIsCollectionCelebrationVisible(true);
      return;
    }

    if (result.reason === "already-collected") return;
    if (result.reason === "location-required") {
      Alert.alert(translate(locale, "collect.needLocation"));
    } else if (result.reason === "low-accuracy") {
      Alert.alert(
        translate(locale, "collect.lowAccuracy", {
          accuracy: result.accuracyM ?? "?",
        })
      );
    } else if (result.reason === "too-far") {
      setTooFarDetails({
        distanceM: result.distanceM ?? 0,
        radiusM: result.radiusM ?? radiusM,
      });
    }
  }

  async function sharePlace() {
    setIsSharing(true);
    try {
      await Share.share({
        message: `${content.name} — ${mapsUrl}`,
        url: mapsUrl,
      });
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={translate(locale, "common.close")}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons color={colors.ink} name="arrow-back" size={21} />
          </Pressable>
          <LanguagePicker value={locale} onChange={setLocale} />
        </View>

        <View style={styles.heroRow}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: categoryColors[place.categories[0]] ?? colors.primary },
            ]}
          >
            <Ionicons
              color={colors.white}
              name={place.collectible ? "ribbon-outline" : "location-outline"}
              size={39}
            />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{translate(locale, "app.title")}</Text>
            <Text style={styles.title}>{content.name}</Text>
            <Text style={styles.category}>
              {categoryLabel(locale, place.categories[0] ?? "")}
            </Text>
          </View>
        </View>
        <Text style={styles.description}>{content.description}</Text>
        <Text style={styles.body}>{content.text}</Text>

        <View style={styles.metaCard}>
          {place.address ? (
            <MetaRow
              icon="navigate-outline"
              label={translate(locale, "place.address")}
              value={place.address}
            />
          ) : null}
          <MetaRow
            icon="location-outline"
            label={translate(locale, "place.location")}
            value={[place.city, place.municipality].filter(Boolean).join(" · ") || "Vištytis"}
          />
          <MetaRow
            icon="pricetag-outline"
            label={translate(locale, "place.topics")}
            value={place.topics.join(", ") || "–"}
          />
        </View>

        {place.collectible ? (
          <View style={[styles.collectionCard, collected && styles.collectionCardCollected]}>
            <View style={styles.collectionTop}>
              {badgeSource ? (
                <Image
                  accessibilityLabel={content.name}
                  resizeMode="contain"
                  source={badgeSource}
                  style={styles.badgePreview}
                />
              ) : null}
              <View style={styles.collectionInfo}>
                <Text style={[styles.collectionLabel, collected && styles.collectedText]}>
                  {translate(locale, `rarity.${rarity}`)}
                </Text>
                <Text style={[styles.collectionPoints, collected && styles.collectedText]}>
                  {translate(locale, "place.points", { points: placePoints(place) })}
                </Text>
              </View>
              <Ionicons
                color={collected ? colors.secondaryDark : colors.muted}
                name={collected ? "checkmark-circle" : "lock-closed-outline"}
                size={27}
              />
            </View>
            {distanceM !== null ? (
              <Text style={[styles.distance, collected && styles.distanceCollected]}>
                {collected
                  ? translate(locale, "place.collected")
                  : translate(locale, "place.distanceAway", {
                      distance: formatDistance(distanceM),
                    })}
              </Text>
            ) : (
              <Text style={styles.distance}>
                {translate(locale, "place.lockedHint", { radius: radiusM })}
              </Text>
            )}
            <Pressable
              disabled={collected || isLocating}
              onPress={() => void collect()}
              style={[
                styles.primaryButton,
                (collected || isLocating) && styles.disabledButton,
                collected && styles.collectedButton,
              ]}
            >
              {isLocating ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Ionicons
                  color={colors.white}
                  name={collected ? "checkmark" : "ribbon-outline"}
                  size={18}
                />
              )}
              <Text style={styles.primaryButtonText}>
                {collected
                  ? translate(locale, "place.collected")
                  : translate(locale, "place.collect")}
              </Text>
            </Pressable>
            <Text style={styles.privacyNote}>
              {translate(locale, "privacy.note")}
            </Text>
          </View>
        ) : (
          <View style={styles.serviceCard}>
            <Ionicons color={colors.primary} name="information-circle-outline" size={20} />
            <Text style={styles.serviceText}>
              {translate(locale, "place.service")}
            </Text>
          </View>
        )}

        <View style={styles.locationCard}>
          <View style={styles.locationMap}>
            <PlaceMap
              initialRegion={placeMapRegion}
              locale={locale}
              onPlacePress={() => undefined}
              userLocation={null}
              visiblePlaces={[place]}
            />
          </View>
          <View style={styles.locationMapFooter}>
            <Ionicons color={colors.primary} name="location-outline" size={18} />
            <View style={styles.locationMapCopy}>
              <Text style={styles.locationMapLabel}>
                {translate(locale, "place.location")}
              </Text>
              <Text style={styles.locationMapTitle}>{content.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => void Linking.openURL(mapsUrl)} style={styles.secondaryButton}>
            <Ionicons color={colors.primaryDark} name="navigate-outline" size={18} />
            <Text style={styles.secondaryButtonText}>
              {translate(locale, "place.navigate")}
            </Text>
          </Pressable>
          <Pressable
            disabled={isSharing}
            onPress={() => void sharePlace()}
            style={styles.secondaryButton}
          >
            {isSharing ? (
              <ActivityIndicator color={colors.primaryDark} size="small" />
            ) : (
              <Ionicons color={colors.primaryDark} name="share-social-outline" size={18} />
            )}
            <Text style={styles.secondaryButtonText}>
              {translate(locale, "place.share")}
            </Text>
          </Pressable>
        </View>

        {content.notice ? (
          <View style={styles.notice}>
            <Ionicons color="#9b6c28" name="warning-outline" size={18} />
            <Text style={styles.noticeText}>{content.notice}</Text>
          </View>
        ) : null}
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="fade"
        onRequestClose={() => setTooFarDetails(null)}
        transparent
        visible={tooFarDetails !== null}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel={translate(locale, "common.close")}
            onPress={() => setTooFarDetails(null)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              {lockedBadgeSource ? (
                <Image
                  accessibilityLabel={content.name}
                  resizeMode="contain"
                  source={lockedBadgeSource}
                  style={styles.modalBadgeImage}
                />
              ) : (
                <Ionicons color={colors.primary} name="ribbon" size={42} />
              )}
              <View style={styles.modalBadgeLock}>
                <Ionicons color={colors.primaryDark} name="lock-closed" size={15} />
              </View>
            </View>
            <Text style={styles.modalKicker}>{translate(locale, "place.locked")}</Text>
            <Text style={styles.modalTitle}>
              {tooFarDetails
                ? translate(locale, "place.tooFar", {
                    distance: formatDistance(tooFarDetails.distanceM),
                  })
                : null}
            </Text>
            <Text style={styles.modalPlaceName}>{content.name}</Text>
            <View style={styles.modalHint}>
              <Ionicons color={colors.primary} name="walk-outline" size={20} />
              <Text style={styles.modalHintText}>
                {tooFarDetails
                  ? translate(locale, "place.lockedHint", {
                      radius: tooFarDetails.radiusM,
                    })
                  : null}
              </Text>
            </View>
            <Pressable
              onPress={() => setTooFarDetails(null)}
              style={styles.modalButton}
            >
              <Ionicons color={colors.white} name="checkmark" size={18} />
              <Text style={styles.modalButtonText}>
                {translate(locale, "common.close")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsCollectionCelebrationVisible(false)}
        transparent
        visible={isCollectionCelebrationVisible}
      >
        <View style={styles.celebrationBackdrop}>
          <Pressable
            accessibilityLabel={translate(locale, "common.close")}
            onPress={() => setIsCollectionCelebrationVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              styles.celebrationCard,
              {
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }],
              },
            ]}
          >
            <View style={styles.celebrationSparkles}>
              <Ionicons color={colors.secondary} name="sparkles-outline" size={25} />
            </View>
            <View style={styles.celebrationBadge}>
              {unlockedBadgeSource ? (
                <Image
                  accessibilityLabel={content.name}
                  resizeMode="contain"
                  source={unlockedBadgeSource}
                  style={styles.celebrationBadgeImage}
                />
              ) : (
                <Ionicons color={colors.secondaryDark} name="ribbon" size={64} />
              )}
              <View style={styles.celebrationCheck}>
                <Ionicons color={colors.white} name="checkmark" size={20} />
              </View>
            </View>
            <Text style={styles.celebrationKicker}>
              {translate(locale, "collect.badgeUnlocked")}
            </Text>
            <Text style={styles.celebrationTitle}>{content.name}</Text>
            <Text style={styles.celebrationPoints}>
              {translate(locale, "place.points", { points: placePoints(place) })}
            </Text>
            <Text style={styles.celebrationHint}>
              {translate(locale, "collect.celebrationHint")}
            </Text>
            <Pressable
              onPress={() => setIsCollectionCelebrationVisible(false)}
              style={styles.celebrationButton}
            >
              <Ionicons color={colors.white} name="arrow-forward" size={18} />
              <Text style={styles.celebrationButtonText}>
                {translate(locale, "collect.continue")}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Ionicons color={colors.primary} name={icon} size={17} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
    paddingVertical: spacing.sm,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  heroIcon: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 29,
    fontWeight: "800",
    lineHeight: 34,
  },
  category: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  description: {
    marginTop: spacing.md,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  body: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  metaCard: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  metaLabel: {
    width: 74,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  metaValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    lineHeight: 17,
  },
  collectionCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },
  collectionCardCollected: {
    backgroundColor: colors.secondaryLight,
  },
  collectionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  badgePreview: {
    width: 72,
    height: 72,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionLabel: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  collectionPoints: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  collectedText: {
    color: colors.secondaryDark,
  },
  distance: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  distanceCollected: {
    color: colors.secondaryDark,
    fontWeight: "800",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 47,
    marginTop: spacing.md,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: "#d98b86",
  },
  collectedButton: {
    backgroundColor: colors.secondaryDark,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  privacyNote: {
    marginTop: 9,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.paperSoft,
  },
  serviceText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  locationCard: {
    marginTop: spacing.md,
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  locationMap: {
    height: 220,
    backgroundColor: colors.map,
  },
  locationMapFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  locationMapCopy: {
    flex: 1,
  },
  locationMapLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  locationMapTitle: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#f4e2df",
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "900",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: spacing.lg,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: "#fff3dd",
  },
  noticeText: {
    flex: 1,
    color: "#80602c",
    fontSize: 11,
    lineHeight: 17,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(49, 24, 22, 0.58)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 26,
    backgroundColor: colors.paper,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalBadge: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 52,
    backgroundColor: colors.paperSoft,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  modalBadgeImage: {
    width: "100%",
    height: "100%",
  },
  modalBadgeLock: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  modalKicker: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  modalTitle: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  modalPlaceName: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  modalHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    width: "100%",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },
  modalHintText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    minHeight: 46,
    marginTop: spacing.md,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  celebrationBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(49, 24, 22, 0.68)",
  },
  celebrationCard: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderRadius: 28,
    backgroundColor: colors.paper,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 14,
  },
  celebrationSparkles: {
    position: "absolute",
    top: 18,
    right: 22,
  },
  celebrationBadge: {
    width: 172,
    height: 172,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 86,
    backgroundColor: colors.secondaryLight,
    shadowColor: colors.secondaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  celebrationBadgeImage: {
    width: 164,
    height: 164,
  },
  celebrationCheck: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.secondaryDark,
    borderWidth: 3,
    borderColor: colors.paper,
  },
  celebrationKicker: {
    marginTop: spacing.lg,
    color: colors.secondaryDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  celebrationTitle: {
    marginTop: 6,
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 31,
    textAlign: "center",
  },
  celebrationPoints: {
    marginTop: 7,
    color: colors.secondaryDark,
    fontSize: 14,
    fontWeight: "900",
  },
  celebrationHint: {
    maxWidth: 280,
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  celebrationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    minHeight: 47,
    marginTop: spacing.lg,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  celebrationButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
});
