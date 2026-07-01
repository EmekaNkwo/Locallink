# Phase 1 — Wi-Fi/LAN Discovery + WebRTC Audio/Messaging

> Status: implementation in progress. Targets **Expo SDK 56**, React Native 0.85.

## Goal

Two physical phones on the same Wi-Fi network or one phone hotspot can:

1. Discover each other through LocalLink TCP discovery on the local subnet.
2. Pair with a 6-digit PIN that verifies identity keys and blocks man-in-the-middle attacks.
3. Open a WebRTC peer connection with no signaling server.
4. Stream encrypted Opus audio with a working kill switch.
5. Send encrypted text over the WebRTC data channel, persisted locally.

Out of scope for Phase 1: internet relay, mesh routing, background operation, and cross-network NAT traversal.

## Architecture

```
Wi-Fi/LAN discovery  ->  scan the current /24 subnet for LocalLink responders
        |
TCP signaling        ->  exchange signed WebRTC SDP/ICE over a direct socket
        |
Identity handshake   ->  Ed25519 signatures + 6-digit SAS verification
        |
WebRTC P2P           ->  Opus audio + ordered data channel
```

## Transport Assumptions

- Both phones must share the same local IP path: same Wi-Fi, same hotspot, or a LAN that allows client-to-client traffic.
- Public Wi-Fi with client isolation can block discovery and pairing.
- No internet is required.
- Web preview remains mock-only; native peer features require physical devices.

## Dependencies

- `react-native-tcp-socket` for discovery and signaling sockets.
- `react-native-webrtc` for audio and data channel transport.
- `react-native-quick-crypto` and `expo-secure-store` for device identity.
- `expo-battery`, `expo-network`, and `expo-sqlite` for diagnostics and persistence.

Bluetooth dependencies and permissions are no longer part of Phase 1.

## Native Permissions

- iOS: microphone and local network usage descriptions.
- Android: microphone, internet, network state, Wi-Fi state, camera, audio settings, overlay, and wake lock permissions.

## Acceptance Criteria

| Sub-phase | Deliverable | Acceptance test |
| --- | --- | --- |
| Discovery | LocalLink TCP discovery responder + subnet scan | Phone A sees Phone B on the same Wi-Fi/hotspot |
| Pairing | Identity keys + PIN-as-SAS | Both phones show the same 6-digit code; mismatch blocks pairing |
| Audio | WebRTC Opus call + live latency + kill switch | Call connects locally; kill switch tears down instantly |
| Messaging | Data-channel text + local persistence | Messages appear only in the active paired conversation |

## Manual Test Flow

1. Install a native dev build on two physical devices.
2. Put both devices on the same Wi-Fi network or connect both to one phone hotspot.
3. Open LocalLink on both devices and enable Nearby Discovery.
4. Confirm each phone appears in Discover.
5. Pair with the displayed 6-digit code.
6. Test push-to-talk and messages.

If discovery does not find peers, check that the network allows device-to-device connections.
