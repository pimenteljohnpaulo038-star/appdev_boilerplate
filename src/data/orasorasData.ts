// ── Core types ───────────────────────────────────────────────────────────────

export type StudentLevel = 'Junior High School' | 'Senior High School' | 'College';

export type StudyMode =
  | 'Focused'
  | 'Balanced'
  | 'Relaxed'
  | 'Quick Review'
  | 'Exam Preparation';

export type ProfileTitle =
  | 'Focused Learner'
  | 'Knowledge Seeker'
  | 'Study Explorer'
  | 'Future Scholar'
  | 'Quiz Master'
  | 'Academic Achiever'
  | 'Goal Getter'
  | 'Module Master'
  | string;

export type PriorityLevel = 'Normal' | 'Approaching' | 'Urgent';
export type TaskType =
  | 'Assignment'
  | 'Project'
  | 'Activity'
  | 'Examination'
  | 'Exam'
  | 'Quiz'
  | 'Reading'
  | 'Presentation'
  | 'Research'
  | 'Lab Report';

export interface CustomAvatarConfig {
  character: 'girl' | 'boy';
  faceShape: 0 | 1 | 2;        // 3 face shapes
  skinTone: 0 | 1 | 2 | 3 | 4; // 5 skin tones
  hairstyle: 0 | 1 | 2 | 3 | 4 | 5; // 6 hairstyles
  hairColor: 0 | 1 | 2 | 3 | 4 | 5; // 6 hair colors
  outfit: 0 | 1 | 2 | 3 | 4;   // 5 outfits
  outfitColor: 0 | 1 | 2 | 3 | 4 | 5; // 6 outfit colors
  accessory: 0 | 1 | 2 | 3;    // 4 accessories (0=None, 1=Glasses, 2=Headphones, 3=Crown/Badge)
}

export interface StudentPreferences {
  classReminders: boolean;
  studyReminders?: boolean;
  requirementAlerts: boolean;
  assignmentReminders?: boolean;
  examReminders?: boolean;
  scheduleAlerts?: boolean;
  announcements?: boolean;
  reminderTimingMin?: number; // 10, 15, 30, 60
  soundEffects: boolean;
  vibrationEnabled?: boolean;
  dailyDigest: boolean;
  autoSaveAI: boolean;
  // Study preferences
  pomodoroFocusMin?: number;
  pomodoroShortBreakMin?: number;
  pomodoroLongBreakMin?: number;
  pomodoroAutoTransition?: boolean;
  dailyStudyGoalMin?: number;
  // Appearance
  layoutDensity?: 'comfortable' | 'compact';
  fontSizePreference?: 'small' | 'medium' | 'large';
  cardGlowEffect?: boolean;
  // Security & Privacy
  biometricLock?: boolean;
  analyticsOptOut?: boolean;
  profilePublic?: boolean;
}

export interface ClassScheduleItem {
  id: string;
  subjectId: string;
  subjectName: string;
  color: string;
  dayOfWeek: number; // 0=Sun .. 6=Sat
  startTime: string; // "08:30" (24h)
  endTime: string;   // "10:00" (24h)
  roomOrLink: string;
  instructor: string;
  repeating: 'Weekly' | 'MWF' | 'TTh' | 'Daily' | 'Once';
  reminderMinutes: number;
  cancelled?: boolean;
  specificDate?: string; // YYYY-MM-DD optional
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface RequirementItem {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // "23:59"
  priority: PriorityLevel;
  taskType: TaskType;
  notes: string;
  attachments: string[];
  checklist: ChecklistItem[];
  completed: boolean;
  reminderEnabled: boolean;
  createdAt: number;
}

export interface QuizResultRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  moduleId: string;
  moduleTitle: string;
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  timeSpentSec: number;
  easyCorrect: number;
  easyTotal: number;
  mediumCorrect: number;
  mediumTotal: number;
  difficultCorrect: number;
  difficultTotal: number;
  strongestTopic: string;
  weakestTopic: string;
  recommendedLesson: string;
  completedAt: number;
}

export interface StudySessionRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  moduleId?: string;
  durationMin: number;
  mode: StudyMode;
  completedAt: number;
}

export interface NotificationItem {
  id: string;
  category:
    | 'Upcoming Class'
    | 'Requirement'
    | 'Urgent Deadline'
    | 'Study Reminder'
    | 'Quiz Recommendation'
    | 'Achievement'
    | 'Weekly Summary';
  title: string;
  body: string;
  timestamp: number;
  dateGroup: 'Today' | 'Yesterday' | 'Earlier This Week';
  read: boolean;
  dismissed: boolean;
  accentColor: string;
  icon: string;
}

export interface SavedLibraryNote {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  content: string;
  type: 'AI Reviewer' | 'Flashcard Deck' | 'Lesson Summary' | 'Quick Note';
  createdAt: number;
}

export type LibraryFileType =
  | 'pdf'
  | 'doc'
  | 'ppt'
  | 'sheet'
  | 'image'
  | 'text'
  | 'other';

export interface LibraryFileItem {
  id: string;
  accountId: string;
  subjectId: string;
  subjectName: string;
  folderId: string; // 'root' or module ID or custom folder ID
  folderName: string;
  title: string;
  originalFileName: string;
  fileType: LibraryFileType;
  mimeType: string;
  fileExtension: string;
  fileSize: number; // in bytes
  uploadedAt: number;
  lastOpenedAt?: number;
  description?: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  isOfflineAvailable: boolean;
  localUri?: string;
  dataUrl?: string;
  textContent?: string;
  lastReadPage?: number;
  totalPages?: number;
  bookmarks?: number[];
}

export interface LibraryFolderItem {
  id: string;
  accountId: string;
  subjectId: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: number;
  isDefaultModuleFolder?: boolean;
}

export interface CustomSubjectItem {
  id: string;
  name: string;
  shortName: string;
  gradeLevels: StudentLevel[];
  color: string;
  secondaryColor: string;
  lightBg: string;
  icon: string;
  instructor?: string;
  room?: string;
  isCustom: true;
}

export interface StudentAccount {
  id: string;
  name: string;
  level: StudentLevel;
  themeId: string; // 1 of 12 themes
  darkMode: boolean;
  presetAvatarId: number; // 0..11 (12 anime preset avatars)
  useCustomAvatar: boolean;
  customAvatar: CustomAvatarConfig;
  profileTitle: ProfileTitle;
  studyMode: StudyMode;
  preferences: StudentPreferences;
  weeklyGoalMinutes: number;
  studyStreak: number;
  longestStreak: number;
  completedLessonIds: string[];
  favoriteModuleIds: string[];
  downloadedModuleIds: string[];
  recentModuleIds: string[];
  savedNotes: SavedLibraryNote[];
  uploadedFiles: LibraryFileItem[];
  customFolders: LibraryFolderItem[];
  customSubjects: CustomSubjectItem[];
  recentFileIds: string[];
  schedule: ClassScheduleItem[];
  requirements: RequirementItem[];
  quizResults: QuizResultRecord[];
  studySessions: StudySessionRecord[];
  notifications: NotificationItem[];
  unlockedAchievementIds: string[];
  language?: 'en' | 'fil';
  email?: string;
  username?: string;
  schoolName?: string;
  passwordHash?: string;
  activityByDate: Record<string, number>; // YYYY-MM-DD -> minutes studied
}

// ── 12 Color Themes ──────────────────────────────────────────────────────────

export interface ColorThemeOption {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

export const COLOR_THEMES: ColorThemeOption[] = [
  { id: 'oras-blue', name: 'Oras Cobalt', primary: '#3B82F6', secondary: '#6366F1', accent: '#10B981', glow: 'rgba(59, 130, 246, 0.28)' },
  { id: 'electric-indigo', name: 'Electric Indigo', primary: '#6366F1', secondary: '#8B5CF6', accent: '#06B6D4', glow: 'rgba(99, 102, 241, 0.28)' },
  { id: 'emerald-scholar', name: 'Emerald Scholar', primary: '#10B981', secondary: '#059669', accent: '#3B82F6', glow: 'rgba(16, 185, 129, 0.28)' },
  { id: 'cyan-aurora', name: 'Cyan Aurora', primary: '#06B6D4', secondary: '#3B82F6', accent: '#6366F1', glow: 'rgba(6, 182, 212, 0.28)' },
  { id: 'royal-violet', name: 'Royal Violet', primary: '#8B5CF6', secondary: '#6366F1', accent: '#EC4899', glow: 'rgba(139, 92, 246, 0.28)' },
  { id: 'amber-horizon', name: 'Amber Horizon', primary: '#F59E0B', secondary: '#EA580C', accent: '#3B82F6', glow: 'rgba(245, 158, 11, 0.28)' },
  { id: 'crimson-focus', name: 'Crimson Focus', primary: '#EF4444', secondary: '#EC4899', accent: '#6366F1', glow: 'rgba(239, 68, 68, 0.28)' },
  { id: 'rose-academy', name: 'Rose Academy', primary: '#EC4899', secondary: '#8B5CF6', accent: '#10B981', glow: 'rgba(236, 72, 153, 0.28)' },
  { id: 'teal-zenith', name: 'Teal Zenith', primary: '#14B8A6', secondary: '#0EA5E9', accent: '#6366F1', glow: 'rgba(20, 184, 166, 0.28)' },
  { id: 'sky-Vanguard', name: 'Sky Vanguard', primary: '#0EA5E9', secondary: '#3B82F6', accent: '#10B981', glow: 'rgba(14, 165, 233, 0.28)' },
  { id: 'sapphire-night', name: 'Sapphire Pulse', primary: '#2563EB', secondary: '#4F46E5', accent: '#F59E0B', glow: 'rgba(37, 99, 235, 0.28)' },
  { id: 'amethyst-glow', name: 'Amethyst Glow', primary: '#7C3AED', secondary: '#3B82F6', accent: '#10B981', glow: 'rgba(124, 58, 237, 0.28)' },
];

// ── 12 Anime Preset Avatars ──────────────────────────────────────────────────

export interface AnimePresetAvatar {
  id: number;
  name: string;
  title: string;
  bgGradient: [string, string];
  config: CustomAvatarConfig;
}

export const ANIME_PRESET_AVATARS: AnimePresetAvatar[] = [
  {
    id: 0,
    name: 'Akira',
    title: 'Honor Strategist',
    bgGradient: ['#3B82F6', '#6366F1'],
    config: { character: 'boy', faceShape: 0, skinTone: 1, hairstyle: 0, hairColor: 0, outfit: 0, outfitColor: 0, accessory: 1 },
  },
  {
    id: 1,
    name: 'Hana',
    title: 'STEM Prodigy',
    bgGradient: ['#6366F1', '#8B5CF6'],
    config: { character: 'girl', faceShape: 1, skinTone: 0, hairstyle: 1, hairColor: 1, outfit: 1, outfitColor: 1, accessory: 0 },
  },
  {
    id: 2,
    name: 'Ren',
    title: 'Code Architect',
    bgGradient: ['#10B981', '#059669'],
    config: { character: 'boy', faceShape: 2, skinTone: 2, hairstyle: 2, hairColor: 2, outfit: 2, outfitColor: 2, accessory: 2 },
  },
  {
    id: 3,
    name: 'Sora',
    title: 'Quantum Reader',
    bgGradient: ['#06B6D4', '#3B82F6'],
    config: { character: 'girl', faceShape: 0, skinTone: 1, hairstyle: 3, hairColor: 3, outfit: 0, outfitColor: 3, accessory: 1 },
  },
  {
    id: 4,
    name: 'Kaito',
    title: 'Calculus Ace',
    bgGradient: ['#F59E0B', '#EA580C'],
    config: { character: 'boy', faceShape: 1, skinTone: 3, hairstyle: 4, hairColor: 4, outfit: 3, outfitColor: 4, accessory: 0 },
  },
  {
    id: 5,
    name: 'Mio',
    title: 'Bio Researcher',
    bgGradient: ['#EC4899', '#8B5CF6'],
    config: { character: 'girl', faceShape: 2, skinTone: 0, hairstyle: 5, hairColor: 5, outfit: 4, outfitColor: 5, accessory: 3 },
  },
  {
    id: 6,
    name: 'Haru',
    title: 'Debate Captain',
    bgGradient: ['#2563EB', '#1D4ED8'],
    config: { character: 'boy', faceShape: 0, skinTone: 1, hairstyle: 1, hairColor: 3, outfit: 1, outfitColor: 0, accessory: 1 },
  },
  {
    id: 7,
    name: 'Yuki',
    title: 'Astro Scholar',
    bgGradient: ['#8B5CF6', '#6366F1'],
    config: { character: 'girl', faceShape: 1, skinTone: 0, hairstyle: 2, hairColor: 0, outfit: 2, outfitColor: 1, accessory: 2 },
  },
  {
    id: 8,
    name: 'Leo',
    title: 'Robotics Lead',
    bgGradient: ['#14B8A6', '#0EA5E9'],
    config: { character: 'boy', faceShape: 2, skinTone: 4, hairstyle: 3, hairColor: 0, outfit: 4, outfitColor: 2, accessory: 0 },
  },
  {
    id: 9,
    name: 'Emi',
    title: 'Literature Maven',
    bgGradient: ['#F43F5E', '#FB7185'],
    config: { character: 'girl', faceShape: 0, skinTone: 2, hairstyle: 4, hairColor: 1, outfit: 3, outfitColor: 4, accessory: 1 },
  },
  {
    id: 10,
    name: 'Zane',
    title: 'Quiz Grandmaster',
    bgGradient: ['#4F46E5', '#7C3AED'],
    config: { character: 'boy', faceShape: 1, skinTone: 1, hairstyle: 5, hairColor: 5, outfit: 0, outfitColor: 5, accessory: 3 },
  },
  {
    id: 11,
    name: 'Aoi',
    title: 'Dean’s Lister',
    bgGradient: ['#0EA5E9', '#6366F1'],
    config: { character: 'girl', faceShape: 2, skinTone: 1, hairstyle: 0, hairColor: 2, outfit: 1, outfitColor: 3, accessory: 2 },
  },
];

export const PROFILE_TITLES: ProfileTitle[] = [
  'Focused Learner',
  'Knowledge Seeker',
  'Study Explorer',
  'Future Scholar',
  'Quiz Master',
  'Academic Achiever',
  'Goal Getter',
  'Module Master',
];

export const STUDY_MODES: { id: StudyMode; label: string; desc: string; icon: string; focusMin: number; breakMin: number }[] = [
  { id: 'Focused', label: 'Focused', desc: 'Deep 50-min immersion blocks for complex problem solving.', icon: 'flash', focusMin: 50, breakMin: 10 },
  { id: 'Balanced', label: 'Balanced', desc: 'Classic 25-min Pomodoro rhythm with restorative breaks.', icon: 'infinite', focusMin: 25, breakMin: 5 },
  { id: 'Relaxed', label: 'Relaxed', desc: 'Gentle 20-min reading sessions with zero pressure.', icon: 'leaf', focusMin: 20, breakMin: 10 },
  { id: 'Quick Review', label: 'Quick Review', desc: 'High-speed 15-min recall sprints before class starts.', icon: 'rocket', focusMin: 15, breakMin: 3 },
  { id: 'Exam Preparation', label: 'Exam Preparation', desc: 'Intensive 45-min mastery drills with adaptive quizzes.', icon: 'Ribbon', focusMin: 45, breakMin: 10 },
];

// ── Academic Library Hierarchy (Grade Level -> Subject -> Module -> Lesson -> Topic) ──

export interface AcademicTopic {
  id: string;
  title: string;
  summary: string;
  keyFormulaOrConcept: string;
}

export interface AcademicLesson {
  id: string;
  title: string;
  durationMin: number;
  content: string;
  topics: AcademicTopic[];
}

export interface QuizQuestion {
  id: string;
  difficulty: 'Easy' | 'Medium' | 'Difficult';
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  topic: string;
}

export interface AcademicModule {
  id: string;
  subjectId: string;
  number: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  recommended?: boolean;
  lessons: AcademicLesson[];
  flashcards: FlashcardItem[];
  questions: QuizQuestion[];
}

export interface AcademicSubject {
  id: string;
  name: string;
  shortName: string;
  gradeLevels: StudentLevel[];
  color: string;
  secondaryColor: string;
  lightBg: string;
  icon: string;
  instructor: string;
  room: string;
  modules: AcademicModule[];
}

export const ACADEMIC_SUBJECTS: AcademicSubject[] = [
  {
    id: 'math',
    name: 'Mathematics & Calculus',
    shortName: 'Mathematics',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#3B82F6',
    secondaryColor: '#2563EB',
    lightBg: '#EFF6FF',
    icon: 'calculator',
    instructor: 'Prof. Elena Vance',
    room: 'Room 304 · Science Wing',
    modules: [
      {
        id: 'math-mod-1',
        subjectId: 'math',
        number: 1,
        title: 'Functions, Limits & Continuity',
        description: 'Master functional behavior, limit laws, asymptotes, and continuous curves across real intervals.',
        estimatedMinutes: 45,
        recommended: true,
        lessons: [
          {
            id: 'math-l-101',
            title: 'Evaluating Limits Algebraically',
            durationMin: 15,
            content: 'A limit describes the value a function approaches as the input approaches a specific point. Direct substitution is always the first step, followed by factoring, conjugate rationalization, or L’Hôpital’s Rule for indeterminate 0/0 forms.',
            topics: [
              { id: 't-m1', title: 'Limit Laws & Direct Substitution', summary: 'Apply sum, product, and quotient laws when denominators are non-zero.', keyFormulaOrConcept: 'lim(x→a) [f(x) + g(x)] = L + M' },
              { id: 't-m2', title: 'Indeterminate Forms (0/0)', summary: 'Factor polynomials or rationalize radicals to remove zero-divisors.', keyFormulaOrConcept: '(x² - a²)/(x - a) = x + a for x ≠ a' },
            ],
          },
          {
            id: 'math-l-102',
            title: 'Continuity & Intermediate Value Theorem',
            durationMin: 18,
            content: 'A function f(x) is continuous at x = c if f(c) is defined, the two-sided limit exists, and the limit equals f(c). Continuous functions over closed intervals guarantee every intermediate value between f(a) and f(b).',
            topics: [
              { id: 't-m3', title: 'Three Conditions of Continuity', summary: 'Point existence, two-sided limit existence, and limit-value agreement.', keyFormulaOrConcept: 'lim(x→c) f(x) = f(c)' },
              { id: 't-m4', title: 'One-Sided Limits & Jump Discontinuities', summary: 'Check left-hand and right-hand limits around piecewise boundaries.', keyFormulaOrConcept: 'lim(x→c⁻) f(x) = lim(x→c⁺) f(x)' },
            ],
          },
        ],
        flashcards: [
          { id: 'fc-m1', topic: 'Limit Laws', front: 'What are the 3 conditions for continuity at x = c?', back: '1) f(c) is defined, 2) lim(x→c) f(x) exists, and 3) lim(x→c) f(x) = f(c).' },
          { id: 'fc-m2', topic: 'Indeterminate Forms', front: 'How do you resolve a 0/0 limit involving a square root?', back: 'Multiply the numerator and denominator by the radical conjugate.' },
          { id: 'fc-m3', topic: 'Asymptotes', front: 'When does a vertical asymptote occur at x = a?', back: 'When lim(x→a) f(x) approaches +∞ or -∞.' },
        ],
        questions: [
          {
            id: 'q-m1-1',
            difficulty: 'Easy',
            topic: 'Direct Substitution',
            question: 'What is the value of lim(x→3) (2x² - 4x + 1)?',
            options: ['5', '7', '9', '11'],
            correctIndex: 1,
            explanation: 'By direct substitution: 2(3)² - 4(3) + 1 = 18 - 12 + 1 = 7.',
          },
          {
            id: 'q-m1-2',
            difficulty: 'Easy',
            topic: 'Continuity Conditions',
            question: 'Which condition is required for f(x) to be continuous at x = c?',
            options: [
              'f(c) must equal zero',
              'lim(x→c) f(x) must equal f(c)',
              'The derivative f\'(c) must be positive',
              'x = c must be a vertical asymptote',
            ],
            correctIndex: 1,
            explanation: 'Continuity at x = c requires that f(c) is defined, the limit exists, and lim(x→c) f(x) = f(c).',
          },
          {
            id: 'q-m1-3',
            difficulty: 'Medium',
            topic: 'Indeterminate Forms',
            question: 'Evaluate lim(x→4) [(x² - 16) / (x - 4)].',
            options: ['0', '4', '8', 'Undefined'],
            correctIndex: 2,
            explanation: 'Factor x² - 16 as (x - 4)(x + 4). Cancel (x - 4) for x ≠ 4, leaving x + 4 = 4 + 4 = 8.',
          },
          {
            id: 'q-m1-4',
            difficulty: 'Medium',
            topic: 'Limits at Infinity',
            question: 'What is lim(x→∞) [(6x³ - 2x) / (3x³ + 5x²)]?',
            options: ['0', '2', '3', '∞'],
            correctIndex: 1,
            explanation: 'When degrees of numerator and denominator are equal (both 3), the limit at infinity is the ratio of leading coefficients: 6 / 3 = 2.',
          },
          {
            id: 'q-m1-5',
            difficulty: 'Difficult',
            topic: 'Radical Conjugates',
            question: 'Evaluate lim(x→0) [(√(x + 9) - 3) / x].',
            options: ['1/6', '1/3', '1/9', '0'],
            correctIndex: 0,
            explanation: 'Multiply by (√(x+9)+3)/(√(x+9)+3) to get x / [x(√(x+9)+3)] = 1 / (3 + 3) = 1/6.',
          },
          {
            id: 'q-m1-6',
            difficulty: 'Difficult',
            topic: 'Piecewise Continuity',
            question: 'For f(x) = kx + 2 (when x ≤ 2) and f(x) = x² + k (when x > 2), what value of k makes f(x) continuous at x = 2?',
            options: ['1', '2', '3', '4'],
            correctIndex: 1,
            explanation: 'Set left and right limits equal at x = 2: 2k + 2 = 2² + k ⇒ 2k + 2 = 4 + k ⇒ k = 2.',
          },
        ],
      },
      {
        id: 'math-mod-2',
        subjectId: 'math',
        number: 2,
        title: 'Derivatives & Rates of Change',
        description: 'Explore tangent slopes, power/chain rules, implicit differentiation, and optimization problems.',
        estimatedMinutes: 55,
        recommended: false,
        lessons: [
          {
            id: 'math-l-201',
            title: 'Power, Product & Quotient Rules',
            durationMin: 20,
            content: 'The derivative measures instantaneous rate of change. Using differentiation rules allows rapid calculation of slopes without expanding difference quotients.',
            topics: [
              { id: 't-m5', title: 'Power Rule', summary: 'Bring down the exponent and subtract 1.', keyFormulaOrConcept: 'd/dx [xⁿ] = n·xⁿ⁻¹' },
              { id: 't-m6', title: 'Product & Quotient Rules', summary: 'Differentiate coupled algebraic products and fractions.', keyFormulaOrConcept: '(uv)\' = u\'v + uv\'' },
            ],
          },
          {
            id: 'math-l-202',
            title: 'The Chain Rule & Optimization',
            durationMin: 25,
            content: 'Composite functions differentiate from the outside in. Setting the first derivative to zero locates critical points for maximum and minimum optimization.',
            topics: [
              { id: 't-m7', title: 'Chain Rule', summary: 'Derivative of outer function times derivative of inner function.', keyFormulaOrConcept: 'd/dx [f(g(x))] = f\'(g(x))·g\'(x)' },
            ],
          },
        ],
        flashcards: [
          { id: 'fc-m4', topic: 'Chain Rule', front: 'State the Chain Rule for d/dx [f(g(x))].', back: 'f\'(g(x)) · g\'(x)' },
          { id: 'fc-m5', topic: 'Critical Points', front: 'Where do critical points of f(x) occur?', back: 'Where f\'(x) = 0 or f\'(x) is undefined.' },
        ],
        questions: [
          {
            id: 'q-m2-1',
            difficulty: 'Easy',
            topic: 'Power Rule',
            question: 'What is the derivative of f(x) = 4x³ - 7x + 12?',
            options: ['12x² - 7', '12x³ - 7', '4x² - 7', '12x² + 5'],
            correctIndex: 0,
            explanation: 'Apply the power rule term by term: 4(3x²) - 7(1) + 0 = 12x² - 7.',
          },
          {
            id: 'q-m2-2',
            difficulty: 'Medium',
            topic: 'Chain Rule',
            question: 'Find f\'(x) if f(x) = (3x² + 1)⁴.',
            options: ['4(3x² + 1)³', '24x(3x² + 1)³', '12x(3x² + 1)³', '6x(3x² + 1)⁴'],
            correctIndex: 1,
            explanation: 'By the Chain Rule: 4(3x² + 1)³ · (6x) = 24x(3x² + 1)³.',
          },
          {
            id: 'q-m2-3',
            difficulty: 'Difficult',
            topic: 'Tangent Line Slope',
            question: 'At what x-value does y = x³ - 6x² + 9x + 2 have a horizontal tangent line?',
            options: ['x = 0 and x = 2', 'x = 1 and x = 3', 'x = 2 and x = 4', 'x = -1 and x = 3'],
            correctIndex: 1,
            explanation: 'Set y\' = 3x² - 12x + 9 = 3(x - 1)(x - 3) = 0, giving x = 1 and x = 3.',
          },
        ],
      },
    ],
  },
  {
    id: 'science',
    name: 'Integrated Science & Physics',
    shortName: 'Science',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#10B981',
    secondaryColor: '#059669',
    lightBg: '#ECFDF5',
    icon: 'planet',
    instructor: 'Dr. Marcus Sterling',
    room: 'Lab 201 · Innovation Hall',
    modules: [
      {
        id: 'sci-mod-1',
        subjectId: 'science',
        number: 1,
        title: 'Cellular Bioenergetics & Genetics',
        description: 'Understand ATP synthesis, photosynthesis, cellular respiration, and Mendelian molecular inheritance.',
        estimatedMinutes: 40,
        recommended: true,
        lessons: [
          {
            id: 'sci-l-101',
            title: 'Photosynthesis & Cellular Respiration',
            durationMin: 20,
            content: 'Chloroplasts capture light energy to convert CO₂ and H₂O into glucose and O₂ via light-dependent reactions and the Calvin Cycle. Mitochondria oxidize glucose to produce ~36–38 ATP molecules.',
            topics: [
              { id: 't-s1', title: 'Light Reactions & Calvin Cycle', summary: 'Thylakoid membranes generate ATP/NADPH; stroma fixes carbon into G3P.', keyFormulaOrConcept: '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂' },
              { id: 't-s2', title: 'Aerobic ATP Production', summary: 'Glycolysis, Krebs Cycle, and Electron Transport Chain.', keyFormulaOrConcept: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~36 ATP' },
            ],
          },
          {
            id: 'sci-l-102',
            title: 'DNA Replication & Protein Synthesis',
            durationMin: 20,
            content: 'Genetic information flows from DNA to mRNA (transcription in the nucleus) and from mRNA to polypeptide chains at ribosomes (translation via tRNA anticodons).',
            topics: [
              { id: 't-s3', title: 'Central Dogma of Molecular Biology', summary: 'DNA → RNA → Protein via transcription and translation.', keyFormulaOrConcept: 'A pairs with U in RNA; C pairs with G' },
            ],
          },
        ],
        flashcards: [
          { id: 'fc-s1', topic: 'Cellular Respiration', front: 'Which stage of cellular respiration produces the most ATP?', back: 'The Electron Transport Chain (Oxidative Phosphorylation) in the inner mitochondrial membrane (~32–34 ATP).' },
          { id: 'fc-s2', topic: 'Photosynthesis', front: 'Where does the Calvin Cycle take place?', back: 'In the stroma of the chloroplast.' },
        ],
        questions: [
          {
            id: 'q-s1-1',
            difficulty: 'Easy',
            topic: 'Organelles',
            question: 'Which organelle is primarily responsible for aerobic ATP production in eukaryotic cells?',
            options: ['Golgi apparatus', 'Mitochondrion', 'Ribosome', 'Lysosome'],
            correctIndex: 1,
            explanation: 'Mitochondria carry out the Krebs cycle and oxidative phosphorylation to generate most cellular ATP.',
          },
          {
            id: 'q-s1-2',
            difficulty: 'Easy',
            topic: 'Photosynthesis',
            question: 'Which gas is released as a byproduct of the light-dependent reactions of photosynthesis?',
            options: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Methane'],
            correctIndex: 2,
            explanation: 'Photolysis of water (H₂O) at Photosystem II releases O₂ gas.',
          },
          {
            id: 'q-s1-3',
            difficulty: 'Medium',
            topic: 'Molecular Genetics',
            question: 'If a DNA template strand reads 3\'-TAC GGA-5\', what is the complementary mRNA sequence?',
            options: ['5\'-AUG CCU-3\'', '5\'-ATG CCT-3\'', '5\'-UAC GGA-3\'', '5\'-GCA TTC-3\''],
            correctIndex: 0,
            explanation: 'In RNA transcription, T→A, A→U, C→G, and G→C, yielding 5\'-AUG CCU-3\'.',
          },
          {
            id: 'q-s1-4',
            difficulty: 'Medium',
            topic: 'Cellular Respiration',
            question: 'What is the net ATP yield directly from glycolysis per molecule of glucose?',
            options: ['2 ATP', '4 ATP', '18 ATP', '36 ATP'],
            correctIndex: 0,
            explanation: 'Glycolysis invests 2 ATP and generates 4 ATP, resulting in a net gain of 2 ATP.',
          },
          {
            id: 'q-s1-5',
            difficulty: 'Difficult',
            topic: 'Enzyme Kinetics & Bioenergetics',
            question: 'Why does cyanide halt ATP production in the Electron Transport Chain?',
            options: [
              'It blocks glucose transport across the plasma membrane',
              'It inhibits Cytochrome c oxidase (Complex IV), preventing oxygen from accepting electrons',
              'It denatures salivary amylase during digestion',
              'It dissolves the chloroplast thylakoid lumen',
            ],
            correctIndex: 1,
            explanation: 'Cyanide binds to Complex IV, halting electron flow to O₂ and collapsing the proton gradient needed for ATP synthase.',
          },
        ],
      },
      {
        id: 'sci-mod-2',
        subjectId: 'science',
        number: 2,
        title: 'Kinematics, Forces & Energy Conservation',
        description: 'Analyze projectile motion, Newton’s three laws, work-energy theorems, and momentum collisions.',
        estimatedMinutes: 50,
        recommended: true,
        lessons: [
          {
            id: 'sci-l-201',
            title: 'Newtonian Dynamics & Free-Body Diagrams',
            durationMin: 25,
            content: 'Net force equals mass times acceleration (ΣF = ma). Free-body diagrams isolate normal, frictional, tension, and gravitational vector components.',
            topics: [
              { id: 't-s4', title: 'Newton’s Second Law', summary: 'Acceleration is directly proportional to net force and inversely proportional to mass.', keyFormulaOrConcept: 'ΣF = m · a' },
            ],
          },
        ],
        flashcards: [
          { id: 'fc-s3', topic: 'Kinematics', front: 'What is the acceleration of a projectile at the highest point of its trajectory?', back: '9.8 m/s² downward (gravity never turns off!).' },
        ],
        questions: [
          {
            id: 'q-s2-1',
            difficulty: 'Easy',
            topic: 'Newton’s Second Law',
            question: 'A net force of 24 N acts on a 6 kg mass. What is its acceleration?',
            options: ['2 m/s²', '4 m/s²', '6 m/s²', '144 m/s²'],
            correctIndex: 1,
            explanation: 'a = F / m = 24 N / 6 kg = 4 m/s².',
          },
          {
            id: 'q-s2-2',
            difficulty: 'Medium',
            topic: 'Mechanical Energy',
            question: 'A 2 kg ball is dropped from rest at a height of 5 m (g = 9.8 m/s²). What is its kinetic energy just before hitting the ground?',
            options: ['19.6 J', '49 J', '98 J', '196 J'],
            correctIndex: 2,
            explanation: 'By conservation of energy, KE_bottom = PE_top = mgh = 2 × 9.8 × 5 = 98 J.',
          },
          {
            id: 'q-s2-3',
            difficulty: 'Difficult',
            topic: 'Incline Dynamics',
            question: 'A block slides down a frictionless 30° incline. What is its acceleration down the ramp in terms of g?',
            options: ['0.25 g', '0.50 g', '0.866 g', '1.00 g'],
            correctIndex: 1,
            explanation: 'Along a frictionless incline of angle θ, a = g·sin(θ). Since sin(30°) = 0.5, a = 0.50 g.',
          },
        ],
      },
    ],
  },
  {
    id: 'cs',
    name: 'Computer Science & AI',
    shortName: 'CompSci',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#6366F1',
    secondaryColor: '#4F46E5',
    lightBg: '#EEF2FF',
    icon: 'terminal',
    instructor: 'Prof. Kenji Takahashi',
    room: 'Room 108 · Cyber Lab',
    modules: [
      {
        id: 'cs-mod-1',
        subjectId: 'cs',
        number: 1,
        title: 'Algorithms, Complexity & Data Structures',
        description: 'Design efficient algorithms with Big-O analysis, hash maps, trees, and graph traversals.',
        estimatedMinutes: 45,
        recommended: true,
        lessons: [
          {
            id: 'cs-l-101',
            title: 'Asymptotic Big-O Complexity',
            durationMin: 20,
            content: 'Big-O notation characterizes how runtime or space scales as input size n grows. Binary search operates in O(log n), hash lookups average O(1), and comparison sorting takes O(n log n).',
            topics: [
              { id: 't-c1', title: 'Time & Space Complexity', summary: 'Compare O(1), O(log n), O(n), O(n log n), and O(n²).', keyFormulaOrConcept: 'Binary Search = O(log₂ n)' },
            ],
          },
          {
            id: 'cs-l-102',
            title: 'Trees, Graphs & BFS/DFS Traversal',
            durationMin: 25,
            content: 'Breadth-First Search uses a FIFO Queue to explore level by level (shortest unweighted path), while Depth-First Search uses a LIFO Stack or recursion.',
            topics: [
              { id: 't-c2', title: 'BFS vs DFS', summary: 'Queue for level-order BFS; Stack/Recursion for DFS.', keyFormulaOrConcept: 'O(V + E) graph traversal' },
            ],
          },
        ],
        flashcards: [
          { id: 'fc-c1', topic: 'Big-O', front: 'What is the time complexity of Binary Search on a sorted array of n elements?', back: 'O(log n)' },
          { id: 'fc-c2', topic: 'Graphs', front: 'Which data structure does Breadth-First Search (BFS) use?', back: 'A Queue (First-In, First-Out).' },
        ],
        questions: [
          {
            id: 'q-c1-1',
            difficulty: 'Easy',
            topic: 'Data Structures',
            question: 'Which data structure operates on a Last-In, First-Out (LIFO) principle?',
            options: ['Queue', 'Stack', 'Hash Table', 'Linked List'],
            correctIndex: 1,
            explanation: 'A Stack pushes and pops elements from the top, following Last-In, First-Out (LIFO).',
          },
          {
            id: 'q-c1-2',
            difficulty: 'Medium',
            topic: 'Time Complexity',
            question: 'What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (BST) with n nodes?',
            options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
            correctIndex: 1,
            explanation: 'A balanced BST has height O(log n), so root-to-leaf lookup takes at most O(log n) comparisons.',
          },
          {
            id: 'q-c1-3',
            difficulty: 'Difficult',
            topic: 'Graph Algorithms',
            question: 'Why cannot Dijkstra’s shortest-path algorithm guarantee correct results on graphs with negative edge weights?',
            options: [
              'It uses a stack instead of a priority queue',
              'Its greedy assumption that a settled vertex’s distance can never be improved fails when negative edges exist',
              'It only works on trees with fewer than 10 nodes',
              'It requires all edge weights to be prime numbers',
            ],
            correctIndex: 1,
            explanation: 'Dijkstra assumes adding edges only increases path cost; a negative edge later can make a previously settled path suboptimal.',
          },
        ],
      },
    ],
  },
  {
    id: 'eng',
    name: 'Academic English & Rhetoric',
    shortName: 'English',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#F59E0B',
    secondaryColor: '#D97706',
    lightBg: '#FFFBEB',
    icon: 'book',
    instructor: 'Prof. Claire Hawthorne',
    room: 'Room 112 · Humanities',
    modules: [
      {
        id: 'eng-mod-1',
        subjectId: 'eng',
        number: 1,
        title: 'Argumentative Synthesis & Critical Analysis',
        description: 'Craft persuasive thesis statements, evaluate rhetorical appeals, and synthesize peer-reviewed sources.',
        estimatedMinutes: 35,
        recommended: false,
        lessons: [
          {
            id: 'eng-l-101',
            title: 'Ethos, Pathos, Logos & Thesis Architecture',
            durationMin: 18,
            content: 'Strong academic arguments combine credible authority (ethos), logical evidence (logos), and resonant framing (pathos) anchored by a falsifiable, specific thesis statement.',
            topics: [
              { id: 't-e1', title: 'Aristotelian Appeals', summary: 'Balance credibility, empirical logic, and audience resonance.', keyFormulaOrConcept: 'Claim + Warrant + Empirical Impact = Thesis' },
            ],
          },
        ],
        flashcards: [
          { id: 'fc-e1', topic: 'Rhetoric', front: 'What is the difference between Ethos, Logos, and Pathos?', back: 'Ethos appeals to credibility/ethics, Logos appeals to logic/evidence, and Pathos appeals to emotion.' },
        ],
        questions: [
          {
            id: 'q-e1-1',
            difficulty: 'Easy',
            topic: 'Rhetorical Appeals',
            question: 'Citing peer-reviewed statistical data in a research paper primarily strengthens which rhetorical appeal?',
            options: ['Pathos', 'Logos', 'Kairos', 'Bathos'],
            correctIndex: 1,
            explanation: 'Logos appeals to logic, reasoning, and empirical evidence.',
          },
          {
            id: 'q-e1-2',
            difficulty: 'Medium',
            topic: 'Logical Fallacies',
            question: 'Attacking an opponent’s personal character rather than addressing their argument is known as:',
            options: ['Straw Man', 'Ad Hominem', 'False Dilemma', 'Slippery Slope'],
            correctIndex: 1,
            explanation: 'Ad Hominem ("to the person") attacks the speaker instead of the logical claim.',
          },
          {
            id: 'q-e1-3',
            difficulty: 'Difficult',
            topic: 'Academic Synthesis',
            question: 'Which sentence demonstrates true academic synthesis rather than a simple summary?',
            options: [
              'Smith (2023) studied solar panels, and Lee (2024) also wrote a book about energy.',
              'While Smith (2023) attributes grid latency to storage costs, Lee’s (2024) microgrid data reveals transmission bottlenecks are the primary driver.',
              'Solar energy is very popular today in many countries.',
              'According to page 12, the experiment lasted four weeks.',
            ],
            correctIndex: 1,
            explanation: 'Synthesis puts multiple sources in conversation to reveal relationships, tensions, or new insights.',
          },
        ],
      },
    ],
  },
  {
    id: 'hist',
    name: 'World History & Social Studies',
    shortName: 'History',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#EC4899',
    secondaryColor: '#DB2777',
    lightBg: '#FDF2F8',
    icon: 'globe',
    instructor: 'Prof. Julian Navarro',
    room: 'Room 208 · Heritage Wing',
    modules: [
      {
        id: 'hist-mod-1',
        subjectId: 'hist',
        number: 1,
        title: 'Industrialization, Globalization & Civic Systems',
        description: 'Examine economic revolutions, constitutional governance, and interconnected global trade networks.',
        estimatedMinutes: 35,
        recommended: false,
        lessons: [
          {
            id: 'hist-l-101',
            title: 'The Industrial Revolution & Urbanization',
            durationMin: 18,
            content: 'Mechanized steam power, iron metallurgy, and railway networks transformed agrarian societies into industrial urban centers during the 18th and 19th centuries.',
            topics: [
              { id: 't-h1', title: 'Steam & Mechanization', summary: 'Shift from cottage workshops to mechanized factory production.', keyFormulaOrConcept: 'Coal + Steam Engine + Rail = Industrial Takeoff' },
            ],
          },
        ],
        flashcards: [
          { id: 'fc-h1', topic: 'Industrialization', front: 'Why did the First Industrial Revolution begin in Great Britain?', back: 'Abundant coal/iron deposits, navigable rivers, capital accumulation, and agricultural enclosure.' },
        ],
        questions: [
          {
            id: 'q-h1-1',
            difficulty: 'Easy',
            topic: 'Industrial Revolution',
            question: 'Which energy source powered the steam engines of the First Industrial Revolution?',
            options: ['Coal', 'Nuclear fission', 'Solar arrays', 'Natural gas turbines'],
            correctIndex: 0,
            explanation: 'Coal fueled James Watt’s steam engines and iron smelting furnaces.',
          },
          {
            id: 'q-h1-2',
            difficulty: 'Medium',
            topic: 'Historiography',
            question: 'Which of the following is a primary historical source?',
            options: [
              'A modern textbook chapter on World War II',
              'An original 1896 diary written by a factory worker',
              'A 2025 encyclopedia entry on the Renaissance',
              'A documentary film narrated by historians',
            ],
            correctIndex: 1,
            explanation: 'Primary sources are firsthand documents or artifacts created during the historical period under study.',
          },
          {
            id: 'q-h1-3',
            difficulty: 'Difficult',
            topic: 'Economic History',
            question: 'How did the 18th-century Enclosure Acts in Britain accelerate industrial urbanization?',
            options: [
              'They banned all factories from cities',
              'They consolidated common farmland, displacing rural laborers who migrated to industrial cities',
              'They abolished maritime trade tariffs across the Pacific',
              'They required all citizens to attend university',
            ],
            correctIndex: 1,
            explanation: 'Enclosing common lands increased agricultural output while pushing displaced tenant farmers into urban factory labor.',
          },
        ],
      },
    ],
  },
  {
    id: 'fil',
    name: 'Filipino: Panitikan, Gramatika at Retorika',
    shortName: 'Filipino',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#EF4444',
    secondaryColor: '#DC2626',
    lightBg: '#FEF2F2',
    icon: 'language',
    instructor: 'G. Rodrigo Ramos',
    room: 'Silid 204 · Gusaling Rizal',
    modules: [
      {
        id: 'fil-mod-1',
        subjectId: 'fil',
        number: 1,
        title: 'Panitikang Pilipino at Masining na Pagpapahayag',
        description: 'Tuklasin ang mga akdang pampanitikan, idyomatikong pahayag, at mga uri ng tayutay sa retorika.',
        estimatedMinutes: 40,
        recommended: true,
        lessons: [
          {
            id: 'fil-l-101',
            title: 'Mga Elemento ng Akdang Pampanitikan',
            durationMin: 15,
            content: 'Ang masusing pagsusuri ng tauhan, tagpuan, banghay, at tema ay pundasyon ng mapanuring pagbasa.',
            topics: [
              { id: 't-fil-1', title: 'Mga Uri ng Tayutay', summary: 'Pagtutulad, Pagwawangis, Pagbibigay-katauhan.', keyFormulaOrConcept: 'Tayutay at Idyoma' },
            ],
          },
        ],
        flashcards: [],
        questions: [],
      },
      {
        id: 'fil-mod-2',
        subjectId: 'fil',
        number: 2,
        title: 'Balarila, Sintaks at Akademikong Pagsulat',
        description: 'Tamang gamit ng mga salita, estruktura ng pangungusap, at pormal na pananaliksik sa wikang Filipino.',
        estimatedMinutes: 45,
        recommended: false,
        lessons: [],
        flashcards: [],
        questions: [],
      },
    ],
  },
  {
    id: 'ap',
    name: 'Araling Panlipunan: Kasaysayan at Ekonomiks',
    shortName: 'Araling Panlipunan',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#8B5CF6',
    secondaryColor: '#7C3AED',
    lightBg: '#F5F3FF',
    icon: 'globe',
    instructor: 'Bb. Maria Clara Santos',
    room: 'Room 210 · Heritage Hall',
    modules: [
      {
        id: 'ap-mod-1',
        subjectId: 'ap',
        number: 1,
        title: 'Heograpiya at Kasaysayan ng Asya',
        description: 'Pag-aaral sa pisikal na heograpiya, kabihasnang Asyano, at sosyo-ekonomikong impluwensya.',
        estimatedMinutes: 45,
        recommended: true,
        lessons: [
          {
            id: 'ap-l-101',
            title: 'Sinaunang Kabihasnan sa Asya',
            durationMin: 18,
            content: 'Pagsusuri sa lambak-ilog ng Tigris-Euphrates, Indus, Huang Ho, at ang kanilang kontribusyon sa modernong lipunan.',
            topics: [
              { id: 't-ap-1', title: 'Sibilisasyong Mesopotamia at Indus', summary: 'Cuneiform, Ziggurat, Harappa at Mohenjo-Daro.', keyFormulaOrConcept: 'Lambak-ilog at Agrikultura' },
            ],
          },
        ],
        flashcards: [],
        questions: [],
      },
      {
        id: 'ap-mod-2',
        subjectId: 'ap',
        number: 2,
        title: 'Makroekonomiks at Pambansang Kaunlaran',
        description: 'Demand, supply, implasyon, patakarang piskal, at mga salik ng pambansang kaunlaran.',
        estimatedMinutes: 50,
        recommended: false,
        lessons: [],
        flashcards: [],
        questions: [],
      },
    ],
  },
  {
    id: 'mapeh',
    name: 'MAPEH: Music, Arts, PE & Health',
    shortName: 'MAPEH',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#EC4899',
    secondaryColor: '#DB2777',
    lightBg: '#FDF2F8',
    icon: 'fitness',
    instructor: 'Coach Dominic Cruz',
    room: 'Gymnasium & Cultural Pavilion',
    modules: [
      {
        id: 'mapeh-mod-1',
        subjectId: 'mapeh',
        number: 1,
        title: 'Physical Fitness Protocols & Sports Nutrition',
        description: 'Cardiovascular endurance, physical fitness assessments, BMI calculations, and balanced nutritional habits.',
        estimatedMinutes: 35,
        recommended: true,
        lessons: [
          {
            id: 'mapeh-l-101',
            title: 'Health-Related Fitness Components',
            durationMin: 15,
            content: 'Cardiovascular endurance, muscular strength, muscular endurance, flexibility, and body composition.',
            topics: [
              { id: 't-map-1', title: 'HRF vs SRF Testing', summary: 'Measuring target heart rate and aerobic capacity.', keyFormulaOrConcept: 'Target Heart Rate = (220 - Age) × 0.70' },
            ],
          },
        ],
        flashcards: [],
        questions: [],
      },
      {
        id: 'mapeh-mod-2',
        subjectId: 'mapeh',
        number: 2,
        title: 'Traditional Asian Performing Arts & Musical Forms',
        description: 'Rhythmic modes, traditional musical instruments, and cultural folk dance traditions across Southeast Asia.',
        estimatedMinutes: 40,
        recommended: false,
        lessons: [],
        flashcards: [],
        questions: [],
      },
    ],
  },
  {
    id: 'ict',
    name: 'ICT: Web, Cloud & Systems Architecture',
    shortName: 'ICT',
    gradeLevels: ['Junior High School', 'Senior High School', 'College'],
    color: '#06B6D4',
    secondaryColor: '#0891B2',
    lightBg: '#ECFEFF',
    icon: 'hardware-chip',
    instructor: 'Engr. Katrina Rivera',
    room: 'Tech Hub 4 · Cloud Wing',
    modules: [
      {
        id: 'ict-mod-1',
        subjectId: 'ict',
        number: 1,
        title: 'Modern Web Applications & Responsive Frameworks',
        description: 'HTML5 semantic architecture, CSS3 Grid/Flexbox, JavaScript ESNext, and mobile-first responsive interfaces.',
        estimatedMinutes: 50,
        recommended: true,
        lessons: [
          {
            id: 'ict-l-101',
            title: 'Modern Web Layouts & Component Systems',
            durationMin: 20,
            content: 'Building accessible, fluid interfaces with CSS Grid, Flexbox, and modular React component trees.',
            topics: [
              { id: 't-ict-1', title: 'Flexbox vs CSS Grid', summary: 'One-dimensional vs two-dimensional responsive layouts.', keyFormulaOrConcept: 'display: flex | display: grid' },
            ],
          },
        ],
        flashcards: [],
        questions: [],
      },
      {
        id: 'ict-mod-2',
        subjectId: 'ict',
        number: 2,
        title: 'Relational Databases, SQL & Cloud Services',
        description: 'Relational schemas, normalization (1NF-3NF), indexing strategies, and SQLite / IndexedDB client storage.',
        estimatedMinutes: 55,
        recommended: false,
        lessons: [],
        flashcards: [],
        questions: [],
      },
    ],
  },
  {
    id: 'research',
    name: 'Practical Research & Methodology',
    shortName: 'Research',
    gradeLevels: ['Senior High School', 'College'],
    color: '#6366F1',
    secondaryColor: '#4F46E5',
    lightBg: '#EEF2FF',
    icon: 'search-circle',
    instructor: 'Dr. Evelyn Morales',
    room: 'Research Center · Conference Room B',
    modules: [
      {
        id: 'res-mod-1',
        subjectId: 'research',
        number: 1,
        title: 'Quantitative Research Design & IMRaD Framework',
        description: 'Formulating empirical hypotheses, sampling procedures, IMRaD manuscript structures, and research ethics.',
        estimatedMinutes: 60,
        recommended: true,
        lessons: [
          {
            id: 'res-l-101',
            title: 'The IMRaD Structure & Literature Review',
            durationMin: 22,
            content: 'Mastering the Introduction, Methods, Results, and Discussion structure with rigorous APA 7th referencing.',
            topics: [
              { id: 't-res-1', title: 'Sampling Techniques', summary: 'Probability vs Non-Probability sampling methodologies.', keyFormulaOrConcept: "Slovin's Formula: n = N / (1 + Ne²)" },
            ],
          },
        ],
        flashcards: [],
        questions: [],
      },
      {
        id: 'res-mod-2',
        subjectId: 'research',
        number: 2,
        title: 'Statistical Testing, Hypotheses & Data Interpretation',
        description: 'Descriptive and inferential statistics, p-values, t-tests, Pearson r correlation, and ANOVA interpretations.',
        estimatedMinutes: 55,
        recommended: false,
        lessons: [],
        flashcards: [],
        questions: [],
      },
    ],
  },
  {
    id: 'bio',
    name: 'General & Molecular Biology',
    shortName: 'Biology',
    gradeLevels: ['Senior High School', 'College'],
    color: '#14B8A6',
    secondaryColor: '#0D9488',
    lightBg: '#F0FDFA',
    icon: 'leaf',
    instructor: 'Dr. Teresa Alcantara',
    room: 'Bio-Lab 301 · Science Complex',
    modules: [
      {
        id: 'bio-mod-1',
        subjectId: 'bio',
        number: 1,
        title: 'Cellular Physiology & DNA Replication',
        description: 'Explore macromolecular structures, organelle functions, enzyme catalysis, and DNA replication mechanisms.',
        estimatedMinutes: 50,
        recommended: true,
        lessons: [
          {
            id: 'bio-l-101',
            title: 'DNA Replication & Central Dogma',
            durationMin: 20,
            content: 'Helicase, DNA polymerase III, Okazaki fragments, and transcription/translation workflows.',
            topics: [
              { id: 't-bio-1', title: 'Semi-Conservative Replication', summary: 'Leading and lagging strand synthesis at the replication fork.', keyFormulaOrConcept: '5’ to 3’ Polymerization' },
            ],
          },
        ],
        flashcards: [],
        questions: [],
      },
      {
        id: 'bio-mod-2',
        subjectId: 'bio',
        number: 2,
        title: 'Mendelian Genetics & Ecosystem Dynamics',
        description: 'Monohybrid/dihybrid crosses, Punnett squares, population genetics, and trophic energy flow.',
        estimatedMinutes: 45,
        recommended: false,
        lessons: [],
        flashcards: [],
        questions: [],
      },
    ],
  },
  {
    id: 'chem',
    name: 'General & Organic Chemistry',
    shortName: 'Chemistry',
    gradeLevels: ['Senior High School', 'College'],
    color: '#EA580C',
    secondaryColor: '#C2410C',
    lightBg: '#FFF7ED',
    icon: 'color-filter',
    instructor: 'Prof. Arthur Pendelton',
    room: 'Chem-Lab 102 · Science Complex',
    modules: [
      {
        id: 'chem-mod-1',
        subjectId: 'chem',
        number: 1,
        title: 'Atomic Orbitals, Periodic Trends & Bonding',
        description: 'Quantum numbers, electron configurations, electronegativity trends, Lewis structures, and VSEPR geometry.',
        estimatedMinutes: 50,
        recommended: true,
        lessons: [
          {
            id: 'chem-l-101',
            title: 'Periodic Trends & VSEPR Molecular Geometry',
            durationMin: 20,
            content: 'Ionization energy, atomic radii, electron affinity, and molecular shape prediction via electron domain repulsion.',
            topics: [
              { id: 't-chem-1', title: 'VSEPR Shapes & Polarity', summary: 'Linear, trigonal planar, tetrahedral, and bent molecular geometry.', keyFormulaOrConcept: 'Steric Number = Lone Pairs + Bonded Atoms' },
            ],
          },
        ],
        flashcards: [],
        questions: [],
      },
      {
        id: 'chem-mod-2',
        subjectId: 'chem',
        number: 2,
        title: 'Stoichiometry, Acid-Base Equilibria & Thermochemistry',
        description: 'Molar conversions, limiting reactants, titration curves, pH calculations, and enthalpy changes.',
        estimatedMinutes: 55,
        recommended: false,
        lessons: [],
        flashcards: [],
        questions: [],
      },
    ],
  },
  {
    id: 'physics',
    name: 'Classical Mechanics & Applied Physics',
    shortName: 'Physics',
    gradeLevels: ['Senior High School', 'College'],
    color: '#2563EB',
    secondaryColor: '#1D4ED8',
    lightBg: '#EFF6FF',
    icon: 'planet',
    instructor: 'Dr. Gregory Vance',
    room: 'Physics Hall 205 · Quantum Wing',
    modules: [
      {
        id: 'phys-mod-1',
        subjectId: 'physics',
        number: 1,
        title: 'Kinematics, Newtonian Dynamics & Energy Conservation',
        description: 'Vectors in 2D, free-body diagrams, friction, uniform circular motion, work-energy theorem, and momentum.',
        estimatedMinutes: 55,
        recommended: true,
        lessons: [
          {
            id: 'phys-l-101',
            title: 'Newtonian Laws & Work-Energy Theorem',
            durationMin: 22,
            content: 'Applying vector equilibrium, friction forces, kinetic energy, and potential energy transformations.',
            topics: [
              { id: 't-phys-1', title: 'Work-Energy Theorem', summary: 'Net work equals the change in kinetic energy.', keyFormulaOrConcept: 'W_net = ΔK = ½mv_f² - ½mv_i²' },
            ],
          },
        ],
        flashcards: [],
        questions: [],
      },
      {
        id: 'phys-mod-2',
        subjectId: 'physics',
        number: 2,
        title: 'Waves, Optics, Thermodynamics & Electromagnetism',
        description: 'Simple harmonic motion, wave interference, Snell’s Law, heat transfer, and electric circuits.',
        estimatedMinutes: 55,
        recommended: false,
        lessons: [],
        flashcards: [],
        questions: [],
      },
    ],
  },
];

// ── Academic Achievements ────────────────────────────────────────────────────

export interface AcademicAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  xpReward: number;
}

export const ACADEMIC_ACHIEVEMENTS: AcademicAchievement[] = [
  { id: 'first-quiz', title: 'First Quiz', description: 'Complete your first module mastery quiz in OrasOras.', icon: 'ribbon', color: '#3B82F6', xpReward: 100 },
  { id: 'perfect-score', title: 'Perfect Score', description: 'Achieve 100% accuracy on any academic quiz.', icon: 'trophy', color: '#F59E0B', xpReward: 250 },
  { id: 'five-day-streak', title: 'Five-Day Streak', description: 'Study consistently for 5 consecutive days.', icon: 'flame', color: '#EF4444', xpReward: 200 },
  { id: 'study-starter', title: 'Study Starter', description: 'Complete a focused Pomodoro study session.', icon: 'timer', color: '#6366F1', xpReward: 100 },
  { id: 'module-master', title: 'Module Master', description: 'Complete all lessons inside an academic module.', icon: 'library', color: '#10B981', xpReward: 300 },
  { id: 'quiz-champion', title: 'Quiz Champion', description: 'Complete 5 or more quizzes with 80%+ average accuracy.', icon: 'medal', color: '#8B5CF6', xpReward: 400 },
  { id: 'early-finisher', title: 'Early Finisher', description: 'Submit a requirement at least 24 hours before its deadline.', icon: 'checkmark-done-circle', color: '#06B6D4', xpReward: 150 },
  { id: 'consistent-learner', title: 'Consistent Learner', description: 'Reach 80% or more of your weekly study goal.', icon: 'trending-up', color: '#10B981', xpReward: 200 },
  { id: 'subject-expert', title: 'Subject Expert', description: 'Master 90%+ accuracy across all difficulty tiers in a subject.', icon: 'school', color: '#3B82F6', xpReward: 500 },
  { id: 'requirements-hero', title: 'Requirements Hero', description: 'Complete 5 academic requirements with zero overdue tasks.', icon: 'shield-checkmark', color: '#EC4899', xpReward: 300 },
];

// ── Default Seed Data Generator for New Accounts ─────────────────────────────

export function createDefaultAccount(
  partial?: Partial<StudentAccount>
): StudentAccount {
  const today = new Date();
  const fmtDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const todayDow = today.getDay();
  const id = partial?.id ?? `acc-${Date.now().toString(36)}`;
  const presetId = partial?.presetAvatarId ?? 0;
  const preset = ANIME_PRESET_AVATARS[presetId] ?? ANIME_PRESET_AVATARS[0];

  const activityByDate: Record<string, number> = {};
  const dailyMins = [35, 45, 30, 55, 40, 60, 50, 25, 45, 50, 65, 40, 55, 45];
  for (let i = 0; i < 14; i++) {
    activityByDate[fmtDate(-i)] = dailyMins[i % dailyMins.length];
  }

  return {
    id,
    name: partial?.name || 'Alex Rivera',
    level: partial?.level || 'Senior High School',
    themeId: partial?.themeId || 'oras-blue',
    darkMode: partial?.darkMode ?? false,
    presetAvatarId: presetId,
    useCustomAvatar: false,
    customAvatar: { ...preset.config },
    profileTitle: 'Focused Learner',
    studyMode: 'Focused',
    preferences: {
      classReminders: true,
      studyReminders: true,
      requirementAlerts: true,
      assignmentReminders: true,
      examReminders: true,
      scheduleAlerts: true,
      announcements: true,
      reminderTimingMin: 15,
      soundEffects: true,
      vibrationEnabled: true,
      dailyDigest: true,
      autoSaveAI: true,
      pomodoroFocusMin: 25,
      pomodoroShortBreakMin: 5,
      pomodoroLongBreakMin: 15,
      pomodoroAutoTransition: true,
      dailyStudyGoalMin: 60,
      layoutDensity: 'comfortable',
      fontSizePreference: 'medium',
      cardGlowEffect: true,
      biometricLock: false,
      analyticsOptOut: false,
      profilePublic: true,
      ...partial?.preferences,
    },
    weeklyGoalMinutes: 300,
    studyStreak: 7,
    longestStreak: 14,
    completedLessonIds: ['math-l-101', 'sci-l-101', 'cs-l-101'],
    favoriteModuleIds: ['math-mod-1', 'sci-mod-1'],
    downloadedModuleIds: ['math-mod-1', 'cs-mod-1'],
    recentModuleIds: ['math-mod-1', 'sci-mod-1', 'cs-mod-1'],
    savedNotes: [
      {
        id: 'note-1',
        title: 'Limits & Continuity Quick Reviewer',
        subjectId: 'math',
        subjectName: 'Mathematics',
        content: '1. Direct Substitution first.\n2. If 0/0 occurs, factor polynomials or multiply by the radical conjugate.\n3. Continuity at x=c requires f(c) defined, limit exists, and lim f(x) = f(c).',
        type: 'AI Reviewer',
        createdAt: Date.now() - 3600 * 1000 * 5,
      },
    ],
    uploadedFiles: [
      {
        id: 'file-math-1',
        accountId: id,
        subjectId: 'math',
        subjectName: 'Mathematics',
        folderId: 'math-mod-1',
        folderName: 'Functions, Limits & Continuity',
        title: 'Calculus I Comprehensive Syllabus 2026',
        originalFileName: 'Calculus_I_Comprehensive_Syllabus.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 2450000,
        uploadedAt: Date.now() - 86400000 * 5,
        lastOpenedAt: Date.now() - 3600 * 1000 * 3,
        description: 'Complete academic course syllabus outlining derivative rules, integration techniques, and exam schedule.',
        tags: ['syllabus', 'calculus', 'derivatives', 'grading-rubric'],
        isFavorite: true,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 4,
        totalPages: 18,
        bookmarks: [1, 4, 12],
      },
      {
        id: 'file-math-2',
        accountId: id,
        subjectId: 'math',
        subjectName: 'Mathematics',
        folderId: 'math-mod-1',
        folderName: 'Functions, Limits & Continuity',
        title: 'Limits & Continuity Formula Quick-Reference',
        originalFileName: 'Limits_and_Continuity_Formula_Sheet.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 1120000,
        uploadedAt: Date.now() - 86400000 * 3,
        lastOpenedAt: Date.now() - 3600 * 1000 * 1,
        description: 'Quick memory sheet for algebraic limit formulas, radical conjugates, and indeterminate forms.',
        tags: ['formulas', 'cheatsheet', 'limits'],
        isFavorite: false,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 1,
        totalPages: 4,
        bookmarks: [1],
      },
      {
        id: 'file-math-3',
        accountId: id,
        subjectId: 'math',
        subjectName: 'Mathematics',
        folderId: 'math-mod-2',
        folderName: 'Differential Calculus & Real-World Applications',
        title: 'Problem Set #4 Step-by-Step Solutions',
        originalFileName: 'Calculus_Problem_Set_4_Solutions.docx',
        fileType: 'doc',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileExtension: 'docx',
        fileSize: 850000,
        uploadedAt: Date.now() - 86400000 * 2,
        lastOpenedAt: Date.now() - 3600 * 1000 * 8,
        description: 'Annotated solutions with conjugate steps and piecewise continuity proofs.',
        tags: ['homework', 'solutions', 'continuity'],
        isFavorite: true,
        isPinned: false,
        isOfflineAvailable: false,
      },
      {
        id: 'file-sci-1',
        accountId: id,
        subjectId: 'science',
        subjectName: 'Science',
        folderId: 'sci-mod-1',
        folderName: 'Cellular Bioenergetics & Genetics',
        title: 'Cellular Respiration & Genetics Lab Manual',
        originalFileName: 'Cellular_Respiration_and_Genetics_Lab_Manual.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 3820000,
        uploadedAt: Date.now() - 86400000 * 4,
        lastOpenedAt: Date.now() - 3600 * 1000 * 5,
        description: 'Protocols for spinach leaf assay, spectrophotometer calibration, and ATP yield measurement.',
        tags: ['lab', 'biology', 'experiments', 'mitochondria'],
        isFavorite: true,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 7,
        totalPages: 24,
        bookmarks: [3, 7],
      },
      {
        id: 'file-sci-2',
        accountId: id,
        subjectId: 'science',
        subjectName: 'Science',
        folderId: 'sci-mod-1',
        folderName: 'Cellular Bioenergetics & Genetics',
        title: 'Spectrophotometry Experimental Raw Data',
        originalFileName: 'Spinach_Assay_Raw_Data_Run3.xlsx',
        fileType: 'sheet',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileExtension: 'xlsx',
        fileSize: 420000,
        uploadedAt: Date.now() - 86400000 * 1,
        lastOpenedAt: Date.now() - 3600 * 1000 * 12,
        description: 'Absorbance readings at 680nm across four light intensity trials.',
        tags: ['data', 'spectrophotometry', 'tables'],
        isFavorite: false,
        isPinned: false,
        isOfflineAvailable: true,
      },
      {
        id: 'file-eng-1',
        accountId: id,
        subjectId: 'eng',
        subjectName: 'English',
        folderId: 'eng-mod-1',
        folderName: 'Rhetoric, Argumentation & Academic Synthesis',
        title: 'Critical Reading & Academic Rhetoric Handbook',
        originalFileName: 'Academic_Rhetoric_and_Synthesis_Guide.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 1950000,
        uploadedAt: Date.now() - 86400000 * 6,
        lastOpenedAt: Date.now() - 3600 * 1000 * 20,
        description: 'Guidelines on Aristotelian rhetorical appeals (Ethos, Pathos, Logos) and synthesis essay structures.',
        tags: ['rhetoric', 'writing', 'apa-format', 'essay'],
        isFavorite: true,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 3,
        totalPages: 14,
        bookmarks: [1, 3],
      },
      {
        id: 'file-fil-1',
        accountId: id,
        subjectId: 'fil',
        subjectName: 'Filipino',
        folderId: 'fil-mod-1',
        folderName: 'Panitikang Pilipino at Masining na Pagpapahayag',
        title: 'Retorika at Masining na Pagpapahayag Modyul',
        originalFileName: 'Retorika_at_Masining_na_Pagpapahayag.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 2150000,
        uploadedAt: Date.now() - 86400000 * 3,
        lastOpenedAt: Date.now() - 3600 * 1000 * 15,
        description: 'Komprehensibong gabay sa tayutay, idyoma, at mga teoryang pampanitikan.',
        tags: ['panitikan', 'retorika', 'gramatika'],
        isFavorite: true,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 2,
        totalPages: 16,
        bookmarks: [2],
      },
      {
        id: 'file-ap-1',
        accountId: id,
        subjectId: 'ap',
        subjectName: 'Araling Panlipunan',
        folderId: 'ap-mod-1',
        folderName: 'Heograpiya at Kasaysayan ng Asya',
        title: 'Demographic Transition Model Lecture Deck',
        originalFileName: 'Demographic_Transition_Model_Summary.pptx',
        fileType: 'ppt',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        fileExtension: 'pptx',
        fileSize: 1850000,
        uploadedAt: Date.now() - 86400000 * 4,
        lastOpenedAt: Date.now() - 3600 * 1000 * 4,
        description: 'Slide presentation on birth rate, death rate, and economic urbanization.',
        tags: ['demographics', 'slides', 'geography'],
        isFavorite: false,
        isPinned: false,
        isOfflineAvailable: false,
      },
      {
        id: 'file-mapeh-1',
        accountId: id,
        subjectId: 'mapeh',
        subjectName: 'MAPEH',
        folderId: 'mapeh-mod-1',
        folderName: 'Physical Fitness Protocols & Sports Nutrition',
        title: 'Physical Fitness Testing Protocol & Nutrition',
        originalFileName: 'Physical_Fitness_Testing_Protocol.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 1620000,
        uploadedAt: Date.now() - 86400000 * 5,
        lastOpenedAt: Date.now() - 3600 * 1000 * 18,
        description: 'Standard cardiovascular endurance, flexibility, and BMI measurement standards.',
        tags: ['fitness', 'health', 'bmi', 'testing'],
        isFavorite: false,
        isPinned: false,
        isOfflineAvailable: true,
        lastReadPage: 1,
        totalPages: 12,
        bookmarks: [1],
      },
      {
        id: 'file-ict-1',
        accountId: id,
        subjectId: 'ict',
        subjectName: 'ICT',
        folderId: 'ict-mod-1',
        folderName: 'Modern Web Applications & Responsive Frameworks',
        title: 'Full-Stack Web Architecture & REST API Guide',
        originalFileName: 'FullStack_Web_Architecture_Guide.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 2780000,
        uploadedAt: Date.now() - 86400000 * 2,
        lastOpenedAt: Date.now() - 3600 * 1000 * 1,
        description: 'Architecture diagrams for React, TypeScript, IndexedDB offline sync, and REST endpoints.',
        tags: ['frontend', 'react', 'api', 'architecture'],
        isFavorite: true,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 5,
        totalPages: 20,
        bookmarks: [2, 5, 11],
      },
      {
        id: 'file-res-1',
        accountId: id,
        subjectId: 'research',
        subjectName: 'Research',
        folderId: 'res-mod-1',
        folderName: 'Quantitative Research Design & IMRaD Framework',
        title: 'Practical Research 2 IMRaD Guidelines & Rubrics',
        originalFileName: 'Practical_Research_2_IMRaD_Guidelines.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 4120000,
        uploadedAt: Date.now() - 86400000 * 7,
        lastOpenedAt: Date.now() - 3600 * 1000 * 6,
        description: 'Standard research format: Introduction, Methods, Results, and Discussion with sample APA 7th tables.',
        tags: ['irad', 'methodology', 'sampling', 'rubric'],
        isFavorite: true,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 8,
        totalPages: 32,
        bookmarks: [1, 8, 20],
      },
      {
        id: 'file-bio-1',
        accountId: id,
        subjectId: 'bio',
        subjectName: 'Biology',
        folderId: 'bio-mod-1',
        folderName: 'Cellular Physiology & DNA Replication',
        title: 'Advanced Cellular Bioenergetics & ATP Synthase',
        originalFileName: 'Advanced_Cellular_Bioenergetics.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 2950000,
        uploadedAt: Date.now() - 86400000 * 3,
        lastOpenedAt: Date.now() - 3600 * 1000 * 9,
        description: 'High-resolution electron transport chain diagrams and chemiosmotic gradient mechanics.',
        tags: ['mitochondria', 'atp', 'biochemistry'],
        isFavorite: true,
        isPinned: false,
        isOfflineAvailable: true,
        lastReadPage: 4,
        totalPages: 18,
        bookmarks: [4],
      },
      {
        id: 'file-chem-1',
        accountId: id,
        subjectId: 'chem',
        subjectName: 'Chemistry',
        folderId: 'chem-mod-1',
        folderName: 'Atomic Orbitals, Periodic Trends & Bonding',
        title: 'Periodic Trends & Stoichiometry Mastery Handout',
        originalFileName: 'Periodic_Trends_and_Stoichiometry.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 2540000,
        uploadedAt: Date.now() - 86400000 * 4,
        lastOpenedAt: Date.now() - 3600 * 1000 * 2,
        description: 'Electronegativity, ionization energy, limiting reactant calculations, and balanced equations.',
        tags: ['stoichiometry', 'periodic-table', 'orbitals'],
        isFavorite: true,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 6,
        totalPages: 16,
        bookmarks: [2, 6],
      },
      {
        id: 'file-phys-1',
        accountId: id,
        subjectId: 'physics',
        subjectName: 'Physics',
        folderId: 'phys-mod-1',
        folderName: 'Kinematics, Newtonian Dynamics & Energy Conservation',
        title: 'Classical Mechanics & Kinematics Handbook',
        originalFileName: 'Classical_Mechanics_and_Kinematics.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        fileSize: 3420000,
        uploadedAt: Date.now() - 86400000 * 5,
        lastOpenedAt: Date.now() - 3600 * 1000 * 1,
        description: 'Projectiles in 2D, friction coefficients, free-body diagrams, and work-energy theorem proofs.',
        tags: ['vectors', 'newtonian-laws', 'mechanics', 'energy'],
        isFavorite: true,
        isPinned: true,
        isOfflineAvailable: true,
        lastReadPage: 9,
        totalPages: 26,
        bookmarks: [1, 5, 9],
      },
    ],
    customFolders: [
      {
        id: 'fld-math-syllabus',
        accountId: id,
        subjectId: 'math',
        name: 'Syllabus & Course Policies',
        color: '#3B82F6',
        icon: 'folder',
        createdAt: Date.now() - 86400000 * 7,
      },
      {
        id: 'fld-math-hw',
        accountId: id,
        subjectId: 'math',
        name: 'Problem Sets & Worksheets',
        color: '#2563EB',
        icon: 'folder',
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        id: 'fld-sci-lab',
        accountId: id,
        subjectId: 'science',
        name: 'Laboratory Manuals & Run Sheets',
        color: '#10B981',
        icon: 'folder',
        createdAt: Date.now() - 86400000 * 6,
      },
      {
        id: 'fld-res-templates',
        accountId: id,
        subjectId: 'research',
        name: 'IMRaD Rubrics & Instrument Scales',
        color: '#6366F1',
        icon: 'folder',
        createdAt: Date.now() - 86400000 * 8,
      },
    ],
    customSubjects: [],
    recentFileIds: ['file-math-2', 'file-phys-1', 'file-ict-1', 'file-chem-1', 'file-math-1'],
    schedule: [
      {
        id: 'sch-1',
        subjectId: 'math',
        subjectName: 'Mathematics & Calculus',
        color: '#3B82F6',
        dayOfWeek: todayDow,
        startTime: '09:00',
        endTime: '10:30',
        roomOrLink: 'Room 304 · Science Wing',
        instructor: 'Prof. Elena Vance',
        repeating: 'MWF',
        reminderMinutes: 15,
      },
      {
        id: 'sch-2',
        subjectId: 'science',
        subjectName: 'Integrated Science & Physics',
        color: '#10B981',
        dayOfWeek: todayDow,
        startTime: '13:00',
        endTime: '14:30',
        roomOrLink: 'Lab 201 · Innovation Hall',
        instructor: 'Dr. Marcus Sterling',
        repeating: 'Daily',
        reminderMinutes: 15,
      },
      {
        id: 'sch-3',
        subjectId: 'cs',
        subjectName: 'Computer Science & AI',
        color: '#6366F1',
        dayOfWeek: todayDow,
        startTime: '15:30',
        endTime: '17:00',
        roomOrLink: 'Room 108 · Cyber Lab (Zoom Hybrid)',
        instructor: 'Prof. Kenji Takahashi',
        repeating: 'TTh',
        reminderMinutes: 10,
      },
      {
        id: 'sch-4',
        subjectId: 'eng',
        subjectName: 'Academic English & Rhetoric',
        color: '#F59E0B',
        dayOfWeek: (todayDow + 1) % 7,
        startTime: '10:00',
        endTime: '11:30',
        roomOrLink: 'Room 112 · Humanities',
        instructor: 'Prof. Claire Hawthorne',
        repeating: 'TTh',
        reminderMinutes: 15,
      },
      {
        id: 'sch-5',
        subjectId: 'hist',
        subjectName: 'World History & Social Studies',
        color: '#EC4899',
        dayOfWeek: (todayDow + 1) % 7,
        startTime: '14:00',
        endTime: '15:30',
        roomOrLink: 'Room 208 · Heritage Wing',
        instructor: 'Prof. Julian Navarro',
        repeating: 'MWF',
        reminderMinutes: 15,
        cancelled: true,
      },
    ],
    requirements: [
      {
        id: 'req-1',
        title: 'Calculus Problem Set #4: Limits & Continuity',
        subjectId: 'math',
        subjectName: 'Mathematics',
        dueDate: fmtDate(0),
        dueTime: '17:00',
        priority: 'Approaching',
        taskType: 'Assignment',
        notes: 'Complete exercises 1–18 odd problems and show conjugate steps clearly.',
        attachments: ['Calculus_PS4_Worksheet.pdf'],
        checklist: [
          { id: 'ck-1', text: 'Solve algebraic limit problems (1–9)', done: true },
          { id: 'ck-2', text: 'Prove piecewise continuity at x = 2', done: true },
          { id: 'ck-3', text: 'Export clean PDF scan', done: false },
        ],
        completed: false,
        reminderEnabled: true,
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'req-2',
        title: 'Cellular Bioenergetics Lab Report',
        subjectId: 'science',
        subjectName: 'Science',
        dueDate: fmtDate(1),
        dueTime: '23:59',
        priority: 'Approaching',
        taskType: 'Lab Report',
        notes: 'Include oxygen evolution graph and ATP yield comparison table.',
        attachments: ['Spinach_Leaf_Assay_Data.xlsx', 'Lab_Rubric.pdf'],
        checklist: [
          { id: 'ck-4', text: 'Plot light intensity vs O₂ rate', done: true },
          { id: 'ck-5', text: 'Write discussion on Complex IV inhibition', done: false },
        ],
        completed: false,
        reminderEnabled: true,
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: 'req-3',
        title: 'Graph Traversal Visualizer Mini-Project',
        subjectId: 'cs',
        subjectName: 'CompSci',
        dueDate: fmtDate(-1),
        dueTime: '18:00',
        priority: 'Urgent',
        taskType: 'Project',
        notes: 'Implement BFS and DFS shortest-path benchmark in TypeScript.',
        attachments: ['Graph_Starter_Repo.zip'],
        checklist: [
          { id: 'ck-6', text: 'Implement Queue-based BFS', done: true },
          { id: 'ck-7', text: 'Add Big-O complexity comparison table', done: false },
        ],
        completed: false,
        reminderEnabled: true,
        createdAt: Date.now() - 86400000 * 4,
      },
      {
        id: 'req-4',
        title: 'Aristotelian Rhetoric Synthesis Essay',
        subjectId: 'eng',
        subjectName: 'English',
        dueDate: fmtDate(3),
        dueTime: '16:00',
        priority: 'Normal',
        taskType: 'Assignment',
        notes: 'Synthesize 3 peer-reviewed articles on renewable microgrids.',
        attachments: ['Outline_Draft_v2.docx'],
        checklist: [
          { id: 'ck-8', text: 'Draft thesis statement', done: true },
          { id: 'ck-9', text: 'Format APA 7th citations', done: true },
        ],
        completed: true,
        reminderEnabled: false,
        createdAt: Date.now() - 86400000 * 5,
      },
    ],
    quizResults: [
      {
        id: 'qr-1',
        subjectId: 'math',
        subjectName: 'Mathematics',
        moduleId: 'math-mod-1',
        moduleTitle: 'Functions, Limits & Continuity',
        scorePercent: 92,
        correctCount: 5,
        incorrectCount: 1,
        totalQuestions: 6,
        timeSpentSec: 185,
        easyCorrect: 2,
        easyTotal: 2,
        mediumCorrect: 2,
        mediumTotal: 2,
        difficultCorrect: 1,
        difficultTotal: 2,
        strongestTopic: 'Direct Substitution & Indeterminate Forms',
        weakestTopic: 'Piecewise Continuity',
        recommendedLesson: 'Continuity & Intermediate Value Theorem',
        completedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'qr-2',
        subjectId: 'science',
        subjectName: 'Science',
        moduleId: 'sci-mod-1',
        moduleTitle: 'Cellular Bioenergetics & Genetics',
        scorePercent: 80,
        correctCount: 4,
        incorrectCount: 1,
        totalQuestions: 5,
        timeSpentSec: 160,
        easyCorrect: 2,
        easyTotal: 2,
        mediumCorrect: 2,
        mediumTotal: 2,
        difficultCorrect: 0,
        difficultTotal: 1,
        strongestTopic: 'Photosynthesis & Organelles',
        weakestTopic: 'Enzyme Kinetics & Bioenergetics',
        recommendedLesson: 'Photosynthesis & Cellular Respiration',
        completedAt: Date.now() - 86400000 * 1,
      },
      {
        id: 'qr-3',
        subjectId: 'cs',
        subjectName: 'CompSci',
        moduleId: 'cs-mod-1',
        moduleTitle: 'Algorithms, Complexity & Data Structures',
        scorePercent: 100,
        correctCount: 3,
        incorrectCount: 0,
        totalQuestions: 3,
        timeSpentSec: 110,
        easyCorrect: 1,
        easyTotal: 1,
        mediumCorrect: 1,
        mediumTotal: 1,
        difficultCorrect: 1,
        difficultTotal: 1,
        strongestTopic: 'Time Complexity & Graph Algorithms',
        weakestTopic: 'None — Full Mastery',
        recommendedLesson: 'Trees, Graphs & BFS/DFS Traversal',
        completedAt: Date.now() - 3600 * 1000 * 6,
      },
    ],
    studySessions: [
      { id: 'ss-1', subjectId: 'math', subjectName: 'Mathematics', moduleId: 'math-mod-1', durationMin: 50, mode: 'Focused', completedAt: Date.now() - 86400000 * 2 },
      { id: 'ss-2', subjectId: 'science', subjectName: 'Science', moduleId: 'sci-mod-1', durationMin: 45, mode: 'Exam Preparation', completedAt: Date.now() - 86400000 * 1 },
      { id: 'ss-3', subjectId: 'cs', subjectName: 'CompSci', moduleId: 'cs-mod-1', durationMin: 50, mode: 'Focused', completedAt: Date.now() - 3600 * 1000 * 8 },
      { id: 'ss-4', subjectId: 'eng', subjectName: 'English', moduleId: 'eng-mod-1', durationMin: 35, mode: 'Balanced', completedAt: Date.now() - 3600 * 1000 * 4 },
      { id: 'ss-5', subjectId: 'math', subjectName: 'Mathematics', moduleId: 'math-mod-2', durationMin: 60, mode: 'Focused', completedAt: Date.now() - 3600 * 1000 * 2 },
    ],
    notifications: [
      {
        id: 'notif-1',
        category: 'Upcoming Class',
        title: 'Next Class in 25 Minutes',
        body: 'Mathematics & Calculus with Prof. Elena Vance starts soon in Room 304.',
        timestamp: Date.now() - 1000 * 60 * 12,
        dateGroup: 'Today',
        read: false,
        dismissed: false,
        accentColor: '#3B82F6',
        icon: 'time',
      },
      {
        id: 'notif-2',
        category: 'Urgent Deadline',
        title: 'Overdue Requirement Alert',
        body: 'Graph Traversal Visualizer Mini-Project (CompSci) passed its 18:00 deadline.',
        timestamp: Date.now() - 1000 * 60 * 45,
        dateGroup: 'Today',
        read: false,
        dismissed: false,
        accentColor: '#EF4444',
        icon: 'alert-circle',
      },
      {
        id: 'notif-3',
        category: 'Requirement',
        title: '2 Requirements Due Soon',
        body: 'Calculus Problem Set #4 is due today at 17:00, followed by Bioenergetics Lab Report tomorrow.',
        timestamp: Date.now() - 1000 * 60 * 120,
        dateGroup: 'Today',
        read: false,
        dismissed: false,
        accentColor: '#F59E0B',
        icon: 'document-text',
      },
      {
        id: 'notif-4',
        category: 'Achievement',
        title: 'Achievement Unlocked: Perfect Score!',
        body: 'You scored 100% on Algorithms, Complexity & Data Structures (+250 XP).',
        timestamp: Date.now() - 1000 * 3600 * 18,
        dateGroup: 'Yesterday',
        read: true,
        dismissed: false,
        accentColor: '#10B981',
        icon: 'trophy',
      },
      {
        id: 'notif-5',
        category: 'Quiz Recommendation',
        title: 'Recommended Review: Difficult Science',
        body: 'Boost your Bioenergetics mastery from 80% to 95% with a 5-minute adaptive quiz.',
        timestamp: Date.now() - 1000 * 3600 * 26,
        dateGroup: 'Yesterday',
        read: true,
        dismissed: false,
        accentColor: '#6366F1',
        icon: 'sparkles',
      },
      {
        id: 'notif-6',
        category: 'Weekly Summary',
        title: 'Weekly Progress: 80% Goal Reached',
        body: 'You studied 240 of 300 minutes this week and improved quiz accuracy by +12%.',
        timestamp: Date.now() - 1000 * 3600 * 54,
        dateGroup: 'Earlier This Week',
        read: true,
        dismissed: false,
        accentColor: '#3B82F6',
        icon: 'bar-chart',
      },
    ],
    unlockedAchievementIds: [
      'first-quiz',
      'perfect-score',
      'five-day-streak',
      'study-starter',
      'consistent-learner',
      'early-finisher',
    ],
    language: 'en',
    email: partial?.email || 'alex.rivera@orasoras.edu',
    username: partial?.username || 'alex_rivera',
    schoolName: partial?.schoolName || 'Philippine Science High School',
    passwordHash: partial?.passwordHash || 'oras2026',
    activityByDate,
  };
}
