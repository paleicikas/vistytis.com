# Vištytis

Interactive map of attractions in Vištytis Regional Park.

## Website

The website uses the same Expo / React Native application as the mobile
version. The old standalone `index.html` map logic has been removed.

Build the web application:

```bash
npm run build:web
```

This command synchronizes shared data, generates the Expo web application in
`app/dist`, adds the domain `CNAME`, and creates `404.html` for GitHub Pages
routes.

Preview it locally:

```bash
npm run serve:web
```

GitHub Pages deployment is handled by `.github/workflows/deploy-web.yml`.
In the GitHub settings, select **Settings → Pages → Source: GitHub Actions**.
After a `push` to `main`, the application is generated and deployed
automatically.

## Badge Icons

Place illustrations are stored in `assets/badges/raw/`, while optimized round
icons are stored in `assets/badges/out/`.

```bash
# Generate prompts for all places, including service locations
npm run badge-prompts -- --all

# Generate 512/256/128 PNG icons for all places
npm run build-badges -- --all
```

The `collectible` value continues to control only the game's collection logic.
`--all` additionally prepares icons for non-collectible places so they can be
used in a place card or description.

## GitHub Pages Structure

- `app/` – Expo / React Native application source code.
- `app/dist/` – generated web deployment directory, excluded from the repository.
- `CNAME` – custom domain configuration, copied to the build automatically.
- `.github/workflows/deploy-web.yml` – automated GitHub Pages build and deployment.

## Mobile Application

`app/` is a standalone Expo / React Native project:

- `app/App.tsx` – application entry tree and state provider.
- `app/src/navigation/RootNavigator.tsx` – main stack and deep-link routes.
- `app/src/navigation/MainTabs.tsx` – places and collection tabs.
- `app/src/screens/PlacesScreen.tsx` – map, search, filters, and location tracking.
- `app/src/screens/PlaceDetailsScreen.tsx` – place information, navigation, and badge collection.
- `app/src/screens/CollectionScreen.tsx` – collection, points, levels, and sets.
- `app/src/game.ts` – distance, GPS accuracy, rarity, and collection rules.
- `app/src/AppState.tsx` – location, language, and AsyncStorage state management.
- `app/scripts/sync-data.mjs` – synchronizes shared `data/` files to assets
  accessible to Metro.

Start the application:

```bash
cd app
npm install
npm start
```

`npm install` automatically runs `sync-data`, so the mobile application uses
the same place, rules, and translation files as the website.

## APK

```bash
cd app
npx eas-cli build --platform android --profile preview
```

The `preview` profile generates a testing APK. An Expo account and `eas login`
are required before building.

Android maps in a standalone APK require a Google Maps API key. Before running
the command locally, set the `GOOGLE_MAPS_API_KEY` environment variable. For an
EAS build, add the same variable to the project environment:

```powershell
$env:GOOGLE_MAPS_API_KEY = "your-google-maps-api-key"
npx eas-cli build --platform android --profile preview
```
