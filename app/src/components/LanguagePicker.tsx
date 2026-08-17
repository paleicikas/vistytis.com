import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { localeLabels, translate } from "../i18n";
import { colors } from "../theme";
import type { Locale } from "../types";

const locales: Array<{ flag: string; locale: Locale; name: string }> = [
  { flag: "🇱🇹", locale: "lt", name: "Lietuvių" },
  { flag: "🇬🇧", locale: "en", name: "English" },
  { flag: "🇵🇱", locale: "pl", name: "Polski" },
  { flag: "🇩🇪", locale: "de", name: "Deutsch" },
  { flag: "🇱🇻", locale: "lv", name: "Latviešu" },
  { flag: "🇪🇪", locale: "et", name: "Eesti" },
  { flag: "🇫🇷", locale: "fr", name: "Français" },
  { flag: "🇺🇦", locale: "uk", name: "Українська" },
];

type Props = {
  value: Locale;
  onChange: (locale: Locale) => void;
};

export function LanguagePicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLocale = locales.find((item) => item.locale === value) ?? locales[0];

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={translate(value, "nav.language")}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        style={styles.trigger}
      >
        {Platform.OS !== "web" ? (
          <Text style={styles.triggerFlag}>{selectedLocale.flag}</Text>
        ) : null}
        <Text style={styles.triggerLabel}>{localeLabels[selectedLocale.locale]}</Text>
        <Ionicons
          color={colors.muted}
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={13}
        />
      </Pressable>
      {isOpen ? (
        <ScrollView
          accessibilityRole="radiogroup"
          contentContainerStyle={styles.dropdownContent}
          style={styles.dropdown}
        >
          {locales.map((item) => {
            const selected = item.locale === value;
            return (
              <Pressable
                key={item.locale}
                accessibilityLabel={item.name}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(item.locale);
                  setIsOpen(false);
                }}
                style={[styles.option, selected && styles.selected]}
              >
                {Platform.OS !== "web" ? (
                  <Text style={styles.optionFlag}>{item.flag}</Text>
                ) : null}
                <Text style={[styles.optionName, selected && styles.selectedLabel]}>
                  {item.name}
                </Text>
                <Text style={[styles.optionCode, selected && styles.selectedLabel]}>
                  {localeLabels[item.locale]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 100,
    elevation: 12,
  },
  trigger: {
    minWidth: 62,
    height: 37,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: colors.paperSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  triggerFlag: {
    fontSize: 17,
    lineHeight: 20,
  },
  triggerLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
  },
  dropdown: {
    position: "absolute",
    top: 43,
    right: 0,
    width: 168,
    maxHeight: 268,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
  },
  dropdownContent: {
    padding: 6,
  },
  option: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 8,
    borderRadius: 9,
  },
  selected: {
    backgroundColor: colors.primaryLight,
  },
  optionFlag: {
    fontSize: 19,
    lineHeight: 22,
  },
  optionName: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  optionCode: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
  },
  selectedLabel: {
    color: colors.primaryDark,
  },
});
