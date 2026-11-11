import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
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
  ACADEMIC_ACHIEVEMENTS,
  PROFILE_TITLES,
  type StudentLevel,
} from '@/data/orasorasData';
import { useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';

const STUDENT_LEVEL_OPTIONS: StudentLevel[] = [
  'Junior High School',
  'Senior High School',
  'College',
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
    logoutToOnboarding,
  } = useOras();

  const [studioVisible, setStudioVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  // Edit Profile Modal state
  const [nameDraft, setNameDraft] = useState(account.name);
  const [usernameDraft, setUsernameDraft] = useState(account.username || 'alex_rivera');
  const [schoolDraft, setSchoolDraft] = useState(
    account.schoolName || 'Philippine Science High School'
  );
  const [levelDraft, setLevelDraft] = useState<StudentLevel>(account.level);
  const [customTitleDraft, setCustomTitleDraft] = useState(account.profileTitle);

  // New Account Modal state
  const [newAccName, setNewAccName] = useState('');
  const [newAccLevel, setNewAccLevel] = useState<StudentLevel>('College');

  const avgScore = useMemo(() => {
    const qrs = account.quizResults || [];
    if (qrs.length === 0) return 91;
    return Math.round(
      qrs.reduce((s, q) => s + q.scorePercent, 0) / qrs.length
    );
  }, [account.quizResults]);

  const totalMins = useMemo(
    () =>
      Object.values(account.activityByDate || {}).reduce((a, b) => a + b, 0),
    [account.activityByDate]
  );

  const openEditProfile = () => {
    setNameDraft(account.name);
    setUsernameDraft(account.username || 'alex_rivera');
    setSchoolDraft(account.schoolName || 'Philippine Science High School');
    setLevelDraft(account.level);
    setCustomTitleDraft(account.profileTitle);
    setEditModalVisible(true);
  };

  const saveEditProfile = async () => {
    await updateAccount({
      name: nameDraft.trim() || 'Alex Rivera',
      username: usernameDraft.trim().replace(/^@/, '') || 'alex_rivera',
      schoolName: schoolDraft.trim() || 'Philippine Science High School',
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
        {/* 1. Hero Profile Banner with Anime Avatar, Identity, Stats & Actions */}
        <DepthCard
          variant="color"
          gradientColors={[activeTheme.primary, activeTheme.secondary]}
          style={styles.profileHero}
        >
          <View style={styles.heroTopActions}>
            <SmoothPressable
              onPress={() => setAccountModalVisible(true)}
              style={styles.accountSwitchPill}
              accessibilityLabel="Switch active account"
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
            <Text style={styles.studentUsername}>
              @{account.username || 'alex_rivera'}
            </Text>

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

        {/* Lower Profile Surface — Focused purely on Identity, Progress & Achievements */}
        <View style={styles.lowerCustomizationSurface}>
          {/* 1. Student Identity & Credentials */}
          <DepthCard variant="card" style={{ gap: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon3D name="id-card" bg={activeTheme.primary} boxSize={38} size={18} />
                <View>
                  <Text style={[styles.cardHeading, { color: theme.navy }]}>
                    Student Identity & Credentials
                  </Text>
                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                    Verified offline student account
                  </Text>
                </View>
              </View>
              <SmoothPressable
                onPress={openEditProfile}
                style={[
                  styles.smallEditBadge,
                  {
                    backgroundColor: `${activeTheme.primary}18`,
                    borderColor: `${activeTheme.primary}35`,
                  },
                ]}
              >
                <Ionicons name="pencil" size={12} color={activeTheme.primary} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: activeTheme.primary }}>
                  Edit
                </Text>
              </SmoothPressable>
            </View>

            <View style={styles.credentialGrid}>
              <View
                style={[
                  styles.credentialItem,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
                  USERNAME
                </Text>
                <Text
                  style={[styles.credentialValue, { color: theme.navy }]}
                  numberOfLines={1}
                >
                  @{account.username || 'alex_rivera'}
                </Text>
              </View>

              <View
                style={[
                  styles.credentialItem,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
                  STUDENT ID
                </Text>
                <Text
                  style={[styles.credentialValue, { color: theme.navy }]}
                  numberOfLines={1}
                >
                  ORA-2026-
                  {account.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'STD'}
                </Text>
              </View>

              <View
                style={[
                  styles.credentialItem,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
                  INSTITUTION
                </Text>
                <Text
                  style={[styles.credentialValue, { color: theme.navy }]}
                  numberOfLines={1}
                >
                  {account.schoolName || 'Philippine Science High School'}
                </Text>
              </View>

              <View
                style={[
                  styles.credentialItem,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
                  ACADEMIC LEVEL
                </Text>
                <Text
                  style={[styles.credentialValue, { color: theme.navy }]}
                  numberOfLines={1}
                >
                  {account.level}
                </Text>
              </View>

              <View
                style={[
                  styles.credentialItemFull,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
                    SCHOLAR STATUS
                  </Text>
                  <View style={styles.verifiedPill}>
                    <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                    <Text style={styles.verifiedPillText}>Offline Synchronized</Text>
                  </View>
                </View>
                <Text style={[styles.credentialValue, { color: theme.navy, marginTop: 4 }]}>
                  Active Scholar · Good Academic Standing · Local Database Active
                </Text>
              </View>
            </View>
          </DepthCard>

          {/* 2. Academic Focus & Statistics Overview */}
          <DepthCard variant="card" style={{ gap: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon3D name="bar-chart" bg="#10B981" boxSize={38} size={18} />
                <View>
                  <Text style={[styles.cardHeading, { color: theme.navy }]}>
                    Academic Statistics & Focus
                  </Text>
                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                    Progress tracked across modules and timers
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsSummaryGrid}>
              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="flame" size={20} color="#EF4444" />
                <Text style={[styles.statBoxNum, { color: theme.navy }]}>
                  {account.studyStreak} Days
                </Text>
                <Text style={[styles.statBoxTitle, { color: theme.textSecondary }]}>
                  Study Streak
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="time" size={20} color="#3B82F6" />
                <Text style={[styles.statBoxNum, { color: theme.navy }]}>
                  {(totalMins / 60).toFixed(1)} Hours
                </Text>
                <Text style={[styles.statBoxTitle, { color: theme.textSecondary }]}>
                  Total Focus Time
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="trophy" size={20} color="#F59E0B" />
                <Text style={[styles.statBoxNum, { color: theme.navy }]}>
                  {avgScore}%
                </Text>
                <Text style={[styles.statBoxTitle, { color: theme.textSecondary }]}>
                  Quiz Accuracy
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="checkmark-done-circle" size={20} color="#10B981" />
                <Text style={[styles.statBoxNum, { color: theme.navy }]}>
                  {account.requirements.filter((r) => r.completed).length}/
                  {account.requirements.length}
                </Text>
                <Text style={[styles.statBoxTitle, { color: theme.textSecondary }]}>
                  Completed Tasks
                </Text>
              </View>
            </View>
          </DepthCard>

          {/* 3. Badges & Achievements Showcase */}
          <DepthCard variant="card" style={{ gap: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon3D name="ribbon" bg="#F59E0B" boxSize={38} size={18} />
                <View>
                  <Text style={[styles.cardHeading, { color: theme.navy }]}>
                    Badges & Achievements
                  </Text>
                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                    Earned through consistent academic milestones
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.badgeCountPill,
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
                  {(account.unlockedAchievementIds || []).length}/
                  {ACADEMIC_ACHIEVEMENTS.length}
                </Text>
              </View>
            </View>

            <View style={styles.achievementsRowWrap}>
              {ACADEMIC_ACHIEVEMENTS.map((ach) => {
                const unlocked = (account.unlockedAchievementIds || []).includes(
                  ach.id
                );
                return (
                  <View
                    key={ach.id}
                    style={[
                      styles.achievementCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: unlocked ? ach.color : theme.border,
                        opacity: unlocked ? 1 : 0.45,
                      },
                      unlocked && { borderWidth: 1.5 },
                    ]}
                  >
                    <View
                      style={[
                        styles.achIconBubble,
                        { backgroundColor: `${ach.color}20` },
                      ]}
                    >
                      <Ionicons
                        name={ach.icon as any}
                        size={18}
                        color={ach.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.achTitle, { color: theme.navy }]}
                        numberOfLines={1}
                      >
                        {ach.title}
                      </Text>
                      <Text
                        style={[styles.achDesc, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {ach.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.achXpBadge,
                        { backgroundColor: `${ach.color}18` },
                      ]}
                    >
                      <Text style={[styles.achXpText, { color: ach.color }]}>
                        +{ach.xpReward} XP
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </DepthCard>

          {/* 4. Settings & Account Entry Banner */}
          <DepthCard variant="card" style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon3D name="settings" bg="#06B6D4" boxSize={38} size={18} />
                <View>
                  <Text style={[styles.cardHeading, { color: theme.navy }]}>
                    Settings & Account Center
                  </Text>
                  <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                    Preferences, Themes, Language & Avatars
                  </Text>
                </View>
              </View>
            </View>

            <Text style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 18 }}>
              Manage App Language (EN/FIL), 12 Academic Themes, 12 Anime Avatars, Notifications, Pomodoro durations, and account security inside Settings.
            </Text>

            <SmoothPressable
              onPress={() => router.push('/settings' as Href)}
              style={[
                styles.openSettingsBtn,
                { backgroundColor: activeTheme.primary },
              ]}
            >
              <Ionicons name="settings-sharp" size={16} color="#FFFFFF" />
              <Text style={styles.openSettingsBtnText}>Open Settings & Account</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </SmoothPressable>
          </DepthCard>

          {/* 5. Account Switcher & Logout */}
          <DepthCard variant="card" style={{ gap: 10 }}>
            <Text style={[styles.cardHeading, { color: theme.navy }]}>
              Account Management
            </Text>

            <SmoothPressable
              onPress={() => setAccountModalVisible(true)}
              style={[
                styles.menuRowBtn,
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
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
                  {accounts.length} local profiles with separate schedules & progress
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

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12 }}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                    STUDENT NAME
                  </Text>
                  <TextInput
                    value={nameDraft}
                    onChangeText={setNameDraft}
                    placeholder="Student full name"
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
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                    USERNAME
                  </Text>
                  <TextInput
                    value={usernameDraft}
                    onChangeText={setUsernameDraft}
                    placeholder="e.g. alex_rivera"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
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
                    INSTITUTION / CAMPUS
                  </Text>
                  <TextInput
                    value={schoolDraft}
                    onChangeText={setSchoolDraft}
                    placeholder="School or University"
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
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                    CUSTOM PROFILE TITLE
                  </Text>
                  <TextInput
                    value={customTitleDraft}
                    onChangeText={setCustomTitleDraft}
                    placeholder="e.g. Focused Learner"
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
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                    QUICK TITLES
                  </Text>
                  <View style={styles.wrapChips}>
                    {PROFILE_TITLES.map((pt) => {
                      const selected = customTitleDraft === pt;
                      return (
                        <SmoothPressable
                          key={pt}
                          onPress={() => setCustomTitleDraft(pt)}
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
              </View>
            </ScrollView>

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
    gap: 4,
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  studentUsername: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 2,
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
  smallEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  credentialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  credentialItem: {
    width: '48.5%',
    flexGrow: 1,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  credentialItemFull: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  credentialLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  credentialValue: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  statsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    width: '48.5%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statBoxNum: {
    fontSize: 15,
    fontWeight: '900',
  },
  statBoxTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeCountPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  achievementsRowWrap: {
    gap: 8,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  achIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  achDesc: {
    fontSize: 10.5,
    marginTop: 1,
  },
  achXpBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  achXpText: {
    fontSize: 10,
    fontWeight: '800',
  },
  openSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 13,
    marginTop: 4,
  },
  openSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
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
  saveModalBtn: {
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
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
});
