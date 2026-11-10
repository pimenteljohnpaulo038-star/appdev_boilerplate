import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  ANIME_PRESET_AVATARS,
  type CustomAvatarConfig,
} from '@/data/orasorasData';

export const SKIN_TONES = [
  '#FFE7D6', // Fair porcelain
  '#FCD5B5', // Warm ivory
  '#F1B88F', // Honey beige
  '#D29267', // Golden tan
  '#9E6240', // Rich cocoa
];

export const HAIR_COLORS = [
  { name: 'Midnight Navy', main: '#1E293B', highlight: '#475569' },
  { name: 'Electric Indigo', main: '#4F46E5', highlight: '#818CF8' },
  { name: 'Chestnut Auburn', main: '#7C2D12', highlight: '#EA580C' },
  { name: 'Platinum Sky', main: '#0284C7', highlight: '#7DD3FC' },
  { name: 'Sakura Rose', main: '#DB2777', highlight: '#F472B6' },
  { name: 'Golden Blond', main: '#D97706', highlight: '#FCD34D' },
];

export const OUTFIT_COLORS = [
  { name: 'Cobalt Blazer', main: '#2563EB', accent: '#60A5FA' },
  { name: 'Indigo Academy', main: '#4F46E5', accent: '#A5B4FC' },
  { name: 'Emerald Crest', main: '#059669', accent: '#34D399' },
  { name: 'Crimson Honor', main: '#DC2626', accent: '#FCA5A5' },
  { name: 'Amber Varsity', main: '#D97706', accent: '#FDE68A' },
  { name: 'Slate Cyber', main: '#1E293B', accent: '#38BDF8' },
];

export const FACE_SHAPES = ['Balanced', 'Soft Round', 'Sharp V-Line'];
export const HAIRSTYLES = ['Academy Spikes', 'Twin Tails', 'Side Sweep', 'Bob Cut', 'Messy Scholar', 'High Ponytail'];
export const OUTFITS = ['Prep Blazer', 'Sailor Uniform', 'Tech Hoodie', 'Varsity Cardigan', 'Lab Coat'];
export const ACCESSORIES = ['None', 'Smart Glasses', 'Studio Headphones', 'Star Crown'];

interface AnimeAvatarProps {
  config?: CustomAvatarConfig;
  presetId?: number;
  size?: number;
  bgColors?: [string, string];
  borderColor?: string;
  showBadge?: boolean;
}

export function AnimeAvatar({
  config,
  presetId = 0,
  size = 64,
  bgColors,
  borderColor = 'rgba(255,255,255,0.85)',
}: AnimeAvatarProps) {
  const preset = ANIME_PRESET_AVATARS[presetId] ?? ANIME_PRESET_AVATARS[0];
  const c = config ?? preset.config;
  const grad = bgColors ?? preset.bgGradient;

  const skin = SKIN_TONES[c.skinTone] ?? SKIN_TONES[1];
  const hair = HAIR_COLORS[c.hairColor] ?? HAIR_COLORS[0];
  const outfit = OUTFIT_COLORS[c.outfitColor] ?? OUTFIT_COLORS[0];

  // Face contour by faceShape
  const faceRx = c.faceShape === 1 ? 25 : c.faceShape === 2 ? 22 : 23.5;
  const faceRy = c.faceShape === 1 ? 25 : c.faceShape === 2 ? 27 : 26;

  return (
    <View
      // @ts-ignore web className support for 3D depth system
      className="avatar-3d"
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="avBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={grad[0]} />
            <Stop offset="100%" stopColor={grad[1]} />
          </LinearGradient>
          <LinearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={hair.highlight} />
            <Stop offset="45%" stopColor={hair.main} />
            <Stop offset="100%" stopColor={hair.main} />
          </LinearGradient>
          <LinearGradient id="outfitGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={outfit.main} />
            <Stop offset="100%" stopColor={outfit.accent} />
          </LinearGradient>
        </Defs>

        {/* Background Circle with Aurora sheen */}
        <Circle cx="50" cy="50" r="50" fill="url(#avBg)" />
        <Circle cx="30" cy="22" r="24" fill="rgba(255,255,255,0.16)" />

        {/* Back Hair Layer (for long/ponytail/twintail styles) */}
        {c.hairstyle === 1 && (
          <G>
            <Path d="M18 42 Q8 65 16 88 Q24 85 26 62 Z" fill="url(#hairGrad)" />
            <Path d="M82 42 Q92 65 84 88 Q76 85 74 62 Z" fill="url(#hairGrad)" />
          </G>
        )}
        {c.hairstyle === 3 && (
          <Path d="M22 38 Q18 68 28 76 L72 76 Q82 68 78 38 Z" fill="url(#hairGrad)" />
        )}
        {c.hairstyle === 5 && (
          <Path d="M50 12 Q78 8 84 42 Q76 46 68 28 Z" fill="url(#hairGrad)" />
        )}
        {c.character === 'girl' && c.hairstyle !== 3 && (
          <Path d="M25 46 Q22 72 30 82 L70 82 Q78 72 75 46 Z" fill={hair.main} />
        )}

        {/* Neck & Shadow */}
        <Rect x="43" y="64" width="14" height="14" rx="5" fill={skin} />
        <Path d="M43 67 Q50 73 57 67 L57 71 Q50 76 43 71 Z" fill="rgba(0,0,0,0.12)" />

        {/* Outfit Layer (5 styles) */}
        <G>
          {/* Base shoulders */}
          <Path
            d="M18 100 Q20 75 42 74 L58 74 Q80 75 82 100 Z"
            fill="url(#outfitGrad)"
          />
          {/* Inner shirt / collar */}
          <Path d="M41 74 L50 88 L59 74 Z" fill="#FFFFFF" />
          {c.outfit === 0 && (
            /* Prep Blazer tie & lapels */
            <G>
              <Path d="M48 79 L52 79 L53 96 L50 99 L47 96 Z" fill="#EF4444" />
              <Path d="M37 75 L46 92 L41 94 L33 78 Z" fill="rgba(255,255,255,0.22)" />
              <Path d="M63 75 L54 92 L59 94 L67 78 Z" fill="rgba(255,255,255,0.22)" />
            </G>
          )}
          {c.outfit === 1 && (
            /* Sailor collar */
            <G>
              <Path d="M30 76 L50 90 L70 76 L65 74 L50 84 L35 74 Z" fill="#FFFFFF" />
              <Path d="M45 87 L55 87 L50 96 Z" fill="#EC4899" />
            </G>
          )}
          {c.outfit === 2 && (
            /* Tech Hoodie drawstrings & hood rim */
            <G>
              <Path d="M34 74 Q50 84 66 74" stroke="#FFFFFF" strokeWidth="3" fill="none" />
              <Rect x="44" y="81" width="2.2" height="13" rx="1" fill="#FFFFFF" />
              <Rect x="54" y="81" width="2.2" height="13" rx="1" fill="#FFFFFF" />
            </G>
          )}
          {c.outfit === 3 && (
            /* Varsity Cardigan V-stripe */
            <Path d="M39 74 L50 92 L61 74" stroke="#FCD34D" strokeWidth="3.5" fill="none" />
          )}
          {c.outfit === 4 && (
            /* Lab Coat white overcoat */
            <G>
              <Path d="M20 100 Q22 76 41 74 L46 100 Z" fill="#F8FAFC" />
              <Path d="M80 100 Q78 76 59 74 L54 100 Z" fill="#F8FAFC" />
            </G>
          )}
        </G>

        {/* Ears */}
        <Circle cx={50 - faceRx} cy="48" r="4.5" fill={skin} />
        <Circle cx={50 + faceRx} cy="48" r="4.5" fill={skin} />

        {/* Head / Face Shape */}
        <Ellipse cx="50" cy="46" rx={faceRx} ry={faceRy} fill={skin} />

        {/* Soft Anime Blush */}
        <Ellipse cx="36" cy="52" rx="4.2" ry="2.2" fill="rgba(244, 63, 94, 0.25)" />
        <Ellipse cx="64" cy="52" rx="4.2" ry="2.2" fill="rgba(244, 63, 94, 0.25)" />

        {/* Anime Eyes */}
        <G>
          {/* Left Eye */}
          <Ellipse cx="39.5" cy="46" rx="4.2" ry={c.character === 'girl' ? 4.8 : 4.1} fill="#0F172A" />
          <Circle cx="38.2" cy="44.3" r="1.6" fill="#FFFFFF" />
          <Circle cx="41" cy="47.5" r="0.8" fill={hair.highlight} />
          <Path
            d="M34.5 41.5 Q39.5 39 44.5 41.8"
            stroke="#0F172A"
            strokeWidth={c.character === 'girl' ? 2.2 : 1.8}
            strokeLinecap="round"
            fill="none"
          />

          {/* Right Eye */}
          <Ellipse cx="60.5" cy="46" rx="4.2" ry={c.character === 'girl' ? 4.8 : 4.1} fill="#0F172A" />
          <Circle cx="59.2" cy="44.3" r="1.6" fill="#FFFFFF" />
          <Circle cx="62" cy="47.5" r="0.8" fill={hair.highlight} />
          <Path
            d="M55.5 41.8 Q60.5 39 65.5 41.5"
            stroke="#0F172A"
            strokeWidth={c.character === 'girl' ? 2.2 : 1.8}
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* Eyebrows */}
        <Path d="M35 37.5 Q39.5 35.8 44 37.5" stroke={hair.main} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <Path d="M56 37.5 Q60.5 35.8 65 37.5" stroke={hair.main} strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* Nose & Confident Smile */}
        <Path d="M49.5 49.5 L48.5 52.5 L50.8 52.8" stroke="rgba(0,0,0,0.22)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <Path d="M44.5 57.5 Q50 62 55.5 57.5" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Front Hair Layer (6 hairstyles) */}
        <G>
          {/* Base Crown */}
          <Path
            d="M24 42 Q24 16 50 16 Q76 16 76 42 Q71 28 50 28 Q29 28 24 42 Z"
            fill="url(#hairGrad)"
          />
          {c.hairstyle === 0 && (
            /* Academy Spikes */
            <Path
              d="M24 38 L29 23 L36 36 L44 20 L50 37 L58 21 L65 36 L73 24 L76 40 Q64 27 50 28 Q36 27 24 38 Z"
              fill="url(#hairGrad)"
            />
          )}
          {c.hairstyle === 1 && (
            /* Twin Tails Bangs */
            <Path
              d="M25 40 Q36 24 50 38 Q64 24 75 40 Q68 20 50 18 Q32 20 25 40 Z"
              fill="url(#hairGrad)"
            />
          )}
          {c.hairstyle === 2 && (
            /* Side Sweep */
            <Path
              d="M24 41 Q38 18 75 37 Q68 18 48 18 Q28 19 24 41 Z"
              fill="url(#hairGrad)"
            />
          )}
          {c.hairstyle === 3 && (
            /* Bob Cut Straight Fringe */
            <Path
              d="M25 36 L75 36 Q73 18 50 18 Q27 18 25 36 Z"
              fill="url(#hairGrad)"
            />
          )}
          {c.hairstyle === 4 && (
            /* Messy Scholar */
            <Path
              d="M22 39 L32 28 L38 40 L48 26 L54 40 L64 27 L78 39 Q72 17 50 17 Q28 17 22 39 Z"
              fill="url(#hairGrad)"
            />
          )}
          {c.hairstyle === 5 && (
            /* Center Parted Ponytail Fringe */
            <Path
              d="M24 43 Q37 28 50 25 Q63 28 76 43 Q73 18 50 18 Q27 18 24 43 Z"
              fill="url(#hairGrad)"
            />
          )}
          {/* Anime Hair Gloss Highlight */}
          <Path
            d="M34 25 Q50 21 66 25"
            stroke="rgba(255,255,255,0.38)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* Accessories (0=None, 1=Glasses, 2=Headphones, 3=Star Crown) */}
        {c.accessory === 1 && (
          /* Smart Glasses */
          <G>
            <Rect x="31.5" y="41" width="15" height="10" rx="3" stroke="#1E293B" strokeWidth="2" fill="rgba(255,255,255,0.18)" />
            <Rect x="53.5" y="41" width="15" height="10" rx="3" stroke="#1E293B" strokeWidth="2" fill="rgba(255,255,255,0.18)" />
            <Path d="M46.5 45 L53.5 45" stroke="#1E293B" strokeWidth="2" />
          </G>
        )}
        {c.accessory === 2 && (
          /* Studio Headphones */
          <G>
            <Path d="M22 46 Q22 14 50 14 Q78 14 78 46" stroke="#F8FAFC" strokeWidth="4" fill="none" />
            <Rect x="17" y="39" width="8" height="16" rx="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
            <Rect x="75" y="39" width="8" height="16" rx="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
          </G>
        )}
        {c.accessory === 3 && (
          /* Star Crown */
          <Path
            d="M37 19 L42 10 L50 16 L58 10 L63 19 Z"
            fill="#F59E0B"
            stroke="#FEF3C7"
            strokeWidth="1.2"
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
});
