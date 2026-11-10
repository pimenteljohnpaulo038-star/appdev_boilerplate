import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type DepthVariant = 'card' | 'color' | 'glass' | 'mini';

interface DepthCardProps {
  variant?: DepthVariant;
  accentColor?: string;
  gradientColors?: [string, string];
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Cohesive 3D Depth System supporting:
 * - .depth-card
 * - .depth-color
 * - .depth-glass
 * - .depth-mini
 */
export function DepthCard({
  variant = 'card',
  accentColor,
  gradientColors,
  style,
  children,
}: DepthCardProps) {
  const theme = useTheme();
  const className =
    variant === 'color'
      ? 'depth-color'
      : variant === 'glass'
      ? 'depth-glass'
      : variant === 'mini'
      ? 'depth-mini'
      : 'depth-card';

  const baseStyle: ViewStyle =
    variant === 'color'
      ? {
          backgroundColor: gradientColors?.[0] ?? accentColor ?? theme.primary,
          borderColor: 'rgba(255, 255, 255, 0.28)',
          shadowColor: gradientColors?.[0] ?? accentColor ?? theme.primary,
          ...Platform.select({
            web: gradientColors
              ? ({
                  backgroundImage: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
                } as unknown as ViewStyle)
              : undefined,
          }),
        }
      : variant === 'glass'
      ? {
          backgroundColor: theme.cardGlass,
          borderColor: theme.borderHighlight,
          shadowColor: theme.shadowColor,
          ...Platform.select({
            web: {
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
            } as unknown as ViewStyle,
          }),
        }
      : variant === 'mini'
      ? {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadowColor,
          borderRadius: 16,
          padding: 12,
        }
      : {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadowColor,
        };

  return (
    <View
      // @ts-ignore web className support
      className={className}
      style={[
        variant === 'mini' ? styles.mini : styles.card,
        baseStyle,
        style,
      ]}
    >
      {/* Subtle top inner specular highlight */}
      <View
        pointerEvents="none"
        style={[
          styles.innerHighlight,
          {
            backgroundColor:
              variant === 'color'
                ? 'rgba(255, 255, 255, 0.24)'
                : theme.isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
      />
      {children}
    </View>
  );
}

interface Icon3DProps {
  name: IconName;
  size?: number;
  color?: string;
  bg?: string;
  boxSize?: number;
  radius?: number;
}

/**
 * .icon-3d dimensional icon badge with layered inner highlight and ambient glow
 */
export function Icon3D({
  name,
  size = 20,
  color = '#FFFFFF',
  bg = '#3B82F6',
  boxSize = 42,
  radius = 14,
}: Icon3DProps) {
  return (
    <View
      // @ts-ignore web className support
      className="icon-3d"
      style={[
        styles.icon3d,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: radius,
          backgroundColor: bg,
          shadowColor: bg,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.iconGloss,
          { borderTopLeftRadius: radius, borderTopRightRadius: radius },
        ]}
      />
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 5,
  },
  mini: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1.5,
    borderRadius: 2,
  },
  icon3d: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  iconGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
});
