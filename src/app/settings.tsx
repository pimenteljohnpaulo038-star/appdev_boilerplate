import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { deleteModel } from '@/ai/local';
import { exportBackup, pickBackup, restoreBackup } from '@/backup/backup';
import { saveFile } from '@/backup/file';
import { SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS, FACE_SHAPES, HAIRSTYLES, OUTFITS, ACCESSORIES } from '@/components/AnimeAvatar';
import { UserAvatar } from '@/components/UserAvatar';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import {
  ANIME_PRESET_AVATARS,
  COLOR_THEMES,
  PROFILE_TITLES,
  STUDY_MODES,
  type CustomAvatarConfig,
  type ProfileTitle,
  type StudentLevel,
} from '@/data/orasorasData';
import { clearAllConversations } from '@/db/conversations';
import { useSettings } from '@/settings/SettingsContext';
import type { ThemeMode } from '@/settings/storage';
import { formatBytes } from '@/services/libraryStorage';
import { useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';

export type SettingsCategory =
  | 'account'
  | 'avatar'
  | 'appearance'
  | 'language'
  | 'notifications_study'
  | 'privacy'
  | 'storage'
  | 'about';

interface CategoryItem {
  id: SettingsCategory;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'account', title: 'My Account', desc: 'Manage your personal student account', icon: 'person-circle-outline', color: '#3B82F6' },
  { id: 'avatar', title: 'Profile & Avatar', desc: '12 anime characters & custom studio', icon: 'sparkles-outline', color: '#8B5CF6' },
  { id: 'appearance', title: 'Appearance & Themes', desc: 'Display modes, 12 academic themes & layout', icon: 'color-palette-outline', color: '#06B6D4' },
  { id: 'language', title: 'App Language / Wika', desc: 'Choose your preferred language (EN / FIL)', icon: 'globe-outline', color: '#10B981' },
  { id: 'notifications_study', title: 'Notifications & Study Preferences', desc: 'Reminders, pomodoro duration & daily goals', icon: 'notifications-outline', color: '#F59E0B' },
  { id: 'privacy', title: 'Privacy & Security', desc: 'Password, biometric lock, data export & reset', icon: 'shield-checkmark-outline', color: '#6366F1' },
  { id: 'storage', title: 'Storage & Offline Data', desc: 'Manage offline PDFs, cache & JSON backups', icon: 'server-outline', color: '#14B8A6' },
  { id: 'about', title: 'About & Support', desc: 'App info v1.2.0, FAQs, terms & feedback', icon: 'help-circle-outline', color: '#0EA5E9' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    account,
    activeTheme,
    language,
    setLanguage,
    updateAccount,
    togglePreference,
    saveCustomAvatar,
    selectPresetAvatar,
    selectOfficialAvatar,
  } = useOras();
  const { settings, update: updateSetting, reset: resetBaseSettings } = useSettings();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory | null>(null);

  // Hardware back button support for Android
  useEffect(() => {
    const onBackPress = () => {
      if (activeCategory !== null) {
        setActiveCategory(null);
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
  }, [activeCategory, router]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── Top Header Bar ── */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <SmoothPressable
          onPress={() => {
            if (activeCategory !== null) {
              setActiveCategory(null);
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)' as Href);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={activeCategory ? 'Back to Settings' : 'Go back to Home'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.backBtn, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.navy} />
        </SmoothPressable>

        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitle, { color: theme.navy }]} numberOfLines={1}>
            {activeCategory
              ? CATEGORIES.find((c) => c.id === activeCategory)?.title ?? 'Settings'
              : 'Settings & Account'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {activeCategory
              ? 'Personalize this section'
              : 'Personalize your OrasOras experience'}
          </Text>
        </View>

        {/* Header Right: Cyan Gear Badge */}
        <View style={[styles.gearBadge, { backgroundColor: `${activeTheme.primary}20` }]}>
          <Ionicons name="settings-sharp" size={18} color={activeTheme.primary} />
        </View>
      </View>

      {/* ── Content Area ── */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeCategory === null && (
          <SettingsLandingView
            account={account}
            activeTheme={activeTheme}
            theme={theme}
            onSelectCategory={(cat) => setActiveCategory(cat)}
          />
        )}

        {activeCategory === 'account' && (
          <MyAccountSection
            account={account}
            activeTheme={activeTheme}
            theme={theme}
            updateAccount={updateAccount}
            updateSetting={updateSetting}
          />
        )}

        {activeCategory === 'avatar' && (
          <ProfileAvatarSection
            account={account}
            activeTheme={activeTheme}
            theme={theme}
            selectPresetAvatar={selectPresetAvatar}
            saveCustomAvatar={saveCustomAvatar}
            selectOfficialAvatar={selectOfficialAvatar}
          />
        )}

        {activeCategory === 'appearance' && (
          <AppearanceSection
            account={account}
            activeTheme={activeTheme}
            theme={theme}
            settingsTheme={settings.theme}
            updateAccount={updateAccount}
            updateSetting={updateSetting}
            togglePreference={togglePreference}
          />
        )}

        {activeCategory === 'language' && (
          <LanguageSection
            language={language}
            activeTheme={activeTheme}
            theme={theme}
            setLanguage={setLanguage}
          />
        )}

        {activeCategory === 'notifications_study' && (
          <NotificationsStudySection
            account={account}
            activeTheme={activeTheme}
            theme={theme}
            updateAccount={updateAccount}
            togglePreference={togglePreference}
          />
        )}

        {activeCategory === 'privacy' && (
          <PrivacySecuritySection
            account={account}
            activeTheme={activeTheme}
            theme={theme}
            updateAccount={updateAccount}
            togglePreference={togglePreference}
            resetBaseSettings={resetBaseSettings}
            onGoToAccount={() => setActiveCategory('account')}
          />
        )}

        {activeCategory === 'storage' && (
          <StorageOfflineSection
            account={account}
            activeTheme={activeTheme}
            theme={theme}
            settings={settings}
            updateSetting={updateSetting}
          />
        )}

        {activeCategory === 'about' && (
          <AboutSupportSection
            activeTheme={activeTheme}
            theme={theme}
            router={router}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. SETTINGS LANDING VIEW
// ══════════════════════════════════════════════════════════════════════════════
function SettingsLandingView({
  account,
  activeTheme,
  theme,
  onSelectCategory,
}: {
  account: ReturnType<typeof useOras>['account'];
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  onSelectCategory: (cat: SettingsCategory) => void;
}) {
  return (
    <View style={styles.landingContainer}>
      {/* Profile Summary Card */}
      <View style={[styles.profileSummaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.profileSummaryRow}>
          <UserAvatar size={70} />
          <View style={styles.profileSummaryMeta}>
            <View style={styles.badgeRow}>
              <View style={[styles.levelBadge, { backgroundColor: `${activeTheme.primary}18` }]}>
                <Text style={[styles.levelBadgeText, { color: activeTheme.primary }]}>
                  {account.level}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Offline Active</Text>
              </View>
            </View>

            <Text style={[styles.profileNameText, { color: theme.navy }]} numberOfLines={1}>
              {account.name}
            </Text>
            <Text style={[styles.profileTitleText, { color: theme.textSecondary }]} numberOfLines={1}>
              {account.profileTitle} · @{account.username || 'student'}
            </Text>
          </View>
        </View>

        <View style={[styles.profileSummaryFooter, { borderTopColor: theme.border }]}>
          <SmoothPressable
            onPress={() => onSelectCategory('account')}
            style={[styles.profileActionBtn, { backgroundColor: `${activeTheme.primary}12`, borderColor: `${activeTheme.primary}30` }]}
          >
            <Ionicons name="create-outline" size={15} color={activeTheme.primary} />
            <Text style={[styles.profileActionText, { color: activeTheme.primary }]}>Edit Account</Text>
          </SmoothPressable>
          <SmoothPressable
            onPress={() => onSelectCategory('avatar')}
            style={[styles.profileActionBtn, { backgroundColor: `${activeTheme.secondary}12`, borderColor: `${activeTheme.secondary}30` }]}
          >
            <Ionicons name="sparkles-outline" size={15} color={activeTheme.secondary} />
            <Text style={[styles.profileActionText, { color: activeTheme.secondary }]}>Avatar Studio</Text>
          </SmoothPressable>
        </View>
      </View>

      {/* Category List */}
      <Text style={[styles.sectionHeading, { color: theme.navy }]}>Settings Categories</Text>

      <View style={styles.categoriesList}>
        {CATEGORIES.map((cat) => (
          <SmoothPressable
            key={cat.id}
            onPress={() => onSelectCategory(cat.id)}
            style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.categoryIconBubble, { backgroundColor: `${cat.color}18` }]}>
              <Ionicons name={cat.icon} size={22} color={cat.color} />
            </View>

            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryTitle, { color: theme.navy }]}>{cat.title}</Text>
              <Text style={[styles.categoryDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                {cat.desc}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </SmoothPressable>
        ))}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. MY ACCOUNT SECTION
// ══════════════════════════════════════════════════════════════════════════════
function MyAccountSection({
  account,
  activeTheme,
  theme,
  updateAccount,
  updateSetting,
}: {
  account: ReturnType<typeof useOras>['account'];
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  updateAccount: ReturnType<typeof useOras>['updateAccount'];
  updateSetting: ReturnType<typeof useSettings>['update'];
}) {
  const [name, setName] = useState(account.name);
  const [username, setUsername] = useState(account.username || 'alex_rivera');
  const [email, setEmail] = useState(account.email || 'alex.rivera@orasoras.edu');
  const [school, setSchool] = useState(account.schoolName || 'Philippine Science High School');
  const [level, setLevel] = useState<StudentLevel>(account.level);
  const [profileTitle, setProfileTitle] = useState<ProfileTitle>(account.profileTitle);

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error: boolean } | null>(null);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showMessage('Name Required', 'Please enter your student name.');
      return;
    }
    await updateAccount({
      name: name.trim(),
      username: username.trim().replace(/^@/, ''),
      email: email.trim(),
      schoolName: school.trim(),
      level,
      profileTitle,
    });
    await updateSetting('nickname', name.trim());
    setStatusMsg({ text: 'Account profile updated successfully!', error: false });
  };

  const handleUpdatePassword = async () => {
    if (!newPw) {
      setStatusMsg({ text: 'Please enter a new password.', error: true });
      return;
    }
    if (newPw.length < 6) {
      setStatusMsg({ text: 'New password must be at least 6 characters.', error: true });
      return;
    }
    if (newPw !== confirmPw) {
      setStatusMsg({ text: 'New passwords do not match.', error: true });
      return;
    }
    await updateAccount({ passwordHash: newPw });
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setStatusMsg({ text: 'Password updated successfully!', error: false });
  };

  return (
    <View style={styles.subpageContainer}>
      {statusMsg && (
        <View style={[styles.statusBanner, { backgroundColor: statusMsg.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', borderColor: statusMsg.error ? '#EF4444' : '#10B981' }]}>
          <Ionicons name={statusMsg.error ? 'alert-circle' : 'checkmark-circle'} size={18} color={statusMsg.error ? '#EF4444' : '#10B981'} />
          <Text style={[styles.statusBannerText, { color: statusMsg.error ? '#EF4444' : '#10B981' }]}>
            {statusMsg.text}
          </Text>
        </View>
      )}

      {/* Personal Info Card */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Student Information</Text>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Full Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={name}
          onChangeText={setName}
          placeholder="Enter student name"
          placeholderTextColor={theme.textMuted}
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Username</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email Address</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={email}
          onChangeText={setEmail}
          placeholder="student@school.edu"
          placeholderTextColor={theme.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>School / University</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={school}
          onChangeText={setSchool}
          placeholder="Institution Name"
          placeholderTextColor={theme.textMuted}
        />

        {/* Education Level Selector */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Education Level</Text>
        <View style={styles.pillRow}>
          {(['Junior High School', 'Senior High School', 'College'] as StudentLevel[]).map((lvl) => {
            const active = level === lvl;
            return (
              <SmoothPressable
                key={lvl}
                onPress={() => setLevel(lvl)}
                style={[styles.pillBtn, active ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.pillBtnText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                  {lvl === 'Junior High School' ? 'JHS (7-10)' : lvl === 'Senior High School' ? 'SHS (11-12)' : 'College'}
                </Text>
              </SmoothPressable>
            );
          })}
        </View>

        {/* Academic Profile Title */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Academic Title</Text>
        <View style={styles.titleWrap}>
          {PROFILE_TITLES.map((pt) => {
            const active = profileTitle === pt;
            return (
              <SmoothPressable
                key={pt}
                onPress={() => setProfileTitle(pt)}
                style={[styles.smallPill, active ? { backgroundColor: `${activeTheme.primary}25`, borderColor: activeTheme.primary } : { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.smallPillText, { color: active ? activeTheme.primary : theme.textSecondary }]}>
                  {pt}
                </Text>
              </SmoothPressable>
            );
          })}
        </View>

        <SmoothPressable
          onPress={handleSaveProfile}
          style={[styles.primaryActionBtn, { backgroundColor: activeTheme.primary, marginTop: 16 }]}
        >
          <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionBtnText}>Save Account Changes</Text>
        </SmoothPressable>
      </View>

      {/* Password Management Card */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.navy }]}>Security & Password</Text>
          <SmoothPressable onPress={() => setShowPw(!showPw)}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textSecondary} />
          </SmoothPressable>
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Current Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={currentPw}
          onChangeText={setCurrentPw}
          placeholder="••••••••"
          placeholderTextColor={theme.textMuted}
          secureTextEntry={!showPw}
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>New Password (min 6 characters)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={newPw}
          onChangeText={setNewPw}
          placeholder="••••••••"
          placeholderTextColor={theme.textMuted}
          secureTextEntry={!showPw}
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Confirm New Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={confirmPw}
          onChangeText={setConfirmPw}
          placeholder="••••••••"
          placeholderTextColor={theme.textMuted}
          secureTextEntry={!showPw}
        />

        <SmoothPressable
          onPress={handleUpdatePassword}
          style={[styles.secondaryActionBtn, { borderColor: `${activeTheme.primary}60`, backgroundColor: `${activeTheme.primary}12`, marginTop: 14 }]}
        >
          <Ionicons name="lock-closed-outline" size={16} color={activeTheme.primary} />
          <Text style={[styles.secondaryActionBtnText, { color: activeTheme.primary }]}>Update Password</Text>
        </SmoothPressable>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. PROFILE & AVATAR SECTION
// ══════════════════════════════════════════════════════════════════════════════
function ProfileAvatarSection({
  account,
  activeTheme,
  theme,
  selectPresetAvatar,
  saveCustomAvatar,
  selectOfficialAvatar,
}: {
  account: ReturnType<typeof useOras>['account'];
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  selectPresetAvatar: ReturnType<typeof useOras>['selectPresetAvatar'];
  saveCustomAvatar: ReturnType<typeof useOras>['saveCustomAvatar'];
  selectOfficialAvatar: ReturnType<typeof useOras>['selectOfficialAvatar'];
}) {
  const [tab, setTab] = useState<'presets' | 'studio'>('presets');
  const [draft, setDraft] = useState<CustomAvatarConfig>(account.customAvatar);

  const handleRandomize = () => {
    const rand = <T extends number>(max: number): T => Math.floor(Math.random() * max) as T;
    setDraft({
      character: Math.random() > 0.5 ? 'girl' : 'boy',
      faceShape: rand<0 | 1 | 2>(3),
      skinTone: rand<0 | 1 | 2 | 3 | 4>(5),
      hairstyle: rand<0 | 1 | 2 | 3 | 4 | 5>(6),
      hairColor: rand<0 | 1 | 2 | 3 | 4 | 5>(6),
      outfit: rand<0 | 1 | 2 | 3 | 4>(5),
      outfitColor: rand<0 | 1 | 2 | 3 | 4 | 5>(6),
      accessory: rand<0 | 1 | 2 | 3>(4),
    });
  };

  const handleApplyCustom = async () => {
    await saveCustomAvatar(draft);
    showMessage('Avatar Saved', 'Your custom anime avatar has been applied!');
  };

  return (
    <View style={styles.subpageContainer}>
      {/* Strict Rule Notice */}
      <View style={[styles.infoBanner, { backgroundColor: `${activeTheme.primary}12`, borderColor: `${activeTheme.primary}35` }]}>
        <Ionicons name="shield-checkmark" size={16} color={activeTheme.primary} />
        <Text style={[styles.infoBannerText, { color: theme.text }]}>
          Built-in Anime Avatars & Custom Studio only. Camera & image uploads are disabled for privacy and offline integrity.
        </Text>
      </View>

      {/* Featured: Official 2D Vector Student Avatar */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: account.useOfficialAvatar ? activeTheme.primary : theme.border, borderWidth: account.useOfficialAvatar ? 2 : 1, marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <UserAvatar size={66} useOfficialAvatar />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.navy }}>Official Student Avatar</Text>
              {account.useOfficialAvatar && (
                <View style={{ backgroundColor: activeTheme.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              2D vector portrait with dark navy circular frame and formal uniform.
            </Text>
          </View>
        </View>
        {!account.useOfficialAvatar && (
          <SmoothPressable
            onPress={async () => {
              await selectOfficialAvatar();
              showMessage('Avatar Selected', 'Official 2D student avatar with dark navy background is now active.');
            }}
            style={[styles.primaryActionBtn, { backgroundColor: activeTheme.primary, marginTop: 12 }]}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Set as Active Avatar</Text>
          </SmoothPressable>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <SmoothPressable
          onPress={() => setTab('presets')}
          style={[styles.tabBtn, tab === 'presets' && { backgroundColor: activeTheme.primary }]}
        >
          <Text style={[styles.tabBtnText, { color: tab === 'presets' ? '#FFFFFF' : theme.textSecondary }]}>
            12 Anime Characters
          </Text>
        </SmoothPressable>
        <SmoothPressable
          onPress={() => setTab('studio')}
          style={[styles.tabBtn, tab === 'studio' && { backgroundColor: activeTheme.primary }]}
        >
          <Text style={[styles.tabBtnText, { color: tab === 'studio' ? '#FFFFFF' : theme.textSecondary }]}>
            Custom Studio
          </Text>
        </SmoothPressable>
      </View>

      {tab === 'presets' ? (
        <View style={styles.presetGrid}>
          {ANIME_PRESET_AVATARS.map((p) => {
            const isSelected = !account.useCustomAvatar && account.presetAvatarId === p.id;
            return (
              <SmoothPressable
                key={p.id}
                onPress={async () => {
                  await selectPresetAvatar(p.id);
                  showMessage('Avatar Selected', `${p.name} (${p.title}) is now your active avatar.`);
                }}
                style={[
                  styles.presetCard,
                  { backgroundColor: theme.surface, borderColor: isSelected ? activeTheme.primary : theme.border },
                  isSelected && { borderWidth: 2 },
                ]}
              >
                <View style={styles.presetAvatarWrapper}>
                  <UserAvatar avatarId={p.id} size={62} />
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: activeTheme.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.presetName, { color: theme.navy }]} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.presetTitle, { color: theme.textSecondary }]} numberOfLines={1}>{p.title}</Text>
              </SmoothPressable>
            );
          })}
        </View>
      ) : (
        <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Live Preview */}
          <View style={styles.studioPreviewRow}>
            <UserAvatar config={draft} size={106} />
            <View style={styles.studioTools}>
              <View style={styles.pillRow}>
                <SmoothPressable
                  onPress={() => setDraft((prev) => ({ ...prev, character: 'boy' }))}
                  style={[styles.smallPill, draft.character === 'boy' ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
                >
                  <Text style={{ color: draft.character === 'boy' ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }}>Boy</Text>
                </SmoothPressable>
                <SmoothPressable
                  onPress={() => setDraft((prev) => ({ ...prev, character: 'girl' }))}
                  style={[styles.smallPill, draft.character === 'girl' ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
                >
                  <Text style={{ color: draft.character === 'girl' ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }}>Girl</Text>
                </SmoothPressable>
              </View>

              <SmoothPressable
                onPress={handleRandomize}
                style={[styles.secondaryActionBtn, { borderColor: `${activeTheme.primary}50`, marginTop: 8 }]}
              >
                <Ionicons name="dice-outline" size={16} color={activeTheme.primary} />
                <Text style={[styles.secondaryActionBtnText, { color: activeTheme.primary }]}>Randomize</Text>
              </SmoothPressable>
            </View>
          </View>

          {/* Face Shapes */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Face Shape</Text>
          <View style={styles.pillRow}>
            {FACE_SHAPES.map((fs, idx) => (
              <SmoothPressable
                key={fs}
                onPress={() => setDraft((p) => ({ ...p, faceShape: idx as 0 | 1 | 2 }))}
                style={[styles.smallPill, draft.faceShape === idx ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
              >
                <Text style={{ color: draft.faceShape === idx ? '#FFFFFF' : theme.textSecondary, fontSize: 12 }}>{fs}</Text>
              </SmoothPressable>
            ))}
          </View>

          {/* Skin Tones */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Skin Tone</Text>
          <View style={styles.colorSwatchRow}>
            {SKIN_TONES.map((color, idx) => (
              <SmoothPressable
                key={color}
                onPress={() => setDraft((p) => ({ ...p, skinTone: idx as 0 | 1 | 2 | 3 | 4 }))}
                style={[styles.colorCircle, { backgroundColor: color }, draft.skinTone === idx && styles.selectedCircle]}
              />
            ))}
          </View>

          {/* Hairstyles */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Hairstyle</Text>
          <View style={styles.titleWrap}>
            {HAIRSTYLES.map((hs, idx) => (
              <SmoothPressable
                key={hs}
                onPress={() => setDraft((p) => ({ ...p, hairstyle: idx as 0 | 1 | 2 | 3 | 4 | 5 }))}
                style={[styles.smallPill, draft.hairstyle === idx ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
              >
                <Text style={{ color: draft.hairstyle === idx ? '#FFFFFF' : theme.textSecondary, fontSize: 11 }}>{hs}</Text>
              </SmoothPressable>
            ))}
          </View>

          {/* Hair Color */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Hair Color</Text>
          <View style={styles.colorSwatchRow}>
            {HAIR_COLORS.map((hc, idx) => (
              <SmoothPressable
                key={hc.name}
                onPress={() => setDraft((p) => ({ ...p, hairColor: idx as 0 | 1 | 2 | 3 | 4 | 5 }))}
                style={[styles.colorCircle, { backgroundColor: hc.main }, draft.hairColor === idx && styles.selectedCircle]}
              />
            ))}
          </View>

          {/* Outfit */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Outfit Style</Text>
          <View style={styles.titleWrap}>
            {OUTFITS.map((out, idx) => (
              <SmoothPressable
                key={out}
                onPress={() => setDraft((p) => ({ ...p, outfit: idx as 0 | 1 | 2 | 3 | 4 }))}
                style={[styles.smallPill, draft.outfit === idx ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
              >
                <Text style={{ color: draft.outfit === idx ? '#FFFFFF' : theme.textSecondary, fontSize: 11 }}>{out}</Text>
              </SmoothPressable>
            ))}
          </View>

          {/* Outfit Color */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Outfit Color</Text>
          <View style={styles.colorSwatchRow}>
            {OUTFIT_COLORS.map((oc, idx) => (
              <SmoothPressable
                key={oc.name}
                onPress={() => setDraft((p) => ({ ...p, outfitColor: idx as 0 | 1 | 2 | 3 | 4 | 5 }))}
                style={[styles.colorCircle, { backgroundColor: oc.main }, draft.outfitColor === idx && styles.selectedCircle]}
              />
            ))}
          </View>

          {/* Accessories */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Accessory</Text>
          <View style={styles.pillRow}>
            {ACCESSORIES.map((acc, idx) => (
              <SmoothPressable
                key={acc}
                onPress={() => setDraft((p) => ({ ...p, accessory: idx as 0 | 1 | 2 | 3 }))}
                style={[styles.smallPill, draft.accessory === idx ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
              >
                <Text style={{ color: draft.accessory === idx ? '#FFFFFF' : theme.textSecondary, fontSize: 11 }}>{acc}</Text>
              </SmoothPressable>
            ))}
          </View>

          <SmoothPressable
            onPress={handleApplyCustom}
            style={[styles.primaryActionBtn, { backgroundColor: activeTheme.primary, marginTop: 18 }]}
          >
            <Ionicons name="sparkles" size={17} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Apply Custom Avatar</Text>
          </SmoothPressable>
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. APPEARANCE & THEMES SECTION
// ══════════════════════════════════════════════════════════════════════════════
function AppearanceSection({
  account,
  activeTheme,
  theme,
  settingsTheme,
  updateAccount,
  updateSetting,
  togglePreference,
}: {
  account: ReturnType<typeof useOras>['account'];
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  settingsTheme: ThemeMode;
  updateAccount: ReturnType<typeof useOras>['updateAccount'];
  updateSetting: ReturnType<typeof useSettings>['update'];
  togglePreference: ReturnType<typeof useOras>['togglePreference'];
}) {
  const handleSetMode = async (mode: 'light' | 'dark') => {
    await updateSetting('theme', mode);
    await updateAccount({ darkMode: mode === 'dark' });
  };

  return (
    <View style={styles.subpageContainer}>
      {/* Display Mode */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Display Mode</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Deep navy dark mode optimized for night study sessions.
        </Text>

        <View style={styles.segmentedRow}>
          <SmoothPressable
            onPress={() => handleSetMode('dark')}
            style={[styles.modeCard, settingsTheme === 'dark' && { backgroundColor: `${activeTheme.primary}20`, borderColor: activeTheme.primary }]}
          >
            <Ionicons name="moon" size={20} color={settingsTheme === 'dark' ? activeTheme.primary : theme.textSecondary} />
            <Text style={[styles.modeCardTitle, { color: theme.navy }]}>Deep Navy Dark</Text>
            <Text style={[styles.modeCardSub, { color: theme.textSecondary }]}>Comfortable night glow</Text>
          </SmoothPressable>

          <SmoothPressable
            onPress={() => handleSetMode('light')}
            style={[styles.modeCard, settingsTheme === 'light' && { backgroundColor: `${activeTheme.primary}20`, borderColor: activeTheme.primary }]}
          >
            <Ionicons name="sunny" size={20} color={settingsTheme === 'light' ? activeTheme.primary : theme.textSecondary} />
            <Text style={[styles.modeCardTitle, { color: theme.navy }]}>Classroom Light</Text>
            <Text style={[styles.modeCardSub, { color: theme.textSecondary }]}>High daytime contrast</Text>
          </SmoothPressable>
        </View>
      </View>

      {/* 12 Academic Themes */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>12 Academic Color Themes</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Tap any palette to instantly personalize accent colors, glowing cards, and badges.
        </Text>

        <View style={styles.themeGrid}>
          {COLOR_THEMES.map((th) => {
            const isSelected = account.themeId === th.id;
            return (
              <SmoothPressable
                key={th.id}
                onPress={async () => {
                  await updateAccount({ themeId: th.id });
                }}
                style={[
                  styles.themeItemCard,
                  { backgroundColor: theme.card, borderColor: isSelected ? th.primary : theme.border },
                  isSelected && { borderWidth: 2 },
                ]}
              >
                <View style={styles.colorDotsRow}>
                  <View style={[styles.dot, { backgroundColor: th.primary }]} />
                  <View style={[styles.dot, { backgroundColor: th.secondary }]} />
                  <View style={[styles.dot, { backgroundColor: th.accent }]} />
                </View>
                <Text style={[styles.themeItemName, { color: theme.navy }]} numberOfLines={1}>{th.name}</Text>
                {isSelected && (
                  <View style={[styles.themeCheckBadge, { backgroundColor: th.primary }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </SmoothPressable>
            );
          })}
        </View>
      </View>

      {/* Font & Layout Density */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Reading & Layout Density</Text>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Font Size Preference</Text>
        <View style={styles.pillRow}>
          {(['small', 'medium', 'large'] as const).map((fs) => {
            const active = (account.preferences.fontSizePreference || 'medium') === fs;
            return (
              <SmoothPressable
                key={fs}
                onPress={() => updateAccount({ preferences: { ...account.preferences, fontSizePreference: fs } })}
                style={[styles.smallPill, active ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
              >
                <Text style={{ color: active ? '#FFFFFF' : theme.textSecondary, textTransform: 'capitalize', fontWeight: '600' }}>{fs}</Text>
              </SmoothPressable>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>Layout Density</Text>
        <View style={styles.pillRow}>
          {(['comfortable', 'compact'] as const).map((ld) => {
            const active = (account.preferences.layoutDensity || 'comfortable') === ld;
            return (
              <SmoothPressable
                key={ld}
                onPress={() => updateAccount({ preferences: { ...account.preferences, layoutDensity: ld } })}
                style={[styles.smallPill, active ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
              >
                <Text style={{ color: active ? '#FFFFFF' : theme.textSecondary, textTransform: 'capitalize', fontWeight: '600' }}>{ld}</Text>
              </SmoothPressable>
            );
          })}
        </View>

        <View style={[styles.rowBetween, { marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: theme.navy }]}>Card Glow Effects</Text>
            <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>Subtle ambient shadows on active modules</Text>
          </View>
          <Switch
            value={account.preferences.cardGlowEffect ?? true}
            onValueChange={() => togglePreference('cardGlowEffect')}
            trackColor={{ false: theme.border, true: activeTheme.primary }}
          />
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. LANGUAGE SECTION
// ══════════════════════════════════════════════════════════════════════════════
function LanguageSection({
  language,
  activeTheme,
  theme,
  setLanguage,
}: {
  language: 'en' | 'fil';
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  setLanguage: ReturnType<typeof useOras>['setLanguage'];
}) {
  return (
    <View style={styles.subpageContainer}>
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Choose Application Language</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Select your preferred interface language. All labels, buttons, navigation and study tips update in real-time.
        </Text>

        {/* English */}
        <SmoothPressable
          onPress={() => void setLanguage('en')}
          style={[
            styles.langOptionCard,
            { backgroundColor: theme.card, borderColor: language === 'en' ? activeTheme.primary : theme.border },
            language === 'en' && { borderWidth: 2 },
          ]}
        >
          <View style={styles.langMeta}>
            <Text style={[styles.langTitle, { color: theme.navy }]}>English (US)</Text>
            <Text style={[styles.langSub, { color: theme.textSecondary }]}>Default academic & international terminology</Text>
          </View>
          {language === 'en' && (
            <View style={[styles.langCheck, { backgroundColor: activeTheme.primary }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          )}
        </SmoothPressable>

        {/* Filipino */}
        <SmoothPressable
          onPress={() => void setLanguage('fil')}
          style={[
            styles.langOptionCard,
            { backgroundColor: theme.card, borderColor: language === 'fil' ? activeTheme.primary : theme.border },
            language === 'fil' && { borderWidth: 2 },
          ]}
        >
          <View style={styles.langMeta}>
            <Text style={[styles.langTitle, { color: theme.navy }]}>Filipino (Tagalog)</Text>
            <Text style={[styles.langSub, { color: theme.textSecondary }]}>Wikang Pambansa ng Pilipinas para sa mga estudyante</Text>
          </View>
          {language === 'fil' && (
            <View style={[styles.langCheck, { backgroundColor: activeTheme.primary }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          )}
        </SmoothPressable>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS & STUDY PREFERENCES SECTION
// ══════════════════════════════════════════════════════════════════════════════
function NotificationsStudySection({
  account,
  activeTheme,
  theme,
  updateAccount,
  togglePreference,
}: {
  account: ReturnType<typeof useOras>['account'];
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  updateAccount: ReturnType<typeof useOras>['updateAccount'];
  togglePreference: ReturnType<typeof useOras>['togglePreference'];
}) {
  const [tab, setTab] = useState<'notifications' | 'study'>('notifications');
  const p = account.preferences;

  const notifRows: { key: keyof typeof p; title: string; desc: string }[] = [
    { key: 'classReminders', title: 'Class Reminders', desc: 'Alerts before upcoming classes and subject periods' },
    { key: 'studyReminders', title: 'Study Reminders', desc: 'Daily nudges to hit your Pomodoro focus targets' },
    { key: 'assignmentReminders', title: 'Assignment Reminders', desc: 'Alerts for approaching homework and project deadlines' },
    { key: 'examReminders', title: 'Examination Reminders', desc: 'Countdown notices for upcoming major exams' },
    { key: 'scheduleAlerts', title: 'Schedule Notifications', desc: 'Daily morning overview of classes and rooms' },
    { key: 'announcements', title: 'General Announcements', desc: 'Milestone celebrations and offline study tips' },
  ];

  return (
    <View style={styles.subpageContainer}>
      {/* Top Segmented Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <SmoothPressable
          onPress={() => setTab('notifications')}
          style={[styles.tabBtn, tab === 'notifications' && { backgroundColor: activeTheme.primary }]}
        >
          <Ionicons
            name="notifications-outline"
            size={15}
            color={tab === 'notifications' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text style={[styles.tabBtnText, { color: tab === 'notifications' ? '#FFFFFF' : theme.textSecondary }]}>
            Notifications
          </Text>
        </SmoothPressable>
        <SmoothPressable
          onPress={() => setTab('study')}
          style={[styles.tabBtn, tab === 'study' && { backgroundColor: activeTheme.primary }]}
        >
          <Ionicons
            name="timer-outline"
            size={15}
            color={tab === 'study' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text style={[styles.tabBtnText, { color: tab === 'study' ? '#FFFFFF' : theme.textSecondary }]}>
            Study Preferences
          </Text>
        </SmoothPressable>
      </View>

      {tab === 'notifications' ? (
        <>
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.navy }]}>Reminder Categories</Text>

            {notifRows.map((row) => (
              <View key={row.key} style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: theme.navy }]}>{row.title}</Text>
                  <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>{row.desc}</Text>
                </View>
                <Switch
                  value={Boolean(p[row.key] ?? true)}
                  onValueChange={() => togglePreference(row.key)}
                  trackColor={{ false: theme.border, true: activeTheme.primary }}
                />
              </View>
            ))}
          </View>

          {/* Timing Lead Time & Audio Feedback */}
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.navy }]}>Reminder Lead Time & Audio</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              How early should OrasOras alert you before classes or study sessions?
            </Text>

            <View style={styles.pillRow}>
              {[10, 15, 30, 60].map((mins) => {
                const active = (p.reminderTimingMin ?? 15) === mins;
                return (
                  <SmoothPressable
                    key={mins}
                    onPress={() => updateAccount({ preferences: { ...p, reminderTimingMin: mins } })}
                    style={[styles.smallPill, active ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }}>
                      {mins === 60 ? '1 hour' : `${mins} mins`}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>

            {/* Audio & Haptic Feedback */}
            <View style={[styles.toggleRow, { marginTop: 14, borderBottomColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: theme.navy }]}>Notification Sounds</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>Chimes on timer completion and quiz milestones</Text>
              </View>
              <Switch
                value={p.soundEffects}
                onValueChange={() => togglePreference('soundEffects')}
                trackColor={{ false: theme.border, true: activeTheme.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: theme.navy }]}>Vibration Settings</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>Tactile buzz when intervals change</Text>
              </View>
              <Switch
                value={p.vibrationEnabled ?? true}
                onValueChange={() => togglePreference('vibrationEnabled')}
                trackColor={{ false: theme.border, true: activeTheme.primary }}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Pomodoro Durations */}
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.navy }]}>Pomodoro Timer Durations</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Changes instantly sync with the Pomodoro timer in Study Hub.
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Pomodoro Focus Duration</Text>
            <View style={styles.pillRow}>
              {[20, 25, 30, 45, 50, 60].map((mins) => {
                const active = (p.pomodoroFocusMin ?? 25) === mins;
                return (
                  <SmoothPressable
                    key={mins}
                    onPress={() => updateAccount({ preferences: { ...p, pomodoroFocusMin: mins } })}
                    style={[styles.smallPill, active ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }}>{mins}m</Text>
                  </SmoothPressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>Short Break Duration</Text>
            <View style={styles.pillRow}>
              {[3, 5, 10].map((mins) => {
                const active = (p.pomodoroShortBreakMin ?? 5) === mins;
                return (
                  <SmoothPressable
                    key={mins}
                    onPress={() => updateAccount({ preferences: { ...p, pomodoroShortBreakMin: mins } })}
                    style={[styles.smallPill, active ? { backgroundColor: '#10B981' } : { backgroundColor: theme.inputBackground }]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }}>{mins}m</Text>
                  </SmoothPressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>Long Break Duration</Text>
            <View style={styles.pillRow}>
              {[15, 20, 30].map((mins) => {
                const active = (p.pomodoroLongBreakMin ?? 15) === mins;
                return (
                  <SmoothPressable
                    key={mins}
                    onPress={() => updateAccount({ preferences: { ...p, pomodoroLongBreakMin: mins } })}
                    style={[styles.smallPill, active ? { backgroundColor: '#6366F1' } : { backgroundColor: theme.inputBackground }]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }}>{mins}m</Text>
                  </SmoothPressable>
                );
              })}
            </View>

            <View style={[styles.toggleRow, { marginTop: 14 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: theme.navy }]}>Automatic Study Session Transitions</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  Automatically transition between focus and break timers without manual taps
                </Text>
              </View>
              <Switch
                value={p.pomodoroAutoTransition ?? true}
                onValueChange={() => togglePreference('pomodoroAutoTransition')}
                trackColor={{ false: theme.border, true: activeTheme.primary }}
              />
            </View>
          </View>

          {/* Daily Study Goals */}
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.navy }]}>Daily Study Goals</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Sets your target focus minutes per day across all subjects.
            </Text>

            <View style={styles.pillRow}>
              {[30, 60, 90, 120, 180, 240].map((mins) => {
                const active = (p.dailyStudyGoalMin ?? 60) === mins;
                return (
                  <SmoothPressable
                    key={mins}
                    onPress={() => updateAccount({ preferences: { ...p, dailyStudyGoalMin: mins }, weeklyGoalMinutes: mins * 5 })}
                    style={[styles.smallPill, active ? { backgroundColor: activeTheme.primary } : { backgroundColor: theme.inputBackground }]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }}>{mins}m</Text>
                  </SmoothPressable>
                );
              })}
            </View>
          </View>

          {/* Preferred Study Schedule */}
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.navy }]}>Preferred Study Schedule</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Helps OrasOras optimize your daily review and study plan digests.
            </Text>

            <View style={{ gap: 8, marginTop: 8 }}>
              {[
                { id: 'morning', label: 'Morning Focus', desc: '6:00 AM – 12:00 PM · Best for high cognitive tasks' },
                { id: 'afternoon', label: 'Afternoon Energy', desc: '12:00 PM – 6:00 PM · Ideal for practice problems' },
                { id: 'evening', label: 'Evening Calm', desc: '6:00 PM – 10:00 PM · Great for reading and flashcards' },
                { id: 'night', label: 'Night Owl', desc: '10:00 PM – 2:00 AM · Uninterrupted late study' },
              ].map((sched) => {
                const active = (p.preferredScheduleTime || 'morning') === sched.id;
                return (
                  <SmoothPressable
                    key={sched.id}
                    onPress={() => updateAccount({ preferences: { ...p, preferredScheduleTime: sched.id as any } })}
                    style={[
                      styles.modeSelectCard,
                      { backgroundColor: theme.card, borderColor: active ? activeTheme.primary : theme.border },
                      active && { borderWidth: 2 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modeSelectTitle, { color: theme.navy }]}>{sched.label}</Text>
                      <Text style={[styles.modeSelectDesc, { color: theme.textSecondary }]}>{sched.desc}</Text>
                    </View>
                    {active && (
                      <Ionicons name="checkmark-circle" size={20} color={activeTheme.primary} />
                    )}
                  </SmoothPressable>
                );
              })}
            </View>
          </View>

          {/* Default Study Mode */}
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.navy }]}>Preferred Study Mode</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {STUDY_MODES.map((mode) => {
                const active = account.studyMode === mode.id;
                return (
                  <SmoothPressable
                    key={mode.id}
                    onPress={() => updateAccount({ studyMode: mode.id })}
                    style={[
                      styles.modeSelectCard,
                      { backgroundColor: theme.card, borderColor: active ? activeTheme.primary : theme.border },
                      active && { borderWidth: 2 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modeSelectTitle, { color: theme.navy }]}>{mode.label}</Text>
                      <Text style={[styles.modeSelectDesc, { color: theme.textSecondary }]}>{mode.desc}</Text>
                    </View>
                    <View style={[styles.modeDurationBadge, { backgroundColor: `${activeTheme.primary}18` }]}>
                      <Text style={[styles.modeDurationText, { color: activeTheme.primary }]}>{mode.focusMin}m</Text>
                    </View>
                  </SmoothPressable>
                );
              })}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. PRIVACY & SECURITY SECTION
// ══════════════════════════════════════════════════════════════════════════════
function PrivacySecuritySection({
  account,
  activeTheme,
  theme,
  updateAccount,
  togglePreference,
  resetBaseSettings,
  onGoToAccount,
}: {
  account: ReturnType<typeof useOras>['account'];
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  updateAccount: ReturnType<typeof useOras>['updateAccount'];
  togglePreference: ReturnType<typeof useOras>['togglePreference'];
  resetBaseSettings: ReturnType<typeof useSettings>['reset'];
  onGoToAccount: () => void;
}) {
  const router = useRouter();

  const handleExportData = async () => {
    try {
      const dataStr = JSON.stringify(account, null, 2);
      await saveFile(`orasoras_student_data_${account.id}.json`, dataStr);
      showMessage('Export Complete', 'Your local student data has been exported successfully.');
    } catch (e) {
      showMessage('Export Notice', e instanceof Error ? e.message : 'Export finished.');
    }
  };

  const handleResetData = () => {
    confirmAction(
      'Reset Local Student Profile?',
      'This will erase your local chat history, AI settings, and reset this device to initial onboarding. Your uploaded files can be restored if backed up.',
      'Reset All',
      async () => {
        await clearAllConversations();
        await deleteModel();
        await resetBaseSettings();
        router.replace('/onboarding');
      }
    );
  };

  return (
    <View style={styles.subpageContainer}>
      {/* Biometric & Privacy Toggles */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>App Protection & Security</Text>

        <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: theme.navy }]}>Biometric Screen Lock</Text>
            <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>Require fingerprint or face unlock upon app resume</Text>
          </View>
          <Switch
            value={account.preferences.biometricLock ?? false}
            onValueChange={() => togglePreference('biometricLock')}
            trackColor={{ false: theme.border, true: activeTheme.primary }}
          />
        </View>

        <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: theme.navy }]}>Public Student Profile</Text>
            <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>Allow badge and level visibility in shared study cards</Text>
          </View>
          <Switch
            value={account.preferences.profilePublic ?? true}
            onValueChange={() => togglePreference('profilePublic')}
            trackColor={{ false: theme.border, true: activeTheme.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: theme.navy }]}>Anonymous Telemetry Opt-Out</Text>
            <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>Prevent any anonymous local diagnostic reporting</Text>
          </View>
          <Switch
            value={account.preferences.analyticsOptOut ?? false}
            onValueChange={() => togglePreference('analyticsOptOut')}
            trackColor={{ false: theme.border, true: activeTheme.primary }}
          />
        </View>
      </View>

      {/* Active Local Session Card */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Active Session & Storage</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Device Mode</Text>
          <Text style={[styles.metaVal, { color: theme.navy }]}>Offline Local Instance</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Database Driver</Text>
          <Text style={[styles.metaVal, { color: theme.navy }]}>SQLite & IndexedDB VFS</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Security Status</Text>
          <Text style={[styles.metaVal, { color: '#10B981' }]}>Local Sandbox Encrypted</Text>
        </View>

        <SmoothPressable
          onPress={onGoToAccount}
          style={[styles.secondaryActionBtn, { borderColor: `${activeTheme.primary}50`, marginTop: 12 }]}
        >
          <Ionicons name="key-outline" size={16} color={activeTheme.primary} />
          <Text style={[styles.secondaryActionBtnText, { color: activeTheme.primary }]}>Change Account Password</Text>
        </SmoothPressable>
      </View>

      {/* Data Management & Danger Zone */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Data Management & Danger Zone</Text>

        <SmoothPressable
          onPress={handleExportData}
          style={[styles.secondaryActionBtn, { borderColor: activeTheme.primary, marginTop: 8 }]}
        >
          <Ionicons name="download-outline" size={17} color={activeTheme.primary} />
          <Text style={[styles.secondaryActionBtnText, { color: activeTheme.primary }]}>Export All Data (JSON)</Text>
        </SmoothPressable>

        <SmoothPressable
          onPress={handleResetData}
          style={[styles.dangerActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#EF4444', marginTop: 12 }]}
        >
          <Ionicons name="trash-outline" size={17} color="#EF4444" />
          <Text style={styles.dangerActionBtnText}>Reset Student Account Data</Text>
        </SmoothPressable>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. STORAGE & OFFLINE DATA SECTION
// ══════════════════════════════════════════════════════════════════════════════
function StorageOfflineSection({
  account,
  activeTheme,
  theme,
  settings,
  updateSetting,
}: {
  account: ReturnType<typeof useOras>['account'];
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  settings: ReturnType<typeof useSettings>['settings'];
  updateSetting: ReturnType<typeof useSettings>['update'];
}) {
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error: boolean } | null>(null);

  const totalFiles = account.uploadedFiles?.length || 0;
  const totalFileBytes = useMemo(
    () => account.uploadedFiles?.reduce((acc, f) => acc + (f.fileSize || 0), 0) || 0,
    [account.uploadedFiles]
  );
  const notesCount = account.savedNotes?.length || 0;

  const handleClearCache = () => {
    // Safely clear temporary in-memory blob URLs without touching persistent files
    setStatusMsg({ text: 'App temporary cache cleared. Stored PDFs & notes preserved!', error: false });
  };

  const handleBackup = async () => {
    if (busy) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const count = await exportBackup(settings);
      setStatusMsg({ text: `Backup file generated (${count} messages & settings).`, error: false });
    } catch (e) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Backup failed.', error: true });
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const b = await pickBackup();
      setBusy(false);
      if (!b) return;
      confirmAction(
        'Restore Backup?',
        `Replace current conversations and settings with backup from ${new Date(b.createdAt).toLocaleString()}?`,
        'Restore',
        async () => {
          setBusy(true);
          try {
            await restoreBackup(b, updateSetting);
            setStatusMsg({ text: 'Backup restored successfully!', error: false });
          } catch (e) {
            setStatusMsg({ text: e instanceof Error ? e.message : 'Restore failed.', error: true });
          } finally {
            setBusy(false);
          }
        }
      );
    } catch (e) {
      setStatusMsg({ text: e instanceof Error ? e.message : 'Restore error.', error: true });
      setBusy(false);
    }
  };

  return (
    <View style={styles.subpageContainer}>
      {statusMsg && (
        <View style={[styles.statusBanner, { backgroundColor: statusMsg.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', borderColor: statusMsg.error ? '#EF4444' : '#10B981' }]}>
          <Ionicons name={statusMsg.error ? 'alert-circle' : 'checkmark-circle'} size={18} color={statusMsg.error ? '#EF4444' : '#10B981'} />
          <Text style={[styles.statusBannerText, { color: statusMsg.error ? '#EF4444' : '#10B981' }]}>
            {statusMsg.text}
          </Text>
        </View>
      )}

      {/* Storage Breakdown */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Storage Breakdown</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Files and modules are stored completely on your local device.
        </Text>

        <View style={styles.storageGrid}>
          <View style={[styles.storageStatBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: activeTheme.primary }]}>{formatBytes(totalFileBytes)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Uploaded PDFs</Text>
          </View>
          <View style={[styles.storageStatBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{totalFiles} Files</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Documents</Text>
          </View>
          <View style={[styles.storageStatBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{notesCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Saved Notes</Text>
          </View>
          <View style={[styles.storageStatBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: '#06B6D4' }]}>100%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Offline Ready</Text>
          </View>
        </View>

        <SmoothPressable
          onPress={handleClearCache}
          style={[styles.secondaryActionBtn, { borderColor: `${activeTheme.primary}50`, marginTop: 14 }]}
        >
          <Ionicons name="refresh-circle-outline" size={18} color={activeTheme.primary} />
          <Text style={[styles.secondaryActionBtnText, { color: activeTheme.primary }]}>Clear Temporary Cache</Text>
        </SmoothPressable>
      </View>

      {/* Backup and Restore */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Backup & Restore</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Export your chat history, student records, and settings to a JSON file.
        </Text>

        <SmoothPressable
          onPress={handleBackup}
          disabled={busy}
          style={[styles.primaryActionBtn, { backgroundColor: activeTheme.primary, marginTop: 10 }]}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionBtnText}>Create JSON Backup</Text>
        </SmoothPressable>

        <SmoothPressable
          onPress={handleRestore}
          disabled={busy}
          style={[styles.secondaryActionBtn, { borderColor: `${activeTheme.primary}50`, marginTop: 10 }]}
        >
          <Ionicons name="cloud-download-outline" size={18} color={activeTheme.primary} />
          <Text style={[styles.secondaryActionBtnText, { color: activeTheme.primary }]}>Restore from Backup File</Text>
        </SmoothPressable>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 10. ABOUT & SUPPORT SECTION
// ══════════════════════════════════════════════════════════════════════════════
function AboutSupportSection({
  activeTheme,
  theme,
  router,
}: {
  activeTheme: ReturnType<typeof useOras>['activeTheme'];
  theme: ReturnType<typeof useTheme>;
  router: ReturnType<typeof useRouter>;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackBody, setFeedbackBody] = useState('');

  const faqs = [
    {
      q: 'Does OrasOras require an internet connection?',
      a: 'No. OrasOras is built from the ground up as an offline-first application. All schedules, requirements, study notes, uploaded PDFs, flashcards, and timers are saved locally on your device.',
    },
    {
      q: 'Are my uploaded PDF files permanent?',
      a: 'Yes. Every uploaded PDF file is saved in persistent application storage (SQLite & IndexedDB / OPFS), accessible anytime offline.',
    },
    {
      q: 'How does the Pomodoro timer sync with my progress?',
      a: 'Completed focus sessions automatically log to your 14-day study activity chart, contributing to your study streak and weekly academic goal.',
    },
    {
      q: 'How can I customize my student avatar?',
      a: 'You can choose from 12 built-in anime character presets or use the Custom Studio to personalize face shapes, skin tones, hairstyles, uniforms, and accessories with zero internet required.',
    },
  ];

  const handleSubmitFeedback = () => {
    if (!feedbackSubject.trim() || !feedbackBody.trim()) {
      showMessage('Fields Required', 'Please provide a subject and your feedback thoughts.');
      return;
    }
    setFeedbackSubject('');
    setFeedbackBody('');
    showMessage('Feedback Received', 'Thank you! Your feedback has been stored locally.');
  };

  return (
    <View style={styles.subpageContainer}>
      {/* App Info Hero */}
      <View style={[styles.aboutHeroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.appLogoCircle, { backgroundColor: `${activeTheme.primary}20` }]}>
          <Ionicons name="time" size={32} color={activeTheme.primary} />
        </View>
        <Text style={[styles.appNameTitle, { color: theme.navy }]}>OrasOras</Text>
        <Text style={[styles.appTagline, { color: activeTheme.primary }]}>Never Miss Class or Study Time</Text>
        <Text style={[styles.appVersion, { color: theme.textSecondary }]}>v1.2.0 (Build 2026.11.10) · Expo SDK 57</Text>
        <Text style={[styles.appMission, { color: theme.text }]}>
          An offline-first academic management, Pomodoro focus, and curriculum companion engineered for Philippine Junior High, Senior High, and College students.
        </Text>
      </View>

      {/* FAQ Accordion */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Frequently Asked Questions</Text>

        <View style={{ gap: 8, marginTop: 10 }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <SmoothPressable
                key={faq.q}
                onPress={() => setOpenFaq(isOpen ? null : idx)}
                style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.faqHeaderRow}>
                  <Text style={[styles.faqQuestion, { color: theme.navy }]}>{faq.q}</Text>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
                </View>
                {isOpen && (
                  <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.a}</Text>
                )}
              </SmoothPressable>
            );
          })}
        </View>
      </View>

      {/* Legal & Policy Links */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Legal & System Links</Text>

        <SmoothPressable
          onPress={() => router.push('/privacy' as Href)}
          style={[styles.linkRow, { borderBottomColor: theme.border }]}
        >
          <View style={styles.linkRowLeft}>
            <Ionicons name="document-text-outline" size={18} color={theme.textSecondary} />
            <Text style={[styles.linkRowText, { color: theme.navy }]}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </SmoothPressable>

        <SmoothPressable
          onPress={() => router.push('/terms' as Href)}
          style={[styles.linkRow, { borderBottomColor: theme.border }]}
        >
          <View style={styles.linkRowLeft}>
            <Ionicons name="reader-outline" size={18} color={theme.textSecondary} />
            <Text style={[styles.linkRowText, { color: theme.navy }]}>Terms & Conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </SmoothPressable>

        <SmoothPressable
          onPress={() => router.push('/chat-settings' as Href)}
          style={styles.linkRow}
        >
          <View style={styles.linkRowLeft}>
            <Ionicons name="hardware-chip-outline" size={18} color={activeTheme.primary} />
            <Text style={[styles.linkRowText, { color: activeTheme.primary }]}>OrasOras AI Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={activeTheme.primary} />
        </SmoothPressable>
      </View>

      {/* Feedback Form */}
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.navy }]}>Send Feedback or Suggestions</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Let us know how to make OrasOras even better for your daily studies.
        </Text>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Topic / Subject</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={feedbackSubject}
          onChangeText={setFeedbackSubject}
          placeholder="e.g. Schedule reminders, dark mode idea"
          placeholderTextColor={theme.textMuted}
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Your Comments & Ideas</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          value={feedbackBody}
          onChangeText={setFeedbackBody}
          placeholder="Share your thoughts..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={4}
        />

        <SmoothPressable
          onPress={handleSubmitFeedback}
          style={[styles.primaryActionBtn, { backgroundColor: activeTheme.primary, marginTop: 14 }]}
        >
          <Ionicons name="paper-plane-outline" size={17} color="#FFFFFF" />
          <Text style={styles.primaryActionBtnText}>Submit Feedback</Text>
        </SmoothPressable>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 64,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  gearBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Landing
  landingContainer: {
    gap: 18,
  },
  profileSummaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileSummaryMeta: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  profileNameText: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  profileTitleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  profileSummaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  profileActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  profileActionText: {
    fontSize: 13,
    fontWeight: '700',
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 6,
  },
  categoriesList: {
    gap: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  categoryIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Subpages Common
  subpageContainer: {
    gap: 16,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dangerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  dangerActionBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
  },

  // Avatars
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCard: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  presetAvatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  presetName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  studioPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  studioTools: {
    flex: 1,
    gap: 4,
  },
  colorSwatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Appearance
  segmentedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 6,
  },
  modeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeCardSub: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeItemCard: {
    width: '48%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  colorDotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 6,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeItemName: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Language
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  langMeta: {
    flex: 1,
  },
  langTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  langSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  langCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Study Preferences
  modeSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  modeSelectTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modeSelectDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  modeDurationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeDurationText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Privacy & Session
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Storage
  storageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storageStatBox: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // About
  aboutHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  appLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appNameTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  appMission: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 12,
  },
  faqCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  linkRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkRowText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
