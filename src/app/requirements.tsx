import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import {
  ACADEMIC_SUBJECTS,
  type ChecklistItem,
  type PriorityLevel,
  type RequirementItem,
  type TaskType,
} from '@/data/orasorasData';
import { useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';

type MainFilter = 'All' | 'Today' | 'Upcoming' | 'Completed' | 'Overdue';
const MAIN_FILTERS: MainFilter[] = [
  'All',
  'Today',
  'Upcoming',
  'Completed',
  'Overdue',
];
const PRIORITIES: PriorityLevel[] = ['Normal', 'Approaching', 'Urgent'];
const TASK_TYPES: TaskType[] = [
  'Assignment',
  'Project',
  'Activity',
  'Examination',
  'Quiz',
  'Reading',
  'Presentation',
  'Research',
];

export default function RequirementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();
  const {
    account,
    activeTheme,
    upsertRequirement,
    toggleRequirementComplete,
    toggleChecklistItem,
    deleteRequirement,
  } = useOras();

  const [mainFilter, setMainFilter] = useState<MainFilter>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Add / Edit Requirement Modal
  const [modalVisible, setModalVisible] = useState(() => params.action === 'new');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('math');
  const [dueDate, setDueDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<PriorityLevel>('Normal');
  const [taskType, setTaskType] = useState<TaskType>('Assignment');
  const [notes, setNotes] = useState('');
  const [attachmentsText, setAttachmentsText] = useState('Worksheet_Notes.pdf');
  const [checklistText, setChecklistText] = useState(
    'Draft outline\nComplete practice problems\nFinal review'
  );
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredList = useMemo(() => {
    return account.requirements.filter((r) => {
      const isOverdue = !r.completed && r.dueDate < todayStr;
      if (mainFilter === 'Today' && r.dueDate !== todayStr) return false;
      if (
        mainFilter === 'Upcoming' &&
        (r.completed || r.dueDate < todayStr)
      )
        return false;
      if (mainFilter === 'Completed' && !r.completed) return false;
      if (mainFilter === 'Overdue' && !isOverdue && r.priority !== 'Urgent')
        return false;

      if (subjectFilter !== 'all' && r.subjectId !== subjectFilter)
        return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter)
        return false;
      return true;
    });
  }, [
    account.requirements,
    mainFilter,
    subjectFilter,
    priorityFilter,
    todayStr,
  ]);

  const openNewReq = () => {
    setEditingId(null);
    setTitle('');
    setSubjectId('math');
    setDueDate(todayStr);
    setDueTime('17:00');
    setPriority('Approaching');
    setTaskType('Assignment');
    setNotes('');
    setAttachmentsText('Assignment_Brief.pdf');
    setChecklistText('Read instructions\nComplete core draft\nSubmit before deadline');
    setReminderEnabled(true);
    setModalVisible(true);
  };

  const openEditReq = (req: RequirementItem) => {
    setEditingId(req.id);
    setTitle(req.title);
    setSubjectId(req.subjectId);
    setDueDate(req.dueDate);
    setDueTime(req.dueTime);
    setPriority(req.priority);
    setTaskType(req.taskType);
    setNotes(req.notes);
    setAttachmentsText(req.attachments.join(', '));
    setChecklistText(req.checklist.map((c) => c.text).join('\n'));
    setReminderEnabled(req.reminderEnabled);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showMessage('Title Required', 'Please enter an assignment or requirement title.');
      return;
    }
    const subj =
      ACADEMIC_SUBJECTS.find((s) => s.id === subjectId) ??
      ACADEMIC_SUBJECTS[0];

    const checklist: ChecklistItem[] = checklistText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `ck-${Date.now()}-${idx}`,
        text,
        done: false,
      }));

    const attachments = attachmentsText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    await upsertRequirement({
      id: editingId ?? undefined,
      title: title.trim(),
      subjectId: subj.id,
      subjectName: subj.shortName,
      dueDate: dueDate.trim() || todayStr,
      dueTime: dueTime.trim() || '23:59',
      priority,
      taskType,
      notes: notes.trim(),
      attachments,
      checklist,
      completed: false,
      reminderEnabled,
    });

    setModalVisible(false);
    showMessage(
      editingId ? 'Requirement Updated' : 'Requirement Added',
      `${title.trim()} saved to your academic tracker.`
    );
  };

  const handleDelete = (req: RequirementItem) => {
    confirmAction(
      'Delete Requirement?',
      `Delete "${req.title}" from your requirements tracker?`,
      'Delete',
      () => void deleteRequirement(req.id)
    );
  };

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
              style={[
                styles.backBtn,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.navy} />
            </SmoothPressable>
            <View>
              <Text style={[styles.title, { color: theme.navy }]}>
                Tasks & Requirements
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Deadlines, checklists, attachments & reminders
              </Text>
            </View>
          </View>

          <SmoothPressable
            onPress={openNewReq}
            style={[
              styles.newBtn,
              { backgroundColor: activeTheme.primary },
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newBtnText}>New Task</Text>
          </SmoothPressable>
        </View>

        {/* Status Legend Bar (Blue, Emerald, Amber, Red) */}
        <DepthCard variant="mini" style={styles.legendBar}>
          <View style={styles.legendRow}>
            {[
              { label: 'Normal', color: '#3B82F6' },
              { label: 'Completed', color: '#10B981' },
              { label: 'Approaching', color: '#F59E0B' },
              { label: 'Urgent / Overdue', color: '#EF4444' },
            ].map((st) => (
              <View key={st.label} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: st.color }]}
                />
                <Text
                  style={[
                    styles.legendLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  {st.label}
                </Text>
              </View>
            ))}
          </View>
        </DepthCard>

        {/* Main Filter Chips: All | Today | Upcoming | Completed | Overdue */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {MAIN_FILTERS.map((f) => {
            const active = mainFilter === f;
            return (
              <SmoothPressable
                key={f}
                onPress={() => setMainFilter(f)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? activeTheme.primary
                      : theme.card,
                    borderColor: active
                      ? activeTheme.primary
                      : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {f}
                </Text>
              </SmoothPressable>
            );
          })}
        </ScrollView>

        {/* Secondary Filter: Subject & Priority */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <SmoothPressable
            onPress={() => setSubjectFilter('all')}
            style={[
              styles.subFilterChip,
              {
                backgroundColor:
                  subjectFilter === 'all' ? theme.navy : theme.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.subFilterText,
                {
                  color:
                    subjectFilter === 'all'
                      ? theme.background
                      : theme.textSecondary,
                },
              ]}
            >
              All Subjects
            </Text>
          </SmoothPressable>

          {ACADEMIC_SUBJECTS.map((subj) => {
            const active = subjectFilter === subj.id;
            return (
              <SmoothPressable
                key={subj.id}
                onPress={() => setSubjectFilter(subj.id)}
                style={[
                  styles.subFilterChip,
                  {
                    backgroundColor: active ? subj.color : theme.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {subj.shortName}
                </Text>
              </SmoothPressable>
            );
          })}

          {PRIORITIES.map((p) => {
            const active = priorityFilter === p;
            const pColor =
              p === 'Urgent'
                ? '#EF4444'
                : p === 'Approaching'
                ? '#F59E0B'
                : '#3B82F6';
            return (
              <SmoothPressable
                key={p}
                onPress={() =>
                  setPriorityFilter(active ? 'all' : p)
                }
                style={[
                  styles.subFilterChip,
                  {
                    backgroundColor: active ? pColor : theme.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    { color: active ? '#FFFFFF' : pColor },
                  ]}
                >
                  {p}
                </Text>
              </SmoothPressable>
            );
          })}
        </ScrollView>

        {/* Requirements List */}
        <View style={styles.listStack}>
          {filteredList.length === 0 ? (
            <DepthCard variant="card" style={styles.emptyCard}>
              <Icon3D
                name="checkmark-done-circle"
                bg="#10B981"
                boxSize={54}
                size={26}
              />
              <Text style={[styles.emptyTitle, { color: theme.navy }]}>
                No requirements match this filter
              </Text>
              <Text
                style={[styles.emptyDesc, { color: theme.textSecondary }]}
              >
                Tap “New Task” to add an assignment, project, lab report, or exam.
              </Text>
            </DepthCard>
          ) : (
            filteredList.map((req) => {
              const isOverdue = !req.completed && req.dueDate < todayStr;
              const statusColor = req.completed
                ? '#10B981'
                : isOverdue || req.priority === 'Urgent'
                ? '#EF4444'
                : req.priority === 'Approaching'
                ? '#F59E0B'
                : '#3B82F6';

              const statusText = req.completed
                ? 'COMPLETED'
                : isOverdue
                ? 'OVERDUE'
                : req.priority === 'Urgent'
                ? 'URGENT'
                : req.priority === 'Approaching'
                ? 'DUE SOON'
                : 'NORMAL';

              const doneSteps = req.checklist.filter((c) => c.done).length;

              return (
                <DepthCard
                  key={req.id}
                  variant="card"
                  style={[
                    styles.reqCard,
                    {
                      borderLeftWidth: 5,
                      borderLeftColor: statusColor,
                    },
                  ]}
                >
                  {/* Top Row: Subject, Task Type, Status Badge */}
                  <View style={styles.reqTopRow}>
                    <View style={styles.reqBadgesLeft}>
                      <View
                        style={[
                          styles.badgePill,
                          { backgroundColor: `${statusColor}18` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgePillText,
                            { color: statusColor },
                          ]}
                        >
                          {req.subjectName}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badgePill,
                          { backgroundColor: theme.surface },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgePillText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {req.taskType}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: `${statusColor}20` },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: statusColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: statusColor },
                        ]}
                      >
                        {statusText}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Checkbox */}
                  <View style={styles.titleRow}>
                    <SmoothPressable
                      onPress={() => void toggleRequirementComplete(req.id)}
                      style={[
                        styles.mainCheckbox,
                        {
                          borderColor: statusColor,
                          backgroundColor: req.completed
                            ? '#10B981'
                            : 'transparent',
                        },
                      ]}
                    >
                      {req.completed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </SmoothPressable>

                    <View style={styles.flex}>
                      <Text
                        style={[
                          styles.reqTitle,
                          {
                            color: theme.navy,
                            textDecorationLine: req.completed
                              ? 'line-through'
                              : 'none',
                          },
                        ]}
                      >
                        {req.title}
                      </Text>
                      <View style={styles.dueRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={statusColor}
                        />
                        <Text
                          style={[styles.dueText, { color: statusColor }]}
                        >
                          Due {req.dueDate === todayStr ? 'Today' : req.dueDate}{' '}
                          at {req.dueTime}
                        </Text>
                        {req.reminderEnabled && (
                          <Ionicons
                            name="notifications"
                            size={13}
                            color="#F59E0B"
                          />
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Notes */}
                  {req.notes.length > 0 && (
                    <Text
                      style={[
                        styles.notesText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {req.notes}
                    </Text>
                  )}

                  {/* Interactive Checklist */}
                  {req.checklist.length > 0 && (
                    <View
                      style={[
                        styles.checklistBox,
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <View style={styles.checklistHeader}>
                        <Text
                          style={[
                            styles.checklistTitle,
                            { color: theme.navy },
                          ]}
                        >
                          Checklist Progress
                        </Text>
                        <Text
                          style={[
                            styles.checklistCount,
                            { color: statusColor },
                          ]}
                        >
                          {doneSteps}/{req.checklist.length} completed
                        </Text>
                      </View>

                      {req.checklist.map((item) => (
                        <SmoothPressable
                          key={item.id}
                          onPress={() =>
                            void toggleChecklistItem(req.id, item.id)
                          }
                          style={styles.checklistItemRow}
                        >
                          <Ionicons
                            name={
                              item.done
                                ? 'checkmark-circle'
                                : 'ellipse-outline'
                            }
                            size={17}
                            color={
                              item.done ? '#10B981' : theme.textMuted
                            }
                          />
                          <Text
                            style={[
                              styles.checklistItemText,
                              {
                                color: theme.navy,
                                textDecorationLine: item.done
                                  ? 'line-through'
                                  : 'none',
                              },
                            ]}
                          >
                            {item.text}
                          </Text>
                        </SmoothPressable>
                      ))}
                    </View>
                  )}

                  {/* Attachments */}
                  {req.attachments.length > 0 && (
                    <View style={styles.attachRow}>
                      {req.attachments.map((att) => (
                        <View
                          key={att}
                          style={[
                            styles.attachChip,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name="attach"
                            size={14}
                            color={activeTheme.primary}
                          />
                          <Text
                            style={[
                              styles.attachText,
                              { color: theme.navy },
                            ]}
                          >
                            {att}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Bottom Actions */}
                  <View
                    style={[
                      styles.cardFooter,
                      { borderTopColor: theme.border },
                    ]}
                  >
                    <SmoothPressable
                      onPress={() => void toggleRequirementComplete(req.id)}
                      style={[
                        styles.footerBtn,
                        {
                          backgroundColor: req.completed
                            ? theme.surface
                            : 'rgba(16,185,129,0.14)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          req.completed
                            ? 'refresh-outline'
                            : 'checkmark-done'
                        }
                        size={15}
                        color="#10B981"
                      />
                      <Text
                        style={[
                          styles.footerBtnText,
                          { color: '#10B981' },
                        ]}
                      >
                        {req.completed ? 'Reopen' : 'Mark Complete'}
                      </Text>
                    </SmoothPressable>

                    <SmoothPressable
                      onPress={() => openEditReq(req)}
                      style={[
                        styles.footerBtn,
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={15}
                        color={theme.navy}
                      />
                      <Text
                        style={[
                          styles.footerBtnText,
                          { color: theme.navy },
                        ]}
                      >
                        Edit
                      </Text>
                    </SmoothPressable>

                    <SmoothPressable
                      onPress={() => handleDelete(req)}
                      style={[
                        styles.footerBtn,
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
            })
          )}
        </View>
      </ScrollView>

      {/* Add / Edit Requirement Modal */}
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
                {editingId ? 'Edit Requirement' : 'New Academic Requirement'}
              </Text>
              <SmoothPressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.navy} />
              </SmoothPressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  ASSIGNMENT TITLE *
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Calculus Problem Set #5"
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
                  SUBJECT
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
                        onPress={() => setSubjectId(s.id)}
                        style={[
                          styles.choiceChip,
                          {
                            backgroundColor: selected
                              ? s.color
                              : theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            { color: selected ? '#FFFFFF' : theme.navy },
                          ]}
                        >
                          {s.shortName}
                        </Text>
                      </SmoothPressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.row2}>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                    DUE DATE (YYYY-MM-DD)
                  </Text>
                  <TextInput
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="2026-11-06"
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
                    DUE TIME
                  </Text>
                  <TextInput
                    value={dueTime}
                    onChangeText={setDueTime}
                    placeholder="17:00"
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
                  PRIORITY STATUS
                </Text>
                <View style={styles.wrapRow}>
                  {PRIORITIES.map((p) => {
                    const selected = priority === p;
                    const pColor =
                      p === 'Urgent'
                        ? '#EF4444'
                        : p === 'Approaching'
                        ? '#F59E0B'
                        : '#3B82F6';
                    return (
                      <SmoothPressable
                        key={p}
                        onPress={() => setPriority(p)}
                        style={[
                          styles.choiceChip,
                          {
                            backgroundColor: selected
                              ? pColor
                              : theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            { color: selected ? '#FFFFFF' : pColor },
                          ]}
                        >
                          {p}
                        </Text>
                      </SmoothPressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  TASK TYPE
                </Text>
                <View style={styles.wrapRow}>
                  {TASK_TYPES.map((t) => {
                    const selected = taskType === t;
                    return (
                      <SmoothPressable
                        key={t}
                        onPress={() => setTaskType(t)}
                        style={[
                          styles.choiceChip,
                          {
                            backgroundColor: selected
                              ? activeTheme.primary
                              : theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            { color: selected ? '#FFFFFF' : theme.navy },
                          ]}
                        >
                          {t}
                        </Text>
                      </SmoothPressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  NOTES & INSTRUCTIONS
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Add rubric notes or submission guidelines..."
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      minHeight: 60,
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.navy,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  CHECKLIST STEPS (ONE PER LINE)
                </Text>
                <TextInput
                  value={checklistText}
                  onChangeText={setChecklistText}
                  multiline
                  placeholder="Step 1&#10;Step 2"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      minHeight: 68,
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.navy,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  ATTACHMENTS (COMMA SEPARATED)
                </Text>
                <TextInput
                  value={attachmentsText}
                  onChangeText={setAttachmentsText}
                  placeholder="Worksheet.pdf, Lab_Data.xlsx"
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

              <View style={styles.reminderSwitchRow}>
                <Text style={[styles.fieldLabel, { color: theme.navy }]}>
                  ENABLE DEADLINE REMINDER ALERT
                </Text>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: '#CBD5E1', true: activeTheme.primary }}
                />
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
                onPress={() => void handleSave()}
                style={[
                  styles.saveBtn,
                  { backgroundColor: activeTheme.primary },
                ]}
              >
                <Text style={styles.saveBtnText}>Save Requirement</Text>
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
    gap: 14,
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
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  legendBar: {
    paddingVertical: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
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
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  subFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  listStack: {
    gap: 12,
  },
  reqCard: {
    gap: 11,
    padding: 16,
  },
  reqTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  reqBadgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mainCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  reqTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '800',
  },
  notesText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  checklistBox: {
    padding: 12,
    borderRadius: 14,
    gap: 7,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  checklistTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  checklistCount: {
    fontSize: 11,
    fontWeight: '800',
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  checklistItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  attachRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },
  attachText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  footerBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
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
    maxHeight: '90%',
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
    fontSize: 13.5,
    fontWeight: '600',
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  reminderSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
