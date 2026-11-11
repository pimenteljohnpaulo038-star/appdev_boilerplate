import { Ionicons } from '@expo/vector-icons';
import { type Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothPressable } from '@/components/SmoothPressable';
import { UserAvatar } from '@/components/UserAvatar';
import { useOras } from '@/context/OrasContext';
import { useTheme } from '@/theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export const TAB_BAR_HEIGHT = 70;
export const TAB_BAR_GAP = 12;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<
  string,
  { label: string; filled: IconName; outline: IconName; isCenter?: boolean }
> = {
  index: { label: 'Home', filled: 'home', outline: 'home-outline' },
  library: { label: 'Library', filled: 'library', outline: 'library-outline' },
  study: { label: 'Study', filled: 'sparkles', outline: 'sparkles-outline', isCenter: true },
  progress: { label: 'Progress', filled: 'stats-chart', outline: 'stats-chart-outline' },
  profile: { label: 'Profile', filled: 'person', outline: 'person-outline' },
};

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const { activeTheme, t } = useOras();
  const insets = useSafeAreaInsets();

  const getTabLabel = (name: string): string => {
    switch (name) {
      case 'index':
        return t.tabHome;
      case 'library':
        return t.tabLibrary;
      case 'study':
        return t.tabStudy;
      case 'progress':
        return t.tabProgress;
      case 'profile':
        return t.tabProfile;
      default:
        return 'Tab';
    }
  };

  const currentRouteName = state.routes[state.index]?.name;
  // Hide floating tab bar inside full-screen AI chat screen so keyboard composer has full bottom room
  if (currentRouteName === 'chat') return null;

  const visibleRoutes = state.routes.filter((r) => TAB_CONFIG[r.name]);

  const go = (route: (typeof state.routes)[number], focused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { bottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View
        // @ts-ignore web className
        className="depth-glass"
        style={[
          styles.bar,
          {
            backgroundColor: theme.isDark
              ? 'rgba(15, 23, 42, 0.90)'
              : 'rgba(255, 255, 255, 0.90)',
            borderColor: theme.isDark
              ? 'rgba(99, 102, 241, 0.35)'
              : 'rgba(255, 255, 255, 0.85)',
            shadowColor: theme.isDark ? '#020617' : '#64748B',
            ...Platform.select({
              web: {
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              } as unknown as object,
            }),
          },
        ]}
      >
        {visibleRoutes.map((route) => {
          const cfg = TAB_CONFIG[route.name];
          if (!cfg) return null;
          const focused = state.routes[state.index]?.key === route.key;

          if (cfg.isCenter) {
            return (
              <SmoothPressable
                key={route.key}
                onPress={() => go(route, focused)}
                accessibilityRole="tab"
                accessibilityLabel="Study and Ask OrasOras AI"
                accessibilityState={{ selected: focused }}
                style={styles.centerItemWrap}
              >
                <View
                  // @ts-ignore web className
                  className="icon-3d"
                  style={[
                    styles.centerOrb,
                    {
                      backgroundColor: '#8B5CF6',
                      shadowColor: '#8B5CF6',
                      transform: [{ translateY: focused ? -10 : -7 }, { scale: focused ? 1.05 : 1 }],
                      ...Platform.select({
                        web: {
                          backgroundImage:
                            'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                        } as unknown as object,
                      }),
                    },
                  ]}
                >
                  <View style={styles.centerOrbGloss} />
                  <Ionicons name={focused ? cfg.filled : cfg.outline} size={23} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.centerLabel,
                    {
                      color: focused ? '#8B5CF6' : theme.textSecondary,
                      fontWeight: focused ? '800' : '700',
                    },
                  ]}
                >
                  {getTabLabel(route.name)}
                </Text>
              </SmoothPressable>
            );
          }

          return (
            <SmoothPressable
              key={route.key}
              onPress={() => go(route, focused)}
              accessibilityRole="tab"
              accessibilityLabel={getTabLabel(route.name)}
              accessibilityState={{ selected: focused }}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.iconBadge,
                  focused && {
                    backgroundColor: theme.isDark
                      ? 'rgba(59, 130, 246, 0.22)'
                      : 'rgba(59, 130, 246, 0.13)',
                    transform: [{ translateY: -2 }],
                  },
                ]}
              >
                {route.name === 'profile' ? (
                  <UserAvatar
                    size={focused ? 24 : 22}
                    showBorder={focused}
                    borderColor={activeTheme.primary}
                  />
                ) : (
                  <Ionicons
                    name={focused ? cfg.filled : cfg.outline}
                    size={20}
                    color={focused ? activeTheme.primary : theme.textMuted}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: focused ? activeTheme.primary : theme.textMuted,
                    fontWeight: focused ? '800' : '600',
                  },
                ]}
              >
                {getTabLabel(route.name)}
              </Text>
              {focused && (
                <View
                  style={[
                    styles.activeIndicatorDot,
                    { backgroundColor: activeTheme.primary },
                  ]}
                />
              )}
            </SmoothPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 40,
  },
  bar: {
    width: '100%',
    maxWidth: 460,
    height: TAB_BAR_HEIGHT,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
  },
  iconBadge: {
    width: 38,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
    letterSpacing: -0.1,
  },
  activeIndicatorDot: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  centerItemWrap: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  centerOrb: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
    overflow: 'hidden',
  },
  centerOrbGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  centerLabel: {
    fontSize: 10.5,
    marginTop: -4,
    letterSpacing: -0.1,
  },
});
