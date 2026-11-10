import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AnimeAvatar } from '@/components/AnimeAvatar';
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
    language,
    t,
    setLanguage,
    setControlCenterVisible,
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
            <AnimeAvatar
              config={account.useCustomAvatar ? account.customAvatar : undefined}
              presetId={account.presetAvatarId}
              size={52}
              bgColors={[activeTheme.primary, activeTheme.secondary]}
            />
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SmoothPressable
              onPress={() => setControlCenterVisible(true)}
              accessibilityLabel="Open Control Center"
              style={[
                styles.langToggleBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: `${activeTheme.primary}40`,
                },
              ]}
            >
              <Ionicons name="options-outline" size={13} color={activeTheme.primary} />
            </SmoothPressable>

            <SmoothPressable
              onPress={() => void setLanguage(language === 'en' ? 'fil' : 'en')}
              accessibilityLabel="Switch application language"
              style={[
                styles.langToggleBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: `${activeTheme.primary}40`,
                },
              ]}
            >
              <Ionicons name="globe-outline" size={13} color={activeTheme.primary} />
              <Text style={[styles.langToggleText, { color: activeTheme.primary }]}>
                {language === 'en' ? 'EN' : 'FIL'}
              </Text>
            </SmoothPressable>

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
          <SmoothPressable
            onPress={() => router.push('/calendar' as Href)}
            style={styles.summaryHalf}
          >
            <DepthCard variant="mini" style={styles.summaryCardInner}>
              <View style={styles.summaryTop}>
                <Icon3D name="calendar" bg="#3B82F6" boxSize={36} size={17} />
                <View
                  style={[
                    styles.summaryStatusChip,
                    { backgroundColor: 'rgba(59,130,246,0.12)' },
                  ]}
                >
                  <Text style={[styles.summaryStatusText, { color: '#3B82F6' }]}>
                    TODAY
                  </Text>
                </View>
              </View>
              <Text style={[styles.summaryBigText, { color: theme.navy }]}>
                {activeClassesToday.length || 3} classes today
              </Text>
              <Text
                style={[styles.summarySubText, { color: theme.textSecondary }]}
              >
                Next class starts in 25 minutes
              </Text>
            </DepthCard>
          </SmoothPressable>

          <SmoothPressable
            onPress={() => router.push('/requirements' as Href)}
            style={styles.summaryHalf}
          >
            <DepthCard variant="mini" style={styles.summaryCardInner}>
              <View style={styles.summaryTop}>
                <Icon3D
                  name="document-text"
                  bg="#F59E0B"
                  boxSize={36}
                  size={17}
                />
                <View
                  style={[
                    styles.summaryStatusChip,
                    { backgroundColor: 'rgba(245,158,11,0.15)' },
                  ]}
                >
                  <Text style={[styles.summaryStatusText, { color: '#D97706' }]}>
                    DEADLINES
                  </Text>
                </View>
              </View>
              <Text style={[styles.summaryBigText, { color: theme.navy }]}>
                {dueSoonReqs.length || 2} requirements due soon
              </Text>
              <Text
                style={[styles.summarySubText, { color: theme.textSecondary }]}
              >
                {overdueReqs.length} urgent / overdue alert
              </Text>
            </DepthCard>
          </SmoothPressable>

          <SmoothPressable
            onPress={() => router.push('/(tabs)/progress' as Href)}
            style={styles.summaryHalf}
          >
            <DepthCard variant="mini" style={styles.summaryCardInner}>
              <View style={styles.summaryTop}>
                <Icon3D
                  name="checkmark-done-circle"
                  bg="#10B981"
                  boxSize={36}
                  size={17}
                />
                <View
                  style={[
                    styles.summaryStatusChip,
                    { backgroundColor: 'rgba(16,185,129,0.14)' },
                  ]}
                >
                  <Text style={[styles.summaryStatusText, { color: '#059669' }]}>
                    {weeklyGoalPct}% GOAL
                  </Text>
                </View>
              </View>
              <Text style={[styles.summaryBigText, { color: theme.navy }]}>
                {weeklyGoalPct}% of weekly goal
              </Text>
              <Text
                style={[styles.summarySubText, { color: theme.textSecondary }]}
              >
                You completed {weeklyGoalPct}% of this week’s goal
              </Text>
            </DepthCard>
          </SmoothPressable>

          <SmoothPressable
            onPress={() => router.push('/(tabs)/study' as Href)}
            style={styles.summaryHalf}
          >
            <DepthCard variant="mini" style={styles.summaryCardInner}>
              <View style={styles.summaryTop}>
                <Icon3D name="flame" bg="#6366F1" boxSize={36} size={17} />
                <View
                  style={[
                    styles.summaryStatusChip,
                    { backgroundColor: 'rgba(99,102,241,0.14)' },
                  ]}
                >
                  <Text style={[styles.summaryStatusText, { color: '#6366F1' }]}>
                    STREAK
                  </Text>
                </View>
              </View>
              <Text style={[styles.summaryBigText, { color: theme.navy }]}>
                {account.studyStreak}-Day Study Streak
              </Text>
              <Text
                style={[styles.summarySubText, { color: theme.textSecondary }]}
              >
                Mode: {account.studyMode} · Best {account.longestStreak}d
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
                label: t.actionAddSchedule,
                icon: 'calendar' as const,
                color: '#3B82F6',
                href: '/calendar?action=new' as Href,
              },
              {
                label: t.actionAddRequirement,
                icon: 'checkbox' as const,
                color: '#10B981',
                href: '/requirements?action=new' as Href,
              },
              {
                label: t.notesTab,
                icon: 'create' as const,
                color: '#8B5CF6',
                href: '/calculator?tool=notes' as Href,
              },
              {
                label: t.actionStudyFocus,
                icon: 'timer' as const,
                color: '#F59E0B',
                href: '/(tabs)/study?mode=pomodoro' as Href,
              },
              {
                label: t.actionTakeQuiz,
                icon: 'ribbon' as const,
                color: '#EC4899',
                href: '/quiz?action=create' as Href,
              },
              {
                label: t.actionCalculator,
                icon: 'calculator' as const,
                color: '#06B6D4',
                href: '/calculator?tool=calculator' as Href,
              },
            ].map((qa) => (
              <SmoothPressable
                key={qa.label}
                onPress={() => router.push(qa.href)}
                style={[
                  styles.quickActionPill,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Icon3D
                  name={qa.icon}
                  bg={qa.color}
                  boxSize={40}
                  size={19}
                  radius={14}
                />
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
                Study Library
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
              <DepthCard variant="mini" style={styles.continueCard}>
                <View style={styles.continueCardTop}>
                  <View
                    style={[
                      styles.continueIconWrap,
                      { backgroundColor: 'rgba(239, 68, 68, 0.14)' },
                    ]}
                  >
                    <Ionicons name="document-text" size={19} color="#EF4444" />
                  </View>
                  <View
                    style={[
                      styles.continueTypePill,
                      { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                    ]}
                  >
                    <Text style={[styles.continueTypeText, { color: '#EF4444' }]}>
                      PDF MATERIAL
                    </Text>
                  </View>
                </View>
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
                  Mathematics · Page {account.uploadedFiles?.[0]?.lastReadPage || 1}
                </Text>
                <View style={styles.continueBottomRow}>
                  <Text
                    style={[
                      styles.continueActionText,
                      { color: activeTheme.primary },
                    ]}
                  >
                    {t.resumeReading}
                  </Text>
                </View>
              </DepthCard>
            </SmoothPressable>

            {/* B. Continue Recall Flashcards */}
            <SmoothPressable
              onPress={() => router.push('/(tabs)/study' as Href)}
              style={styles.continueCardPressable}
            >
              <DepthCard variant="mini" style={styles.continueCard}>
                <View style={styles.continueCardTop}>
                  <View
                    style={[
                      styles.continueIconWrap,
                      { backgroundColor: 'rgba(99, 102, 241, 0.14)' },
                    ]}
                  >
                    <Ionicons name="copy" size={19} color="#6366F1" />
                  </View>
                  <View
                    style={[
                      styles.continueTypePill,
                      { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
                    ]}
                  >
                    <Text style={[styles.continueTypeText, { color: '#6366F1' }]}>
                      FLASHCARDS
                    </Text>
                  </View>
                </View>
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
                  Mathematics · Active recall drills
                </Text>
                <View style={styles.continueBottomRow}>
                  <Text
                    style={[
                      styles.continueActionText,
                      { color: activeTheme.primary },
                    ]}
                  >
                    Flip Cards →
                  </Text>
                </View>
              </DepthCard>
            </SmoothPressable>

            {/* C. Continue Practice Quiz */}
            <SmoothPressable
              onPress={() => router.push('/quiz' as Href)}
              style={styles.continueCardPressable}
            >
              <DepthCard variant="mini" style={styles.continueCard}>
                <View style={styles.continueCardTop}>
                  <View
                    style={[
                      styles.continueIconWrap,
                      { backgroundColor: 'rgba(16, 185, 129, 0.14)' },
                    ]}
                  >
                    <Ionicons name="ribbon" size={19} color="#10B981" />
                  </View>
                  <View
                    style={[
                      styles.continueTypePill,
                      { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                    ]}
                  >
                    <Text style={[styles.continueTypeText, { color: '#10B981' }]}>
                      ADAPTIVE QUIZ
                    </Text>
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.continueTitle, { color: theme.navy }]}
                >
                  Science Cellular Energy
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.continueSub, { color: theme.textSecondary }]}
                >
                  Biology · 5 adaptive questions
                </Text>
                <View style={styles.continueBottomRow}>
                  <Text
                    style={[
                      styles.continueActionText,
                      { color: activeTheme.primary },
                    ]}
                  >
                    Practice Now →
                  </Text>
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
    gap: 7,
    minHeight: 114,
    justifyContent: 'space-between',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 11.5,
    lineHeight: 15,
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
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  continueScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  continueCardPressable: {
    width: 220,
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
