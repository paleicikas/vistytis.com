const staticConfig = require("./app.json");

module.exports = ({ config }) => ({
  ...staticConfig.expo,
  ...config,
  plugins: [
    ...(staticConfig.expo.plugins ?? []),
    [
      "react-native-maps",
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
});
