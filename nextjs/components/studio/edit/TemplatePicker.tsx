import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors } from '@/styles/colors';

export type StudioTemplateValue = 'portfolio' | 'team' | 'storefront';

interface TemplatePickerProps {
  value: StudioTemplateValue;
  onChange: (value: StudioTemplateValue) => void;
}

const TEMPLATES: { value: StudioTemplateValue; label: string; description: string; leads: string }[] = [
  {
    value: 'portfolio',
    label: 'Portfolio',
    description: 'Leads with the work. Best if your tattoos speak for you.',
    leads: 'Work first',
  },
  {
    value: 'team',
    label: 'Team',
    description: 'Leads with your artists. Best for a shop with a few names people ask for.',
    leads: 'Artists first',
  },
  {
    value: 'storefront',
    label: 'Storefront',
    description: 'Leads with hours and how to reach you. Best if you take walk-ins.',
    leads: 'Hours first',
  },
];

/**
 * Three hand-built layouts rather than a page builder. A studio owner picks
 * what their page leads with; everything below stays the same, so pages across
 * the marketplace stay comparable.
 */
const TemplatePicker: React.FC<TemplatePickerProps> = ({ value, onChange }) => (
  <Box>
    <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mb: 1.5 }}>
      Choose what visitors see first. You can change this whenever you like.
    </Typography>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
      {TEMPLATES.map((template) => {
        const selected = value === template.value;

        return (
          <Box
            key={template.value}
            onClick={() => onChange(template.value)}
            sx={{
              position: 'relative',
              p: 2,
              borderRadius: '10px',
              cursor: 'pointer',
              bgcolor: selected ? `${colors.accent}14` : colors.background,
              border: `1px solid ${selected ? colors.accent : colors.border}`,
              transition: 'border-color 0.15s',
              '&:hover': { borderColor: colors.accent },
            }}
          >
            {selected && (
              <CheckCircleIcon sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: 18,
                color: colors.accent,
              }} />
            )}

            <Typography sx={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: colors.accent,
              mb: 0.25,
            }}>
              {template.leads}
            </Typography>

            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary, mb: 0.5 }}>
              {template.label}
            </Typography>

            <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, lineHeight: 1.45 }}>
              {template.description}
            </Typography>
          </Box>
        );
      })}
    </Box>
  </Box>
);

export default TemplatePicker;
