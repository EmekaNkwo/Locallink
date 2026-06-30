# LocalLink — Secure Offline Comms

LocalLink is a **digital walkie-talkie** for environments with no cellular signal, no Wi-Fi access point, and no internet. It enables **end-to-end encrypted audio and text** directly between nearby phones — peer-to-peer over the local network, with **no servers** in the media path.

Built with Expo (SDK 56) + React Native.

## Why

Standard comms break down off-grid: cellular needs towers, cloud apps leak metadata to carriers, and two-way radios are unlicensed/unencrypted or expensive. LocalLink turns two phones into a private, encrypted link using only local connectivity.

## Use cases

- **Film & production crews** — director ↔ camera/sound on remote sets with no reception.
- **Emergency & disaster response** — coordinate when networks are down or congested.
- **Events & expeditions** — hiking, festivals, warehouses, and large sites where signal is unreliable.
- **Privacy-sensitive coordination** — keep voice and messages off carrier/ISP infrastructure entirely.

## Features

- **One-touch discovery & pairing** — auto-scan for nearby LocalLink devices over BLE, confirm with a 6-digit code (SAS) to block man-in-the-middle.
- **Encrypted push-to-talk audio** — low-latency Opus voice over WebRTC (DTLS-SRTP), LAN-direct with no STUN/TURN.
- **Encrypted messaging** — text over the WebRTC data channel, secured by the same session.
- **Offline-first** — messages persist in SQLite and queue when the link drops, then sync on reconnect.
- **Kill switch** — instantly tears down the session and releases the connection.
- **Battery aware** — reads real battery level/thermal state to inform the session.

## How it works (no signaling server)

```
BLE advertise/scan  →  exchange LAN address (IP + port) in the BLE token
        ↓
LAN socket (TCP)    →  serverless WebRTC signaling (SDP offer/answer + ICE)
        ↓
Identity handshake  →  Ed25519 signatures + 6-digit SAS verification
        ↓
WebRTC P2P          →  Opus audio + ordered data channel (host candidates only)
```

WebRTC normally needs a signaling server; LocalLink performs the handshake over a direct LAN socket instead, using the IP discovered via the BLE advertisement. All traffic stays on the local subnet.

## Tech stack

| Concern | Implementation |
| :-- | :-- |
| App / routing | Expo SDK 56, Expo Router, React Native |
| Discovery | `react-native-ble-lite` (advertise + scan) |
| Signaling | `react-native-tcp-socket` (LAN, newline-JSON framing) |
| Media + data | `react-native-webrtc` (Opus, DTLS-SRTP, data channel) |
| Identity crypto | `react-native-quick-crypto` (Ed25519) + `expo-secure-store` |
| Persistence | `expo-sqlite` (native) / `localStorage` (web preview) |
| State | Zustand |

## Project structure

```
src/
  app/          # Expo Router routes — each file only exports the screen component
  screens/      # Screen implementations (home, discover, talk, messages, status)
  components/   # Reusable UI (buttons, indicators, toast host, tabs)
  services/     # Boundaries with native (.ts) + web mock (.web.ts) splits
  store/        # Zustand stores (device, call, message, battery, toast)
  constants/    # Theme + BLE/signaling config
  lib/          # Byte/base64 helpers, crypto polyfill
  types/        # Shared types
```

Each service has a `*.types.ts` interface, a native implementation, and a `*.web.ts` mock — so the **web build runs entirely on mocks** for fast UI iteration, while native uses the real BLE/WebRTC/crypto stack.

## Getting started

Install dependencies:

```bash
npm install
```

### Web UI preview (mocked services)

Fast for building and iterating on the interface — no native modules required:

```bash
npx expo start --web
```

### Native build (real audio, BLE, crypto)

The core features (BLE, WebRTC, TCP sockets, crypto) are native modules and require a dev build on a physical device. Test with **two phones on the same Wi-Fi network**:

```bash
npx expo prebuild
npx expo run:android   # Android-first (iOS via EAS Build)
```

## Status

- **Phase 1 — Short range (BLE + Wi-Fi Direct):** discovery, identity/SAS handshake, P2P audio, and messaging implemented behind stable service interfaces. Pending on-device bring-up.
- **Phase 2 — Long range (mesh/relay, >1 km):** planned human-mesh relay.

> Note: native P2P features can only be validated on physical devices; the web preview exercises the UI and data flows against mock services.
