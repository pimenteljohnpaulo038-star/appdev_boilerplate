import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { UserAvatar } from '@/components/UserAvatar';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import {
  ANIME_PRESET_AVATARS,
  COLOR_THEMES,
  type StudentLevel,
} from '@/data/orasorasData';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

const STUDENT_LEVELS: {
  id: StudentLevel;
  badge: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}[] = [
  {
    id: 'Junior High School',
    badge: 'Grades 7–10',
    desc: 'Foundational STEM, humanities modules, and guided requirement alerts.',
    icon: 'compass',
    color: '#3B82F6',
  },
  {
    id: 'Senior High School',
    badge: 'Grades 11–12',
    desc: 'Specialized tracks, research defense milestones, and exam mastery quizzes.',
    icon: 'rocket',
    color: '#6366F1',
  },
  {
    id: 'College',
    badge: 'Undergraduate',
    desc: 'University credit schedules, deep Pomodoro blocks, and AI synthesis tools.',
    icon: 'school',
    color: '#10B981',
  },
];

function OnboardingHeroArt({ step, primary, secondary }: { step: number; primary: string; secondary: string }) {
  return (
    <View style={styles.artContainer}>
      <Svg width={210} height={160} viewBox="0 0 210 160">
        <Defs>
          <LinearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={primary} />
            <Stop offset="100%" stopColor={secondary} />
          </LinearGradient>
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <Stop offset="100%" stopColor="rgba(241,245,255,0.88)" />
          </LinearGradient>
        </Defs>

        {/* Ambient Aurora Glow Circles */}
        <Circle cx="105" cy="80" r="68" fill="url(#orbGrad)" opacity={0.14} />
        <Circle cx="155" cy="40" r="24" fill={secondary} opacity={0.22} />
        <Circle cx="52" cy="118" r="18" fill="#10B981" opacity={0.22} />

        {/* Dimensional Floating Academic Card */}
        <G>
          <Rect
            x="38"
            y="28"
            width="134"
            height="98"
            rx="22"
            fill="url(#cardGrad)"
            stroke="rgba(59,130,246,0.25)"
            strokeWidth="1.5"
          />
          {/* Top Accent Pill */}
          <Rect x="54" y="44" width="52" height="10" rx="5" fill="url(#orbGrad)" />
          <Circle cx="148" cy="49" r="9" fill="#10B981" opacity={0.2} />
          <Path d="M144 49 L147 52 L153 46" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {step === 0 && (
            /* Clock & Schedule Vector Illustration */
            <G>
              <Circle cx="76" cy="86" r="20" fill="url(#orbGrad)" />
              <Path d="M76 75 L76 86 L84 91" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <Rect x="106" y="72" width="48" height="8" rx="4" fill="#1E293B" opacity={0.8} />
              <Rect x="106" y="85" width="36" height="7" rx="3.5" fill="#64748B" opacity={0.5} />
              <Rect x="106" y="97" width="42" height="7" rx="3.5" fill="#3B82F6" opacity={0.7} />
            </G>
          )}

          {step === 1 && (
            /* AI Sparkles + Quiz Mastery Illustration */
            <G>
              <Rect x="54" y="66" width="102" height="20" rx="8" fill="rgba(99,102,241,0.12)" />
              <Circle cx="67" cy="76" r="5" fill={primary} />
              <Rect x="78" y="73" width="64" height="6" rx="3" fill={primary} />
              <Rect x="54" y="92" width="102" height="20" rx="8" fill="rgba(16,185,129,0.14)" />
              <Circle cx="67" cy="102" r="5" fill="#10B981" />
              <Rect x="78" y="99" width="52" height="6" rx="3" fill="#059669" />
            </G>
          )}
        </G>
      </Svg>
    </View>
  );
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { update: updateBaseSetting } = useSettings();
  const { account, activeTheme, updateAccount, selectPresetAvatar } = useOras();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(account.name || 'Alex Rivera');
  const [level, setLevel] = useState<StudentLevel>(account.level || 'Senior High School');
  const [selectedThemeId, setSelectedThemeId] = useState(account.themeId || 'oras-blue');
  const [selectedAvatarId, setSelectedAvatarId] = useState(account.presetAvatarId ?? 0);
  const [darkMode, setDarkMode] = useState(account.darkMode ?? false);
  const [classReminders, setClassReminders] = useState(true);
  const [requirementAlerts, setRequirementAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  const TOTAL_STEPS = 4;

  const chosenTheme =
    COLOR_THEMES.find((t) => t.id === selectedThemeId) ?? activeTheme;

  const handleFinish = async () => {
    try {
      const cleanName = name.trim() || 'Alex Rivera';
      await selectPresetAvatar(selectedAvatarId);
      await updateAccount({
        name: cleanName,
        level,
        themeId: selectedThemeId,
        darkMode,
        preferences: {
          ...account.preferences,
          classReminders,
          requirementAlerts,
          dailyDigest,
        },
      });
      await updateBaseSetting('nickname', cleanName);
      await updateBaseSetting('theme', darkMode ? 'dark' : 'light');
      await updateBaseSetting('onboarded', true);
    } catch (e) {
      console.warn('Onboarding finish warning:', e);
    } finally {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Brand Bar + Skip Action */}
        <View style={styles.topHeader}>
          <View style={styles.logoBrand}>
            <Icon3D
              name="time"
              size={18}
              bg={chosenTheme.primary}
              boxSize={36}
              radius={12}
            />
            <View>
              <Text style={[styles.logoTitle, { color: theme.navy }]}>OrasOras</Text>
              <Text style={[styles.logoSub, { color: theme.textMuted }]}>
                ACADEMIC OS
              </Text>
            </View>
          </View>

          {step < TOTAL_STEPS - 1 && (
            <SmoothPressable
              onPress={() => setStep(TOTAL_STEPS - 1)}
              style={[styles.skipBtn, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.skipText, { color: theme.textSecondary }]}>
                Skip to Setup
              </Text>
            </SmoothPressable>
          )}
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 0: Welcome & Core Value Proposition */}
          {step === 0 && (
            <View style={styles.stepBlock}>
              <OnboardingHeroArt
                step={0}
                primary={chosenTheme.primary}
                secondary={chosenTheme.secondary}
              />

              <View style={[styles.pillTag, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                <Ionicons name="sparkles" size={13} color={chosenTheme.primary} />
                <Text style={[styles.pillTagText, { color: chosenTheme.primary }]}>
                  ALL-IN-ONE ACADEMIC COMPANION
                </Text>
              </View>

              <Text style={[styles.heroHeading, { color: theme.navy }]}>
                Never miss class or requirements again.
              </Text>
              <Text style={[styles.heroBody, { color: theme.textSecondary }]}>
                Built for Junior High, Senior High, and College scholars. Track your
                live class countdowns, master modules, and study with OrasOras AI—100%
                offline-ready.
              </Text>

              <View style={styles.benefitsList}>
                {[
                  {
                    icon: 'calendar' as const,
                    color: '#3B82F6',
                    title: 'Smart Class & Deadline Radar',
                    desc: 'Live next-class countdowns, conflict alerts, and priority checklists.',
                  },
                  {
                    icon: 'sparkles' as const,
                    color: '#6366F1',
                    title: 'Ask OrasOras AI & Adaptive Quizzes',
                    desc: 'Turn lessons into flashcards, reviewers, and difficulty-sequenced quizzes.',
                  },
                  {
                    icon: 'stats-chart' as const,
                    color: '#10B981',
                    title: 'Deep Analytics & Anime Avatar Studio',
                    desc: 'Visualize mastery trends, earn achievement badges, and customize your scholar profile.',
                  },
                ].map((b) => (
                  <DepthCard key={b.title} variant="mini" style={styles.benefitCard}>
                    <View style={styles.benefitRow}>
                      <Icon3D name={b.icon} bg={b.color} boxSize={40} size={19} radius={13} />
                      <View style={styles.flex}>
                        <Text style={[styles.benefitTitle, { color: theme.navy }]}>
                          {b.title}
                        </Text>
                        <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                          {b.desc}
                        </Text>
                      </View>
                    </View>
                  </DepthCard>
                ))}
              </View>
            </View>
          )}

          {/* STEP 1: Student Level & Name Setup */}
          {step === 1 && (
            <View style={styles.stepBlock}>
              <OnboardingHeroArt
                step={1}
                primary={chosenTheme.primary}
                secondary={chosenTheme.secondary}
              />
              <Text style={[styles.stepHeading, { color: theme.navy }]}>
                Personalize Your Academic Profile
              </Text>
              <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
                No login required. Everything is saved offline on your device.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  YOUR STUDENT NAME
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name or nickname"
                  placeholderTextColor={theme.textMuted}
                  maxLength={32}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.card,
                      borderColor: chosenTheme.primary,
                      color: theme.navy,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  SELECT STUDENT LEVEL
                </Text>
                <View style={styles.levelList}>
                  {STUDENT_LEVELS.map((lvl) => {
                    const selected = level === lvl.id;
                    return (
                      <SmoothPressable
                        key={lvl.id}
                        onPress={() => setLevel(lvl.id)}
                        style={[
                          styles.levelCard,
                          {
                            backgroundColor: selected
                              ? theme.isDark
                                ? 'rgba(59, 130, 246, 0.2)'
                                : '#EFF6FF'
                              : theme.card,
                            borderColor: selected ? lvl.color : theme.border,
                            borderWidth: selected ? 2 : 1,
                          },
                        ]}
                      >
                        <Icon3D name={lvl.icon} bg={lvl.color} boxSize={42} size={20} />
                        <View style={styles.flex}>
                          <View style={styles.levelTitleRow}>
                            <Text style={[styles.levelTitle, { color: theme.navy }]}>
                              {lvl.id}
                            </Text>
                            <View
                              style={[
                                styles.levelBadge,
                                { backgroundColor: `${lvl.color}20` },
                              ]}
                            >
                              <Text style={[styles.levelBadgeText, { color: lvl.color }]}>
                                {lvl.badge}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.levelDesc, { color: theme.textSecondary }]}>
                            {lvl.desc}
                          </Text>
                        </View>
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={selected ? lvl.color : theme.textMuted}
                        />
                      </SmoothPressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: Avatar & Color Theme Selection */}
          {step === 2 && (
            <View style={styles.stepBlock}>
              <View style={styles.avatarPreviewHeader}>
                <UserAvatar
                  avatarId={selectedAvatarId}
                  size={96}
                  bgColors={[chosenTheme.primary, chosenTheme.secondary]}
                />
                <Text style={[styles.stepHeading, { color: theme.navy, marginTop: 10 }]}>
                  Choose Avatar & Color Theme
                </Text>
                <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
                  Pick a preset scholar avatar now—you can customize every detail later in
                  Avatar Studio.
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                ANIME SCHOLAR AVATARS
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avatarRow}
              >
                {ANIME_PRESET_AVATARS.map((av) => {
                  const selected = selectedAvatarId === av.id;
                  return (
                    <SmoothPressable
                      key={av.id}
                      onPress={() => setSelectedAvatarId(av.id)}
                      style={[
                        styles.avatarChoiceCard,
                        {
                          backgroundColor: theme.card,
                          borderColor: selected ? chosenTheme.primary : theme.border,
                          borderWidth: selected ? 2 : 1,
                        },
                      ]}
                    >
                      <UserAvatar avatarId={av.id} size={54} />
                      <Text style={[styles.avatarChoiceName, { color: theme.navy }]}>
                        {av.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.avatarChoiceRole, { color: theme.textMuted }]}
                      >
                        {av.title}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: theme.navy, marginTop: 8 }]}>
                COLOR THEME & APPEARANCE
              </Text>
              <View style={styles.themeGrid}>
                {COLOR_THEMES.slice(0, 6).map((t) => {
                  const selected = selectedThemeId === t.id;
                  return (
                    <SmoothPressable
                      key={t.id}
                      onPress={() => setSelectedThemeId(t.id)}
                      style={[
                        styles.themeChip,
                        {
                          backgroundColor: theme.card,
                          borderColor: selected ? t.primary : theme.border,
                          borderWidth: selected ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.themeDot, { backgroundColor: t.primary }]} />
                      <Text
                        numberOfLines={1}
                        style={[styles.themeChipName, { color: theme.navy }]}
                      >
                        {t.name}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </View>

              <DepthCard variant="mini" style={styles.darkSwitchCard}>
                <View style={styles.prefRow}>
                  <Icon3D name="moon" bg="#6366F1" boxSize={36} size={17} />
                  <View style={styles.flex}>
                    <Text style={[styles.benefitTitle, { color: theme.navy }]}>
                      Deep Navy Dark Mode
                    </Text>
                    <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                      Switch between soft blue-white and deep indigo night surfaces.
                    </Text>
                  </View>
                  <Switch
                    value={darkMode}
                    onValueChange={(v) => {
                      setDarkMode(v);
                      void updateBaseSetting('theme', v ? 'dark' : 'light');
                    }}
                    trackColor={{ false: '#CBD5E1', true: chosenTheme.primary }}
                  />
                </View>
              </DepthCard>
            </View>
          )}

          {/* STEP 3: Notification Preferences & Launch */}
          {step === 3 && (
            <View style={styles.stepBlock}>
              <View style={styles.readySummaryHero}>
                <UserAvatar
                  avatarId={selectedAvatarId}
                  size={84}
                  bgColors={[chosenTheme.primary, chosenTheme.secondary]}
                />
                <Text style={[styles.readyName, { color: theme.navy }]}>
                  {name.trim() || 'Alex Rivera'}
                </Text>
                <View
                  style={[
                    styles.readyBadge,
                    { backgroundColor: `${chosenTheme.primary}18` },
                  ]}
                >
                  <Ionicons name="school" size={13} color={chosenTheme.primary} />
                  <Text style={[styles.readyBadgeText, { color: chosenTheme.primary }]}>
                    {level} · Ready to Launch
                  </Text>
                </View>
              </View>

              <Text style={[styles.stepHeading, { color: theme.navy }]}>
                Smart Notification Preferences
              </Text>
              <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
                Configure how OrasOras keeps you ahead of every class and requirement.
              </Text>

              <View style={styles.benefitsList}>
                <DepthCard variant="mini">
                  <View style={styles.prefRow}>
                    <Icon3D name="time" bg="#3B82F6" boxSize={38} size={18} />
                    <View style={styles.flex}>
                      <Text style={[styles.benefitTitle, { color: theme.navy }]}>
                        Next-Class Countdowns
                      </Text>
                      <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                        Alert 15 minutes before each class starts with room or link.
                      </Text>
                    </View>
                    <Switch
                      value={classReminders}
                      onValueChange={setClassReminders}
                      trackColor={{ false: '#CBD5E1', true: chosenTheme.primary }}
                    />
                  </View>
                </DepthCard>

                <DepthCard variant="mini">
                  <View style={styles.prefRow}>
                    <Icon3D name="alert-circle" bg="#F59E0B" boxSize={38} size={18} />
                    <View style={styles.flex}>
                      <Text style={[styles.benefitTitle, { color: theme.navy }]}>
                        Requirement & Deadline Alerts
                      </Text>
                      <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                        Highlight approaching and urgent tasks before they turn overdue.
                      </Text>
                    </View>
                    <Switch
                      value={requirementAlerts}
                      onValueChange={setRequirementAlerts}
                      trackColor={{ false: '#CBD5E1', true: chosenTheme.primary }}
                    />
                  </View>
                </DepthCard>

                <DepthCard variant="mini">
                  <View style={styles.prefRow}>
                    <Icon3D name="sparkles" bg="#10B981" boxSize={38} size={18} />
                    <View style={styles.flex}>
                      <Text style={[styles.benefitTitle, { color: theme.navy }]}>
                        Daily Study & Quiz Recommendations
                      </Text>
                      <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                        Receive AI study plans and weak-topic review reminders.
                      </Text>
                    </View>
                    <Switch
                      value={dailyDigest}
                      onValueChange={setDailyDigest}
                      trackColor={{ false: '#CBD5E1', true: chosenTheme.primary }}
                    />
                  </View>
                </DepthCard>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Progress Indicators + Navigation Actions */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <View style={styles.dotsRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
              const active = idx === step;
              return (
                <SmoothPressable
                  key={idx}
                  onPress={() => setStep(idx)}
                  style={[
                    styles.dot,
                    {
                      width: active ? 26 : 8,
                      backgroundColor: active ? chosenTheme.primary : theme.border,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.footerButtons}>
            {step > 0 ? (
              <SmoothPressable
                onPress={() => setStep(step - 1)}
                style={[styles.backBtn, { backgroundColor: theme.surface }]}
              >
                <Ionicons name="arrow-back" size={18} color={theme.navy} />
                <Text style={[styles.backBtnText, { color: theme.navy }]}>Back</Text>
              </SmoothPressable>
            ) : (
              <View />
            )}

            <SmoothPressable
              onPress={() => {
                if (step < TOTAL_STEPS - 1) setStep(step + 1);
                else void handleFinish();
              }}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: chosenTheme.primary,
                  shadowColor: chosenTheme.primary,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {step === TOTAL_STEPS - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <Ionicons
                name={step === TOTAL_STEPS - 1 ? 'rocket' : 'arrow-forward'}
                size={18}
                color="#FFFFFF"
              />
            </SmoothPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  logoBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  logoSub: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
  },
  stepBlock: {
    gap: 14,
  },
  artContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heroHeading: {
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.7,
    lineHeight: 33,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  benefitsList: {
    gap: 10,
    marginTop: 4,
  },
  benefitCard: {
    paddingVertical: 13,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  benefitDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stepSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  fieldGroup: {
    gap: 8,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '700',
  },
  levelList: {
    gap: 10,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  levelTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  levelBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  levelDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  avatarPreviewHeader: {
    alignItems: 'center',
    gap: 4,
  },
  avatarRow: {
    gap: 10,
    paddingVertical: 4,
  },
  avatarChoiceCard: {
    width: 96,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    gap: 4,
  },
  avatarChoiceName: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  avatarChoiceRole: {
    fontSize: 10,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    width: '31%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
  },
  themeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeChipName: {
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  darkSwitchCard: {
    marginTop: 4,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readySummaryHero: {
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  readyName: {
    fontSize: 20,
    fontWeight: '900',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  readyBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
