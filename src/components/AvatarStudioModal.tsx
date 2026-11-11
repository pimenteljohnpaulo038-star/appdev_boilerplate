import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ACCESSORIES,
  FACE_SHAPES,
  HAIRSTYLES,
  HAIR_COLORS,
  OUTFITS,
  OUTFIT_COLORS,
  SKIN_TONES,
} from '@/components/AnimeAvatar';
import { UserAvatar } from '@/components/UserAvatar';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import type { CustomAvatarConfig } from '@/data/orasorasData';
import { useTheme } from '@/theme';

type StudioTab =
  | 'Character'
  | 'Face'
  | 'Skin'
  | 'Hair'
  | 'Hair Color'
  | 'Outfit'
  | 'Outfit Color'
  | 'Accessories';

const STUDIO_TABS: StudioTab[] = [
  'Character',
  'Face',
  'Skin',
  'Hair',
  'Hair Color',
  'Outfit',
  'Outfit Color',
  'Accessories',
];

const DEFAULT_STUDIO_CONFIG: CustomAvatarConfig = {
  character: 'boy',
  faceShape: 0,
  skinTone: 1,
  hairstyle: 0,
  hairColor: 0,
  outfit: 0,
  outfitColor: 0,
  accessory: 1,
};

export function AvatarStudioModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { account, activeTheme, saveCustomAvatar } = useOras();

  const [tab, setTab] = useState<StudioTab>('Character');
  const [draft, setDraft] = useState<CustomAvatarConfig>(account.customAvatar);

  const handleRandomize = () => {
    const rand = <T extends number>(max: number): T =>
      Math.floor(Math.random() * max) as T;
    setDraft({
      character: Math.random() > 0.5 ? 'girl' : 'boy',
      faceShape: rand<0 | 1 | 2>(3),
      skinTone: rand<0 | 1 | 2 | 3 | 4>(5),
      hairstyle: rand<0 | 1 | 2 | 3 | 4 | 5>(6),
      hairColor: rand<0 | 1 | 2 | 3 | 4 | 5>(6),
      outfit: rand<0 | 1 | 2 | 3 | 4>(5),
      outfitColor: rand<0 | 1 | 2 | 3 | 4 | 5>(6),
      accessory: rand<0 | 1 | 2 | 3>(4),
    });
  };

  const handleReset = () => {
    setDraft(DEFAULT_STUDIO_CONFIG);
  };

  const handleSave = async () => {
    await saveCustomAvatar(draft);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={() => setDraft(account.customAvatar)}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.title, { color: theme.navy }]}>
                Custom Avatar Studio
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Layered SVG anime scholar creator
              </Text>
            </View>

            <View style={styles.headerActions}>
              <SmoothPressable
                onPress={handleRandomize}
                style={[
                  styles.smallToolBtn,
                  { backgroundColor: `${activeTheme.primary}18` },
                ]}
              >
                <Ionicons
                  name="dice"
                  size={16}
                  color={activeTheme.primary}
                />
                <Text
                  style={[
                    styles.smallToolText,
                    { color: activeTheme.primary },
                  ]}
                >
                  Randomize
                </Text>
              </SmoothPressable>

              <SmoothPressable
                onPress={handleReset}
                style={[
                  styles.smallToolBtn,
                  { backgroundColor: theme.surface },
                ]}
              >
                <Ionicons
                  name="refresh"
                  size={15}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.smallToolText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Reset
                </Text>
              </SmoothPressable>
            </View>
          </View>

          {/* Large Live Preview */}
          <View
            style={[
              styles.previewStage,
              { backgroundColor: theme.surface },
            ]}
          >
            <UserAvatar
              config={draft}
              size={146}
            />
            <View style={styles.previewBadgesRow}>
              <View
                style={[
                  styles.previewChip,
                  { backgroundColor: theme.card },
                ]}
              >
                <Text style={[styles.previewChipText, { color: theme.navy }]}>
                  {draft.character === 'girl' ? 'Girl Scholar' : 'Boy Scholar'} ·{' '}
                  {HAIRSTYLES[draft.hairstyle]} · {OUTFITS[draft.outfit]}
                </Text>
              </View>
            </View>
          </View>

          {/* 8 Customization Category Tabs */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              {STUDIO_TABS.map((t) => {
                const active = tab === t;
                return (
                  <SmoothPressable
                    key={t}
                    onPress={() => setTab(t)}
                    style={[
                      styles.tabChip,
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
                        styles.tabChipText,
                        { color: active ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {t}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Visual Option Thumbnails Grid */}
          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsGrid}
            showsVerticalScrollIndicator={false}
          >
            {tab === 'Character' &&
              (['girl', 'boy'] as const).map((char) => {
                const selected = draft.character === char;
                const previewCfg = { ...draft, character: char };
                return (
                  <SmoothPressable
                    key={char}
                    onPress={() => setDraft(previewCfg)}
                    style={[
                      styles.optionThumbCard,
                      {
                        width: '47%',
                        backgroundColor: theme.card,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <UserAvatar
                      config={previewCfg}
                      size={64}
                    />
                    <Text
                      style={[styles.optionThumbTitle, { color: theme.navy }]}
                    >
                      {char === 'girl' ? 'Girl Character' : 'Boy Character'}
                    </Text>
                  </SmoothPressable>
                );
              })}

            {tab === 'Face' &&
              FACE_SHAPES.map((label, idx) => {
                const faceShape = idx as 0 | 1 | 2;
                const selected = draft.faceShape === faceShape;
                const previewCfg = { ...draft, faceShape };
                return (
                  <SmoothPressable
                    key={label}
                    onPress={() => setDraft(previewCfg)}
                    style={[
                      styles.optionThumbCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <UserAvatar
                      config={previewCfg}
                      size={56}
                    />
                    <Text
                      style={[styles.optionThumbTitle, { color: theme.navy }]}
                    >
                      {label}
                    </Text>
                  </SmoothPressable>
                );
              })}

            {tab === 'Skin' &&
              SKIN_TONES.map((hex, idx) => {
                const skinTone = idx as 0 | 1 | 2 | 3 | 4;
                const selected = draft.skinTone === skinTone;
                return (
                  <SmoothPressable
                    key={hex}
                    onPress={() => setDraft({ ...draft, skinTone })}
                    style={[
                      styles.optionThumbCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorSwatchCircle,
                        { backgroundColor: hex },
                      ]}
                    />
                    <Text
                      style={[styles.optionThumbTitle, { color: theme.navy }]}
                    >
                      Tone {idx + 1}
                    </Text>
                  </SmoothPressable>
                );
              })}

            {tab === 'Hair' &&
              HAIRSTYLES.map((styleName, idx) => {
                const hairstyle = idx as 0 | 1 | 2 | 3 | 4 | 5;
                const selected = draft.hairstyle === hairstyle;
                const previewCfg = { ...draft, hairstyle };
                return (
                  <SmoothPressable
                    key={styleName}
                    onPress={() => setDraft(previewCfg)}
                    style={[
                      styles.optionThumbCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <UserAvatar
                      config={previewCfg}
                      size={56}
                    />
                    <Text
                      style={[styles.optionThumbTitle, { color: theme.navy }]}
                    >
                      {styleName}
                    </Text>
                  </SmoothPressable>
                );
              })}

            {tab === 'Hair Color' &&
              HAIR_COLORS.map((hc, idx) => {
                const hairColor = idx as 0 | 1 | 2 | 3 | 4 | 5;
                const selected = draft.hairColor === hairColor;
                return (
                  <SmoothPressable
                    key={hc.name}
                    onPress={() => setDraft({ ...draft, hairColor })}
                    style={[
                      styles.optionThumbCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorSwatchCircle,
                        { backgroundColor: hc.main },
                      ]}
                    />
                    <Text
                      style={[styles.optionThumbTitle, { color: theme.navy }]}
                    >
                      {hc.name}
                    </Text>
                  </SmoothPressable>
                );
              })}

            {tab === 'Outfit' &&
              OUTFITS.map((outfitName, idx) => {
                const outfit = idx as 0 | 1 | 2 | 3 | 4;
                const selected = draft.outfit === outfit;
                const previewCfg = { ...draft, outfit };
                return (
                  <SmoothPressable
                    key={outfitName}
                    onPress={() => setDraft(previewCfg)}
                    style={[
                      styles.optionThumbCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <UserAvatar
                      config={previewCfg}
                      size={56}
                    />
                    <Text
                      style={[styles.optionThumbTitle, { color: theme.navy }]}
                    >
                      {outfitName}
                    </Text>
                  </SmoothPressable>
                );
              })}

            {tab === 'Outfit Color' &&
              OUTFIT_COLORS.map((oc, idx) => {
                const outfitColor = idx as 0 | 1 | 2 | 3 | 4 | 5;
                const selected = draft.outfitColor === outfitColor;
                return (
                  <SmoothPressable
                    key={oc.name}
                    onPress={() => setDraft({ ...draft, outfitColor })}
                    style={[
                      styles.optionThumbCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorSwatchCircle,
                        { backgroundColor: oc.main },
                      ]}
                    />
                    <Text
                      style={[styles.optionThumbTitle, { color: theme.navy }]}
                    >
                      {oc.name}
                    </Text>
                  </SmoothPressable>
                );
              })}

            {tab === 'Accessories' &&
              ACCESSORIES.map((accName, idx) => {
                const accessory = idx as 0 | 1 | 2 | 3;
                const selected = draft.accessory === accessory;
                const previewCfg = { ...draft, accessory };
                return (
                  <SmoothPressable
                    key={accName}
                    onPress={() => setDraft(previewCfg)}
                    style={[
                      styles.optionThumbCard,
                      {
                        width: '47%',
                        backgroundColor: theme.card,
                        borderColor: selected
                          ? activeTheme.primary
                          : theme.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <UserAvatar
                      config={previewCfg}
                      size={56}
                    />
                    <Text
                      style={[styles.optionThumbTitle, { color: theme.navy }]}
                    >
                      {accName}
                    </Text>
                  </SmoothPressable>
                );
              })}
          </ScrollView>

          {/* Footer: Cancel & Save Avatar */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <SmoothPressable
              onPress={onClose}
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
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Avatar</Text>
            </SmoothPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,15,36,0.62)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    height: '92%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 11.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
  },
  smallToolText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  previewStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  previewBadgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  previewChipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  tabsRow: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  optionsScroll: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 10,
  },
  optionThumbCard: {
    width: '30.5%',
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  optionThumbTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  colorSwatchCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  saveBtn: {
    flex: 1.4,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
