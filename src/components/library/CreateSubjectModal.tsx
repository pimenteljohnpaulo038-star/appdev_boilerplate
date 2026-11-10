import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type { StudentLevel } from '@/data/orasorasData';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';

interface CreateSubjectModalProps {
  visible: boolean;
  onClose: () => void;
}

const PALETTE = [
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#14B8A6',
  '#EA580C',
];

const ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'book',
  'calculator',
  'flask',
  'globe',
  'hardware-chip',
  'search-circle',
  'color-filter',
  'fitness',
  'language',
  'planet',
  'library',
  'bulb',
];

export function CreateSubjectModal({ visible, onClose }: CreateSubjectModalProps) {
  const theme = useTheme();
  const { createCustomSubject, account } = useOras();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState<React.ComponentProps<typeof Ionicons>['name']>(ICONS[0]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const short = shortName.trim() || trimmed;

    await createCustomSubject({
      name: trimmed,
      shortName: short,
      gradeLevels: [account.level as StudentLevel],
      color: selectedColor,
      secondaryColor: selectedColor,
      lightBg: `${selectedColor}14`,
      icon: selectedIcon,
    });

    showMessage('Subject Created', `Custom subject "${short}" has been added to your academic library.`);
    setName('');
    setShortName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.navy }]}>Add Custom Subject</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Create a personalized subject library
              </Text>
            </View>
            <SmoothPressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={theme.navy} />
            </SmoothPressable>
          </View>

          <View style={styles.inputWrap}>
            <Text style={[styles.label, { color: theme.textMuted }]}>FULL SUBJECT NAME</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (!shortName) setShortName(t.slice(0, 16));
              }}
              placeholder="e.g. Organic Chemistry, Robotics..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                { backgroundColor: theme.surface, color: theme.navy, borderColor: theme.border },
              ]}
              autoFocus
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={[styles.label, { color: theme.textMuted }]}>SHORT DISPLAY NAME</Text>
            <TextInput
              value={shortName}
              onChangeText={setShortName}
              placeholder="e.g. OrgChem, Robotics..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                { backgroundColor: theme.surface, color: theme.navy, borderColor: theme.border },
              ]}
            />
          </View>

          {/* Color Picker */}
          <View style={styles.inputWrap}>
            <Text style={[styles.label, { color: theme.textMuted }]}>SUBJECT COLOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowPills}>
              {PALETTE.map((c) => (
                <SmoothPressable
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorCircleActive,
                  ]}
                />
              ))}
            </ScrollView>
          </View>

          {/* Icon Picker */}
          <View style={styles.inputWrap}>
            <Text style={[styles.label, { color: theme.textMuted }]}>SUBJECT ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowPills}>
              {ICONS.map((ic) => {
                const active = selectedIcon === ic;
                return (
                  <SmoothPressable
                    key={ic}
                    onPress={() => setSelectedIcon(ic)}
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: active ? `${selectedColor}22` : theme.surface,
                        borderColor: active ? selectedColor : theme.border,
                      },
                    ]}
                  >
                    <Ionicons name={ic} size={18} color={active ? selectedColor : theme.navy} />
                  </SmoothPressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.actionsRow}>
            <SmoothPressable onPress={onClose} style={[styles.cancelBtn, { borderColor: theme.border }]}>
              <Text style={[styles.cancelBtnText, { color: theme.navy }]}>Cancel</Text>
            </SmoothPressable>

            <SmoothPressable
              onPress={handleCreate}
              disabled={!name.trim()}
              style={[
                styles.confirmBtn,
                { backgroundColor: name.trim() ? selectedColor : theme.border },
              ]}
            >
              <Text style={styles.confirmBtnText}>Add Subject</Text>
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
    gap: 14,
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
  },
  closeBtn: {
    padding: 6,
  },
  inputWrap: {
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
  rowPills: {
    gap: 8,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
