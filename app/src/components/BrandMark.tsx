import { Image, StyleSheet, type ImageStyle, type StyleProp } from "react-native";
import coatOfArms from "../../assets/branding/vistytis-coa.png";

type BrandMarkProps = {
  size?: "small" | "medium";
  style?: StyleProp<ImageStyle>;
};

export function BrandMark({ size = "small", style }: BrandMarkProps) {
  return (
    <Image
      accessibilityLabel="Vištyčio herbas"
      resizeMode="contain"
      source={coatOfArms}
      style={[size === "medium" ? styles.medium : styles.small, style]}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    width: 44,
    height: 55,
  },
  medium: {
    width: 48,
    height: 52,
  },
});
