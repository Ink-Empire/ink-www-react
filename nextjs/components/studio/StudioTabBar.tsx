import React from 'react';
import { Box } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import { colors } from '@/styles/colors';

interface StudioTabBarProps {
  activeTab: number;
  onChange: (index: number) => void;
}

export const STUDIO_TABS = [
  { icon: <ImageIcon sx={{ fontSize: 18, opacity: 0.7 }} />, label: 'Portfolio' },
  { icon: <InfoIcon sx={{ fontSize: 18, opacity: 0.7 }} />, label: 'Info' },
];

/**
 * The Portfolio and Info tabs on a studio page.
 *
 * Shared with the editor rather than left inline on the public page: without
 * it the editor rendered both section bands one after the other, which read as
 * one continuous page and hid the fact that everything in the Info band sits
 * behind a click for a visitor.
 */
const StudioTabBar: React.FC<StudioTabBarProps> = ({ activeTab, onChange }) => (
  <Box sx={{
    display: 'flex',
    gap: 0,
    mb: 3,
    borderBottom: `1px solid ${colors.border}`
  }}>
    {STUDIO_TABS.map((tab, index) => (
      <Box
        key={index}
        onClick={() => onChange(index)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          color: activeTab === index ? colors.accent : colors.textSecondary,
          fontWeight: 500,
          fontSize: '0.95rem',
          position: 'relative',
          transition: 'color 0.2s',
          '&:hover': { color: colors.textPrimary },
          '&::after': activeTab === index ? {
            content: '""',
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: 2,
            bgcolor: colors.accent
          } : {}
        }}
      >
        {tab.icon}
        {tab.label}
      </Box>
    ))}
  </Box>
);

export default StudioTabBar;
