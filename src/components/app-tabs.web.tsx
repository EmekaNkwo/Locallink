import type { Href } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

type TabItem = {
  name: string;
  href: Href;
  label: string;
  icon: SymbolViewProps['name'];
};

const TAB_ITEMS: TabItem[] = [
  { name: 'index', href: '/' as Href, label: 'Home', icon: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' } },
  { name: 'discover', href: '/discover' as Href, label: 'Discover', icon: { ios: 'dot.radiowaves.left.and.right', android: 'wifi_tethering', web: 'wifi_tethering' } },
  { name: 'messages', href: '/messages' as Href, label: 'Messages', icon: { ios: 'bubble.left.fill', android: 'chat', web: 'chat' } },
  { name: 'status', href: '/status' as Href, label: 'Status', icon: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' } },
  { name: 'profile', href: '/profile' as Href, label: 'Profile', icon: { ios: 'person.fill', android: 'person', web: 'person' } },
];

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs>
      <TabSlot />
      <TabList style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {TAB_ITEMS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton icon={tab.icon} label={tab.label} activeColor={colors.text} inactiveColor={colors.textSecondary} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: SymbolViewProps['name'];
  label: string;
  activeColor: string;
  inactiveColor: string;
};

function TabButton({ icon, label, activeColor, inactiveColor, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      <SymbolView name={icon} size={22} tintColor={isFocused ? activeColor : inactiveColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: Spacing.three,
    left: Spacing.four,
    right: Spacing.four,
    marginHorizontal: 'auto',
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pressed: {
    opacity: 0.6,
  },
});
