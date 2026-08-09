module.exports = function configureBabel(api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@navigation": "./src/navigation",
            "@assets": "./assets",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
