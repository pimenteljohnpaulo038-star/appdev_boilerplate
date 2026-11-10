import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type { LibraryFileItem } from '@/data/orasorasData';
import {
  formatBytes,
  getFileBlobUrl,
  getFileTypeColor,
  shareOrDownloadFile,
} from '@/services/libraryStorage';
import { useTheme } from '@/theme';

interface InAppPdfViewerProps {
  file: LibraryFileItem | null;
  visible: boolean;
  onClose: () => void;
  onFileUpdated?: (updatedFile: LibraryFileItem) => void;
}

// Sample rich academic content generator for document pages
function generateSampleDocPages(file: LibraryFileItem): {
  pageNumber: number;
  chapterTitle: string;
  sections: { heading: string; body: string; formulaOrCallout?: string }[];
}[] {
  const total = file.totalPages || 12;
  const pages: {
    pageNumber: number;
    chapterTitle: string;
    sections: { heading: string; body: string; formulaOrCallout?: string }[];
  }[] = [];

  for (let i = 1; i <= total; i++) {
    pages.push({
      pageNumber: i,
      chapterTitle:
        i === 1
          ? `${file.title} — Overview & Syllabus`
          : i === 2
          ? 'Foundational Theorems & Definitions'
          : i === 3
          ? 'Core Analytical Methods & Step-by-Step Proofs'
          : i === 4
          ? 'Worked Example Problems & Practical Case Studies'
          : `Advanced Topic Study Notes (Part ${i - 4})`,
      sections: [
        {
          heading: `Section ${i}.1: Key Theoretical Principles`,
          body: `This study unit focuses on ${file.subjectName.toLowerCase()} principles, specifically regarding ${file.title.toLowerCase()}. Reviewing underlying definitions ensures comprehensive understanding before tackling advanced problem sets.`,
          formulaOrCallout:
            file.subjectId === 'math'
              ? 'lim(x→c) [f(x)·g(x)] = lim(x→c) f(x) · lim(x→c) g(x)'
              : file.subjectId === 'science' || file.subjectId === 'bio'
              ? 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 36-38 ATP'
              : file.subjectId === 'physics'
              ? 'F_net = m·a  |  W = ΔK = ½mv²'
              : file.subjectId === 'chem'
              ? 'PV = nRT  |  ΔH = ΣH_products - ΣH_reactants'
              : undefined,
        },
        {
          heading: `Section ${i}.2: Comprehensive Study Notes & Problem Analysis`,
          body: `Make sure to verify boundary conditions, review edge cases, and summarize main takeaways into active recall flashcards. Consistent repetition and practice tests are crucial for academic mastery.`,
        },
      ],
    });
  }

  return pages;
}

export function InAppPdfViewer({
  file,
  visible,
  onClose,
  onFileUpdated,
}: InAppPdfViewerProps) {
  const theme = useTheme();
  const { updatePdfProgress, toggleFileOffline } = useOras();

  const [currentPage, setCurrentPage] = useState<number>(() => file?.lastReadPage || 1);
  const [prevFileId, setPrevFileId] = useState<string | undefined>(file?.id);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 125, 150, 200
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false);
  const [activeThumbnailTab, setActiveThumbnailTab] = useState<'all' | 'bookmarks'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);

  // Synchronize state when the file prop changes
  if (file && file.id !== prevFileId) {
    setPrevFileId(file.id);
    setCurrentPage(file.lastReadPage || 1);
    setBlobUrl(null);
  } else if (!file && prevFileId !== undefined) {
    setPrevFileId(undefined);
    setBlobUrl(null);
  }

  // Fetch blob URL asynchronously
  useEffect(() => {
    let isMounted = true;
    if (file) {
      getFileBlobUrl(file).then((url) => {
        if (isMounted) setBlobUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [file]);

  const pagesData = useMemo(() => (file ? generateSampleDocPages(file) : []), [file]);

  // Search match count
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matchedPages: number[] = [];
    pagesData.forEach((p) => {
      const text = `${p.chapterTitle} ${p.sections.map((s) => `${s.heading} ${s.body}`).join(' ')}`.toLowerCase();
      if (text.includes(q)) matchedPages.push(p.pageNumber);
    });
    return matchedPages;
  }, [searchQuery, pagesData]);

  if (!file) return null;

  const totalPages = file.totalPages || 12;
  const bookmarks = file.bookmarks || [];
  const isBookmarked = bookmarks.includes(currentPage);
  const accentColor = getFileTypeColor(file.fileType);
  const activePageData = pagesData[currentPage - 1] || pagesData[0];

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    void updatePdfProgress(file.id, clamped, totalPages);
  };

  const handleToggleBookmark = () => {
    void updatePdfProgress(file.id, currentPage, totalPages, currentPage);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(75, z - 25));
  const handleFitWidth = () => setZoomLevel(100);

  const handleJumpSubmit = () => {
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setIsJumpModalOpen(false);
      setJumpPageInput('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: theme.isDark ? '#060914' : '#F1F5F9' },
        ]}
      >
        {/* Top Header Bar */}
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: theme.card,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={styles.topBarLeft}>
            <SmoothPressable
              onPress={onClose}
              style={[styles.navBtn, { backgroundColor: theme.surface }]}
              accessibilityLabel="Back to library"
            >
              <Ionicons name="arrow-back" size={18} color={theme.navy} />
            </SmoothPressable>

            <View style={styles.docHeaderMeta}>
              <Text numberOfLines={1} style={[styles.docTitle, { color: theme.navy }]}>
                {file.title}
              </Text>
              <View style={styles.docSubMetaRow}>
                <View
                  style={[
                    styles.subjectPill,
                    { backgroundColor: `${accentColor}18` },
                  ]}
                >
                  <Text style={[styles.subjectPillText, { color: accentColor }]}>
                    {file.subjectName}
                  </Text>
                </View>
                <Text style={[styles.docSizeText, { color: theme.textMuted }]}>
                  {formatBytes(file.fileSize)} · {totalPages} Pages
                </Text>
              </View>
            </View>
          </View>

          {/* Header Action Tools */}
          <View style={styles.topBarRight}>
            <SmoothPressable
              onPress={() => setIsSearchOpen((s) => !s)}
              style={[
                styles.navBtn,
                { backgroundColor: isSearchOpen ? `${accentColor}20` : theme.surface },
              ]}
              accessibilityLabel="Search inside document"
            >
              <Ionicons
                name="search"
                size={17}
                color={isSearchOpen ? accentColor : theme.navy}
              />
            </SmoothPressable>

            <SmoothPressable
              onPress={handleToggleBookmark}
              style={[
                styles.navBtn,
                { backgroundColor: isBookmarked ? 'rgba(245, 158, 11, 0.2)' : theme.surface },
              ]}
              accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={17}
                color={isBookmarked ? '#F59E0B' : theme.navy}
              />
            </SmoothPressable>

            <SmoothPressable
              onPress={() => setIsThumbnailsOpen((t) => !t)}
              style={[
                styles.navBtn,
                { backgroundColor: isThumbnailsOpen ? `${accentColor}20` : theme.surface },
              ]}
              accessibilityLabel="Page thumbnails drawer"
            >
              <Ionicons
                name="grid"
                size={17}
                color={isThumbnailsOpen ? accentColor : theme.navy}
              />
            </SmoothPressable>

            <SmoothPressable
              onPress={() => setIsFullscreen((f) => !f)}
              style={[
                styles.navBtn,
                { backgroundColor: isFullscreen ? `${accentColor}25` : theme.surface },
              ]}
              accessibilityLabel={isFullscreen ? 'Exit full screen' : 'Full screen reading mode'}
            >
              <Ionicons
                name={isFullscreen ? 'contract' : 'expand'}
                size={16}
                color={isFullscreen ? accentColor : theme.navy}
              />
            </SmoothPressable>

            <SmoothPressable
              onPress={() => void shareOrDownloadFile(file)}
              style={[styles.navBtn, { backgroundColor: theme.surface }]}
              accessibilityLabel="Share or download file"
            >
              <Ionicons name="share-social-outline" size={17} color={theme.navy} />
            </SmoothPressable>
          </View>
        </View>

        {/* Search Bar Banner (when toggled) */}
        {isSearchOpen && (
          <View
            style={[
              styles.searchBarRow,
              { backgroundColor: theme.card, borderBottomColor: theme.border },
            ]}
          >
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search keyword in this document..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchDocInput, { color: theme.navy }]}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <View style={styles.searchMatchesInfo}>
                <Text style={[styles.matchesText, { color: theme.textSecondary }]}>
                  {searchMatches.length} {searchMatches.length === 1 ? 'match' : 'matches'}
                </Text>
                <SmoothPressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                </SmoothPressable>
              </View>
            )}
          </View>
        )}

        {/* Main Workspace Area (Document Viewport + Optional Thumbnails Drawer) */}
        <View style={styles.workspace}>
          {/* Document Viewport */}
          <ScrollView
            style={styles.viewportScroll}
            contentContainerStyle={styles.viewportContent}
            maximumZoomScale={2.5}
            minimumZoomScale={0.75}
            showsVerticalScrollIndicator={false}
          >
            {/* Real embedded PDF on web if valid blobUrl is present */}
            {Platform.OS === 'web' && blobUrl && file.fileType === 'pdf' ? (
              <View
                style={[
                  styles.pdfEmbedContainer,
                  {
                    transform: [{ scale: zoomLevel / 100 }],
                  },
                ]}
              >
                <iframe
                  src={`${blobUrl}#page=${currentPage}&zoom=${zoomLevel}`}
                  style={{
                    width: '100%',
                    height: 720,
                    border: 'none',
                    borderRadius: 16,
                  }}
                  title={file.title}
                />
              </View>
            ) : (
              /* High-Fidelity Academic Document Reader Canvas */
              <View
                style={[
                  styles.docPaper,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    transform: [{ scale: zoomLevel / 100 }],
                  },
                ]}
              >
                {/* Paper Header */}
                <View
                  style={[
                    styles.paperHeader,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <View style={styles.paperHeaderLeft}>
                    <Text style={[styles.paperSubjectText, { color: accentColor }]}>
                      {file.subjectName.toUpperCase()} · MODULE READER
                    </Text>
                    <Text style={[styles.paperChapterText, { color: theme.navy }]}>
                      {activePageData.chapterTitle}
                    </Text>
                  </View>
                  <View style={styles.paperHeaderRight}>
                    <Text style={[styles.paperPageNumber, { color: theme.textMuted }]}>
                      Page {currentPage} of {totalPages}
                    </Text>
                  </View>
                </View>

                {/* Paper Body Sections */}
                <View style={styles.paperBody}>
                  {activePageData.sections.map((sec, idx) => (
                    <View key={idx} style={styles.sectionBlock}>
                      <Text style={[styles.sectionHeading, { color: theme.navy }]}>
                        {sec.heading}
                      </Text>
                      <Text
                        style={[
                          styles.sectionParagraph,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {sec.body}
                      </Text>

                      {Boolean(sec.formulaOrCallout) && (
                        <View
                          style={[
                            styles.formulaCallout,
                            {
                              backgroundColor: `${accentColor}12`,
                              borderColor: `${accentColor}35`,
                            },
                          ]}
                        >
                          <View style={styles.calloutHeader}>
                            <Ionicons name="sparkles" size={14} color={accentColor} />
                            <Text
                              style={[styles.calloutTitle, { color: accentColor }]}
                            >
                              Core Principle / Working Formula
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.formulaText,
                              { color: theme.navy },
                            ]}
                          >
                            {sec.formulaOrCallout}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* Paper Footer with Watermark */}
                <View
                  style={[
                    styles.paperFooter,
                    { borderTopColor: theme.border },
                  ]}
                >
                  <Text style={[styles.footerWatermark, { color: theme.textMuted }]}>
                    OrasOras Academic Library · {file.originalFileName}
                  </Text>
                  <Text style={[styles.footerWatermark, { color: theme.textMuted }]}>
                    Page {currentPage}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Slide-in Page Thumbnails & Bookmarks Drawer */}
          {isThumbnailsOpen && (
            <View
              style={[
                styles.thumbnailsDrawer,
                { backgroundColor: theme.card, borderLeftColor: theme.border },
              ]}
            >
              {/* Drawer Tabs */}
              <View style={styles.drawerTabRow}>
                <SmoothPressable
                  onPress={() => setActiveThumbnailTab('all')}
                  style={[
                    styles.drawerTab,
                    activeThumbnailTab === 'all' && [
                      styles.drawerTabActive,
                      { borderColor: accentColor },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.drawerTabText,
                      {
                        color:
                          activeThumbnailTab === 'all' ? accentColor : theme.textMuted,
                      },
                    ]}
                  >
                    Pages ({totalPages})
                  </Text>
                </SmoothPressable>

                <SmoothPressable
                  onPress={() => setActiveThumbnailTab('bookmarks')}
                  style={[
                    styles.drawerTab,
                    activeThumbnailTab === 'bookmarks' && [
                      styles.drawerTabActive,
                      { borderColor: accentColor },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.drawerTabText,
                      {
                        color:
                          activeThumbnailTab === 'bookmarks'
                            ? accentColor
                            : theme.textMuted,
                      },
                    ]}
                  >
                    Bookmarks ({bookmarks.length})
                  </Text>
                </SmoothPressable>
              </View>

              {/* Thumbnails Scroll */}
              <ScrollView
                style={styles.thumbnailList}
                showsVerticalScrollIndicator={false}
              >
                {(activeThumbnailTab === 'all'
                  ? pagesData
                  : pagesData.filter((p) => bookmarks.includes(p.pageNumber))
                ).map((p) => {
                  const isCur = p.pageNumber === currentPage;
                  const isBm = bookmarks.includes(p.pageNumber);

                  return (
                    <SmoothPressable
                      key={p.pageNumber}
                      onPress={() => handlePageChange(p.pageNumber)}
                      style={[
                        styles.thumbnailCard,
                        {
                          backgroundColor: isCur ? `${accentColor}18` : theme.surface,
                          borderColor: isCur ? accentColor : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.thumbnailCardTop}>
                        <Text
                          style={[
                            styles.thumbnailPageNum,
                            { color: isCur ? accentColor : theme.navy },
                          ]}
                        >
                          Page {p.pageNumber}
                        </Text>
                        {isBm && (
                          <Ionicons name="bookmark" size={13} color="#F59E0B" />
                        )}
                      </View>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.thumbnailTitle,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {p.chapterTitle}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Bottom Floating Control Bar (iOS Dynamic Toolbar style) */}
        <View
          style={[
            styles.bottomToolbar,
            { backgroundColor: theme.card, borderTopColor: theme.border },
          ]}
        >
          {/* Page Navigation Controls */}
          <View style={styles.pageNavGroup}>
            <SmoothPressable
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              style={[
                styles.navArrowBtn,
                currentPage <= 1 && styles.navBtnDisabled,
              ]}
              accessibilityLabel="Previous page"
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={currentPage <= 1 ? theme.textMuted : theme.navy}
              />
            </SmoothPressable>

            <SmoothPressable
              onPress={() => setIsJumpModalOpen(true)}
              style={[styles.pageIndicatorPill, { backgroundColor: theme.surface }]}
              accessibilityLabel="Jump to page"
            >
              <Text style={[styles.pageIndicatorText, { color: theme.navy }]}>
                {currentPage} / {totalPages}
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              style={[
                styles.navArrowBtn,
                currentPage >= totalPages && styles.navBtnDisabled,
              ]}
              accessibilityLabel="Next page"
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={currentPage >= totalPages ? theme.textMuted : theme.navy}
              />
            </SmoothPressable>
          </View>

          {/* Zoom Controls */}
          <View style={styles.zoomGroup}>
            <SmoothPressable
              onPress={handleZoomOut}
              style={[styles.zoomBtn, { backgroundColor: theme.surface }]}
              accessibilityLabel="Zoom out"
            >
              <Ionicons name="remove" size={16} color={theme.navy} />
            </SmoothPressable>

            <SmoothPressable
              onPress={handleFitWidth}
              style={[styles.zoomPctBtn, { backgroundColor: theme.surface }]}
              accessibilityLabel="Reset zoom to 100%"
            >
              <Text style={[styles.zoomPctText, { color: theme.navy }]}>
                {zoomLevel}%
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={handleZoomIn}
              style={[styles.zoomBtn, { backgroundColor: theme.surface }]}
              accessibilityLabel="Zoom in"
            >
              <Ionicons name="add" size={16} color={theme.navy} />
            </SmoothPressable>
          </View>

          {/* Offline Download Status Toggle */}
          <SmoothPressable
            onPress={() => void toggleFileOffline(file.id)}
            style={[
              styles.offlineTogglePill,
              {
                backgroundColor: file.isOfflineAvailable
                  ? 'rgba(16, 185, 129, 0.18)'
                  : theme.surface,
              },
            ]}
          >
            <Ionicons
              name={file.isOfflineAvailable ? 'cloud-done' : 'cloud-download-outline'}
              size={15}
              color={file.isOfflineAvailable ? '#10B981' : theme.textMuted}
            />
            <Text
              style={[
                styles.offlineToggleText,
                { color: file.isOfflineAvailable ? '#10B981' : theme.navy },
              ]}
            >
              {file.isOfflineAvailable ? 'Offline Ready' : 'Download'}
            </Text>
          </SmoothPressable>
        </View>

        {/* Page Jump Modal Dialog */}
        {isJumpModalOpen && (
          <Modal transparent animationType="fade" visible={isJumpModalOpen}>
            <View style={styles.jumpBackdrop}>
              <View
                style={[
                  styles.jumpDialog,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.jumpTitle, { color: theme.navy }]}>
                  Jump to Page
                </Text>
                <Text style={[styles.jumpSubtitle, { color: theme.textSecondary }]}>
                  Enter a page number between 1 and {totalPages}
                </Text>

                <TextInput
                  value={jumpPageInput}
                  onChangeText={setJumpPageInput}
                  keyboardType="numeric"
                  placeholder={`1 - ${totalPages}`}
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.jumpInput,
                    {
                      backgroundColor: theme.surface,
                      color: theme.navy,
                      borderColor: theme.border,
                    },
                  ]}
                  autoFocus
                />

                <View style={styles.jumpButtonsRow}>
                  <SmoothPressable
                    onPress={() => setIsJumpModalOpen(false)}
                    style={[styles.jumpCancelBtn, { borderColor: theme.border }]}
                  >
                    <Text style={[styles.jumpCancelBtnText, { color: theme.navy }]}>
                      Cancel
                    </Text>
                  </SmoothPressable>

                  <SmoothPressable
                    onPress={handleJumpSubmit}
                    style={[styles.jumpConfirmBtn, { backgroundColor: accentColor }]}
                  >
                    <Text style={styles.jumpConfirmBtnText}>Go</Text>
                  </SmoothPressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 20,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docHeaderMeta: {
    flex: 1,
    gap: 2,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  docSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  docSizeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchDocInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  searchMatchesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchesText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workspace: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  viewportScroll: {
    flex: 1,
  },
  viewportContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  pdfEmbedContainer: {
    width: '100%',
    maxWidth: 820,
    borderRadius: 16,
    overflow: 'hidden',
  },
  docPaper: {
    width: '100%',
    maxWidth: 760,
    minHeight: 880,
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  paperHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  paperSubjectText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  paperChapterText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  paperHeaderRight: {
    paddingLeft: 12,
  },
  paperPageNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  paperBody: {
    flex: 1,
    gap: 22,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionParagraph: {
    fontSize: 13.5,
    lineHeight: 22,
  },
  formulaCallout: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginTop: 6,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calloutTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formulaText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: -0.2,
  },
  paperFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerWatermark: {
    fontSize: 11,
    fontWeight: '600',
  },
  thumbnailsDrawer: {
    width: 220,
    borderLeftWidth: 1,
  },
  drawerTabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  drawerTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  drawerTabActive: {},
  drawerTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  thumbnailList: {
    padding: 10,
    gap: 8,
  },
  thumbnailCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 4,
  },
  thumbnailCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbnailPageNum: {
    fontSize: 11,
    fontWeight: '800',
  },
  thumbnailTitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  bottomToolbar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    zIndex: 20,
  },
  pageNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  pageIndicatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
  },
  zoomGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomPctBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  zoomPctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  offlineTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  offlineToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  jumpBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 20, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  jumpDialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  jumpTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  jumpSubtitle: {
    fontSize: 12,
  },
  jumpInput: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
  },
  jumpButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  jumpCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  jumpCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  jumpConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  jumpConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
