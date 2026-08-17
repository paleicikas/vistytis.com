export const colors = {
  ink: "#2b2321",
  muted: "#786e6a",
  paper: "#fcfaf7",
  paperSoft: "#f6efec",
  primary: "#de2119",
  primaryDark: "#9e1b17",
  primaryLight: "#f8dedb",
  secondary: "#e8a33d",
  secondaryDark: "#8a5a1f",
  secondaryLight: "#fff0d6",
  line: "rgba(74, 37, 32, 0.14)",
  map: "#e2e5df",
  surfaceMuted: "#f0f1ef",
  white: "#ffffff",
  danger: "#b33b31",
};

export const categoryColors: Record<string, string> = {
  "Kultūros paveldas": "#de2119",
  Gamta: "#2e6b4f",
  "Apžvalgos vietos": "#2d7fa8",
  Takai: colors.secondary,
  "Poilsis ir nakvynė": "#7a4b7e",
  "Lankytojų paslaugos": "#8a5a3b",
};

export function mapCategory(
  categories: readonly string[],
  activeCategories?: readonly string[]
) {
  if (
    activeCategories?.length === 1 &&
    categories.includes(activeCategories[0] ?? "")
  ) {
    return activeCategories[0] ?? "";
  }

  return categories.includes("Apžvalgos vietos")
    ? "Apžvalgos vietos"
    : categories[0] ?? "";
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
};
