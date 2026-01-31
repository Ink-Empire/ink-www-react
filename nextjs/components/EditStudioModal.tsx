import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, IconButton, Avatar, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { colors } from '@/styles/colors';
import { studioService } from '@/services/studioService';

interface StudioData {
  id: number;
  name: string;
  slug?: string;
  about?: string;
  email?: string;
  image?: { uri?: string };
}

interface EditStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  studio: StudioData | null;
  onSave: (updatedStudio: StudioData) => void;
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

const EditStudioModal: React.FC<EditStudioModalProps> = ({ isOpen, onClose, studio, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    email: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (studio && isOpen) {
      setFormData({
        name: studio.name || '',
        about: studio.about || '',
        email: studio.email || '',
      });
      setImagePreview(studio.image?.uri || null);
      setImageFile(null);
      setError(null);
    }
  }, [studio, isOpen]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!studio) return;

    setIsSaving(true);
    setError(null);

    try {
      // Update studio info
      await studioService.updateDetails(studio.id, formData);

      // Upload image if changed
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        await studioService.uploadImageFile(studio.id, imageFormData);
      }

      // Fetch updated studio data
      const studioResponse = await studioService.getById(studio.id);
      onSave(studioResponse.studio || studioResponse as unknown as StudioData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update studio');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const studioInitials = formData.name
    ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          bgcolor: colors.surface,
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
            Edit Studio Profile
          </Typography>
          <IconButton onClick={onClose} sx={{ color: colors.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          {/* Studio Image */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={imagePreview || undefined}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: colors.background,
                  color: colors.textSecondary,
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={handleImageClick}
              >
                {!imagePreview && studioInitials}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  bgcolor: colors.accent,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                onClick={handleImageClick}
              >
                <CameraAltIcon sx={{ fontSize: 18, color: colors.background }} />
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </Box>
          </Box>

          {/* Form Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Studio Name"
              value={formData.name}
              onChange={handleChange('name')}
              fullWidth
              size="small"
              sx={inputStyles}
            />

            <TextField
              label="About"
              value={formData.about}
              onChange={handleChange('about')}
              fullWidth
              multiline
              rows={4}
              size="small"
              sx={inputStyles}
            />

            <TextField
              label="Email (optional)"
              value={formData.email}
              onChange={handleChange('email')}
              fullWidth
              size="small"
              type="email"
              sx={inputStyles}
            />
          </Box>

          {error && (
            <Typography sx={{ color: colors.error, fontSize: '0.85rem', mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          p: 2,
          borderTop: `1px solid ${colors.border}`,
        }}>
          <Button
            onClick={onClose}
            sx={{
              flex: 1,
              py: 1,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              textTransform: 'none',
              '&:hover': { borderColor: colors.borderLight },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              flex: 1,
              py: 1,
              bgcolor: colors.accent,
              color: colors.background,
              borderRadius: '6px',
              textTransform: 'none',
              '&:hover': { bgcolor: colors.accentHover },
              '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
            }}
          >
            {isSaving ? <CircularProgress size={20} sx={{ color: colors.background }} /> : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EditStudioModal;
