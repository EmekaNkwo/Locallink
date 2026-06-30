import { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import { View, StyleSheet, StatusBar, Text } from 'react-native';
import { AnimatedSplashOverlay, AnimatedIcon } from '@/components/animated-icon';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to main app after splash animation completes
    const timer = setTimeout(() => {
      router.replace('/' as Href);
    }, 1200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#08080A" translucent={false} />
      <AnimatedSplashOverlay />
      <View style={styles.content}>
        <AnimatedIcon />
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>Set</Text>
            <Text style={[styles.titleText, styles.linkText]}>Link</Text>
          </View>
          <Text style={styles.subtitle}>Secure Offline Comms</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  textContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  linkText: {
    color: '#00E5B0',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A95AD',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: 6,
  },
});