import React, { useRef } from 'react';
import { Box, Avatar, TextField, Typography, Button } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { colors } from '@/styles/colors';

interface StudioDetailsEditorProps {
  name: string;
  about: string;
  photoPreview?: string | null;
  onNameChange: (value: string) => void;
  onAboutChange: (value: string) => void;
  onPhotoChange: (file: File) => void;
}

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    bgcolor: colors.background,
    color: colors.textPrimary,
    '& fieldset': { borderColor: colors.border },
    '&:hover fieldset': { borderColor: colors.borderLight },
    '&.Mui-focused fieldset': { borderColor: colors.accent },
  },
  '& .MuiInputLabel-root': { color: colors.textSecondary },
  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
};

/**
 * Name, description and studio photo. Changes stay in the page until Publish.
 */
const StudioDetailsEditor: React.FC<StudioDetailsEditorProps> = ({
  name,
  about,
  photoPreview,
  onNameChange,
  onAboutChange,
  onPhotoChange,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPhotoChange(file);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={photoPreview || undefined}
            variant="rounded"
            onClick={() => fileRef.current?.click()}
            sx={{
              width: 72,
              height: 72,
              borderRadius: '8px',
              bgcolor: colors.background,
              color: colors.accent,
              cursor: 'pointer',
              border: `1px solid ${colors.border}`,
            }}
          >
            {name?.substring(0, 2).toUpperCase() || 'ST'}
          </Avatar>
          <Box
            onClick={() => fileRef.current?.click()}
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 26,
              height: 26,
              bgcolor: colors.accent,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <CameraAltIcon sx={{ fontSize: 15, color: colors.background }} />
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
            Studio photo
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
            A square logo or shopfront works best.
          </Typography>
          <Button
            onClick={() => fileRef.current?.click()}
            size="small"
            sx={{ mt: 0.5, ml: -0.75, color: colors.accent, textTransform: 'none' }}
          >
            Choose a photo
          </Button>
        </Box>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </Box>

      <TextField
        label="Studio name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        fullWidth
        size="small"
        sx={inputStyles}
      />

      <TextField
        label="About your studio"
        placeholder="What should someone know before they walk in?"
        value={about}
        onChange={(e) => onAboutChange(e.target.value)}
        fullWidth
        multiline
        rows={4}
        sx={inputStyles}
      />
    </Box>
  );
};

export default StudioDetailsEditor;
