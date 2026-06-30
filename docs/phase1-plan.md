# Phase 1 — Real BLE Discovery + WebRTC Audio/Messaging (Implementation Plan)

> Status: Plan / ready for review. Targets **Expo SDK 56**, RN 0.85.
> Builds directly on the Phase 0 service interfaces in `src/services/` — the goal is to
> swap the mock implementations for real ones **without touching any screen or store code**.

---

## 1. Goal & "Definition of Done"

Two physical phones, on no cellular/Wi-Fi infrastructure, can:

1. **Discover** each other (FR-1.1) by advertising + scanning a `LocalLink` BLE service UUID.
2. **Pair** with a 6-digit PIN that also verifies identity keys to block MITM (FR-1.2/1.3).
3. Open a **WebRTC** peer connection with **no signaling server** — SDP/ICE exchanged over BLE (the "BLE handshake").
4. Stream **encrypted Opus audio** (FR-2) with a working **kill switch** (FR-2.3).
5. Send **encrypted text over a WebRTC data channel** (FR-3.1), persisted + queued via the SQLite layer already built in Phase 0 (FR-3.2/3.3).

Out of scope for Phase 1: mesh/relay (Phase 2), background operation, thermal throttling beyond a battery toggle.

---

## 2. Hard reality checks (read before estimating)

These are the non-obvious things that determine the architecture. They are **verified** against current (2026) library docs.

### 2.0 ⚠️ Update after install: `react-native-ble-lite` is discovery-only
Hands-on with the installed lib: `react-native-ble-lite` exposes **only** `startAdvertising` /
`startScanning` / `addAdvertisementListener` — **no GATT connect/read/write**. So it solves
*discovery* (advertise + scan the service UUID, a few bytes of service data) but **cannot carry
the SDP/ICE signaling handshake**. Given the locked "same-Wi-Fi" decision, signaling now rides a
**local-network socket** instead of BLE GATT:
- BLE = discovery + a tiny advertised token (short id / pairing nonce).
- Signaling (signed SDP/ICE + PIN SAS) = direct **LAN socket** between the two peers.
- This needs a TCP socket lib (RN has no socket *server*) → **new decision #5 below.**

### 2.1 `react-native-ble-plx` cannot make a phone discoverable
`react-native-ble-plx` is **Central-only**. Its docs explicitly list "communicating between phones using BLE (Peripheral support)" under **does NOT support**. The `modes: ["peripheral","central"]` config flag only adds iOS `UIBackgroundModes` — it does **not** give you a GATT server or advertiser.

➡️ **For two phones to find each other we need a peripheral/advertiser too.** Options:
- **`react-native-ble-lite`** — Expo-ready, advertises a Service UUID *and* scans (central + peripheral) in one lib. Newest, least battle-tested.
- **`react-native-peripheral`** (advertise + GATT server) paired with **`react-native-ble-plx`** (central). More mature but two libs to wire, and a custom config plugin needed for `react-native-peripheral`.

> Decision point #1 below.

### 2.2 BLE advertising packets are tiny; SDP is not
A BLE advertisement is ~31 bytes, and a single GATT characteristic write is capped by MTU (~185–512 bytes). A WebRTC SDP offer/answer + ICE candidates is **1–4 KB**. ➡️ We must **chunk** the SDP/ICE payload across multiple GATT writes/notifications and reassemble. This is the fiddliest part of the BLE work.

### 2.3 WebRTC already encrypts the media — our crypto is for *identity*
`react-native-webrtc` uses **DTLS-SRTP** by default, so audio **and** the data channel are encrypted in transit automatically. We do **not** hand-roll media crypto (PRD agrees: "do not use custom crypto libs unless necessary"). What we *do* add:
- A long-term **identity keypair** per device.
- Bind the DTLS fingerprint to that identity (sign the SDP), and have the **6-digit PIN act as a Short Authentication String (SAS)** verified out-of-band by the user — this is what actually stops a man-in-the-middle during serverless signaling.
- `expo-crypto` only does hashing + CSPRNG. For X25519/Ed25519 + HKDF use **`react-native-quick-crypto`** (Node-compatible API) or **`expo-crypto-extended`** (X25519 ECDH + HKDF, SDK 55+). Store private keys in **`expo-secure-store`** (Keychain / Android Keystore).

### 2.4 Transport for the media stream
"No server" WebRTC works when both peers can reach each other directly. We use **host ICE candidates only** (no STUN/TURN). That requires the two devices share an IP path:
- **Same Wi-Fi network** → works out of the box (most reliable; best for first demo).
- **Wi-Fi Direct (Android) / hotspot** → device-specific; iOS has no public Wi-Fi Direct.
- **Pure BLE data path** (no IP at all) → WebRTC can't run over it; would need audio-over-GATT, which is out of scope.

➡️ **Recommended:** media over local IP with host candidates, signaled over BLE. Treat "shared LAN / hotspot" as the Phase-1 connectivity assumption; document Wi-Fi Direct as a Phase-1.5 enhancement.

### 2.5 None of this runs in Expo Go or on web
BLE + WebRTC are native modules. Phase 1 requires a **custom dev build** (`npx expo run:ios|android`). The web target stays a **UI preview only** — keep the Phase-0 mock implementations active on web via the existing platform-split pattern so `expo start --web` never imports native-only modules.

---

## 3. Dependencies (exact, SDK 56)

```bash
# Dev build tooling
npx expo install expo-dev-client expo-build-properties

# WebRTC (media + data channel)
npx expo install react-native-webrtc @config-plugins/react-native-webrtc   # 124.0.7 + 15.0.0

# BLE — central
npx expo install react-native-ble-plx

# BLE — peripheral/advertiser (pick ONE path from Decision #1)
#   Path A:
npx expo install react-native-ble-lite
#   Path B:
npm install react-native-peripheral   # + a small custom config plugin

# Identity crypto + secure key storage
npx expo install expo-secure-store
npm install react-native-quick-crypto   # or: expo-crypto-extended

# Battery (also closes a Phase-0 TODO)
npx expo install expo-battery
```

> **SDK 56 gotcha (ble-plx issue #1339):** its config plugin imports `@expo/config-plugins`, which makes `expo config` / `expo-doctor` fail on SDK 56. Workaround: add `@expo/config-plugins` to **devDependencies** (doctor will warn; that's expected).

---

## 4. `app.config` — plugins & permissions

```json
{
  "plugins": [
    "expo-router",
    "expo-secure-store",
    ["react-native-ble-plx", {
      "isBackgroundEnabled": false,
      "modes": ["central", "peripheral"],
      "bluetoothAlwaysPermission": "LocalLink uses Bluetooth to find and connect to nearby crew devices."
    }],
    ["@config-plugins/react-native-webrtc", {
      "microphonePermission": "LocalLink needs the microphone to transmit encrypted audio."
    }],
    ["expo-build-properties", { "android": { "minSdkVersion": 24 } }]
  ]
}
```

Permissions to surface at runtime (request lazily, with rationale UI):
- **iOS:** `NSBluetoothAlwaysUsageDescription`, `NSMicrophoneUsageDescription`, local-network prompt (auto for WebRTC host candidates).
- **Android 12+:** `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT`, `RECORD_AUDIO`; `ACCESS_FINE_LOCATION` only if you don't set `neverForLocation`.

> `@config-plugins/react-native-webrtc` disables iOS bitcode and sets Android `minSdk 24` + disables desugaring — verify no other dependency breaks at minSdk 24.

---

## 5. Dev-build workflow

```bash
npx expo prebuild --clean        # generates ios/ + android/ from config plugins
npx expo run:ios                 # or run on a physical device via Xcode
npx expo run:android             # physical device required for BLE
```
- BLE/mic **must be tested on two real devices** (simulators have no BLE radio).
- After any plugin/permission change → re-run `prebuild --clean`.
- Keep `expo start --web` working for UI iteration (mock services).

---

## 6. Implementation, mapped onto the existing interfaces

Everything below is implemented **behind the Phase-0 interfaces**, with a native variant only. The web build keeps the mock via file-extension split (`*.ts` native / `*.web.ts` mock) and/or a runtime selector.

### 6.1 Identity & crypto — `src/services/encryption-service.ts`
- On first launch: generate Ed25519 identity keypair → store in `expo-secure-store`.
- `getPublicKey()`, `sign(bytes)`, `verify(pub, sig, bytes)`.
- `deriveSas(localPub, remotePub, dtlsFingerprints)` → 6-digit code shown on both phones; user confirms they match (this is the PIN screen we already built).

### 6.2 BLE — `src/services/ble-service.ts` (implements `DiscoveryService`)
- **Advertise** the `LocalLink` service UUID + short device name (peripheral lib).
- **Scan** for that UUID (central) → map each hit to the existing `BleDevice` type and feed `scan({ onDevice })`.
- Expose a GATT service with characteristics:
  - `IDENTITY` (read): our public key.
  - `SIGNAL_IN` / `SIGNAL_OUT` (write + notify): chunked SDP/ICE transport.
- `pair(deviceId, pin)` connects, exchanges identity keys, then hands off to signaling.

### 6.3 Serverless signaling — `src/services/signaling-service.ts`
- Chunk/reassemble SDP offer/answer + ICE candidates over the GATT characteristics (§2.2).
- Sign outbound SDP with the identity key; verify inbound; compute SAS for the PIN screen.

### 6.4 WebRTC audio — `src/services/call-service.ts` (implements `CallService`)
- `connect(peerName)`: `new RTCPeerConnection({ iceServers: [] })` (host candidates only) → add mic track (`mediaDevices.getUserMedia({ audio: true })`, Opus) → create offer → signal via §6.3 → on connect, resolve a real `CallSession` and emit live latency from `getStats()`.
- `disconnect()`: close tracks + peer connection (kill switch path).

### 6.5 WebRTC messaging — `src/services/message-service.ts` (implements `MessageService`)
- Open an ordered `RTCDataChannel` ("chat"); `transmit(message)` sends JSON, resolves on ack.
- Inbound messages → write to SQLite + push into `useMessageStore` (the store/DB plumbing already exists).
- On reconnect, `syncQueue()` (already built) drains queued rows.

### 6.6 Service selection (the only wiring change)
Add `src/services/index.ts` logic: export the **real** singletons on native, **mock** on web (and behind a dev flag for simulator testing). No screen/store edits — they already import from `@/services` and `@/store`.

---

## 7. Sub-phases & acceptance criteria

| Sub-phase | Deliverable | Acceptance test |
| --- | --- | --- |
| **1a — Dev build** | Plugins added, `prebuild`, app boots on 2 devices | App launches; mic + BLE permission prompts appear |
| **1b — Discovery** | `ble-service` advertise + scan → real `BleDevice`s in Discover screen | Phone A sees Phone B by name/RSSI within range |
| **1c — Handshake** | Identity keys + chunked signaling + PIN-as-SAS | Both phones show the **same** 6-digit code; mismatch blocks pairing |
| **1d — Audio** | WebRTC Opus call + live latency + kill switch | <150ms latency on same Wi-Fi; kill switch tears down instantly |
| **1e — Messaging** | Data-channel text + offline queue/sync | Send works live; airplane-mode message queues and syncs on reconnect |

---

## 8. Risks & mitigations

- **BLE peripheral lib maturity** (§2.1) → spike `react-native-ble-lite` on day 1; fall back to `react-native-peripheral` + `ble-plx` if advertising is unreliable.
- **iOS background advertising** moves the UUID to an "overflow area" only visible to iOS apps explicitly scanning that UUID → keep Phase 1 **foreground-only**.
- **SDP chunking bugs** (§2.2) → add sequence numbers + checksum per chunk; unit-test reassembly.
- **No shared LAN** → without STUN/TURN, host candidates fail across separate networks. Document the "same Wi-Fi / hotspot" assumption; Wi-Fi Direct is Phase 1.5.
- **Simulator can't test BLE** → CI smoke tests stay on the mock services; hardware testing is manual on 2 devices.

---

## 9. Decisions — LOCKED

1. **BLE peripheral path:** ✅ `react-native-ble-lite` (single lib, central + peripheral).
2. **Crypto lib:** ✅ `react-native-quick-crypto` (full Node-compatible crypto API).
3. **Connectivity (first demo):** ✅ Same Wi-Fi / hotspot; host ICE candidates only. Wi-Fi Direct deferred to Phase 1.5.
4. **Build path:** ✅ Local `npx expo run:ios` / `run:android` (requires Xcode + Android Studio).

These choices simplify §3 to: `react-native-ble-lite` (drop `ble-plx`/`react-native-peripheral`) and
`react-native-quick-crypto` (drop `expo-crypto-extended`). Note `react-native-quick-crypto` needs a
`global.crypto.getRandomValues` polyfill and a Babel/Metro setup step — handle in sub-phase 1a.

### 5. Signaling transport — LOCKED ✅ LAN socket (`react-native-tcp-socket`)
`ble-lite` can't do GATT, so the SDP/ICE handshake rides a direct LAN socket: one peer opens a
short-lived TCP server on `SIGNAL_PORT`, the other connects (IP discovered from the BLE-advertised
token). Fits the same-Wi-Fi decision. Installed `react-native-tcp-socket@6.4.1`; scaffolded as
`signaling-service` (native stub + web mock) behind a typed interface.

---

## 10. Sub-phase 1a — DONE (scaffolding, this session)
- Installed deps (§3) + locked-choice libs; `app.json` plugins/permissions added.
- Services split into native (real/stub) vs `.web` (mock) behind shared `*.types.ts`:
  `discovery` (real ble-lite advertise+scan), `call`/`message` (WebRTC stubs),
  new `encryption` (quick-crypto/secure-store stub). Added `src/constants/ble.ts`,
  `src/lib/crypto-polyfill` (native install / web no-op).
- Web preview still bundles (mocks only); `tsc` clean. Native build not yet run.
- **Next on your machine:** `npx expo prebuild --clean` then `npx expo run:android` on a
  physical device (add `@expo/config-plugins` to devDeps first per §3 to avoid the doctor crash).
