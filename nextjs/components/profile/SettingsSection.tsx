import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { colors } from '@/styles/colors';

interface SettingsSectionProps {
  id?: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  id,
  title,
  icon,
  children,
  defaultExpanded = true,
  badge
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Box
      id={id}
      sx={{
        bgcolor: colors.surface,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        mb: '1.5rem',
        overflow: 'hidden'
      }}
    >
      {/* Section Header */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: '1rem 1.25rem',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s ease',
          '&:hover': { bgcolor: '#242424' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Box sx={{ color: colors.accent, display: 'flex' }}>
            {icon}
          </Box>
          <Typography sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: colors.textPrimary
          }}>
            {title}
          </Typography>
          {badge}
        </Box>
        <ExpandMoreIcon
          sx={{
            color: colors.textSecondary,
            fontSize: '1.5rem',
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </Box>

      {/* Section Content */}
      <Box sx={{
        display: isExpanded ? 'block' : 'none',
        p: '0 1.25rem 1.25rem 1.25rem',
        borderTop: `1px solid ${colors.border}`
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default SettingsSection;
