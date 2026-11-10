import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import { COLOR_THEMES, STUDY_MODES } from '@/data/orasorasData';
import { useTheme } from '@/theme';

export function ControlCenterModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const {
    account,
    activeTheme,
    updateAccount,
    togglePreference,
    liveStudyTimer,
    toggleLiveStudyTimer,
    resetLiveStudyTimer,
    offlineModeSim,
    setOfflineModeSim,
    setGlanceSummaryVisible,
  } = useOras();

  const mins = String(Math.floor(liveStudyTimer.secondsLeft / 60)).padStart(
    2,
    '0'
  );
  const secs = String(liveStudyTimer.secondsLeft % 60).padStart(2, '0');

  const cycleStudyMode = async () => {
    const idx = STUDY_MODES.findIndex((m) => m.id === account.studyMode);
    const next = STUDY_MODES[(idx + 1) % STUDY_MODES.length];
    resetLiveStudyTimer(false, next.id);
    await updateAccount({ studyMode: next.id });
  };

  const cycleColorTheme = async () => {
    const idx = COLOR_THEMES.findIndex((t) => t.id === account.themeId);
    const next = COLOR_THEMES[(idx + 1) % COLOR_THEMES.length];
    await updateAccount({ themeId: next.id });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SmoothPressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close Control Center backdrop"
        >
          <View />
        </SmoothPressable>

        <View
          // @ts-ignore web className
          className="depth-glass"
          style={[
            styles.sheet,
            {
              backgroundColor: theme.isDark
                ? 'rgba(14, 21, 38, 0.96)'
                : 'rgba(246, 249, 255, 0.97)',
              borderColor: theme.border,
            },
          ]}
        >
          {/* Bottom Sheet Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View
              style={[
                styles.dragHandle,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.28)'
                    : 'rgba(15,23,42,0.22)',
                },
              ]}
            />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <Icon3D
                name="options"
                bg={activeTheme.primary}
                boxSize={38}
                size={18}
              />
              <View>
                <Text style={[styles.title, { color: theme.navy }]}>
                  Student Control Center
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Quick iOS-style academic toggles & live study controls
                </Text>
              </View>
            </View>

            <SmoothPressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surface }]}
              accessibilityLabel="Close Control Center"
            >
              <Ionicons name="close" size={20} color={theme.navy} />
            </SmoothPressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Live Pomodoro Banner Tile */}
            <DepthCard
              variant="color"
              gradientColors={[activeTheme.primary, activeTheme.secondary]}
              style={styles.pomodoroHeroTile}
            >
              <View style={styles.pomoTopRow}>
                <View style={styles.pomoLeftInfo}>
                  <View style={styles.pomoBadgeRow}>
                    <View
                      style={[
                        styles.pomoStatusDot,
                        {
                          backgroundColor: liveStudyTimer.running
                            ? '#10B981'
                            : '#FCD34D',
                        },
                      ]}
                    />
                    <Text style={styles.pomoBadgeText}>
                      {liveStudyTimer.running
                        ? 'LIVE STUDY SESSION'
                        : 'POMODORO TIMER READY'}
                    </Text>
                  </View>
                  <Text style={styles.pomoSubjectTitle}>
                    {liveStudyTimer.subjectName} · {account.studyMode}
                  </Text>
                  <Text numberOfLines={1} style={styles.pomoModuleSub}>
                    {liveStudyTimer.moduleTitle}
                  </Text>
                </View>

                <Text style={styles.pomoClockText}>
                  {mins}:{secs}
                </Text>
              </View>

              <View style={styles.pomoActionsRow}>
                <SmoothPressable
                  onPress={toggleLiveStudyTimer}
                  style={styles.pomoPrimaryBtn}
                >
                  <Ionicons
                    name={liveStudyTimer.running ? 'pause' : 'play'}
                    size={15}
                    color={activeTheme.primary}
                  />
                  <Text
                    style={[
                      styles.pomoPrimaryBtnText,
                      { color: activeTheme.primary },
                    ]}
                  >
                    {liveStudyTimer.running ? 'Pause Focus' : 'Start Focus'}
                  </Text>
                </SmoothPressable>

                <SmoothPressable
                  onPress={() => resetLiveStudyTimer()}
                  style={styles.pomoGlassBtn}
                >
                  <Ionicons name="refresh" size={15} color="#FFFFFF" />
                  <Text style={styles.pomoGlassBtnText}>Reset</Text>
                </SmoothPressable>

                <SmoothPressable
                  onPress={() => {
                    onClose();
                    router.push('/(tabs)/study' as Href);
                  }}
                  style={styles.pomoGlassBtn}
                >
                  <Ionicons name="open-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.pomoGlassBtnText}>Study Hub</Text>
                </SmoothPressable>
              </View>
            </DepthCard>

            {/* 8 Required Quick-Control Tiles Grid */}
            <View style={styles.tilesGrid}>
              {/* 1. Study Focus Mode */}
              <SmoothPressable
                onPress={() => void cycleStudyMode()}
                style={[
                  styles.controlTile,
                  {
                    backgroundColor: `${activeTheme.primary}18`,
                    borderColor: activeTheme.primary,
                  },
                ]}
              >
                <View style={styles.tileTopRow}>
                  <Icon3D
                    name="flame"
                    bg={activeTheme.primary}
                    boxSize={36}
                    size={17}
                  />
                  <View
                    style={[
                      styles.tileStatePill,
                      { backgroundColor: activeTheme.primary },
                    ]}
                  >
                    <Text style={styles.tileStateText}>ACTIVE</Text>
                  </View>
                </View>
                <Text style={[styles.tileTitle, { color: theme.navy }]}>
                  Study Focus
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.tileSub, { color: activeTheme.primary }]}
                >
                  {account.studyMode} (Tap to cycle)
                </Text>
              </SmoothPressable>

              {/* 2. Dark Mode */}
              <SmoothPressable
                onPress={() =>
                  void updateAccount({ darkMode: !account.darkMode })
                }
                style={[
                  styles.controlTile,
                  {
                    backgroundColor: account.darkMode
                      ? 'rgba(99, 102, 241, 0.2)'
                      : theme.card,
                    borderColor: account.darkMode ? '#6366F1' : theme.border,
                  },
                ]}
              >
                <View style={styles.tileTopRow}>
                  <Icon3D
                    name={account.darkMode ? 'moon' : 'sunny'}
                    bg={account.darkMode ? '#6366F1' : '#F59E0B'}
                    boxSize={36}
                    size={17}
                  />
                  <View
                    style={[
                      styles.tileStatePill,
                      {
                        backgroundColor: account.darkMode
                          ? '#6366F1'
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileStateText,
                        {
                          color: account.darkMode
                            ? '#FFFFFF'
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {account.darkMode ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tileTitle, { color: theme.navy }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.tileSub, { color: theme.textSecondary }]}>
                  {account.darkMode ? 'Deep Navy Dark' : 'Soft Blue-White'}
                </Text>
              </SmoothPressable>

              {/* 3. Notifications (Requirement Alerts & Digest) */}
              <SmoothPressable
                onPress={() => void togglePreference('requirementAlerts')}
                style={[
                  styles.controlTile,
                  {
                    backgroundColor: account.preferences.requirementAlerts
                      ? 'rgba(59, 130, 246, 0.16)'
                      : theme.card,
                    borderColor: account.preferences.requirementAlerts
                      ? '#3B82F6'
                      : theme.border,
                  },
                ]}
              >
                <View style={styles.tileTopRow}>
                  <Icon3D
                    name="notifications"
                    bg={
                      account.preferences.requirementAlerts
                        ? '#3B82F6'
                        : '#64748B'
                    }
                    boxSize={36}
                    size={17}
                  />
                  <View
                    style={[
                      styles.tileStatePill,
                      {
                        backgroundColor: account.preferences.requirementAlerts
                          ? '#3B82F6'
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileStateText,
                        {
                          color: account.preferences.requirementAlerts
                            ? '#FFFFFF'
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {account.preferences.requirementAlerts ? 'ON' : 'MUTED'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tileTitle, { color: theme.navy }]}>
                  Notifications
                </Text>
                <Text style={[styles.tileSub, { color: theme.textSecondary }]}>
                  {account.preferences.requirementAlerts
                    ? 'Deadline & AI alerts'
                    : 'Alerts paused'}
                </Text>
              </SmoothPressable>

              {/* 4. Offline Mode */}
              <SmoothPressable
                onPress={() => setOfflineModeSim(!offlineModeSim)}
                style={[
                  styles.controlTile,
                  {
                    backgroundColor: offlineModeSim
                      ? 'rgba(16, 185, 129, 0.16)'
                      : theme.card,
                    borderColor: offlineModeSim ? '#10B981' : theme.border,
                  },
                ]}
              >
                <View style={styles.tileTopRow}>
                  <Icon3D
                    name={offlineModeSim ? 'cloud-offline' : 'cloud-done'}
                    bg="#10B981"
                    boxSize={36}
                    size={17}
                  />
                  <View
                    style={[
                      styles.tileStatePill,
                      {
                        backgroundColor: offlineModeSim
                          ? '#10B981'
                          : 'rgba(16,185,129,0.18)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileStateText,
                        { color: offlineModeSim ? '#FFFFFF' : '#10B981' },
                      ]}
                    >
                      {offlineModeSim ? 'OFFLINE' : 'READY'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tileTitle, { color: theme.navy }]}>
                  Offline Mode
                </Text>
                <Text style={[styles.tileSub, { color: theme.textSecondary }]}>
                  {offlineModeSim
                    ? 'Local SQLite vault only'
                    : 'PWA cache active'}
                </Text>
              </SmoothPressable>

              {/* 5. Pomodoro Timer Toggle */}
              <SmoothPressable
                onPress={toggleLiveStudyTimer}
                style={[
                  styles.controlTile,
                  {
                    backgroundColor: liveStudyTimer.running
                      ? 'rgba(16, 185, 129, 0.16)'
                      : theme.card,
                    borderColor: liveStudyTimer.running
                      ? '#10B981'
                      : theme.border,
                  },
                ]}
              >
                <View style={styles.tileTopRow}>
                  <Icon3D
                    name="timer"
                    bg={liveStudyTimer.running ? '#10B981' : '#3B82F6'}
                    boxSize={36}
                    size={17}
                  />
                  <View
                    style={[
                      styles.tileStatePill,
                      {
                        backgroundColor: liveStudyTimer.running
                          ? '#10B981'
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileStateText,
                        {
                          color: liveStudyTimer.running
                            ? '#FFFFFF'
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {liveStudyTimer.running ? 'RUNNING' : 'PAUSED'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tileTitle, { color: theme.navy }]}>
                  Pomodoro Timer
                </Text>
                <Text style={[styles.tileSub, { color: theme.textSecondary }]}>
                  {mins}:{secs} remaining
                </Text>
              </SmoothPressable>

              {/* 6. Class Reminders */}
              <SmoothPressable
                onPress={() => void togglePreference('classReminders')}
                style={[
                  styles.controlTile,
                  {
                    backgroundColor: account.preferences.classReminders
                      ? 'rgba(245, 158, 11, 0.16)'
                      : theme.card,
                    borderColor: account.preferences.classReminders
                      ? '#F59E0B'
                      : theme.border,
                  },
                ]}
              >
                <View style={styles.tileTopRow}>
                  <Icon3D
                    name="alarm"
                    bg={
                      account.preferences.classReminders ? '#F59E0B' : '#64748B'
                    }
                    boxSize={36}
                    size={17}
                  />
                  <View
                    style={[
                      styles.tileStatePill,
                      {
                        backgroundColor: account.preferences.classReminders
                          ? '#F59E0B'
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileStateText,
                        {
                          color: account.preferences.classReminders
                            ? '#FFFFFF'
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {account.preferences.classReminders ? '15M' : 'OFF'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tileTitle, { color: theme.navy }]}>
                  Class Reminders
                </Text>
                <Text style={[styles.tileSub, { color: theme.textSecondary }]}>
                  {account.preferences.classReminders
                    ? '15m before class'
                    : 'Reminders disabled'}
                </Text>
              </SmoothPressable>

              {/* 7. Sound & Haptics */}
              <SmoothPressable
                onPress={() => void togglePreference('soundEffects')}
                style={[
                  styles.controlTile,
                  {
                    backgroundColor: account.preferences.soundEffects
                      ? 'rgba(139, 92, 246, 0.16)'
                      : theme.card,
                    borderColor: account.preferences.soundEffects
                      ? '#8B5CF6'
                      : theme.border,
                  },
                ]}
              >
                <View style={styles.tileTopRow}>
                  <Icon3D
                    name={
                      account.preferences.soundEffects
                        ? 'volume-high'
                        : 'volume-mute'
                    }
                    bg={
                      account.preferences.soundEffects ? '#8B5CF6' : '#64748B'
                    }
                    boxSize={36}
                    size={17}
                  />
                  <View
                    style={[
                      styles.tileStatePill,
                      {
                        backgroundColor: account.preferences.soundEffects
                          ? '#8B5CF6'
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileStateText,
                        {
                          color: account.preferences.soundEffects
                            ? '#FFFFFF'
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {account.preferences.soundEffects ? 'ON' : 'SILENT'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tileTitle, { color: theme.navy }]}>
                  Sound & Haptics
                </Text>
                <Text style={[styles.tileSub, { color: theme.textSecondary }]}>
                  {account.preferences.soundEffects
                    ? 'Tactile & audio cues'
                    : 'Muted feedback'}
                </Text>
              </SmoothPressable>

              {/* 8. Screen Theme */}
              <SmoothPressable
                onPress={() => void cycleColorTheme()}
                style={[
                  styles.controlTile,
                  {
                    backgroundColor: `${activeTheme.secondary}18`,
                    borderColor: activeTheme.secondary,
                  },
                ]}
              >
                <View style={styles.tileTopRow}>
                  <Icon3D
                    name="color-palette"
                    bg={activeTheme.secondary}
                    boxSize={36}
                    size={17}
                  />
                  <View
                    style={[
                      styles.tileStatePill,
                      { backgroundColor: activeTheme.secondary },
                    ]}
                  >
                    <Text style={styles.tileStateText}>12 THEMES</Text>
                  </View>
                </View>
                <Text style={[styles.tileTitle, { color: theme.navy }]}>
                  Screen Theme
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.tileSub, { color: activeTheme.secondary }]}
                >
                  {activeTheme.name}
                </Text>
              </SmoothPressable>
            </View>

            {/* Quick Launch Lock-Screen Student Summary Button */}
            <SmoothPressable
              onPress={() => {
                onClose();
                setGlanceSummaryVisible(true);
              }}
              style={[
                styles.glanceLaunchBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.glanceLaunchLeft}>
                <Icon3D
                  name="phone-portrait-outline"
                  bg="#6366F1"
                  boxSize={38}
                  size={18}
                />
                <View>
                  <Text style={[styles.glanceLaunchTitle, { color: theme.navy }]}>
                    Open Student Glance Summary
                  </Text>
                  <Text
                    style={[
                      styles.glanceLaunchSub,
                      { color: theme.textSecondary },
                    ]}
                  >
                    iOS lock-screen-style academic overview & countdowns
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textMuted}
              />
            </SmoothPressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 11, 25, 0.62)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  pomodoroHeroTile: {
    padding: 16,
    borderRadius: 24,
    gap: 12,
  },
  pomoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pomoLeftInfo: {
    flex: 1,
    gap: 3,
  },
  pomoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pomoStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  pomoBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  pomoSubjectTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  pomoModuleSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '600',
  },
  pomoClockText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  pomoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pomoPrimaryBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 13,
  },
  pomoPrimaryBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  pomoGlassBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    paddingVertical: 10,
    borderRadius: 13,
  },
  pomoGlassBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  controlTile: {
    width: '48.4%',
    padding: 13,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 5,
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tileStatePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tileStateText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tileSub: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  glanceLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  glanceLaunchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  glanceLaunchTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  glanceLaunchSub: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
});
