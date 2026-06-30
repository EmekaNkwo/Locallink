# Android release (CI/CD, no EAS)

LocalLink builds a **signed** Android APK + AAB on GitHub Actions using
`expo prebuild` + Gradle. No EAS, no Expo servers.

- Workflow: [`.github/workflows/android-release.yml`](../.github/workflows/android-release.yml)
- Signing is wired by the config plugin
  [`plugins/withAndroidReleaseSigning.js`](../plugins/withAndroidReleaseSigning.js),
  which runs during `expo prebuild`.

## 1. Create an upload keystore (once)

```bash
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias locallink \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep `release.keystore` and its passwords **safe and backed up** — losing them
means you can never ship an update to the same app listing. Do **not** commit it.

## 2. Add GitHub repository secrets

`Settings → Secrets and variables → Actions → New repository secret`:

| Secret                      | Value                                              |
| --------------------------- | -------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | base64 of `release.keystore` (see below)           |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore (store) password                      |
| `ANDROID_KEY_ALIAS`         | the key alias (e.g. `locallink`)                   |
| `ANDROID_KEY_PASSWORD`      | the key password for that alias; use the keystore password if you pressed Enter |

Encode the keystore:

```bash
base64 -w0 release.keystore   # Linux
base64 -i  release.keystore   # macOS
```

Copy the output into `ANDROID_KEYSTORE_BASE64`.

If `keytool` asked:

```text
Enter key password for <locallink>
        (RETURN if same as keystore password):
```

and you pressed Enter, set `ANDROID_KEY_PASSWORD` to the same value as
`ANDROID_KEYSTORE_PASSWORD` (or leave it unset; CI falls back to the keystore
password).

## 3. Build

- **Release (recommended):** push a tag — a GitHub Release is created with the
  APK + AAB attached, and `versionName` is taken from the tag.

  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

- **Ad-hoc:** run the **Android Release** workflow manually
  (`Actions → Android Release → Run workflow`). Artifacts are uploaded to the
  run; no Release is published.

## Versioning

- `versionName` ← the git tag (e.g. `v1.2.3` → `1.2.3`), or `expo.version` from
  `app.json` on manual runs.
- `versionCode` ← the workflow run number, so every build is strictly increasing
  (required by the Play Store).

These are applied to `app.json` inside the CI run only; your committed file is
untouched.

## Local builds

`npx expo run:android` still works without any secrets — the release build type
falls back to the debug keystore when the signing properties are absent.

## Notes

- Toolchain pinned to the SDK 56 requirements: **Node 22.13**, **JDK 17**,
  **Android SDK 36 / build-tools 36.0.0**.
- `android.package` is set to `com.haymaykus.locallink` in `app.json`. Change it before
  your first published release if needed — it is the permanent app identity.
- The `android/` folder is generated on each run (managed workflow); it is not
  committed.
