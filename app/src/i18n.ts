import de from "../assets/data/i18n/de.json";
import en from "../assets/data/i18n/en.json";
import lt from "../assets/data/i18n/lt.json";
import pl from "../assets/data/i18n/pl.json";
import type { Locale, Place } from "./types";

const translations: Record<Locale, Record<string, string>> = {
  lt,
  en,
  pl,
  de,
};

export const localeLabels: Record<Locale, string> = {
  lt: "LT",
  en: "EN",
  pl: "PL",
  de: "DE",
};

export function translate(
  locale: Locale,
  key: string,
  params: Record<string, string | number> = {}
) {
  const value = translations[locale][key] ?? translations.lt[key] ?? key;
  return Object.entries(params).reduce(
    (result, [parameter, replacement]) =>
      result.replaceAll(`{${parameter}}`, String(replacement)),
    value
  );
}

export function localizePlace(place: Place, locale: Locale) {
  const localized = locale === "lt" ? undefined : place.i18n?.[locale];
  return {
    name: place.name,
    description: localized?.description ?? place.description,
    text: localized?.text ?? place.text,
  };
}

const categoryKeys: Record<string, string> = {
  Gamta: "category.nature",
  "Kultūros paveldas": "category.heritage",
  "Apžvalgos vietos": "category.viewpoints",
  Takai: "category.trails",
  "Poilsis ir nakvynė": "category.accommodation",
  "Lankytojų paslaugos": "category.services",
};

export function categoryLabel(locale: Locale, category: string) {
  return translate(locale, categoryKeys[category] ?? category);
}
