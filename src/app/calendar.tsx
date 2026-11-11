import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import {
  ACADEMIC_SUBJECTS,
  type ClassScheduleItem,
} from '@/data/orasorasData';
import { useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';

type ViewMode = 'Daily' | 'Weekly' | 'Calendar';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const REPEATING_OPTIONS: ClassScheduleItem['repeating'][] = [
  'MWF',
  'TTh',
  'Daily',
  'Weekly',
  'Once',
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

export default function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();
  const {
    account,
    activeTheme,
    upsertScheduleItem,
    toggleCancelSchedule,
    deleteScheduleItem,
  } = useOras();

  const [viewMode, setViewMode] = useState<ViewMode>('Daily');
  const [selectedDow, setSelectedDow] = useState(() => new Date().getDay());
  const [selectedMonthDay, setSelectedMonthDay] = useState(() =>
    new Date().getDate()
  );

  // Add / Edit Class Modal State
  const [modalVisible, setModalVisible] = useState(() => params.action === 'new');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState('math');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(selectedDow);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [roomOrLink, setRoomOrLink] = useState('Room 304 · Science Wing');
  const [instructor, setInstructor] = useState('Prof. Elena Vance');
  const [repeating, setRepeating] =
    useState<ClassScheduleItem['repeating']>('MWF');
  const [reminderMinutes, setReminderMinutes] = useState('15');

  // Hardware back button support for Android
  useEffect(() => {
    const onBackPress = () => {
      if (modalVisible) {
        setModalVisible(false);
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/(tabs)' as Href);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [modalVisible, router]);

  const dayClasses = useMemo(() => {
    return account.schedule
      .filter((cls) => {
        if (cls.dayOfWeek === selectedDow) return true;
        if (cls.repeating === 'Daily') return true;
        if (
          cls.repeating === 'MWF' &&
          [1, 3, 5].includes(selectedDow)
        )
          return true;
        if (cls.repeating === 'TTh' && [2, 4].includes(selectedDow))
          return true;
        return false;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [account.schedule, selectedDow]);

  // Conflict Detection: identify overlapping classes on the selected day
  const conflictIds = useMemo(() => {
    const set = new Set<string>();
    const active = dayClasses.filter((c) => !c.cancelled);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const aStart = timeToMinutes(active[i].startTime);
        const aEnd = timeToMinutes(active[i].endTime);
        const bStart = timeToMinutes(active[j].startTime);
        const bEnd = timeToMinutes(active[j].endTime);
        if (aStart < bEnd && bStart < aEnd) {
          set.add(active[i].id);
          set.add(active[j].id);
        }
      }
    }
    return set;
  }, [dayClasses]);

  const openAddClass = () => {
    const subj = ACADEMIC_SUBJECTS[0];
    setEditingId(null);
    setSubjectId(subj.id);
    setCustomSubjectName(subj.name);
    setDayOfWeek(selectedDow);
    setStartTime('10:00');
    setEndTime('11:30');
    setRoomOrLink(subj.room);
    setInstructor(subj.instructor);
    setRepeating('MWF');
    setReminderMinutes('15');
    setModalVisible(true);
  };

  const openEditClass = (cls: ClassScheduleItem) => {
    setEditingId(cls.id);
    setSubjectId(cls.subjectId);
    setCustomSubjectName(cls.subjectName);
    setDayOfWeek(cls.dayOfWeek);
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setRoomOrLink(cls.roomOrLink);
    setInstructor(cls.instructor);
    setRepeating(cls.repeating);
    setReminderMinutes(String(cls.reminderMinutes || 15));
    setModalVisible(true);
  };

  const handleSaveClass = async () => {
    const subj =
      ACADEMIC_SUBJECTS.find((s) => s.id === subjectId) ??
      ACADEMIC_SUBJECTS[0];
    const finalName = customSubjectName.trim() || subj.name;
    await upsertScheduleItem({
      id: editingId ?? undefined,
      subjectId: subj.id,
      subjectName: finalName,
      color: subj.color,
      dayOfWeek,
      startTime: startTime.trim() || '09:00',
      endTime: endTime.trim() || '10:30',
      roomOrLink: roomOrLink.trim() || subj.room,
      instructor: instructor.trim() || subj.instructor,
      repeating,
      reminderMinutes: parseInt(reminderMinutes, 10) || 15,
    });
    setModalVisible(false);
    showMessage(
      editingId ? 'Class Updated' : 'Class Added',
      `${finalName} scheduled for ${startTime}–${endTime}.`
    );
  };

  const handleDeleteClass = (cls: ClassScheduleItem) => {
    confirmAction(
      'Remove Class?',
      `Remove ${cls.subjectName} (${cls.startTime}–${cls.endTime}) from your timetable?`,
      'Remove',
      () => void deleteScheduleItem(cls.id)
    );
  };

  const nextActiveClass =
    dayClasses.find((c) => !c.cancelled) ?? account.schedule[0];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <SmoothPressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)');
              }}
              style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.navy} />
            </SmoothPressable>
            <View>
              <Text style={[styles.title, { color: theme.navy }]}>
                Smart Schedule
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Classes, rooms, conflict radar & reminders
              </Text>
            </View>
          </View>

          <SmoothPressable
            onPress={openAddClass}
            style={[
              styles.addClassBtn,
              { backgroundColor: activeTheme.primary },
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addClassBtnText}>Add Class</Text>
          </SmoothPressable>
        </View>

        {/* Next Class Countdown Hero Banner */}
        <DepthCard
          variant="color"
          gradientColors={[activeTheme.primary, activeTheme.secondary]}
          style={styles.countdownHero}
        >
          <View style={styles.countdownTop}>
            <View style={styles.liveTag}>
              <Ionicons name="time" size={13} color="#FFFFFF" />
              <Text style={styles.liveTagText}>
                NEXT CLASS COUNTDOWN · IN 25 MINUTES
              </Text>
            </View>
            <View style={styles.reminderTag}>
              <Ionicons name="notifications" size={12} color="#FCD34D" />
              <Text style={styles.reminderTagText}>
                {nextActiveClass?.reminderMinutes || 15}m Alert Active
              </Text>
            </View>
          </View>

          <Text style={styles.countdownSubject}>
            {nextActiveClass?.subjectName || 'Mathematics & Calculus'}
          </Text>
          <Text style={styles.countdownDetails}>
            {nextActiveClass
              ? `${nextActiveClass.startTime} – ${nextActiveClass.endTime} · ${nextActiveClass.roomOrLink} · ${nextActiveClass.instructor}`
              : '09:00 – 10:30 · Room 304 · Prof. Elena Vance'}
          </Text>
        </DepthCard>

        {/* View Mode Switcher: Daily | Weekly | Calendar */}
        <View
          style={[
            styles.modeSegment,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {(['Daily', 'Weekly', 'Calendar'] as ViewMode[]).map((m) => {
            const active = viewMode === m;
            return (
              <SmoothPressable
                key={m}
                onPress={() => setViewMode(m)}
                style={[
                  styles.modeBtn,
                  active && { backgroundColor: activeTheme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {m} View
                </Text>
              </SmoothPressable>
            );
          })}
        </View>

        {/* Conflict Detection Banner */}
        {conflictIds.size > 0 && (
          <DepthCard
            variant="mini"
            style={[
              styles.conflictBanner,
              {
                backgroundColor: theme.redLight,
                borderColor: theme.red,
              },
            ]}
          >
            <View style={styles.conflictRow}>
              <Icon3D name="warning" bg="#EF4444" boxSize={36} size={18} />
              <View style={styles.flex}>
                <Text style={[styles.conflictTitle, { color: theme.red }]}>
                  Schedule Conflict Detected
                </Text>
                <Text
                  style={[
                    styles.conflictDesc,
                    { color: theme.textSecondary },
                  ]}
                >
                  {conflictIds.size} classes overlap on{' '}
                  {DAYS_SHORT[selectedDow]}. Adjust times or mark one cancelled.
                </Text>
              </View>
            </View>
          </DepthCard>
        )}

        {/* Day Selector Strip (for Daily & Weekly views) */}
        {viewMode !== 'Calendar' ? (
          <View style={styles.dayStripRow}>
            {DAYS_SHORT.map((dayName, idx) => {
              const selected = selectedDow === idx;
              const isToday = new Date().getDay() === idx;
              return (
                <SmoothPressable
                  key={dayName}
                  onPress={() => setSelectedDow(idx)}
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: selected
                        ? activeTheme.primary
                        : theme.card,
                      borderColor: selected
                        ? activeTheme.primary
                        : isToday
                        ? activeTheme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      {
                        color: selected ? '#FFFFFF' : theme.navy,
                      },
                    ]}
                  >
                    {dayName}
                  </Text>
                  {isToday && (
                    <View
                      style={[
                        styles.todayDot,
                        {
                          backgroundColor: selected
                            ? '#FFFFFF'
                            : activeTheme.primary,
                        },
                      ]}
                    />
                  )}
                </SmoothPressable>
              );
            })}
          </View>
        ) : (
          /* Monthly Calendar Grid View */
          <DepthCard variant="card" style={styles.monthGridCard}>
            <View style={styles.monthHeaderRow}>
              <Text style={[styles.monthTitle, { color: theme.navy }]}>
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Text style={[styles.monthSub, { color: theme.textMuted }]}>
                Tap any date to inspect classes
              </Text>
            </View>
            <View style={styles.calendarDaysGrid}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
                const selected = selectedMonthDay === dayNum;
                const hasClass = dayNum % 7 !== 0;
                return (
                  <SmoothPressable
                    key={dayNum}
                    onPress={() => {
                      setSelectedMonthDay(dayNum);
                      setSelectedDow(dayNum % 7);
                    }}
                    style={[
                      styles.calCell,
                      {
                        backgroundColor: selected
                          ? activeTheme.primary
                          : theme.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calCellText,
                        { color: selected ? '#FFFFFF' : theme.navy },
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {hasClass && (
                      <View
                        style={[
                          styles.calCellDot,
                          {
                            backgroundColor: selected
                              ? '#FFFFFF'
                              : '#10B981',
                          },
                        ]}
                      />
                    )}
                  </SmoothPressable>
                );
              })}
            </View>
          </DepthCard>
        )}

        {/* Weekly Matrix Overview when Weekly View is active */}
        {viewMode === 'Weekly' && (
          <DepthCard variant="mini" style={styles.weeklySummaryCard}>
            <Text style={[styles.weeklySummaryTitle, { color: theme.navy }]}>
              Weekly Recurring Matrix
            </Text>
            <View style={styles.weeklyBadgesWrap}>
              {ACADEMIC_SUBJECTS.map((subj) => (
                <View
                  key={subj.id}
                  style={[
                    styles.subjectLegendChip,
                    { backgroundColor: `${subj.color}16` },
                  ]}
                >
                  <View
                    style={[
                      styles.subjectLegendDot,
                      { backgroundColor: subj.color },
                    ]}
                  />
                  <Text
                    style={[styles.subjectLegendText, { color: subj.color }]}
                  >
                    {subj.shortName}
                  </Text>
                </View>
              ))}
            </View>
          </DepthCard>
        )}

        {/* Classes List for Selected Day */}
        <View style={styles.classListBlock}>
          <View style={styles.listHeaderRow}>
            <Text style={[styles.listTitle, { color: theme.navy }]}>
              {DAYS_SHORT[selectedDow]} Classes ({dayClasses.length})
            </Text>
            <SmoothPressable
              onPress={() => router.push('/requirements' as Href)}
            >
              <Text
                style={[styles.linkText, { color: activeTheme.primary }]}
              >
                View Requirements →
              </Text>
            </SmoothPressable>
          </View>

          {dayClasses.map((cls) => {
            const hasConflict = conflictIds.has(cls.id);
            return (
              <DepthCard
                key={cls.id}
                variant="card"
                style={[
                  styles.classCard,
                  {
                    borderLeftWidth: 5,
                    borderLeftColor: cls.cancelled
                      ? theme.textMuted
                      : hasConflict
                      ? '#EF4444'
                      : cls.color,
                  },
                ]}
              >
                <View style={styles.classTopRow}>
                  <View style={styles.timePillRow}>
                    <View
                      style={[
                        styles.timeBadge,
                        { backgroundColor: `${cls.color}18` },
                      ]}
                    >
                      <Ionicons name="time" size={13} color={cls.color} />
                      <Text
                        style={[styles.timeBadgeText, { color: cls.color }]}
                      >
                        {cls.startTime} – {cls.endTime}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.repeatBadge,
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <Text
                        style={[
                          styles.repeatBadgeText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {cls.repeating}
                      </Text>
                    </View>

                    {cls.cancelled && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: 'rgba(239,68,68,0.16)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: '#EF4444' },
                          ]}
                        >
                          CANCELLED
                        </Text>
                      </View>
                    )}

                    {hasConflict && !cls.cancelled && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: 'rgba(239,68,68,0.16)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: '#EF4444' },
                          ]}
                        >
                          TIME CONFLICT
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text
                  style={[
                    styles.classSubjectTitle,
                    {
                      color: theme.navy,
                      textDecorationLine: cls.cancelled
                        ? 'line-through'
                        : 'none',
                    },
                  ]}
                >
                  {cls.subjectName}
                </Text>

                <View style={styles.classMetaGrid}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.metaItemText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {cls.roomOrLink}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons
                      name="person-outline"
                      size={15}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.metaItemText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {cls.instructor}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons
                      name="notifications-outline"
                      size={15}
                      color={cls.color}
                    />
                    <Text
                      style={[styles.metaItemText, { color: cls.color }]}
                    >
                      Reminder {cls.reminderMinutes} mins before class
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.classActionsRow,
                    { borderTopColor: theme.border },
                  ]}
                >
                  <SmoothPressable
                    onPress={() => void toggleCancelSchedule(cls.id)}
                    style={[
                      styles.classActionBtn,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <Ionicons
                      name={
                        cls.cancelled
                          ? 'refresh-outline'
                          : 'close-circle-outline'
                      }
                      size={15}
                      color={cls.cancelled ? '#10B981' : '#F59E0B'}
                    />
                    <Text
                      style={[
                        styles.classActionText,
                        { color: cls.cancelled ? '#10B981' : '#D97706' },
                      ]}
                    >
                      {cls.cancelled ? 'Restore Class' : 'Mark Cancelled'}
                    </Text>
                  </SmoothPressable>

                  <SmoothPressable
                    onPress={() => openEditClass(cls)}
                    style={[
                      styles.classActionBtn,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <Ionicons
                      name="create-outline"
                      size={15}
                      color={theme.navy}
                    />
                    <Text
                      style={[styles.classActionText, { color: theme.navy }]}
                    >
                      Edit
                    </Text>
                  </SmoothPressable>

                  <SmoothPressable
                    onPress={() => handleDeleteClass(cls)}
                    style={[
                      styles.classActionBtn,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={15}
                      color={theme.red}
                    />
                  </SmoothPressable>
                </View>
              </DepthCard>
            );
          })}
        </View>
      </ScrollView>

      {/* Add / Edit Class Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.navy }]}>
                {editingId ? 'Edit Class Schedule' : 'Add New Class'}
              </Text>
              <SmoothPressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.navy} />
              </SmoothPressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                SUBJECT COLOR & PRESET
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {ACADEMIC_SUBJECTS.map((s) => {
                  const selected = subjectId === s.id;
                  return (
                    <SmoothPressable
                      key={s.id}
                      onPress={() => {
                        setSubjectId(s.id);
                        setCustomSubjectName(s.name);
                        setRoomOrLink(s.room);
                        setInstructor(s.instructor);
                      }}
                      style={[
                        styles.subjChip,
                        {
                          backgroundColor: selected ? s.color : theme.surface,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subjChipText,
                          { color: selected ? '#FFFFFF' : theme.navy },
                        ]}
                      >
                        {s.shortName}
                      </Text>
                    </SmoothPressable>
                  );
                })}
              </ScrollView>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  CLASS TITLE
                </Text>
                <TextInput
                  value={customSubjectName}
                  onChangeText={setCustomSubjectName}
                  placeholder="Subject or Course Name"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.navy,
                    },
                  ]}
                />
              </View>

              <View style={styles.row2}>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                    START TIME (24H)
                  </Text>
                  <TextInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="09:00"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.navy,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                    END TIME (24H)
                  </Text>
                  <TextInput
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="10:30"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.navy,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  CLASSROOM OR ONLINE LINK
                </Text>
                <TextInput
                  value={roomOrLink}
                  onChangeText={setRoomOrLink}
                  placeholder="Room 304 or Zoom/Meet URL"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.navy,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  TEACHER OR INSTRUCTOR
                </Text>
                <TextInput
                  value={instructor}
                  onChangeText={setInstructor}
                  placeholder="Prof. Elena Vance"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.navy,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  REPEATING SCHEDULE
                </Text>
                <View style={styles.repeatRow}>
                  {REPEATING_OPTIONS.map((rep) => {
                    const selected = repeating === rep;
                    return (
                      <SmoothPressable
                        key={rep}
                        onPress={() => setRepeating(rep)}
                        style={[
                          styles.repChip,
                          {
                            backgroundColor: selected
                              ? activeTheme.primary
                              : theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.repChipText,
                            { color: selected ? '#FFFFFF' : theme.navy },
                          ]}
                        >
                          {rep}
                        </Text>
                      </SmoothPressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <SmoothPressable
                onPress={() => setModalVisible(false)}
                style={[styles.cancelBtn, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.navy }]}>
                  Cancel
                </Text>
              </SmoothPressable>
              <SmoothPressable
                onPress={() => void handleSaveClass()}
                style={[
                  styles.saveBtn,
                  { backgroundColor: activeTheme.primary },
                ]}
              >
                <Text style={styles.saveBtnText}>Save Class</Text>
              </SmoothPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
  },
  addClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  addClassBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  countdownHero: {
    padding: 18,
    gap: 8,
  },
  countdownTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  reminderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,23,42,0.25)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reminderTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  countdownSubject: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  countdownDetails: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12.5,
    fontWeight: '600',
  },
  modeSegment: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  conflictBanner: {
    borderWidth: 1.5,
  },
  conflictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conflictTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  conflictDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  dayStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  monthGridCard: {
    gap: 12,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  monthSub: {
    fontSize: 11.5,
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calCell: {
    width: '12.5%',
    flexGrow: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  calCellText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  calCellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  weeklySummaryCard: {
    gap: 8,
  },
  weeklySummaryTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  weeklyBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectLegendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  subjectLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectLegendText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  classListBlock: {
    gap: 12,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  linkText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  classCard: {
    gap: 10,
    padding: 16,
  },
  classTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  repeatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  repeatBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  classSubjectTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  classMetaGrid: {
    gap: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  metaItemText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  classActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  classActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  classActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,15,36,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  subjChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  subjChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  repeatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  repChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
