import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Reel = ({title}: {title: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps});
  const opacity = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#0a0a0a', justifyContent: 'center', alignItems: 'center'}}>
      <h1 style={{color: '#ff2d00', fontSize: 120, fontFamily: 'sans-serif', opacity, transform: `scale(${s})`}}>{title}</h1>
    </AbsoluteFill>
  );
};
