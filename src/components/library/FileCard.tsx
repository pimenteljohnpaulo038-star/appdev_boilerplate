import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DepthCard } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import type { LibraryFileItem } from '@/data/orasorasData';
import {
  formatBytes,
  getFileTypeColor,
  getFileTypeIcon,
} from '@/services/libraryStorage';
import { useTheme } from '@/theme';

interface FileCardProps {
  file: LibraryFileItem;
  subjectColor?: string;
  onOpen: (file: LibraryFileItem) => void;
  onToggleFavorite: (fileId: string) => void;
  onTogglePinned: (fileId: string) => void;
  onToggleOffline: (fileId: string) => void;
  onOptionsPress: (file: LibraryFileItem) => void;
}

export function FileCard({
  file,
  subjectColor,
  onOpen,
  onToggleFavorite,
  onTogglePinned,
  onToggleOffline,
  onOptionsPress,
}: FileCardProps) {
  const theme = useTheme();
  const typeColor = getFileTypeColor(file.fileType);
  const typeIcon = getFileTypeIcon(file.fileType);

  const formattedDate = new Date(file.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedLastOpened = file.lastOpenedAt
    ? new Date(file.lastOpenedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <DepthCard
      variant="card"
      style={[
        styles.card,
        {
          borderColor: file.isPinned ? `${typeColor}70` : theme.border,
          borderWidth: file.isPinned ? 1.5 : 1,
        },
      ]}
    >
      {/* Top Meta Row: left side opens file, right side has sibling action buttons */}
      <View style={styles.topRow}>
        <SmoothPressable
          onPress={() => onOpen(file)}
          style={styles.iconAndBadge}
          accessibilityLabel={`Open ${file.title}`}
          accessibilityRole="button"
        >
          <View style={[styles.typeIconBox, { backgroundColor: `${typeColor}18` }]}>
            <Ionicons
              name={typeIcon as React.ComponentProps<typeof Ionicons>['name']}
              size={22}
              color={typeColor}
            />
          </View>

          <View style={styles.typePills}>
            <View style={[styles.typePill, { backgroundColor: `${typeColor}20` }]}>
              <Text style={[styles.typePillText, { color: typeColor }]}>
                {file.fileType.toUpperCase()}
              </Text>
            </View>

            {file.isOfflineAvailable && (
              <View style={[styles.statusPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="cloud-done" size={11} color="#10B981" />
                <Text style={[styles.statusPillText, { color: '#10B981' }]}>
                  Offline Ready
                </Text>
              </View>
            )}

            {file.isPinned && (
              <View style={[styles.statusPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="pin" size={11} color="#F59E0B" />
                <Text style={[styles.statusPillText, { color: '#F59E0B' }]}>
                  Pinned
                </Text>
              </View>
            )}
          </View>
        </SmoothPressable>

        {/* Sibling Quick Pin, Favorite & Options Actions — NOT nested inside another button */}
        <View style={styles.topActions}>
          <SmoothPressable
            onPress={() => onTogglePinned(file.id)}
            style={styles.actionIconBtn}
            accessibilityLabel={file.isPinned ? 'Unpin file' : 'Pin file to top'}
            accessibilityRole="button"
          >
            <Ionicons
              name={file.isPinned ? 'pin' : 'pin-outline'}
              size={17}
              color={file.isPinned ? '#F59E0B' : theme.textMuted}
            />
          </SmoothPressable>

          <SmoothPressable
            onPress={() => onToggleFavorite(file.id)}
            style={styles.actionIconBtn}
            accessibilityLabel={file.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityRole="button"
          >
            <Ionicons
              name={file.isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={file.isFavorite ? '#EC4899' : theme.textMuted}
            />
          </SmoothPressable>

          <SmoothPressable
            onPress={() => onOptionsPress(file)}
            style={styles.actionIconBtn}
            accessibilityLabel="More options"
            accessibilityRole="button"
          >
            <Ionicons name="ellipsis-vertical" size={17} color={theme.navy} />
          </SmoothPressable>
        </View>
      </View>

      {/* Main File Body Pressable */}
      <SmoothPressable
        onPress={() => onOpen(file)}
        style={styles.cardMainPressable}
        accessibilityLabel={`Open ${file.title}`}
        accessibilityRole="button"
      >
        {/* Title & Original File Name */}
        <View style={styles.titleWrap}>
          <Text numberOfLines={2} style={[styles.fileTitle, { color: theme.navy }]}>
            {file.title}
          </Text>
          <Text numberOfLines={1} style={[styles.fileName, { color: theme.textMuted }]}>
            {file.originalFileName}
          </Text>
        </View>

        {/* Description snippet if present */}
        {Boolean(file.description) && (
          <Text numberOfLines={2} style={[styles.fileDescription, { color: theme.textSecondary }]}>
            {file.description}
          </Text>
        )}

        {/* Subject & Folder location pill */}
        <View style={styles.locationRow}>
          <View
            style={[
              styles.locationChip,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="school-outline"
              size={12}
              color={subjectColor || theme.navy}
            />
            <Text
              numberOfLines={1}
              style={[styles.locationChipText, { color: theme.navy }]}
            >
              {file.subjectName}
            </Text>
          </View>

          {file.folderName && (
            <View
              style={[
                styles.locationChip,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Ionicons name="folder-outline" size={12} color={theme.textMuted} />
              <Text
                numberOfLines={1}
                style={[styles.locationChipText, { color: theme.textSecondary }]}
              >
                {file.folderName}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {file.tags.slice(0, 3).map((tag, idx) => (
              <View
                key={idx}
                style={[styles.tagPill, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.tagPillText, { color: theme.textSecondary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {file.tags.length > 3 && (
              <Text style={[styles.tagMoreText, { color: theme.textMuted }]}>
                +{file.tags.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* Footer: Size, Date, Reading Progress */}
        <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
          <View style={styles.footerMetaLeft}>
            <Text style={[styles.footerMetaText, { color: theme.textMuted }]}>
              {formatBytes(file.fileSize)} · {formattedDate}
            </Text>
          </View>

          {file.fileType === 'pdf' && file.totalPages && (
            <View style={styles.progressPill}>
              <Ionicons name="book-outline" size={12} color={typeColor} />
              <Text style={[styles.progressPillText, { color: typeColor }]}>
                {file.lastReadPage ? `Pg ${file.lastReadPage}/${file.totalPages}` : `${file.totalPages} pgs`}
              </Text>
            </View>
          )}

          {formattedLastOpened && (
            <Text style={[styles.footerMetaText, { color: theme.textMuted }]}>
              Opened {formattedLastOpened}
            </Text>
          )}
        </View>
      </SmoothPressable>
    </DepthCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  cardMainPressable: {
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    gap: 2,
  },
  fileTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  fileName: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  fileDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  locationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 180,
  },
  locationChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tagMoreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    marginTop: 4,
  },
  footerMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
