import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { AnimeAvatar } from '@/components/AnimeAvatar';
import { useOras } from '@/context/OrasContext';
import {
  ANIME_PRESET_AVATARS,
  type CustomAvatarConfig,
} from '@/data/orasorasData';

export interface UserAvatarProps {
  /** Explicit preset avatar ID (0..11). Defaults to current active student account's preset */
  avatarId?: number;
  /** Explicit avatar customization config. Defaults to current active student account's config */
  config?: CustomAvatarConfig;
  /** Avatar diameter in pixels. Defaults to 56 */
  size?: number;
  /** Custom wrapper style */
  style?: StyleProp<ViewStyle>;
  /** Optional solid background color */
  backgroundColor?: string;
  /** Optional custom gradient colors [startColor, endColor] */
  bgColors?: [string, string];
  /** Whether to render the circular border rim. Defaults to true */
  showBorder?: boolean;
  /** Color of the circular border rim. Defaults to crisp semi-translucent white */
  borderColor?: string;
}

/**
 * Centralized, shared UserAvatar component for the entire OrasOras application.
 *
 * Guarantees 100% visual and data consistency across:
 * - Home Dashboard header
 * - Profile screen hero card
 * - Settings & Account profile summary
 * - Built-in Anime Avatars selection grid
 * - Custom Avatar Studio live preview
 * - Bottom FloatingTabBar navigation
 * - Student Glance Summary modal
 * - Onboarding flow
 */
export function UserAvatar({
  avatarId,
  config,
  size = 56,
  style,
  backgroundColor,
  bgColors,
  showBorder = true,
  borderColor,
}: UserAvatarProps) {
  const { account, activeTheme } = useOras();

  // Determine active preset ID
  const activePresetId =
    avatarId !== undefined
      ? avatarId
      : account?.presetAvatarId !== undefined
      ? account.presetAvatarId
      : 0;

  const preset =
    ANIME_PRESET_AVATARS[activePresetId] ?? ANIME_PRESET_AVATARS[0];

  // Determine whether this instance should display a custom studio avatar or preset
  const isCustom =
    config !== undefined
      ? true
      : avatarId !== undefined
      ? false
      : Boolean(account?.useCustomAvatar);

  // Active configuration (customized vs preset)
  const resolvedConfig: CustomAvatarConfig =
    config ??
    (isCustom && account?.customAvatar
      ? account.customAvatar
      : preset.config);

  // Background gradient resolution:
  // 1. Explicit bgColors prop
  // 2. Explicit solid backgroundColor converted to gradient
  // 3. For custom avatars: current active theme gradient
  // 4. For preset anime avatars: preset's iconic canonical gradient
  const resolvedBgColors: [string, string] = bgColors
    ? bgColors
    : backgroundColor
    ? [backgroundColor, backgroundColor]
    : isCustom
    ? [activeTheme.primary, activeTheme.secondary]
    : preset.bgGradient;

  // Border color resolution
  const resolvedBorderColor =
    showBorder === false
      ? 'transparent'
      : borderColor ?? 'rgba(255, 255, 255, 0.85)';

  return (
    <View style={[styles.container, style]}>
      <AnimeAvatar
        config={resolvedConfig}
        presetId={activePresetId}
        size={size}
        bgColors={resolvedBgColors}
        borderColor={resolvedBorderColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
