import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AnimeAvatar } from '@/components/AnimeAvatar';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';

export function StudentGlanceSummaryModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const {
    account,
    activeTheme,
    liveStudyTimer,
    toggleLiveStudyTimer,
  } = useOras();

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, [visible]);

  const hrs = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const h12 = hrs % 12 || 12;
  const timeBig = `${h12}:${mins}`;

  const dateLine = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const todayDow = now.getDay();
  const todaysClasses = account.schedule
    .filter((s) => !s.cancelled && (s.dayOfWeek === todayDow || s.repeating === 'Daily'))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nextClass = todaysClasses[0] ?? account.schedule[0];

  const pendingReqs = (account.requirements || [])
    .filter((r) => !r.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextDeadline = pendingReqs[0];

  const weeklyMinutesStudied = Object.values(account.activityByDate || {})
    .slice(0, 7)
    .reduce((a, b) => a + b, 0);
  const dailyGoalPct = Math.min(
    100,
    Math.round(
      (weeklyMinutesStudied / Math.max(60, account.weeklyGoalMinutes)) * 100
    ) || 80
  );

  const timerMins = String(Math.floor(liveStudyTimer.secondsLeft / 60)).padStart(
    2,
    '0'
  );
  const timerSecs = String(liveStudyTimer.secondsLeft % 60).padStart(2, '0');

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View
        style={[
          styles.backdrop,
          Platform.select({
            web: {
              backgroundImage: `radial-gradient(circle at 22% 18%, ${activeTheme.primary}66 0%, transparent 48%), radial-gradient(circle at 80% 76%, ${activeTheme.secondary}66 0%, transparent 52%), linear-gradient(165deg, #060B19 0%, #0C1631 52%, #131F42 100%)`,
            } as unknown as object,
          }),
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Student Identity Bar */}
          <View style={styles.topStudentRow}>
            <View style={styles.studentPill}>
              <AnimeAvatar
                config={
                  account.useCustomAvatar ? account.customAvatar : undefined
                }
                presetId={account.presetAvatarId}
                size={32}
                bgColors={[activeTheme.primary, activeTheme.secondary]}
              />
              <View>
                <Text style={styles.studentNameText}>{account.name}</Text>
                <Text style={styles.studentLevelSub}>
                  {account.level} · {account.profileTitle}
                </Text>
              </View>
            </View>

            <SmoothPressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close Student Glance Summary"
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </SmoothPressable>
          </View>

          {/* Giant iOS-Inspired Lock-Screen Clock & Date */}
          <View style={styles.clockHeroBlock}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={15} color="#93C5FD" />
              <Text style={styles.dateLabel}>{dateLine}</Text>
            </View>
            <Text style={styles.giantClockText}>{timeBig}</Text>
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={14} color="#FCD34D" />
              <Text style={styles.streakChipText}>
                {account.studyStreak}-Day Study Streak · {dailyGoalPct}% Weekly Goal
              </Text>
            </View>
          </View>

          {/* Glance Widget 1: Next Class Countdown */}
          <View
            // @ts-ignore web className
            className="depth-glass"
            style={styles.glanceWidget}
          >
            <View style={styles.widgetHeaderRow}>
              <View style={styles.widgetTitleLeft}>
                <View
                  style={[
                    styles.widgetIconBadge,
                    { backgroundColor: activeTheme.primary },
                  ]}
                >
                  <Ionicons name="school" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.widgetLabel}>NEXT CLASS · IN 25 MIN</Text>
              </View>
              <SmoothPressable
                onPress={() => {
                  onClose();
                  router.push('/calendar' as Href);
                }}
                style={styles.widgetMiniBtn}
              >
                <Text style={styles.widgetMiniBtnText}>Schedule</Text>
                <Ionicons name="chevron-forward" size={13} color="#93C5FD" />
              </SmoothPressable>
            </View>

            <Text style={styles.widgetMainTitle}>
              {nextClass?.subjectName ?? 'Calculus & Analytical Geometry'}
            </Text>
            <Text style={styles.widgetSubMeta}>
              {nextClass
                ? `${nextClass.startTime} – ${nextClass.endTime} · ${nextClass.roomOrLink} · ${nextClass.instructor}`
                : '08:30 – 10:00 · Room 304 · Prof. Elena Vance'}
            </Text>
          </View>

          {/* Glance Widget 2: Upcoming Requirement Deadline */}
          <View
            // @ts-ignore web className
            className="depth-glass"
            style={styles.glanceWidget}
          >
            <View style={styles.widgetHeaderRow}>
              <View style={styles.widgetTitleLeft}>
                <View
                  style={[
                    styles.widgetIconBadge,
                    {
                      backgroundColor:
                        nextDeadline?.priority === 'Urgent'
                          ? '#EF4444'
                          : '#F59E0B',
                    },
                  ]}
                >
                  <Ionicons name="alert-circle" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.widgetLabel}>UPCOMING REQUIREMENT</Text>
              </View>
              <SmoothPressable
                onPress={() => {
                  onClose();
                  router.push('/requirements' as Href);
                }}
                style={styles.widgetMiniBtn}
              >
                <Text style={styles.widgetMiniBtnText}>Tasks</Text>
                <Ionicons name="chevron-forward" size={13} color="#93C5FD" />
              </SmoothPressable>
            </View>

            <Text style={styles.widgetMainTitle}>
              {nextDeadline?.title ?? 'All requirements completed!'}
            </Text>
            <Text style={styles.widgetSubMeta}>
              {nextDeadline
                ? `${nextDeadline.subjectName} · Due ${nextDeadline.dueDate} at ${nextDeadline.dueTime} (${nextDeadline.priority})`
                : 'Zero pending deadlines — great job staying ahead!'}
            </Text>
          </View>

          {/* Glance Widget 3: Active Study Timer & Daily Goal Progress */}
          <View style={styles.twoColWidgets}>
            {/* Active Study Timer Card */}
            <View
              // @ts-ignore web className
              className="depth-glass"
              style={[styles.glanceWidget, styles.halfWidget]}
            >
              <View style={styles.widgetTitleLeft}>
                <View
                  style={[
                    styles.widgetIconBadge,
                    {
                      backgroundColor: liveStudyTimer.running
                        ? '#10B981'
                        : '#6366F1',
                    },
                  ]}
                >
                  <Ionicons name="timer" size={13} color="#FFFFFF" />
                </View>
                <Text style={styles.widgetLabel}>STUDY TIMER</Text>
              </View>
              <Text style={styles.halfTimerValue}>
                {timerMins}:{timerSecs}
              </Text>
              <Text numberOfLines={1} style={styles.widgetSubMeta}>
                {liveStudyTimer.subjectName} · {account.studyMode}
              </Text>
              <SmoothPressable
                onPress={toggleLiveStudyTimer}
                style={[
                  styles.halfActionBtn,
                  {
                    backgroundColor: liveStudyTimer.running
                      ? 'rgba(16,185,129,0.25)'
                      : 'rgba(255,255,255,0.16)',
                  },
                ]}
              >
                <Ionicons
                  name={liveStudyTimer.running ? 'pause' : 'play'}
                  size={13}
                  color="#FFFFFF"
                />
                <Text style={styles.halfActionText}>
                  {liveStudyTimer.running ? 'Pause' : 'Start Focus'}
                </Text>
              </SmoothPressable>
            </View>

            {/* Daily Goal Progress Card */}
            <View
              // @ts-ignore web className
              className="depth-glass"
              style={[styles.glanceWidget, styles.halfWidget]}
            >
              <View style={styles.widgetTitleLeft}>
                <View
                  style={[
                    styles.widgetIconBadge,
                    { backgroundColor: '#10B981' },
                  ]}
                >
                  <Ionicons name="trending-up" size={13} color="#FFFFFF" />
                </View>
                <Text style={styles.widgetLabel}>GOAL PROGRESS</Text>
              </View>
              <Text style={styles.halfTimerValue}>{dailyGoalPct}%</Text>
              <Text numberOfLines={1} style={styles.widgetSubMeta}>
                {weeklyMinutesStudied} / {account.weeklyGoalMinutes} mins studied
              </Text>
              <View style={styles.goalBarTrack}>
                <View
                  style={[
                    styles.goalBarFill,
                    {
                      width: `${dailyGoalPct}%`,
                      backgroundColor: '#10B981',
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Bottom Quick Launch Dock */}
          <View style={styles.quickLaunchRow}>
            <SmoothPressable
              onPress={() => {
                onClose();
                router.push('/(tabs)/study' as Href);
              }}
              style={styles.quickCircleBtn}
              accessibilityLabel="Quick launch Study Hub"
            >
              <Ionicons name="timer-outline" size={20} color="#FFFFFF" />
            </SmoothPressable>

            <SmoothPressable
              onPress={onClose}
              style={[
                styles.returnPrimaryPill,
                { backgroundColor: activeTheme.primary },
              ]}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.returnPrimaryText}>
                Return to OrasOras Dashboard
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => {
                onClose();
                router.push('/(tabs)/chat' as Href);
              }}
              style={styles.quickCircleBtn}
              accessibilityLabel="Quick launch Ask OrasOras AI"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color="#FFFFFF"
              />
            </SmoothPressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#070D1D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 34,
    gap: 14,
  },
  topStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  studentNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  studentLevelSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10.5,
    fontWeight: '600',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHeroBlock: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    color: '#BFDBFE',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  giantClockText: {
    color: '#FFFFFF',
    fontSize: 68,
    fontWeight: '900',
    letterSpacing: -2.5,
    lineHeight: 74,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 2,
  },
  streakChipText: {
    color: '#F8FAFC',
    fontSize: 11.5,
    fontWeight: '700',
  },
  glanceWidget: {
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 22,
    padding: 15,
    gap: 6,
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  widgetIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  widgetMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  widgetMiniBtnText: {
    color: '#93C5FD',
    fontSize: 11.5,
    fontWeight: '800',
  },
  widgetMainTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  widgetSubMeta: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '600',
  },
  twoColWidgets: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidget: {
    flex: 1,
    justifyContent: 'space-between',
  },
  halfTimerValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  halfActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 11,
    marginTop: 4,
  },
  halfActionText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  goalBarTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
    marginTop: 8,
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickLaunchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  quickCircleBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnPrimaryPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  returnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
