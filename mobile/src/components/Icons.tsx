/**
 * Authored icons, one 1.5 stroke, one 24 box. No emoji and no icon font: an
 * emoji standing in for an icon renders differently on every Android skin and
 * cannot take the palette.
 */
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface P {
  size?: number;
  color: string;
  strokeWidth?: number;
}

const Box = ({ size = 24, children }: { size?: number; children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {children}
  </Svg>
);

/** The app mark: a compass rose, which is also the compose action. */
export const Rose = ({ size = 24, color }: P) => (
  <Box size={size}>
    <Path d="M12 2.2 13.5 9.2 12 12 10.5 9.2Z" fill={color} />
    <Path d="M12 21.8 10.5 14.8 12 12 13.5 14.8Z" fill={color} />
    <Path d="M2.2 12 9.2 10.5 12 12 9.2 13.5Z" fill={color} />
    <Path d="M21.8 12 14.8 13.5 12 12 14.8 10.5Z" fill={color} />
    <Path
      d="M5.6 5.6 10 10.6M18.4 18.4 14 13.4M18.4 5.6 13.4 10M5.6 18.4 10.6 14"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      opacity={0.55}
    />
  </Box>
);

/** Feed: three magnitude nodes joined on a plate. Drawn at nav weight so it
 *  does not dissolve into a blob at 24 dp. */
export const Plate = ({ size = 24, color }: P) => (
  <Box size={size}>
    <Rect x={3} y={3} width={18} height={18} rx={1.2} stroke={color} strokeWidth={1.8} />
    <Path
      d="M7.4 7.6 15.8 12.4 10.8 17"
      stroke={color}
      strokeWidth={1.4}
      strokeDasharray="1.6 2"
      strokeLinecap="round"
    />
    <Circle cx={7.4} cy={7.6} r={2.3} fill={color} />
    <Circle cx={15.8} cy={12.4} r={1.6} fill={color} />
    <Circle cx={10.8} cy={17} r={1.2} fill={color} />
  </Box>
);

export const Bell = ({ size = 24, color }: P) => (
  <Box size={size}>
    <Path
      d="M18 9a6 6 0 1 0-12 0c0 5.2-1.8 6.6-1.8 6.6h15.6S18 14.2 18 9Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <Path d="M10.3 19.2a2 2 0 0 0 3.4 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Box>
);

export const Observer = ({ size = 24, color }: P) => (
  <Box size={size}>
    <Circle cx={12} cy={8.2} r={3.6} stroke={color} strokeWidth={1.5} />
    <Path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Box>
);

/**
 * The like mark. Filled versus hollow is the state — colour is a second
 * signal, never the only one, so it still reads for a colour-blind user.
 */
export const StarMark = ({ size = 20, color, filled }: P & { filled: boolean }) => (
  <Box size={size}>
    {filled ? (
      <>
        <Circle cx={12} cy={12} r={5.2} fill={color} />
        <Circle cx={12} cy={12} r={8.6} stroke={color} strokeWidth={1.5} opacity={0.5} />
      </>
    ) : (
      <Circle cx={12} cy={12} r={5.2} stroke={color} strokeWidth={1.5} />
    )}
  </Box>
);

export const Reply = ({ size = 20, color }: P) => (
  <Box size={size}>
    <Path
      d="M20.4 12.6c0 3.8-3.8 6.9-8.4 6.9a10 10 0 0 1-2.6-.34L4.6 21l1.2-3.5A6.5 6.5 0 0 1 3.6 12.6c0-3.8 3.8-6.9 8.4-6.9s8.4 3.1 8.4 6.9Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  </Box>
);

export const Reticle = ({ size = 24, color }: P) => (
  <Box size={size}>
    <Circle cx={12} cy={12} r={7} stroke={color} strokeWidth={1.5} />
    <Circle cx={12} cy={12} r={1.6} fill={color} />
    <Path
      d="M12 2.4v3.2M12 18.4v3.2M2.4 12h3.2M18.4 12h3.2"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Box>
);

const stroke = (d: string, color: string, w = 1.5) => (
  <Path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);

export const Back = ({ size = 24, color }: P) => <Box size={size}>{stroke('M19 12H5M11 6l-6 6 6 6', color)}</Box>;
export const Close = ({ size = 24, color }: P) => <Box size={size}>{stroke('M18.5 5.5 5.5 18.5M5.5 5.5l13 13', color)}</Box>;
export const Filter = ({ size = 24, color }: P) => <Box size={size}>{stroke('M3.4 6.2h17.2M6.6 12h10.8M10 17.8h4', color)}</Box>;
export const Refresh = ({ size = 24, color }: P) => (
  <Box size={size}>
    {stroke('M20.2 12a8.2 8.2 0 1 1-2.6-6', color)}
    {stroke('M20.4 4.4v5.2h-5.2', color)}
  </Box>
);
export const Send = ({ size = 21, color }: P) => <Box size={size}>{stroke('M4.2 11.9 20 4.4l-7.4 15.8-1.9-6.4Z', color)}</Box>;
export const Warn = ({ size = 16, color }: P) => (
  <Box size={size}>
    <Circle cx={12} cy={12} r={8.4} stroke={color} strokeWidth={1.5} />
    {stroke('M12 7.8v4.8M12 16.1h.01', color)}
  </Box>
);
export const CloudOff = ({ size = 18, color }: P) => (
  <Box size={size}>
    {stroke('M4 4l16 16', color)}
    {stroke('M17.5 17.5H7a4 4 0 0 1-.6-7.96', color)}
    {stroke('M9.4 6.6A5.4 5.4 0 0 1 18 10.4a3.6 3.6 0 0 1 2.4 5.5', color)}
  </Box>
);
export const Logout = ({ size = 18, color }: P) => (
  <Box size={size}>
    {stroke('M15 5.6V4.2H4.6v15.6H15v-1.4', color)}
    {stroke('M11 12h9.4M17.2 8.4l3.4 3.6-3.4 3.6', color)}
  </Box>
);
