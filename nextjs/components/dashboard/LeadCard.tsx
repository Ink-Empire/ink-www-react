import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { colors } from '@/styles/colors';
import { Lead } from './types';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const userInitials = lead.user.name
    ? lead.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : lead.user.username?.slice(0, 2).toUpperCase() || '??';

  const imageUrl = typeof lead.user.image === 'string' ? lead.user.image : lead.user.image?.uri;

  return (
    <Box
      onClick={onClick}
      sx={{
        minWidth: { xs: 120, sm: 140 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        bgcolor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': {
          borderColor: colors.accent,
          transform: 'translateY(-2px)',
        }
      }}
    >
      <Avatar
        src={imageUrl}
        sx={{
          width: 56,
          height: 56,
          bgcolor: colors.accent,
          color: colors.background,
          fontSize: '1rem',
          fontWeight: 600,
          mb: 1,
        }}
      >
        {userInitials}
      </Avatar>

      <Typography sx={{
        fontSize: '0.85rem',
        fontWeight: 600,
        color: colors.textPrimary,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 120,
      }}>
        {lead.user.name || lead.user.username}
      </Typography>

      {lead.user.location && (
        <Typography sx={{
          fontSize: '0.75rem',
          color: colors.textMuted,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 120,
          mb: 1,
        }}>
          {lead.user.location}
        </Typography>
      )}

      <Box sx={{
        px: 1.5,
        py: 0.25,
        bgcolor: `${colors.accent}20`,
        borderRadius: '100px',
        fontSize: '0.65rem',
        fontWeight: 500,
        color: colors.accent,
        mt: lead.user.location ? 0 : 1,
      }}>
        {lead.timing_label}
      </Box>
    </Box>
  );
}

export default LeadCard;
