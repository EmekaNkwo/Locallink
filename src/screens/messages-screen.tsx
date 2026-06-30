import { SymbolView } from 'expo-symbols';
import { KeyboardAvoidingView, Keyboard, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageCard } from '@/components/cards/message-card';
import { EncryptedTextInput } from '@/components/inputs/text-input';
import { ScreenHeader } from '@/components/screen-header';
import { StatusPill } from '@/components/status-pill';
import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCallStore, useDeviceStore, useMessageStore } from '@/store';

export function MessagesScreen() {
  const theme = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const safeAreaInsets = useSafeAreaInsets();
  const tabClearance = Platform.OS === 'web' ? Spacing.five : Spacing.four;
  const bottomInset = keyboardVisible ? Spacing.two : safeAreaInsets.bottom + tabClearance;
  const insets = {
    ...safeAreaInsets,
    bottom: bottomInset,
  };
  const allMessages = useMessageStore((state) => state.messages);
  const setActiveConversation = useMessageStore((state) => state.setActiveConversation);
  const isOffline = useMessageStore((state) => state.isOffline);
  const send = useMessageStore((state) => state.send);
  const setOffline = useMessageStore((state) => state.setOffline);
  const pairedDevice = useDeviceStore((state) => state.pairedDevice);
  const session = useCallStore((state) => state.session);
  const conversationId = pairedDevice?.id ?? (session ? `session:${session.peerName}` : null);
  const peerName = session?.peerName ?? pairedDevice?.name ?? null;
  const messages = conversationId
    ? allMessages.filter((message) => message.conversationId === conversationId)
    : [];
  const queuedCount = messages.filter((m) => m.status === 'queued').length;

  const handleSend = (body: string) => {
    void send(body);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    setActiveConversation(conversationId);
  }, [conversationId, setActiveConversation]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <ScreenHeader
          eyebrow="Secure Channel"
          title={peerName ? peerName : 'Messages'}
          right={<StatusPill label="E2EE" color="success" dot={false} />}
        />

        {isOffline || queuedCount > 0 ? (
          <OfflineBanner
            isOffline={isOffline}
            queuedCount={queuedCount}
            onToggle={() => setOffline(!isOffline)}
          />
        ) : null}

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
          contentInset={{ bottom: insets.bottom }}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <SymbolView
                name={{ ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' }}
                size={36}
                tintColor={theme.textSecondary}
              />
              <ThemedText type="smallBold">
                {conversationId ? 'No messages in this conversation' : 'No active conversation'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                {conversationId
                  ? 'Messages you send to this connection will appear here.'
                  : 'Pair with a nearby device to start a secure conversation.'}
              </ThemedText>
            </View>
          ) : (
            messages.map((message) => <MessageCard key={message.id} message={message} />)
          )}
        </ScrollView>

        {conversationId ? (
          <View
            style={[
              styles.composer,
              { paddingBottom: insets.bottom, borderTopColor: theme.border, backgroundColor: theme.background },
            ]}>
            <EncryptedTextInput onSend={handleSend} />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

type OfflineBannerProps = {
  isOffline: boolean;
  queuedCount: number;
  onToggle: () => void;
};

function OfflineBanner({ isOffline, queuedCount, onToggle }: OfflineBannerProps) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown} style={styles.bannerWrap}>
      <PressableScale
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel="Toggle offline mode"
        style={[styles.banner, { backgroundColor: `${theme.warning}1A`, borderColor: `${theme.warning}66` }]}>
        <SymbolView name={{ ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }} size={16} tintColor={theme.warning} />
        <ThemedText type="small" style={{ color: theme.warning, flex: 1 }}>
          {isOffline
            ? `Offline — ${queuedCount} message${queuedCount === 1 ? '' : 's'} queued for sync`
            : 'Offline — messages will sync on reconnect'}
        </ThemedText>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  bannerWrap: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two + 2,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  messageList: { paddingTop: Spacing.two, paddingBottom: Spacing.one, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  emptyText: { textAlign: 'center' },
  composer: { borderTopWidth: 1 },
});
