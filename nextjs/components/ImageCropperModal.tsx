import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
  Slider,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import CloseIcon from '@mui/icons-material/Close';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { colors } from '@/styles/colors';
import { getCroppedImage } from '@/utils/cropImage';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((value: number) => {
    setZoom(value);
  }, []);

  const onCropCompleteInternal = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 1));
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels, rotation);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.background,
          color: colors.textPrimary,
          borderRadius: isMobile ? 0 : 2,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <IconButton
          onClick={handleClose}
          disabled={isProcessing}
          sx={{ color: colors.textPrimary }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Crop Photo
        </Typography>
        <Button
          onClick={handleSave}
          disabled={isProcessing || !croppedAreaPixels}
          sx={{
            color: colors.accent,
            fontWeight: 600,
            textTransform: 'none',
            minWidth: 'auto',
            '&:disabled': { color: colors.textMuted },
          }}
        >
          {isProcessing ? 'Saving...' : 'Done'}
        </Button>
      </Box>

      {/* Crop Area */}
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            flex: 1,
            minHeight: isMobile ? 'calc(100vh - 200px)' : 400,
            bgcolor: colors.background,
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
          />
        </Box>

        {/* Controls */}
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: colors.surface,
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          {/* Zoom Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <IconButton
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              sx={{
                color: colors.textSecondary,
                bgcolor: colors.surfaceElevated,
                width: 44,
                height: 44,
                '&:hover': { bgcolor: colors.surfaceHover },
                '&:disabled': { color: colors.textMuted },
              }}
            >
              <ZoomOutIcon />
            </IconButton>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_, value) => onZoomChange(value as number)}
              sx={{
                flex: 1,
                color: colors.accent,
                height: 6,
                '& .MuiSlider-thumb': {
                  width: 20,
                  height: 20,
                  bgcolor: colors.accent,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0 0 0 8px ${colors.accentDim}`,
                  },
                },
                '& .MuiSlider-track': {
                  bgcolor: colors.accent,
                },
                '& .MuiSlider-rail': {
                  bgcolor: colors.border,
                },
              }}
            />
            <IconButton
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              sx={{
                color: colors.textSecondary,
                bgcolor: colors.surfaceElevated,
                width: 44,
                height: 44,
                '&:hover': { bgcolor: colors.surfaceHover },
                '&:disabled': { color: colors.textMuted },
              }}
            >
              <ZoomInIcon />
            </IconButton>
          </Box>

          {/* Rotate Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={handleRotate}
              startIcon={<RotateRightIcon />}
              sx={{
                color: colors.textSecondary,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: '8px',
                bgcolor: colors.surfaceElevated,
                '&:hover': { bgcolor: colors.surfaceHover },
              }}
            >
              Rotate
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: colors.textMuted,
              mt: 2,
              display: 'block',
              textAlign: 'center',
            }}
          >
            Pinch to zoom. Drag to reposition.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropperModal;
