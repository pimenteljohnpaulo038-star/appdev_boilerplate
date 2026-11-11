import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { CreateFolderModal } from '@/components/library/CreateFolderModal';
import { CreateSubjectModal } from '@/components/library/CreateSubjectModal';
import { FileActionsModal } from '@/components/library/FileActionsModal';
import { FileCard } from '@/components/library/FileCard';
import { FileDetailsModal } from '@/components/library/FileDetailsModal';
import { InAppPdfViewer } from '@/components/library/InAppPdfViewer';
import { MoveCopyModal } from '@/components/library/MoveCopyModal';
import { RenameModal } from '@/components/library/RenameModal';
import { StorageManagementModal } from '@/components/library/StorageManagementModal';
import { UploadBottomSheet } from '@/components/library/UploadBottomSheet';
import { useOras } from '@/context/OrasContext';
import {
  ACADEMIC_SUBJECTS,
  type AcademicLesson,
  type AcademicModule,
  type AcademicSubject,
  type LibraryFileItem,
  type LibraryFileType,
  type StudentLevel,
} from '@/data/orasorasData';
import {
  formatBytes,
  getFileTypeColor,
} from '@/services/libraryStorage';
import { useTheme } from '@/theme';

type LibraryMode = 'files' | 'curriculum';

type FileShelfTab =
  | 'All Files'
  | 'Recent Files'
  | 'Pinned'
  | 'Favorites'
  | 'Available Offline';

const FILE_SHELF_TABS: FileShelfTab[] = [
  'All Files',
  'Recent Files',
  'Pinned',
  'Favorites',
  'Available Offline',
];

type FormatFilter = 'all' | LibraryFileType;

const FORMAT_FILTERS: { id: FormatFilter; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'all', label: 'All Formats', icon: 'apps' },
  { id: 'pdf', label: 'PDFs', icon: 'document-text' },
  { id: 'doc', label: 'Word', icon: 'reader' },
  { id: 'ppt', label: 'PowerPoint', icon: 'easel' },
  { id: 'sheet', label: 'Spreadsheets', icon: 'grid' },
  { id: 'image', label: 'Images', icon: 'image' },
  { id: 'text', label: 'Text / Code', icon: 'code-slash' },
];

type SortOption = 'newest' | 'recent_opened' | 'name_asc' | 'size_desc' | 'oldest';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'newest', label: 'Recently Uploaded' },
  { id: 'recent_opened', label: 'Recently Opened' },
  { id: 'name_asc', label: 'File Name (A–Z)' },
  { id: 'size_desc', label: 'Largest Size' },
  { id: 'oldest', label: 'Oldest First' },
];

const GRADE_LEVELS: ('All Levels' | StudentLevel)[] = [
  'All Levels',
  'Junior High School',
  'Senior High School',
  'College',
];

export default function LibraryScreen() {
  const theme = useTheme();
  const {
    account,
    activeTheme,
    allSubjects,
    uploadedFiles,
    customFolders,
    toggleFileFavorite,
    toggleFilePinned,
    toggleFileOffline,
    recordFileOpened,
    toggleLessonComplete,
    markModuleViewed,
    t,
  } = useOras();

  // Top Mode Switcher: 'files' (Subject Files & PDFs) vs 'curriculum' (Lessons & Topics)
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('files');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'All Levels' | StudentLevel>('All Levels');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('math');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [fileShelfTab, setFileShelfTab] = useState<FileShelfTab>('All Files');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Curriculum mode states
  const [selectedModule, setSelectedModule] = useState<{
    subject: AcademicSubject;
    module: AcademicModule;
  } | null>(null);
  const [activeLesson, setActiveLesson] = useState<AcademicLesson | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [activePdfFile, setActivePdfFile] = useState<LibraryFileItem | null>(null);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [justUploadedFileId, setJustUploadedFileId] = useState<string | null>(null);

  // File action & details modals
  const [actionFile, setActionFile] = useState<LibraryFileItem | null>(null);
  const [detailsFile, setDetailsFile] = useState<LibraryFileItem | null>(null);
  const [moveCopyFile, setMoveCopyFile] = useState<LibraryFileItem | null>(null);
  const [renameFile, setRenameFile] = useState<LibraryFileItem | null>(null);

  // Active Subject details
  const activeSubject = useMemo(() => {
    if (selectedSubjectId === 'all') {
      return {
        id: 'all',
        name: 'All Academic Subjects',
        shortName: 'All Subjects',
        gradeLevels: ['Junior High School', 'Senior High School', 'College'] as StudentLevel[],
        color: activeTheme.primary,
        secondaryColor: activeTheme.secondary,
        lightBg: `${activeTheme.primary}18`,
        icon: 'albums',
        instructor: 'All Courses & Modules',
        room: 'Offline Academic Library',
        modules: [],
      };
    }
    return allSubjects.find((s) => s.id === selectedSubjectId) || allSubjects[0];
  }, [allSubjects, selectedSubjectId, activeTheme]);

  const subjectColor = activeSubject?.color || activeTheme.primary;

  // Filter subjects by grade level
  const displayedSubjects = useMemo(() => {
    return allSubjects.filter((s) => {
      if (gradeFilter === 'All Levels') return true;
      if (!s.gradeLevels) return true;
      return s.gradeLevels.includes(gradeFilter);
    });
  }, [allSubjects, gradeFilter]);

  // Compute file count per subject
  const subjectFileCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of uploadedFiles) {
      counts.set(f.subjectId, (counts.get(f.subjectId) || 0) + 1);
    }
    counts.set('all', uploadedFiles.length);
    return counts;
  }, [uploadedFiles]);

  // Subject folders list (including modules + custom folders)
  const subjectFolders = useMemo(() => {
    const list: { id: string; name: string; count: number }[] = [];

    if (selectedSubjectId === 'all') {
      for (const cf of customFolders) {
        const count = uploadedFiles.filter((f) => f.folderId === cf.id).length;
        list.push({ id: cf.id, name: cf.name, count });
      }
      return list;
    }

    // Modules from standard subject
    if (activeSubject && 'modules' in activeSubject && Array.isArray(activeSubject.modules)) {
      for (const m of activeSubject.modules) {
        const count = uploadedFiles.filter(
          (f) => f.subjectId === activeSubject.id && f.folderId === m.id
        ).length;
        list.push({ id: m.id, name: `Mod ${m.number}: ${m.title}`, count });
      }
    }

    // Custom folders created for this subject
    const custom = customFolders.filter((f) => f.subjectId === selectedSubjectId);
    for (const cf of custom) {
      const count = uploadedFiles.filter(
        (f) => f.subjectId === selectedSubjectId && f.folderId === cf.id
      ).length;
      list.push({ id: cf.id, name: cf.name, count });
    }

    return list;
  }, [activeSubject, customFolders, selectedSubjectId, uploadedFiles]);

  // Filtered and Sorted Files
  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();

    return uploadedFiles
      .filter((file) => {
        // 1. Subject Separation: Must belong to selected subject (unless 'all')
        if (selectedSubjectId !== 'all' && file.subjectId !== selectedSubjectId) {
          return false;
        }

        // 2. Folder filter
        if (selectedFolderId !== 'all' && file.folderId !== selectedFolderId) {
          return false;
        }

        // 3. Shelves filter
        if (fileShelfTab === 'Pinned' && !file.isPinned) return false;
        if (fileShelfTab === 'Favorites' && !file.isFavorite) return false;
        if (fileShelfTab === 'Available Offline' && !file.isOfflineAvailable) return false;
        if (fileShelfTab === 'Recent Files') {
          const recentIds = account.recentFileIds || [];
          if (!recentIds.includes(file.id)) return false;
        }

        // 4. Format filter
        if (formatFilter !== 'all' && file.fileType !== formatFilter) return false;

        // 5. Search query (title, filename, subject, folder, description, tags)
        if (q) {
          const hay = `${file.title} ${file.originalFileName} ${file.subjectName} ${
            file.folderName || ''
          } ${file.description || ''} ${file.tags?.join(' ') || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned files always sort to the top first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortOption === 'newest') return (b.uploadedAt || 0) - (a.uploadedAt || 0);
        if (sortOption === 'recent_opened') return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
        if (sortOption === 'name_asc') return a.title.localeCompare(b.title);
        if (sortOption === 'size_desc') return (b.fileSize || 0) - (a.fileSize || 0);
        if (sortOption === 'oldest') return (a.uploadedAt || 0) - (b.uploadedAt || 0);
        return 0;
      });
  }, [
    uploadedFiles,
    selectedSubjectId,
    selectedFolderId,
    fileShelfTab,
    formatFilter,
    search,
    sortOption,
    account.recentFileIds,
  ]);

  // Storage total used in active subject (or all)
  const subjectStorageBytes = useMemo(() => {
    return uploadedFiles
      .filter((f) => selectedSubjectId === 'all' || f.subjectId === selectedSubjectId)
      .reduce((acc, f) => acc + (f.fileSize || 0), 0);
  }, [uploadedFiles, selectedSubjectId]);

  // Open Document in In-App PDF Reader or Lightbox
  const handleOpenFile = (file: LibraryFileItem) => {
    void recordFileOpened(file.id);
    setActivePdfFile(file);
    setIsPdfViewerOpen(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header with Mode Switcher */}
        <View style={styles.headerBlock}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.mainTitle, { color: theme.navy }]}>
                {t.libraryTitle}
              </Text>
              <Text style={[styles.mainSubtitle, { color: theme.textSecondary }]}>
                {t.librarySubtitle}
              </Text>
            </View>

            <SmoothPressable
              onPress={() => setIsStorageOpen(true)}
              style={[
                styles.storageQuickBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              accessibilityLabel="Open Storage Manager"
            >
              <Ionicons name="pie-chart" size={16} color={activeTheme.primary} />
              <Text style={[styles.storageQuickBtnText, { color: theme.navy }]}>
                {t.storageUsage}
              </Text>
            </SmoothPressable>
          </View>

          {/* Segmented Mode Control: Files & PDFs vs Curriculum */}
          <View
            style={[
              styles.segmentedModeControl,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <SmoothPressable
              onPress={() => setLibraryMode('files')}
              style={[
                styles.segmentedModeTab,
                libraryMode === 'files' && [
                  styles.segmentedModeTabActive,
                  { backgroundColor: theme.card },
                ],
              ]}
            >
              <Ionicons
                name="folder"
                size={15}
                color={libraryMode === 'files' ? activeTheme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.segmentedModeText,
                  {
                    color: libraryMode === 'files' ? theme.navy : theme.textMuted,
                    fontWeight: libraryMode === 'files' ? '800' : '600',
                  },
                ]}
              >
                {t.filesTab} ({uploadedFiles.length})
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => setLibraryMode('curriculum')}
              style={[
                styles.segmentedModeTab,
                libraryMode === 'curriculum' && [
                  styles.segmentedModeTabActive,
                  { backgroundColor: theme.card },
                ],
              ]}
            >
              <Ionicons
                name="book"
                size={15}
                color={libraryMode === 'curriculum' ? activeTheme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.segmentedModeText,
                  {
                    color: libraryMode === 'curriculum' ? theme.navy : theme.textMuted,
                    fontWeight: libraryMode === 'curriculum' ? '800' : '600',
                  },
                ]}
              >
                {t.curriculumTab}
              </Text>
            </SmoothPressable>
          </View>
        </View>

        {/* ── MODE 1: SUBJECT FILES & PDFS ─────────────────────────────────── */}
        {libraryMode === 'files' && (
          <>
            {/* Grade Level Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionMicroTitle, { color: theme.textMuted }]}>
                ACADEMIC LEVEL
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {GRADE_LEVELS.map((lvl) => {
                  const active = gradeFilter === lvl;
                  return (
                    <SmoothPressable
                      key={lvl}
                      onPress={() => setGradeFilter(lvl)}
                      style={[
                        styles.levelChip,
                        {
                          backgroundColor: active ? activeTheme.primary : theme.card,
                          borderColor: active ? activeTheme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.levelChipText,
                          { color: active ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        {lvl}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Subject Selector Carousel */}
            <View style={styles.filterSection}>
              <View style={styles.rowBetween}>
                <Text style={[styles.sectionMicroTitle, { color: theme.textMuted }]}>
                  SUBJECT LIBRARY ({displayedSubjects.length})
                </Text>
                <SmoothPressable
                  onPress={() => setIsCreateSubjectOpen(true)}
                  style={styles.newSubjectBtn}
                >
                  <Ionicons name="add" size={14} color={activeTheme.primary} />
                  <Text style={[styles.newSubjectBtnText, { color: activeTheme.primary }]}>
                    New Subject
                  </Text>
                </SmoothPressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectPillsRow}
              >
                <SmoothPressable
                  key="all-subjects"
                  onPress={() => {
                    setSelectedSubjectId('all');
                    setSelectedFolderId('all');
                  }}
                  style={[
                    styles.subjectPillCard,
                    {
                      backgroundColor: selectedSubjectId === 'all' ? activeTheme.primary : theme.card,
                      borderColor: selectedSubjectId === 'all' ? activeTheme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="albums"
                    size={15}
                    color={selectedSubjectId === 'all' ? '#FFFFFF' : activeTheme.primary}
                  />
                  <Text
                    style={[
                      styles.subjectPillName,
                      { color: selectedSubjectId === 'all' ? '#FFFFFF' : theme.navy },
                    ]}
                  >
                    All Subjects
                  </Text>
                  <View
                    style={[
                      styles.subjectPillBadge,
                      {
                        backgroundColor:
                          selectedSubjectId === 'all' ? 'rgba(255,255,255,0.25)' : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subjectPillBadgeBadgeText,
                        { color: selectedSubjectId === 'all' ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {uploadedFiles.length}
                    </Text>
                  </View>
                </SmoothPressable>

                {displayedSubjects.map((s) => {
                  const active = s.id === selectedSubjectId;
                  const count = subjectFileCounts.get(s.id) || 0;

                  return (
                    <SmoothPressable
                      key={s.id}
                      onPress={() => {
                        setSelectedSubjectId(s.id);
                        setSelectedFolderId('all');
                      }}
                      style={[
                        styles.subjectPillCard,
                        {
                          backgroundColor: active ? s.color : theme.card,
                          borderColor: active ? s.color : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={s.icon as React.ComponentProps<typeof Ionicons>['name']}
                        size={15}
                        color={active ? '#FFFFFF' : s.color}
                      />
                      <Text
                        style={[
                          styles.subjectPillName,
                          { color: active ? '#FFFFFF' : theme.navy },
                        ]}
                      >
                        {s.shortName}
                      </Text>
                      <View
                        style={[
                          styles.subjectPillBadge,
                          { backgroundColor: active ? 'rgba(255,255,255,0.25)' : theme.surface },
                        ]}
                      >
                        <Text
                          style={[
                            styles.subjectPillBadgeBadgeText,
                            { color: active ? '#FFFFFF' : theme.textSecondary },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </SmoothPressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Active Subject Showcase Hero Card */}
            {activeSubject && (
              <DepthCard
                variant="color"
                gradientColors={[
                  activeSubject.color,
                  activeSubject.secondaryColor || activeSubject.color,
                ]}
                style={styles.subjectHeroCard}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIconBox}>
                    <Ionicons
                      name={activeSubject.icon as React.ComponentProps<typeof Ionicons>['name']}
                      size={26}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={styles.heroTitleWrap}>
                    <Text style={styles.heroSubjectName}>
                      {activeSubject.name}
                    </Text>
                    <Text style={styles.heroSubjectMeta}>
                      {activeSubject.instructor || 'Department Faculty'} ·{' '}
                      {activeSubject.room || 'Campus Academic Center'}
                    </Text>
                  </View>
                </View>

                {/* Storage & Files Summary */}
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="documents" size={14} color="#FFFFFF" />
                    <Text style={styles.heroStatText}>
                      {subjectFileCounts.get(activeSubject.id) || 0} Materials
                    </Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="folder" size={14} color="#FFFFFF" />
                    <Text style={styles.heroStatText}>
                      {subjectFolders.length} Folders / Modules
                    </Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="pie-chart" size={14} color="#FFFFFF" />
                    <Text style={styles.heroStatText}>
                      {formatBytes(subjectStorageBytes)} Used
                    </Text>
                  </View>
                </View>

                {/* Prominent Action Buttons */}
                <View style={styles.heroActionsRow}>
                  <SmoothPressable
                    onPress={() => setIsUploadOpen(true)}
                    style={styles.heroUploadBtn}
                    accessibilityLabel="Upload file to this subject"
                  >
                    <Ionicons name="cloud-upload" size={16} color={activeSubject.color} />
                    <Text style={[styles.heroUploadBtnText, { color: activeSubject.color }]}>
                      Upload File
                    </Text>
                  </SmoothPressable>

                  <SmoothPressable
                    onPress={() => setIsCreateFolderOpen(true)}
                    style={styles.heroFolderBtn}
                    accessibilityLabel="Create folder in this subject"
                  >
                    <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.heroFolderBtnText}>New Folder</Text>
                  </SmoothPressable>
                </View>
              </DepthCard>
            )}

            {/* Upload Success Banner */}
            {Boolean(justUploadedFileId) && (
              <View
                style={[
                  styles.uploadSuccessBanner,
                  { backgroundColor: `${subjectColor}14`, borderColor: subjectColor },
                ]}
              >
                <View
                  style={[
                    styles.successIconBox,
                    { backgroundColor: `${subjectColor}20` },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.successBannerTitle, { color: theme.navy }]}>
                    PDF Uploaded Successfully!
                  </Text>
                  <Text style={[styles.successBannerSub, { color: theme.textSecondary }]}>
                    Added to Library and ready for offline reading.
                  </Text>
                </View>
                <SmoothPressable onPress={() => setJustUploadedFileId(null)}>
                  <Ionicons name="close" size={16} color={theme.textMuted} />
                </SmoothPressable>
              </View>
            )}

            {/* Search Bar */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={`Search ${activeSubject?.shortName || ''} files, PDFs, or tags...`}
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.navy }]}
              />
              {search.length > 0 && (
                <SmoothPressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </SmoothPressable>
              )}
            </View>

            {/* Quick Shelves: All Files | Recent | Pinned | Favorites | Offline */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {FILE_SHELF_TABS.map((tab) => {
                const active = fileShelfTab === tab;
                return (
                  <SmoothPressable
                    key={tab}
                    onPress={() => setFileShelfTab(tab)}
                    style={[
                      styles.shelfChip,
                      {
                        backgroundColor: active ? theme.navy : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.shelfChipText,
                        {
                          color: active ? theme.background : theme.textSecondary,
                        },
                      ]}
                    >
                      {tab}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </ScrollView>

            {/* Folder & Module Selector */}
            {subjectFolders.length > 0 && (
              <View style={styles.folderSection}>
                <Text style={[styles.sectionMicroTitle, { color: theme.textMuted }]}>
                  MODULES & FOLDERS
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  <SmoothPressable
                    onPress={() => setSelectedFolderId('all')}
                    style={[
                      styles.folderChip,
                      {
                        backgroundColor:
                          selectedFolderId === 'all' ? `${subjectColor}20` : theme.card,
                        borderColor:
                          selectedFolderId === 'all' ? subjectColor : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="folder-open"
                      size={13}
                      color={selectedFolderId === 'all' ? subjectColor : theme.textMuted}
                    />
                    <Text
                      style={[
                        styles.folderChipText,
                        {
                          color: selectedFolderId === 'all' ? subjectColor : theme.navy,
                        },
                      ]}
                    >
                      All Folders ({subjectFileCounts.get(activeSubject.id) || 0})
                    </Text>
                  </SmoothPressable>

                  {subjectFolders.map((fld) => {
                    const active = selectedFolderId === fld.id;
                    return (
                      <SmoothPressable
                        key={fld.id}
                        onPress={() => setSelectedFolderId(fld.id)}
                        style={[
                          styles.folderChip,
                          {
                            backgroundColor: active ? `${subjectColor}20` : theme.card,
                            borderColor: active ? subjectColor : theme.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="folder"
                          size={13}
                          color={active ? subjectColor : theme.textMuted}
                        />
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.folderChipText,
                            {
                              color: active ? subjectColor : theme.navy,
                            },
                          ]}
                        >
                          {fld.name} ({fld.count})
                        </Text>
                      </SmoothPressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Format Filter Bar (PDF, Word, PPT, Sheets, Images, Text) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {FORMAT_FILTERS.map((fmt) => {
                const active = formatFilter === fmt.id;
                const color = fmt.id === 'all' ? activeTheme.primary : getFileTypeColor(fmt.id);

                return (
                  <SmoothPressable
                    key={fmt.id}
                    onPress={() => setFormatFilter(fmt.id)}
                    style={[
                      styles.formatChip,
                      {
                        backgroundColor: active ? `${color}18` : theme.surface,
                        borderColor: active ? color : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={fmt.icon}
                      size={13}
                      color={active ? color : theme.textMuted}
                    />
                    <Text
                      style={[
                        styles.formatChipText,
                        { color: active ? color : theme.textSecondary },
                      ]}
                    >
                      {fmt.label}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </ScrollView>

            {/* Sort & Count Header */}
            <View style={styles.filesListHeader}>
              <Text style={[styles.filesListCount, { color: theme.navy }]}>
                {filteredFiles.length} {filteredFiles.length === 1 ? 'Material' : 'Materials'} Found
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortChipsRow}
              >
                {SORT_OPTIONS.map((opt) => {
                  const active = sortOption === opt.id;
                  return (
                    <SmoothPressable
                      key={opt.id}
                      onPress={() => setSortOption(opt.id)}
                      style={[
                        styles.sortPill,
                        {
                          backgroundColor: active ? theme.navy : theme.surface,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sortPillText,
                          { color: active ? theme.background : theme.textMuted },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Files List */}
            {filteredFiles.length > 0 ? (
              <View style={styles.filesGrid}>
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    subjectColor={subjectColor}
                    onOpen={handleOpenFile}
                    onToggleFavorite={toggleFileFavorite}
                    onTogglePinned={toggleFilePinned}
                    onToggleOffline={toggleFileOffline}
                    onOptionsPress={setActionFile}
                  />
                ))}
              </View>
            ) : (
              /* Empty State */
              <DepthCard variant="card" style={styles.emptyCard}>
                <View
                  style={[
                    styles.emptyIconBox,
                    { backgroundColor: `${subjectColor}18` },
                  ]}
                >
                  <Ionicons name="folder-open" size={32} color={subjectColor} />
                </View>

                <Text style={[styles.emptyTitle, { color: theme.navy }]}>
                  No files yet
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: theme.textSecondary }]}
                >
                  Upload your first study material for {activeSubject?.shortName || 'this subject'}.
                </Text>

                <SmoothPressable
                  onPress={() => setIsUploadOpen(true)}
                  style={[styles.emptyUploadBtn, { backgroundColor: subjectColor }]}
                >
                  <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                  <Text style={styles.emptyUploadBtnText}>{t.uploadFileBtn}</Text>
                </SmoothPressable>
              </DepthCard>
            )}
          </>
        )}

        {/* ── MODE 2: CURRICULUM & LESSONS (Preserved Interactive Reader) ─── */}
        {libraryMode === 'curriculum' && (
          <View style={styles.curriculumWrap}>
            {ACADEMIC_SUBJECTS.map((subj) => (
              <DepthCard key={subj.id} variant="card" style={styles.curriculumSubjectCard}>
                <View style={styles.curriculumHeader}>
                  <Icon3D
                    name={subj.icon as React.ComponentProps<typeof Ionicons>['name']}
                    bg={subj.color}
                    boxSize={36}
                    size={18}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.curriculumTitle, { color: theme.navy }]}>
                      {subj.name}
                    </Text>
                    <Text style={[styles.curriculumSub, { color: theme.textSecondary }]}>
                      {subj.modules.length} Modules · {subj.instructor}
                    </Text>
                  </View>
                </View>

                {subj.modules.map((mod) => (
                  <DepthCard
                    key={mod.id}
                    variant="mini"
                    style={styles.curriculumModuleItem}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[styles.curriculumModTitle, { color: theme.navy }]}>
                        Module {mod.number}: {mod.title}
                      </Text>
                    </View>
                    <Text style={[styles.curriculumModDesc, { color: theme.textSecondary }]}>
                      {mod.description}
                    </Text>

                    <View style={styles.lessonsChipList}>
                      {mod.lessons.map((lesson) => {
                        const done = account.completedLessonIds.includes(lesson.id);
                        return (
                          <SmoothPressable
                            key={lesson.id}
                            onPress={() => {
                              markModuleViewed(mod.id);
                              setSelectedModule({ subject: subj, module: mod });
                              setActiveLesson(lesson);
                            }}
                            style={[
                              styles.lessonBadge,
                              { backgroundColor: done ? '#10B98118' : theme.surface },
                            ]}
                          >
                            <Ionicons
                              name={done ? 'checkmark-circle' : 'book-outline'}
                              size={12}
                              color={done ? '#10B981' : subj.color}
                            />
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.lessonBadgeText,
                                { color: done ? '#10B981' : theme.navy },
                              ]}
                            >
                              {lesson.title}
                            </Text>
                          </SmoothPressable>
                        );
                      })}
                    </View>
                  </DepthCard>
                ))}
              </DepthCard>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) for Quick File Upload */}
      {libraryMode === 'files' && (
        <SmoothPressable
          onPress={() => setIsUploadOpen(true)}
          style={[styles.floatingUploadFab, { backgroundColor: subjectColor }]}
          accessibilityLabel="Upload study material"
        >
          <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
          <Text style={styles.floatingFabText}>{t.uploadFileBtn}</Text>
        </SmoothPressable>
      )}

      {/* ── ALL INTEGRATED MODALS ───────────────────────────────────────── */}

      {/* 1. Upload Bottom Sheet */}
      <UploadBottomSheet
        visible={isUploadOpen}
        initialSubjectId={selectedSubjectId === 'all' ? allSubjects[0]?.id : selectedSubjectId}
        initialFolderId={selectedFolderId === 'all' ? 'root' : selectedFolderId}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={(newFiles) => {
          if (newFiles.length > 0) {
            const first = newFiles[0];
            // Immediately sync Library page so the new file is in full view!
            if (selectedSubjectId !== 'all') {
              setSelectedSubjectId(first.subjectId);
            }
            setSelectedFolderId('all');
            setFileShelfTab('All Files');
            setFormatFilter('all');
            setSearch('');
            setJustUploadedFileId(first.id);
            setTimeout(() => setJustUploadedFileId(null), 5000);
          }
        }}
      />

      {/* 2. In-App PDF & Document Reader */}
      <InAppPdfViewer
        file={activePdfFile}
        visible={isPdfViewerOpen}
        onClose={() => setIsPdfViewerOpen(false)}
      />

      {/* 3. Storage Management Panel */}
      <StorageManagementModal
        visible={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        onOpenFile={handleOpenFile}
      />

      {/* 4. Kebab File Actions Menu */}
      <FileActionsModal
        file={actionFile}
        visible={Boolean(actionFile)}
        onClose={() => setActionFile(null)}
        onOpen={handleOpenFile}
        onRename={(f) => setRenameFile(f)}
        onMoveCopy={(f) => setMoveCopyFile(f)}
        onViewDetails={(f) => setDetailsFile(f)}
      />

      {/* 5. File Details Modal */}
      <FileDetailsModal
        file={detailsFile}
        visible={Boolean(detailsFile)}
        onClose={() => setDetailsFile(null)}
      />

      {/* 6. Move / Copy File Modal */}
      <MoveCopyModal
        file={moveCopyFile}
        visible={Boolean(moveCopyFile)}
        onClose={() => setMoveCopyFile(null)}
      />

      {/* 7. Rename File Modal */}
      <RenameModal
        file={renameFile}
        visible={Boolean(renameFile)}
        onClose={() => setRenameFile(null)}
      />

      {/* 8. Create Folder Modal */}
      <CreateFolderModal
        visible={isCreateFolderOpen}
        subjectId={selectedSubjectId}
        subjectName={activeSubject?.shortName || 'Subject'}
        subjectColor={subjectColor}
        onClose={() => setIsCreateFolderOpen(false)}
      />

      {/* 9. Create Custom Subject Modal */}
      <CreateSubjectModal
        visible={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
      />

      {/* 10. Interactive Lesson Reader Modal */}
      <Modal
        visible={Boolean(activeLesson && selectedModule)}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setActiveLesson(null);
          setSelectedModule(null);
        }}
      >
        <View style={styles.lessonModalOverlay}>
          <View style={[styles.lessonModalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.lessonModalHeader}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.lessonMetaRow}>
                  <View
                    style={[
                      styles.lessonBadgePill,
                      { backgroundColor: `${selectedModule?.subject.color || theme.primary}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.lessonBadgePillText,
                        { color: selectedModule?.subject.color || theme.primary },
                      ]}
                    >
                      {selectedModule?.subject.name}
                    </Text>
                  </View>
                  <Text style={[styles.lessonDurationText, { color: theme.textSecondary }]}>
                    {activeLesson?.durationMin} min read
                  </Text>
                </View>
                <Text style={[styles.lessonModalTitle, { color: theme.navy }]} numberOfLines={2}>
                  {activeLesson?.title}
                </Text>
                <Text style={[styles.lessonModalSub, { color: theme.textSecondary }]}>
                  Module {selectedModule?.module.number}: {selectedModule?.module.title}
                </Text>
              </View>
              <SmoothPressable
                onPress={() => {
                  setActiveLesson(null);
                  setSelectedModule(null);
                }}
                style={[styles.closeIconBtn, { backgroundColor: theme.backgroundAlt }]}
              >
                <Ionicons name="close" size={20} color={theme.navy} />
              </SmoothPressable>
            </View>

            <ScrollView
              style={styles.lessonModalScroll}
              contentContainerStyle={styles.lessonModalContent}
              showsVerticalScrollIndicator={false}
            >
              {activeLesson && (
                <>
                  <Text style={[styles.lessonContentBody, { color: theme.navy }]}>
                    {activeLesson.content}
                  </Text>

                  {activeLesson.topics && activeLesson.topics.length > 0 && (
                    <View style={styles.lessonTopicsWrap}>
                      <Text style={[styles.sectionMicroTitle, { color: theme.textSecondary }]}>
                        KEY CONCEPTS & TOPICS
                      </Text>
                      {activeLesson.topics.map((t) => (
                        <DepthCard key={t.id} variant="mini" style={styles.lessonTopicCard}>
                          <Text style={[styles.topicTitle, { color: theme.navy }]}>{t.title}</Text>
                          <Text style={[styles.topicSummary, { color: theme.textSecondary }]}>
                            {t.summary}
                          </Text>
                          {t.keyFormulaOrConcept ? (
                            <View
                              style={[
                                styles.formulaBox,
                                {
                                  backgroundColor: `${selectedModule?.subject.color || theme.primary}12`,
                                  borderColor: `${selectedModule?.subject.color || theme.primary}30`,
                                },
                              ]}
                            >
                              <Ionicons
                                name="bulb-outline"
                                size={14}
                                color={selectedModule?.subject.color || theme.primary}
                              />
                              <Text
                                style={[
                                  styles.formulaText,
                                  { color: selectedModule?.subject.color || theme.primary },
                                ]}
                              >
                                {t.keyFormulaOrConcept}
                              </Text>
                            </View>
                          ) : null}
                        </DepthCard>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {activeLesson && (
              <View style={[styles.lessonModalFooter, { borderTopColor: theme.border }]}>
                {(() => {
                  const isDone = account.completedLessonIds.includes(activeLesson.id);
                  return (
                    <SmoothPressable
                      onPress={() => toggleLessonComplete(activeLesson.id)}
                      style={[
                        styles.lessonCompleteBtn,
                        {
                          backgroundColor: isDone
                            ? '#10B981'
                            : (selectedModule?.subject.color || theme.primary),
                        },
                      ]}
                    >
                      <Ionicons
                        name={isDone ? 'checkmark-circle' : 'checkmark-circle-outline'}
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.lessonCompleteBtnText}>
                        {isDone ? 'Completed' : 'Mark as Completed'}
                      </Text>
                    </SmoothPressable>
                  );
                })()}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 16,
  },
  headerBlock: {
    gap: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  mainSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  storageQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  storageQuickBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedModeControl: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  segmentedModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentedModeTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedModeText: {
    fontSize: 12.5,
  },
  filterSection: {
    gap: 8,
  },
  sectionMicroTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newSubjectBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subjectPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  subjectPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  subjectPillName: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  subjectPillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  subjectPillBadgeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subjectHeroCard: {
    padding: 18,
    borderRadius: 24,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleWrap: {
    flex: 1,
  },
  heroSubjectName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroSubjectMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroStatText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  heroUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroUploadBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  heroFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroFolderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  successIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  successBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  shelfChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  shelfChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  folderSection: {
    gap: 6,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 220,
  },
  folderChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  formatChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  filesListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  filesListCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  sortChipsRow: {
    gap: 6,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filesGrid: {
    gap: 12,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    gap: 10,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6,
  },
  emptyUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  floatingUploadFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 99,
  },
  floatingFabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  curriculumWrap: {
    gap: 16,
  },
  curriculumSubjectCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  curriculumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  curriculumTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  curriculumSub: {
    fontSize: 12,
  },
  curriculumModuleItem: {
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  curriculumModTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  curriculumModDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  lessonsChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  lessonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  lessonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lessonModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  lessonModalCard: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  lessonModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  lessonBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lessonBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  lessonDurationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  lessonModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  lessonModalSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonModalScroll: {
    flex: 1,
  },
  lessonModalContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  lessonContentBody: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  lessonTopicsWrap: {
    gap: 10,
    marginTop: 8,
  },
  lessonTopicCard: {
    padding: 14,
    borderRadius: 14,
    gap: 6,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  topicSummary: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  formulaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  formulaText: {
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  lessonModalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  lessonCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  lessonCompleteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
