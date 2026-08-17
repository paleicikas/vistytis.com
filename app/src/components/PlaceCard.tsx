import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { categoryLabel, localizePlace, translate } from "../i18n";
import { formatDistance } from "../game";
import { categoryColors, colors, spacing } from "../theme";
import type { Locale, Place } from "../types";

type Props = {
  place: Place;
  locale: Locale;
  distanceM: number | null;
  collected: boolean;
  onPress: () => void;
};

export function PlaceCard({
  place,
  locale,
  distanceM,
  collected,
  onPress,
}: Props) {
  const content = localizePlace(place, locale);
  const category = place.categories[0] ?? "Lankytina vieta";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={content.name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        collected && styles.collectedCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            { backgroundColor: categoryColors[category] ?? colors.primary },
          ]}
        />
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text numberOfLines={2} style={styles.title}>
              {content.name}
            </Text>
            {place.collectible ? (
              <Ionicons
                color={collected ? colors.secondaryDark : colors.muted}
                name={collected ? "checkmark-circle" : "ellipse-outline"}
                size={18}
              />
            ) : null}
          </View>
          <Text style={styles.category}>{categoryLabel(locale, category)}</Text>
          <Text numberOfLines={2} style={styles.description}>
            {content.description}
          </Text>
          {distanceM !== null ? (
            <View style={styles.meta}>
              <Text style={styles.distanceText}>
                {translate(locale, "place.distanceAway", {
                  distance: formatDistance(distanceM),
                })}
              </Text>
            </View>
          ) : null}
        </View>
        <Ionicons color={colors.muted} name="chevron-forward" size={18} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(74, 37, 32, 0.08)",
  },
  collectedCard: {
    backgroundColor: colors.secondaryLight,
    borderColor: "rgba(232, 163, 61, 0.42)",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: 5,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
  },
  category: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: 3,
  },
  distanceText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },
});
