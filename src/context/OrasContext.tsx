import Storage from '@/utils/kvStorage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ACADEMIC_SUBJECTS,
  ANIME_PRESET_AVATARS,
  COLOR_THEMES,
  STUDY_MODES,
  createDefaultAccount,
  type AcademicSubject,
  type ClassScheduleItem,
  type ColorThemeOption,
  type CustomAvatarConfig,
  type CustomSubjectItem,
  type LibraryFileItem,
  type LibraryFolderItem,
  type NotificationItem,
  type QuizResultRecord,
  type RequirementItem,
  type SavedLibraryNote,
  type StudentAccount,
  type StudentLevel,
  type StudentPreferences,
  type StudyMode,
  type StudySessionRecord,
} from '@/data/orasorasData';
import { useSettings } from '@/settings/SettingsContext';
import { showMessage } from '@/utils/confirm';
import { deleteLibraryFileBlob, saveLibraryFileBlob } from '@/services/libraryStorage';
import {
  type AppLanguage,
  TRANSLATIONS,
  type TranslationDictionary,
} from '@/i18n/translations';

const ORAS_STORAGE_KEY = 'orasoras_state_v1';

export interface LiveStudyTimerState {
  running: boolean;
  isBreakPhase: boolean;
  secondsLeft: number;
  totalSeconds: number;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  moduleId: string;
  moduleTitle: string;
  mode: StudyMode;
}

export interface LiveQuizProgressState {
  subjectName: string;
  moduleTitle: string;
  currentQuestion: number;
  totalQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Difficult';
}

interface OrasStoreState {
  accounts: StudentAccount[];
  activeAccountId: string;
}

interface OrasContextValue {
  ready: boolean;
  accounts: StudentAccount[];
  account: StudentAccount;
  activeTheme: ColorThemeOption;
  /** Switch between existing student accounts */
  switchAccount: (accountId: string) => Promise<void>;
  /** Create a new student account and switch to it */
  createAccount: (partial: {
    name: string;
    level: StudentLevel;
    themeId?: string;
    presetAvatarId?: number;
    darkMode?: boolean;
  }) => Promise<StudentAccount>;
  /** Update fields on the active account */
  updateAccount: (patch: Partial<StudentAccount>) => Promise<void>;
  /** Update a single preference toggle */
  togglePreference: (key: keyof StudentPreferences) => Promise<void>;
  /** Save custom avatar studio configuration */
  saveCustomAvatar: (config: CustomAvatarConfig) => Promise<void>;
  /** Select one of the 12 preset anime avatars */
  selectPresetAvatar: (presetId: number) => Promise<void>;
  selectOfficialAvatar: () => Promise<void>;
  /** Toggle lesson completion */
  toggleLessonComplete: (lessonId: string, moduleId?: string) => Promise<void>;
  /** Toggle favorite module */
  toggleFavoriteModule: (moduleId: string) => Promise<void>;
  /** Toggle downloaded offline module */
  toggleDownloadModule: (moduleId: string) => Promise<void>;
  /** Record recently viewed module */
  markModuleViewed: (moduleId: string) => Promise<void>;
  /** Save AI generated reviewer / flashcards to library */
  addSavedNote: (note: Omit<SavedLibraryNote, 'id' | 'createdAt'>) => Promise<void>;
  /** Delete a saved note */
  deleteSavedNote: (id: string) => Promise<void>;
  /** Add or update a class schedule item */
  upsertScheduleItem: (item: Omit<ClassScheduleItem, 'id'> & { id?: string }) => Promise<void>;
  /** Toggle cancelled state or delete a class schedule item */
  toggleCancelSchedule: (id: string) => Promise<void>;
  deleteScheduleItem: (id: string) => Promise<void>;
  /** Add or update an academic requirement */
  upsertRequirement: (item: Omit<RequirementItem, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  /** Toggle requirement completion */
  toggleRequirementComplete: (id: string) => Promise<void>;
  /** Toggle a checklist item inside a requirement */
  toggleChecklistItem: (reqId: string, checklistId: string) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  /** Record a completed quiz result and evaluate achievements */
  recordQuizResult: (result: Omit<QuizResultRecord, 'id' | 'completedAt'>) => Promise<QuizResultRecord>;
  /** Record a completed study session */
  recordStudySession: (session: Omit<StudySessionRecord, 'id' | 'completedAt'>) => Promise<void>;
  /** Notification actions */
  markNotificationRead: (id: string, read?: boolean) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  /** Live Study Activity (Dynamic Island + Study Hub) */
  liveStudyTimer: LiveStudyTimerState;
  startLiveStudyTimer: (opts?: {
    subjectId?: string;
    moduleId?: string;
    mode?: StudyMode;
  }) => void;
  pauseLiveStudyTimer: () => void;
  toggleLiveStudyTimer: () => void;
  resetLiveStudyTimer: (isBreak?: boolean, modeOverride?: StudyMode) => void;
  endLiveStudySession: () => Promise<void>;
  setLiveStudyContext: (subjectId: string, moduleId: string) => void;
  /** Live Quiz Progress in Dynamic Island */
  liveQuizProgress: LiveQuizProgressState | null;
  setLiveQuizProgress: (state: LiveQuizProgressState | null) => void;
  /** Global iOS-style Overlays: Control Center, Lock-Screen Glance Summary & Notification Center */
  controlCenterVisible: boolean;
  setControlCenterVisible: (visible: boolean) => void;
  glanceSummaryVisible: boolean;
  setGlanceSummaryVisible: (visible: boolean) => void;
  notificationCenterVisible: boolean;
  setNotificationCenterVisible: (visible: boolean) => void;
  offlineModeSim: boolean;
  setOfflineModeSim: (offline: boolean) => void;
  /** Logout / return to onboarding for active or new profile */
  logoutToOnboarding: () => Promise<void>;
  /** Subject Library & File Management */
  uploadedFiles: LibraryFileItem[];
  customFolders: LibraryFolderItem[];
  customSubjects: CustomSubjectItem[];
  allSubjects: (AcademicSubject | CustomSubjectItem)[];
  uploadLibraryFile: (
    fileData: Omit<LibraryFileItem, 'id' | 'accountId' | 'uploadedAt'>,
    blobOrFile?: Blob | File | string
  ) => Promise<LibraryFileItem>;
  updateLibraryFile: (fileId: string, patch: Partial<LibraryFileItem>) => Promise<void>;
  deleteLibraryFile: (fileId: string) => Promise<void>;
  toggleFileFavorite: (fileId: string) => Promise<void>;
  toggleFilePinned: (fileId: string) => Promise<void>;
  toggleFileOffline: (fileId: string) => Promise<void>;
  recordFileOpened: (fileId: string) => Promise<void>;
  moveLibraryFile: (
    fileId: string,
    targetSubjectId: string,
    targetSubjectName: string,
    targetFolderId?: string,
    targetFolderName?: string
  ) => Promise<void>;
  copyLibraryFile: (
    fileId: string,
    targetSubjectId: string,
    targetSubjectName: string,
    targetFolderId?: string,
    targetFolderName?: string
  ) => Promise<void>;
  createCustomFolder: (
    folder: Omit<LibraryFolderItem, 'id' | 'accountId' | 'createdAt'>
  ) => Promise<LibraryFolderItem>;
  renameCustomFolder: (folderId: string, newName: string) => Promise<void>;
  deleteCustomFolder: (folderId: string) => Promise<void>;
  createCustomSubject: (
    subject: Omit<CustomSubjectItem, 'id' | 'isCustom'>
  ) => Promise<CustomSubjectItem>;
  deleteCustomSubject: (subjectId: string) => Promise<void>;
  clearOfflineFilesCache: () => Promise<void>;
  updatePdfProgress: (
    fileId: string,
    page: number,
    totalPages?: number,
    bookmarkPage?: number
  ) => Promise<void>;
  /** Language & Localization */
  language: AppLanguage;
  t: TranslationDictionary;
  setLanguage: (lang: AppLanguage) => Promise<void>;
}

const defaultAcc = createDefaultAccount({ id: 'acc-default' });

function sanitizeAccount(acc: StudentAccount): StudentAccount {
  const base = createDefaultAccount({
    id: acc?.id,
    name: acc?.name,
    level: acc?.level,
    themeId: acc?.themeId,
    presetAvatarId: acc?.presetAvatarId,
    darkMode: acc?.darkMode,
  });
  return {
    ...base,
    ...acc,
    preferences: {
      ...base.preferences,
      ...(acc?.preferences || {}),
    },
    customAvatar: {
      ...base.customAvatar,
      ...(acc?.customAvatar || {}),
    },
    completedLessonIds: acc?.completedLessonIds || base.completedLessonIds || [],
    favoriteModuleIds: acc?.favoriteModuleIds || base.favoriteModuleIds || [],
    downloadedModuleIds: acc?.downloadedModuleIds || base.downloadedModuleIds || [],
    recentModuleIds: acc?.recentModuleIds || base.recentModuleIds || [],
    savedNotes: acc?.savedNotes || base.savedNotes || [],
    uploadedFiles: acc?.uploadedFiles || base.uploadedFiles || [],
    customFolders: acc?.customFolders || base.customFolders || [],
    customSubjects: acc?.customSubjects || base.customSubjects || [],
    recentFileIds: acc?.recentFileIds || base.recentFileIds || [],
    schedule: acc?.schedule || base.schedule || [],
    requirements: acc?.requirements || base.requirements || [],
    quizResults: acc?.quizResults || base.quizResults || [],
    studySessions: acc?.studySessions || base.studySessions || [],
    notifications: acc?.notifications || base.notifications || [],
    unlockedAchievementIds: acc?.unlockedAchievementIds || base.unlockedAchievementIds || [],
    language: (acc?.language as AppLanguage) || 'en',
    activityByDate: acc?.activityByDate || base.activityByDate || {},
  };
}

const defaultLiveTimer: LiveStudyTimerState = {
  running: false,
  isBreakPhase: false,
  secondsLeft: 25 * 60,
  totalSeconds: 25 * 60,
  subjectId: ACADEMIC_SUBJECTS[0].id,
  subjectName: ACADEMIC_SUBJECTS[0].shortName,
  subjectColor: ACADEMIC_SUBJECTS[0].color,
  moduleId: ACADEMIC_SUBJECTS[0].modules[0].id,
  moduleTitle: ACADEMIC_SUBJECTS[0].modules[0].title,
  mode: 'Focused',
};

const OrasContext = createContext<OrasContextValue>({
  ready: false,
  accounts: [defaultAcc],
  account: defaultAcc,
  activeTheme: COLOR_THEMES[0],
  switchAccount: async () => {},
  createAccount: async () => defaultAcc,
  updateAccount: async () => {},
  togglePreference: async () => {},
  saveCustomAvatar: async () => {},
  selectPresetAvatar: async () => {},
  selectOfficialAvatar: async () => {},
  toggleLessonComplete: async () => {},
  toggleFavoriteModule: async () => {},
  toggleDownloadModule: async () => {},
  markModuleViewed: async () => {},
  addSavedNote: async () => {},
  deleteSavedNote: async () => {},
  upsertScheduleItem: async () => {},
  toggleCancelSchedule: async () => {},
  deleteScheduleItem: async () => {},
  upsertRequirement: async () => {},
  toggleRequirementComplete: async () => {},
  toggleChecklistItem: async () => {},
  deleteRequirement: async () => {},
  recordQuizResult: async () => defaultAcc.quizResults[0],
  recordStudySession: async () => {},
  markNotificationRead: async () => {},
  dismissNotification: async () => {},
  markAllNotificationsRead: async () => {},
  clearAllNotifications: async () => {},
  liveStudyTimer: defaultLiveTimer,
  startLiveStudyTimer: () => {},
  pauseLiveStudyTimer: () => {},
  toggleLiveStudyTimer: () => {},
  resetLiveStudyTimer: () => {},
  endLiveStudySession: async () => {},
  setLiveStudyContext: () => {},
  liveQuizProgress: null,
  setLiveQuizProgress: () => {},
  controlCenterVisible: false,
  setControlCenterVisible: () => {},
  glanceSummaryVisible: false,
  setGlanceSummaryVisible: () => {},
  notificationCenterVisible: false,
  setNotificationCenterVisible: () => {},
  offlineModeSim: false,
  setOfflineModeSim: () => {},
  logoutToOnboarding: async () => {},
  uploadedFiles: defaultAcc.uploadedFiles || [],
  customFolders: defaultAcc.customFolders || [],
  customSubjects: defaultAcc.customSubjects || [],
  allSubjects: ACADEMIC_SUBJECTS,
  uploadLibraryFile: async () => defaultAcc.uploadedFiles[0],
  updateLibraryFile: async () => {},
  deleteLibraryFile: async () => {},
  toggleFileFavorite: async () => {},
  toggleFilePinned: async () => {},
  toggleFileOffline: async () => {},
  recordFileOpened: async () => {},
  moveLibraryFile: async () => {},
  copyLibraryFile: async () => {},
  createCustomFolder: async () => defaultAcc.customFolders[0],
  renameCustomFolder: async () => {},
  deleteCustomFolder: async () => {},
  createCustomSubject: async () => ({
    id: 'subj-custom',
    name: 'Custom Subject',
    shortName: 'Custom',
    gradeLevels: ['Junior High School'],
    color: '#3B82F6',
    secondaryColor: '#2563EB',
    lightBg: '#EFF6FF',
    icon: 'book',
    isCustom: true,
  }),
  deleteCustomSubject: async () => {},
  clearOfflineFilesCache: async () => {},
  updatePdfProgress: async () => {},
  language: 'en',
  t: TRANSLATIONS.en,
  setLanguage: async () => {},
});

export function OrasProvider({ children }: { children: React.ReactNode }) {
  const { settings, update: updateBaseSetting } = useSettings();
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<OrasStoreState>(() => {
    const first = createDefaultAccount({
      id: 'acc-primary',
      name: settings.nickname?.trim() || 'Alex Rivera',
      darkMode: settings.theme === 'dark',
    });
    const second = createDefaultAccount({
      id: 'acc-college',
      name: 'Sophia Chen',
      level: 'College',
      themeId: 'electric-indigo',
      presetAvatarId: 1,
      darkMode: false,
    });
    return {
      accounts: [first, second],
      activeAccountId: first.id,
    };
  });

  // Load persisted accounts from SQLite KV store
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await Storage.getItem(ORAS_STORAGE_KEY);
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as OrasStoreState;
          if (Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
            setStore({
              accounts: parsed.accounts.map(sanitizeAccount),
              activeAccountId: parsed.activeAccountId || parsed.accounts[0]?.id || 'acc-primary',
            });
          }
        }
      } catch (e) {
        console.warn('OrasStore load error:', e);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  const persistStore = useCallback(async (next: OrasStoreState) => {
    storeRef.current = next;
    setStore(next);
    try {
      await Storage.setItemAsync(ORAS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('OrasStore save error:', e);
    }
  }, []);

  const account = useMemo(() => {
    const rawAcc =
      store.accounts.find((a) => a.id === store.activeAccountId) ??
      store.accounts[0] ??
      defaultAcc;
    return sanitizeAccount(rawAcc);
  }, [store]);

  // Keep base SettingsContext nickname and theme synced with the active OrasOras account
  useEffect(() => {
    if (!ready) return;
    const targetTheme = account.darkMode ? 'dark' : 'light';
    if (settings.theme !== targetTheme) {
      void updateBaseSetting('theme', targetTheme);
    }
    if (account.name && settings.nickname !== account.name) {
      void updateBaseSetting('nickname', account.name);
    }
  }, [ready, account.darkMode, account.name, settings.theme, settings.nickname, updateBaseSetting]);

  const activeTheme = useMemo(() => {
    return COLOR_THEMES.find((t) => t.id === account.themeId) ?? COLOR_THEMES[0];
  }, [account.themeId]);

  const mutateActiveAccount = useCallback(
    async (updater: (acc: StudentAccount) => StudentAccount) => {
      const current = storeRef.current;
      const targetId = current.activeAccountId;
      const nextAccounts = current.accounts.map((acc) =>
        acc.id === targetId ? updater(acc) : acc
      );
      const nextStore: OrasStoreState = { ...current, accounts: nextAccounts };
      await persistStore(nextStore);
    },
    [persistStore]
  );

  const switchAccount = useCallback(
    async (accountId: string) => {
      const target = store.accounts.find((a) => a.id === accountId);
      if (!target) return;
      await persistStore({ ...store, activeAccountId: target.id });
      await updateBaseSetting('nickname', target.name);
      await updateBaseSetting('theme', target.darkMode ? 'dark' : 'light');
    },
    [store, persistStore, updateBaseSetting]
  );

  const createAccount = useCallback(
    async (partial: {
      name: string;
      level: StudentLevel;
      themeId?: string;
      presetAvatarId?: number;
      darkMode?: boolean;
    }) => {
      const created = createDefaultAccount({
        id: `acc-${Date.now().toString(36)}`,
        name: partial.name.trim() || 'Student Scholar',
        level: partial.level,
        themeId: partial.themeId ?? 'oras-blue',
        presetAvatarId: partial.presetAvatarId ?? 0,
        darkMode: partial.darkMode ?? false,
      });
      const next: OrasStoreState = {
        accounts: [...store.accounts, created],
        activeAccountId: created.id,
      };
      await persistStore(next);
      await updateBaseSetting('nickname', created.name);
      await updateBaseSetting('theme', created.darkMode ? 'dark' : 'light');
      return created;
    },
    [store, persistStore, updateBaseSetting]
  );

  const updateAccount = useCallback(
    async (patch: Partial<StudentAccount>) => {
      await mutateActiveAccount((acc) => ({ ...acc, ...patch }));
      if (patch.name !== undefined) {
        await updateBaseSetting('nickname', patch.name);
      }
      if (patch.darkMode !== undefined) {
        await updateBaseSetting('theme', patch.darkMode ? 'dark' : 'light');
      }
    },
    [mutateActiveAccount, updateBaseSetting]
  );

  const togglePreference = useCallback(
    async (key: keyof StudentPreferences) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        preferences: {
          ...acc.preferences,
          [key]: !acc.preferences[key],
        },
      }));
    },
    [mutateActiveAccount]
  );

  const saveCustomAvatar = useCallback(
    async (config: CustomAvatarConfig) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        useCustomAvatar: true,
        useOfficialAvatar: false,
        customAvatar: config,
      }));
    },
    [mutateActiveAccount]
  );

      const selectOfficialAvatar = useCallback(async () => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        useOfficialAvatar: true,
        useCustomAvatar: false,
      }));
    }, [mutateActiveAccount]);

    const selectPresetAvatar = useCallback(
    async (presetId: number) => {
      const preset =
        ANIME_PRESET_AVATARS[presetId] ?? ANIME_PRESET_AVATARS[0];
      await mutateActiveAccount((acc) => ({
        ...acc,
        presetAvatarId: presetId,
        useCustomAvatar: false,
        useOfficialAvatar: false,
        customAvatar: { ...preset.config },
      }));
    },
    [mutateActiveAccount]
  );

  const toggleLessonComplete = useCallback(
    async (lessonId: string, moduleId?: string) => {
      await mutateActiveAccount((acc) => {
        const exists = acc.completedLessonIds.includes(lessonId);
        const completedLessonIds = exists
          ? acc.completedLessonIds.filter((id) => id !== lessonId)
          : [...acc.completedLessonIds, lessonId];

        const unlocked = new Set(acc.unlockedAchievementIds);
        // Check if any module has all lessons completed
        for (const subj of ACADEMIC_SUBJECTS) {
          for (const mod of subj.modules) {
            if (
              mod.lessons.length > 0 &&
              mod.lessons.every((l) => completedLessonIds.includes(l.id))
            ) {
              unlocked.add('module-master');
            }
          }
        }
        const recentModuleIds = moduleId
          ? [moduleId, ...acc.recentModuleIds.filter((m) => m !== moduleId)].slice(0, 6)
          : acc.recentModuleIds;

        return {
          ...acc,
          completedLessonIds,
          recentModuleIds,
          unlockedAchievementIds: Array.from(unlocked),
        };
      });
    },
    [mutateActiveAccount]
  );

  const toggleFavoriteModule = useCallback(
    async (moduleId: string) => {
      await mutateActiveAccount((acc) => {
        const exists = acc.favoriteModuleIds.includes(moduleId);
        return {
          ...acc,
          favoriteModuleIds: exists
            ? acc.favoriteModuleIds.filter((id) => id !== moduleId)
            : [...acc.favoriteModuleIds, moduleId],
        };
      });
    },
    [mutateActiveAccount]
  );

  const toggleDownloadModule = useCallback(
    async (moduleId: string) => {
      await mutateActiveAccount((acc) => {
        const exists = acc.downloadedModuleIds.includes(moduleId);
        return {
          ...acc,
          downloadedModuleIds: exists
            ? acc.downloadedModuleIds.filter((id) => id !== moduleId)
            : [...acc.downloadedModuleIds, moduleId],
        };
      });
    },
    [mutateActiveAccount]
  );

  const markModuleViewed = useCallback(
    async (moduleId: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        recentModuleIds: [
          moduleId,
          ...acc.recentModuleIds.filter((id) => id !== moduleId),
        ].slice(0, 8),
      }));
    },
    [mutateActiveAccount]
  );

  const addSavedNote = useCallback(
    async (note: Omit<SavedLibraryNote, 'id' | 'createdAt'>) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        savedNotes: [
          {
            ...note,
            id: `note-${Date.now().toString(36)}`,
            createdAt: Date.now(),
          },
          ...acc.savedNotes,
        ],
      }));
    },
    [mutateActiveAccount]
  );

  const deleteSavedNote = useCallback(
    async (id: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        savedNotes: acc.savedNotes.filter((n) => n.id !== id),
      }));
    },
    [mutateActiveAccount]
  );

  const upsertScheduleItem = useCallback(
    async (item: Omit<ClassScheduleItem, 'id'> & { id?: string }) => {
      await mutateActiveAccount((acc) => {
        if (item.id) {
          return {
            ...acc,
            schedule: acc.schedule.map((s) =>
              s.id === item.id ? ({ ...item, id: item.id } as ClassScheduleItem) : s
            ),
          };
        }
        const created: ClassScheduleItem = {
          ...item,
          id: `sch-${Date.now().toString(36)}`,
        };
        return {
          ...acc,
          schedule: [...acc.schedule, created],
        };
      });
    },
    [mutateActiveAccount]
  );

  const toggleCancelSchedule = useCallback(
    async (id: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        schedule: acc.schedule.map((s) =>
          s.id === id ? { ...s, cancelled: !s.cancelled } : s
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const deleteScheduleItem = useCallback(
    async (id: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        schedule: acc.schedule.filter((s) => s.id !== id),
      }));
    },
    [mutateActiveAccount]
  );

  const upsertRequirement = useCallback(
    async (item: Omit<RequirementItem, 'id' | 'createdAt'> & { id?: string }) => {
      await mutateActiveAccount((acc) => {
        if (item.id) {
          return {
            ...acc,
            requirements: acc.requirements.map((r) =>
              r.id === item.id
                ? { ...item, id: item.id, createdAt: r.createdAt }
                : r
            ),
          };
        }
        const created: RequirementItem = {
          ...item,
          id: `req-${Date.now().toString(36)}`,
          createdAt: Date.now(),
        };
        return {
          ...acc,
          requirements: [created, ...acc.requirements],
        };
      });
    },
    [mutateActiveAccount]
  );

  const toggleRequirementComplete = useCallback(
    async (id: string) => {
      await mutateActiveAccount((acc) => {
        const requirements = acc.requirements.map((r) =>
          r.id === id ? { ...r, completed: !r.completed } : r
        );
        const completedCount = requirements.filter((r) => r.completed).length;
        const unlocked = new Set(acc.unlockedAchievementIds);
        if (completedCount >= 5) unlocked.add('requirements-hero');
        return {
          ...acc,
          requirements,
          unlockedAchievementIds: Array.from(unlocked),
        };
      });
    },
    [mutateActiveAccount]
  );

  const toggleChecklistItem = useCallback(
    async (reqId: string, checklistId: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        requirements: acc.requirements.map((r) =>
          r.id === reqId
            ? {
                ...r,
                checklist: r.checklist.map((c) =>
                  c.id === checklistId ? { ...c, done: !c.done } : c
                ),
              }
            : r
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const deleteRequirement = useCallback(
    async (id: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        requirements: acc.requirements.filter((r) => r.id !== id),
      }));
    },
    [mutateActiveAccount]
  );

  const recordQuizResult = useCallback(
    async (result: Omit<QuizResultRecord, 'id' | 'completedAt'>) => {
      const record: QuizResultRecord = {
        ...result,
        id: `qr-${Date.now().toString(36)}`,
        completedAt: Date.now(),
      };
      await mutateActiveAccount((acc) => {
        const quizResults = [record, ...acc.quizResults];
        const unlocked = new Set(acc.unlockedAchievementIds);
        unlocked.add('first-quiz');
        if (record.scorePercent === 100) unlocked.add('perfect-score');
        if (quizResults.length >= 5) {
          const avg =
            quizResults.reduce((s, q) => s + q.scorePercent, 0) /
            quizResults.length;
          if (avg >= 80) unlocked.add('quiz-champion');
        }
        if (record.scorePercent >= 90) unlocked.add('subject-expert');

        const newNotifications: NotificationItem[] = [
          {
            id: `notif-${Date.now().toString(36)}`,
            category: 'Quiz Recommendation',
            title: `Quiz Completed: ${record.scorePercent}% on ${record.moduleTitle}`,
            body:
              record.scorePercent === 100
                ? 'Flawless mastery! You answered every question correctly.'
                : `Strongest: ${record.strongestTopic}. Recommended review: ${record.recommendedLesson}.`,
            timestamp: Date.now(),
            dateGroup: 'Today',
            read: false,
            dismissed: false,
            accentColor: record.scorePercent >= 80 ? '#10B981' : '#3B82F6',
            icon: 'ribbon',
          },
          ...acc.notifications,
        ];

        return {
          ...acc,
          quizResults,
          unlockedAchievementIds: Array.from(unlocked),
          notifications: newNotifications,
        };
      });
      return record;
    },
    [mutateActiveAccount]
  );

  const recordStudySession = useCallback(
    async (session: Omit<StudySessionRecord, 'id' | 'completedAt'>) => {
      const todayKey = new Date().toISOString().split('T')[0];
      await mutateActiveAccount((acc) => {
        const created: StudySessionRecord = {
          ...session,
          id: `ss-${Date.now().toString(36)}`,
          completedAt: Date.now(),
        };
        const prevMins = acc.activityByDate[todayKey] ?? 0;
        const unlocked = new Set(acc.unlockedAchievementIds);
        unlocked.add('study-starter');
        return {
          ...acc,
          studySessions: [created, ...acc.studySessions],
          activityByDate: {
            ...acc.activityByDate,
            [todayKey]: prevMins + session.durationMin,
          },
          unlockedAchievementIds: Array.from(unlocked),
        };
      });
    },
    [mutateActiveAccount]
  );

  const markNotificationRead = useCallback(
    async (id: string, read = true) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        notifications: acc.notifications.map((n) =>
          n.id === id ? { ...n, read } : n
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const dismissNotification = useCallback(
    async (id: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        notifications: acc.notifications.map((n) =>
          n.id === id ? { ...n, dismissed: true } : n
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const markAllNotificationsRead = useCallback(async () => {
    await mutateActiveAccount((acc) => ({
      ...acc,
      notifications: acc.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, [mutateActiveAccount]);

  const clearAllNotifications = useCallback(async () => {
    await mutateActiveAccount((acc) => ({
      ...acc,
      notifications: acc.notifications.map((n) => ({
        ...n,
        read: true,
        dismissed: true,
      })),
    }));
  }, [mutateActiveAccount]);

  // ── Global Live Study Activity & iOS Overlays State ─────────────────────────
  const [liveStudyTimer, setLiveStudyTimer] =
    useState<LiveStudyTimerState>(defaultLiveTimer);
  const [liveQuizProgress, setLiveQuizProgress] =
    useState<LiveQuizProgressState | null>(null);
  const [controlCenterVisible, setControlCenterVisible] = useState(false);
  const [glanceSummaryVisible, setGlanceSummaryVisible] = useState(false);
  const [notificationCenterVisible, setNotificationCenterVisible] =
    useState(false);
  const [offlineModeSim, setOfflineModeSim] = useState(false);

  // Tick the global study timer every second so it runs across all tabs & Dynamic Island
  useEffect(() => {
    if (!liveStudyTimer.running) return;
    const interval = setInterval(() => {
      setLiveStudyTimer((prev) => {
        if (!prev.running) return prev;
        if (prev.secondsLeft <= 1) {
          if (!prev.isBreakPhase) {
            const minsCompleted = Math.max(1, Math.round(prev.totalSeconds / 60));
            void recordStudySession({
              subjectId: prev.subjectId,
              subjectName: prev.subjectName,
              moduleId: prev.moduleId,
              durationMin: minsCompleted,
              mode: prev.mode,
            });
            showMessage(
              'Focus Session Complete!',
              `Logged ${minsCompleted} mins on ${prev.subjectName}. Time for a restorative break!`
            );
          }
          return {
            ...prev,
            running: false,
            secondsLeft: 0,
          };
        }
        return {
          ...prev,
          secondsLeft: prev.secondsLeft - 1,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [liveStudyTimer.running, recordStudySession]);

  const setLiveStudyContext = useCallback((subjectId: string, moduleId: string) => {
    const subj =
      ACADEMIC_SUBJECTS.find((s) => s.id === subjectId) ?? ACADEMIC_SUBJECTS[0];
    const mod =
      subj.modules.find((m) => m.id === moduleId) ?? subj.modules[0];
    setLiveStudyTimer((prev) => ({
      ...prev,
      subjectId: subj.id,
      subjectName: subj.shortName,
      subjectColor: subj.color,
      moduleId: mod.id,
      moduleTitle: mod.title,
    }));
  }, []);

  const startLiveStudyTimer = useCallback(
    (opts?: { subjectId?: string; moduleId?: string; mode?: StudyMode }) => {
      setLiveStudyTimer((prev) => {
        const subj = opts?.subjectId
          ? ACADEMIC_SUBJECTS.find((s) => s.id === opts.subjectId) ??
            ACADEMIC_SUBJECTS[0]
          : ACADEMIC_SUBJECTS.find((s) => s.id === prev.subjectId) ??
            ACADEMIC_SUBJECTS[0];
        const mod = opts?.moduleId
          ? subj.modules.find((m) => m.id === opts.moduleId) ?? subj.modules[0]
          : subj.modules.find((m) => m.id === prev.moduleId) ?? subj.modules[0];
        const modeId = opts?.mode ?? account.studyMode;
        const modeObj =
          STUDY_MODES.find((m) => m.id === modeId) ?? STUDY_MODES[0];
        const total = (prev.isBreakPhase ? modeObj.breakMin : modeObj.focusMin) * 60;
        const secs = prev.secondsLeft > 0 ? prev.secondsLeft : total;
        return {
          ...prev,
          running: true,
          subjectId: subj.id,
          subjectName: subj.shortName,
          subjectColor: subj.color,
          moduleId: mod.id,
          moduleTitle: mod.title,
          mode: modeId,
          totalSeconds: total,
          secondsLeft: secs,
        };
      });
    },
    [account.studyMode]
  );

  const pauseLiveStudyTimer = useCallback(() => {
    setLiveStudyTimer((prev) => ({ ...prev, running: false }));
  }, []);

  const toggleLiveStudyTimer = useCallback(() => {
    setLiveStudyTimer((prev) => {
      if (!prev.running && prev.secondsLeft <= 0) {
        return { ...prev, running: true, secondsLeft: prev.totalSeconds };
      }
      return { ...prev, running: !prev.running };
    });
  }, []);

  const resetLiveStudyTimer = useCallback(
    (isBreak?: boolean, modeOverride?: StudyMode) => {
      setLiveStudyTimer((prev) => {
        const nextBreak = isBreak ?? prev.isBreakPhase;
        const modeId = modeOverride ?? account.studyMode;
        const modeObj =
          STUDY_MODES.find((m) => m.id === modeId) ?? STUDY_MODES[0];
        const total = (nextBreak ? modeObj.breakMin : modeObj.focusMin) * 60;
        return {
          ...prev,
          running: false,
          isBreakPhase: nextBreak,
          mode: modeId,
          totalSeconds: total,
          secondsLeft: total,
        };
      });
    },
    [account.studyMode]
  );

  const endLiveStudySession = useCallback(async () => {
    const elapsedSec = Math.max(
      0,
      liveStudyTimer.totalSeconds - liveStudyTimer.secondsLeft
    );
    const loggedMins =
      elapsedSec >= 30
        ? Math.max(1, Math.round(elapsedSec / 60))
        : Math.max(1, Math.round(liveStudyTimer.totalSeconds / 60));

    setLiveStudyTimer((prev) => ({
      ...prev,
      running: false,
      isBreakPhase: false,
      secondsLeft: prev.totalSeconds,
    }));

    if (!liveStudyTimer.isBreakPhase) {
      await recordStudySession({
        subjectId: liveStudyTimer.subjectId,
        subjectName: liveStudyTimer.subjectName,
        moduleId: liveStudyTimer.moduleId,
        durationMin: loggedMins,
        mode: liveStudyTimer.mode,
      });
      showMessage(
        'Study Session Saved',
        `Logged ${loggedMins} mins of ${liveStudyTimer.mode} study on ${liveStudyTimer.subjectName}.`
      );
    }
  }, [liveStudyTimer, recordStudySession]);

  const logoutToOnboarding = useCallback(async () => {
    await updateBaseSetting('onboarded', false);
  }, [updateBaseSetting]);

  // ── Subject Library & File Management ─────────────────────────────────────
  const allSubjects = useMemo(() => {
    return [...ACADEMIC_SUBJECTS, ...(account.customSubjects || [])];
  }, [account.customSubjects]);

  const uploadLibraryFile = useCallback(
    async (
      fileData: Omit<LibraryFileItem, 'id' | 'accountId' | 'uploadedAt'>,
      blobOrFile?: Blob | File | string
    ): Promise<LibraryFileItem> => {
      const newFileId = `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const item: LibraryFileItem = {
        ...fileData,
        id: newFileId,
        accountId: account.id,
        uploadedAt: Date.now(),
        isFavorite: fileData.isFavorite ?? false,
        isPinned: fileData.isPinned ?? false,
        isOfflineAvailable: fileData.isOfflineAvailable ?? false,
        tags: fileData.tags || [],
      };

      if (blobOrFile) {
        const savedUri = await saveLibraryFileBlob(item, blobOrFile);
        if (savedUri) {
          item.localUri = savedUri;
        }
      }

      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: [item, ...(acc.uploadedFiles || [])],
        recentFileIds: [item.id, ...(acc.recentFileIds || []).filter((id) => id !== item.id)].slice(0, 20),
      }));

      return item;
    },
    [account.id, mutateActiveAccount]
  );

  const updateLibraryFile = useCallback(
    async (fileId: string, patch: Partial<LibraryFileItem>) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: (acc.uploadedFiles || []).map((f) =>
          f.id === fileId ? { ...f, ...patch } : f
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const deleteLibraryFile = useCallback(
    async (fileId: string) => {
      const target = account.uploadedFiles?.find((f) => f.id === fileId);
      if (target) {
        void deleteLibraryFileBlob(target);
      }
      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: (acc.uploadedFiles || []).filter((f) => f.id !== fileId),
        recentFileIds: (acc.recentFileIds || []).filter((id) => id !== fileId),
      }));
    },
    [account.uploadedFiles, mutateActiveAccount]
  );

  const toggleFileFavorite = useCallback(
    async (fileId: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: (acc.uploadedFiles || []).map((f) =>
          f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const toggleFilePinned = useCallback(
    async (fileId: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: (acc.uploadedFiles || []).map((f) =>
          f.id === fileId ? { ...f, isPinned: !f.isPinned } : f
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const toggleFileOffline = useCallback(
    async (fileId: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: (acc.uploadedFiles || []).map((f) =>
          f.id === fileId ? { ...f, isOfflineAvailable: !f.isOfflineAvailable } : f
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const recordFileOpened = useCallback(
    async (fileId: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: (acc.uploadedFiles || []).map((f) =>
          f.id === fileId ? { ...f, lastOpenedAt: Date.now() } : f
        ),
        recentFileIds: [fileId, ...(acc.recentFileIds || []).filter((id) => id !== fileId)].slice(0, 20),
      }));
    },
    [mutateActiveAccount]
  );

  const moveLibraryFile = useCallback(
    async (
      fileId: string,
      targetSubjectId: string,
      targetSubjectName: string,
      targetFolderId = 'root',
      targetFolderName = 'General'
    ) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: (acc.uploadedFiles || []).map((f) =>
          f.id === fileId
            ? {
                ...f,
                subjectId: targetSubjectId,
                subjectName: targetSubjectName,
                folderId: targetFolderId,
                folderName: targetFolderName,
              }
            : f
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const copyLibraryFile = useCallback(
    async (
      fileId: string,
      targetSubjectId: string,
      targetSubjectName: string,
      targetFolderId = 'root',
      targetFolderName = 'General'
    ) => {
      await mutateActiveAccount((acc) => {
        const source = (acc.uploadedFiles || []).find((f) => f.id === fileId);
        if (!source) return acc;
        const copy: LibraryFileItem = {
          ...source,
          id: `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          subjectId: targetSubjectId,
          subjectName: targetSubjectName,
          folderId: targetFolderId,
          folderName: targetFolderName,
          title: `${source.title} (Copy)`,
          uploadedAt: Date.now(),
        };
        return {
          ...acc,
          uploadedFiles: [copy, ...(acc.uploadedFiles || [])],
        };
      });
    },
    [mutateActiveAccount]
  );

  const createCustomFolder = useCallback(
    async (
      folder: Omit<LibraryFolderItem, 'id' | 'accountId' | 'createdAt'>
    ): Promise<LibraryFolderItem> => {
      const newFolder: LibraryFolderItem = {
        ...folder,
        id: `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        accountId: account.id,
        createdAt: Date.now(),
      };
      await mutateActiveAccount((acc) => ({
        ...acc,
        customFolders: [...(acc.customFolders || []), newFolder],
      }));
      return newFolder;
    },
    [account.id, mutateActiveAccount]
  );

  const renameCustomFolder = useCallback(
    async (folderId: string, newName: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        customFolders: (acc.customFolders || []).map((f) =>
          f.id === folderId ? { ...f, name: newName.trim() } : f
        ),
        uploadedFiles: (acc.uploadedFiles || []).map((f) =>
          f.folderId === folderId ? { ...f, folderName: newName.trim() } : f
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const deleteCustomFolder = useCallback(
    async (folderId: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        customFolders: (acc.customFolders || []).filter((f) => f.id !== folderId),
        uploadedFiles: (acc.uploadedFiles || []).map((f) =>
          f.folderId === folderId ? { ...f, folderId: 'root', folderName: 'General' } : f
        ),
      }));
    },
    [mutateActiveAccount]
  );

  const createCustomSubject = useCallback(
    async (
      subject: Omit<CustomSubjectItem, 'id' | 'isCustom'>
    ): Promise<CustomSubjectItem> => {
      const newSubj: CustomSubjectItem = {
        ...subject,
        id: `subj-${Date.now().toString(36)}`,
        isCustom: true,
      };
      await mutateActiveAccount((acc) => ({
        ...acc,
        customSubjects: [...(acc.customSubjects || []), newSubj],
      }));
      return newSubj;
    },
    [mutateActiveAccount]
  );

  const deleteCustomSubject = useCallback(
    async (subjectId: string) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        customSubjects: (acc.customSubjects || []).filter((s) => s.id !== subjectId),
        uploadedFiles: (acc.uploadedFiles || []).filter((f) => f.subjectId !== subjectId),
        customFolders: (acc.customFolders || []).filter((f) => f.subjectId !== subjectId),
      }));
    },
    [mutateActiveAccount]
  );

  const clearOfflineFilesCache = useCallback(async () => {
    await mutateActiveAccount((acc) => ({
      ...acc,
      uploadedFiles: (acc.uploadedFiles || []).map((f) => ({
        ...f,
        isOfflineAvailable: false,
      })),
    }));
  }, [mutateActiveAccount]);

  const updatePdfProgress = useCallback(
    async (
      fileId: string,
      page: number,
      totalPages?: number,
      bookmarkPage?: number
    ) => {
      await mutateActiveAccount((acc) => ({
        ...acc,
        uploadedFiles: (acc.uploadedFiles || []).map((f) => {
          if (f.id !== fileId) return f;
          let bookmarks = f.bookmarks || [];
          if (bookmarkPage !== undefined) {
            if (bookmarks.includes(bookmarkPage)) {
              bookmarks = bookmarks.filter((p) => p !== bookmarkPage);
            } else {
              bookmarks = [...bookmarks, bookmarkPage].sort((a, b) => a - b);
            }
          }
          return {
            ...f,
            lastReadPage: page,
            totalPages: totalPages ?? f.totalPages,
            bookmarks,
            lastOpenedAt: Date.now(),
          };
        }),
      }));
    },
    [mutateActiveAccount]
  );

  const language: AppLanguage = (account.language as AppLanguage) || 'en';
  const t = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.en, [language]);
  const setLanguage = useCallback(
    async (nextLang: AppLanguage) => {
      await updateAccount({ language: nextLang });
    },
    [updateAccount]
  );

  const value = useMemo<OrasContextValue>(
    () => ({
      ready,
      language,
      t,
      setLanguage,
      accounts: store.accounts,
      account,
      activeTheme,
      switchAccount,
      createAccount,
      updateAccount,
      togglePreference,
      saveCustomAvatar,
      selectPresetAvatar,
      selectOfficialAvatar,
      toggleLessonComplete,
      toggleFavoriteModule,
      toggleDownloadModule,
      markModuleViewed,
      addSavedNote,
      deleteSavedNote,
      upsertScheduleItem,
      toggleCancelSchedule,
      deleteScheduleItem,
      upsertRequirement,
      toggleRequirementComplete,
      toggleChecklistItem,
      deleteRequirement,
      recordQuizResult,
      recordStudySession,
      markNotificationRead,
      dismissNotification,
      markAllNotificationsRead,
      clearAllNotifications,
      liveStudyTimer,
      startLiveStudyTimer,
      pauseLiveStudyTimer,
      toggleLiveStudyTimer,
      resetLiveStudyTimer,
      endLiveStudySession,
      setLiveStudyContext,
      liveQuizProgress,
      setLiveQuizProgress,
      controlCenterVisible,
      setControlCenterVisible,
      glanceSummaryVisible,
      setGlanceSummaryVisible,
      notificationCenterVisible,
      setNotificationCenterVisible,
      offlineModeSim,
      setOfflineModeSim,
      logoutToOnboarding,
      uploadedFiles: account.uploadedFiles || [],
      customFolders: account.customFolders || [],
      customSubjects: account.customSubjects || [],
      allSubjects,
      uploadLibraryFile,
      updateLibraryFile,
      deleteLibraryFile,
      toggleFileFavorite,
      toggleFilePinned,
      toggleFileOffline,
      recordFileOpened,
      moveLibraryFile,
      copyLibraryFile,
      createCustomFolder,
      renameCustomFolder,
      deleteCustomFolder,
      createCustomSubject,
      deleteCustomSubject,
      clearOfflineFilesCache,
      updatePdfProgress,
    }),
    [
      ready,
      store.accounts,
      account,
      activeTheme,
      switchAccount,
      createAccount,
      updateAccount,
      togglePreference,
      saveCustomAvatar,
      selectPresetAvatar,
      selectOfficialAvatar,
      toggleLessonComplete,
      toggleFavoriteModule,
      toggleDownloadModule,
      markModuleViewed,
      addSavedNote,
      deleteSavedNote,
      upsertScheduleItem,
      toggleCancelSchedule,
      deleteScheduleItem,
      upsertRequirement,
      toggleRequirementComplete,
      toggleChecklistItem,
      deleteRequirement,
      recordQuizResult,
      recordStudySession,
      markNotificationRead,
      dismissNotification,
      markAllNotificationsRead,
      clearAllNotifications,
      liveStudyTimer,
      startLiveStudyTimer,
      pauseLiveStudyTimer,
      toggleLiveStudyTimer,
      resetLiveStudyTimer,
      endLiveStudySession,
      setLiveStudyContext,
      liveQuizProgress,
      controlCenterVisible,
      glanceSummaryVisible,
      notificationCenterVisible,
      offlineModeSim,
      logoutToOnboarding,
      allSubjects,
      uploadLibraryFile,
      updateLibraryFile,
      deleteLibraryFile,
      toggleFileFavorite,
      toggleFilePinned,
      toggleFileOffline,
      recordFileOpened,
      moveLibraryFile,
      copyLibraryFile,
      createCustomFolder,
      renameCustomFolder,
      deleteCustomFolder,
      createCustomSubject,
      deleteCustomSubject,
      clearOfflineFilesCache,
      updatePdfProgress,
      language,
      t,
      setLanguage,
    ]
  );

  return <OrasContext.Provider value={value}>{children}</OrasContext.Provider>;
}

export function useOras() {
  return useContext(OrasContext);
}
