import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import type { RootNavigationProp, RootStackParamList } from "../navigation/types";

export default function PlaceDetailsScreen() {
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
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coordinates[1]},${place.coordinates[0]}`;

  async function collect() {
    let result = await collectPlace(selectedPlace);
    if (!result.ok && result.reason === "location-required") {
      const location = await requestLocation();
      if (location) result = await collectPlace(selectedPlace, location);
    }

    if (result.ok) {
      Alert.alert(
        translate(locale, "collect.success", { name: content.name }),
        translate(locale, "place.points", { points: result.points })
      );
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

        <View
          style={[
            styles.heroIcon,
            { backgroundColor: categoryColors[place.categories[0]] ?? colors.green },
          ]}
        >
          <Ionicons
            color={colors.white}
            name={place.collectible ? "ribbon-outline" : "location-outline"}
            size={39}
          />
        </View>
        <Text style={styles.eyebrow}>{translate(locale, "app.title")}</Text>
        <Text style={styles.title}>{content.name}</Text>
        <Text style={styles.category}>
          {categoryLabel(locale, place.categories[0] ?? "")}
        </Text>
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
          <MetaRow
            icon="map-outline"
            label={translate(locale, "place.coordinates")}
            value={`${place.coordinates[1].toFixed(5)}, ${place.coordinates[0].toFixed(5)}`}
          />
        </View>

        {place.collectible ? (
          <View style={styles.collectionCard}>
            <View style={styles.collectionTop}>
              <View>
                <Text style={styles.collectionLabel}>
                  {translate(locale, `rarity.${rarity}`)}
                </Text>
                <Text style={styles.collectionPoints}>
                  {translate(locale, "place.points", { points: placePoints(place) })}
                </Text>
              </View>
              <Ionicons
                color={collected ? colors.green : colors.muted}
                name={collected ? "checkmark-circle" : "lock-closed-outline"}
                size={27}
              />
            </View>
            {distanceM !== null ? (
              <Text style={styles.distance}>
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
            <Ionicons color={colors.green} name="information-circle-outline" size={20} />
            <Text style={styles.serviceText}>
              {translate(locale, "place.service")}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable onPress={() => void Linking.openURL(mapsUrl)} style={styles.secondaryButton}>
            <Ionicons color={colors.greenDark} name="navigate-outline" size={18} />
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
              <ActivityIndicator color={colors.greenDark} size="small" />
            ) : (
              <Ionicons color={colors.greenDark} name="share-social-outline" size={18} />
            )}
            <Text style={styles.secondaryButtonText}>
              {translate(locale, "place.share")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.borderNote}>
          <Ionicons color="#9b6c28" name="warning-outline" size={18} />
          <Text style={styles.borderText}>
            {translate(locale, "safety.borderZone")}
          </Text>
        </View>
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
            <View
              style={[
                styles.modalBadge,
                { backgroundColor: categoryColors[place.categories[0]] ?? colors.green },
              ]}
            >
              <View style={styles.modalBadgeRing}>
                <Ionicons color={colors.white} name="ribbon" size={42} />
              </View>
              <View style={styles.modalBadgeLock}>
                <Ionicons color={colors.greenDark} name="lock-closed" size={15} />
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
              <Ionicons color={colors.green} name="walk-outline" size={20} />
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
      <Ionicons color={colors.green} name={icon} size={17} />
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
    paddingVertical: spacing.sm,
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
    marginTop: spacing.md,
    borderRadius: 24,
  },
  eyebrow: {
    marginTop: spacing.lg,
    color: colors.green,
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
    color: colors.green,
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
    backgroundColor: colors.greenLight,
  },
  collectionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionLabel: {
    color: colors.greenDark,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  collectionPoints: {
    marginTop: 3,
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
  },
  distance: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 47,
    marginTop: spacing.md,
    borderRadius: 13,
    backgroundColor: colors.green,
  },
  disabledButton: {
    backgroundColor: "#8caaa2",
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
    backgroundColor: "#e8efeb",
  },
  secondaryButtonText: {
    color: colors.greenDark,
    fontSize: 11,
    fontWeight: "900",
  },
  borderNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: spacing.lg,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: "#fff3dd",
  },
  borderText: {
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
    backgroundColor: "rgba(15, 35, 34, 0.58)",
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
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  modalBadgeRing: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.58)",
    backgroundColor: "rgba(255,255,255,0.14)",
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
    color: colors.green,
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
    backgroundColor: colors.greenLight,
  },
  modalHintText: {
    flex: 1,
    color: colors.greenDark,
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
    backgroundColor: colors.green,
  },
  modalButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
});
