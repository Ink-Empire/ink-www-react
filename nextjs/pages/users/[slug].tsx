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
  Chip,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
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
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, pt: 6, pb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={profile.image?.uri}
            sx={{ width: 100, height: 100, bgcolor: colors.surfaceElevated }}
          >
            {profile.name?.charAt(0)?.toUpperCase()}
          </Avatar>

          <Typography sx={{ color: colors.textPrimary, fontSize: 28, fontWeight: 700 }}>
            {profile.name}
          </Typography>

          {profile.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PlaceIcon sx={{ color: colors.textMuted, fontSize: 16 }} />
              <Typography sx={{ color: colors.textMuted, fontSize: 14 }}>
                {profile.location}
              </Typography>
            </Box>
          )}

          {profile.about && (
            <Typography sx={{
              color: colors.textSecondary,
              fontSize: 15,
              lineHeight: 1.6,
              textAlign: 'center',
              maxWidth: 500,
            }}>
              {profile.about}
            </Typography>
          )}

          {profile.social_media_links && profile.social_media_links.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {profile.social_media_links.map(link => (
                <Chip
                  key={link.platform}
                  label={`@${link.username}`}
                  size="small"
                  sx={{
                    bgcolor: colors.surfaceElevated,
                    color: colors.textSecondary,
                    fontSize: 13,
                  }}
                />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: colors.textPrimary, fontSize: 24, fontWeight: 700 }}>
                {profile.uploaded_tattoo_count}
              </Typography>
              <Typography sx={{ color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Tattoos
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ borderBottom: `1px solid ${colors.surfaceElevated}`, mt: 4 }} />
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
