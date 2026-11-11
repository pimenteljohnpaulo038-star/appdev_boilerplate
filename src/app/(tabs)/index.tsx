import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { UserAvatar } from '@/components/UserAvatar';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';

const MOTIVATIONAL_QUOTES = [
  {
    quote: 'Small daily improvements over time lead to stunning academic breakthroughs.',
    author: 'OrasOras Scholar Wisdom',
  },
  {
    quote: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Academic Mastery Principle',
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    account,
    activeTheme,
    toggleRequirementComplete,
    t,
    setGlanceSummaryVisible,
  } = useOras();

  const now = new Date();
  const hour = now.getHours();
  const timeGreeting =
    hour < 12 ? t.greetingMorning : hour < 18 ? t.greetingAfternoon : t.greetingEvening;

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const todayStr = now.toISOString().split('T')[0];
  const todayDow = now.getDay();

  // Today's classes
  const matchingToday = account.schedule.filter(
    (s) => s.dayOfWeek === todayDow || s.repeating === 'Daily'
  );
  const todaysClasses = [
    ...(matchingToday.length > 0 ? matchingToday : account.schedule.slice(0, 3)),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const activeClassesToday = todaysClasses.filter((c) => !c.cancelled);

  // Requirements analysis
  const pendingReqs = account.requirements.filter((r) => !r.completed);

  const overdueReqs = pendingReqs.filter(
    (r) => r.dueDate < todayStr || r.priority === 'Urgent'
  );

  const dueSoonReqs = pendingReqs.filter((r) => r.dueDate >= todayStr);

  // Weekly goal percentage
  const weeklyMinutesStudied = Object.values(account.activityByDate || {})
    .slice(0, 7)
    .reduce((a, b) => a + b, 0);

  const weeklyGoalPct = Math.min(
    100,
    Math.round((weeklyMinutesStudied / Math.max(60, account.weeklyGoalMinutes)) * 100) || 80
  );

  const nextClass = activeClassesToday[0] ?? todaysClasses[0];
  const quote = MOTIVATIONAL_QUOTES[0];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top Header: Avatar, Time-based Greeting, Date, Weather-style Status, Notification Bell */}
        <View style={styles.headerRow}>
          <SmoothPressable
            onPress={() => router.push('/(tabs)/profile' as Href)}
            style={styles.profileGreetRow}
          >
            <UserAvatar size={52} />
            <View style={styles.greetCol}>
              <View style={styles.dateBadgeRow}>
                <Text style={[styles.dateText, { color: theme.textMuted }]}>
                  {formattedDate.toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.levelPill,
                    { backgroundColor: `${activeTheme.primary}18` },
                  ]}
                >
                  <Text
                    style={[styles.levelPillText, { color: activeTheme.primary }]}
                  >
                    {account.level === 'Senior High School'
                      ? 'SHS'
                      : account.level === 'Junior High School'
                      ? 'JHS'
                      : 'College'}
                  </Text>
                </View>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.greetingTitle, { color: theme.navy }]}
              >
                {timeGreeting}, {account.name.split(' ')[0]}
              </Text>
              <View style={styles.weatherAcademicRow}>
                <Ionicons name="sunny" size={13} color="#F59E0B" />
                <Text
                  style={[
                    styles.weatherAcademicText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Clear Focus Forecast · {account.profileTitle}
                </Text>
              </View>
            </View>
          </SmoothPressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SmoothPressable
              onPress={() =>
                showMessage(
                  t.offline,
                  'OrasOras is operating in offline-first mode. All class schedules, academic requirements, study files, flashcards, and progress metrics are saved locally on your device.'
                )
              }
              accessibilityLabel="Connection and offline storage status indicator"
              style={[
                styles.statusPill,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(16, 185, 129, 0.16)'
                    : 'rgba(16, 185, 129, 0.12)',
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                },
              ]}
            >
              <View style={styles.statusPulseDot} />
              <View style={styles.statusTextCol}>
                <Text style={styles.statusTitle}>{t.offline}</Text>
                <Text style={[styles.statusSubtitle, { color: theme.textMuted }]}>
                  Local Storage
                </Text>
              </View>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => router.push('/settings' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Open Settings & Account"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.headerGearButton,
                {
                  backgroundColor: activeTheme.primary,
                  shadowColor: activeTheme.primary,
                },
              ]}
            >
              <View style={styles.headerGearInnerGlow}>
                <Ionicons name="settings-sharp" size={22} color="#FFFFFF" />
              </View>
            </SmoothPressable>
          </View>
        </View>

        {/* 2. Primary Aurora Hero Card: Next Class Countdown + Floating Academic Shapes */}
        <DepthCard
          variant="color"
          gradientColors={[activeTheme.primary, activeTheme.secondary]}
          style={styles.heroCard}
        >
          {/* Floating Decorative Shapes */}
          <View pointerEvents="none" style={styles.heroFloatCircle1} />
          <View pointerEvents="none" style={styles.heroFloatCircle2} />

          <View style={styles.heroTopRow}>
            <SmoothPressable
              onPress={() => setGlanceSummaryVisible(true)}
              accessibilityLabel="Open Student Glance Summary"
              style={styles.heroLivePill}
            >
              <View style={styles.heroPulseDot} />
              <Text style={styles.heroLiveText}>
                YOUR NEXT CLASS STARTS IN 25 MINUTES
              </Text>
            </SmoothPressable>

            <View style={styles.streakBadgeHero}>
              <Ionicons name="flame" size={14} color="#FCD34D" />
              <Text style={styles.streakBadgeHeroText}>
                {account.studyStreak}d Streak
              </Text>
            </View>
          </View>

          <View style={styles.heroMainBlock}>
            <Text style={styles.heroCourseTitle}>
              {nextClass?.subjectName || 'Mathematics & Calculus'}
            </Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.heroMetaText}>
                  {nextClass
                    ? `${nextClass.startTime} – ${nextClass.endTime}`
                    : '09:00 – 10:30'}
                </Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.heroMetaText}>
                  {nextClass?.roomOrLink || 'Room 304 · Science Wing'}
                </Text>
              </View>
            </View>
            <Text style={styles.heroInstructorText}>
              Instructor: {nextClass?.instructor || 'Prof. Elena Vance'}
            </Text>
          </View>

          <View style={styles.heroBottomBar}>
            <SmoothPressable
              onPress={() => router.push('/calendar' as Href)}
              style={styles.heroActionPrimary}
            >
              <Ionicons name="calendar" size={15} color={activeTheme.primary} />
              <Text
                style={[
                  styles.heroActionPrimaryText,
                  { color: activeTheme.primary },
                ]}
              >
                Open Smart Schedule
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => router.push('/(tabs)/chat' as Href)}
              style={styles.heroActionGlass}
            >
              <Ionicons name="sparkles" size={15} color="#FFFFFF" />
              <Text style={styles.heroActionGlassText}>Ask OrasOras AI</Text>
            </SmoothPressable>
          </View>
        </DepthCard>

        {/* 3. Smart Summary Cards (2x2 Dimensional Grid) */}
        <View style={styles.summaryGrid}>
          {/* Card 1: Classes Today */}
          <SmoothPressable
            onPress={() => router.push('/calendar' as Href)}
            style={styles.summaryHalf}
          >
            <DepthCard
              variant="mini"
              style={[
                styles.summaryCardInner,
                {
                  backgroundColor: theme.isDark ? 'rgba(30, 58, 138, 0.22)' : 'rgba(239, 246, 255, 0.95)',
                  borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(191, 219, 254, 0.9)',
                },
              ]}
            >
              <View style={styles.summaryTop}>
                <View style={[styles.glowIconContainer, { backgroundColor: 'rgba(59,130,246,0.18)', shadowColor: '#3B82F6' }]}>
                  <Ionicons name="calendar" size={18} color="#2563EB" />
                </View>
                <View style={[styles.countdownRingPill, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' }]}>
                  <Ionicons name="time" size={11} color="#2563EB" />
                  <Text style={[styles.countdownRingText, { color: '#2563EB' }]}>IN 25M</Text>
                </View>
              </View>

              <View style={styles.metricNumberRow}>
                <Text style={[styles.metricBigNumber, { color: theme.navy }]}>
                  {activeClassesToday.length || 3}
                </Text>
                <Text style={[styles.metricBigLabel, { color: theme.navy }]}>
                  Classes Today
                </Text>
              </View>

              <Text style={[styles.summarySubText, { color: theme.textSecondary }]} numberOfLines={1}>
                Next: {nextClass?.subjectName ? nextClass.subjectName.split(' ')[0] : 'Calculus'} at {nextClass?.startTime || '09:00'}
              </Text>
            </DepthCard>
          </SmoothPressable>

          {/* Card 2: Urgent Requirements */}
          <SmoothPressable
            onPress={() => router.push('/requirements' as Href)}
            style={styles.summaryHalf}
          >
            <DepthCard
              variant="mini"
              style={[
                styles.summaryCardInner,
                {
                  backgroundColor: theme.isDark ? 'rgba(120, 53, 15, 0.22)' : 'rgba(255, 251, 235, 0.95)',
                  borderColor: theme.isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(254, 215, 170, 0.9)',
                },
              ]}
            >
              <View style={styles.summaryTop}>
                <View style={[styles.glowIconContainer, { backgroundColor: 'rgba(245,158,11,0.18)', shadowColor: '#F59E0B' }]}>
                  <Ionicons name="alert-circle" size={18} color="#D97706" />
                </View>
                <View style={[styles.beaconDotWrap, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.35)' }]}>
                  <View style={styles.beaconDot} />
                  <Text style={[styles.beaconText, { color: '#B45309' }]}>ACTION</Text>
                </View>
              </View>

              <View style={styles.metricNumberRow}>
                <Text style={[styles.metricBigNumber, { color: '#D97706' }]}>
                  {dueSoonReqs.length || 1}
                </Text>
                <Text style={[styles.metricBigLabel, { color: theme.navy }]}>
                  {(dueSoonReqs.length || 1) === 1 ? 'Task Due Soon' : 'Tasks Due Soon'}
                </Text>
              </View>

              <Text style={[styles.summarySubText, { color: theme.textSecondary }]} numberOfLines={1}>
                {overdueReqs.length > 0 ? `${overdueReqs.length} overdue alert needs focus` : '1 requirement due soon'}
              </Text>
            </DepthCard>
          </SmoothPressable>

          {/* Card 3: Weekly Goal */}
          <SmoothPressable
            onPress={() => router.push('/(tabs)/progress' as Href)}
            style={styles.summaryHalf}
          >
            <DepthCard
              variant="mini"
              style={[
                styles.summaryCardInner,
                {
                  backgroundColor: theme.isDark ? 'rgba(6, 78, 59, 0.22)' : 'rgba(240, 253, 244, 0.95)',
                  borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(187, 247, 208, 0.9)',
                },
              ]}
            >
              <View style={styles.summaryTop}>
                <View style={[styles.glowIconContainer, { backgroundColor: 'rgba(16,185,129,0.18)', shadowColor: '#10B981' }]}>
                  <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
                </View>
                <View style={[styles.countdownRingPill, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)' }]}>
                  <Ionicons name="sparkles" size={10} color="#059669" />
                  <Text style={[styles.countdownRingText, { color: '#059669' }]}>
                    {weeklyGoalPct >= 100 ? 'Goal Crushed!' : `${weeklyGoalPct}% Track`}
                  </Text>
                </View>
              </View>

              <View style={styles.metricNumberRow}>
                <Text style={[styles.metricBigNumber, { color: '#059669' }]}>
                  {weeklyGoalPct}%
                </Text>
                <Text style={[styles.metricBigLabel, { color: theme.navy }]}>
                  Weekly Goal
                </Text>
              </View>

              <Text style={[styles.summarySubText, { color: theme.textSecondary }]} numberOfLines={1}>
                {weeklyMinutesStudied} of {account.weeklyGoalMinutes || 300}m logged
              </Text>
            </DepthCard>
          </SmoothPressable>

          {/* Card 4: Study Streak */}
          <SmoothPressable
            onPress={() => router.push('/(tabs)/study' as Href)}
            style={styles.summaryHalf}
          >
            <DepthCard
              variant="mini"
              style={[
                styles.summaryCardInner,
                {
                  backgroundColor: theme.isDark ? 'rgba(49, 46, 129, 0.24)' : 'rgba(245, 243, 255, 0.95)',
                  borderColor: theme.isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(221, 214, 254, 0.9)',
                },
              ]}
            >
              <View style={styles.summaryTop}>
                <View style={[styles.glowIconContainer, { backgroundColor: 'rgba(99,102,241,0.18)', shadowColor: '#6366F1' }]}>
                  <Ionicons name="flame" size={18} color="#6366F1" />
                </View>
                <View style={[styles.countdownRingPill, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }]}>
                  <Ionicons name="flash" size={10} color="#EF4444" />
                  <Text style={[styles.countdownRingText, { color: '#EF4444' }]}>
                    {account.studyStreak >= 7 ? 'ON FIRE!' : 'STREAK'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricNumberRow}>
                <Text style={[styles.metricBigNumber, { color: '#6366F1' }]}>
                  {account.studyStreak}d
                </Text>
                <Text style={[styles.metricBigLabel, { color: theme.navy }]}>
                  Study Streak
                </Text>
              </View>

              <Text style={[styles.summarySubText, { color: theme.textSecondary }]} numberOfLines={1}>
                Best record: {account.longestStreak}d · Mode: {account.studyMode}
              </Text>
            </DepthCard>
          </SmoothPressable>
        </View>

        {/* 4. Quick Actions Row */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.navy }]}>
              {t.quickActions}
            </Text>
            <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
              Fast study access
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionScroll}
          >
            {[
              {
                label: 'Add Class',
                icon: 'calendar' as const,
                color: '#3B82F6',
                href: '/calendar?action=new' as Href,
              },
              {
                label: 'Add Task',
                icon: 'checkbox' as const,
                color: '#10B981',
                href: '/requirements?action=new' as Href,
              },
              {
                label: 'Quick Notes',
                icon: 'create' as const,
                color: '#8B5CF6',
                href: '/calculator?tool=notes' as Href,
              },
              {
                label: 'Pomodoro',
                icon: 'timer' as const,
                color: '#F59E0B',
                href: '/(tabs)/study?mode=pomodoro' as Href,
              },
              {
                label: 'Take Quiz',
                icon: 'ribbon' as const,
                color: '#EC4899',
                href: '/quiz?action=create' as Href,
              },
              {
                label: 'Calculator',
                icon: 'calculator' as const,
                color: '#06B6D4',
                href: '/calculator?tool=calculator' as Href,
              },
            ].map((qa) => (
              <SmoothPressable
                key={qa.label}
                onPress={() => router.push(qa.href)}
                style={[
                  styles.quickActionCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.quickActionIconBubble,
                    {
                      backgroundColor: `${qa.color}15`,
                      borderColor: `${qa.color}30`,
                      shadowColor: qa.color,
                    },
                  ]}
                >
                  <Ionicons name={qa.icon} size={20} color={qa.color} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.quickActionLabel, { color: theme.navy }]}
                >
                  {qa.label}
                </Text>
              </SmoothPressable>
            ))}
          </ScrollView>
        </View>

        {/* 5. Continue Studying Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithDot}>
              <Ionicons name="play-circle" size={18} color={activeTheme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.navy }]}>
                {t.continueStudying}
              </Text>
            </View>
            <SmoothPressable onPress={() => router.push('/(tabs)/library' as Href)}>
              <Text style={[styles.seeAllText, { color: activeTheme.primary }]}>
                Study Library →
              </Text>
            </SmoothPressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.continueScroll}
          >
            {/* A. Continue Reading PDF / Material */}
            <SmoothPressable
              onPress={() => router.push('/(tabs)/library' as Href)}
              style={styles.continueCardPressable}
            >
              <DepthCard variant="mini" style={styles.continueCardElevated}>
                {/* Category Top Banner */}
                <View
                  style={[
                    styles.continueCardBanner,
                    { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderBottomColor: 'rgba(239, 68, 68, 0.2)' },
                  ]}
                >
                  <View style={styles.bannerBadgeRow}>
                    <Ionicons name="document-text" size={13} color="#EF4444" />
                    <Text style={[styles.bannerBadgeText, { color: '#EF4444' }]}>
                      MATHEMATICS · PDF
                    </Text>
                  </View>
                  <View style={[styles.continueMiniTag, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#EF4444' }}>OFFLINE</Text>
                  </View>
                </View>

                <View style={styles.continueCardBody}>
                  <Text
                    numberOfLines={1}
                    style={[styles.continueTitle, { color: theme.navy }]}
                  >
                    {account.uploadedFiles?.[0]?.title || 'Calculus Complete Syllabus'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.continueSub, { color: theme.textSecondary }]}
                  >
                    Page {account.uploadedFiles?.[0]?.lastReadPage || 4} of 32 · 15% read
                  </Text>

                  {/* Slim Progress Bar */}
                  <View style={[styles.progressBarTrack, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                    <View style={[styles.progressBarFill, { width: '15%', backgroundColor: '#EF4444' }]} />
                  </View>

                  <View style={styles.continueBottomRow}>
                    <View style={[styles.continuePillBtn, { backgroundColor: `${activeTheme.primary}18`, borderColor: `${activeTheme.primary}35` }]}>
                      <Text style={[styles.continuePillBtnText, { color: activeTheme.primary }]}>
                        Resume Reading
                      </Text>
                      <Ionicons name="arrow-forward" size={12} color={activeTheme.primary} />
                    </View>
                  </View>
                </View>
              </DepthCard>
            </SmoothPressable>

            {/* B. Continue Recall Flashcards */}
            <SmoothPressable
              onPress={() => router.push('/(tabs)/study' as Href)}
              style={styles.continueCardPressable}
            >
              <DepthCard variant="mini" style={styles.continueCardElevated}>
                {/* Category Top Banner */}
                <View
                  style={[
                    styles.continueCardBanner,
                    { backgroundColor: 'rgba(99, 102, 241, 0.12)', borderBottomColor: 'rgba(99, 102, 241, 0.2)' },
                  ]}
                >
                  <View style={styles.bannerBadgeRow}>
                    <Ionicons name="copy" size={13} color="#6366F1" />
                    <Text style={[styles.bannerBadgeText, { color: '#6366F1' }]}>
                      ACTIVE RECALL · FLASHCARDS
                    </Text>
                  </View>
                  <View style={[styles.continueMiniTag, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#6366F1' }}>SPACED</Text>
                  </View>
                </View>

                <View style={styles.continueCardBody}>
                  <Text
                    numberOfLines={1}
                    style={[styles.continueTitle, { color: theme.navy }]}
                  >
                    Calculus Derivatives Deck
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.continueSub, { color: theme.textSecondary }]}
                  >
                    12 of 40 cards reviewed · 30%
                  </Text>

                  {/* Slim Progress Bar */}
                  <View style={[styles.progressBarTrack, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                    <View style={[styles.progressBarFill, { width: '30%', backgroundColor: '#6366F1' }]} />
                  </View>

                  <View style={styles.continueBottomRow}>
                    <View style={[styles.continuePillBtn, { backgroundColor: 'rgba(99, 102, 241, 0.16)', borderColor: 'rgba(99, 102, 241, 0.35)' }]}>
                      <Text style={[styles.continuePillBtnText, { color: '#6366F1' }]}>
                        Flip Cards
                      </Text>
                      <Ionicons name="sparkles" size={12} color="#6366F1" />
                    </View>
                  </View>
                </View>
              </DepthCard>
            </SmoothPressable>

            {/* C. Continue Practice Quiz */}
            <SmoothPressable
              onPress={() => router.push('/quiz' as Href)}
              style={styles.continueCardPressable}
            >
              <DepthCard variant="mini" style={styles.continueCardElevated}>
                {/* Category Top Banner */}
                <View
                  style={[
                    styles.continueCardBanner,
                    { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderBottomColor: 'rgba(16, 185, 129, 0.2)' },
                  ]}
                >
                  <View style={styles.bannerBadgeRow}>
                    <Ionicons name="ribbon" size={13} color="#10B981" />
                    <Text style={[styles.bannerBadgeText, { color: '#10B981' }]}>
                      ADAPTIVE MASTERY QUIZ
                    </Text>
                  </View>
                  <View style={[styles.continueMiniTag, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#10B981' }}>READY</Text>
                  </View>
                </View>

                <View style={styles.continueCardBody}>
                  <Text
                    numberOfLines={1}
                    style={[styles.continueTitle, { color: theme.navy }]}
                  >
                    Mechanics & Forces Quiz
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.continueSub, { color: theme.textSecondary }]}
                  >
                    Physics · 8 of 10 problems done
                  </Text>

                  {/* Slim Progress Bar */}
                  <View style={[styles.progressBarTrack, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <View style={[styles.progressBarFill, { width: '80%', backgroundColor: '#10B981' }]} />
                  </View>

                  <View style={styles.continueBottomRow}>
                    <View style={[styles.continuePillBtn, { backgroundColor: 'rgba(16, 185, 129, 0.16)', borderColor: 'rgba(16, 185, 129, 0.35)' }]}>
                      <Text style={[styles.continuePillBtnText, { color: '#10B981' }]}>
                        Resume Quiz
                      </Text>
                      <Ionicons name="play" size={12} color="#10B981" />
                    </View>
                  </View>
                </View>
              </DepthCard>
            </SmoothPressable>
          </ScrollView>
        </View>

        {/* 5. Urgent & Upcoming Requirements Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithDot}>
              <Text style={[styles.sectionTitle, { color: theme.navy }]}>
                {t.upcomingDeadlines}
              </Text>
              {overdueReqs.length > 0 && (
                <View style={[styles.urgentBadge, { backgroundColor: theme.red }]}>
                  <Text style={styles.urgentBadgeText}>
                    {overdueReqs.length} Urgent
                  </Text>
                </View>
              )}
            </View>
            <SmoothPressable
              onPress={() => router.push('/requirements' as Href)}
            >
              <Text
                style={[styles.seeAllText, { color: activeTheme.primary }]}
              >
                {t.viewAllRequirements}
              </Text>
            </SmoothPressable>
          </View>

          <View style={styles.stackList}>
            {account.requirements.slice(0, 3).map((req) => {
              const isOverdue = !req.completed && req.dueDate < todayStr;
              const statusColor = req.completed
                ? '#10B981'
                : isOverdue || req.priority === 'Urgent'
                ? '#EF4444'
                : req.priority === 'Approaching'
                ? '#F59E0B'
                : '#3B82F6';

              const statusLabel = req.completed
                ? 'COMPLETED'
                : isOverdue
                ? 'OVERDUE'
                : req.priority === 'Urgent'
                ? 'URGENT'
                : req.priority === 'Approaching'
                ? 'DUE SOON'
                : 'UPCOMING';

              return (
                <DepthCard
                  key={req.id}
                  variant="mini"
                  style={[
                    styles.reqCard,
                    {
                      borderLeftWidth: 4,
                      borderLeftColor: statusColor,
                    },
                  ]}
                >
                  <View style={styles.reqRow}>
                    <SmoothPressable
                      onPress={() => void toggleRequirementComplete(req.id)}
                      accessibilityLabel={`Toggle ${req.title}`}
                      style={[
                        styles.checkCircle,
                        {
                          borderColor: statusColor,
                          backgroundColor: req.completed
                            ? '#10B981'
                            : 'transparent',
                        },
                      ]}
                    >
                      {req.completed && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </SmoothPressable>

                    <SmoothPressable
                      onPress={() => router.push('/requirements' as Href)}
                      style={styles.flex}
                    >
                      <View style={styles.reqTopMeta}>
                        <Text
                          style={[
                            styles.reqSubjectTag,
                            { color: statusColor },
                          ]}
                        >
                          {req.subjectName} · {req.taskType}
                        </Text>
                        <View
                          style={[
                            styles.reqStatusPill,
                            { backgroundColor: `${statusColor}18` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.reqStatusPillText,
                              { color: statusColor },
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.reqTitle,
                          {
                            color: theme.navy,
                            textDecorationLine: req.completed
                              ? 'line-through'
                              : 'none',
                          },
                        ]}
                      >
                        {req.title}
                      </Text>
                      <Text
                        style={[
                          styles.reqDueText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Due {req.dueDate === todayStr ? 'Today' : req.dueDate} at{' '}
                        {req.dueTime} ·{' '}
                        {req.checklist.filter((c) => c.done).length}/
                        {req.checklist.length} steps done
                      </Text>
                    </SmoothPressable>
                  </View>
                </DepthCard>
              );
            })}
          </View>
        </View>

        {/* 6. Today's Class Schedule */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.navy }]}>
              Today’s Class Schedule
            </Text>
            <SmoothPressable onPress={() => router.push('/calendar' as Href)}>
              <Text
                style={[styles.seeAllText, { color: activeTheme.primary }]}
              >
                Full Timetable
              </Text>
            </SmoothPressable>
          </View>

          <View style={styles.stackList}>
            {todaysClasses.map((cls) => (
              <SmoothPressable
                key={cls.id}
                onPress={() => router.push('/calendar' as Href)}
              >
                <DepthCard variant="mini" style={styles.scheduleRowCard}>
                  <View
                    style={[
                      styles.scheduleColorBar,
                      {
                        backgroundColor: cls.cancelled
                          ? theme.textMuted
                          : cls.color,
                      },
                    ]}
                  />
                  <View style={styles.scheduleTimeCol}>
                    <Text
                      style={[
                        styles.scheduleStartText,
                        { color: theme.navy },
                      ]}
                    >
                      {cls.startTime}
                    </Text>
                    <Text
                      style={[
                        styles.scheduleEndText,
                        { color: theme.textMuted },
                      ]}
                    >
                      {cls.endTime}
                    </Text>
                  </View>

                  <View style={styles.flex}>
                    <View style={styles.scheduleTitleRow}>
                      <Text
                        style={[
                          styles.scheduleCourseName,
                          {
                            color: theme.navy,
                            textDecorationLine: cls.cancelled
                              ? 'line-through'
                              : 'none',
                          },
                        ]}
                      >
                        {cls.subjectName}
                      </Text>
                      {cls.cancelled && (
                        <View
                          style={[
                            styles.cancelledPill,
                            { backgroundColor: 'rgba(239,68,68,0.14)' },
                          ]}
                        >
                          <Text style={styles.cancelledPillText}>
                            CANCELLED
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.scheduleSubMeta,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {cls.roomOrLink} · {cls.instructor}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={theme.textMuted}
                  />
                </DepthCard>
              </SmoothPressable>
            ))}
          </View>
        </View>

        {/* 7. Weekly Learning Goal & Recent Academic Activity */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.navy }]}>
            Weekly Goal & Recent Activity
          </Text>

          <DepthCard variant="card" style={styles.goalProgressCard}>
            <View style={styles.goalTopRow}>
              <View style={styles.goalLeftInfo}>
                <Icon3D name="trophy" bg="#10B981" boxSize={42} size={20} />
                <View>
                  <Text style={[styles.goalTitle, { color: theme.navy }]}>
                    Weekly Learning Goal
                  </Text>
                  <Text
                    style={[
                      styles.goalSub,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {weeklyMinutesStudied} / {account.weeklyGoalMinutes} mins
                    completed ({weeklyGoalPct}%)
                  </Text>
                </View>
              </View>
              <SmoothPressable
                onPress={() => router.push('/(tabs)/progress' as Href)}
                style={[
                  styles.goalAnalyticsBtn,
                  { backgroundColor: `${activeTheme.primary}15` },
                ]}
              >
                <Text
                  style={[
                    styles.goalAnalyticsBtnText,
                    { color: activeTheme.primary },
                  ]}
                >
                  Analytics
                </Text>
              </SmoothPressable>
            </View>

            <View
              style={[
                styles.progressTrack,
                { backgroundColor: theme.surface },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${weeklyGoalPct}%`,
                    backgroundColor: '#10B981',
                  },
                ]}
              />
            </View>

            {/* Recent Quiz & Study Log */}
            <View style={styles.recentActivityList}>
              {account.quizResults.slice(0, 2).map((qr) => (
                <View
                  key={qr.id}
                  style={[
                    styles.activityItemRow,
                    { borderTopColor: theme.border },
                  ]}
                >
                  <Ionicons
                    name="ribbon"
                    size={16}
                    color={qr.scorePercent >= 85 ? '#10B981' : '#3B82F6'}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.activityItemText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Scored{' '}
                    <Text style={{ fontWeight: '800', color: theme.navy }}>
                      {qr.scorePercent}%
                    </Text>{' '}
                    on {qr.moduleTitle}
                  </Text>
                </View>
              ))}
            </View>
          </DepthCard>
        </View>

        {/* 8. Daily Motivational Quote Card */}
        <DepthCard variant="glass" style={styles.quoteCard}>
          <View style={styles.quoteRow}>
            <Icon3D
              name="sparkles"
              bg={activeTheme.secondary}
              boxSize={38}
              size={18}
            />
            <View style={styles.flex}>
              <Text style={[styles.quoteText, { color: theme.navy }]}>
                “{quote.quote}”
              </Text>
              <Text style={[styles.quoteAuthor, { color: theme.textMuted }]}>
                — {quote.author}
              </Text>
            </View>
          </View>
        </DepthCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  profileGreetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  greetCol: {
    flex: 1,
    gap: 2,
  },
  dateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  levelPill: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  levelPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  greetingTitle: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  weatherAcademicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  weatherAcademicText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  headerGearButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  headerGearInnerGlow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  langToggleText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusTextCol: {
    gap: 1,
  },
  statusTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  statusSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  heroCard: {
    padding: 20,
    gap: 14,
    position: 'relative',
  },
  heroFloatCircle1: {
    position: 'absolute',
    right: -35,
    top: -35,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
  },
  heroFloatCircle2: {
    position: 'absolute',
    right: 45,
    bottom: -45,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  heroLiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakBadgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.26)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  streakBadgeHeroText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  heroMainBlock: {
    gap: 5,
  },
  heroCourseTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 2,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroMetaText: {
    color: 'rgba(255, 255, 255, 0.94)',
    fontSize: 12.5,
    fontWeight: '700',
  },
  heroInstructorText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12,
    fontWeight: '600',
  },
  heroBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  heroActionPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  heroActionPrimaryText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  heroActionGlass: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  heroActionGlassText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryHalf: {
    width: '48%',
    flexGrow: 1,
  },
  summaryCardInner: {
    gap: 8,
    minHeight: 126,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glowIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  countdownRingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  countdownRingText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  beaconDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  beaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  beaconText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  metricNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  metricBigNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  metricBigLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  summaryStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  summaryStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  summaryBigText: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  summarySubText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  quickActionScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  quickActionCard: {
    width: 90,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  quickActionIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionPill: {
    width: 86,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 7,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  continueScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  continueCardPressable: {
    width: 236,
  },
  continueCardElevated: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 0,
    minHeight: 148,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  continueCardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bannerBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  continueMiniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  continueCardBody: {
    padding: 12,
    gap: 6,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  continuePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  continuePillBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  continueCard: {
    padding: 14,
    gap: 6,
    minHeight: 128,
    justifyContent: 'space-between',
  },
  continueCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continueIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueTypePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  continueTypeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  continueTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  continueSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  continueBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  continueActionText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  stackList: {
    gap: 10,
  },
  reqCard: {
    padding: 13,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reqSubjectTag: {
    fontSize: 11,
    fontWeight: '800',
  },
  reqStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reqStatusPillText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  reqTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  reqDueText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  scheduleRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  scheduleColorBar: {
    width: 4,
    height: 38,
    borderRadius: 2,
  },
  scheduleTimeCol: {
    width: 48,
  },
  scheduleStartText: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  scheduleEndText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  scheduleCourseName: {
    fontSize: 14,
    fontWeight: '800',
  },
  cancelledPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cancelledPillText: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '900',
  },
  scheduleSubMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  goalProgressCard: {
    gap: 12,
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  goalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  goalAnalyticsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  goalAnalyticsBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  recentActivityList: {
    gap: 8,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  activityItemText: {
    fontSize: 12,
    flex: 1,
  },
  quoteCard: {
    padding: 15,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quoteText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 18,
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
});
