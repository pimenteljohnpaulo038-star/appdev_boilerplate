import { useContext, useMemo } from 'react';
import { useSettings } from '@/settings/SettingsContext';
import { OrasContext } from '@/context/OrasContext';
import { COLOR_THEMES } from '@/data/orasorasData';

export interface Theme {
  isDark: boolean;
  background: string;
  backgroundAlt: string;
  card: string;
  cardGlass: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  navy: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHighlight: string;
  tint: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  glow: string;
  indigo: string;
  indigoLight: string;
  emerald: string;
  emeraldLight: string;
  amber: string;
  amberLight: string;
  red: string;
  redLight: string;
  accentViolet: string;
  accentCyan: string;
  accentCyanLight: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDanger: string;
  danger: string;
  success: string;
  warning: string;
  userBubble: string;
  userBubbleText: string;
  assistantBubble: string;
  inputBackground: string;
  shadowColor: string;
}

const light: Theme = {
  isDark: false,
  background: '#F4F7FF',
  backgroundAlt: '#EDF2FF',
  card: '#FFFFFF',
  cardGlass: 'rgba(255, 255, 255, 0.85)',
  surface: '#F1F5FF',
  surfaceElevated: '#FFFFFF',
  text: '#0F172A',
  navy: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: 'rgba(148, 163, 184, 0.24)',
  borderHighlight: 'rgba(255, 255, 255, 0.9)',
  tint: '#3B82F6',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#EFF6FF',
  secondary: '#6366F1',
  accent: '#10B981',
  glow: 'rgba(59, 130, 246, 0.28)',
  indigo: '#6366F1',
  indigoLight: '#EEF2FF',
  emerald: '#10B981',
  emeraldLight: '#ECFDF5',
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  red: '#EF4444',
  redLight: '#FEF2F2',
  accentViolet: '#6366F1',
  accentCyan: '#06B6D4',
  accentCyanLight: '#ECFEFF',
  buttonPrimary: '#3B82F6',
  buttonSecondary: '#EEF2FF',
  buttonDanger: '#EF4444',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  userBubble: '#3B82F6',
  userBubbleText: '#FFFFFF',
  assistantBubble: '#FFFFFF',
  inputBackground: '#FFFFFF',
  shadowColor: '#1E3A8A',
};

const dark: Theme = {
  isDark: true,
  background: '#0A0F24',
  backgroundAlt: '#0F1736',
  card: '#131C3E',
  cardGlass: 'rgba(22, 33, 72, 0.82)',
  surface: '#1A2550',
  surfaceElevated: '#1F2D61',
  text: '#F8FAFC',
  navy: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  border: 'rgba(99, 102, 241, 0.26)',
  borderHighlight: 'rgba(255, 255, 255, 0.12)',
  tint: '#3B82F6',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#1E295B',
  secondary: '#6366F1',
  accent: '#10B981',
  glow: 'rgba(59, 130, 246, 0.28)',
  indigo: '#6366F1',
  indigoLight: '#23275E',
  emerald: '#10B981',
  emeraldLight: 'rgba(16, 185, 129, 0.18)',
  amber: '#F59E0B',
  amberLight: 'rgba(245, 158, 11, 0.18)',
  red: '#EF4444',
  redLight: 'rgba(239, 68, 68, 0.18)',
  accentViolet: '#818CF8',
  accentCyan: '#22D3EE',
  accentCyanLight: 'rgba(34, 211, 238, 0.16)',
  buttonPrimary: '#3B82F6',
  buttonSecondary: '#1E295B',
  buttonDanger: '#EF4444',
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  userBubble: '#3B82F6',
  userBubbleText: '#FFFFFF',
  assistantBubble: '#1A2550',
  inputBackground: '#131C3E',
  shadowColor: '#020617',
};

export function useTheme(): Theme {
  const { settings } = useSettings();
  const oras = useContext(OrasContext);

  const isDark = oras?.account ? oras.account.darkMode : settings.theme === 'dark';
  const baseTheme = isDark ? dark : light;
  const activeColorTheme = oras?.activeTheme || COLOR_THEMES[0];

  return useMemo(() => {
    return {
      ...baseTheme,
      isDark,
      primary: activeColorTheme.primary,
      tint: activeColorTheme.primary,
      buttonPrimary: activeColorTheme.primary,
      userBubble: activeColorTheme.primary,
      secondary: activeColorTheme.secondary,
      accent: activeColorTheme.accent,
      glow: activeColorTheme.glow,
      borderHighlight: isDark ? `${activeColorTheme.primary}45` : 'rgba(255, 255, 255, 0.9)',
    };
  }, [baseTheme, isDark, activeColorTheme]);
}
