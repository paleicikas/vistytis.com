# Vištytis

Interaktyvus Vištyčio regioninio parko lankytinų vietų žemėlapis.

## Svetainė

Web svetainė naudoja tą pačią Expo / React Native aplikaciją kaip mobilusis
variantas. Sena atskira statinio `index.html` žemėlapio logika pašalinta.

Vienai komandai paleisti:

```bash
npm run build:web
```

Komanda sinchronizuoja bendrus duomenis, sugeneruoja Expo web aplikaciją į
`app/dist`, prideda `CNAME` domenui ir sukuria `404.html` GitHub Pages
maršrutams.

Lokali peržiūra:

```bash
npm run serve:web
```

GitHub Pages publikavimą atlieka `.github/workflows/deploy-web.yml`.
GitHub nustatymuose pasirinkite **Settings → Pages → Source: GitHub Actions**.
Po `push` į `main` aplikacija bus sugeneruota ir publikuota automatiškai.

## Badge ikonos

Vietų iliustracijos saugomos `assets/badges/raw/`, o optimizuotos apvalios ikonos –
`assets/badges/out/`.

```bash
# Sugeneruoti promptus visoms vietoms, įskaitant paslaugų vietas
npm run badge-prompts -- --all

# Sugeneruoti 512/256/128 PNG ikonas visoms vietoms
npm run build-badges -- --all
```

`collectible` reikšmė ir toliau valdo tik žaidimo rinkimo logiką. `--all` papildomai
paruošia ikonas necollectible vietoms, kad jas būtų galima naudoti vietos kortelėje
arba aprašyme.

## GitHub Pages struktūra

- `app/` – Expo / React Native aplikacijos kodas.
- `app/dist/` – sugeneruotas web publikavimo katalogas, į repozitoriją neįtraukiamas.
- `CNAME` – pasirinktinio domeno konfigūracija, automatiškai nukopijuojama į build'ą.
- `.github/workflows/deploy-web.yml` – automatinis GitHub Pages build ir deploy.

## Mobilioji aplikacija

`app/` yra atskiras Expo / React Native projektas:

- `app/App.tsx` – aplikacijos įėjimo medis ir būsenos tiekėjas.
- `app/src/navigation/RootNavigator.tsx` – pagrindinis stack ir deep-link maršrutai.
- `app/src/navigation/MainTabs.tsx` – vietų ir kolekcijos skirtukai.
- `app/src/screens/PlacesScreen.tsx` – žemėlapis, paieška, filtrai ir vietos nustatymas.
- `app/src/screens/PlaceDetailsScreen.tsx` – vietos informacija, navigacija ir ženklelio rinkimas.
- `app/src/screens/CollectionScreen.tsx` – kolekcija, taškai, lygiai ir rinkiniai.
- `app/src/game.ts` – atstumo, GPS tikslumo, retumo ir rinkinių taisyklės.
- `app/src/AppState.tsx` – lokacijos, kalbos ir AsyncStorage būsenos valdymas.
- `app/scripts/sync-data.mjs` – bendrų `data/` failų sinchronizavimas į Metro pasiekiamus asset'us.

Paleidimas:

```bash
cd app
npm install
npm start
```

`npm install` automatiškai paleidžia `sync-data`, todėl mobilioji aplikacija naudoja tuos pačius vietų, taisyklių ir vertimų failus kaip svetainė.

## APK

```bash
cd app
npx eas-cli build --platform android --profile preview
```

`preview` profilis sugeneruoja testinį APK. Prieš build'ą reikalinga Expo paskyra ir `eas login`.

Android žemėlapiui standalone APK reikia Google Maps API rakto. Prieš lokalią
komandą nustatykite `GOOGLE_MAPS_API_KEY` aplinkos kintamąjį, o EAS build'e
įtraukite tą patį kintamąjį į projekto aplinką:

```powershell
$env:GOOGLE_MAPS_API_KEY = "jusu-google-maps-api-raktas"
npx eas-cli build --platform android --profile preview
```
