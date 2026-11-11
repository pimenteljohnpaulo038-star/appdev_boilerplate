import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { UserAvatar } from '@/components/UserAvatar';
import { AvatarStudioModal } from '@/components/AvatarStudioModal';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import {
  ANIME_PRESET_AVATARS,
  COLOR_THEMES,
  PROFILE_TITLES,
  STUDY_MODES,
  type StudentLevel,
  type StudentPreferences,
} from '@/data/orasorasData';
import { useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';

const STUDENT_LEVEL_OPTIONS: StudentLevel[] = [
  'Junior High School',
  'Senior High School',
  'College',
];

const PREFERENCE_TOGGLES: {
  key: keyof StudentPreferences;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}[] = [
  {
    key: 'classReminders',
    label: 'Class Countdown Reminders',
    desc: 'Notify 15 minutes before every scheduled class.',
    icon: 'time',
    color: '#3B82F6',
  },
  {
    key: 'requirementAlerts',
    label: 'Urgent Requirement Alerts',
    desc: 'Warn when assignments approach or pass deadlines.',
    icon: 'alert-circle',
    color: '#F59E0B',
  },
  {
    key: 'soundEffects',
    label: 'Micro-Interaction Sound & Haptics',
    desc: 'Subtle celebration feedback on quiz and timer completion.',
    icon: 'volume-high',
    color: '#6366F1',
  },
  {
    key: 'dailyDigest',
    label: 'Daily Study Plan Digest',
    desc: 'Morning summary of today’s classes and weak topics.',
    icon: 'sunny',
    color: '#10B981',
  },
  {
    key: 'autoSaveAI',
    label: 'Auto-Save AI Reviewers Offline',
    desc: 'Keep generated flashcards and summaries in local storage.',
    icon: 'cloud-done',
    color: '#06B6D4',
  },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    accounts,
    account,
    activeTheme,
    switchAccount,
    createAccount,
    updateAccount,
    togglePreference,
    selectPresetAvatar,
    logoutToOnboarding,
    language,
    t,
    setLanguage,
  } = useOras();

  const [studioVisible, setStudioVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  // Edit Profile Modal state
  const [nameDraft, setNameDraft] = useState(account.name);
  const [levelDraft, setLevelDraft] = useState<StudentLevel>(account.level);
  const [customTitleDraft, setCustomTitleDraft] = useState(
    account.profileTitle
  );

  // New Account Modal state
  const [newAccName, setNewAccName] = useState('');
  const [newAccLevel, setNewAccLevel] =
    useState<StudentLevel>('College');

  const avgScore = useMemo(() => {
    const qrs = account.quizResults || [];
    if (qrs.length === 0) return 91;
    return Math.round(
      qrs.reduce((s, q) => s + q.scorePercent, 0) /
        qrs.length
    );
  }, [account.quizResults]);

  const totalMins = useMemo(
    () =>
      Object.values(account.activityByDate || {}).reduce((a, b) => a + b, 0),
    [account.activityByDate]
  );

  const openEditProfile = () => {
    setNameDraft(account.name);
    setLevelDraft(account.level);
    setCustomTitleDraft(account.profileTitle);
    setEditModalVisible(true);
  };

  const saveEditProfile = async () => {
    await updateAccount({
      name: nameDraft.trim() || 'Alex Rivera',
      level: levelDraft,
      profileTitle: customTitleDraft.trim() || 'Focused Learner',
    });
    setEditModalVisible(false);
    showMessage('Profile Updated', 'Your student profile changes are saved.');
  };

  const handleCreateAccount = async () => {
    if (!newAccName.trim()) {
      showMessage('Name Required', 'Enter a student name for the new profile.');
      return;
    }
    const created = await createAccount({
      name: newAccName.trim(),
      level: newAccLevel,
      themeId: activeTheme.id,
      presetAvatarId: (accounts.length + 1) % 12,
      darkMode: account.darkMode,
    });
    setNewAccName('');
    setAccountModalVisible(false);
    showMessage(
      'Switched Account',
      `Now signed in as ${created.name} (${created.level}).`
    );
  };

  const handleLogout = () => {
    confirmAction(
      'Log Out to Onboarding?',
      'Your local profiles, schedules, and quiz history remain safely stored offline.',
      'Log Out',
      async () => {
        await logoutToOnboarding();
        router.replace('/onboarding');
      }
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Profile Banner with Large Anime Avatar, Level, Title & Stats */}
        <DepthCard
          variant="color"
          gradientColors={[activeTheme.primary, activeTheme.secondary]}
          style={styles.profileHero}
        >
          <View style={styles.heroTopActions}>
            <SmoothPressable
              onPress={() => setAccountModalVisible(true)}
              style={styles.accountSwitchPill}
            >
              <Ionicons name="people" size={14} color="#FFFFFF" />
              <Text style={styles.accountSwitchText}>
                Switch Account ({accounts.length})
              </Text>
              <Ionicons name="chevron-down" size={13} color="#FFFFFF" />
            </SmoothPressable>

            <View style={styles.heroIconsRight}>
              <SmoothPressable
                onPress={() =>
                  showMessage(
                    'Offline Storage Active',
                    'All schedules, tasks, flashcards, files, and progress remain 100% available offline on this device.'
                  )
                }
                accessibilityLabel="Local storage status"
                style={styles.heroIconBtn}
              >
                <Ionicons name="cloud-offline" size={17} color="#FFFFFF" />
              </SmoothPressable>
              <SmoothPressable
                onPress={() => router.push('/settings' as Href)}
                accessibilityRole="button"
                accessibilityLabel="Open Settings & Account"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.heroIconBtn}
              >
                <Ionicons name="settings" size={18} color="#FFFFFF" />
              </SmoothPressable>
            </View>
          </View>

          <View style={styles.avatarCenterBlock}>
            <SmoothPressable onPress={() => setStudioVisible(true)}>
              <UserAvatar size={112} />
            </SmoothPressable>

            <Text style={styles.studentName}>{account.name}</Text>

            <View style={styles.badgesRow}>
              <View style={styles.titlePill}>
                <Ionicons name="ribbon" size={13} color="#FCD34D" />
                <Text style={styles.titlePillText}>
                  {account.profileTitle}
                </Text>
              </View>
              <View style={styles.levelHeroPill}>
                <Text style={styles.levelHeroPillText}>{account.level}</Text>
              </View>
            </View>
          </View>

          {/* Academic Statistics Bar */}
          <View style={styles.heroStatsBar}>
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatValue}>{avgScore}%</Text>
              <Text style={styles.heroStatLabel}>Avg Accuracy</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatValue}>
                {account.studyStreak}d
              </Text>
              <Text style={styles.heroStatLabel}>Study Streak</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatValue}>
                {(totalMins / 60).toFixed(1)}h
              </Text>
              <Text style={styles.heroStatLabel}>Total Focus</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatValue}>
                {(account.unlockedAchievementIds || []).length}
              </Text>
              <Text style={styles.heroStatLabel}>Badges</Text>
            </View>
          </View>

          {/* Hero Action Buttons: Edit Profile & Avatar Studio */}
          <View style={styles.heroButtonsRow}>
            <SmoothPressable
              onPress={openEditProfile}
              style={styles.heroWhiteBtn}
            >
              <Ionicons
                name="create"
                size={15}
                color={activeTheme.primary}
              />
              <Text
                style={[
                  styles.heroWhiteBtnText,
                  { color: activeTheme.primary },
                ]}
              >
                Edit Profile
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => setStudioVisible(true)}
              style={styles.heroGlassBtn}
            >
              <Ionicons name="color-palette" size={15} color="#FFFFFF" />
              <Text style={styles.heroGlassBtnText}>
                Open Avatar Studio
              </Text>
            </SmoothPressable>
          </View>
        </DepthCard>

        {/* Lower Profile Customization Surface (Transforms into Deep Navy/Indigo in Dark Mode) */}
        <View
          style={[
            styles.lowerCustomizationSurface,
            {
              backgroundColor: account.darkMode ? '#0D1430' : theme.background,
              borderColor: account.darkMode
                ? 'rgba(99, 102, 241, 0.28)'
                : 'transparent',
            },
          ]}
        >
          {/* 2. Dark Mode & Appearance Toggle */}
          <DepthCard variant="card" style={styles.darkCard}>
            <View style={styles.prefRow}>
              <Icon3D
                name={account.darkMode ? 'moon' : 'sunny'}
                bg={account.darkMode ? '#6366F1' : '#F59E0B'}
                boxSize={42}
                size={20}
              />
              <View style={styles.flex}>
                <Text style={[styles.cardHeading, { color: theme.navy }]}>
                  Deep Navy & Indigo Dark Mode
                </Text>
                <Text
                  style={[styles.cardSub, { color: theme.textSecondary }]}
                >
                  Transforms surfaces & bottom navigation while preserving
                  vivid accents.
                </Text>
              </View>
              <Switch
                value={account.darkMode}
                onValueChange={(val) => void updateAccount({ darkMode: val })}
                trackColor={{ false: '#CBD5E1', true: activeTheme.primary }}
              />
            </View>
          </DepthCard>

          {/* App Language Selector (English & Filipino / Tagalog) */}
          <DepthCard variant="card" style={{ gap: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon3D name="language" bg="#06B6D4" boxSize={40} size={20} radius={12} />
                <View>
                  <Text style={[styles.cardHeading, { color: theme.navy }]}>
                    {t.appLanguage}
                  </Text>
                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                    {t.selectLanguage}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.langCurrentBadge,
                  { backgroundColor: `${activeTheme.primary}18` },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: activeTheme.primary,
                  }}
                >
                  {language === 'fil' ? 'FILIPINO' : 'ENGLISH'}
                </Text>
              </View>
            </View>

            <View style={styles.langButtonsRow}>
              <SmoothPressable
                onPress={() => void setLanguage('en')}
                style={[
                  styles.langOptionCard,
                  {
                    borderColor:
                      language === 'en' ? activeTheme.primary : theme.border,
                    backgroundColor:
                      language === 'en'
                        ? `${activeTheme.primary}14`
                        : theme.surface,
                  },
                ]}
              >
                <Ionicons
                  name={language === 'en' ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={language === 'en' ? activeTheme.primary : theme.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langOptionTitle, { color: theme.navy }]}>
                    English
                  </Text>
                  <Text
                    style={[styles.langOptionDesc, { color: theme.textSecondary }]}
                  >
                    Standard Academic English
                  </Text>
                </View>
              </SmoothPressable>

              <SmoothPressable
                onPress={() => void setLanguage('fil')}
                style={[
                  styles.langOptionCard,
                  {
                    borderColor:
                      language === 'fil' ? activeTheme.primary : theme.border,
                    backgroundColor:
                      language === 'fil'
                        ? `${activeTheme.primary}14`
                        : theme.surface,
                  },
                ]}
              >
                <Ionicons
                  name={language === 'fil' ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={language === 'fil' ? activeTheme.primary : theme.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langOptionTitle, { color: theme.navy }]}>
                    Filipino
                  </Text>
                  <Text
                    style={[styles.langOptionDesc, { color: theme.textSecondary }]}
                  >
                    Wikang Pambansa / Tagalog
                  </Text>
                </View>
              </SmoothPressable>
            </View>
          </DepthCard>

          {/* 3. 12 Color Themes Selector */}
          <DepthCard variant="card" style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardHeading, { color: theme.navy }]}>
                12 Academic Color Themes
              </Text>
              <Text
                style={[
                  styles.activeBadgeText,
                  { color: activeTheme.primary },
                ]}
              >
                {activeTheme.name}
              </Text>
            </View>

            <View style={styles.themesGrid}>
              {COLOR_THEMES.map((t) => {
                const selected = account.themeId === t.id;
                return (
                  <SmoothPressable
                    key={t.id}
                    onPress={() => void updateAccount({ themeId: t.id })}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: theme.surface,
                        borderColor: selected ? t.primary : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.themeSwatch,
                        { backgroundColor: t.primary },
                      ]}
                    />
                    <Text
                      numberOfLines={1}
                      style={[styles.themeName, { color: theme.navy }]}
                    >
                      {t.name}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>
          </DepthCard>

          {/* 4. 12 Anime Preset Avatars + Custom Avatar Studio Launcher */}
          <DepthCard variant="card" style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardHeading, { color: theme.navy }]}>
                12 Anime Preset Avatars
              </Text>
              <SmoothPressable onPress={() => setStudioVisible(true)}>
                <Text
                  style={[
                    styles.activeBadgeText,
                    { color: activeTheme.primary },
                  ]}
                >
                  Custom Studio →
                </Text>
              </SmoothPressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarsRow}
            >
              {ANIME_PRESET_AVATARS.map((av) => {
                const selected =
                  !account.useCustomAvatar &&
                  account.presetAvatarId === av.id;
                return (
                  <SmoothPressable
                    key={av.id}
                    onPress={() => void selectPresetAvatar(av.id)}
                    style={[
                      styles.presetAvatarCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <UserAvatar avatarId={av.id} size={56} />
                    <Text
                      style={[
                        styles.presetAvatarName,
                        { color: theme.navy },
                      ]}
                    >
                      {av.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.presetAvatarTitle,
                        { color: theme.textMuted },
                      ]}
                    >
                      {av.title}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </ScrollView>
          </DepthCard>

          {/* 5. Profile Title & Study Mode Selectors */}
          <DepthCard variant="card" style={{ gap: 12 }}>
            <Text style={[styles.cardHeading, { color: theme.navy }]}>
              Scholar Profile Title
            </Text>
            <View style={styles.wrapChips}>
              {PROFILE_TITLES.map((pt) => {
                const selected = account.profileTitle === pt;
                return (
                  <SmoothPressable
                    key={pt}
                    onPress={() => void updateAccount({ profileTitle: pt })}
                    style={[
                      styles.titleChip,
                      {
                        backgroundColor: selected
                          ? activeTheme.primary
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.titleChipText,
                        { color: selected ? '#FFFFFF' : theme.navy },
                      ]}
                    >
                      {pt}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>

            <Text
              style={[
                styles.cardHeading,
                { color: theme.navy, marginTop: 4 },
              ]}
            >
              Preferred Study Mode
            </Text>
            <View style={styles.wrapChips}>
              {STUDY_MODES.map((sm) => {
                const selected = account.studyMode === sm.id;
                return (
                  <SmoothPressable
                    key={sm.id}
                    onPress={() => void updateAccount({ studyMode: sm.id })}
                    style={[
                      styles.titleChip,
                      {
                        backgroundColor: selected
                          ? '#10B981'
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.titleChipText,
                        { color: selected ? '#FFFFFF' : theme.navy },
                      ]}
                    >
                      {sm.label} ({sm.focusMin}m)
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>
          </DepthCard>

          {/* 6. Five Account-Specific Preference Toggles */}
          <DepthCard variant="card" style={{ gap: 12 }}>
            <Text style={[styles.cardHeading, { color: theme.navy }]}>
              Notifications & Study Preferences
            </Text>

            {PREFERENCE_TOGGLES.map((pref) => (
              <View key={pref.key} style={styles.prefRow}>
                <Icon3D
                  name={pref.icon}
                  bg={pref.color}
                  boxSize={36}
                  size={17}
                />
                <View style={styles.flex}>
                  <Text style={[styles.prefTitle, { color: theme.navy }]}>
                    {pref.label}
                  </Text>
                  <Text
                    style={[styles.prefDesc, { color: theme.textSecondary }]}
                  >
                    {pref.desc}
                  </Text>
                </View>
                <Switch
                  value={Boolean(account.preferences?.[pref.key])}
                  onValueChange={() => void togglePreference(pref.key)}
                  trackColor={{ false: '#CBD5E1', true: activeTheme.primary }}
                />
              </View>
            ))}
          </DepthCard>

          {/* 7. Multi-Account Switcher, Data & Storage Controls, and Logout */}
          <DepthCard variant="card" style={{ gap: 10 }}>
            <Text style={[styles.cardHeading, { color: theme.navy }]}>
              Accounts, Offline Storage & Backup
            </Text>

            <SmoothPressable
              onPress={() => setAccountModalVisible(true)}
              style={[
                styles.menuRowBtn,
                { backgroundColor: theme.surface },
              ]}
            >
              <Icon3D
                name="people"
                bg={activeTheme.primary}
                boxSize={36}
                size={17}
              />
              <View style={styles.flex}>
                <Text style={[styles.menuRowTitle, { color: theme.navy }]}>
                  Switch or Create Student Account
                </Text>
                <Text
                  style={[
                    styles.menuRowSub,
                    { color: theme.textSecondary },
                  ]}
                >
                  {accounts.length} local profiles with separate schedules &
                  progress
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textMuted}
              />
            </SmoothPressable>

            <SmoothPressable
              onPress={() => router.push('/settings' as Href)}
              style={[
                styles.menuRowBtn,
                { backgroundColor: theme.surface },
              ]}
            >
              <Icon3D
                name="cloud-upload"
                bg="#10B981"
                boxSize={36}
                size={17}
              />
              <View style={styles.flex}>
                <Text style={[styles.menuRowTitle, { color: theme.navy }]}>
                  Data, Backup & Offline Storage Controls
                </Text>
                <Text
                  style={[
                    styles.menuRowSub,
                    { color: theme.textSecondary },
                  ]}
                >
                  Export JSON backup, restore data, or manage AI settings
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textMuted}
              />
            </SmoothPressable>

            <SmoothPressable
              onPress={handleLogout}
              style={[
                styles.logoutBtn,
                { backgroundColor: 'rgba(239,68,68,0.13)' },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutBtnText}>Log Out of Profile</Text>
            </SmoothPressable>
          </DepthCard>
        </View>
      </ScrollView>

      {/* Custom Avatar Studio Modal */}
      <AvatarStudioModal
        visible={studioVisible}
        onClose={() => setStudioVisible(false)}
      />

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.modalTitle, { color: theme.navy }]}>
                Edit Student Profile
              </Text>
              <SmoothPressable onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.navy} />
              </SmoothPressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                STUDENT NAME
              </Text>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.navy,
                  },
                ]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                CUSTOM PROFILE TITLE
              </Text>
              <TextInput
                value={customTitleDraft}
                onChangeText={setCustomTitleDraft}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.navy,
                  },
                ]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                STUDENT LEVEL
              </Text>
              <View style={styles.wrapChips}>
                {STUDENT_LEVEL_OPTIONS.map((lvl) => {
                  const selected = levelDraft === lvl;
                  return (
                    <SmoothPressable
                      key={lvl}
                      onPress={() => setLevelDraft(lvl)}
                      style={[
                        styles.titleChip,
                        {
                          backgroundColor: selected
                            ? activeTheme.primary
                            : theme.surface,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.titleChipText,
                          { color: selected ? '#FFFFFF' : theme.navy },
                        ]}
                      >
                        {lvl}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </View>
            </View>

            <SmoothPressable
              onPress={() => void saveEditProfile()}
              style={[
                styles.saveModalBtn,
                { backgroundColor: activeTheme.primary },
              ]}
            >
              <Text style={styles.saveModalBtnText}>Save Profile</Text>
            </SmoothPressable>
          </View>
        </View>
      </Modal>

      {/* Multi-Account Switcher Modal */}
      <Modal visible={accountModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.modalTitle, { color: theme.navy }]}>
                Local Student Accounts
              </Text>
              <SmoothPressable onPress={() => setAccountModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.navy} />
              </SmoothPressable>
            </View>

            <View style={{ gap: 8 }}>
              {accounts.map((acc) => {
                const isCurrent = acc.id === account.id;
                return (
                  <SmoothPressable
                    key={acc.id}
                    onPress={() => {
                      void switchAccount(acc.id);
                      setAccountModalVisible(false);
                    }}
                    style={[
                      styles.accRow,
                      {
                        backgroundColor: isCurrent
                          ? `${activeTheme.primary}18`
                          : theme.surface,
                        borderColor: isCurrent
                          ? activeTheme.primary
                          : theme.border,
                      },
                    ]}
                  >
                    <UserAvatar
                      avatarId={acc.presetAvatarId}
                      config={
                        acc.useCustomAvatar ? acc.customAvatar : undefined
                      }
                      size={44}
                    />
                    <View style={styles.flex}>
                      <Text style={[styles.accName, { color: theme.navy }]}>
                        {acc.name}
                      </Text>
                      <Text
                        style={[
                          styles.accMeta,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {acc.level} · {acc.profileTitle}
                      </Text>
                    </View>
                    {isCurrent && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={activeTheme.primary}
                      />
                    )}
                  </SmoothPressable>
                );
              })}
            </View>

            <View
              style={[
                styles.dividerLine,
                { backgroundColor: theme.border },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: theme.navy }]}>
              CREATE ANOTHER STUDENT PROFILE
            </Text>
            <TextInput
              value={newAccName}
              onChangeText={setNewAccName}
              placeholder="New student full name"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.navy,
                },
              ]}
            />

            <View style={styles.wrapChips}>
              {STUDENT_LEVEL_OPTIONS.map((lvl) => {
                const selected = newAccLevel === lvl;
                return (
                  <SmoothPressable
                    key={lvl}
                    onPress={() => setNewAccLevel(lvl)}
                    style={[
                      styles.titleChip,
                      {
                        backgroundColor: selected
                          ? activeTheme.primary
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.titleChipText,
                        { color: selected ? '#FFFFFF' : theme.navy },
                      ]}
                    >
                      {lvl}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>

            <SmoothPressable
              onPress={() => void handleCreateAccount()}
              style={[
                styles.saveModalBtn,
                { backgroundColor: activeTheme.primary },
              ]}
            >
              <Ionicons name="person-add" size={16} color="#FFFFFF" />
              <Text style={styles.saveModalBtnText}>
                Create & Switch Profile
              </Text>
            </SmoothPressable>
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
  profileHero: {
    padding: 18,
    gap: 14,
  },
  heroTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,23,42,0.28)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  accountSwitchText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  heroIconsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  heroIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCenterBlock: {
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  titlePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  levelHeroPill: {
    backgroundColor: 'rgba(15,23,42,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  levelHeroPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  heroStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15,23,42,0.24)',
    paddingVertical: 11,
    borderRadius: 16,
  },
  heroStatCol: {
    alignItems: 'center',
    gap: 2,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroWhiteBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroWhiteBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  heroGlassBtn: {
    flex: 1.2,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroGlassBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  lowerCustomizationSurface: {
    borderRadius: 26,
    gap: 14,
  },
  darkCard: {
    padding: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeading: {
    fontSize: 15.5,
    fontWeight: '900',
  },
  cardSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeOption: {
    width: '31%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderRadius: 12,
  },
  themeSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeName: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  avatarsRow: {
    gap: 10,
    paddingVertical: 2,
  },
  presetAvatarCard: {
    width: 92,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    alignItems: 'center',
    gap: 3,
  },
  presetAvatarName: {
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 2,
  },
  presetAvatarTitle: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  wrapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  titleChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  titleChipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prefTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  prefDesc: {
    fontSize: 11.5,
    marginTop: 1,
  },
  menuRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 15,
  },
  menuRowTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  menuRowSub: {
    fontSize: 11,
    marginTop: 1,
  },
  logoutBtn: {
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13.5,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,15,36,0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  saveModalBtn: {
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  accRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  accName: {
    fontSize: 14,
    fontWeight: '800',
  },
  accMeta: {
    fontSize: 11.5,
  },
  dividerLine: {
    height: 1,
    marginVertical: 2,
  },
  langCurrentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  langButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  langOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  langOptionDesc: {
    fontSize: 10.5,
    marginTop: 1,
  },
});
