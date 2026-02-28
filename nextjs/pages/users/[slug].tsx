import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { colors } from '@/styles/colors';
import { useUserProfile, useUserTattoos } from '@/hooks';
import TattooModal from '@/components/TattooModal';

export default function UserProfilePage() {
  const router = useRouter();
  const { slug } = router.query;
  const slugString = typeof slug === 'string' ? slug : null;

  const { profile, loading: profileLoading } = useUserProfile(slugString);
  const { tattoos, loading: tattoosLoading, loadMore, lastPage, page } = useUserTattoos(slugString);

  const [selectedTattooId, setSelectedTattooId] = useState<string | null>(null);
  const [isTattooModalOpen, setIsTattooModalOpen] = useState(false);

  const handleTattooClick = (id: number) => {
    setSelectedTattooId(String(id));
    setIsTattooModalOpen(true);
  };

  if (profileLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: colors.accent }} />
        </Box>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography sx={{ color: colors.textMuted, fontSize: 18 }}>
            User not found
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{profile.name} - InkedIn</title>
        <meta name="description" content={profile.about || `${profile.name}'s tattoo collection on InkedIn`} />
      </Head>

      {/* Profile Header */}
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, pt: 4, pb: 4 }}>
        <Box sx={{
          display: 'flex',
          gap: 3,
          mb: 4,
          pb: 3,
          borderBottom: `1px solid ${colors.border}`,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}>
          {/* Avatar */}
          {profile.image?.uri ? (
            <Box sx={{
              width: 120,
              height: 120,
              position: 'relative',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: `2px solid ${colors.accent}4D`,
            }}>
              <Image
                src={profile.image.uri}
                alt={profile.name || 'User'}
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>
          ) : (
            <Avatar sx={{
              width: 120,
              height: 120,
              bgcolor: colors.surface,
              color: colors.accent,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '3rem',
              border: `2px solid ${colors.accent}4D`,
            }}>
              {profile.name?.charAt(0) || 'U'}
            </Avatar>
          )}

          {/* User Details */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '2.5rem',
              fontWeight: 500,
              color: colors.textPrimary,
              mb: 0.25,
              lineHeight: 1.2,
            }}>
              {profile.name}
            </Typography>

            {profile.location && (
              <Typography sx={{
                color: colors.textSecondary,
                fontSize: '0.95rem',
                mb: 0.75,
              }}>
                {profile.location}
              </Typography>
            )}

            {profile.about && (
              <Typography sx={{
                color: colors.textSecondary,
                fontSize: '0.95rem',
                lineHeight: 1.7,
                maxWidth: 500,
              }}>
                {profile.about}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tattoo Grid */}
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, pb: 6 }}>
        {tattoosLoading && tattoos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} sx={{ color: colors.accent }} />
          </Box>
        ) : tattoos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: colors.textMuted, fontSize: 16 }}>
              No tattoos yet
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
              gap: 1,
            }}>
              {tattoos.map((tattoo: any) => {
                const imageUri = tattoo.primary_image?.uri || tattoo.images?.[0]?.uri;
                return (
                  <Box
                    key={tattoo.id}
                    onClick={() => handleTattooClick(tattoo.id)}
                    sx={{
                      position: 'relative',
                      paddingBottom: '100%',
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      bgcolor: colors.surfaceElevated,
                      '&:hover': { opacity: 0.85 },
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {imageUri && (
                      <Image
                        src={imageUri}
                        alt={tattoo.title || 'Tattoo'}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 600px) 50vw, 33vw"
                      />
                    )}
                  </Box>
                );
              })}
            </Box>

            {page < lastPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Box
                  onClick={loadMore}
                  sx={{
                    px: 4, py: 1.5, borderRadius: 2,
                    border: `1px solid ${colors.accent}`,
                    color: colors.accent,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    '&:hover': { bgcolor: colors.accentDim },
                  }}
                >
                  Load More
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Tattoo Modal */}
      {isTattooModalOpen && selectedTattooId && (
        <TattooModal
          tattooId={selectedTattooId}
          open={isTattooModalOpen}
          onClose={() => setIsTattooModalOpen(false)}
        />
      )}
    </Layout>
  );
}
