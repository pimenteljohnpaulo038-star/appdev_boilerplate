import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type { LibraryFileItem } from '@/data/orasorasData';
import { formatBytes, getFileTypeColor, getFileTypeIcon } from '@/services/libraryStorage';
import { useTheme } from '@/theme';

interface FileDetailsModalProps {
  file: LibraryFileItem | null;
  visible: boolean;
  onClose: () => void;
}

export function FileDetailsModal({ file, visible, onClose }: FileDetailsModalProps) {
  const theme = useTheme();
  const { account } = useOras();

  if (!file) return null;

  const typeColor = getFileTypeColor(file.fileType);
  const typeIcon = getFileTypeIcon(file.fileType);

  const formattedUpload = new Date(file.uploadedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const formattedOpened = file.lastOpenedAt
    ? new Date(file.lastOpenedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Never';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: `${typeColor}18` }]}>
              <Ionicons
                name={typeIcon as React.ComponentProps<typeof Ionicons>['name']}
                size={22}
                color={typeColor}
              />
            </View>
            <View style={styles.headerTextWrap}>
              <Text numberOfLines={1} style={[styles.title, { color: theme.navy }]}>
                {file.title}
              </Text>
              <Text numberOfLines={1} style={[styles.filename, { color: theme.textMuted }]}>
                {file.originalFileName}
              </Text>
            </View>
            <SmoothPressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={theme.navy} />
            </SmoothPressable>
          </View>

          {/* Academic Organization Hierarchy Path */}
          <View style={[styles.pathCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.pathLabel, { color: theme.textMuted }]}>ACADEMIC PATH</Text>
            <View style={styles.pathRow}>
              <Text style={[styles.pathSegment, { color: theme.navy }]}>{account.level}</Text>
              <Ionicons name="chevron-forward" size={12} color={theme.textMuted} />
              <Text style={[styles.pathSegment, { color: typeColor, fontWeight: '800' }]}>
                {file.subjectName}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={theme.textMuted} />
              <Text style={[styles.pathSegment, { color: theme.navy }]}>
                {file.folderName || 'General'}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={theme.textMuted} />
              <Text numberOfLines={1} style={[styles.pathSegment, { color: theme.textSecondary }]}>
                {file.originalFileName}
              </Text>
            </View>
          </View>

          {/* Metadata Rows */}
          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <Text style={[styles.metaKey, { color: theme.textMuted }]}>Format & Type</Text>
              <Text style={[styles.metaVal, { color: theme.navy }]}>
                {file.fileType.toUpperCase()} ({file.mimeType})
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaKey, { color: theme.textMuted }]}>File Size</Text>
              <Text style={[styles.metaVal, { color: theme.navy }]}>
                {formatBytes(file.fileSize)} ({file.fileSize.toLocaleString()} bytes)
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaKey, { color: theme.textMuted }]}>Uploaded At</Text>
              <Text style={[styles.metaVal, { color: theme.navy }]}>{formattedUpload}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaKey, { color: theme.textMuted }]}>Last Opened</Text>
              <Text style={[styles.metaVal, { color: theme.navy }]}>{formattedOpened}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaKey, { color: theme.textMuted }]}>Offline State</Text>
              <Text
                style={[
                  styles.metaVal,
                  { color: file.isOfflineAvailable ? '#10B981' : theme.textMuted, fontWeight: '700' },
                ]}
              >
                {file.isOfflineAvailable ? 'Available Offline (Local Storage)' : 'Not Downloaded'}
              </Text>
            </View>

            {file.fileType === 'pdf' && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaKey, { color: theme.textMuted }]}>Reading Progress</Text>
                <Text style={[styles.metaVal, { color: theme.navy }]}>
                  {file.lastReadPage ? `Page ${file.lastReadPage} of ${file.totalPages || 12}` : 'Unread'}
                </Text>
              </View>
            )}

            {file.tags && file.tags.length > 0 && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaKey, { color: theme.textMuted }]}>Tags</Text>
                <Text style={[styles.metaVal, { color: typeColor }]}>
                  {file.tags.map((t) => `#${t}`).join(', ')}
                </Text>
              </View>
            )}

            {Boolean(file.description) && (
              <View style={styles.descBlock}>
                <Text style={[styles.metaKey, { color: theme.textMuted }]}>Description</Text>
                <Text style={[styles.descText, { color: theme.navy }]}>{file.description}</Text>
              </View>
            )}
          </View>

          {/* Close Action */}
          <SmoothPressable
            onPress={onClose}
            style={[styles.doneBtn, { backgroundColor: typeColor }]}
          >
            <Text style={styles.doneBtnText}>Close Details</Text>
          </SmoothPressable>
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
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  filename: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  closeBtn: {
    padding: 6,
  },
  pathCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  pathLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pathRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  pathSegment: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaList: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaKey: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  descBlock: {
    gap: 4,
    marginTop: 4,
  },
  descText: {
    fontSize: 12,
    lineHeight: 18,
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
