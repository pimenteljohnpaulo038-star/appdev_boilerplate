import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';

interface CreateFolderModalProps {
  visible: boolean;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  onClose: () => void;
}

export function CreateFolderModal({
  visible,
  subjectId,
  subjectName,
  subjectColor,
  onClose,
}: CreateFolderModalProps) {
  const theme = useTheme();
  const { createCustomFolder } = useOras();
  const [folderName, setFolderName] = useState('');

  const handleCreate = async () => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    await createCustomFolder({
      subjectId,
      name: trimmed,
      color: subjectColor,
      icon: 'folder',
    });
    showMessage('Folder Created', `Folder "${trimmed}" created in ${subjectName}.`);
    setFolderName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: `${subjectColor}18` }]}>
              <Ionicons name="folder-outline" size={20} color={subjectColor} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: theme.navy }]}>Create Folder</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Under {subjectName}
              </Text>
            </View>
            <SmoothPressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={theme.navy} />
            </SmoothPressable>
          </View>

          <View style={styles.inputWrap}>
            <Text style={[styles.label, { color: theme.textMuted }]}>FOLDER NAME</Text>
            <TextInput
              value={folderName}
              onChangeText={setFolderName}
              placeholder="e.g. Midterm Reviews, Lab Manuals..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                { backgroundColor: theme.surface, color: theme.navy, borderColor: theme.border },
              ]}
              autoFocus
            />
          </View>

          <View style={styles.actionsRow}>
            <SmoothPressable onPress={onClose} style={[styles.cancelBtn, { borderColor: theme.border }]}>
              <Text style={[styles.cancelBtnText, { color: theme.navy }]}>Cancel</Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={handleCreate}
              disabled={!folderName.trim()}
              style={[
                styles.confirmBtn,
                { backgroundColor: folderName.trim() ? subjectColor : theme.border },
              ]}
            >
              <Text style={styles.confirmBtnText}>Create Folder</Text>
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
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
  },
  inputWrap: {
    gap: 6,
  },
  label: {
    fontSize: 11,
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
  confirmBtn: {
    flex: 1,
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
