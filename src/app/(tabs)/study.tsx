import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import {
  ACADEMIC_SUBJECTS,
  STUDY_MODES,
  type FlashcardItem,
  type StudyMode,
} from '@/data/orasorasData';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';

export default function StudyHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    account,
    activeTheme,
    updateAccount,
    addSavedNote,
    recordStudySession,
    t,
  } = useOras();

  const [selectedSubjectId, setSelectedSubjectId] = useState('math');
  const currentSubject = useMemo(
    () =>
      ACADEMIC_SUBJECTS.find((s) => s.id === selectedSubjectId) ??
      ACADEMIC_SUBJECTS[0],
    [selectedSubjectId]
  );

  const [selectedModuleId, setSelectedModuleId] = useState(
    currentSubject.modules[0]?.id ?? 'math-mod-1'
  );
  const currentModule = useMemo(
    () =>
      currentSubject.modules.find((m) => m.id === selectedModuleId) ??
      currentSubject.modules[0],
    [currentSubject, selectedModuleId]
  );

  // Study Mode & Pomodoro Focus Timer State
  const activeModeObj = useMemo(
    () =>
      STUDY_MODES.find((m) => m.id === account.studyMode) ?? STUDY_MODES[0],
    [account.studyMode]
  );

  const [isBreakPhase, setIsBreakPhase] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(activeModeObj.focusMin * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Focus Ambient Sound Simulator
  const [ambientSound, setAmbientSound] = useState<
    'none' | 'rain' | 'library' | 'whitenoise' | 'cafe'
  >('none');
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  // Flashcards Spaced Repetition Ratings & Bookmarks
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardRatings, setCardRatings] = useState<
    Record<string, 'Easy' | 'Medium' | 'Difficult'>
  >({});
  const [bookmarkedCardIds, setBookmarkedCardIds] = useState<string[]>([]);

  // Custom Deck Flashcard Creation
  const [customFlashcards, setCustomFlashcards] = useState<
    Record<string, FlashcardItem[]>
  >({});
  const [addCardModalVisible, setAddCardModalVisible] = useState(false);
  const [newCardTopic, setNewCardTopic] = useState('');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  // Generated Reviewer Preview State
  const [reviewerGenerated, setReviewerGenerated] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          if (!isBreakPhase) {
            void recordStudySession({
              subjectId: currentSubject.id,
              subjectName: currentSubject.shortName,
              moduleId: currentModule.id,
              durationMin: activeModeObj.focusMin,
              mode: activeModeObj.id,
            });
            showMessage(
              'Focus Session Complete!',
              `Logged ${activeModeObj.focusMin} mins on ${currentSubject.shortName}. Time for a ${activeModeObj.breakMin}-min break!`
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    timerRunning,
    isBreakPhase,
    activeModeObj,
    currentSubject,
    currentModule,
    recordStudySession,
  ]);

  const totalPhaseSeconds =
    (isBreakPhase ? activeModeObj.breakMin : activeModeObj.focusMin) * 60;
  const timerProgress =
    1 - Math.max(0, Math.min(1, secondsLeft / Math.max(1, totalPhaseSeconds)));

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const flashcards = useMemo(() => {
    return [
      ...(currentModule?.flashcards || []),
      ...(customFlashcards[currentModule?.id || ''] || []),
    ];
  }, [currentModule, customFlashcards]);

  const activeCard: FlashcardItem | undefined =
    flashcards.length > 0 ? flashcards[cardIndex % flashcards.length] : undefined;

  // Mastery Calculation
  const masteredCount = useMemo(() => {
    return flashcards.filter((f) => cardRatings[f.id] === 'Easy').length;
  }, [flashcards, cardRatings]);

  const masteryPct =
    flashcards.length > 0
      ? Math.round((masteredCount / flashcards.length) * 100)
      : 0;

  const handleRateCard = (rating: 'Easy' | 'Medium' | 'Difficult') => {
    if (!activeCard || flashcards.length === 0) return;
    setCardRatings((prev) => ({ ...prev, [activeCard.id]: rating }));
    setCardFlipped(false);
    setCardIndex((i) => (i + 1) % flashcards.length);
  };

  const handleToggleBookmarkCard = (cardId: string) => {
    setBookmarkedCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSaveCustomCard = () => {
    if (!newCardFront.trim() || !newCardBack.trim()) {
      showMessage(
        'Required Fields',
        'Enter both a front question and back answer.'
      );
      return;
    }
    const newCard: FlashcardItem = {
      id: `custom-fc-${Date.now()}`,
      topic: newCardTopic.trim() || currentModule.title,
      front: newCardFront.trim(),
      back: newCardBack.trim(),
    };
    setCustomFlashcards((prev) => ({
      ...prev,
      [currentModule.id]: [...(prev[currentModule.id] || []), newCard],
    }));
    setNewCardTopic('');
    setNewCardFront('');
    setNewCardBack('');
    setAddCardModalVisible(false);
    showMessage('Card Added', 'New flashcard created and added to this deck.');
  };

  const handleSelectMode = async (mode: StudyMode) => {
    const nextModeObj =
      STUDY_MODES.find((m) => m.id === mode) ?? STUDY_MODES[0];
    setTimerRunning(false);
    setIsBreakPhase(false);
    setSecondsLeft(nextModeObj.focusMin * 60);
    await updateAccount({ studyMode: mode });
  };

  const handleQuickLogSession = async () => {
    await recordStudySession({
      subjectId: currentSubject.id,
      subjectName: currentSubject.shortName,
      moduleId: currentModule.id,
      durationMin: activeModeObj.focusMin,
      mode: activeModeObj.id,
    });
    showMessage(
      'Session Logged',
      `Added +${activeModeObj.focusMin} minutes of ${activeModeObj.id} study for ${currentSubject.shortName}.`
    );
  };

  const handleGenerateReviewer = async () => {
    setReviewerGenerated(true);
    const summaryLines = currentModule.lessons
      .flatMap((l) =>
        l.topics.map(
          (t) => `• ${t.title}: ${t.summary} (${t.keyFormulaOrConcept})`
        )
      )
      .join('\n');

    await addSavedNote({
      title: `${currentModule.title} — Smart Reviewer`,
      subjectId: currentSubject.id,
      subjectName: currentSubject.shortName,
      content: summaryLines,
      type: 'AI Reviewer',
    });
    showMessage(
      'Reviewer Saved to Library',
      `Generated structured reviewer for ${currentModule.title} and saved offline.`
    );
  };

  // Ring dimensions
  const RING_SIZE = 166;
  const STROKE = 11;
  const RADIUS = (RING_SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC * (1 - timerProgress);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Prominent Ask OrasOras AI Hero Portal */}
        <DepthCard
          variant="color"
          gradientColors={[activeTheme.primary, activeTheme.secondary]}
          style={styles.aiPortalHero}
        >
          <View style={styles.aiPortalTop}>
            <View style={styles.aiBadgePill}>
              <Ionicons name="sparkles" size={13} color="#FCD34D" />
              <Text style={styles.aiBadgeText}>
                STUDY HUB & ASK ORASORAS AI
              </Text>
            </View>
            <View style={styles.modeTagHero}>
              <Text style={styles.modeTagHeroText}>{account.studyMode}</Text>
            </View>
          </View>

          <Text style={styles.aiPortalTitle}>
            Your Academic AI Tutor & Focus Command Center
          </Text>
          <Text style={styles.aiPortalSub}>
            Simplify complex lessons, generate instant reviewers, flip
            flashcards, or launch an adaptive quiz.
          </Text>

          <View style={styles.aiPortalActions}>
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
              style={styles.launchAiBtn}
            >
              <Ionicons
                name="sparkles"
                size={16}
                color={activeTheme.primary}
              />
              <Text
                style={[
                  styles.launchAiBtnText,
                  { color: activeTheme.primary },
                ]}
              >
                Ask OrasOras AI
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() =>
                router.push({
                  pathname: '/quiz',
                  params: {
                    subjectId: currentSubject.id,
                    moduleId: currentModule.id,
                  },
                } as unknown as Href)
              }
              style={styles.launchQuizBtn}
            >
              <Ionicons name="ribbon" size={16} color="#FFFFFF" />
              <Text style={styles.launchQuizBtnText}>Start Adaptive Quiz</Text>
            </SmoothPressable>
          </View>
        </DepthCard>

        {/* 2. Subject & Module Selector */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.microHeading, { color: theme.textMuted }]}>
            ACTIVE STUDY SUBJECT & MODULE
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {ACADEMIC_SUBJECTS.map((subj) => {
              const selected = subj.id === currentSubject.id;
              return (
                <SmoothPressable
                  key={subj.id}
                  onPress={() => {
                    setSelectedSubjectId(subj.id);
                    setSelectedModuleId(subj.modules[0]?.id ?? '');
                    setCardIndex(0);
                    setCardFlipped(false);
                  }}
                  style={[
                    styles.subjectChip,
                    {
                      backgroundColor: selected ? subj.color : theme.card,
                      borderColor: selected ? subj.color : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      subj.icon as React.ComponentProps<
                        typeof Ionicons
                      >['name']
                    }
                    size={15}
                    color={selected ? '#FFFFFF' : subj.color}
                  />
                  <Text
                    style={[
                      styles.subjectChipText,
                      { color: selected ? '#FFFFFF' : theme.navy },
                    ]}
                  >
                    {subj.shortName}
                  </Text>
                </SmoothPressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {currentSubject.modules.map((mod) => {
              const selected = mod.id === currentModule.id;
              return (
                <SmoothPressable
                  key={mod.id}
                  onPress={() => {
                    setSelectedModuleId(mod.id);
                    setCardIndex(0);
                    setCardFlipped(false);
                  }}
                  style={[
                    styles.moduleChip,
                    {
                      backgroundColor: selected
                        ? `${currentSubject.color}20`
                        : theme.surface,
                      borderColor: selected
                        ? currentSubject.color
                        : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.moduleChipText,
                      {
                        color: selected
                          ? currentSubject.color
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    Module {mod.number}: {mod.title}
                  </Text>
                </SmoothPressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Five Study Modes Selector: Focused | Balanced | Relaxed | Quick Review | Exam Preparation */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.navy }]}>
            Study Mode ({account.studyMode})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modesCarousel}
          >
            {STUDY_MODES.map((m) => {
              const selected = account.studyMode === m.id;
              return (
                <SmoothPressable
                  key={m.id}
                  onPress={() => void handleSelectMode(m.id)}
                >
                  <DepthCard
                    variant="mini"
                    style={[
                      styles.modeCard,
                      {
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.modeTopRow}>
                      <Text
                        style={[
                          styles.modeName,
                          {
                            color: selected
                              ? activeTheme.primary
                              : theme.navy,
                          },
                        ]}
                      >
                        {m.label}
                      </Text>
                      <View
                        style={[
                          styles.modeMinBadge,
                          {
                            backgroundColor: selected
                              ? `${activeTheme.primary}18`
                              : theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeMinText,
                            {
                              color: selected
                                ? activeTheme.primary
                                : theme.textSecondary,
                            },
                          ]}
                        >
                          {m.focusMin}m / {m.breakMin}m
                        </Text>
                      </View>
                    </View>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.modeDesc,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {m.desc}
                    </Text>
                  </DepthCard>
                </SmoothPressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Interactive Focus & Pomodoro Timer Card */}
        <DepthCard variant="card" style={styles.timerCard}>
          <View style={styles.timerHeaderRow}>
            <View>
              <Text style={[styles.timerCardTitle, { color: theme.navy }]}>
                {t.focusTimer}
              </Text>
              <Text
                style={[styles.timerCardSub, { color: theme.textSecondary }]}
              >
                {currentSubject.shortName} · {currentModule.title}
              </Text>
            </View>

            <View style={styles.phaseSwitchRow}>
              <SmoothPressable
                onPress={() => {
                  setTimerRunning(false);
                  setIsBreakPhase(false);
                  setSecondsLeft(activeModeObj.focusMin * 60);
                }}
                style={[
                  styles.phaseChip,
                  !isBreakPhase && { backgroundColor: activeTheme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.phaseChipText,
                    { color: !isBreakPhase ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {t.focusTime} ({activeModeObj.focusMin}m)
                </Text>
              </SmoothPressable>

              <SmoothPressable
                onPress={() => {
                  setTimerRunning(false);
                  setIsBreakPhase(true);
                  setSecondsLeft(activeModeObj.breakMin * 60);
                }}
                style={[
                  styles.phaseChip,
                  isBreakPhase && { backgroundColor: '#10B981' },
                ]}
              >
                <Text
                  style={[
                    styles.phaseChipText,
                    { color: isBreakPhase ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {t.breakTime} ({activeModeObj.breakMin}m)
                </Text>
              </SmoothPressable>
            </View>
          </View>

          {/* Animated SVG Progress Ring */}
          <View style={styles.ringCenterWrap}>
            <View style={styles.ringBox}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke={theme.surface}
                  strokeWidth={STROKE}
                  fill="none"
                />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke={isBreakPhase ? '#10B981' : activeTheme.primary}
                  strokeWidth={STROKE}
                  fill="none"
                  strokeDasharray={`${CIRC} ${CIRC}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              </Svg>
              <View style={styles.ringDigitsOverlay}>
                <Text style={[styles.timerDigits, { color: theme.navy }]}>
                  {mins}:{secs}
                </Text>
                <Text
                  style={[styles.timerPhaseLabel, { color: theme.textMuted }]}
                >
                  {timerRunning
                    ? isBreakPhase
                      ? 'RESTORING ENERGY'
                      : 'DEEP FOCUS ACTIVE'
                    : 'READY TO START'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.timerControlsRow}>
            <SmoothPressable
              onPress={() => setTimerRunning((r) => !r)}
              style={[
                styles.timerMainBtn,
                {
                  backgroundColor: timerRunning
                    ? '#F59E0B'
                    : activeTheme.primary,
                },
              ]}
            >
              <Ionicons
                name={timerRunning ? 'pause' : 'play'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.timerMainBtnText}>
                {timerRunning ? t.pauseTimer : t.startFocus}
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => {
                setTimerRunning(false);
                setSecondsLeft(
                  (isBreakPhase
                    ? activeModeObj.breakMin
                    : activeModeObj.focusMin) * 60
                );
              }}
              style={[
                styles.timerResetBtn,
                { backgroundColor: theme.surface },
              ]}
            >
              <Ionicons name="refresh" size={18} color={theme.navy} />
            </SmoothPressable>

            <SmoothPressable
              onPress={() => void handleQuickLogSession()}
              style={[
                styles.timerCompleteBtn,
                { backgroundColor: 'rgba(16,185,129,0.16)' },
              ]}
            >
              <Ionicons name="checkmark-done" size={17} color="#10B981" />
              <Text style={styles.timerCompleteBtnText}>Log +{activeModeObj.focusMin}m</Text>
            </SmoothPressable>
          </View>

          {/* Ambient Sound Focus Simulator */}
          <View style={styles.ambientBlock}>
            <View style={styles.rowBetween}>
              <View style={styles.ambientTitleRow}>
                <Ionicons
                  name={ambientPlaying ? 'musical-notes' : 'headset-outline'}
                  size={15}
                  color={ambientPlaying ? '#10B981' : theme.textSecondary}
                />
                <Text style={[styles.ambientTitleText, { color: theme.navy }]}>
                  {t.ambientSound}
                </Text>
              </View>
              {ambientSound !== 'none' && (
                <SmoothPressable
                  onPress={() => setAmbientPlaying((p) => !p)}
                  style={[
                    styles.ambientPlayBtn,
                    { backgroundColor: ambientPlaying ? '#10B981' : theme.surface },
                  ]}
                >
                  <Ionicons
                    name={ambientPlaying ? 'volume-high' : 'volume-mute'}
                    size={14}
                    color={ambientPlaying ? '#FFFFFF' : theme.navy}
                  />
                  <Text
                    style={[
                      styles.ambientPlayBtnText,
                      { color: ambientPlaying ? '#FFFFFF' : theme.navy },
                    ]}
                  >
                    {ambientPlaying ? t.ambientPlaying : t.ambientMuted}
                  </Text>
                </SmoothPressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ambientPillsRow}
            >
              {[
                { id: 'none', label: 'None', icon: 'close-circle' as const },
                { id: 'rain', label: 'Rain Drops', icon: 'rainy' as const },
                { id: 'library', label: 'Library Quiet', icon: 'book' as const },
                { id: 'whitenoise', label: 'White Noise', icon: 'radio' as const },
                { id: 'cafe', label: 'Study Cafe', icon: 'cafe' as const },
              ].map((s) => {
                const active = ambientSound === s.id;
                return (
                  <SmoothPressable
                    key={s.id}
                    onPress={() => {
                      setAmbientSound(s.id as any);
                      if (s.id !== 'none') setAmbientPlaying(true);
                      else setAmbientPlaying(false);
                    }}
                    style={[
                      styles.ambientChip,
                      {
                        backgroundColor: active
                          ? `${activeTheme.primary}18`
                          : theme.surface,
                        borderColor: active ? activeTheme.primary : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={s.icon}
                      size={13}
                      color={active ? activeTheme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.ambientChipText,
                        {
                          color: active ? activeTheme.primary : theme.textSecondary,
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </ScrollView>
          </View>
        </DepthCard>

        {/* 5. Interactive Flashcard Deck */}
        {activeCard && (
          <View style={styles.sectionBlock}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.navy }]}>
                  {t.spacedRepetition}
                </Text>
                <Text style={[styles.cardCountText, { color: theme.textMuted }]}>
                  Card {(cardIndex % flashcards.length) + 1} of {flashcards.length} · {t.masteryProgress}: {masteryPct}% ({masteredCount})
                </Text>
              </View>

              <SmoothPressable
                onPress={() => setAddCardModalVisible(true)}
                style={[styles.addCardBtn, { backgroundColor: `${activeTheme.primary}18` }]}
              >
                <Ionicons name="add" size={15} color={activeTheme.primary} />
                <Text style={[styles.addCardBtnText, { color: activeTheme.primary }]}>
                  {t.addFlashcard}
                </Text>
              </SmoothPressable>
            </View>

            {/* Mastery Progress Track */}
            <View style={[styles.masteryTrack, { backgroundColor: theme.surface }]}>
              <View
                style={[
                  styles.masteryFill,
                  { width: `${masteryPct}%`, backgroundColor: '#10B981' },
                ]}
              />
            </View>

            {activeCard && flashcards.length > 0 ? (
              <>
                <SmoothPressable
                  onPress={() => setCardFlipped((f) => !f)}
                  accessibilityLabel="Flip flashcard"
                >
                  <DepthCard
                    variant={cardFlipped ? 'color' : 'card'}
                    gradientColors={
                      cardFlipped
                        ? [currentSubject.color, currentSubject.secondaryColor]
                        : undefined
                    }
                    style={styles.flashcardBox}
                  >
                    <View style={styles.rowBetween}>
                      <View
                        style={[
                          styles.fcBadge,
                          {
                            backgroundColor: cardFlipped
                              ? 'rgba(255,255,255,0.2)'
                              : `${currentSubject.color}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.fcBadgeText,
                            {
                              color: cardFlipped
                                ? '#FFFFFF'
                                : currentSubject.color,
                            },
                          ]}
                        >
                          {cardFlipped ? 'ANSWER' : 'QUESTION'} · {activeCard.topic}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <SmoothPressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleBookmarkCard(activeCard.id);
                          }}
                        >
                          <Ionicons
                            name={
                              bookmarkedCardIds.includes(activeCard.id)
                                ? 'bookmark'
                                : 'bookmark-outline'
                            }
                            size={19}
                            color={cardFlipped ? '#FFFFFF' : activeTheme.primary}
                          />
                        </SmoothPressable>
                        <Ionicons
                          name="sync"
                          size={17}
                          color={cardFlipped ? '#FFFFFF' : theme.textMuted}
                        />
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.fcMainText,
                        { color: cardFlipped ? '#FFFFFF' : theme.navy },
                      ]}
                    >
                      {cardFlipped ? activeCard.back : activeCard.front}
                    </Text>

                    <View style={styles.fcNavRow}>
                      <SmoothPressable
                        onPress={() => {
                          setCardFlipped(false);
                          setCardIndex(
                            (i) => (i - 1 + flashcards.length) % flashcards.length
                          );
                        }}
                        style={[
                          styles.fcNavBtn,
                          {
                            backgroundColor: cardFlipped
                              ? 'rgba(255,255,255,0.2)'
                              : theme.surface,
                          },
                        ]}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={16}
                          color={cardFlipped ? '#FFFFFF' : theme.navy}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: cardFlipped ? '#FFFFFF' : theme.navy,
                          }}
                        >
                          Prev
                        </Text>
                      </SmoothPressable>

                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: cardFlipped ? 'rgba(255,255,255,0.85)' : theme.textMuted,
                        }}
                      >
                        {t.tapToFlip}
                      </Text>

                      <SmoothPressable
                        onPress={() => {
                          setCardFlipped(false);
                          setCardIndex((i) => (i + 1) % flashcards.length);
                        }}
                        style={[
                          styles.fcNavBtn,
                          {
                            backgroundColor: cardFlipped
                              ? 'rgba(255,255,255,0.2)'
                              : theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: cardFlipped ? '#FFFFFF' : theme.navy,
                          }}
                        >
                          Next
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={cardFlipped ? '#FFFFFF' : theme.navy}
                        />
                      </SmoothPressable>
                    </View>
                  </DepthCard>
                </SmoothPressable>

                {/* Spaced Repetition Rating Buttons */}
                <View style={styles.spacedRepetitionRow}>
                  <Text style={[styles.rateLabel, { color: theme.textMuted }]}>
                    {t.rateRetention}
                  </Text>
                  <View style={styles.ratingButtonsGroup}>
                    <SmoothPressable
                      onPress={() => handleRateCard('Difficult')}
                      style={[styles.rateBtn, { backgroundColor: 'rgba(239, 68, 68, 0.14)', borderColor: '#EF4444' }]}
                    >
                      <Text style={[styles.rateBtnText, { color: '#EF4444' }]}>{t.rateDifficult}</Text>
                    </SmoothPressable>
                    <SmoothPressable
                      onPress={() => handleRateCard('Medium')}
                      style={[styles.rateBtn, { backgroundColor: 'rgba(245, 158, 11, 0.14)', borderColor: '#F59E0B' }]}
                    >
                      <Text style={[styles.rateBtnText, { color: '#F59E0B' }]}>{t.rateMedium}</Text>
                    </SmoothPressable>
                    <SmoothPressable
                      onPress={() => handleRateCard('Easy')}
                      style={[styles.rateBtn, { backgroundColor: 'rgba(16, 185, 129, 0.14)', borderColor: '#10B981' }]}
                    >
                      <Text style={[styles.rateBtnText, { color: '#10B981' }]}>{t.rateEasy}</Text>
                    </SmoothPressable>
                  </View>
                </View>
              </>
            ) : (
              <DepthCard variant="card" style={{ padding: 24, alignItems: 'center', gap: 10, marginVertical: 8 }}>
                <Ionicons name="albums-outline" size={32} color={theme.textMuted} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.navy }}>{t.noFlashcardsYet}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>
                  Create your first custom flashcard for {currentModule?.title || 'this module'}.
                </Text>
                <SmoothPressable
                  onPress={() => setAddCardModalVisible(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 12,
                    backgroundColor: activeTheme.primary,
                    marginTop: 4,
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{t.addFlashcard}</Text>
                </SmoothPressable>
              </DepthCard>
            )}
          </View>
        )}

        {/* 6. Reviewer Generator, Practice Questions & Recommended Study Plan */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.navy }]}>
            {t.aiReviewerTitle}
          </Text>

          <DepthCard variant="card" style={{ gap: 12 }}>
            <View style={styles.planStepRow}>
              <Icon3D
                name="document-text"
                bg="#6366F1"
                boxSize={40}
                size={19}
              />
              <View style={styles.flex}>
                <Text style={[styles.planStepTitle, { color: theme.navy }]}>
                  1-Click Module Reviewer & Summary
                </Text>
                <Text
                  style={[
                    styles.planStepDesc,
                    { color: theme.textSecondary },
                  ]}
                >
                  Compile key formulas, definitions, and exam checkpoints for{' '}
                  {currentModule.title}.
                </Text>
              </View>
              <SmoothPressable
                onPress={() => void handleGenerateReviewer()}
                style={[
                  styles.genBtn,
                  { backgroundColor: activeTheme.primary },
                ]}
              >
                <Text style={styles.genBtnText}>
                  {reviewerGenerated ? 'Saved!' : 'Generate'}
                </Text>
              </SmoothPressable>
            </View>

            <View
              style={[
                styles.planDivider,
                { backgroundColor: theme.border },
              ]}
            />

            <View style={styles.planStepRow}>
              <Icon3D
                name="help-circle"
                bg="#10B981"
                boxSize={40}
                size={20}
              />
              <View style={styles.flex}>
                <Text style={[styles.planStepTitle, { color: theme.navy }]}>
                  Difficulty-Sequenced Practice Quiz
                </Text>
                <Text
                  style={[
                    styles.planStepDesc,
                    { color: theme.textSecondary },
                  ]}
                >
                  {currentModule.questions.length} questions ordered Easy →
                  Medium → Difficult with step-by-step explanations.
                </Text>
              </View>
              <SmoothPressable
                onPress={() =>
                  router.push({
                    pathname: '/quiz',
                    params: {
                      subjectId: currentSubject.id,
                      moduleId: currentModule.id,
                    },
                  } as unknown as Href)
                }
                style={[styles.genBtn, { backgroundColor: '#10B981' }]}
              >
                <Text style={styles.genBtnText}>Start Quiz</Text>
              </SmoothPressable>
            </View>
          </DepthCard>
        </View>

        {/* 7. Study-Session History */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: theme.navy }]}>
            Recent Study-Session History
          </Text>
          <View style={{ gap: 8 }}>
            {account.studySessions.slice(0, 4).map((ss) => (
              <DepthCard
                key={ss.id}
                variant="mini"
                style={styles.sessionHistoryRow}
              >
                <Icon3D
                  name="timer"
                  bg={activeTheme.primary}
                  boxSize={36}
                  size={17}
                />
                <View style={styles.flex}>
                  <Text
                    style={[styles.sessionHistoryTitle, { color: theme.navy }]}
                  >
                    {ss.subjectName} · {ss.mode} Mode
                  </Text>
                  <Text
                    style={[
                      styles.sessionHistorySub,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Completed {ss.durationMin} minutes focus block
                  </Text>
                </View>
                <View
                  style={[
                    styles.sessionBadge,
                    { backgroundColor: 'rgba(16,185,129,0.14)' },
                  ]}
                >
                  <Text style={styles.sessionBadgeText}>
                    +{ss.durationMin}m
                  </Text>
                </View>
              </DepthCard>
            ))}
          </View>
        </View>

        {/* 8. Mistakes Review & Weak Concept Drills */}
        <View style={styles.sectionBlock}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={[styles.sectionTitle, { color: theme.navy }]}>
                Mistakes Review & Weak Topic Drills
              </Text>
            </View>
          </View>

          <DepthCard variant="card" style={{ gap: 12 }}>
            <View style={styles.mistakesHeaderRow}>
              <View style={styles.flex}>
                <Text style={[styles.mistakesHeading, { color: theme.navy }]}>
                  Adaptive Practice Concept Errors
                </Text>
                <Text style={[styles.mistakesSub, { color: theme.textSecondary }]}>
                  Review questions you missed on prior quizzes to solidify understanding before exams.
                </Text>
              </View>
              <SmoothPressable
                onPress={() =>
                  router.push({
                    pathname: '/quiz',
                    params: {
                      subjectId: currentSubject.id,
                      moduleId: currentModule.id,
                      mode: 'mistakes',
                    },
                  } as unknown as Href)
                }
                style={[styles.retestBtn, { backgroundColor: '#EF4444' }]}
              >
                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.retestBtnText}>Re-Test</Text>
              </SmoothPressable>
            </View>

            <View
              style={[
                styles.missedItemCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.rowBetween}>
                <Text style={[styles.missedSubjectBadge, { color: '#EF4444' }]}>
                  {currentSubject.shortName} · {currentModule.title}
                </Text>
                <Text style={[styles.missedDiffTag, { color: theme.textMuted }]}>
                  Difficult
                </Text>
              </View>
              <Text style={[styles.missedQuestionText, { color: theme.navy }]}>
                {currentModule.questions[0]?.question || 'Key derivative definition'}
              </Text>
              <View style={styles.missedExplanationBox}>
                <Text style={[styles.missedExpTitle, { color: '#10B981' }]}>
                  Key Explanation:
                </Text>
                <Text style={[styles.missedExpText, { color: theme.textSecondary }]}>
                  {currentModule.questions[0]?.explanation || 'Review power rule and chain rule derivatives.'}
                </Text>
              </View>
            </View>
          </DepthCard>
        </View>

        {/* 9. Bookmarks Hub */}
        <View style={styles.sectionBlock}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="bookmark" size={18} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: theme.navy }]}>
                Bookmarked Learning Materials
              </Text>
            </View>
          </View>

          <DepthCard variant="card" style={{ gap: 10 }}>
            <Text style={[styles.bookmarksCount, { color: theme.textSecondary }]}>
              {bookmarkedCardIds.length} bookmarked cards · {account.savedNotes.length} saved reviewers
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {account.savedNotes.slice(0, 3).map((note) => (
                <SmoothPressable
                  key={note.id}
                  onPress={() =>
                    showMessage(note.title, note.content)
                  }
                  style={[
                    styles.bookmarkChipCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Ionicons name="document-text" size={16} color={activeTheme.primary} />
                  <View style={styles.flex}>
                    <Text
                      numberOfLines={1}
                      style={[styles.bookmarkChipTitle, { color: theme.navy }]}
                    >
                      {note.title}
                    </Text>
                    <Text
                      style={[styles.bookmarkChipSub, { color: theme.textMuted }]}
                    >
                      {note.subjectName} · {note.type}
                    </Text>
                  </View>
                </SmoothPressable>
              ))}
            </ScrollView>
          </DepthCard>
        </View>
      </ScrollView>

      {/* Create Flashcard Modal */}
      <Modal visible={addCardModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.modalTitle, { color: theme.navy }]}>
                Add Custom Flashcard
              </Text>
              <SmoothPressable onPress={() => setAddCardModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </SmoothPressable>
            </View>

            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              Adding to {currentSubject.shortName} · {currentModule.title}
            </Text>

            <TextInput
              value={newCardTopic}
              onChangeText={setNewCardTopic}
              placeholder="Topic / Concept (Optional)..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.modalInput,
                {
                  color: theme.navy,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            />

            <TextInput
              value={newCardFront}
              onChangeText={setNewCardFront}
              placeholder="Front Question / Prompt..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[
                styles.modalArea,
                {
                  color: theme.navy,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            />

            <TextInput
              value={newCardBack}
              onChangeText={setNewCardBack}
              placeholder="Back Answer / Explanation..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[
                styles.modalArea,
                {
                  color: theme.navy,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            />

            <View style={styles.modalActions}>
              <SmoothPressable
                onPress={() => setAddCardModalVisible(false)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </SmoothPressable>

              <SmoothPressable
                onPress={handleSaveCustomCard}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: activeTheme.primary },
                ]}
              >
                <Text style={styles.modalSaveText}>Save Card</Text>
              </SmoothPressable>
            </View>
          </View>
        </View>
      </Modal>
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
  aiPortalHero: {
    padding: 18,
    gap: 10,
  },
  aiPortalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  modeTagHero: {
    backgroundColor: 'rgba(15,23,42,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modeTagHeroText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  aiPortalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  aiPortalSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  aiPortalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  launchAiBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  launchAiBtnText: {
    fontSize: 13,
    fontWeight: '900',
  },
  launchQuizBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  launchQuizBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  sectionBlock: {
    gap: 9,
  },
  microHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
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
  chipRow: {
    gap: 8,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  moduleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  moduleChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modesCarousel: {
    gap: 10,
  },
  modeCard: {
    width: 176,
    gap: 5,
    padding: 12,
  },
  modeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeName: {
    fontSize: 13,
    fontWeight: '900',
  },
  modeMinBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeMinText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  timerCard: {
    gap: 14,
    padding: 18,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  timerCardTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  timerCardSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  phaseSwitchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  phaseChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  phaseChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ringCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  ringBox: {
    width: 166,
    height: 166,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringDigitsOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigits: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  timerPhaseLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerMainBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  timerMainBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  timerResetBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCompleteBtn: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerCompleteBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  cardCountText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  flashcardBox: {
    minHeight: 168,
    justifyContent: 'space-between',
    gap: 14,
    padding: 18,
  },
  fcBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fcBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fcMainText: {
    fontSize: 15.5,
    fontWeight: '800',
    lineHeight: 22,
  },
  fcNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  fcNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  planStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planStepTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  planStepDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  planDivider: {
    height: StyleSheet.hairlineWidth,
  },
  genBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
  },
  genBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sessionHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionHistoryTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  sessionHistorySub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  sessionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionBadgeText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '900',
  },
  // Ambient sound styles
  ambientBlock: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15,23,42,0.1)',
  },
  ambientTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ambientTitleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ambientPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ambientPlayBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  ambientPillsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  ambientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },
  ambientChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Flashcards mastery & spaced repetition styles
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addCardBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  masteryTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 2,
  },
  masteryFill: {
    height: '100%',
    borderRadius: 3,
  },
  spacedRepetitionRow: {
    gap: 6,
    marginTop: 4,
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  ratingButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  rateBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  // Mistakes Review styles
  mistakesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mistakesHeading: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  mistakesSub: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  retestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  missedItemCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  missedSubjectBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  missedDiffTag: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  missedQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  missedExplanationBox: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15,23,42,0.08)',
    gap: 2,
  },
  missedExpTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  missedExpText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  // Bookmarks styles
  bookmarksCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookmarkChipCard: {
    width: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  bookmarkChipTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  bookmarkChipSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  modalArea: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 70,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
