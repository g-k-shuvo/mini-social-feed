/**
 * Star Atlas — the design system, ported verbatim from the approved prototype.
 *
 * Two themes, and neither is an inversion of the other:
 *   dark  — the sky at the eyepiece. Night-plate navy, chalk-white marks.
 *   light — the same atlas printed as a photographic plate. Cool blue-grey
 *           stock, deep-indigo ink, marks filled dark.
 *
 * One signal colour, star amber, and it is the only warm thing on screen.
 * Selection surfaces use CHART BLUE, never a wash of the accent: an accent
 * that becomes a field stops being a signal.
 */

export interface Palette {
  sky: string;
  plate: string;
  plate2: string;
  ink: string;
  ink2: string;
  rule: string;
  rule2: string;
  axis: string;
  sel: string;
  sel2: string;
  amber: string;
  amber2: string;
  amberBg: string;
  star: string;
  onAmber: string;
  scrim: string;
  skeleton: string;
  starAlpha: number;
}

export const dark: Palette = {
  sky: '#0A1021',
  plate: '#0E1729',
  plate2: '#16233D',
  ink: '#F2F2E9',
  ink2: '#9CAAC2',
  rule: 'rgba(242,242,233,0.11)',
  rule2: 'rgba(242,242,233,0.20)',
  axis: 'rgba(242,242,233,0.30)',
  sel: '#24374F',
  sel2: '#16233D',
  amber: '#FF4D2E',
  amber2: '#FFB36B',
  amberBg: 'rgba(255,77,46,0.14)',
  star: '#F2F2E9',
  onAmber: '#1A0803',
  scrim: 'rgba(4,7,15,0.72)',
  skeleton: 'rgba(242,242,233,0.07)',
  starAlpha: 0.55,
};

export const light: Palette = {
  sky: '#E2E7EC',
  plate: '#EEF2F6',
  plate2: '#D2DAE2',
  ink: '#101A2B',
  ink2: '#4E5C74',
  rule: 'rgba(16,26,43,0.16)',
  rule2: 'rgba(16,26,43,0.30)',
  axis: 'rgba(16,26,43,0.34)',
  sel: '#C6D2DE',
  sel2: '#D3DCE5',
  amber: '#BE3617',
  amber2: '#9A4A16',
  amberBg: 'rgba(190,54,23,0.10)',
  star: '#101A2B',
  onAmber: '#FFF6F2',
  scrim: 'rgba(16,26,43,0.42)',
  skeleton: 'rgba(16,26,43,0.08)',
  starAlpha: 0.34,
};

/** 8-point scale. Nothing in the app sets a spacing value off this list. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  /** The plate is ruled and rectilinear: Material's shape scale, themed sharp. */
  cell: 2,
  sheet: 4,
  pill: 999,
} as const;

export const font = {
  display: 'BodoniModa_500Medium_Italic',
  body: 'Jost_400Regular',
  bodyMedium: 'Jost_500Medium',
  bodySemi: 'Jost_600SemiBold',
  mono: 'RobotoMono_400Regular',
  monoMedium: 'RobotoMono_500Medium',
} as const;

/** Material 3 type roles, mapped onto the chart's three voices. */
export const type = {
  display: { fontFamily: font.display, fontSize: 34, lineHeight: 38 },
  headline: { fontFamily: font.display, fontSize: 25, lineHeight: 30 },
  title: { fontFamily: font.display, fontSize: 20, lineHeight: 24 },
  who: { fontFamily: font.display, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 25 },
  bodySmall: { fontFamily: font.body, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: font.bodySemi, fontSize: 10, letterSpacing: 1.7 },
  labelLarge: { fontFamily: font.bodyMedium, fontSize: 12, letterSpacing: 0.8 },
  fig: { fontFamily: font.mono, fontSize: 12 },
  figSmall: { fontFamily: font.mono, fontSize: 11 },
} as const;

/** Every interactive target clears Material's 48 dp floor. */
export const HIT = 48;

/** Expanded width starts here: navigation rail and two-pane. */
export const EXPANDED_WIDTH = 900;

/**
 * The magnitude ramp. A post's like count *is* the diameter of its mark, on a
 * fixed five-step scale — the whole thesis of the design in one function.
 */
const RAMP = [5, 7, 9, 12, 15] as const;

export function magnitude(likes: number): number {
  if (likes >= 18) return RAMP[4];
  if (likes >= 11) return RAMP[3];
  if (likes >= 6) return RAMP[2];
  if (likes >= 2) return RAMP[1];
  return RAMP[0];
}

/**
 * One seed rule for every user ink: a hue stepped within a bounded arc off the
 * star amber. Derived, never hand-picked, so a new user needs no decision.
 */
export function inkFor(id: string, isLight: boolean): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const step = (h % 9) - 4;
  const hue = (12 + step * 15 + 360) % 360;
  return isLight ? `hsl(${hue}, 62%, 34%)` : `hsl(${hue}, 78%, 58%)`;
}

export function initialsOf(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!)
    .join('')
    .toUpperCase();
}
