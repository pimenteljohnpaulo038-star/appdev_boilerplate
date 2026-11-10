import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type { LibraryFileItem } from '@/data/orasorasData';
import {
  formatBytes,
  getFileTypeColor,
  getFileTypeIcon,
  shareOrDownloadFile,
} from '@/services/libraryStorage';
import { useTheme } from '@/theme';
import { confirmAction } from '@/utils/confirm';

interface FileActionsModalProps {
  file: LibraryFileItem | null;
  visible: boolean;
  onClose: () => void;
  onOpen: (file: LibraryFileItem) => void;
  onRename: (file: LibraryFileItem) => void;
  onMoveCopy: (file: LibraryFileItem) => void;
  onViewDetails: (file: LibraryFileItem) => void;
}

export function FileActionsModal({
  file,
  visible,
  onClose,
  onOpen,
  onRename,
  onMoveCopy,
  onViewDetails,
}: FileActionsModalProps) {
  const theme = useTheme();
  const {
    toggleFileFavorite,
    toggleFilePinned,
    toggleFileOffline,
    deleteLibraryFile,
  } = useOras();

  if (!file) return null;

  const typeColor = getFileTypeColor(file.fileType);
  const typeIcon = getFileTypeIcon(file.fileType);

  const handleDelete = () => {
    onClose();
    confirmAction(
      `Delete "${file.title}"?`,
      `Are you sure you want to permanently delete this material (${file.originalFileName}, ${formatBytes(file.fileSize)}) from ${file.subjectName}? This action cannot be undone.`,
      'Delete',
      async () => {
        await deleteLibraryFile(file.id);
      }
    );
  };

  const menuItems = [
    {
      id: 'open',
      label: file.fileType === 'pdf' ? 'Open in PDF Reader' : 'Open / Preview Material',
      icon: 'book-outline',
      color: typeColor,
      onPress: () => {
        onClose();
        onOpen(file);
      },
    },
    {
      id: 'pin',
      label: file.isPinned ? 'Unpin from Top' : 'Pin to Top of Subject',
      icon: file.isPinned ? 'pin' : 'pin-outline',
      color: '#F59E0B',
      onPress: async () => {
        await toggleFilePinned(file.id);
        onClose();
      },
    },
    {
      id: 'fav',
      label: file.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: file.isFavorite ? 'heart' : 'heart-outline',
      color: '#EC4899',
      onPress: async () => {
        await toggleFileFavorite(file.id);
        onClose();
      },
    },
    {
      id: 'offline',
      label: file.isOfflineAvailable ? 'Remove Offline Download' : 'Make Available Offline',
      icon: file.isOfflineAvailable ? 'cloud-done' : 'cloud-download-outline',
      color: '#10B981',
      onPress: async () => {
        await toggleFileOffline(file.id);
        onClose();
      },
    },
    {
      id: 'rename',
      label: 'Rename & Edit Notes',
      icon: 'pencil-outline',
      color: theme.navy,
      onPress: () => {
        onClose();
        onRename(file);
      },
    },
    {
      id: 'move',
      label: 'Move or Copy to Another Subject',
      icon: 'arrow-forward-circle-outline',
      color: theme.navy,
      onPress: () => {
        onClose();
        onMoveCopy(file);
      },
    },
    {
      id: 'share',
      label: 'Share or Download File',
      icon: 'share-social-outline',
      color: theme.navy,
      onPress: async () => {
        onClose();
        await shareOrDownloadFile(file);
      },
    },
    {
      id: 'details',
      label: 'View Academic Path & Details',
      icon: 'information-circle-outline',
      color: theme.navy,
      onPress: () => {
        onClose();
        onViewDetails(file);
      },
    },
    {
      id: 'delete',
      label: 'Delete Material',
      icon: 'trash-outline',
      color: '#EF4444',
      destructive: true,
      onPress: handleDelete,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: theme.isDark ? '#334155' : '#CBD5E1' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${typeColor}18` }]}>
              <Ionicons
                name={typeIcon as React.ComponentProps<typeof Ionicons>['name']}
                size={22}
                color={typeColor}
              />
            </View>

            <View style={styles.headerInfo}>
              <Text numberOfLines={1} style={[styles.title, { color: theme.navy }]}>
                {file.title}
              </Text>
              <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textMuted }]}>
                {file.subjectName} · {file.folderName} · {formatBytes(file.fileSize)}
              </Text>
            </View>

            <SmoothPressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={theme.navy} />
            </SmoothPressable>
          </View>

          {/* Menu Items */}
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <SmoothPressable
                key={item.id}
                onPress={item.onPress}
                style={[
                  styles.menuItem,
                  item.destructive && styles.destructiveItem,
                ]}
              >
                <View
                  style={[
                    styles.menuIconBox,
                    { backgroundColor: item.destructive ? '#FEE2E2' : theme.surface },
                  ]}
                >
                  <Ionicons
                    name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={17}
                    color={item.color}
                  />
                </View>
                <Text
                  style={[
                    styles.menuItemText,
                    { color: item.destructive ? '#EF4444' : theme.navy },
                  ]}
                >
                  {item.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={item.destructive ? '#EF4444' : theme.textMuted}
                />
              </SmoothPressable>
            ))}
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
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingBottom: 24,
    gap: 8,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
  },
  menuList: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
  },
  destructiveItem: {},
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
  },
});
