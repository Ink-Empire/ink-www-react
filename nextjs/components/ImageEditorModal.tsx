import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Slider,
  Switch,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import RestoreIcon from '@mui/icons-material/Restore';
import { colors } from '@/styles/colors';
import { buildImgixUrl } from '@inkedin/shared/utils/imgix';
import { imageService } from '@/services/imageService';
import type { ImageEditParams } from '@inkedin/shared/types';

interface ImageEditorModalProps {
  isOpen: boolean;
  image: { id: number; uri: string; edit_params?: ImageEditParams | null } | null;
  onClose: () => void;
  onSave: (imageId: number, editParams: ImageEditParams) => void;
}

const DEFAULT_PARAMS: ImageEditParams = {
  bri: 0,
  con: 0,
  sat: 0,
  sharp: 0,
  sepia: 0,
  hue_shift: 0,
  rot: 0,
  mono: false,
  auto_enhance: false,
};

const sliderSx = {
  color: colors.accent,
  '& .MuiSlider-thumb': {
    bgcolor: colors.accent,
  },
  '& .MuiSlider-track': {
    bgcolor: colors.accent,
  },
  '& .MuiSlider-rail': {
    bgcolor: colors.surfaceElevated,
  },
};

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  image,
  onClose,
  onSave,
}) => {
  const [params, setParams] = useState<ImageEditParams>(DEFAULT_PARAMS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (image?.edit_params) {
      setParams({ ...DEFAULT_PARAMS, ...image.edit_params });
    } else {
      setParams(DEFAULT_PARAMS);
    }
    setError(null);
  }, [image]);

  const updateParam = useCallback((key: keyof ImageEditParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleRotate = useCallback(() => {
    setParams(prev => ({
      ...prev,
      rot: (((prev.rot || 0) + 90) % 360) as 0 | 90 | 180 | 270,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  const handleSave = async () => {
    if (!image) return;
    setSaving(true);
    setError(null);
    try {
      await imageService.updateEditParams(image.id, params);
      onSave(image.id, params);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save edits');
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = image?.uri
    ? buildImgixUrl(image.uri, params)
    : '';

  if (!image) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.surface,
          color: colors.textPrimary,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${colors.border}`,
        py: 1.5,
      }}>
        <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Edit Photo
        </Typography>
        <IconButton onClick={onClose} sx={{ color: colors.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Preview */}
        <Box sx={{
          flex: 1,
          minHeight: { xs: 250, md: 400 },
          bgcolor: colors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: { xs: 250, md: 400 },
                objectFit: 'contain',
                borderRadius: '4px',
              }}
            />
          )}
        </Box>

        {/* Controls */}
        <Box sx={{
          width: { xs: '100%', md: 300 },
          flexShrink: 0,
          p: 2.5,
          overflowY: 'auto',
          borderLeft: { md: `1px solid ${colors.border}` },
          borderTop: { xs: `1px solid ${colors.border}`, md: 'none' },
        }}>
          {/* Brightness */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Brightness
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                {params.bri || 0}
              </Typography>
            </Box>
            <Slider
              value={params.bri || 0}
              min={-100}
              max={100}
              onChange={(_, v) => updateParam('bri', v as number)}
              sx={sliderSx}
            />
          </Box>

          {/* Contrast */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Contrast
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                {params.con || 0}
              </Typography>
            </Box>
            <Slider
              value={params.con || 0}
              min={-100}
              max={100}
              onChange={(_, v) => updateParam('con', v as number)}
              sx={sliderSx}
            />
          </Box>

          {/* Saturation */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Saturation
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                {params.sat || 0}
              </Typography>
            </Box>
            <Slider
              value={params.sat || 0}
              min={-100}
              max={100}
              onChange={(_, v) => updateParam('sat', v as number)}
              sx={sliderSx}
            />
          </Box>

          {/* Sharpness */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Sharpness
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                {params.sharp || 0}
              </Typography>
            </Box>
            <Slider
              value={params.sharp || 0}
              min={0}
              max={100}
              onChange={(_, v) => updateParam('sharp', v as number)}
              sx={sliderSx}
            />
          </Box>

          {/* Sepia */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Sepia
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                {params.sepia || 0}
              </Typography>
            </Box>
            <Slider
              value={params.sepia || 0}
              min={0}
              max={100}
              onChange={(_, v) => updateParam('sepia', v as number)}
              sx={sliderSx}
            />
          </Box>

          {/* Hue Shift */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Hue Shift
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                {params.hue_shift || 0}
              </Typography>
            </Box>
            <Slider
              value={params.hue_shift || 0}
              min={0}
              max={359}
              onChange={(_, v) => updateParam('hue_shift', v as number)}
              sx={sliderSx}
            />
          </Box>

          {/* Rotation */}
          <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
              Rotation: {params.rot || 0}
            </Typography>
            <IconButton onClick={handleRotate} sx={{ color: colors.accent }}>
              <RotateRightIcon />
            </IconButton>
          </Box>

          {/* B&W Toggle */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
              Black & White
            </Typography>
            <Switch
              checked={params.mono || false}
              onChange={(_, checked) => updateParam('mono', checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.accent },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colors.accentDark },
              }}
            />
          </Box>

          {/* Auto-enhance Toggle */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
              Auto-enhance
            </Typography>
            <Switch
              checked={params.auto_enhance || false}
              onChange={(_, checked) => updateParam('auto_enhance', checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.accent },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colors.accentDark },
              }}
            />
          </Box>

          {/* Reset Button */}
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
            fullWidth
            sx={{
              mt: 1,
              color: colors.textSecondary,
              borderColor: colors.border,
              textTransform: 'none',
              '&:hover': {
                borderColor: colors.accent,
                color: colors.accent,
              },
            }}
          >
            Reset All
          </Button>
        </Box>
      </DialogContent>

      {error && (
        <Box sx={{ px: 3, pb: 1 }}>
          <Typography sx={{ fontSize: '0.85rem', color: colors.error }}>
            {error}
          </Typography>
        </Box>
      )}

      <DialogActions sx={{
        borderTop: `1px solid ${colors.border}`,
        px: 3,
        py: 1.5,
      }}>
        <Button
          onClick={onClose}
          sx={{
            color: colors.textSecondary,
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          sx={{
            bgcolor: colors.accent,
            color: colors.background,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: colors.accentHover },
            '&.Mui-disabled': { bgcolor: colors.accentDark, color: colors.textMuted },
          }}
        >
          {saving ? <CircularProgress size={20} sx={{ color: colors.background }} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageEditorModal;
