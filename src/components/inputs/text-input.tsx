import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EncryptedTextInputProps = {
  onSend: (text: string) => void;
  placeholder?: string;
};

export function EncryptedTextInput({
  onSend,
  placeholder = 'Encrypted message…',
}: EncryptedTextInputProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const canSend = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: focused ? theme.tint2 : theme.border,
          },
        ]}>
        <View style={[styles.lockBadge, { backgroundColor: theme.backgroundSelected }]}>
          <SymbolView
            name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
            size={16}
            tintColor={theme.tint2}
          />
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          multiline
          maxLength={500}
          accessibilityLabel="Message input"
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <PressableScale
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? theme.tint : theme.backgroundSelected },
          ]}>
          <SymbolView
            name={{ ios: 'arrow.up', android: 'send', web: 'send' }}
            size={18}
            tintColor={canSend ? theme.background : theme.textSecondary}
          />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.one,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radii.xl,
    minHeight: 60,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 112,
    paddingVertical: Spacing.two,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
