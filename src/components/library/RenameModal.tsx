import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type { LibraryFileItem } from '@/data/orasorasData';
import { getFileTypeColor } from '@/services/libraryStorage';
import { useTheme } from '@/theme';

interface RenameModalProps {
  file: LibraryFileItem | null;
  visible: boolean;
  onClose: () => void;
}

export function RenameModal({ file, visible, onClose }: RenameModalProps) {
  const theme = useTheme();
  const { updateLibraryFile } = useOras();

  const [title, setTitle] = useState(file?.title || '');
  const [description, setDescription] = useState(file?.description || '');
  const [prevFileId, setPrevFileId] = useState<string | undefined>(file?.id);

  if (file && file.id !== prevFileId) {
    setPrevFileId(file.id);
    setTitle(file.title);
    setDescription(file.description || '');
  }

  if (!file) return null;

  const accentColor = getFileTypeColor(file.fileType);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await updateLibraryFile(file.id, {
      title: trimmed,
      description: description.trim(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.titleText, { color: theme.navy }]}>Rename Material</Text>
              <Text numberOfLines={1} style={[styles.subText, { color: theme.textMuted }]}>
                {file.originalFileName}
              </Text>
            </View>
            <SmoothPressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={theme.navy} />
            </SmoothPressable>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>DISPLAY TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                { backgroundColor: theme.surface, color: theme.navy, borderColor: theme.border },
              ]}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>STUDY NOTES / DESCRIPTION</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional notes about this material..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              style={[
                styles.textArea,
                { backgroundColor: theme.surface, color: theme.navy, borderColor: theme.border },
              ]}
            />
          </View>

          <View style={styles.actionsRow}>
            <SmoothPressable onPress={onClose} style={[styles.cancelBtn, { borderColor: theme.border }]}>
              <Text style={[styles.cancelBtnText, { color: theme.navy }]}>Cancel</Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={handleSave}
              disabled={!title.trim()}
              style={[
                styles.saveBtn,
                { backgroundColor: title.trim() ? accentColor : theme.border },
              ]}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
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
    maxWidth: 380,
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
  titleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  subText: {
    fontSize: 11,
    fontFamily: 'monospace',
    maxWidth: 280,
  },
  closeBtn: {
    padding: 6,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  textInput: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 64,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
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
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
