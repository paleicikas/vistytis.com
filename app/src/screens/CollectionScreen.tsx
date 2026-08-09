import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../AppState";
import { gameRules, places } from "../data";
import { completedSets, placePoints, setProgress } from "../game";
import { localizePlace, translate } from "../i18n";
import { colors, spacing } from "../theme";
import type { AppNavigationProp } from "../navigation/types";

export default function CollectionScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { locale, summary, collection, isCollected } = useApp();
  const collectedPlaces = places.filter(
    (place) => place.collectible && isCollected(place)
  );
  const finishedSets = completedSets(collection);
  const progress = summary.total ? summary.collected / summary.total : 0;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
          return (
            <View key={set.id} style={[styles.setCard, setState.completed && styles.setCardDone]}>
              <View style={[styles.setIcon, setState.completed && styles.setIconDone]}>
                <Ionicons
                  color={setState.completed ? colors.white : colors.green}
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
        collectedPlaces.map((place) => {
          const content = localizePlace(place, locale);
          return (
            <Pressable
              key={place.id}
              onPress={() => navigation.navigate("PlaceDetails", { id: place.id })}
              style={({ pressed }) => [styles.badgeRow, pressed && styles.pressed]}
            >
              <View style={styles.badgeIcon}>
                <Ionicons color={colors.green} name="ribbon-outline" size={21} />
              </View>
              <View style={styles.badgeCopy}>
                <Text style={styles.badgeTitle}>{content.name}</Text>
                <Text style={styles.badgeMeta}>
                  {translate(locale, "place.points", { points: placePoints(place) })}
                </Text>
              </View>
              <Ionicons color={colors.muted} name="chevron-forward" size={18} />
            </Pressable>
          );
        })
      ) : (
        <View style={styles.empty}>
          <Ionicons color={colors.muted} name="ribbon-outline" size={34} />
          <Text style={styles.emptyText}>{translate(locale, "progress.empty")}</Text>
        </View>
      )}
      </ScrollView>
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
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.green,
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
    backgroundColor: colors.greenDark,
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
    backgroundColor: "#e8a33d",
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
    borderColor: "rgba(47, 104, 97, 0.35)",
    backgroundColor: colors.greenLight,
  },
  setIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.greenLight,
  },
  setIconDone: {
    backgroundColor: colors.green,
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: {
    opacity: 0.75,
  },
  badgeIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.greenLight,
  },
  badgeCopy: {
    flex: 1,
  },
  badgeTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  badgeMeta: {
    marginTop: 3,
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
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
