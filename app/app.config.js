const staticConfig = require("./app.json");

module.exports = ({ config }) => ({
  ...staticConfig.expo,
  ...config,
  plugins: [
    ...(staticConfig.expo.plugins ?? []),
    [
      "react-native-maps",
      {
        androidGoogleMapsApiKey: "AIzaSyDCHUMCU4-zkJGN5JwcqgGp-gCNgFLB7BY",
      },
    ],
  ],
});
