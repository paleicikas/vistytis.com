import { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useNavigation } from "@react-navigation/native";
import {
  Image,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../AppState";
import { badgeAssets } from "../badges";
import { gameRules, places } from "../data";
import { completedSets, placePoints, setProgress } from "../game";
import { localizePlace, translate } from "../i18n";
import { colors, spacing } from "../theme";
import { BrandMark } from "../components/BrandMark";
import type { AppNavigationProp } from "../navigation/types";
import type { Place } from "../types";

export default function CollectionScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<AppNavigationProp>();
  const { locale, summary, collection, isCollected } = useApp();
  const [shareTarget, setShareTarget] = useState<Place | null>(null);
  const shareCardRef = useRef<ViewShot>(null);
  const collectedPlaces = places.filter(
    (place) => place.collectible && isCollected(place)
  );
  const finishedSets = completedSets(collection);
  const progress = summary.total ? summary.collected / summary.total : 0;
  const badgeColumns = width >= 1100 ? 4 : width >= 720 ? 3 : 2;
  const badgeGridGap = spacing.sm;
  const badgeGridWidth = Math.max(width - spacing.md * 2, 0);
  const badgeCardWidth =
    (badgeGridWidth - badgeGridGap * (badgeColumns - 1)) / badgeColumns;

  async function shareBadge(place: Place) {
    const content = localizePlace(place, locale);
    const message = [
      translate(locale, "collect.shareBadge", { name: content.name }),
      content.description,
    ]
      .filter(Boolean)
      .join("\n\n");

    setShareTarget(place);
    let imageShareAttempted = false;
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      const capturedUri = await shareCardRef.current?.capture?.();

      if (capturedUri) {
        if (Platform.OS === "web") {
          const browserNavigator = navigator as Navigator & {
            canShare?: (data?: { files?: File[] }) => boolean;
            share?: (data: {
              files?: File[];
              text?: string;
              title?: string;
            }) => Promise<void>;
          };

          if (
            typeof File !== "undefined" &&
            browserNavigator.share &&
            typeof fetch === "function"
          ) {
            const response = await fetch(capturedUri);
            const blob = await response.blob();
            const file = new File([blob], `${place.id}-badge.png`, {
              type: "image/png",
            });
            if (
              !browserNavigator.canShare ||
              browserNavigator.canShare({ files: [file] })
            ) {
              imageShareAttempted = true;
              await browserNavigator.share({
                files: [file],
                text: content.description,
                title: content.name,
              });
              return;
            }
          }
        } else if (await Sharing.isAvailableAsync()) {
          const shareUri = capturedUri.startsWith("file://")
            ? capturedUri
            : `file://${capturedUri}`;
          imageShareAttempted = true;
          await Sharing.shareAsync(shareUri, {
            UTI: "public.png",
            dialogTitle: content.name,
            mimeType: "image/png",
          });
          return;
        }
      }
    } catch (error) {
      if (
        imageShareAttempted ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        return;
      }
    } finally {
      setShareTarget(null);
    }

    await Share.share({
      message,
      title: content.name,
    });
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.headingRow}>
        <BrandMark size="medium" />
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>{translate(locale, "app.title")}</Text>
          <Text style={styles.title}>{translate(locale, "progress.title")}</Text>
          <Text style={styles.subtitle}>
            {translate(locale, "progress.of", {
              collected: summary.collected,
              total: summary.total,
            })}
          </Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.levelIcon}>
          <Ionicons color={colors.white} name="ribbon" size={30} />
        </View>
        <View style={styles.levelCopy}>
          <Text style={styles.levelLabel}>
            {translate(locale, "progress.level", { level: summary.level })}
          </Text>
          <Text style={styles.points}>
            {translate(locale, "progress.xp", { xp: summary.points })}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
        </View>
        <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{translate(locale, "progress.sets")}</Text>
        <Text style={styles.sectionMeta}>{finishedSets.length}/{gameRules.sets.length}</Text>
      </View>
      <View style={styles.sets}>
        {gameRules.sets.map((set) => {
          const setState = setProgress(set, collection);
          const setProgressPercent = setState.total
            ? Math.min((setState.collected / setState.total) * 100, 100)
            : 0;
          return (
            <View key={set.id} style={[styles.setCard, setState.completed && styles.setCardDone]}>
              <View style={[styles.setIcon, setState.completed && styles.setIconDone]}>
                <Ionicons
                  color={setState.completed ? colors.white : colors.primary}
                  name={setState.completed ? "checkmark" : "layers-outline"}
                  size={19}
                />
              </View>
              <View style={styles.setCopy}>
                <Text style={styles.setTitle}>
                  {translate(locale, `sets.${set.id}`)}
                </Text>
                <Text style={styles.setProgress}>
                  {translate(locale, "progress.setProgress", {
                    collected: setState.collected,
                    total: setState.total,
                  })}{" "}
                  · +{set.bonusPoints} tšk.
                </Text>
                <View style={styles.setProgressTrack}>
                  <View
                    style={[
                      styles.setProgressFill,
                      { width: `${setProgressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{translate(locale, "nav.collection")}</Text>
        <Text style={styles.sectionMeta}>{collectedPlaces.length}</Text>
      </View>
      {collectedPlaces.length ? (
        <View style={[styles.badgeGrid, { gap: badgeGridGap }]}>
          {collectedPlaces.map((place) => {
            const content = localizePlace(place, locale);
            const badgeSource = badgeAssets[place.id]?.unlocked;
            return (
              <View
                key={place.id}
                style={[styles.badgeCard, { width: badgeCardWidth }]}
              >
                <Pressable
                  onPress={() => navigation.navigate("PlaceDetails", { id: place.id })}
                  style={({ pressed }) => [
                    styles.badgeCardMain,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.badgeArtwork}>
                    {badgeSource ? (
                      <Image
                        accessibilityLabel={content.name}
                        resizeMode="contain"
                        source={badgeSource}
                        style={styles.badgeImage}
                      />
                    ) : (
                      <Ionicons color={colors.primary} name="ribbon-outline" size={28} />
                    )}
                  </View>
                  <View style={styles.badgeCopy}>
                    <Text numberOfLines={2} style={styles.badgeTitle}>
                      {content.name}
                    </Text>
                    <View style={styles.badgeMetaRow}>
                      <Text style={styles.badgeMeta}>
                        {translate(locale, "place.points", { points: placePoints(place) })}
                      </Text>
                      <Ionicons color={colors.muted} name="chevron-forward" size={17} />
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityLabel={translate(locale, "place.share")}
                  accessibilityRole="button"
                  onPress={() => void shareBadge(place)}
                  style={({ pressed }) => [
                    styles.badgeShare,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons color={colors.primaryDark} name="share-social-outline" size={18} />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons color={colors.muted} name="ribbon-outline" size={34} />
          <Text style={styles.emptyText}>{translate(locale, "progress.empty")}</Text>
        </View>
      )}
      </ScrollView>
      {shareTarget ? (
        <View pointerEvents="none" style={styles.shareCardHost}>
          <ViewShot
            ref={shareCardRef}
            options={{
              format: "png",
              quality: 1,
              result: Platform.OS === "web" ? "data-uri" : "tmpfile",
            }}
            style={styles.shareCardCapture}
          >
            <Text style={styles.shareCardEyebrow}>{translate(locale, "app.title")}</Text>
            <Text style={styles.shareCardKicker}>
              {translate(locale, "collect.badgeUnlocked")}
            </Text>
            <View style={styles.shareCardBadge}>
              {badgeAssets[shareTarget.id]?.unlocked ? (
                <Image
                  resizeMode="contain"
                  source={badgeAssets[shareTarget.id].unlocked}
                  style={styles.shareCardBadgeImage}
                />
              ) : (
                <Ionicons color={colors.secondaryDark} name="ribbon" size={72} />
              )}
            </View>
            <Text style={styles.shareCardTitle}>
              {localizePlace(shareTarget, locale).name}
            </Text>
            <Text style={styles.shareCardDescription}>
              {localizePlace(shareTarget, locale).description}
            </Text>
            <Text style={styles.shareCardPoints}>
              {translate(locale, "place.points", {
                points: placePoints(shareTarget),
              })}
            </Text>
          </ViewShot>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.paper,
  },
  heading: {
    flex: 1,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 13,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
  },
  levelIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  levelCopy: {
    flex: 1,
  },
  levelLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  points: {
    marginTop: 2,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 7,
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  percent: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  sets: {
    gap: spacing.sm,
  },
  setCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  setCardDone: {
    borderColor: "rgba(232, 163, 61, 0.45)",
    backgroundColor: colors.secondaryLight,
  },
  setIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  setIconDone: {
    backgroundColor: colors.secondaryDark,
  },
  setCopy: {
    flex: 1,
  },
  setTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  setProgress: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 11,
  },
  setProgressTrack: {
    height: 5,
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: colors.paperSoft,
  },
  setProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  badgeCard: {
    position: "relative",
    padding: spacing.sm,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(232, 163, 61, 0.35)",
  },
  badgeCardMain: {
    width: "100%",
  },
  pressed: {
    opacity: 0.75,
  },
  badgeArtwork: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.secondaryLight,
  },
  badgeImage: {
    width: "100%",
    height: "100%",
  },
  badgeCopy: {
    marginTop: spacing.sm,
  },
  badgeTitle: {
    minHeight: 36,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  badgeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  badgeMeta: {
    color: colors.secondaryDark,
    fontSize: 11,
    fontWeight: "800",
  },
  badgeShare: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(232, 163, 61, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  shareCardHost: {
    position: "absolute",
    top: 0,
    left: -500,
    width: 360,
  },
  shareCardCapture: {
    width: 360,
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.paper,
  },
  shareCardEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  shareCardKicker: {
    marginTop: spacing.sm,
    color: colors.secondaryDark,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  shareCardBadge: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    borderRadius: 110,
    backgroundColor: colors.secondaryLight,
  },
  shareCardBadgeImage: {
    width: 212,
    height: 212,
  },
  shareCardTitle: {
    marginTop: spacing.md,
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 29,
    textAlign: "center",
  },
  shareCardDescription: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  shareCardPoints: {
    marginTop: spacing.md,
    color: colors.secondaryDark,
    fontSize: 14,
    fontWeight: "900",
  },
  empty: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: 16,
    backgroundColor: colors.paperSoft,
  },
  emptyText: {
    maxWidth: 280,
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
