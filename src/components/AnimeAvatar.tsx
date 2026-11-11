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

  // Harmonious face contour with proper headroom and side margins
  const faceRx = c.faceShape === 1 ? 20.5 : c.faceShape === 2 ? 18 : 19.2;
  const faceRy = c.faceShape === 1 ? 20.5 : c.faceShape === 2 ? 22.5 : 21.5;

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

        {/* 1. Full-bleed Background Circle with Aurora sheen */}
        <Circle cx="50" cy="50" r="50" fill="url(#avBg)" />
        <Circle cx="32" cy="24" r="22" fill="rgba(255,255,255,0.16)" />

        {/* 2. Back Hair Layer (long hairstyles, ponytail, and twin tails fully visible) */}
        {c.hairstyle === 1 && (
          <G>
            {/* Twin Tails cascading within safe circular boundary */}
            <Path d="M25 46 Q13 60 18 80 Q22 83 25 74 Q23 62 28 50 Z" fill="url(#hairGrad)" />
            <Path d="M75 46 Q87 60 82 80 Q78 83 75 74 Q77 62 72 50 Z" fill="url(#hairGrad)" />
            {/* Hair Ties */}
            <Ellipse cx="22" cy="49" rx="3.5" ry="2" fill="#EC4899" />
            <Ellipse cx="78" cy="49" rx="3.5" ry="2" fill="#EC4899" />
          </G>
        )}
        {c.hairstyle === 3 && (
          /* Bob Cut back volume */
          <Path d="M26 44 Q20 64 28 72 L72 72 Q80 64 74 44 Z" fill="url(#hairGrad)" />
        )}
        {c.hairstyle === 5 && (
          /* High Ponytail with generous headroom and elegant arc */
          <G>
            <Path d="M50 22 Q70 14 74 26 Q77 40 70 48 Q71 38 68 28 Q64 22 50 22 Z" fill="url(#hairGrad)" />
            <Ellipse cx="57" cy="20" rx="3.5" ry="2" fill="#3B82F6" />
          </G>
        )}
        {c.character === 'girl' && c.hairstyle !== 1 && c.hairstyle !== 3 && c.hairstyle !== 5 && (
          /* Silky cascading long hair for female scholars */
          <Path d="M27 48 Q21 68 26 84 L74 84 Q79 68 73 48 Z" fill={hair.main} />
        )}

        {/* 3. Neck & Soft Shadow */}
        <Rect x="44.5" y="65" width="11" height="13" rx="4" fill={skin} />
        <Path d="M44.5 68 Q50 72 55.5 68 L55.5 71 Q50 75 44.5 71 Z" fill="rgba(0,0,0,0.12)" />

        {/* 4. Torso & Outfits Layer (flaring smoothly to anchor at the bottom) */}
        <G>
          {/* Base shoulders */}
          <Path
            d="M16 110 L18 84 Q22 75 41 74 L59 74 Q78 75 82 84 L84 110 Z"
            fill="url(#outfitGrad)"
          />
          {/* Inner shirt / V-neck */}
          <Path d="M42 74 L50 86 L58 74 Z" fill="#FFFFFF" />

          {c.outfit === 0 && (
            /* Prep Blazer tie & lapels */
            <G>
              <Path d="M48.2 78 L51.8 78 L52.8 98 L50 102 L47.2 98 Z" fill="#EF4444" />
              <Path d="M38 75 L46 90 L41 106 L33 78 Z" fill="rgba(255,255,255,0.22)" />
              <Path d="M62 75 L54 90 L59 106 L67 78 Z" fill="rgba(255,255,255,0.22)" />
            </G>
          )}
          {c.outfit === 1 && (
            /* Sailor Uniform collar & ribbon */
            <G>
              <Path d="M32 76 L50 88 L68 76 L64 74 L50 83 L36 74 Z" fill="#FFFFFF" />
              <Path d="M46 85 L54 85 L50 93 Z" fill="#EC4899" />
            </G>
          )}
          {c.outfit === 2 && (
            /* Tech Hoodie drawstrings & hood rim */
            <G>
              <Path d="M35 74 Q50 82 65 74" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
              <Rect x="45" y="80" width="2" height="12" rx="1" fill="#FFFFFF" />
              <Rect x="53" y="80" width="2" height="12" rx="1" fill="#FFFFFF" />
            </G>
          )}
          {c.outfit === 3 && (
            /* Varsity Cardigan V-stripe */
            <Path d="M40 74 L50 89 L60 74" stroke="#FCD34D" strokeWidth="3" fill="none" />
          )}
          {c.outfit === 4 && (
            /* Lab Coat white overcoat */
            <G>
              <Path d="M18 110 Q22 76 41 74 L45 110 Z" fill="#F8FAFC" />
              <Path d="M82 110 Q78 76 59 74 L55 110 Z" fill="#F8FAFC" />
            </G>
          )}
        </G>

        {/* 5. Ears */}
        <Circle cx={50 - faceRx} cy="50" r="3.8" fill={skin} />
        <Circle cx={50 + faceRx} cy="50" r="3.8" fill={skin} />

        {/* 6. Head / Face Shape */}
        <Ellipse cx="50" cy="49" rx={faceRx} ry={faceRy} fill={skin} />

        {/* 7. Soft Anime Blush */}
        <Ellipse cx="38" cy="54" rx="3.6" ry="1.8" fill="rgba(244, 63, 94, 0.28)" />
        <Ellipse cx="62" cy="54" rx="3.6" ry="1.8" fill="rgba(244, 63, 94, 0.28)" />

        {/* 8. Anime Eyes */}
        <G>
          {/* Left Eye */}
          <Ellipse cx="41" cy="49" rx="3.6" ry={c.character === 'girl' ? 4.2 : 3.6} fill="#0F172A" />
          <Circle cx="39.8" cy="47.6" r="1.4" fill="#FFFFFF" />
          <Circle cx="42.2" cy="50.2" r="0.7" fill={hair.highlight} />
          <Path
            d="M36.5 45.2 Q41 43 45.5 45.5"
            stroke="#0F172A"
            strokeWidth={c.character === 'girl' ? 2 : 1.6}
            strokeLinecap="round"
            fill="none"
          />

          {/* Right Eye */}
          <Ellipse cx="59" cy="49" rx="3.6" ry={c.character === 'girl' ? 4.2 : 3.6} fill="#0F172A" />
          <Circle cx="57.8" cy="47.6" r="1.4" fill="#FFFFFF" />
          <Circle cx="60.2" cy="50.2" r="0.7" fill={hair.highlight} />
          <Path
            d="M54.5 45.5 Q59 43 63.5 45.2"
            stroke="#0F172A"
            strokeWidth={c.character === 'girl' ? 2 : 1.6}
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* 9. Eyebrows */}
        <Path d="M37 41.5 Q41 40 45 41.5" stroke={hair.main} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <Path d="M55 41.5 Q59 40 63 41.5" stroke={hair.main} strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* 10. Nose & Confident Smile */}
        <Path d="M49.5 52 L48.8 54.5 L50.5 54.8" stroke="rgba(0,0,0,0.22)" strokeWidth="1" strokeLinecap="round" fill="none" />
        <Path d="M45.5 59 Q50 63 54.5 59" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* 11. Front Hair Layer & Sidelocks (Complete, unclipped hairstyles) */}
        <G>
          {/* Base Crown (Skull coverage with ample headroom) */}
          <Path
            d="M26 46 Q25 24 50 24 Q75 24 74 46 Q69 34 50 34 Q31 34 26 46 Z"
            fill="url(#hairGrad)"
          />

          {/* Face-framing Sidelocks (Natural anime structure) */}
          <Path d="M26 44 Q24 54 28 58 Q29 50 28 44 Z" fill="url(#hairGrad)" />
          <Path d="M74 44 Q76 54 72 58 Q71 50 72 44 Z" fill="url(#hairGrad)" />

          {c.hairstyle === 0 && (
            /* Academy Spikes — Dynamic crown volume & front spikes */
            <G>
              <Path d="M34 26 L40 18 L46 25 L50 16 L54 25 L60 18 L66 26 Z" fill="url(#hairGrad)" />
              <Path
                d="M26 42 L31 30 L37 40 L44 28 L50 41 L56 29 L63 40 L69 31 L74 42 Q63 32 50 33 Q37 32 26 42 Z"
                fill="url(#hairGrad)"
              />
            </G>
          )}

          {c.hairstyle === 1 && (
            /* Twin Tails Bangs */
            <Path
              d="M27 43 Q37 30 50 41 Q63 30 73 43 Q67 27 50 26 Q33 27 27 43 Z"
              fill="url(#hairGrad)"
            />
          )}

          {c.hairstyle === 2 && (
            /* Side Sweep — Sweeping bangs & tapered right side */
            <G>
              <Path
                d="M26 44 Q38 26 73 41 Q67 25 48 25 Q30 26 26 44 Z"
                fill="url(#hairGrad)"
              />
              <Path d="M42 34 Q56 36 68 45 Q56 40 42 34 Z" fill="url(#hairGrad)" />
            </G>
          )}

          {c.hairstyle === 3 && (
            /* Bob Cut Straight Fringe & Cheek-hugging edges */
            <G>
              <Path
                d="M27 40 L73 40 Q71 26 50 26 Q29 26 27 40 Z"
                fill="url(#hairGrad)"
              />
              <Path d="M26 40 Q24 58 29 63 Q31 56 29 42 Z" fill="url(#hairGrad)" />
              <Path d="M74 40 Q76 58 71 63 Q69 56 71 42 Z" fill="url(#hairGrad)" />
            </G>
          )}

          {c.hairstyle === 4 && (
            /* Messy Scholar — Textured spikes on top and sides */
            <G>
              <Path d="M38 25 L43 18 L48 24 L52 17 L57 24 L62 19 L65 26 Z" fill="url(#hairGrad)" />
              <Path
                d="M24 43 L33 33 L39 43 L48 31 L53 43 L61 32 L76 43 Q70 24 50 24 Q30 24 24 43 Z"
                fill="url(#hairGrad)"
              />
            </G>
          )}

          {c.hairstyle === 5 && (
            /* Center Parted Ponytail Fringe */
            <G>
              <Path
                d="M26 45 Q37 33 50 30 Q63 33 74 45 Q71 25 50 25 Q29 25 26 45 Z"
                fill="url(#hairGrad)"
              />
              <Path d="M47 31 L50 36 L53 31 Z" fill={skin} />
            </G>
          )}

          {/* Anime Hair Gloss Highlight */}
          <Path
            d="M36 30 Q50 27 64 30"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* 12. Accessories (0=None, 1=Smart Glasses, 2=Studio Headphones, 3=Star Crown) */}
        {c.accessory === 1 && (
          /* Smart Glasses */
          <G>
            <Rect x="33" y="44" width="14" height="9" rx="2.5" stroke="#1E293B" strokeWidth="1.8" fill="rgba(255,255,255,0.2)" />
            <Rect x="53" y="44" width="14" height="9" rx="2.5" stroke="#1E293B" strokeWidth="1.8" fill="rgba(255,255,255,0.2)" />
            <Path d="M47 47.5 L53 47.5" stroke="#1E293B" strokeWidth="1.8" />
            <Path d="M33 46.5 L29 45.5" stroke="#1E293B" strokeWidth="1.4" />
            <Path d="M67 46.5 L71 45.5" stroke="#1E293B" strokeWidth="1.4" />
          </G>
        )}

        {c.accessory === 2 && (
          /* Studio Headphones — Arching smoothly over the hair crown */
          <G>
            <Path d="M26 50 Q26 21 50 21 Q74 21 74 50" stroke="#F8FAFC" strokeWidth="3.2" fill="none" />
            <Rect x="22" y="44" width="6.5" height="13" rx="3" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.2" />
            <Rect x="71.5" y="44" width="6.5" height="13" rx="3" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.2" />
          </G>
        )}

        {c.accessory === 3 && (
          /* Star Crown — Sits on crown hair with clear headroom */
          <G>
            <Path
              d="M39 24 L43 16 L50 21 L57 16 L61 24 Z"
              fill="#F59E0B"
              stroke="#FEF3C7"
              strokeWidth="1.2"
            />
            <Circle cx="50" cy="22" r="1.5" fill="#EF4444" />
          </G>
        )}

        {/* 13. Anti-aliased Circular Rim Ring */}
        <Circle cx="50" cy="50" r="49" fill="none" stroke={borderColor} strokeWidth="2" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
});
