# Product Requirements Document (PRD)

**Project Name:** LocalLink – Secure Offline Comms  
**Version:** 1.0 (MVP)  
**Status:** Draft / Ready for Development

---

## 1. Project Overview

**Problem Statement:**  
Film crews and emergency responders often operate in remote locations with no cellular signal or internet. Standard communication requires expensive airtime, licensed radio equipment, or cloud-based apps that leak metadata to carriers/ISPs. Existing two-way radios are analog/unencrypted or require costly licenses.

**Solution Overview:**  
A mobile application enabling **End-to-End Encrypted (E2EE) Audio & Text Communication** between devices on the same Wi-Fi network, LAN, or phone hotspot without relying on cellular data, internet, or third-party servers for the media stream.

**Primary Objective:**  
Build a "Digital Walkie-Talkie" that functions when internet access is unavailable, using only local IP connectivity and on-device encryption.

---

## 2. Goals & Success Metrics

| Goal                   | Metric                                                                          | Owner           |
| :--------------------- | :------------------------------------------------------------------------------ | :-------------- |
| **Reliability**        | Audio latency < 150ms; Connection maintainability > 95% within range.           | Tech Lead       |
| **Security**           | Zero data leakage to external servers (P2P only). Verified via Wireshark audit. | Security Lead   |
| **Usability**          | One-touch pairing, intuitive UI for "Talk", "End Call", "Emergency Stop".       | Product Manager |
| **Offline Capability** | Message persistence when connection drops; restore on reconnect.                | Dev Team        |

---

## 3. Functional Requirements (MVP)

### F1: Device Discovery & Pairing

- **FR-1.1:** App must auto-scan the local subnet for nearby devices running the LocalLink discovery responder.
- **FR-1.2:** User initiates connection by sending a short PIN/Code to confirm identity before audio stream starts.
- **FR-1.3:** Once paired, devices exchange public keys locally for encryption handshake.

### F2: Secure Audio Stream (P2P)

- **FR-2.1:** Enable Audio-only mode using WebRTC with Opus codec (low latency).
- **FR-2.2:** Audio must be encrypted end-to-end before transmission over WebRTC on the local IP network.
- **FR-2.3:** "Kill Switch": A hard button or voice command (`#STOP`) that immediately terminates WebRTC session and releases bandwidth.

### F3: Encrypted Messaging

- **FR-3.1:** Text messages sent via WebRTC Data Channels (secured by same E2EE keys).
- **FR-3.2:** Messages must be queued locally in SQLite if connection drops.
- **FR-3.3:** Upon reconnection, pending message queue syncs automatically to the target device.

### F4: Battery & Performance Optimization

- **FR-4.1:** App must detect battery level and thermal state (via native APIs).
- **FR-4.2:** If battery < 20%, app defaults to Audio-only mode and reduces background scanning to save power.

---

## 4. Non-Functional Requirements (NFRs)

- **Latency:** <150ms latency for voice packets on stable connection.
- **Privacy:** No metadata (timestamps, location via GPS unless requested) stored in cloud or logs without encryption.
- **Offline-First:** All operations must function without external API calls.
- **Compatibility:** iOS 14+, Android 12+.

---

## 5. Critical Failure Scenarios & Risks

| Scenario                 | Impact                                 | Mitigation (Senior Focus)                                                                       |
| :----------------------- | :------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Local Link Drops**     | Audio cuts out mid-conversation.       | Implement local audio buffer queue; auto-retry handshake when signal restored.                  |
| **Battery Depletion**    | Device crashes during call.            | Adaptive bitrate logic reduces codec quality before shutdown occurs to preserve battery longer. |
| **No Signal Found**      | No other devices discovered.           | Show error state: "Waiting for partner device..." with clear retry instructions.                |
| **Device Malfunction**   | One party's audio stuck on 2 channels. | Force kill-switch implemented via local network broadcast signal (no server involved).          |

---

## 6. Technical Stack Recommendation (MVP)

- **Core Media:** WebRTC (via React Native/Expo modules or Native Modules).
- **Audio Codec:** Opus (optimized for low bandwidth, low latency).
- **Discovery:** `react-native-tcp-socket` LocalLink discovery responder + subnet scan.
- **Signaling:** Direct TCP socket over local IP.
- **Encryption:** SRTP (Secure Real-Time Transport) via WebRTC (do not use custom crypto libs unless necessary).
- **Database:** SQLite (encrypted DB wrapper).

---

# User Flow Documents & Technical Flows

## 1. Happy Path: Call Establishment

**User Stories:**

1.  Camera Man opens "LocalLink App" and enables Nearby Discovery.
2.  Director's phone scans the local network for active LocalLink devices.
3.  Devices establish a direct local TCP signaling connection.

### Flow Steps:

```mermaid
graph TD
    A[Camera Man Opens App] --> B{Is Partner Nearby?}
    B -- Yes --> C[Local Network Discovery]
    C --> D[Establish Pairing PIN]
    D --> E[Exchange Public Keys (SRTP)]
    E --> F[Open Local IP Stream]
    F --> I[AUDIO STREAM STARTS]
```

## 2. Happy Path: Message Exchange

**User Stories:**

1.  Director sends a text message while on call or idle.
2.  Camera Man receives message instantly via secure channel.

### Flow Steps:

```mermaid
graph TD
    A[Director Composes Text] --> B[Send to Data Channel (WebRTC)]
    B --> C{Connection Active?}
    C -- Yes --> D[P2P Encryption & Relay]
    D --> E[Camera Man Receives]
    F[Camera Man Opens App] --> G[Store Message Locally in SQLite]
```

## 3. Error Path: Network Failure

**User Stories:**

1.  Director moves out of range during a call.
2.  Camera Man receives message after reconnection.

### Flow Steps:

```mermaid
graph TD
    A[Call Active] --> B{Connection Drop?}
    B -- Yes --> C[Suspend Audio Stream]
    C --> D[Resume Local Queue (SQLite)]
    E[Camera Man Receives Notification]
    F[Reconnect to Network]
    G[Sync Pending Messages]
```

## 4. Emergency Path: Kill Switch

**User Stories:**

1.  Director hears unauthorized noise or emergency signal.
2.  Both parties receive "Emergency" notification via audio channel.

### Flow Steps:

```mermaid
graph TD
    A[Director Triggers 'Kill Button'] --> B[Force Disconnect all Sessions]
    C[Broadcast Kill Signal (Broadcast Packet)]
    D[Camera Man Receives Signal]
    E[Terminate Audio Stream & Close App]
```

---

# Technical Flow Diagrams (For Implementation)

## 1. P2P Connection Setup Logic

**Note:** This flow ensures we do NOT use a server for signaling in the MVP.

1.  **Initiator (Camera Man):** Generates a random UUID + Public Key pair using CryptoKey API.
2.  **Discovery (Both):** Scans the current local subnet for LocalLink discovery responders.
3.  **Handshake:** Initiator sends public key to the discovered peer over the direct TCP signaling socket.
4.  **Secure Tunnel:** Once keys exchanged, WebRTC initiates `createOffer/Answer`.
5.  **Direct IP:** Use the discovered local IP (`192.168.X.Y`) as the remote peer connection target, bypassing STUN/TURN servers.

## 2. Audio Packet Flow (WebRTC)

**Note:** This ensures audio stays encrypted locally before leaving device A.

1.  **Microphone Capture** -> App Input Layer.
2.  **Encoding** -> Opus Encoder.
3.  **Encryption** -> SRTP Encryptor (AES-GCM).
4.  **Send** -> WebRTC Sender (UDP/DTLS-SRTP).
5.  **Receiver** -> App Listener Layer.
6.  **Decryption** -> SRTP Decryptor.
7.  **Playback** -> Opus Decoder -> Speaker.

---

# Next Steps & Long-Range Planning

## Phase 1: Short Range (Same Wi-Fi/LAN)

- Complete implementation of P2P Audio via WebRTC.
- Test with two phones on the same Wi-Fi network or one phone hotspot.
- Ensure audio quality is acceptable at <50m range.

## Phase 2: Long Range (Mesh/Relay)

- **Goal:** Enable communication >1km without cellular data.
- **Approach:** Implement "Human Mesh Network".
  - If Device A cannot reach Device B, it scans for other devices with LocalLink installed.
  - Device A sends message to Relay 1 over the local network.
  - Relay 1 forwards to Relay 2.
  - Relay 2 connects directly to Device B.
- **Risk:** Battery drain on relays, latency increase per hop.

---

# Senior-Level Considerations for Your Portfolio

When you present this PRD and Flows:

1.  **Explain the "No Server" Logic:** Emphasize that WebRTC usually uses signaling infrastructure, but LocalLink performs discovery and signaling over direct local-network sockets because there is no internet requirement.
2.  **Security by Design:** Point out that even if the app is compromised, the SRTP encryption means the audio cannot be decrypted without your device's private key.
3.  **Fail-Safe Architecture:** Mention how we handle connection drops (local queues) to ensure reliability in unstable environments.

**Do you want me to draft a specific implementation plan for Phase 1 (Short Range Audio)?**
