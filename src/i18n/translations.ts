export type AppLanguage = 'en' | 'fil';

export interface TranslationDictionary {
  // Navigation Tabs
  tabHome: string;
  tabLibrary: string;
  tabStudy: string;
  tabProgress: string;
  tabProfile: string;

  // Common & Header
  appName: string;
  tagline: string;
  offline: string;
  online: string;
  search: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  close: string;
  completed: string;
  pending: string;
  language: string;
  english: string;
  filipino: string;

  // Home Screen
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  todaysClasses: string;
  noClassesToday: string;
  viewCalendar: string;
  quickActions: string;
  actionAddSchedule: string;
  actionAddRequirement: string;
  actionStudyFocus: string;
  actionCalculator: string;
  actionFlashcards: string;
  actionTakeQuiz: string;
  academicOverview: string;
  weeklyStudyGoal: string;
  continueStudying: string;
  resumeReading: string;
  upcomingDeadlines: string;
  viewAllRequirements: string;
  daysStreak: string;
  badgesEarned: string;

  // Library Screen
  libraryTitle: string;
  librarySubtitle: string;
  filesTab: string;
  curriculumTab: string;
  uploadFileBtn: string;
  storageUsage: string;
  allFiles: string;
  recentFiles: string;
  pinnedFiles: string;
  favoriteFiles: string;
  availableOffline: string;
  createFolder: string;
  newSubject: string;
  noFilesFound: string;
  markCompleted: string;
  keyConcepts: string;

  // Study Hub Screen
  studyHubTitle: string;
  studyHubSubtitle: string;
  focusTimer: string;
  startFocus: string;
  pauseTimer: string;
  resumeTimer: string;
  resetTimer: string;
  breakTime: string;
  focusTime: string;
  ambientSound: string;
  ambientPlaying: string;
  ambientMuted: string;
  spacedRepetition: string;
  masteryProgress: string;
  tapToFlip: string;
  rateRetention: string;
  rateDifficult: string;
  rateMedium: string;
  rateEasy: string;
  addFlashcard: string;
  noFlashcardsYet: string;
  aiReviewerTitle: string;
  generateReviewerBtn: string;

  // Progress Screen
  progressTitle: string;
  progressSubtitle: string;
  overallScore: string;
  accuracyRate: string;
  focusHours: string;
  modulesMastered: string;
  subjectMastery: string;
  studyActivity: string;

  // Profile Screen
  profileTitle: string;
  profileSubtitle: string;
  editProfile: string;
  avatarStudio: string;
  appLanguage: string;
  selectLanguage: string;
  colorThemes: string;
  studyModeTitle: string;
  preferencesTitle: string;
  accountsAndStorage: string;
  clearCache: string;
  switchAccount: string;

  // Tools & Calculator
  toolsTitle: string;
  calculatorTab: string;
  stopwatchTab: string;
  timerTab: string;
  converterTab: string;
  notesTab: string;
  lap: string;
  reset: string;
  start: string;
  stop: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  en: {
    tabHome: 'Home',
    tabLibrary: 'Library',
    tabStudy: 'Study',
    tabProgress: 'Progress',
    tabProfile: 'Profile',

    appName: 'OrasOras',
    tagline: 'Never Miss Class or Requirements Again.',
    offline: 'Offline Ready',
    online: 'Online',
    search: 'Search...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    completed: 'Completed',
    pending: 'Pending',
    language: 'Language',
    english: 'English',
    filipino: 'Filipino (Tagalog)',

    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    todaysClasses: "Today's Schedule",
    noClassesToday: 'No classes scheduled for today',
    viewCalendar: 'View Calendar →',
    quickActions: 'Quick Actions',
    actionAddSchedule: 'Add Class',
    actionAddRequirement: 'Add Task',
    actionStudyFocus: 'Pomodoro',
    actionCalculator: 'Calculator',
    actionFlashcards: 'Flashcards',
    actionTakeQuiz: 'Take Quiz',
    academicOverview: 'Academic Overview',
    weeklyStudyGoal: 'Weekly Goal',
    continueStudying: 'Continue Studying',
    resumeReading: 'Resume Reading →',
    upcomingDeadlines: 'Upcoming Deadlines',
    viewAllRequirements: 'View All →',
    daysStreak: 'day streak',
    badgesEarned: 'badges',

    libraryTitle: 'Academic Library',
    librarySubtitle: 'All modules, files, and PDFs organized by subject.',
    filesTab: 'Subject Files & PDFs',
    curriculumTab: 'Curriculum & Lessons',
    uploadFileBtn: 'Upload File',
    storageUsage: 'Local Storage',
    allFiles: 'All Files',
    recentFiles: 'Recent Files',
    pinnedFiles: 'Pinned',
    favoriteFiles: 'Favorites',
    availableOffline: 'Available Offline',
    createFolder: 'Create Folder',
    newSubject: 'New Subject',
    noFilesFound: 'No files in this folder yet.',
    markCompleted: 'Mark as Completed',
    keyConcepts: 'KEY CONCEPTS & TOPICS',

    studyHubTitle: 'Study Hub & Retention',
    studyHubSubtitle: 'Pomodoro focus timer, active recall, and spaced repetition.',
    focusTimer: 'Pomodoro Focus Timer',
    startFocus: 'Start Focus',
    pauseTimer: 'Pause',
    resumeTimer: 'Resume',
    resetTimer: 'Reset',
    breakTime: 'Break Time',
    focusTime: 'Focus Time',
    ambientSound: 'Focus Ambient Simulator',
    ambientPlaying: 'Playing',
    ambientMuted: 'Muted',
    spacedRepetition: 'Active Recall Flashcards',
    masteryProgress: 'Deck Mastery',
    tapToFlip: 'Tap card to flip',
    rateRetention: 'RATE RETENTION:',
    rateDifficult: 'Difficult (+1d)',
    rateMedium: 'Medium (+3d)',
    rateEasy: 'Easy (+7d)',
    addFlashcard: 'Add Flashcard',
    noFlashcardsYet: 'No Flashcards Yet',
    aiReviewerTitle: 'Smart Study Plan & Reviewer Generator',
    generateReviewerBtn: 'Generate AI Reviewer',

    progressTitle: 'Academic Progress',
    progressSubtitle: 'Real-time performance analytics, quiz accuracy, and study trends.',
    overallScore: 'OVERALL',
    accuracyRate: 'Quiz Accuracy',
    focusHours: 'Study Hours',
    modulesMastered: 'Mastered Modules',
    subjectMastery: 'Subject Mastery Breakdown',
    studyActivity: '14-Day Study Activity Heatmap',

    profileTitle: 'Student Profile & Settings',
    profileSubtitle: 'Customize your avatar, themes, and study preferences.',
    editProfile: 'Edit Profile',
    avatarStudio: 'Avatar Studio',
    appLanguage: 'App Language / Wika',
    selectLanguage: 'Select Interface Language',
    colorThemes: 'Visual Color Themes',
    studyModeTitle: 'Study Mode & Timers',
    preferencesTitle: 'Study Preferences & Notifications',
    accountsAndStorage: 'Accounts, Offline Storage & Backup',
    clearCache: 'Clear Cache',
    switchAccount: 'Switch Profile',

    toolsTitle: 'Academic Study Tools',
    calculatorTab: 'Calculator',
    stopwatchTab: 'Stopwatch',
    timerTab: 'Timer',
    converterTab: 'Converter',
    notesTab: 'Quick Notes',
    lap: 'Lap',
    reset: 'Reset',
    start: 'Start',
    stop: 'Stop',
  },

  fil: {
    tabHome: 'Tahanan',
    tabLibrary: 'Aklatan',
    tabStudy: 'Mag-aral',
    tabProgress: 'Progreso',
    tabProfile: 'Talaan',

    appName: 'OrasOras',
    tagline: 'Huwag Nang Mahuli sa Klase o mga Gawain.',
    offline: 'Puwede Offline',
    online: 'Online',
    search: 'Maghanap...',
    save: 'I-save',
    cancel: 'Kanselahin',
    delete: 'Burahin',
    edit: 'I-edit',
    close: 'Isara',
    completed: 'Tapos Na',
    pending: 'Nakabinbin',
    language: 'Wika',
    english: 'Ingles',
    filipino: 'Filipino (Tagalog)',

    greetingMorning: 'Magandang umaga',
    greetingAfternoon: 'Magandang hapon',
    greetingEvening: 'Magandang gabi',
    todaysClasses: 'Klase Ngayong Araw',
    noClassesToday: 'Walang nakatakdang klase ngayong araw',
    viewCalendar: 'Tingnan ang Kalendaryo →',
    quickActions: 'Mabilisang Aksyon',
    actionAddSchedule: 'Magdagdag ng Klase',
    actionAddRequirement: 'Magdagdag ng Gawain',
    actionStudyFocus: 'Pomodoro',
    actionCalculator: 'Kalkulador',
    actionFlashcards: 'Flashcards',
    actionTakeQuiz: 'Magsimula ng Pagsusulit',
    academicOverview: 'Pangkalahatang Akademiko',
    weeklyStudyGoal: 'Lingguhang Tunguhin',
    continueStudying: 'Ipagpatuloy ang Pag-aaral',
    resumeReading: 'Ipagpatuloy ang Pagbabasa →',
    upcomingDeadlines: 'Mga Nalalapit na Pasahan',
    viewAllRequirements: 'Tingnan Lahat →',
    daysStreak: 'araw na sunod-sunod',
    badgesEarned: 'mga badge',

    libraryTitle: 'Aklatan ng mga Aralin',
    librarySubtitle: 'Lahat ng modyul, file, at PDF na nakaayos bawat asignatura.',
    filesTab: 'Mga File at PDF ng Asignatura',
    curriculumTab: 'Kurikulum at mga Aralin',
    uploadFileBtn: 'Mag-upload ng File',
    storageUsage: 'Lokal na Imbakan',
    allFiles: 'Lahat ng File',
    recentFiles: 'Kamakailan Lamang',
    pinnedFiles: 'Naka-pin',
    favoriteFiles: 'Paborito',
    availableOffline: 'Puwede Offline',
    createFolder: 'Gumawa ng Folder',
    newSubject: 'Bagong Asignatura',
    noFilesFound: 'Wala pang file sa folder na ito.',
    markCompleted: 'Markahan Bilang Tapos Na',
    keyConcepts: 'MGA PANGUNAHING KONSEPTO AT ARALIN',

    studyHubTitle: 'Sentro ng Pag-aaral at Pagsasaulo',
    studyHubSubtitle: 'Pomodoro focus timer, active recall, at spaced repetition.',
    focusTimer: 'Pomodoro Focus Timer',
    startFocus: 'Simulan ang Pokus',
    pauseTimer: 'I-pause',
    resumeTimer: 'Ipagpatuloy',
    resetTimer: 'I-reset',
    breakTime: 'Oras ng Pahinga',
    focusTime: 'Oras ng Pag-aaral',
    ambientSound: 'Tunog Pampalubag sa Pag-aaral',
    ambientPlaying: 'Tumutugtog',
    ambientMuted: 'Naka-mute',
    spacedRepetition: 'Active Recall Flashcards',
    masteryProgress: 'Antas ng Pagsasaulo',
    tapToFlip: 'Pindutin ang card para bumaliktad',
    rateRetention: 'ANTAS NG NATANDAAN:',
    rateDifficult: 'Mahirap (+1 araw)',
    rateMedium: 'Katamtaman (+3 araw)',
    rateEasy: 'Madali (+7 araw)',
    addFlashcard: 'Magdagdag ng Flashcard',
    noFlashcardsYet: 'Wala Pang Flashcards',
    aiReviewerTitle: 'Matalinong Plano at Tagagawa ng Reviewer',
    generateReviewerBtn: 'Gumawa ng AI Reviewer',

    progressTitle: 'Akademikong Progreso',
    progressSubtitle: 'Pagsusuri ng marka, bilis, at trend sa pag-aaral.',
    overallScore: 'KABUUAN',
    accuracyRate: 'Wastong Sagot sa Pagsusulit',
    focusHours: 'Oras ng Pag-aaral',
    modulesMastered: 'Nalubos na mga Modyul',
    subjectMastery: 'Antas Bawat Asignatura',
    studyActivity: '14-Araw na Gawain sa Pag-aaral',

    profileTitle: 'Talaan at mga Setting ng Mag-aaral',
    profileSubtitle: 'I-customize ang iyong avatar, tema, at paraan ng pag-aaral.',
    editProfile: 'I-edit ang Profile',
    avatarStudio: 'Avatar Studio',
    appLanguage: 'Wika ng App / Language',
    selectLanguage: 'Piliin ang Wika ng Interface',
    colorThemes: 'Mga Kulay at Tema',
    studyModeTitle: 'Paraan ng Pag-aaral at mga Timer',
    preferencesTitle: 'Mga Setting at Abiso',
    accountsAndStorage: 'Mga Profile, Lokal na Imbakan at Backup',
    clearCache: 'Linisin ang Cache',
    switchAccount: 'Magpalit ng Profile',

    toolsTitle: 'Mga Kagamitan sa Pag-aaral',
    calculatorTab: 'Kalkulador',
    stopwatchTab: 'Orasan at Lap',
    timerTab: 'Timer',
    converterTab: 'Tagapagpalit ng Yunit',
    notesTab: 'Mabilisang Tala',
    lap: 'Lap',
    reset: 'I-reset',
    start: 'Simulan',
    stop: 'Ihinto',
  },
};
