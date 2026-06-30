# LocalLink - Recommended Folder Structure

## Philosophy
- **Simplicity**: Flat structure, minimal nesting (max 3 levels)
- **Clarity**: Semantic naming, clear separation of concerns
- **Maintainability**: Easy to find files, easy to add new features
- **Mobile Best Practices**: Expo/React Native conventions followed

---

## Recommended Structure

```
locallink/
├── app/                          # Core application screens & routes
│   ├── (index)                  # Root screen (home/dashboard)
│   ├── splash-screen           # Splash/Launch state
│   ├── discover                # Device discovery & pairing
│   ├── talk                    # Active audio session
│   ├── messages                # Encrypted messaging hub
│   ├── status                  # System health & connection
│   └── profile                 # Settings & emergency contacts
│
├── components/                   # Reusable UI components
│   ├── buttons/
│   │   ├── pair-button.tsx     # Pairing action button
│   │   ├── kill-switch-btn.tsx # Emergency kill switch
│   │   └── index.ts            # Export all buttons
│   ├── inputs/
│   │   ├── pin-input.tsx       # 6-digit PIN entry
│   │   └── text-input.tsx      # Encrypted message input
│   ├── indicators/
│   │   ├── battery-indicator.tsx
│   │   ├── signal-strength.tsx
│   │   └── loading-spinner.tsx
│   ├── cards/
│   │   ├── device-card.tsx     # Device list item
│   │   └── message-card.tsx    # Message list item
│   └── icons/                   # Icon components (React Native)
│       └── index.ts            # Export all icons
│
├── screens/                      # Screen-specific logic & hooks
│   ├── discover-screen.tsx     # BLE scanning, device management
│   ├── talk-screen.tsx        # WebRTC audio session
│   ├── messages-screen.tsx    # Message queue, sync logic
│   └── status-screen.tsx       # Battery, connection monitoring
│
├── hooks/                       # Custom React hooks
│   ├── use-battery.ts           # Battery level & state detection
│   ├── use-ble-scanner.ts       # Bluetooth Low Energy scanning
│   ├── use-webrtc-audio.ts      # WebRTC audio stream management
│   ├── use-message-queue.ts     # SQLite message persistence
│   └── use-connection-mode.ts   # BLE vs WiFi Direct switching
│
├── services/                    # Business logic & external APIs
│   ├── ble-service.ts           # Bluetooth service wrapper
│   ├── webrtc-service.ts        # WebRTC/P2P audio service
│   ├── encryption-service.ts    # E2EE key management (SRTP)
│   ├── database-service.ts      # SQLite operations wrapper
│   └── network-service.ts       # Local IP/WiFi Direct negotiation
│
├── utils/                       # Utility functions & helpers
│   ├── format.ts                # Date, number formatting
│   ├── validation.ts            # Input validation (PIN, etc.)
│   ├── constants.ts             # App-wide constants
│   └── safe-area.tsx           # Safe area insets helper
│
├── types/                       # TypeScript type definitions
│   ├── ble-device.ts
│   ├── message.ts
│   ├── call-session.ts
│   └── index.ts                 # Shared types
│
├── constants/                   # App-wide configuration
│   ├── theme.ts                 # Colors, spacing, typography
│   ├── app.ts                   # Build flags, feature toggles
│   └── ble.ts                   # BLE UUIDs, service config
│
├── assets/                      # Images, fonts, icons
│   ├── images/
│   │   └── tabIcons/           # Tab bar icons (platform-specific)
│   ├── icons/                  # SVG/PNG icons
│   └── expo-icon/              # Expo icon assets
│
├── lib/                         # Third-party library wrappers
│   ├── react-native-bluetooth-le.ts
│   ├── expo-blur.ts            # Blur effects wrapper
│   └── expo-status-bar.ts      # Status bar wrapper
│
├── store/                       # State management (Zustand)
│   ├── use-call-store.ts        # Active call state
│   ├── use-battery-store.ts     # Battery monitoring state
│   └── use-message-store.ts     # Message queue state
│
├── navigation/                  # Navigation configuration
│   ├── AppNavigator.tsx         # Main stack navigator
│   └── tab-navigator.tsx        # Bottom tabs + deep linking
│
├── config/                      # Build & deployment configs
│   ├── metro.config.js          # Metro bundler config
│   └── app.json                 # Expo configuration
│
├── scripts/                     # Utility scripts
│   └── reset-project.ts         # Project reset utility
│
├── docs/                        # Documentation & PRDs
│   ├── prd.md                   # Product requirements document
│   └── architecture.md          # Technical architecture overview
│
├── tests/                       # Test files (Jest, Detox)
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # E2E tests with Detox
│
├── .expo                        # Expo configuration files
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies & scripts
├── tsconfig.json               # TypeScript config
└── README.md                    # Project documentation

```

---

## Key Design Decisions

### 1. **Flat Structure (Max 3 Levels)**
- Easy to navigate, no deep nesting
- All files are within 2-3 levels from root
- `components/` stays shallow for easy discovery

### 2. **Separation of Concerns**
- `app/`: Screens & routes (what users see)
- `components/`: Reusable UI elements
- `screens/`: Screen-specific logic (not in app/)
- `hooks/`: Custom React hooks
- `services/`: Business logic & external APIs

### 3. **Type Safety**
- `types/` for shared type definitions
- TypeScript throughout with strict mode enabled

### 4. **State Management**
- `store/` for Zustand stores (centralized state)
- Each feature has its own store module

### 5. **Navigation**
- `navigation/` for all routing configuration
- Supports Expo Router deep linking

### 6. **Assets Organization**
- Platform-specific assets in subfolders
- Icons separated from images

---

## Why This Structure Works

| Benefit | Explanation |
|---------|-------------|
| **Findability** | All related files are together (e.g., `use-battery.ts` + `battery-indicator.tsx`) |
| **Maintainability** | Clear separation makes refactoring safer and easier |
| **Scalability** | Easy to add new screens/features without breaking existing code |
| **Testing** | Tests can target specific modules (`tests/unit/battery-service.test.ts`) |
| **Onboarding** | New developers know where to look for anything |

---

## Quick Reference: File Locations

### Adding a New Screen
```
app/
├── (index)              # Home screen
├── splash-screen       # Splash state
├── discover            # Device discovery
└── talk                # Active call
```

### Adding a Reusable Component
```
components/
├── buttons/
│   └── new-button.tsx  # New button component
└── inputs/
    └── new-input.tsx   # New input component
```

### Adding Custom Logic
```
hooks/
└── use-new-feature.ts  # Custom hook for feature logic
services/
└── new-service.ts      # Business logic service
```

---

## Mobile-Specific Considerations

1. **Platform-Specific Assets**: Tab icons in `assets/images/tabIcons/` with platform-specific variants
2. **Native Modules**: Wrap native modules in `lib/` for cleaner imports
3. **Safe Areas**: Centralized helper in `utils/safe-area.tsx`
4. **Battery Optimization**: Dedicated hooks/services for battery monitoring

---

This structure follows Expo/React Native best practices while keeping the project simple and maintainable. It scales well as you add more features without becoming unwieldy.
