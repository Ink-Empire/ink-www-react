/**
 * Chair icon by Cahya Kurniawan from Noun Project (CC BY 3.0)
 * https://thenounproject.com/browse/icons/term/chair/
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ChairIconProps {
  size?: number;
  color?: string;
}

export default function ChairIcon({ size = 24, color = '#fff' }: ChairIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill={color}>
      <Path d="M60.2,9.8C60.2,9.8,60.2,9.8,60.2,9.8c-1.2-1.2-3.1-1.2-4.3,0L46.3,19H15.5c-0.3,0-0.5,0.1-0.7,0.3L3.8,30
        c-0.6,0.6-0.9,1.3-0.9,2.1s0.3,1.6,0.9,2.1c0.6,0.6,1.4,0.9,2.2,0.9s1.6-0.3,2.2-0.9l9.2-8.9l1.7,4.9
        c0.1,0.4,0.5,0.7,0.9,0.7h2v3c0,0.6,0.4,1,1,1h4v12h-3c-3.8,0-7,3.1-7,7c0,0.6,0.4,1,1,1h28c0.6,0,1-0.5,1-1
        c0-3.8-3.1-7-7-7h-3V35h4c0.6,0,1-0.4,1-1v-3h2c0.4,0,0.8-0.3,0.9-0.7l1.8-5.3h1.8c0.3,0,0.5-0.1,0.7-0.3l11-10.7
        c0.6-0.6,0.9-1.3,0.9-2.1S60.8,10.4,60.2,9.8z M35,47h-6V35h6V47z M43.3,29H41H23h-2.3l-1.3-4h25.3L43.3,29z" />
    </Svg>
  );
}
