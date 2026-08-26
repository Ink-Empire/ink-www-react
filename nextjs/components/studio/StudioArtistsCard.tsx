import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { colors } from '@/styles/colors';

interface StudioArtistsCardProps {
  artists?: any;
  slug?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioArtistsCard: React.FC<StudioArtistsCardProps> = ({
  artists,
  slug,
}) => (
  <>
              {/* Artists Card */}
              {artists && artists.length > 0 && (
                <Box sx={{
                  bgcolor: colors.surface,
                  borderRadius: '12px',
                  p: 2,
                  border: `1px solid ${colors.border}`
                }}>
                  <Typography sx={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    mb: 1.5,
                    color: colors.textPrimary
                  }}>
                    Artists ({artists.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {artists.slice(0, 5).map((artist: any) => (
                      <Link
                        key={artist.id}
                        href={`/artists/${artist.slug || artist.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1,
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: colors.background }
                        }}>
                          {(artist.image?.uri || artist.primary_image?.uri) ? (
                            <Box sx={{
                              width: 40,
                              height: 40,
                              position: 'relative',
                              borderRadius: '50%',
                              overflow: 'hidden'
                            }}>
                              <Image
                                src={artist.image?.uri || artist.primary_image?.uri}
                                alt={artist.name}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </Box>
                          ) : (
                            <Avatar sx={{
                              width: 40,
                              height: 40,
                              bgcolor: colors.background,
                              color: colors.accent,
                              fontSize: '0.9rem',
                              fontWeight: 600
                            }}>
                              {artist.name?.charAt(0) || 'A'}
                            </Avatar>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{
                              fontWeight: 500,
                              fontSize: '0.9rem',
                              color: colors.textPrimary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {artist.name}
                            </Typography>
                            {artist.specialty && (
                              <Typography sx={{
                                fontSize: '0.75rem',
                                color: colors.textMuted,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {artist.specialty}
                              </Typography>
                            )}
                          </Box>
                          {artist.books_open && (
                            <Box sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: '100px',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              bgcolor: `${colors.success}26`,
                              color: colors.success
                            }}>
                              Books Open
                            </Box>
                          )}
                        </Box>
                      </Link>
                    ))}
                    {artists.length > 5 && (
                      <Link href={`/studios/${slug}/artists`} style={{ textDecoration: 'none' }}>
                        <Typography sx={{
                          fontSize: '0.85rem',
                          color: colors.accent,
                          fontWeight: 500,
                          textAlign: 'center',
                          py: 1,
                          '&:hover': { textDecoration: 'underline' }
                        }}>
                          View all {artists.length} artists →
                        </Typography>
                      </Link>
                    )}
                  </Box>
                </Box>
              )}
  </>
);

export default StudioArtistsCard;
