import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Box, Typography, CircularProgress, Tab, Tabs } from '@mui/material';
import Layout from '@/components/Layout';
import ArtistCard from '@/components/ArtistCard';
import TattooCard from '@/components/TattooCard';
import SearchStudioCard from '@/components/SearchStudioCard';
import TattooModal from '@/components/TattooModal';
import { useAuth } from '@/contexts/AuthContext';
import { clientService } from '@/services/clientService';
import { colors } from '@/styles/colors';

type FavTab = 'artists' | 'tattoos' | 'studios';

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<FavTab>('artists');
  const [savedArtists, setSavedArtists] = useState<any[]>([]);
  const [savedTattoos, setSavedTattoos] = useState<any[]>([]);
  const [savedStudios, setSavedStudios] = useState<any[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [tattoosLoading, setTattoosLoading] = useState(true);
  const [studiosLoading, setStudiosLoading] = useState(true);

  const [selectedTattooId, setSelectedTattooId] = useState<string | null>(null);
  const [isTattooModalOpen, setIsTattooModalOpen] = useState(false);

  const fetchFavorites = useCallback(async () => {
    setArtistsLoading(true);
    setTattoosLoading(true);
    setStudiosLoading(true);

    try {
      const [artistRes, tattooRes, studioRes] = await Promise.all([
        clientService.getFavorites(),
        clientService.getSavedTattoos(),
        clientService.getSavedStudios(),
      ]);

      setSavedArtists(Array.isArray(artistRes?.favorites) ? artistRes.favorites : []);
      setSavedTattoos(Array.isArray(tattooRes?.tattoos) ? tattooRes.tattoos : []);
      setSavedStudios(Array.isArray(studioRes?.studios) ? studioRes.studios : []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setArtistsLoading(false);
      setTattoosLoading(false);
      setStudiosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchFavorites();
  }, [isAuthenticated, authLoading, fetchFavorites, router]);

  const handleTattooClick = (id: number) => {
    setSelectedTattooId(String(id));
    setIsTattooModalOpen(true);
  };

  const isLoading =
    activeTab === 'artists' ? artistsLoading :
    activeTab === 'tattoos' ? tattoosLoading :
    studiosLoading;

  const items =
    activeTab === 'artists' ? savedArtists :
    activeTab === 'tattoos' ? savedTattoos :
    savedStudios;

  const emptyMessage =
    activeTab === 'artists' ? 'No saved artists yet. Browse and save your favorites!' :
    activeTab === 'tattoos' ? 'No saved tattoos yet. Browse and save your favorites!' :
    'No saved studios yet. Browse and save your favorites!';

  const browseLink =
    activeTab === 'tattoos' ? '/tattoos' : '/artists';

  if (authLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: colors.accent }} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Favorites - InkedIn</title>
        <meta name="description" content="Your saved tattoos, artists, and studios on InkedIn" />
      </Head>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, pt: 4, pb: 6 }}>
        <Typography
          sx={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '2rem',
            fontWeight: 600,
            color: colors.textPrimary,
            mb: 3,
          }}
        >
          Favorites
        </Typography>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            borderBottom: `1px solid ${colors.borderSubtle}`,
            mb: 3,
            '& .MuiTab-root': {
              color: colors.textMuted,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minWidth: 'auto',
              px: 2,
            },
            '& .Mui-selected': {
              color: colors.accent,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colors.accent,
            },
          }}
        >
          <Tab
            value="artists"
            label={`Artists${!artistsLoading && savedArtists.length > 0 ? ` (${savedArtists.length})` : ''}`}
          />
          <Tab
            value="tattoos"
            label={`Tattoos${!tattoosLoading && savedTattoos.length > 0 ? ` (${savedTattoos.length})` : ''}`}
          />
          <Tab
            value="studios"
            label={`Studios${!studiosLoading && savedStudios.length > 0 ? ` (${savedStudios.length})` : ''}`}
          />
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: colors.accent }} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: colors.textMuted, fontSize: '1rem', mb: 2 }}>
              {emptyMessage}
            </Typography>
            <Box
              component="a"
              href={browseLink}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                router.push(browseLink);
              }}
              sx={{
                display: 'inline-block',
                px: 3,
                py: 1,
                bgcolor: colors.accent,
                color: colors.background,
                borderRadius: '24px',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': { bgcolor: colors.accentHover },
              }}
            >
              Browse
            </Box>
          </Box>
        ) : activeTab === 'artists' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {savedArtists.map((artist: any) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </Box>
        ) : activeTab === 'tattoos' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            {savedTattoos.map((tattoo: any) => (
              <TattooCard
                key={tattoo.id}
                tattoo={tattoo}
                onTattooClick={() => handleTattooClick(tattoo.id)}
              />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {savedStudios.map((studio: any) => (
              <SearchStudioCard key={studio.id} studio={{ ...studio, is_claimed: true }} />
            ))}
          </Box>
        )}
      </Box>

      {/* Tattoo Modal */}
      {isTattooModalOpen && selectedTattooId && (
        <TattooModal
          tattooId={selectedTattooId}
          artistName={null}
          open={isTattooModalOpen}
          onClose={() => {
            setIsTattooModalOpen(false);
            fetchFavorites();
          }}
          tattooFavorite={true}
        />
      )}
    </Layout>
  );
}
