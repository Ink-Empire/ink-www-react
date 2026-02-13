import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InstagramIcon from '@mui/icons-material/Instagram';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import { colors } from '@/styles/colors';

interface UploadDropzoneProps {
  onFileSelect: (file: File, source: 'instagram' | 'manual') => void;
  maxSizeMB?: number;
}

export default function UploadDropzone({ onFileSelect, maxSizeMB = 500 }: UploadDropzoneProps) {
  const [source, setSource] = useState<'instagram' | 'manual' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (!source) {
        setError('Please select what type of upload this is first.');
        return;
      }

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Please upload a ZIP file.');
        } else {
          setError('Invalid file. Please upload a ZIP file.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0], source);
      }
    },
    [onFileSelect, source, maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    noClick: true,
  });

  return (
    <Card sx={{
      bgcolor: colors.surface,
      border: `1px solid ${colors.border}`,
      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px ${colors.accent}20`,
    }}>
      <CardContent sx={{ p: 0 }}>
        {/* Source Selection */}
        <Box sx={{ p: 3, borderBottom: source ? `1px solid ${colors.border}` : 'none' }}>
          <Typography variant="h6" sx={{ mb: 2, color: colors.textPrimary, fontWeight: 600 }}>
            What are you uploading?
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box
              onClick={() => setSource('instagram')}
              sx={{
                p: 3,
                borderRadius: 2,
                cursor: 'pointer',
                border: `1px solid ${source === 'instagram' ? colors.accent : colors.border}`,
                bgcolor: source === 'instagram' ? `${colors.accent}15` : 'transparent',
                boxShadow: source === 'instagram'
                  ? `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px ${colors.accent}25`
                  : `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px ${colors.accent}15`,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: colors.accent,
                  bgcolor: `${colors.accent}10`,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <InstagramIcon sx={{ fontSize: 24, color: colors.accent }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: colors.textPrimary }}>
                  Instagram Export
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Import your tattoo portfolio directly from an Instagram data export ZIP file.
              </Typography>
            </Box>
            <Box
              onClick={() => setSource('manual')}
              sx={{
                p: 3,
                borderRadius: 2,
                cursor: 'pointer',
                border: `1px solid ${source === 'manual' ? colors.accent : colors.border}`,
                bgcolor: source === 'manual' ? `${colors.accent}15` : 'transparent',
                boxShadow: source === 'manual'
                  ? `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px ${colors.accent}25`
                  : `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px ${colors.accent}15`,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: colors.accent,
                  bgcolor: `${colors.accent}10`,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <FolderZipIcon sx={{ fontSize: 24, color: colors.accent }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: colors.textPrimary }}>
                  ZIP of Images
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Upload a ZIP file containing your tattoo images (JPG, PNG, WebP, GIF).
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Dropzone - only show when source is selected */}
        {source ? (
          <Box
            {...getRootProps()}
            sx={{
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? colors.background : 'transparent',
              transition: 'background-color 0.2s',
              borderBottom: `1px solid ${colors.border}`,
              '&:hover': {
                bgcolor: colors.background,
              },
            }}
            onClick={open}
          >
            <input {...getInputProps()} />

            <CloudUploadIcon
              sx={{
                fontSize: 64,
                color: isDragActive ? colors.accent : colors.textMuted,
                mb: 2,
              }}
            />

            {isDragActive ? (
              <Typography variant="h6" sx={{ color: colors.accent }}>
                Drop your ZIP file here
              </Typography>
            ) : (
              <>
                <Typography variant="h6" sx={{ mb: 1, color: colors.textPrimary }}>
                  Drag & drop your ZIP file here
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
                  or click to browse
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    bgcolor: colors.accent,
                    color: colors.background,
                    '&:hover': { bgcolor: colors.accentHover },
                  }}
                >
                  Select ZIP File
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 2, color: colors.textMuted }}>
                  Maximum file size: {maxSizeMB}MB
                </Typography>
              </>
            )}
          </Box>
        ) : null}

        {error && (
          <Alert
            severity="error"
            sx={{
              m: 2,
              bgcolor: `${colors.error}15`,
              color: colors.error,
              border: `1px solid ${colors.error}`,
              '& .MuiAlert-icon': { color: colors.error },
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Instructions - only show when source is selected */}
        {source && (
          <Box sx={{ p: 2, bgcolor: colors.background }}>
            {source === 'instagram' ? (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: colors.textPrimary, fontWeight: 600 }}>
                  How to get your Instagram export:
                </Typography>
                <Typography
                  variant="body2"
                  component="ol"
                  sx={{
                    pl: 2,
                    m: 0,
                    color: colors.textSecondary,
                    '& li': {
                      mb: 0.75,
                      lineHeight: 1.6,
                    },
                  }}
                >
                  <li>Open Instagram and go to <strong>Settings &gt; Accounts Center &gt; Your information and permissions</strong></li>
                  <li>Select <strong>"Export your information"</strong></li>
                  <li>Tap <strong>"Create export"</strong> and choose your profile</li>
                  <li>Select <strong>"Export to device"</strong></li>
                  <li>Tap <strong>"Customize information"</strong>, then clear all categories and select only <strong>"Media"</strong></li>
                  <li>Set your desired <strong>date range</strong> and choose <strong>JSON format</strong></li>
                  <li>Submit request — Instagram will email you when your export is ready (can take up to 48 hours)</li>
                  <li>Download the ZIP file from your email and upload it here</li>
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: colors.textPrimary, fontWeight: 600 }}>
                  ZIP file requirements:
                </Typography>
                <Typography
                  variant="body2"
                  component="ul"
                  sx={{
                    pl: 2,
                    m: 0,
                    color: colors.textSecondary,
                    '& li': {
                      mb: 0.75,
                      lineHeight: 1.6,
                    },
                  }}
                >
                  <li>Supported formats: JPG, PNG, WebP, GIF</li>
                  <li>Images can be in folders or at the root level</li>
                  <li>Maximum {maxSizeMB}MB total file size</li>
                  <li>Videos will be skipped</li>
                </Typography>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
