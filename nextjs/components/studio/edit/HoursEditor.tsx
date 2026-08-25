import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Button, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { colors } from '@/styles/colors';
import type { WorkingHour } from '@/components/WorkingHoursModal';

const WorkingHoursModal = dynamic(() => import('@/components/WorkingHoursModal'), { ssr: false });

interface HoursEditorProps {
  value: WorkingHour[];
  onChange: (hours: WorkingHour[]) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Reuses the existing hours modal, but its result is held here rather than
 * saved, so hours publish with everything else.
 */
const HoursEditor: React.FC<HoursEditorProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const format = (time?: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${suffix}`;
  };

  return (
    <Box>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mb: 1.5 }}>
        Set the hours your door is open. Days you mark closed show as Closed.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
        {DAYS.map((day, index) => {
          const slot = value?.find((h: any) => h.day_of_week === index);
          const closed = !slot || (slot as any).is_day_off;

          return (
            <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>{day}</Typography>
              <Typography sx={{ color: closed ? colors.textMuted : colors.textPrimary, fontSize: '0.9rem' }}>
                {closed ? 'Closed' : `${format((slot as any).start_time)} - ${format((slot as any).end_time)}`}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Button
        onClick={() => setOpen(true)}
        startIcon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
        variant="outlined"
        fullWidth
        sx={{ color: colors.textPrimary, borderColor: colors.border, textTransform: 'none' }}
      >
        Change opening hours
      </Button>

      <WorkingHoursModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSave={(hours: WorkingHour[]) => {
          onChange(hours);
          setOpen(false);
        }}
        initialWorkingHours={value}
        title="Opening Hours"
        infoText="These show on your studio page. Nothing saves until you press Publish."
      />
    </Box>
  );
};

export default HoursEditor;
