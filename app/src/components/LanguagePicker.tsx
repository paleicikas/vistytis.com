import { Pressable, StyleSheet, Text, View } from "react-native";
import { localeLabels } from "../i18n";
import { colors } from "../theme";
import type { Locale } from "../types";

const locales: Locale[] = ["lt", "en", "pl", "de"];

type Props = {
  value: Locale;
  onChange: (locale: Locale) => void;
};

export function LanguagePicker({ value, onChange }: Props) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {locales.map((locale) => {
        const selected = locale === value;
        return (
          <Pressable
            key={locale}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(locale)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {localeLabels[locale]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.paperSoft,
  },
  option: {
    minWidth: 38,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: "center",
  },
  selected: {
    backgroundColor: colors.green,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  selectedLabel: {
    color: colors.white,
  },
});
