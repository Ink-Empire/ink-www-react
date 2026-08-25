import React, { useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { colors } from '@/styles/colors';

interface BannerEditorProps {
  bannerPreview?: string | null;
  onBannerChange: (file: File) => void;
  onBannerRemove: () => void;
}

/**
 * The wide header image. A studio with none keeps the original page header.
 */
const BannerEditor: React.FC<BannerEditorProps> = ({
  bannerPreview,
  onBannerChange,
  onBannerRemove,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onBannerChange(file);
  };

  return (
    <Box>
      <Box
        onClick={() => fileRef.current?.click()}
        sx={{
          width: '100%',
          aspectRatio: '4 / 1',
          minHeight: 100,
          borderRadius: '8px',
          cursor: 'pointer',
          bgcolor: colors.background,
          border: `1px dashed ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&:hover': { borderColor: colors.accent },
        }}
      >
        {!bannerPreview && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colors.textSecondary }}>
            <CameraAltIcon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: '0.9rem' }}>Add a wide banner image</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <Button
          onClick={() => fileRef.current?.click()}
          size="small"
          sx={{ color: colors.accent, textTransform: 'none' }}
        >
          {bannerPreview ? 'Change banner' : 'Choose an image'}
        </Button>
        {bannerPreview && (
          <Button
            onClick={onBannerRemove}
            size="small"
            sx={{ color: colors.textSecondary, textTransform: 'none' }}
          >
            Remove banner
          </Button>
        )}
      </Box>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default BannerEditor;
