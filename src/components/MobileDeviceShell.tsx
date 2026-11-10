import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useOras } from '@/context/OrasContext';
import { useTheme } from '@/theme';

const CSS_DEPTH_STYLES = `
  .depth-card {
    transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease;
  }
  .depth-color {
    box-shadow: 0 14px 32px -8px rgba(59, 130, 246, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.35);
  }
  .depth-glass {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .depth-mini {
    transition: transform 0.18s ease;
  }
  .icon-3d {
    box-shadow: 0 6px 14px -3px rgba(59, 130, 246, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.45);
  }
  .avatar-3d {
    box-shadow: 0 10px 24px -6px rgba(30, 58, 138, 0.32), inset 0 2px 3px rgba(255, 255, 255, 0.5);
  }
  @keyframes auroraFloat {
    0% { transform: translate3d(0px, 0px, 0) scale(1); }
    50% { transform: translate3d(18px, -14px, 0) scale(1.06); }
    100% { transform: translate3d(0px, 0px, 0) scale(1); }
  }
  .aurora-orb-1 { animation: auroraFloat 9s ease-in-out infinite; }
  .aurora-orb-2 { animation: auroraFloat 12s ease-in-out infinite reverse; }
`;

export function MobileDeviceShell({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const { activeTheme, account, setControlCenterVisible, setGlanceSummaryVisible } = useOras();
  const [clock, setClock] = useState('9:41');

  // Inject CSS classes for the 3D depth system and PWA manifest link on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.title = 'OrasOras — Never miss class or requirements again.';

    let styleEl = document.getElementById('orasoras-depth-css');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'orasoras-depth-css';
      styleEl.textContent = CSS_DEPTH_STYLES;
      document.head.appendChild(styleEl);
    }

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }

    // Register offline PWA service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const h12 = hrs % 12 || 12;
      setClock(`${h12}:${mins}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);

  const isDesktopFrame = Platform.OS === 'web' && width >= 768 && height >= 640;

  if (!isDesktopFrame) {
    return <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>{children}</View>;
  }

  return (
    <View
      style={[
        styles.desktopBackdrop,
        {
          backgroundColor: theme.isDark ? '#050814' : '#E8F0FE',
          ...Platform.select({
            web: {
              backgroundImage: theme.isDark
                ? 'radial-gradient(circle at 18% 20%, rgba(59, 130, 246, 0.24) 0%, transparent 45%), radial-gradient(circle at 82% 78%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), linear-gradient(135deg, #050814 0%, #0A1128 50%, #0F1738 100%)'
                : 'radial-gradient(circle at 18% 20%, rgba(59, 130, 246, 0.22) 0%, transparent 45%), radial-gradient(circle at 82% 78%, rgba(99, 102, 241, 0.22) 0%, transparent 50%), linear-gradient(135deg, #E0ECFF 0%, #EEF2FF 50%, #F5F7FF 100%)',
            } as unknown as object,
          }),
        },
      ]}
    >
      {/* Soft Animated Aurora Background Orbs */}
      <View
        // @ts-ignore web className
        className="aurora-orb-1"
        pointerEvents="none"
        style={[
          styles.orbLeft,
          { backgroundColor: activeTheme.primary, opacity: theme.isDark ? 0.18 : 0.16 },
        ]}
      />
      <View
        // @ts-ignore web className
        className="aurora-orb-2"
        pointerEvents="none"
        style={[
          styles.orbRight,
          { backgroundColor: activeTheme.secondary, opacity: theme.isDark ? 0.2 : 0.15 },
        ]}
      />

      {/* Left Brand Showcase Badge on wide desktop screens */}
      {width >= 1180 && (
        <View style={styles.brandAside}>
          <View style={[styles.asidePill, { backgroundColor: 'rgba(59, 130, 246, 0.14)', borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
            <Ionicons name="sparkles" size={14} color="#3B82F6" />
            <Text style={[styles.asidePillText, { color: theme.isDark ? '#93C5FD' : '#1D4ED8' }]}>
              ACADEMIC COMPANION · PWA READY
            </Text>
          </View>
          <Text style={[styles.asideTitle, { color: theme.navy }]}>OrasOras</Text>
          <Text style={[styles.asideTagline, { color: theme.textSecondary }]}>
            Never miss class or requirements again.
          </Text>
          <View style={styles.asideBadges}>
            <View style={[styles.asideFeature, { backgroundColor: theme.cardGlass, borderColor: theme.border }]}>
              <Ionicons name="school" size={16} color={activeTheme.primary} />
              <Text style={[styles.asideFeatureText, { color: theme.navy }]}>
                {account.level}
              </Text>
            </View>
            <View style={[styles.asideFeature, { backgroundColor: theme.cardGlass, borderColor: theme.border }]}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={[styles.asideFeatureText, { color: theme.navy }]}>
                {account.studyStreak}-Day Streak
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Realistic Modern iPhone Titanium Frame */}
      <View style={styles.iphoneOuter}>
        {/* Hardware Side Buttons */}
        <View style={styles.sideButtonAction} />
        <View style={styles.sideButtonVolUp} />
        <View style={styles.sideButtonVolDown} />
        <View style={styles.sideButtonPower} />

        <View style={styles.iphoneBezel}>
          <View style={[styles.iphoneScreen, { backgroundColor: theme.background }]}>
            {/* iOS Status Bar + Dynamic Island */}
            <View
              style={[
                styles.statusBar,
                { backgroundColor: theme.background },
              ]}
            >
              <Text style={[styles.statusClock, { color: theme.navy }]}>{clock}</Text>

              {/* Dynamic Island */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Student Glance Summary"
                onPress={() => setGlanceSummaryVisible(true)}
                style={styles.dynamicIsland}
              >
                <View style={styles.islandSpeaker} />
                <View style={styles.islandCamera}>
                  <View style={styles.islandLensDot} />
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Control Center"
                onPress={() => setControlCenterVisible(true)}
                style={styles.statusIcons}
              >
                <Ionicons name="cellular" size={13} color={theme.navy} />
                <Ionicons name="wifi" size={14} color={theme.navy} />
                <Ionicons name="battery-full" size={17} color={theme.navy} />
              </Pressable>
            </View>

            {/* Main App Viewport */}
            <View style={styles.viewportContent}>{children}</View>

            {/* iOS Home Indicator Bar */}
            <View
              pointerEvents="none"
              style={styles.homeIndicatorWrap}
            >
              <View
                style={[
                  styles.homeIndicator,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.32)'
                      : 'rgba(15,23,42,0.25)',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  desktopBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  orbLeft: {
    position: 'absolute',
    top: -90,
    left: -90,
    width: 380,
    height: 380,
    borderRadius: 190,
    ...Platform.select({
      web: { filter: 'blur(70px)' } as unknown as object,
    }),
  },
  orbRight: {
    position: 'absolute',
    bottom: -110,
    right: -80,
    width: 420,
    height: 420,
    borderRadius: 210,
    ...Platform.select({
      web: { filter: 'blur(80px)' } as unknown as object,
    }),
  },
  brandAside: {
    position: 'absolute',
    left: 56,
    maxWidth: 290,
    gap: 10,
  },
  asidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  asidePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  asideTitle: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  asideTagline: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  asideBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  asideFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  asideFeatureText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iphoneOuter: {
    width: 418,
    height: '95%',
    maxHeight: 882,
    minHeight: 680,
    borderRadius: 56,
    padding: 4,
    backgroundColor: '#2E364F',
    position: 'relative',
    shadowColor: '#090D1E',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.42,
    shadowRadius: 56,
    elevation: 24,
  },
  sideButtonAction: {
    position: 'absolute',
    left: -3,
    top: 118,
    width: 3,
    height: 28,
    backgroundColor: '#475569',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  sideButtonVolUp: {
    position: 'absolute',
    left: -3,
    top: 164,
    width: 3,
    height: 52,
    backgroundColor: '#475569',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  sideButtonVolDown: {
    position: 'absolute',
    left: -3,
    top: 228,
    width: 3,
    height: 52,
    backgroundColor: '#475569',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  sideButtonPower: {
    position: 'absolute',
    right: -3,
    top: 186,
    width: 3,
    height: 76,
    backgroundColor: '#475569',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  iphoneBezel: {
    flex: 1,
    borderRadius: 52,
    padding: 9,
    backgroundColor: '#0A0D18',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  iphoneScreen: {
    flex: 1,
    borderRadius: 43,
    overflow: 'hidden',
    position: 'relative',
  },
  statusBar: {
    height: 44,
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  statusClock: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    width: 54,
  },
  dynamicIsland: {
    width: 118,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#04060E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  islandSpeaker: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111827',
  },
  islandCamera: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  islandLensDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1D4ED8',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    width: 54,
  },
  viewportContent: {
    flex: 1,
    overflow: 'hidden',
  },
  homeIndicatorWrap: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  homeIndicator: {
    width: 128,
    height: 4.5,
    borderRadius: 3,
  },
});
