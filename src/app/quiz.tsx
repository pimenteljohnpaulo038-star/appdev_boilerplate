import { Ionicons } from '@expo/vector-icons';
import {
  useLocalSearchParams,
  useRouter,
  type Href,
} from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import {
  ACADEMIC_SUBJECTS,
  type QuizQuestion,
  type QuizResultRecord,
} from '@/data/orasorasData';
import { useTheme } from '@/theme';

type QuizStage = 'setup' | 'active' | 'results' | 'review';

const DIFFICULTY_ORDER: Record<QuizQuestion['difficulty'], number> = {
  Easy: 1,
  Medium: 2,
  Difficult: 3,
};

export default function QuizScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    subjectId?: string;
    moduleId?: string;
  }>();
  const { activeTheme, recordQuizResult } = useOras();

  // Stage 1: Setup state
  const [stage, setStage] = useState<QuizStage>('setup');
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    params.subjectId || 'math'
  );
  const currentSubject = useMemo(
    () =>
      ACADEMIC_SUBJECTS.find((s) => s.id === selectedSubjectId) ??
      ACADEMIC_SUBJECTS[0],
    [selectedSubjectId]
  );

  const [selectedModuleId, setSelectedModuleId] = useState(
    params.moduleId || currentSubject.modules[0]?.id || 'math-mod-1'
  );
  const currentModule = useMemo(
    () =>
      currentSubject.modules.find((m) => m.id === selectedModuleId) ??
      currentSubject.modules[0],
    [currentSubject, selectedModuleId]
  );

  const [quizLength, setQuizLength] = useState<number>(5);

  // Stage 2: Active Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);

  // Stage 3: Final Result record
  const [finalResult, setFinalResult] = useState<QuizResultRecord | null>(null);

  // Hardware back button support for Android
  useEffect(() => {
    const onBackPress = () => {
      if (stage === 'review') {
        setStage('results');
        return true;
      }
      if (stage === 'active') {
        setStage('setup');
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/(tabs)' as Href);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [stage, router]);

  const buildSequencedQuestions = (count: number): QuizQuestion[] => {
    // Gather questions from selected module (and supplement from subject if count > module questions)
    const pool = [
      ...currentModule.questions,
      ...currentSubject.modules
        .filter((m) => m.id !== currentModule.id)
        .flatMap((m) => m.questions),
    ];

    const picked = pool.slice(0, Math.min(count, pool.length));
    // Sequence strictly by difficulty: 1. Easy -> 2. Medium -> 3. Difficult
    return [...picked].sort(
      (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
    );
  };

  const handleStartQuiz = () => {
    const seq = buildSequencedQuestions(quizLength);
    setQuestions(seq);
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setUserAnswers([]);
    setFinalResult(null);
    startTimeRef.current = Date.now();
    setStage('active');
  };

  const currentQuestion = questions[currentIndex];

  const handleSubmitAnswer = () => {
    if (selectedOption === null || submitted) return;
    setSubmitted(true);
    setUserAnswers((prev) => [...prev, selectedOption]);
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setSubmitted(false);
      return;
    }

    // Compute comprehensive quiz results
    const timeSpentSec = Math.max(
      12,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    let correctCount = 0;
    let easyCorrect = 0;
    let easyTotal = 0;
    let mediumCorrect = 0;
    let mediumTotal = 0;
    let difficultCorrect = 0;
    let difficultTotal = 0;

    const topicScores: Record<string, { right: number; total: number }> = {};

    questions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      const isRight = ans === q.correctIndex;
      if (isRight) correctCount++;

      if (q.difficulty === 'Easy') {
        easyTotal++;
        if (isRight) easyCorrect++;
      } else if (q.difficulty === 'Medium') {
        mediumTotal++;
        if (isRight) mediumCorrect++;
      } else {
        difficultTotal++;
        if (isRight) difficultCorrect++;
      }

      if (!topicScores[q.topic]) {
        topicScores[q.topic] = { right: 0, total: 0 };
      }
      topicScores[q.topic].total++;
      if (isRight) topicScores[q.topic].right++;
    });

    const topics = Object.entries(topicScores);
    topics.sort(
      (a, b) => b[1].right / b[1].total - a[1].right / a[1].total
    );

    const strongestTopic = topics[0]?.[0] || currentModule.title;
    const weakestEntry = topics[topics.length - 1];
    const weakestTopic =
      weakestEntry && weakestEntry[1].right < weakestEntry[1].total
        ? weakestEntry[0]
        : 'All Topics Mastered';

    const scorePercent = Math.round(
      (correctCount / Math.max(1, questions.length)) * 100
    );

    const saved = await recordQuizResult({
      subjectId: currentSubject.id,
      subjectName: currentSubject.shortName,
      moduleId: currentModule.id,
      moduleTitle: currentModule.title,
      scorePercent,
      correctCount,
      incorrectCount: questions.length - correctCount,
      totalQuestions: questions.length,
      timeSpentSec,
      easyCorrect,
      easyTotal,
      mediumCorrect,
      mediumTotal,
      difficultCorrect,
      difficultTotal,
      strongestTopic,
      weakestTopic,
      recommendedLesson:
        currentModule.lessons[0]?.title || currentModule.title,
    });

    setFinalResult(saved);
    setStage('results');
  };

  //Difficulty badge color helper
  const getDifficultyColor = (diff: QuizQuestion['difficulty']) => {
    if (diff === 'Easy') return '#10B981';
    if (diff === 'Medium') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.headerRow}>
          <SmoothPressable
            onPress={() => {
              if (stage === 'review') setStage('results');
              else if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}
            style={[
              styles.backBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.navy} />
          </SmoothPressable>

          <View style={styles.flex}>
            <Text style={[styles.title, { color: theme.navy }]}>
              {stage === 'setup'
                ? 'Adaptive Quiz Setup'
                : stage === 'active'
                ? `${currentSubject.shortName} Mastery Quiz`
                : stage === 'results'
                ? 'Quiz Performance Results'
                : 'Step-by-Step Answer Review'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {currentModule.title}
            </Text>
          </View>
        </View>

        {/* ── STAGE 1: PRE-QUIZ SETUP ── */}
        {stage === 'setup' && (
          <View style={styles.stageBlock}>
            {/* Step 1: Select Subject */}
            <DepthCard variant="card" style={styles.setupCard}>
              <Text style={[styles.stepBadge, { color: activeTheme.primary }]}>
                STEP 1 · SELECT A SUBJECT
              </Text>
              <View style={styles.subjectGrid}>
                {ACADEMIC_SUBJECTS.map((subj) => {
                  const selected = subj.id === currentSubject.id;
                  return (
                    <SmoothPressable
                      key={subj.id}
                      onPress={() => {
                        setSelectedSubjectId(subj.id);
                        setSelectedModuleId(subj.modules[0]?.id ?? '');
                      }}
                      style={[
                        styles.subjectOption,
                        {
                          backgroundColor: selected
                            ? `${subj.color}18`
                            : theme.surface,
                          borderColor: selected ? subj.color : theme.border,
                        },
                      ]}
                    >
                      <Icon3D
                        name={
                          subj.icon as React.ComponentProps<
                            typeof Ionicons
                          >['name']
                        }
                        bg={subj.color}
                        boxSize={36}
                        size={17}
                      />
                      <Text
                        style={[
                          styles.subjectOptionText,
                          { color: theme.navy },
                        ]}
                      >
                        {subj.shortName}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </View>
            </DepthCard>

            {/* Step 2: Select Module */}
            <DepthCard variant="card" style={styles.setupCard}>
              <Text style={[styles.stepBadge, { color: activeTheme.primary }]}>
                STEP 2 · SELECT A MODULE
              </Text>
              <View style={{ gap: 8 }}>
                {currentSubject.modules.map((mod) => {
                  const selected = mod.id === currentModule.id;
                  return (
                    <SmoothPressable
                      key={mod.id}
                      onPress={() => setSelectedModuleId(mod.id)}
                      style={[
                        styles.moduleOptionCard,
                        {
                          backgroundColor: selected
                            ? `${currentSubject.color}14`
                            : theme.surface,
                          borderColor: selected
                            ? currentSubject.color
                            : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.flex}>
                        <Text
                          style={[
                            styles.moduleOptionTitle,
                            { color: theme.navy },
                          ]}
                        >
                          Module {mod.number}: {mod.title}
                        </Text>
                        <Text
                          style={[
                            styles.moduleOptionSub,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {mod.questions.length} adaptive questions ·{' '}
                          {mod.lessons.length} lessons
                        </Text>
                      </View>
                      <Ionicons
                        name={
                          selected ? 'checkmark-circle' : 'ellipse-outline'
                        }
                        size={21}
                        color={
                          selected ? currentSubject.color : theme.textMuted
                        }
                      />
                    </SmoothPressable>
                  );
                })}
              </View>
            </DepthCard>

            {/* Step 3: Select Quiz Length */}
            <DepthCard variant="card" style={styles.setupCard}>
              <Text style={[styles.stepBadge, { color: activeTheme.primary }]}>
                STEP 3 · SELECT QUIZ LENGTH
              </Text>
              <View style={styles.lengthRow}>
                {[3, 5, 6].map((len) => {
                  const selected = quizLength === len;
                  return (
                    <SmoothPressable
                      key={len}
                      onPress={() => setQuizLength(len)}
                      style={[
                        styles.lengthOption,
                        {
                          backgroundColor: selected
                            ? activeTheme.primary
                            : theme.surface,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.lengthNumber,
                          { color: selected ? '#FFFFFF' : theme.navy },
                        ]}
                      >
                        {len}
                      </Text>
                      <Text
                        style={[
                          styles.lengthLabel,
                          {
                            color: selected
                              ? 'rgba(255,255,255,0.9)'
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        Questions
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </View>
            </DepthCard>

            {/* Step 4: Review Quiz Information & Start */}
            <DepthCard
              variant="color"
              gradientColors={[
                currentSubject.color,
                currentSubject.secondaryColor,
              ]}
              style={styles.briefCard}
            >
              <Text style={styles.briefTag}>
                STEP 4 · QUIZ BRIEFING & DIFFICULTY SEQUENCE
              </Text>
              <Text style={styles.briefTitle}>
                {currentSubject.name} — {currentModule.title}
              </Text>
              <Text style={styles.briefDesc}>
                Questions are automatically sequenced from Easy → Medium →
                Difficult with instant explanation feedback after each submission.
              </Text>

              <SmoothPressable
                onPress={handleStartQuiz}
                style={styles.startQuizBtn}
              >
                <Ionicons
                  name="play"
                  size={18}
                  color={currentSubject.color}
                />
                <Text
                  style={[
                    styles.startQuizBtnText,
                    { color: currentSubject.color },
                  ]}
                >
                  Start the Quiz Now
                </Text>
              </SmoothPressable>
            </DepthCard>
          </View>
        )}

        {/* ── STAGE 2: ACTIVE QUIZ QUESTION ── */}
        {stage === 'active' && currentQuestion && (
          <View style={styles.stageBlock}>
            {/* Progress Header Card */}
            <DepthCard variant="mini" style={styles.progressHeaderCard}>
              <View style={styles.rowBetween}>
                <View>
                  <Text
                    style={[
                      styles.qSubjectLabel,
                      { color: currentSubject.color },
                    ]}
                  >
                    {currentSubject.shortName} · Module {currentModule.number}
                  </Text>
                  <Text style={[styles.qCounterText, { color: theme.navy }]}>
                    Question {currentIndex + 1} of {questions.length}
                  </Text>
                </View>

                <View
                  style={[
                    styles.diffBadge,
                    {
                      backgroundColor: `${getDifficultyColor(
                        currentQuestion.difficulty
                      )}18`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.diffDot,
                      {
                        backgroundColor: getDifficultyColor(
                          currentQuestion.difficulty
                        ),
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.diffBadgeText,
                      {
                        color: getDifficultyColor(currentQuestion.difficulty),
                      },
                    ]}
                  >
                    {currentQuestion.difficulty.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View
                style={[
                  styles.quizProgressTrack,
                  { backgroundColor: theme.surface },
                ]}
              >
                <View
                  style={[
                    styles.quizProgressFill,
                    {
                      width: `${Math.round(
                        ((currentIndex + 1) / questions.length) * 100
                      )}%`,
                      backgroundColor: currentSubject.color,
                    },
                  ]}
                />
              </View>
            </DepthCard>

            {/* Question Card */}
            <DepthCard variant="card" style={styles.questionBox}>
              <Text style={[styles.topicMicroTag, { color: theme.textMuted }]}>
                TOPIC · {currentQuestion.topic.toUpperCase()}
              </Text>
              <Text style={[styles.questionText, { color: theme.navy }]}>
                {currentQuestion.question}
              </Text>

              {/* 4 Answer Options with 5 distinct states: Default, Selected, Correct, Incorrect, Disabled */}
              <View style={styles.optionsList}>
                {currentQuestion.options.map((optText, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectOption = idx === currentQuestion.correctIndex;

                  let bgColor = theme.surface;
                  let borderColor = theme.border;
                  let textColor = theme.navy;
                  let badgeBg = theme.card;
                  let badgeText = theme.navy;
                  let rightIcon: React.ComponentProps<
                    typeof Ionicons
                  >['name'] | null = null;
                  let rightIconColor = activeTheme.primary;

                  if (!submitted && isSelected) {
                    // Selected Answer State
                    bgColor = `${activeTheme.primary}18`;
                    borderColor = activeTheme.primary;
                    badgeBg = activeTheme.primary;
                    badgeText = '#FFFFFF';
                    rightIcon = 'radio-button-on';
                  } else if (submitted) {
                    if (isCorrectOption) {
                      // Correct Answer State
                      bgColor = 'rgba(16, 185, 129, 0.16)';
                      borderColor = '#10B981';
                      badgeBg = '#10B981';
                      badgeText = '#FFFFFF';
                      rightIcon = 'checkmark-circle';
                      rightIconColor = '#10B981';
                    } else if (isSelected && !isCorrectOption) {
                      // Incorrect Answer State
                      bgColor = 'rgba(239, 68, 68, 0.16)';
                      borderColor = '#EF4444';
                      badgeBg = '#EF4444';
                      badgeText = '#FFFFFF';
                      rightIcon = 'close-circle';
                      rightIconColor = '#EF4444';
                    }
                  }

                  const optionLetter = ['A', 'B', 'C', 'D'][idx];

                  return (
                    <SmoothPressable
                      key={idx}
                      disabled={submitted}
                      onPress={() => setSelectedOption(idx)}
                      style={[
                        styles.optionBtn,
                        {
                          backgroundColor: bgColor,
                          borderColor,
                          borderWidth:
                            isSelected || (submitted && isCorrectOption)
                              ? 2
                              : 1,
                          opacity:
                            submitted && !isSelected && !isCorrectOption
                              ? 0.6
                              : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.optionLetterCircle,
                          { backgroundColor: badgeBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLetterText,
                            { color: badgeText },
                          ]}
                        >
                          {optionLetter}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.optionLabelText,
                          { color: textColor },
                        ]}
                      >
                        {optText}
                      </Text>

                      {rightIcon && (
                        <Ionicons
                          name={rightIcon}
                          size={22}
                          color={rightIconColor}
                        />
                      )}
                    </SmoothPressable>
                  );
                })}
              </View>
            </DepthCard>

            {/* Feedback & Short Explanation Box */}
            {submitted && (
              <DepthCard
                variant="mini"
                style={[
                  styles.feedbackCard,
                  {
                    borderColor:
                      selectedOption === currentQuestion.correctIndex
                        ? '#10B981'
                        : '#EF4444',
                    borderWidth: 1.5,
                  },
                ]}
              >
                <View style={styles.feedbackHeaderRow}>
                  <Icon3D
                    name={
                      selectedOption === currentQuestion.correctIndex
                        ? 'checkmark-circle'
                        : 'alert-circle'
                    }
                    bg={
                      selectedOption === currentQuestion.correctIndex
                        ? '#10B981'
                        : '#EF4444'
                    }
                    boxSize={36}
                    size={19}
                  />
                  <View style={styles.flex}>
                    <Text
                      style={[
                        styles.feedbackStatusTitle,
                        {
                          color:
                            selectedOption === currentQuestion.correctIndex
                              ? '#10B981'
                              : '#EF4444',
                        },
                      ]}
                    >
                      {selectedOption === currentQuestion.correctIndex
                        ? 'Correct Answer!'
                        : `Incorrect — Correct Option: ${
                            ['A', 'B', 'C', 'D'][currentQuestion.correctIndex]
                          }`}
                    </Text>
                    <Text
                      style={[
                        styles.feedbackExpText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {currentQuestion.explanation}
                    </Text>
                  </View>
                </View>
              </DepthCard>
            )}

            {/* Submit Answer / Next Question Action Button */}
            {!submitted ? (
              <SmoothPressable
                disabled={selectedOption === null}
                onPress={handleSubmitAnswer}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor:
                      selectedOption !== null
                        ? activeTheme.primary
                        : theme.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.submitBtnText,
                    {
                      color:
                        selectedOption !== null
                          ? '#FFFFFF'
                          : theme.textMuted,
                    },
                  ]}
                >
                  Submit Answer
                </Text>
              </SmoothPressable>
            ) : (
              <SmoothPressable
                onPress={() => void handleNextQuestion()}
                style={[
                  styles.submitBtn,
                  { backgroundColor: '#10B981' },
                ]}
              >
                <Text style={styles.submitBtnText}>
                  {currentIndex + 1 < questions.length
                    ? 'Next Question'
                    : 'Finish & View Results'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </SmoothPressable>
            )}
          </View>
        )}

        {/* ── STAGE 3: QUIZ RESULTS SCREEN ── */}
        {stage === 'results' && finalResult && (
          <View style={styles.stageBlock}>
            {/* Animated Score Ring Hero */}
            <DepthCard variant="card" style={styles.resultsHeroCard}>
              <View style={styles.scoreRingWrap}>
                <Svg width={156} height={156}>
                  <Circle
                    cx={78}
                    cy={78}
                    r={66}
                    stroke={theme.surface}
                    strokeWidth={12}
                    fill="none"
                  />
                  <Circle
                    cx={78}
                    cy={78}
                    r={66}
                    stroke={
                      finalResult.scorePercent >= 80
                        ? '#10B981'
                        : finalResult.scorePercent >= 60
                        ? '#F59E0B'
                        : '#EF4444'
                    }
                    strokeWidth={12}
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 66} ${2 * Math.PI * 66}`}
                    strokeDashoffset={
                      2 * Math.PI * 66 * (1 - finalResult.scorePercent / 100)
                    }
                    strokeLinecap="round"
                    transform="rotate(-90 78 78)"
                  />
                </Svg>
                <View style={styles.scoreRingCenter}>
                  <Text style={[styles.scoreBigPct, { color: theme.navy }]}>
                    {finalResult.scorePercent}%
                  </Text>
                  <Text
                    style={[
                      styles.scoreSubTag,
                      { color: theme.textMuted },
                    ]}
                  >
                    ACCURACY
                  </Text>
                </View>
              </View>

              <Text style={[styles.perfHeadline, { color: theme.navy }]}>
                {finalResult.scorePercent === 100
                  ? 'Flawless Academic Mastery!'
                  : finalResult.scorePercent >= 80
                  ? 'Excellent Module Performance!'
                  : 'Good Effort — Ready for Targeted Review'}
              </Text>
              <Text
                style={[styles.perfSubMessage, { color: theme.textSecondary }]}
              >
                Result saved offline to your OrasOras Progress Dashboard.
              </Text>

              {/* 4 Stat Pills: Correct, Incorrect, Total, Time Spent */}
              <View style={styles.resultStatsRow}>
                <View
                  style={[
                    styles.resStatBox,
                    { backgroundColor: 'rgba(16,185,129,0.12)' },
                  ]}
                >
                  <Text style={[styles.resStatNum, { color: '#10B981' }]}>
                    {finalResult.correctCount}
                  </Text>
                  <Text
                    style={[
                      styles.resStatLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Correct
                  </Text>
                </View>

                <View
                  style={[
                    styles.resStatBox,
                    { backgroundColor: 'rgba(239,68,68,0.12)' },
                  ]}
                >
                  <Text style={[styles.resStatNum, { color: '#EF4444' }]}>
                    {finalResult.incorrectCount}
                  </Text>
                  <Text
                    style={[
                      styles.resStatLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Incorrect
                  </Text>
                </View>

                <View
                  style={[
                    styles.resStatBox,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <Text style={[styles.resStatNum, { color: theme.navy }]}>
                    {finalResult.totalQuestions}
                  </Text>
                  <Text
                    style={[
                      styles.resStatLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Total Qs
                  </Text>
                </View>

                <View
                  style={[
                    styles.resStatBox,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.resStatNum,
                      { color: activeTheme.primary },
                    ]}
                  >
                    {finalResult.timeSpentSec}s
                  </Text>
                  <Text
                    style={[
                      styles.resStatLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Time Spent
                  </Text>
                </View>
              </View>
            </DepthCard>

            {/* Difficulty Breakdown: Easy, Medium, Difficult */}
            <DepthCard variant="card" style={{ gap: 10 }}>
              <Text style={[styles.cardSectionTitle, { color: theme.navy }]}>
                Performance by Difficulty Tier
              </Text>

              {[
                {
                  label: 'Easy Questions',
                  correct: finalResult.easyCorrect,
                  total: finalResult.easyTotal,
                  color: '#10B981',
                },
                {
                  label: 'Medium Questions',
                  correct: finalResult.mediumCorrect,
                  total: finalResult.mediumTotal,
                  color: '#F59E0B',
                },
                {
                  label: 'Difficult Questions',
                  correct: finalResult.difficultCorrect,
                  total: finalResult.difficultTotal,
                  color: '#EF4444',
                },
              ].map((tier) => {
                const pct =
                  tier.total > 0
                    ? Math.round((tier.correct / tier.total) * 100)
                    : 100;
                return (
                  <View key={tier.label} style={styles.tierRow}>
                    <View style={styles.rowBetween}>
                      <Text
                        style={[styles.tierLabel, { color: theme.navy }]}
                      >
                        {tier.label}
                      </Text>
                      <Text
                        style={[styles.tierScore, { color: tier.color }]}
                      >
                        {tier.correct}/{tier.total} ({pct}%)
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.tierTrack,
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <View
                        style={[
                          styles.tierFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: tier.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </DepthCard>

            {/* Strongest Topic, Weakest Topic & Recommended Lesson */}
            <DepthCard variant="card" style={{ gap: 10 }}>
              <Text style={[styles.cardSectionTitle, { color: theme.navy }]}>
                Topic Diagnostic & Recommendation
              </Text>

              <View style={styles.diagRow}>
                <Icon3D
                  name="trending-up"
                  bg="#10B981"
                  boxSize={36}
                  size={18}
                />
                <View style={styles.flex}>
                  <Text
                    style={[styles.diagLabel, { color: theme.textMuted }]}
                  >
                    STRONGEST TOPIC
                  </Text>
                  <Text style={[styles.diagValue, { color: theme.navy }]}>
                    {finalResult.strongestTopic}
                  </Text>
                </View>
              </View>

              <View style={styles.diagRow}>
                <Icon3D
                  name="construct"
                  bg="#F59E0B"
                  boxSize={36}
                  size={18}
                />
                <View style={styles.flex}>
                  <Text
                    style={[styles.diagLabel, { color: theme.textMuted }]}
                  >
                    TOPIC NEEDING IMPROVEMENT
                  </Text>
                  <Text style={[styles.diagValue, { color: theme.navy }]}>
                    {finalResult.weakestTopic}
                  </Text>
                </View>
              </View>

              <View style={styles.diagRow}>
                <Icon3D
                  name="book"
                  bg={activeTheme.primary}
                  boxSize={36}
                  size={18}
                />
                <View style={styles.flex}>
                  <Text
                    style={[styles.diagLabel, { color: theme.textMuted }]}
                  >
                    RECOMMENDED LESSON TO REVIEW
                  </Text>
                  <Text style={[styles.diagValue, { color: theme.navy }]}>
                    {finalResult.recommendedLesson}
                  </Text>
                </View>
              </View>
            </DepthCard>

            {/* 5 Required Result Actions: Retry Quiz, Review Answers, Study Weak Topics, View Progress, Return to Study */}
            <View style={styles.resultActionsGrid}>
              <SmoothPressable
                onPress={handleStartQuiz}
                style={[
                  styles.resPrimaryBtn,
                  { backgroundColor: activeTheme.primary },
                ]}
              >
                <Ionicons name="refresh" size={17} color="#FFFFFF" />
                <Text style={styles.resPrimaryBtnText}>Retry Quiz</Text>
              </SmoothPressable>

              <SmoothPressable
                onPress={() => setStage('review')}
                style={[
                  styles.resSecondaryBtn,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Ionicons name="list" size={17} color={theme.navy} />
                <Text
                  style={[styles.resSecondaryBtnText, { color: theme.navy }]}
                >
                  Review Answers
                </Text>
              </SmoothPressable>

              <SmoothPressable
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/chat',
                    params: {
                      subject: currentSubject.shortName,
                      module: currentModule.title,
                    },
                  } as unknown as Href)
                }
                style={[
                  styles.resSecondaryBtn,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={17}
                  color={activeTheme.primary}
                />
                <Text
                  style={[
                    styles.resSecondaryBtnText,
                    { color: activeTheme.primary },
                  ]}
                >
                  Study Weak Topics
                </Text>
              </SmoothPressable>

              <SmoothPressable
                onPress={() => router.push('/(tabs)/progress' as Href)}
                style={[
                  styles.resSecondaryBtn,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Ionicons name="stats-chart" size={17} color="#10B981" />
                <Text
                  style={[
                    styles.resSecondaryBtnText,
                    { color: '#10B981' },
                  ]}
                >
                  View Progress
                </Text>
              </SmoothPressable>

              <SmoothPressable
                onPress={() => router.push('/(tabs)/study' as Href)}
                style={[
                  styles.resFullBtn,
                  { backgroundColor: theme.surface },
                ]}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.resSecondaryBtnText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Return to Study Hub
                </Text>
              </SmoothPressable>
            </View>
          </View>
        )}

        {/* ── STAGE 4: REVIEW ANSWERS ── */}
        {stage === 'review' && (
          <View style={styles.stageBlock}>
            {questions.map((q, idx) => {
              const userAns = userAnswers[idx];
              const isRight = userAns === q.correctIndex;
              return (
                <DepthCard
                  key={q.id}
                  variant="card"
                  style={{
                    gap: 8,
                    borderLeftWidth: 5,
                    borderLeftColor: isRight ? '#10B981' : '#EF4444',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '900',
                      color: isRight ? '#10B981' : '#EF4444',
                    }}
                  >
                    Q{idx + 1} · {q.difficulty.toUpperCase()} ·{' '}
                    {isRight ? 'CORRECT' : 'INCORRECT'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: theme.navy,
                    }}
                  >
                    {q.question}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '700',
                      color: '#10B981',
                    }}
                  >
                    Correct Answer: {q.options[q.correctIndex]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textSecondary,
                      lineHeight: 18,
                    }}
                  >
                    {q.explanation}
                  </Text>
                </DepthCard>
              );
            })}

            <SmoothPressable
              onPress={() => setStage('results')}
              style={[
                styles.submitBtn,
                { backgroundColor: activeTheme.primary },
              ]}
            >
              <Text style={styles.submitBtnText}>Back to Results Summary</Text>
            </SmoothPressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
  },
  stageBlock: {
    gap: 14,
  },
  setupCard: {
    gap: 10,
    padding: 16,
  },
  stepBadge: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectOption: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  subjectOptionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  moduleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  moduleOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  moduleOptionSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  lengthRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lengthOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 2,
  },
  lengthNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  lengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  briefCard: {
    padding: 18,
    gap: 8,
  },
  briefTag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  briefTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  briefDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  startQuizBtn: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  startQuizBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  progressHeaderCard: {
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qSubjectLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  qCounterText: {
    fontSize: 16,
    fontWeight: '900',
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  diffDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  diffBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  quizProgressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  quizProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionBox: {
    gap: 12,
    padding: 18,
  },
  topicMicroTag: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 24,
  },
  optionsList: {
    gap: 10,
    marginTop: 4,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    minHeight: 54,
  },
  optionLetterCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  optionLabelText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  feedbackCard: {
    padding: 14,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  feedbackStatusTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  feedbackExpText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
  },
  submitBtn: {
    minHeight: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  resultsHeroCard: {
    alignItems: 'center',
    gap: 10,
    padding: 20,
  },
  scoreRingWrap: {
    width: 156,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scoreRingCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreBigPct: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreSubTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  perfHeadline: {
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  perfSubMessage: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 6,
  },
  resStatBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: 'center',
    gap: 2,
  },
  resStatNum: {
    fontSize: 17,
    fontWeight: '900',
  },
  resStatLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardSectionTitle: {
    fontSize: 15.5,
    fontWeight: '900',
  },
  tierRow: {
    gap: 5,
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  tierScore: {
    fontSize: 13,
    fontWeight: '900',
  },
  tierTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tierFill: {
    height: '100%',
    borderRadius: 4,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diagLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  diagValue: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 1,
  },
  resultActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resPrimaryBtn: {
    width: '48%',
    flexGrow: 1,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  resSecondaryBtn: {
    width: '48%',
    flexGrow: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  resFullBtn: {
    width: '100%',
    minHeight: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
