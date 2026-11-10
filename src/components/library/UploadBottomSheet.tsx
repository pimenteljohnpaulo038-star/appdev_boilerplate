import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DepthCard } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type {
  LibraryFileItem,
  LibraryFileType,
} from '@/data/orasorasData';
import {
  detectFileType,
  formatBytes,
  getFileTypeColor,
  getFileTypeIcon,
} from '@/services/libraryStorage';
import { useTheme } from '@/theme';

interface SelectedUploadFile {
  id: string;
  originalFileName: string;
  title: string;
  description: string;
  tags: string[];
  fileSize: number;
  fileType: LibraryFileType;
  mimeType: string;
  fileExtension: string;
  rawFileOrUri: File | Blob | string;
  duplicateConflict?: 'rename' | 'replace' | 'keep_both';
  duplicateWarning?: boolean;
  uploadProgress: number; // 0..100
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface UploadBottomSheetProps {
  visible: boolean;
  initialSubjectId?: string;
  initialFolderId?: string;
  onClose: () => void;
  onUploaded?: (newFiles: LibraryFileItem[]) => void;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit

export function UploadBottomSheet({
  visible,
  initialSubjectId,
  initialFolderId,
  onClose,
  onUploaded,
}: UploadBottomSheetProps) {
  const theme = useTheme();
  const {
    allSubjects,
    customFolders,
    uploadedFiles,
    uploadLibraryFile,
    createCustomFolder,
    activeTheme,
  } = useOras();

  // Selected destination subject and folder
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || allSubjects[0]?.id || 'math'
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId || 'root'
  );

  // Quick inline new folder input
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Selected files queue
  const [filesQueue, setFilesQueue] = useState<SelectedUploadFile[]>([]);

  // Overall upload state
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [prevInitSubject, setPrevInitSubject] = useState(initialSubjectId);
  const [prevInitFolder, setPrevInitFolder] = useState(initialFolderId);

  if (initialSubjectId !== prevInitSubject) {
    setPrevInitSubject(initialSubjectId);
    if (initialSubjectId) setSelectedSubjectId(initialSubjectId);
  }
  if (initialFolderId !== prevInitFolder) {
    setPrevInitFolder(initialFolderId);
    if (initialFolderId) setSelectedFolderId(initialFolderId);
  }

  const activeSubject = allSubjects.find((s) => s.id === selectedSubjectId) || allSubjects[0];
  const subjectColor = activeSubject?.color || activeTheme.primary;

  // Available folders for the currently selected subject:
  // 1. Root / General
  // 2. Academic Modules (if standard subject)
  // 3. Custom student folders for this subject
  const availableFolders = React.useMemo(() => {
    const list: { id: string; name: string }[] = [{ id: 'root', name: 'General / Root' }];

    if (activeSubject && 'modules' in activeSubject && Array.isArray(activeSubject.modules)) {
      for (const m of activeSubject.modules) {
        list.push({ id: m.id, name: `Mod ${m.number}: ${m.title}` });
      }
    }

    const custom = customFolders.filter((f) => f.subjectId === selectedSubjectId);
    for (const cf of custom) {
      if (!list.some((item) => item.id === cf.id)) {
        list.push({ id: cf.id, name: cf.name });
      }
    }

    return list;
  }, [activeSubject, customFolders, selectedSubjectId]);

  const activeFolderName =
    availableFolders.find((f) => f.id === selectedFolderId)?.name || 'General / Root';

  // Check for duplicate filenames in the selected subject & folder
  const checkDuplicate = useCallback(
    (fileName: string): boolean => {
      return uploadedFiles.some(
        (f) =>
          f.subjectId === selectedSubjectId &&
          f.originalFileName.toLowerCase() === fileName.toLowerCase()
      );
    },
    [selectedSubjectId, uploadedFiles]
  );

  const handlePickDocuments = async () => {
    try {
      setGeneralError(null);
      const res = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/*',
          'image/*',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const newEntries: SelectedUploadFile[] = [];

      for (const asset of res.assets) {
        const name = asset.name || 'document';
        const size = asset.size || 0;
        const mime = asset.mimeType || 'application/octet-stream';
        const type = detectFileType(name, mime);
        const ext = name.split('.').pop()?.toLowerCase() || '';

        // Validation: file size
        if (size <= 0) {
          setGeneralError(`"${name}" is empty or 0 bytes and cannot be uploaded.`);
          continue;
        }
        if (size > MAX_FILE_SIZE_BYTES) {
          setGeneralError(`"${name}" exceeds the 50 MB limit (${formatBytes(size)}).`);
          continue;
        }

        const isDup = checkDuplicate(name);
        const cleanTitle = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        newEntries.push({
          id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          originalFileName: name,
          title: cleanTitle,
          description: '',
          tags: [type],
          fileSize: size,
          fileType: type,
          mimeType: mime,
          fileExtension: ext,
          rawFileOrUri: (asset as unknown as { file?: File }).file || asset.uri,
          duplicateWarning: isDup,
          duplicateConflict: isDup ? 'rename' : undefined,
          uploadProgress: 0,
          status: 'idle',
        });
      }

      setFilesQueue((prev) => [...prev, ...newEntries]);
    } catch (e) {
      console.warn('Document picker error:', e);
      setGeneralError('Could not open file picker. Please try again.');
    }
  };

  const handlePickImages = async () => {
    try {
      setGeneralError(null);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const newEntries: SelectedUploadFile[] = [];

      for (const asset of res.assets) {
        const name = asset.fileName || `Scan_${Date.now()}.jpg`;
        const size = asset.fileSize || 500000;
        const mime = asset.mimeType || 'image/jpeg';
        const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
        const isDup = checkDuplicate(name);
        const cleanTitle = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        newEntries.push({
          id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          originalFileName: name,
          title: cleanTitle,
          description: 'Document image capture',
          tags: ['image', 'study-notes'],
          fileSize: size,
          fileType: 'image',
          mimeType: mime,
          fileExtension: ext,
          rawFileOrUri: asset.uri,
          duplicateWarning: isDup,
          duplicateConflict: isDup ? 'rename' : undefined,
          uploadProgress: 0,
          status: 'idle',
        });
      }

      setFilesQueue((prev) => [...prev, ...newEntries]);
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleRemoveQueueItem = (id: string) => {
    setFilesQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemTitle = (id: string, title: string) => {
    setFilesQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item))
    );
  };

  const handleUpdateItemDescription = (id: string, description: string) => {
    setFilesQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description } : item))
    );
  };

  const handleSetDuplicateAction = (
    id: string,
    action: 'rename' | 'replace' | 'keep_both'
  ) => {
    setFilesQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let finalTitle = item.title;
        let finalName = item.originalFileName;
        if (action === 'rename') {
          finalTitle = `${item.title} (1)`;
          finalName = item.originalFileName.replace(/(\.[^.]+)$/, ' (1)$1');
        }
        return {
          ...item,
          duplicateConflict: action,
          title: finalTitle,
          originalFileName: finalName,
          duplicateWarning: action === 'replace' ? true : false,
        };
      })
    );
  };

  const handleCreateFolderInline = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const created = await createCustomFolder({
      subjectId: selectedSubjectId,
      name: trimmed,
      color: subjectColor,
      icon: 'folder',
    });
    setSelectedFolderId(created.id);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // Perform the actual save and upload
  const handleStartUpload = async () => {
    if (filesQueue.length === 0) return;
    setIsUploading(true);
    setGeneralError(null);

    const savedResults: LibraryFileItem[] = [];
    const totalFiles = filesQueue.length;

    for (let i = 0; i < totalFiles; i++) {
      const qItem = filesQueue[i];

      // Mark this file uploading
      setFilesQueue((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
      );

      // Simulate step-by-step chunked upload progress
      for (let p = 20; p <= 90; p += 35) {
        setFilesQueue((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, uploadProgress: p } : f))
        );
        const overall = Math.round(((i + p / 100) / totalFiles) * 100);
        setOverallProgress(overall);
        await new Promise((r) => setTimeout(r, 80));
      }

      try {
        // Build the metadata
        const fileData: Omit<LibraryFileItem, 'id' | 'accountId' | 'uploadedAt'> = {
          subjectId: selectedSubjectId,
          subjectName: activeSubject.shortName || activeSubject.name,
          folderId: selectedFolderId,
          folderName: activeFolderName,
          title: qItem.title.trim() || qItem.originalFileName,
          originalFileName: qItem.originalFileName,
          fileType: qItem.fileType,
          mimeType: qItem.mimeType,
          fileExtension: qItem.fileExtension,
          fileSize: qItem.fileSize,
          description: qItem.description.trim(),
          tags: qItem.tags,
          isFavorite: false,
          isPinned: false,
          isOfflineAvailable: true,
          totalPages: qItem.fileType === 'pdf' ? 12 : undefined,
          lastReadPage: qItem.fileType === 'pdf' ? 1 : undefined,
          bookmarks: [],
        };

        const saved = await uploadLibraryFile(fileData, qItem.rawFileOrUri);
        savedResults.push(saved);

        // Mark this file success
        setFilesQueue((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'success', uploadProgress: 100 } : f
          )
        );
      } catch (err) {
        console.warn('Upload save error:', err);
        setFilesQueue((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'error',
                  errorMessage: 'Failed to save to local offline storage.',
                }
              : f
          )
        );
      }
    }

    setOverallProgress(100);
    setIsUploading(false);

    // Call onUploaded callback with newly saved items
    if (savedResults.length > 0 && onUploaded) {
      onUploaded(savedResults);
    }

    // Auto-close after brief success visual
    setTimeout(() => {
      setFilesQueue([]);
      onClose();
    }, 900);
  };

  const handleWebDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const dropped = Array.from(e.dataTransfer.files);
        const newEntries: SelectedUploadFile[] = [];
        let idx = 0;
        const now = Date.now();
        for (const file of dropped) {
          const name = file.name;
          const size = file.size;
          const mime = file.type || 'application/octet-stream';
          const type = detectFileType(name, mime);
          const ext = name.split('.').pop()?.toLowerCase() || '';

          if (size <= 0 || size > MAX_FILE_SIZE_BYTES) continue;
          const isDup = checkDuplicate(name);
          const cleanTitle = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

          newEntries.push({
            id: `queue_${now}_${idx++}`,
            originalFileName: name,
            title: cleanTitle,
            description: '',
            tags: [type],
            fileSize: size,
            fileType: type,
            mimeType: mime,
            fileExtension: ext,
            rawFileOrUri: file,
            duplicateWarning: isDup,
            duplicateConflict: isDup ? 'rename' : undefined,
            uploadProgress: 0,
            status: 'idle',
          });
        }
        setFilesQueue((prev) => [...prev, ...newEntries]);
      }
    },
    [checkDuplicate]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.bottomSheet,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {/* iOS Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: theme.isDark ? '#334155' : '#CBD5E1' },
              ]}
            />
          </View>

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <View
                style={[
                  styles.headerIconBox,
                  { backgroundColor: `${subjectColor}18` },
                ]}
              >
                <Ionicons name="cloud-upload" size={20} color={subjectColor} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.navy }]}>
                  Upload Study Materials
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                  Files will be securely organized under {activeSubject.shortName}
                </Text>
              </View>
            </View>

            <SmoothPressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surface }]}
              accessibilityLabel="Close upload dialog"
            >
              <Ionicons name="close" size={18} color={theme.navy} />
            </SmoothPressable>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* General Error Banner */}
            {Boolean(generalError) && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            )}

            {/* 1. Subject Selector */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                1. TARGET ACADEMIC SUBJECT
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectPillRow}
              >
                {allSubjects.map((subj) => {
                  const active = subj.id === selectedSubjectId;
                  return (
                    <SmoothPressable
                      key={subj.id}
                      onPress={() => setSelectedSubjectId(subj.id)}
                      style={[
                        styles.subjectPill,
                        {
                          backgroundColor: active ? subj.color : theme.surface,
                          borderColor: active ? subj.color : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={subj.icon as React.ComponentProps<typeof Ionicons>['name']}
                        size={14}
                        color={active ? '#FFFFFF' : subj.color}
                      />
                      <Text
                        style={[
                          styles.subjectPillText,
                          { color: active ? '#FFFFFF' : theme.navy },
                        ]}
                      >
                        {subj.shortName}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Module or Folder Selector */}
            <View style={styles.sectionWrap}>
              <View style={styles.rowBetween}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  2. ASSIGN TO FOLDER / MODULE
                </Text>
                {!isCreatingFolder && (
                  <SmoothPressable
                    onPress={() => setIsCreatingFolder(true)}
                    style={styles.newFolderToggle}
                  >
                    <Ionicons name="add-circle" size={14} color={subjectColor} />
                    <Text
                      style={[styles.newFolderToggleText, { color: subjectColor }]}
                    >
                      New Folder
                    </Text>
                  </SmoothPressable>
                )}
              </View>

              {isCreatingFolder && (
                <View
                  style={[
                    styles.inlineFolderCreator,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    placeholder="Enter folder name (e.g. Midterm Exams, Formulas)..."
                    placeholderTextColor={theme.textMuted}
                    style={[styles.folderInput, { color: theme.navy }]}
                    autoFocus
                  />
                  <View style={styles.inlineFolderActions}>
                    <SmoothPressable
                      onPress={handleCreateFolderInline}
                      style={[styles.saveFolderBtn, { backgroundColor: subjectColor }]}
                    >
                      <Text style={styles.saveFolderBtnText}>Create</Text>
                    </SmoothPressable>
                    <SmoothPressable
                      onPress={() => {
                        setIsCreatingFolder(false);
                        setNewFolderName('');
                      }}
                      style={styles.cancelFolderBtn}
                    >
                      <Text style={[styles.cancelFolderBtnText, { color: theme.textMuted }]}>
                        Cancel
                      </Text>
                    </SmoothPressable>
                  </View>
                </View>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.folderPillRow}
              >
                {availableFolders.map((fld) => {
                  const active = fld.id === selectedFolderId;
                  return (
                    <SmoothPressable
                      key={fld.id}
                      onPress={() => setSelectedFolderId(fld.id)}
                      style={[
                        styles.folderPill,
                        {
                          backgroundColor: active ? `${subjectColor}18` : theme.surface,
                          borderColor: active ? subjectColor : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={fld.id === 'root' ? 'folder-open' : 'folder'}
                        size={13}
                        color={active ? subjectColor : theme.textMuted}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.folderPillText,
                          { color: active ? subjectColor : theme.navy },
                        ]}
                      >
                        {fld.name}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Drag-and-Drop Area & File Pickers */}
            <View
              style={[
                styles.dropzone,
                {
                  backgroundColor: isDraggingOver
                    ? `${subjectColor}14`
                    : theme.surface,
                  borderColor: isDraggingOver ? subjectColor : theme.border,
                },
              ]}
              {...Platform.select({
                web: {
                  onDragOver: (e: React.DragEvent) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  },
                  onDragLeave: () => setIsDraggingOver(false),
                  onDrop: handleWebDrop,
                } as unknown as object,
              })}
            >
              <View
                style={[
                  styles.dropzoneIconBox,
                  { backgroundColor: `${subjectColor}18` },
                ]}
              >
                <Ionicons name="documents" size={26} color={subjectColor} />
              </View>

              <Text style={[styles.dropzoneTitle, { color: theme.navy }]}>
                Choose study materials or drop them here
              </Text>
              <Text
                style={[styles.dropzoneSubtitle, { color: theme.textSecondary }]}
              >
                Supports PDF, Word, PowerPoint, Excel, Images, and Text up to 50 MB
              </Text>

              {/* Action Buttons */}
              <View style={styles.pickerButtonsRow}>
                <SmoothPressable
                  onPress={handlePickDocuments}
                  style={[styles.primaryPickBtn, { backgroundColor: subjectColor }]}
                >
                  <Ionicons name="folder-open" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryPickBtnText}>Choose Documents</Text>
                </SmoothPressable>

                <SmoothPressable
                  onPress={handlePickImages}
                  style={[styles.secondaryPickBtn, { borderColor: theme.border }]}
                >
                  <Ionicons name="camera" size={16} color={theme.navy} />
                  <Text style={[styles.secondaryPickBtnText, { color: theme.navy }]}>
                    Photos / Scan
                  </Text>
                </SmoothPressable>
              </View>
            </View>

            {/* 4. Selected Files Queue with Review & Conflict Resolution */}
            {filesQueue.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                    FILES READY TO UPLOAD ({filesQueue.length})
                  </Text>
                  <SmoothPressable onPress={() => setFilesQueue([])}>
                    <Text style={[styles.clearQueueText, { color: '#EF4444' }]}>
                      Clear All
                    </Text>
                  </SmoothPressable>
                </View>

                {filesQueue.map((item) => {
                  const typeColor = getFileTypeColor(item.fileType);
                  const typeIcon = getFileTypeIcon(item.fileType);

                  return (
                    <DepthCard
                      key={item.id}
                      variant="card"
                      style={[
                        styles.queueCard,
                        {
                          borderColor: item.duplicateWarning
                            ? '#F59E0B'
                            : theme.border,
                        },
                      ]}
                    >
                      {/* Top Row: Icon, Title & Delete Button */}
                      <View style={styles.queueCardTop}>
                        <View
                          style={[
                            styles.queueIconBox,
                            { backgroundColor: `${typeColor}18` },
                          ]}
                        >
                          <Ionicons
                            name={typeIcon as React.ComponentProps<typeof Ionicons>['name']}
                            size={18}
                            color={typeColor}
                          />
                        </View>

                        <View style={styles.queueMainInfo}>
                          <TextInput
                            value={item.title}
                            onChangeText={(t) => handleUpdateItemTitle(item.id, t)}
                            placeholder="Enter display title..."
                            placeholderTextColor={theme.textMuted}
                            style={[styles.queueTitleInput, { color: theme.navy }]}
                          />
                          <Text
                            style={[
                              styles.queueOriginalName,
                              { color: theme.textMuted },
                            ]}
                          >
                            {item.originalFileName} · {formatBytes(item.fileSize)}
                          </Text>
                        </View>

                        {!isUploading && (
                          <SmoothPressable
                            onPress={() => handleRemoveQueueItem(item.id)}
                            style={styles.queueDeleteBtn}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#EF4444"
                            />
                          </SmoothPressable>
                        )}
                      </View>

                      {/* Optional Description */}
                      <TextInput
                        value={item.description}
                        onChangeText={(d) =>
                          handleUpdateItemDescription(item.id, d)
                        }
                        placeholder="Optional study note / description..."
                        placeholderTextColor={theme.textMuted}
                        style={[
                          styles.queueDescInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.navy,
                            borderColor: theme.border,
                          },
                        ]}
                      />

                      {/* Duplicate Conflict Warning Box */}
                      {item.duplicateWarning && (
                        <View style={styles.duplicateWarningBox}>
                          <View style={styles.duplicateHeader}>
                            <Ionicons name="warning" size={14} color="#F59E0B" />
                            <Text style={styles.duplicateWarningTitle}>
                              A file named &quot;{item.originalFileName}&quot; already exists in {activeSubject.shortName}.
                            </Text>
                          </View>
                          <View style={styles.duplicateOptionsRow}>
                            <SmoothPressable
                              onPress={() => handleSetDuplicateAction(item.id, 'rename')}
                              style={[
                                styles.duplicateActionBtn,
                                item.duplicateConflict === 'rename' && styles.duplicateActionBtnActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.duplicateActionBtnText,
                                  item.duplicateConflict === 'rename' && styles.duplicateActionBtnTextActive,
                                ]}
                              >
                                Auto-Rename
                              </Text>
                            </SmoothPressable>

                            <SmoothPressable
                              onPress={() => handleSetDuplicateAction(item.id, 'replace')}
                              style={[
                                styles.duplicateActionBtn,
                                item.duplicateConflict === 'replace' && styles.duplicateActionBtnActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.duplicateActionBtnText,
                                  item.duplicateConflict === 'replace' && styles.duplicateActionBtnTextActive,
                                ]}
                              >
                                Replace
                              </Text>
                            </SmoothPressable>

                            <SmoothPressable
                              onPress={() => handleSetDuplicateAction(item.id, 'keep_both')}
                              style={[
                                styles.duplicateActionBtn,
                                item.duplicateConflict === 'keep_both' && styles.duplicateActionBtnActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.duplicateActionBtnText,
                                  item.duplicateConflict === 'keep_both' && styles.duplicateActionBtnTextActive,
                                ]}
                              >
                                Keep Both
                              </Text>
                            </SmoothPressable>
                          </View>
                        </View>
                      )}

                      {/* Progress Bar when uploading */}
                      {isUploading && (
                        <View style={styles.queueProgressWrap}>
                          <View
                            style={[
                              styles.progressBarTrack,
                              { backgroundColor: theme.surface },
                            ]}
                          >
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${item.uploadProgress}%`,
                                  backgroundColor:
                                    item.status === 'success'
                                      ? '#10B981'
                                      : item.status === 'error'
                                      ? '#EF4444'
                                      : subjectColor,
                                },
                              ]}
                            />
                          </View>
                          <View style={styles.rowBetween}>
                            <Text
                              style={[
                                styles.progressStatusText,
                                {
                                  color:
                                    item.status === 'success'
                                      ? '#10B981'
                                      : item.status === 'error'
                                      ? '#EF4444'
                                      : theme.textMuted,
                                },
                              ]}
                            >
                              {item.status === 'uploading'
                                ? `Saving to offline storage... ${item.uploadProgress}%`
                                : item.status === 'success'
                                ? 'Saved successfully'
                                : item.errorMessage || 'Upload failed'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </DepthCard>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Sheet Footer: Progress & Confirmation Actions */}
          <View
            style={[
              styles.sheetFooter,
              { borderTopColor: theme.border, backgroundColor: theme.card },
            ]}
          >
            {isUploading && (
              <View style={styles.overallProgressBox}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.overallProgressText, { color: theme.navy }]}>
                    Overall Progress
                  </Text>
                  <Text style={[styles.overallProgressPct, { color: subjectColor }]}>
                    {overallProgress}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBarTrack,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${overallProgress}%`,
                        backgroundColor: subjectColor,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            <View style={styles.footerButtonsRow}>
              <SmoothPressable
                onPress={onClose}
                disabled={isUploading}
                style={[styles.cancelBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.navy }]}>
                  Cancel
                </Text>
              </SmoothPressable>

              <SmoothPressable
                onPress={handleStartUpload}
                disabled={filesQueue.length === 0 || isUploading}
                style={[
                  styles.confirmUploadBtn,
                  {
                    backgroundColor:
                      filesQueue.length > 0 && !isUploading
                        ? subjectColor
                        : theme.border,
                  },
                ]}
              >
                <Ionicons
                  name={isUploading ? 'sync' : 'cloud-upload'}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.confirmUploadBtnText}>
                  {isUploading
                    ? 'Saving Files...'
                    : `Confirm Upload (${filesQueue.length})`}
                </Text>
              </SmoothPressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 20, 0.65)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    maxHeight: '90%',
    minHeight: '60%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 14,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectPillRow: {
    gap: 8,
    paddingVertical: 2,
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  newFolderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newFolderToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inlineFolderCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  folderInput: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inlineFolderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveFolderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveFolderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelFolderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelFolderBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  folderPillRow: {
    gap: 8,
    paddingVertical: 2,
  },
  folderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 200,
  },
  folderPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropzone: {
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dropzoneIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  dropzoneSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 10,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryPickBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryPickBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  clearQueueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  queueCard: {
    padding: 12,
    borderRadius: 16,
    gap: 8,
    marginBottom: 8,
  },
  queueCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  queueIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueMainInfo: {
    flex: 1,
    gap: 2,
  },
  queueTitleInput: {
    fontSize: 13,
    fontWeight: '700',
    padding: 0,
  },
  queueOriginalName: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  queueDeleteBtn: {
    padding: 6,
  },
  queueDescInput: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  duplicateWarningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  duplicateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  duplicateWarningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    flex: 1,
  },
  duplicateOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  duplicateActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  duplicateActionBtnActive: {
    backgroundColor: '#D97706',
  },
  duplicateActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  duplicateActionBtnTextActive: {
    color: '#FFFFFF',
  },
  queueProgressWrap: {
    gap: 4,
    marginTop: 4,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sheetFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  overallProgressBox: {
    gap: 6,
  },
  overallProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  overallProgressPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  footerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmUploadBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  confirmUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
