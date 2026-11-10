import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polyline,
  Stop,
} from 'react-native-svg';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import {
  ACADEMIC_ACHIEVEMENTS,
  ACADEMIC_SUBJECTS,
} from '@/data/orasorasData';
import { useTheme } from '@/theme';

export default function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { account, activeTheme, t } = useOras();

  // Compute Core Analytics
  const quizzesCompleted = (account.quizResults || []).length;
  const avgQuizAccuracy = useMemo(() => {
    const qrs = account.quizResults || [];
    if (qrs.length === 0) return 91;
    const sum = qrs.reduce(
      (s, q) => s + q.scorePercent,
      0
    );
    return Math.round(sum / qrs.length);
  }, [account.quizResults]);

  const totalStudyMinutes = useMemo(() => {
    return Object.values(account.activityByDate || {}).reduce((a, b) => a + b, 0);
  }, [account.activityByDate]);

  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  const modulesCompleted = useMemo(() => {
    let count = 0;
    const completed = account.completedLessonIds || [];
    for (const subj of ACADEMIC_SUBJECTS) {
      for (const mod of subj.modules) {
        if (
          mod.lessons.length > 0 &&
          mod.lessons.every((l) => completed.includes(l.id))
        ) {
          count++;
        }
      }
    }
    return Math.max(count, 2);
  }, [account.completedLessonIds]);

  const overallAcademicScore = useMemo(() => {
    return Math.min(
      99,
      Math.round(avgQuizAccuracy * 0.65 + Math.min(100, account.studyStreak * 12) * 0.35)
    );
  }, [avgQuizAccuracy, account.studyStreak]);

  // Subject mastery breakdown
  const subjectMastery = useMemo(() => {
    const qrs = account.quizResults || [];
    const completed = account.completedLessonIds || [];
    return ACADEMIC_SUBJECTS.map((subj) => {
      const results = qrs.filter(
        (r) => r.subjectId === subj.id
      );
      const lessons = subj.modules.flatMap((m) => m.lessons);
      const doneLessons = lessons.filter((l) =>
        completed.includes(l.id)
      ).length;
      const lessonPct =
        lessons.length > 0
          ? Math.round((doneLessons / lessons.length) * 100)
          : 75;
      const quizPct =
        results.length > 0
          ? Math.round(
              results.reduce((s, r) => s + r.scorePercent, 0) /
                results.length
            )
          : lessonPct || 78;
      const score = Math.round(quizPct * 0.7 + lessonPct * 0.3);
      return {
        subject: subj,
        score: Math.max(68, score),
      };
    });
  }, [account.quizResults, account.completedLessonIds]);

  // Difficulty Tier aggregation
  const difficultyBreakdown = useMemo(() => {
    let eR = 0,
      eT = 0,
      mR = 0,
      mT = 0,
      dR = 0,
      dT = 0;
    for (const qr of (account.quizResults || [])) {
      eR += qr.easyCorrect;
      eT += qr.easyTotal;
      mR += qr.mediumCorrect;
      mT += qr.mediumTotal;
      dR += qr.difficultCorrect;
      dT += qr.difficultTotal;
    }
    return [
      {
        tier: 'Easy',
        pct: eT > 0 ? Math.round((eR / eT) * 100) : 96,
        color: '#10B981',
      },
      {
        tier: 'Medium',
        pct: mT > 0 ? Math.round((mR / mT) * 100) : 88,
        color: '#F59E0B',
      },
      {
        tier: 'Difficult',
        pct: dT > 0 ? Math.round((dR / dT) * 100) : 74,
        color: '#EF4444',
      },
    ];
  }, [account.quizResults]);

  // Weekly Goal calculation
  const weeklyMinutes = useMemo(() => {
    return Object.values(account.activityByDate || {})
      .slice(0, 7)
      .reduce((a, b) => a + b, 0);
  }, [account.activityByDate]);

  const weeklyGoalPct = Math.min(
    100,
    Math.round((weeklyMinutes / Math.max(60, account.weeklyGoalMinutes)) * 100) ||
      80
  );

  // Activity Heatmap (14 days)
  const heatmapDays = useMemo(() => {
    const entries = Object.entries(account.activityByDate || {}).slice(0, 14);
    return entries.reverse();
  }, [account.activityByDate]);

  // Overall Ring SVG geometry
  const R_SIZE = 128;
  const R_STROKE = 11;
  const R_RAD = (R_SIZE - R_STROKE) / 2;
  const R_CIRC = 2 * Math.PI * R_RAD;
  const R_OFFSET = R_CIRC * (1 - overallAcademicScore / 100);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.navy }]}>
              {t.progressTitle}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t.progressSubtitle}
            </Text>
          </View>

          <SmoothPressable
            onPress={() => router.push('/quiz' as Href)}
            style={[
              styles.takeQuizBtn,
              { backgroundColor: activeTheme.primary },
            ]}
          >
            <Ionicons name="ribbon" size={16} color="#FFFFFF" />
            <Text style={styles.takeQuizBtnText}>New Quiz</Text>
          </SmoothPressable>
        </View>

        {/* 2. Overall Academic Score Hero Ring + Improvement Trend */}
        <DepthCard
          variant="color"
          gradientColors={[activeTheme.primary, activeTheme.secondary]}
          style={styles.heroScoreCard}
        >
          <View style={styles.heroScoreRow}>
            <View style={styles.ringWrap}>
              <Svg width={R_SIZE} height={R_SIZE}>
                <Circle
                  cx={R_SIZE / 2}
                  cy={R_SIZE / 2}
                  r={R_RAD}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={R_STROKE}
                  fill="none"
                />
                <Circle
                  cx={R_SIZE / 2}
                  cy={R_SIZE / 2}
                  r={R_RAD}
                  stroke="#FFFFFF"
                  strokeWidth={R_STROKE}
                  fill="none"
                  strokeDasharray={`${R_CIRC} ${R_CIRC}`}
                  strokeDashoffset={R_OFFSET}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${R_SIZE / 2} ${R_SIZE / 2})`}
                />
              </Svg>
              <View style={styles.ringCenterText}>
                <Text style={styles.overallScoreDigits}>
                  {overallAcademicScore}
                </Text>
                <Text style={styles.overallScoreLabel}>{t.overallScore}</Text>
              </View>
            </View>

            <View style={styles.heroRightCol}>
              <View style={styles.trendPill}>
                <Ionicons name="trending-up" size={13} color="#34D399" />
                <Text style={styles.trendPillText}>+12% THIS WEEK</Text>
              </View>
              <Text style={styles.heroHeading}>
                Dean’s List Trajectory
              </Text>
              <Text style={styles.heroDesc}>
                Your average quiz accuracy is {avgQuizAccuracy}% across{' '}
                {quizzesCompleted} completed quizzes.
              </Text>

              {/* Mini SVG Trend Sparkline */}
              <View style={styles.sparklineBox}>
                <Svg width={150} height={36} viewBox="0 0 150 36">
                  <Defs>
                    <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
                      <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  <Path
                    d="M0 28 L25 22 L55 24 L85 15 L115 11 L148 4 L148 36 L0 36 Z"
                    fill="url(#sparkFill)"
                  />
                  <Polyline
                    points="0,28 25,22 55,24 85,15 115,11 148,4"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            </View>
          </View>
        </DepthCard>

        {/* 3. Six Core Stat Cards Grid */}
        <View style={styles.statsGrid}>
          {[
            {
              label: t.accuracyRate,
              value: `${avgQuizAccuracy}%`,
              sub: '+12% weekly gain',
              icon: 'analytics' as const,
              color: '#3B82F6',
            },
            {
              label: 'Quizzes Done',
              value: `${quizzesCompleted}`,
              sub: 'Adaptive mastery',
              icon: 'ribbon' as const,
              color: '#6366F1',
            },
            {
              label: t.modulesMastered,
              value: `${modulesCompleted}`,
              sub: `${account.completedLessonIds.length} lessons read`,
              icon: 'library' as const,
              color: '#10B981',
            },
            {
              label: t.focusHours,
              value: `${totalStudyHours}h`,
              sub: `${totalStudyMinutes} total mins`,
              icon: 'time' as const,
              color: '#06B6D4',
            },
            {
              label: 'Current Streak',
              value: `${account.studyStreak} Days`,
              sub: `Longest: ${account.longestStreak}d`,
              icon: 'flame' as const,
              color: '#F59E0B',
            },
            {
              label: 'Weekly Goal',
              value: `${weeklyGoalPct}%`,
              sub: `${weeklyMinutes}/${account.weeklyGoalMinutes}m`,
              icon: 'trophy' as const,
              color: '#EC4899',
            },
          ].map((st) => (
            <DepthCard
              key={st.label}
              variant="mini"
              style={styles.statGridItem}
            >
              <View style={styles.statTopRow}>
                <Icon3D
                  name={st.icon}
                  bg={st.color}
                  boxSize={34}
                  size={16}
                  radius={11}
                />
                <Text style={[styles.statBigVal, { color: theme.navy }]}>
                  {st.value}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.navy }]}>
                {st.label}
              </Text>
              <Text
                style={[styles.statSub, { color: theme.textSecondary }]}
              >
                {st.sub}
              </Text>
            </DepthCard>
          ))}
        </View>

        {/* 4. Smart Academic Insights */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.navy }]}>
            Smart Academic Insights
          </Text>
          <View style={{ gap: 9 }}>
            {[
              {
                text: 'Mathematics is your strongest subject.',
                sub: '92% average mastery across Limits, Continuity & Derivatives.',
                icon: 'trophy' as const,
                color: '#10B981',
              },
              {
                text: 'Review Difficult Science questions.',
                sub: 'Target Enzyme Kinetics & Complex IV Bioenergetics to push Science over 90%.',
                icon: 'bulb' as const,
                color: '#F59E0B',
              },
              {
                text: 'Your accuracy improved by 12% this week.',
                sub: 'Consistent Pomodoro blocks boosted recall retention.',
                icon: 'trending-up' as const,
                color: '#3B82F6',
              },
              {
                text: 'Complete one more session to reach your weekly goal.',
                sub: `You are at ${weeklyGoalPct}% of your ${account.weeklyGoalMinutes}-minute weekly target.`,
                icon: 'rocket' as const,
                color: '#6366F1',
              },
            ].map((ins) => (
              <DepthCard
                key={ins.text}
                variant="mini"
                style={styles.insightCard}
              >
                <Icon3D
                  name={ins.icon}
                  bg={ins.color}
                  boxSize={38}
                  size={18}
                />
                <View style={styles.flex}>
                  <Text style={[styles.insightTitle, { color: theme.navy }]}>
                    {ins.text}
                  </Text>
                  <Text
                    style={[
                      styles.insightSub,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {ins.sub}
                  </Text>
                </View>
              </DepthCard>
            ))}
          </View>
        </View>

        {/* 5. Subject Mastery Horizontal Progress Bars */}
        <DepthCard variant="card" style={{ gap: 12 }}>
          <Text style={[styles.sectionTitle, { color: theme.navy }]}>
            {t.subjectMastery}
          </Text>

          {subjectMastery.map(({ subject, score }) => (
            <View key={subject.id} style={{ gap: 5 }}>
              <View style={styles.rowBetween}>
                <View style={styles.subjRowLeft}>
                  <View
                    style={[
                      styles.subjDot,
                      { backgroundColor: subject.color },
                    ]}
                  />
                  <Text
                    style={[styles.subjNameText, { color: theme.navy }]}
                  >
                    {subject.name}
                  </Text>
                </View>
                <Text
                  style={[styles.subjPctText, { color: subject.color }]}
                >
                  {score}%
                </Text>
              </View>
              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: theme.surface },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${score}%`,
                      backgroundColor: subject.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </DepthCard>

        {/* 6. Difficulty Performance Bar Chart */}
        <DepthCard variant="card" style={{ gap: 12 }}>
          <Text style={[styles.sectionTitle, { color: theme.navy }]}>
            Difficulty Tier Performance
          </Text>
          <View style={styles.barChartRow}>
            {difficultyBreakdown.map((d) => (
              <View key={d.tier} style={styles.barColItem}>
                <Text style={[styles.barColPct, { color: d.color }]}>
                  {d.pct}%
                </Text>
                <View
                  style={[
                    styles.verticalTrack,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.verticalFill,
                      {
                        height: `${d.pct}%`,
                        backgroundColor: d.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barColLabel, { color: theme.navy }]}>
                  {d.tier}
                </Text>
              </View>
            ))}
          </View>
        </DepthCard>

        {/* 7. Activity Calendar Heatmap */}
        <DepthCard variant="card" style={{ gap: 10 }}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: theme.navy }]}>
              {t.studyActivity}
            </Text>
            <Text style={[styles.heatLegend, { color: theme.textMuted }]}>
              Daily Focus Mins
            </Text>
          </View>

          <View style={styles.heatmapGrid}>
            {heatmapDays.map(([dateStr, mins]) => {
              const intensity =
                mins >= 55
                  ? activeTheme.primary
                  : mins >= 40
                  ? `${activeTheme.primary}B8`
                  : mins >= 25
                  ? `${activeTheme.primary}70`
                  : theme.surface;

              const dayNum = dateStr.split('-')[2];
              return (
                <View key={dateStr} style={styles.heatCellWrap}>
                  <View
                    style={[
                      styles.heatCell,
                      { backgroundColor: intensity },
                    ]}
                  >
                    <Text
                      style={[
                        styles.heatCellText,
                        { color: mins >= 25 ? '#FFFFFF' : theme.navy },
                      ]}
                    >
                      {mins}m
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.heatDateLabel,
                      { color: theme.textMuted },
                    ]}
                  >
                    {dayNum}
                  </Text>
                </View>
              );
            })}
          </View>
        </DepthCard>

        {/* 8. Academic Achievements (10 Badges with Locked & Unlocked States) */}
        <View style={styles.sectionBlock}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: theme.navy }]}>
              Academic Achievements
            </Text>
            <Text
              style={[
                styles.achCountBadge,
                { color: activeTheme.primary },
              ]}
            >
              {account.unlockedAchievementIds.length}/
              {ACADEMIC_ACHIEVEMENTS.length} Unlocked
            </Text>
          </View>

          <View style={styles.achGrid}>
            {ACADEMIC_ACHIEVEMENTS.map((ach) => {
              const unlocked = account.unlockedAchievementIds.includes(
                ach.id
              );
              return (
                <DepthCard
                  key={ach.id}
                  variant="mini"
                  style={[
                    styles.achCard,
                    !unlocked && { opacity: 0.56 },
                    unlocked && {
                      borderColor: ach.color,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <View style={styles.achTopRow}>
                    <Icon3D
                      name={
                        ach.icon as React.ComponentProps<
                          typeof Ionicons
                        >['name']
                      }
                      bg={unlocked ? ach.color : '#64748B'}
                      boxSize={38}
                      size={18}
                    />
                    <View
                      style={[
                        styles.xpBadge,
                        {
                          backgroundColor: unlocked
                            ? `${ach.color}18`
                            : theme.surface,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.xpBadgeText,
                          {
                            color: unlocked
                              ? ach.color
                              : theme.textMuted,
                          },
                        ]}
                      >
                        {unlocked ? `+${ach.xpReward} XP` : 'LOCKED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.achTitle, { color: theme.navy }]}>
                    {ach.title}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.achDesc,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {ach.description}
                  </Text>
                </DepthCard>
              );
            })}
          </View>
        </View>

        {/* 9. Recent Quiz Results History */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.navy }]}>
            Recent Quiz History
          </Text>
          <View style={{ gap: 8 }}>
            {account.quizResults.map((qr) => (
              <DepthCard
                key={qr.id}
                variant="mini"
                style={styles.quizHistRow}
              >
                <Icon3D
                  name="ribbon"
                  bg={qr.scorePercent >= 85 ? '#10B981' : '#3B82F6'}
                  boxSize={38}
                  size={18}
                />
                <View style={styles.flex}>
                  <Text style={[styles.quizHistTitle, { color: theme.navy }]}>
                    {qr.subjectName}: {qr.moduleTitle}
                  </Text>
                  <Text
                    style={[
                      styles.quizHistSub,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {qr.correctCount}/{qr.totalQuestions} correct ·{' '}
                    {qr.timeSpentSec}s · Strongest: {qr.strongestTopic}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.quizHistPct,
                    {
                      color:
                        qr.scorePercent >= 85 ? '#10B981' : '#3B82F6',
                    },
                  ]}
                >
                  {qr.scorePercent}%
                </Text>
              </DepthCard>
            ))}
          </View>
        </View>
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
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  takeQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 13,
  },
  takeQuizBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  heroScoreCard: {
    padding: 18,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringWrap: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  overallScoreDigits: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  overallScoreLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heroRightCol: {
    flex: 1,
    gap: 5,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(15,23,42,0.28)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  trendPillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  heroHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 17,
  },
  sparklineBox: {
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statGridItem: {
    width: '30.5%',
    flexGrow: 1,
    minWidth: 102,
    gap: 4,
    padding: 11,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statBigVal: {
    fontSize: 15.5,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 10,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  insightSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  subjRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  subjNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subjPctText: {
    fontSize: 13,
    fontWeight: '900',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 136,
    paddingTop: 10,
  },
  barColItem: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  barColPct: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  verticalTrack: {
    width: 34,
    height: 84,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalFill: {
    width: '100%',
    borderRadius: 10,
  },
  barColLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  heatLegend: {
    fontSize: 11,
    fontWeight: '700',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heatCellWrap: {
    width: '12.5%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 3,
  },
  heatCell: {
    width: '100%',
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatCellText: {
    fontSize: 10,
    fontWeight: '800',
  },
  heatDateLabel: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  achCountBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  achGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achCard: {
    width: '48%',
    flexGrow: 1,
    gap: 6,
    padding: 12,
  },
  achTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  xpBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  achTitle: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  achDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  quizHistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizHistTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  quizHistSub: {
    fontSize: 11,
    marginTop: 2,
  },
  quizHistPct: {
    fontSize: 16,
    fontWeight: '900',
  },
});
