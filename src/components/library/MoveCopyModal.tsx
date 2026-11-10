import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type { LibraryFileItem } from '@/data/orasorasData';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';

interface MoveCopyModalProps {
  file: LibraryFileItem | null;
  visible: boolean;
  onClose: () => void;
}

export function MoveCopyModal({ file, visible, onClose }: MoveCopyModalProps) {
  const theme = useTheme();
  const { allSubjects, customFolders, moveLibraryFile, copyLibraryFile } = useOras();

  const [mode, setMode] = useState<'move' | 'copy'>('move');
  const [targetSubjectId, setTargetSubjectId] = useState<string>(
    file?.subjectId || allSubjects[0]?.id || 'math'
  );
  const [targetFolderId, setTargetFolderId] = useState<string>(
    file?.folderId || 'root'
  );
  const [prevFileId, setPrevFileId] = useState<string | undefined>(file?.id);

  if (file && file.id !== prevFileId) {
    setPrevFileId(file.id);
    setTargetSubjectId(file.subjectId);
    setTargetFolderId(file.folderId || 'root');
  }

  const targetSubject =
    allSubjects.find((s) => s.id === targetSubjectId) || allSubjects[0];
  const subjectColor = targetSubject?.color || '#3B82F6';

  const availableFolders = useMemo(() => {
    const list: { id: string; name: string }[] = [
      { id: 'root', name: 'General / Root' },
    ];

    if (
      targetSubject &&
      'modules' in targetSubject &&
      Array.isArray(targetSubject.modules)
    ) {
      for (const m of targetSubject.modules) {
        list.push({ id: m.id, name: `Mod ${m.number}: ${m.title}` });
      }
    }

    const custom = customFolders.filter((f) => f.subjectId === targetSubjectId);
    for (const cf of custom) {
      if (!list.some((item) => item.id === cf.id)) {
        list.push({ id: cf.id, name: cf.name });
      }
    }

    return list;
  }, [targetSubject, customFolders, targetSubjectId]);

  if (!file) return null;

  const targetFolderName =
    availableFolders.find((f) => f.id === targetFolderId)?.name || 'General / Root';

  const handleConfirm = async () => {
    if (mode === 'move') {
      await moveLibraryFile(
        file.id,
        targetSubjectId,
        targetSubject.shortName || targetSubject.name,
        targetFolderId,
        targetFolderName
      );
      showMessage(
        'File Moved',
        `"${file.title}" has been moved to ${targetSubject.shortName} → ${targetFolderName}.`
      );
    } else {
      await copyLibraryFile(
        file.id,
        targetSubjectId,
        targetSubject.shortName || targetSubject.name,
        targetFolderId,
        targetFolderName
      );
      showMessage(
        'File Copied',
        `A copy of "${file.title}" was created under ${targetSubject.shortName} → ${targetFolderName}.`
      );
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.navy }]}>
                {mode === 'move' ? 'Move Material' : 'Copy Material'}
              </Text>
              <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textSecondary }]}>
                {file.title}
              </Text>
            </View>
            <SmoothPressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={theme.navy} />
            </SmoothPressable>
          </View>

          {/* Mode Segmented Control: Move vs Copy */}
          <View style={[styles.modeSegment, { backgroundColor: theme.surface }]}>
            <SmoothPressable
              onPress={() => setMode('move')}
              style={[
                styles.modeTab,
                mode === 'move' && [styles.modeTabActive, { backgroundColor: theme.card }],
              ]}
            >
              <Ionicons
                name="arrow-forward-circle"
                size={14}
                color={mode === 'move' ? subjectColor : theme.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'move' ? theme.navy : theme.textMuted },
                ]}
              >
                Move File
              </Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={() => setMode('copy')}
              style={[
                styles.modeTab,
                mode === 'copy' && [styles.modeTabActive, { backgroundColor: theme.card }],
              ]}
            >
              <Ionicons
                name="copy"
                size={14}
                color={mode === 'copy' ? subjectColor : theme.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'copy' ? theme.navy : theme.textMuted },
                ]}
              >
                Make a Copy
              </Text>
            </SmoothPressable>
          </View>

          {/* Target Subject Selector */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
              DESTINATION SUBJECT
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {allSubjects.map((s) => {
                const active = s.id === targetSubjectId;
                return (
                  <SmoothPressable
                    key={s.id}
                    onPress={() => setTargetSubjectId(s.id)}
                    style={[
                      styles.subjPill,
                      {
                        backgroundColor: active ? s.color : theme.surface,
                        borderColor: active ? s.color : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={s.icon as React.ComponentProps<typeof Ionicons>['name']}
                      size={13}
                      color={active ? '#FFFFFF' : s.color}
                    />
                    <Text
                      style={[
                        styles.subjPillText,
                        { color: active ? '#FFFFFF' : theme.navy },
                      ]}
                    >
                      {s.shortName}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Target Folder Selector */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
              DESTINATION MODULE / FOLDER
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {availableFolders.map((fld) => {
                const active = fld.id === targetFolderId;
                return (
                  <SmoothPressable
                    key={fld.id}
                    onPress={() => setTargetFolderId(fld.id)}
                    style={[
                      styles.folderPill,
                      {
                        backgroundColor: active ? `${subjectColor}18` : theme.surface,
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

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <SmoothPressable
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: theme.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: theme.navy }]}>Cancel</Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: subjectColor }]}
            >
              <Text style={styles.confirmBtnText}>
                {mode === 'move' ? 'Confirm Move' : 'Confirm Copy'}
              </Text>
            </SmoothPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 20, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    maxWidth: 300,
  },
  closeBtn: {
    padding: 6,
  },
  modeSegment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionWrap: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pillRow: {
    gap: 8,
    paddingVertical: 2,
  },
  subjPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  subjPillText: {
    fontSize: 12,
    fontWeight: '700',
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
