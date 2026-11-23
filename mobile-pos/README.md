# REMONTADA POS — Android

Android build of the same shop POS workflow used by the Windows desktop app. It uses the existing TabletPos UI and IndexedDB offline workspace. Product catalog, sales, returns, expenses and stock movements are stored on this device while offline and queued for sync after an authorized admin signs in and connectivity returns.

## Build APK locally
```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Updating
Push changes to `mobile-pos/**` or the shared POS files in `src/pos/**`. GitHub Actions builds a fresh Android APK artifact. Download the latest artifact and install it over the previous version. Keep the same Android application ID so Android updates the installed app rather than creating a second app.

Windows builds remain handled by `.github/workflows/build-pos.yml`.

## Offline and inventory notes
- First launch requires internet and an authorized admin sign-in to download the current catalog and stock.
- Sales and stock receiving can then be recorded locally when the phone has no internet.
- Queued movements sync when the phone reconnects and the admin session is valid.
- If both the phone and shop PC are offline, each device's local queue is separate until it reconnects. Avoid using both offline against the same limited stock at the same time; central stock cannot arbitrate simultaneous offline sales.
- The app cannot show a sale on the website until that sale has synced.
