import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DepthCard } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type { LibraryFileItem } from '@/data/orasorasData';
import {
  computeStorageStats,
  formatBytes,
  getFileTypeColor,
  getFileTypeIcon,
} from '@/services/libraryStorage';
import { useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';

interface StorageManagementModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenFile?: (file: LibraryFileItem) => void;
}

const TOTAL_DEVICE_CAPACITY_BYTES = 1024 * 1024 * 1024; // 1 GB simulated offline allocation

export function StorageManagementModal({
  visible,
  onClose,
  onOpenFile,
}: StorageManagementModalProps) {
  const theme = useTheme();
  const { uploadedFiles, allSubjects, clearOfflineFilesCache, activeTheme } = useOras();

  const stats = useMemo(() => {
    return computeStorageStats(uploadedFiles, allSubjects);
  }, [uploadedFiles, allSubjects]);

  const usedPct = Math.min(
    100,
    Math.max(1, Math.round((stats.totalBytes / TOTAL_DEVICE_CAPACITY_BYTES) * 100))
  );

  const handleClearOffline = () => {
    confirmAction(
      'Clear Offline Downloads?',
      `This will remove ${stats.offlineFormatted} of cached offline files to free up device space. Your study notes, original files, and catalog will remain intact.`,
      'Clear Cache',
      async () => {
        await clearOfflineFilesCache();
        showMessage(
          'Offline Cache Cleared',
          'Offline files have been successfully cleared. You can re-download them anytime.'
        );
      }
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconBox,
                  { backgroundColor: `${activeTheme.primary}18` },
                ]}
              >
                <Ionicons name="pie-chart" size={20} color={activeTheme.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.navy }]}>
                  Library Storage Manager
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Offline cache, subject distribution & device health
                </Text>
              </View>
            </View>

            <SmoothPressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="close" size={18} color={theme.navy} />
            </SmoothPressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Storage Meter Card */}
            <DepthCard variant="card" style={styles.meterCard}>
              <View style={styles.meterTopRow}>
                <View>
                  <Text style={[styles.meterLabel, { color: theme.textMuted }]}>
                    LOCAL STORAGE USED
                  </Text>
                  <Text style={[styles.meterMainBytes, { color: theme.navy }]}>
                    {stats.totalFormatted}
                  </Text>
                </View>
                <View
                  style={[
                    styles.capacityPill,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <Ionicons name="hardware-chip" size={12} color={theme.navy} />
                  <Text style={[styles.capacityPillText, { color: theme.navy }]}>
                    {usedPct}% of 1.0 GB
                  </Text>
                </View>
              </View>

              {/* Segmented Colorful Progress Bar */}
              <View
                style={[
                  styles.segmentedTrack,
                  { backgroundColor: theme.surface },
                ]}
              >
                {stats.byType.map((t) => {
                  const pct = Math.max(
                    1,
                    Math.round((t.bytes / (stats.totalBytes || 1)) * 100)
                  );
                  return (
                    <View
                      key={t.type}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: t.color,
                        height: '100%',
                      }}
                    />
                  );
                })}
              </View>

              {/* Breakdown Legend */}
              <View style={styles.legendRow}>
                {stats.byType.map((t) => (
                  <View key={t.type} style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: t.color }]}
                    />
                    <Text
                      style={[styles.legendText, { color: theme.textSecondary }]}
                    >
                      {t.type.toUpperCase()}: {t.formatted} ({t.count})
                    </Text>
                  </View>
                ))}
              </View>
            </DepthCard>

            {/* Quick Metrics Grid */}
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="documents" size={20} color={activeTheme.primary} />
                <Text style={[styles.statNumber, { color: theme.navy }]}>
                  {stats.fileCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  Total Materials
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="cloud-done" size={20} color="#10B981" />
                <Text style={[styles.statNumber, { color: theme.navy }]}>
                  {stats.offlineFormatted}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  Available Offline
                </Text>
              </View>
            </View>

            {/* Storage Distribution by Subject */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
                STORAGE USED PER SUBJECT
              </Text>

              {stats.bySubject.map((s) => (
                <View
                  key={s.subjectId}
                  style={[
                    styles.subjectRow,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.subjectRowLeft}>
                    <View
                      style={[
                        styles.subjectDot,
                        { backgroundColor: s.color },
                      ]}
                    />
                    <View>
                      <Text
                        style={[styles.subjectRowName, { color: theme.navy }]}
                      >
                        {s.subjectName}
                      </Text>
                      <Text
                        style={[
                          styles.subjectRowCount,
                          { color: theme.textMuted },
                        ]}
                      >
                        {s.fileCount} {s.fileCount === 1 ? 'file' : 'files'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.subjectRowBytes, { color: theme.navy }]}>
                    {s.formatted}
                  </Text>
                </View>
              ))}
            </View>

            {/* Top Largest Files */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
                LARGEST STUDY MATERIALS
              </Text>

              {stats.largestFiles.map((file) => {
                const color = getFileTypeColor(file.fileType);
                const icon = getFileTypeIcon(file.fileType);

                return (
                  <SmoothPressable
                    key={file.id}
                    onPress={() => {
                      onClose();
                      onOpenFile?.(file);
                    }}
                    style={[
                      styles.largeFileCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.largeFileIcon,
                        { backgroundColor: `${color}18` },
                      ]}
                    >
                      <Ionicons
                        name={icon as React.ComponentProps<typeof Ionicons>['name']}
                        size={18}
                        color={color}
                      />
                    </View>

                    <View style={styles.largeFileInfo}>
                      <Text
                        numberOfLines={1}
                        style={[styles.largeFileTitle, { color: theme.navy }]}
                      >
                        {file.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.largeFileSub, { color: theme.textMuted }]}>
                        {file.subjectName} · {file.folderName}
                      </Text>
                    </View>

                    <Text style={[styles.largeFileSize, { color: color }]}>
                      {formatBytes(file.fileSize)}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>

            {/* Clear Offline Downloads Button */}
            <View style={styles.dangerZone}>
              <SmoothPressable
                onPress={handleClearOffline}
                style={[
                  styles.clearOfflineBtn,
                  { borderColor: 'rgba(239, 68, 68, 0.4)' },
                ]}
              >
                <Ionicons name="trash-bin-outline" size={16} color="#EF4444" />
                <Text style={styles.clearOfflineBtnText}>
                  Clear Offline Downloads ({stats.offlineFormatted})
                </Text>
              </SmoothPressable>
              <Text style={[styles.dangerNotice, { color: theme.textMuted }]}>
                Original study materials and catalog metadata will not be deleted.
              </Text>
            </View>
          </ScrollView>
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
  modalContainer: {
    maxHeight: '85%',
    minHeight: '55%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  meterCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  meterTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  meterLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  meterMainBytes: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  capacityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  capacityPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  segmentedTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  subjectRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subjectRowName: {
    fontSize: 13,
    fontWeight: '700',
  },
  subjectRowCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  subjectRowBytes: {
    fontSize: 13,
    fontWeight: '800',
  },
  largeFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  largeFileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeFileInfo: {
    flex: 1,
    gap: 2,
  },
  largeFileTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  largeFileSub: {
    fontSize: 11,
  },
  largeFileSize: {
    fontSize: 12,
    fontWeight: '800',
  },
  dangerZone: {
    gap: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  clearOfflineBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FEF2F2',
  },
  clearOfflineBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  dangerNotice: {
    fontSize: 11,
    textAlign: 'center',
  },
});
