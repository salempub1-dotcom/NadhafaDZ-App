const base = require('./app.json');

module.exports = () => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  return {
    ...base.expo,
    android: {
      ...base.expo.android,
      config: {
        ...(base.expo.android?.config ?? {}),
        googleMaps: googleMapsApiKey ? { apiKey: googleMapsApiKey } : undefined,
      },
    },
  };
};
