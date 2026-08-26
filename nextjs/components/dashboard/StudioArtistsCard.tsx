import React from 'react';
import { Box, Typography, Button, Avatar } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '@/styles/colors';
import Card from './Card';
import type { StudioArtist } from './types';

interface StudioArtistsCardProps {
  studioArtists: StudioArtist[];
  currentUserId?: number;
  onAddArtist: () => void;
  onVerifyArtist: (artistId: number) => void;
  onRemoveArtist: (artistId: number) => void;
}

/**
 * Pending and unverified artists at the studio. Extracted from the dashboard
 * page so the studio surface can grow on its own.
 */
const StudioArtistsCard: React.FC<StudioArtistsCardProps> = ({
  studioArtists,
  currentUserId,
  onAddArtist,
  onVerifyArtist,
  onRemoveArtist,
}) => {
  const handleVerifyArtist = onVerifyArtist;
  const handleRemoveArtist = onRemoveArtist;

  return (
              <Card
                title="Studio Artists"
                subtitle="Manage pending artist requests or add artists to your studio"
                icon={<HourglassEmptyIcon />}
              >
                <Box sx={{
                  display: 'flex',
                  gap: 2,
                  p: 2,
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': { height: 6 },
                  '&::-webkit-scrollbar-track': { bgcolor: colors.background, borderRadius: 3 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: colors.border, borderRadius: 3 },
                }}>
                  {/* Pending Artists */}
                  {studioArtists.filter(a => !a.is_verified && a.id !== currentUserId).map((artist) => {
                    const artistInitials = artist.name
                      ? artist.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : artist.username?.slice(0, 2).toUpperCase() || 'AR';
                    const isStudioInvite = artist.initiated_by === 'studio';
                    return (
                      <Box
                        key={artist.id}
                        sx={{
                          minWidth: 140,
                          textAlign: 'center',
                          p: 2,
                          bgcolor: `${colors.accent}08`,
                          borderRadius: '12px',
                          border: `1px solid ${colors.accent}30`,
                        }}
                      >
                        <Avatar
                          src={artist.image?.uri}
                          sx={{
                            width: 64,
                            height: 64,
                            mx: 'auto',
                            mb: 1,
                            bgcolor: colors.background,
                            color: colors.textSecondary,
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        >
                          {artistInitials}
                        </Avatar>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.85rem', mb: 0.25 }}>
                          {artist.name || artist.username}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: isStudioInvite ? 0.5 : 1.5 }}>
                          @{artist.username}
                        </Typography>
                        {isStudioInvite ? (
                          /* Studio invited this artist - waiting for them to accept */
                          <>
                            <Typography sx={{ fontSize: '0.75rem', color: colors.accent, fontWeight: 500, mb: 1.5 }}>
                              Invitation pending
                            </Typography>
                            <Button
                              onClick={() => handleRemoveArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'transparent',
                                border: `1px solid ${colors.border}`,
                                color: colors.textMuted,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { borderColor: colors.error, color: colors.error }
                              }}
                            >
                              Cancel Invite
                            </Button>
                          </>
                        ) : (
                          /* Artist requested to join - studio can verify/reject */
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              onClick={() => handleVerifyArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: colors.success,
                                color: colors.background,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { bgcolor: colors.success, opacity: 0.9 }
                              }}
                            >
                              Verify
                            </Button>
                            <Button
                              onClick={() => handleRemoveArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'transparent',
                                border: `1px solid ${colors.border}`,
                                color: colors.textMuted,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { borderColor: colors.error, color: colors.error }
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                      </Box>
                    );
                  })}

                  {/* Add Artist Card */}
                  <Box
                    onClick={() => onAddArtist()}
                    sx={{
                      minWidth: 140,
                      textAlign: 'center',
                      p: 2,
                      bgcolor: colors.background,
                      borderRadius: '12px',
                      border: `2px dashed ${colors.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        borderColor: colors.accent,
                        bgcolor: `${colors.accent}08`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: `${colors.accent}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      <PersonAddIcon sx={{ fontSize: 28, color: colors.accent }} />
                    </Box>
                    <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.85rem', mb: 0.25 }}>
                      Add Artist
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                      By username or email
                    </Typography>
                  </Box>
                </Box>

                {/* Empty state message when no pending artists */}
                {studioArtists.filter(a => !a.is_verified && a.id !== currentUserId).length === 0 && (
                  <Typography sx={{
                    color: colors.textMuted,
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    pb: 2,
                    mt: -1
                  }}>
                    No pending artist requests. Add artists to your studio using their username or email.
                  </Typography>
                )}
              </Card>
  );
};

export default StudioArtistsCard;
