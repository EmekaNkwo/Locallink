import { install } from 'react-native-quick-crypto';

// Installs a fast, native crypto implementation onto global (crypto.getRandomValues,
// subtle, etc.) so identity crypto (Ed25519/X25519/HKDF) works on device.
// Imported once, before any crypto usage. Native-only (web is a no-op).
install();
