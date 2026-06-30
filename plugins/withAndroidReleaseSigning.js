// @ts-check
const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Wires a release signing config into the generated `android/app/build.gradle`.
 *
 * Credentials are supplied at build time as Gradle project properties (so no
 * secret ever lands in a tracked file). In CI these come from
 * `ORG_GRADLE_PROJECT_LOCALLINK_UPLOAD_*` environment variables:
 *
 *   LOCALLINK_UPLOAD_STORE_FILE      absolute path to the keystore
 *   LOCALLINK_UPLOAD_STORE_PASSWORD  keystore password
 *   LOCALLINK_UPLOAD_KEY_ALIAS       key alias
 *   LOCALLINK_UPLOAD_KEY_PASSWORD    key password
 *
 * When the property is absent (e.g. a local `expo run:android`), the release
 * build type falls back to the debug keystore so day-to-day work is unaffected.
 */

const MARKER = '// @generated locallink-release-signing';

const RELEASE_SIGNING_BLOCK = `
        release {
            ${MARKER}
            if (project.hasProperty('LOCALLINK_UPLOAD_STORE_FILE')) {
                storeFile file(LOCALLINK_UPLOAD_STORE_FILE)
                storePassword LOCALLINK_UPLOAD_STORE_PASSWORD
                keyAlias LOCALLINK_UPLOAD_KEY_ALIAS
                keyPassword LOCALLINK_UPLOAD_KEY_PASSWORD
            }
        }`;

const RELEASE_SIGNING_SELECTOR =
  "(project.hasProperty('LOCALLINK_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug)";

/**
 * @param {string} contents
 * @returns {string}
 */
function applyReleaseSigning(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }

  // 1. Add a `release` entry inside the `signingConfigs { ... }` block.
  const signingConfigsAnchor = /signingConfigs\s*\{/;
  if (!signingConfigsAnchor.test(contents)) {
    throw new Error(
      "[withAndroidReleaseSigning] Could not find `signingConfigs {` in android/app/build.gradle.",
    );
  }
  let next = contents.replace(signingConfigsAnchor, (match) => `${match}${RELEASE_SIGNING_BLOCK}`);

  // 2. Point the `release` build type at the release signing config (with a
  //    debug fallback). Matches the `release { ... signingConfig signingConfigs.debug }`
  //    in the build types block, tolerating comments between `release {` and the assignment.
  const releaseBuildTypePattern =
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/;
  if (!releaseBuildTypePattern.test(next)) {
    throw new Error(
      '[withAndroidReleaseSigning] Could not find the release build type `signingConfig signingConfigs.debug` ' +
        'assignment in android/app/build.gradle. The template may have changed; update this plugin.',
    );
  }
  next = next.replace(releaseBuildTypePattern, `$1${RELEASE_SIGNING_SELECTOR}`);

  return next;
}

/**
 * @param {import('@expo/config-plugins').ExpoConfig} config
 */
module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        `[withAndroidReleaseSigning] Expected a groovy build.gradle, received ${cfg.modResults.language}.`,
      );
    }
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
};
