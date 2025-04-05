import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';

interface LogoTextProps {
  color?: string;
  className?: string;
  fontSize?: string | number;
}

const LogoText: React.FC<LogoTextProps> = ({ 
  color = '#339989', 
  className = '',
  fontSize
}) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  
  useEffect(() => {
    // This checks if fonts have loaded
    document.fonts.ready.then(() => {
      setFontLoaded(true);
    });
    
    // Try to load the font directly
    const font = new FontFace('Tattoo-Font', 'url(/fonts/tatFont.ttf)');
    font.load().then(() => {
      document.fonts.add(font);
      setFontLoaded(true);
    }).catch(err => {
      console.error('Font loading error:', err);
    });
  }, []);

  // Style with direct font-family and fallbacks
  const fontStyle = {
    fontFamily: 'Tattoo-Font, Arial, cursive',
    color,
    fontSize,
    letterSpacing: '1px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
  };

  // Adding inline style as a fallback
  return (
    <Typography 
      component="span"
      className={`tattoo-font logo-text ${className}`}
      sx={fontStyle}
      style={{
        fontFamily: 'Tattoo-Font, Arial, cursive',
        color: color as string,
        fontSize: fontSize as string | number,
        letterSpacing: '1px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
      }}
    >
      InkedIn
    </Typography>
  );
};

export default LogoText;