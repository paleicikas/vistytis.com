declare module "*.png" {
  const asset: import("react-native").ImageSourcePropType;
  export default asset;
}

declare module "*.jpg" {
  const asset: import("react-native").ImageSourcePropType;
  export default asset;
}

declare module "*.mp3" {
  const asset: number;
  export default asset;
}
