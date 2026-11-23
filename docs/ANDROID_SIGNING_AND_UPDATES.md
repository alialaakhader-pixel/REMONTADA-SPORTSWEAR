# REMONTADA POS — Android signing and updates

The Android workflow creates a new APK whenever `mobile-pos/**`, `src/pos/**`, or the workflow changes.

## One-time setup required for install-over-existing updates

GitHub Actions secrets cannot be configured by a repository code commit. The repository owner must add these four **Actions secrets** once:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Create a private upload keystore on a trusted computer (keep it backed up securely; never commit it to Git):

```bash
keytool -genkeypair -v -keystore remontada-upload.jks -alias remontada-upload -keyalg RSA -keysize 2048 -validity 10000
```

For Windows PowerShell, copy its Base64 representation:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("remontada-upload.jks")) | Set-Clipboard
```

Open the repository on GitHub → Settings → Secrets and variables → Actions → New repository secret. Add the Base64 text as `ANDROID_KEYSTORE_BASE64`, and the exact passwords and alias chosen above under the other three secret names.

After these four secrets are set, the Android workflow produces `REMONTADA-POS-Android-SIGNED`. Its APK uses the same upload key on future builds and an increasing Android versionCode, so future builds can install over that signed version without uninstalling it. **Do not lose the keystore or passwords**: Android will reject updates signed with a different key.

Until the secrets are configured, the workflow intentionally produces `REMONTADA-POS-Android-DEBUG-ONLY`. That debug APK is for first install/testing and is not a safe update path for the previous debug build.

## Updates

- Android: edit `mobile-pos/**` or the shared browser POS files in `src/pos/**`; GitHub Actions builds the APK artifact automatically.
- Windows: edit `desktop-pos/**`; the Windows workflow builds fresh NSIS installer and portable EXE artifacts. The NSIS installer uses the same app ID, so it is intended to update the installed app while keeping its app data.
- The Windows Electron implementation and Android/browser implementation are still separate codebases in some areas; this pipeline automates their builds, it does not make every feature identical between them.

Artifacts are available from the repository's Actions run page. They are temporary build downloads, not an in-app auto-updater.
