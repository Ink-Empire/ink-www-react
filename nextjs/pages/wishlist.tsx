import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  IconButton,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LockIcon from '@mui/icons-material/Lock';
import Layout from '../components/Layout';
import TattooModal from '../components/TattooModal';
import { useWishlist } from '@/hooks/useClientDashboard';
import { useAuth, useUserData } from '@/contexts/AuthContext';
import { clientService } from '@/services/clientService';
import { colors } from '@/styles/colors';

export default function WishlistPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const userData = useUserData();
  const { wishlist, loading, error, removeFromWishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState(0);
  const [savedTattoos, setSavedTattoos] = useState<any[]>([]);
  const [tattoosLoading, setTattoosLoading] = useState(true);
  const [selectedTattooId, setSelectedTattooId] = useState<string | null>(null);
  const [isTattooModalOpen, setIsTattooModalOpen] = useState(false);

  useEffect(() => {
    const loadSavedTattoos = async () => {
      if (!isAuthenticated) return;
      setTattoosLoading(true);
      try {
        const response = await clientService.getSavedTattoos();
        setSavedTattoos(response.tattoos || []);
      } catch (err) {
        console.error('Failed to load saved tattoos:', err);
      } finally {
        setTattoosLoading(false);
      }
    };
    loadSavedTattoos();
  }, [isAuthenticated]);

  const handleUnsaveTattoo = async (tattooId: number) => {
    try {
      await userData?.toggleFavorite('tattoo', tattooId);
      setSavedTattoos(prev => prev.filter(t => t.id !== tattooId));
    } catch (err) {
      console.error('Failed to unsave tattoo:', err);
    }
  };

  const handleTattooClick = (tattooId: string) => {
    setSelectedTattooId(tattooId);
    setIsTattooModalOpen(true);
  };

  const handleCloseTattooModal = () => {
    setIsTattooModalOpen(false);
    setSelectedTattooId(null);
  };

  const getCurrentTattoo = () => {
    if (!selectedTattooId) return null;
    return savedTattoos.find(t => t.id.toString() === selectedTattooId);
  };

  const getCurrentTattooIndex = () => {
    if (!selectedTattooId) return -1;
    return savedTattoos.findIndex(t => t.id.toString() === selectedTattooId);
  };

  const handlePreviousTattoo = () => {
    const currentIndex = getCurrentTattooIndex();
    if (currentIndex > 0) {
      setSelectedTattooId(savedTattoos[currentIndex - 1].id.toString());
    }
  };

  const handleNextTattoo = () => {
    const currentIndex = getCurrentTattooIndex();
    if (currentIndex < savedTattoos.length - 1) {
      setSelectedTattooId(savedTattoos[currentIndex + 1].id.toString());
    }
  };

  const getTattooFavoriteStatus = () => {
    if (!selectedTattooId) return false;
    return savedTattoos.some(t => t.id.toString() === selectedTattooId);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: colors.accent }} />
        </Box>
      </Layout>
    );
  }

  // Show login prompt if not authenticated (no redirect)
  if (!isAuthenticated) {
    return (
      <Layout>
        <Head>
          <title>Saved Artists | InkedIn</title>
        </Head>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            p: 3,
            textAlign: 'center',
          }}
        >
          <LockIcon sx={{ fontSize: 64, color: colors.textSecondary, opacity: 0.5, mb: 2 }} />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: colors.textPrimary, mb: 1 }}>
            Sign in to see your saved artists
          </Typography>
          <Typography sx={{ color: colors.textSecondary, mb: 3, maxWidth: 400 }}>
            Create an account or sign in to save your favorite artists and access them anytime.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              href="/login?redirect=/wishlist"
              variant="outlined"
              sx={{
                color: colors.textPrimary,
                borderColor: colors.border,
                textTransform: 'none',
                px: 3,
                '&:hover': { borderColor: colors.accent, color: colors.accent },
              }}
            >
              Sign In
            </Button>
            <Button
              component={Link}
              href="/register"
              sx={{
                bgcolor: colors.accent,
                color: colors.background,
                textTransform: 'none',
                px: 3,
                fontWeight: 600,
                '&:hover': { bgcolor: colors.accentHover },
              }}
            >
              Create Account
            </Button>
          </Box>
        </Box>
      </Layout>
    );
  }

  const handleRemove = async (artistId: number) => {
    await removeFromWishlist(artistId);
  };

  return (
    <Layout>
      <Head>
        <title>Saved | InkedIn</title>
        <meta name="description" content="Your saved tattoo artists and tattoos" />
        <link rel="icon" href="/assets/img/logo.png" />
      </Head>

      <Box
        component="main"
        sx={{
          p: { xs: '1rem', md: '2rem' },
          maxWidth: '1400px',
          mx: 'auto',
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 600,
              color: colors.textPrimary,
              mb: '0.5rem',
            }}
          >
            Saved
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${colors.border}`, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: colors.textSecondary,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                minWidth: 100,
                '&.Mui-selected': {
                  color: colors.accent,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: colors.accent,
              },
            }}
          >
            <Tab label={`Artists (${wishlist.length})`} />
            <Tab label={`Tattoos (${savedTattoos.length})`} />
          </Tabs>
        </Box>

        {/* Artists Tab */}
        {activeTab === 0 && (
          <>
            {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: colors.accent }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: colors.error, mb: 2 }}>{error}</Typography>
            <Button
              onClick={() => window.location.reload()}
              sx={{
                color: colors.accent,
                borderColor: colors.accent,
                border: '1px solid',
                textTransform: 'none',
              }}
            >
              Try Again
            </Button>
          </Box>
        ) : wishlist.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <BookmarkIcon sx={{ fontSize: 64, color: colors.textSecondary, opacity: 0.5, mb: 2 }} />
            <Typography
              sx={{
                color: colors.textPrimary,
                fontSize: '1.25rem',
                fontWeight: 500,
                mb: 1,
              }}
            >
              No saved artists yet
            </Typography>
            <Typography
              sx={{
                color: colors.textSecondary,
                fontSize: '0.95rem',
                mb: 3,
                maxWidth: 400,
                mx: 'auto',
              }}
            >
              Browse artists and tap the bookmark icon to save them for later
            </Typography>
            <Button
              component={Link}
              href="/artists"
              sx={{
                bgcolor: colors.accent,
                color: colors.background,
                textTransform: 'none',
                px: 4,
                py: 1,
                fontWeight: 600,
                '&:hover': { bgcolor: colors.accentHover },
              }}
            >
              Find Artists
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: '1.25rem',
            }}
          >
            {wishlist.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <Box
                  sx={{
                    bgcolor: colors.surface,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${colors.border}`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px rgba(0, 0, 0, 0.3)`,
                    },
                  }}
                >
                  {/* Card Header with Avatar */}
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar
                      src={artist.image?.uri}
                      alt={artist.name || artist.username}
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: colors.accent,
                        color: colors.background,
                        fontSize: '1.25rem',
                        fontWeight: 600,
                      }}
                    >
                      {(artist.name || artist.username || 'A').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: colors.textPrimary,
                          fontWeight: 600,
                          fontSize: '1rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {artist.name || artist.username}
                      </Typography>
                      {artist.studio?.name && (
                        artist.studio.slug ? (
                          <Link
                            href={`/studios/${artist.studio.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ textDecoration: 'none', display: 'block' }}
                          >
                            <Typography
                              sx={{
                                color: colors.accent,
                                fontSize: '0.85rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              {artist.studio.name}
                            </Typography>
                          </Link>
                        ) : (
                          <Typography
                            sx={{
                              color: colors.textSecondary,
                              fontSize: '0.85rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {artist.studio.name}
                          </Typography>
                        )
                      )}
                    </Box>
                  </Box>

                  {/* Styles */}
                {artist.styles && artist.styles.length > 0 && (
                  <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {artist.styles.slice(0, 3).map((style) => (
                      <Box
                        key={style.id}
                        sx={{
                          px: 1,
                          py: 0.25,
                          bgcolor: `${colors.accent}1A`,
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: colors.accent,
                        }}
                      >
                        {style.name}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Footer */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderTop: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      bgcolor: artist.books_open ? `${colors.success}1A` : `${colors.textSecondary}1A`,
                      color: artist.books_open ? colors.success : colors.textSecondary,
                    }}
                  >
                    {artist.books_open ? 'Books Open' : 'Books Closed'}
                  </Box>
                  <IconButton
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(artist.id);
                    }}
                    size="small"
                    sx={{
                      color: colors.accent,
                      '&:hover': { bgcolor: `${colors.accent}1A` },
                    }}
                    title="Remove from saved"
                  >
                    <BookmarkIcon />
                  </IconButton>
                </Box>
              </Box>
              </Link>
            ))}
          </Box>
        )}
          </>
        )}

        {/* Tattoos Tab */}
        {activeTab === 1 && (
          <>
            {tattoosLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: colors.accent }} />
              </Box>
            ) : savedTattoos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <BookmarkIcon sx={{ fontSize: 64, color: colors.textSecondary, opacity: 0.5, mb: 2 }} />
                <Typography
                  sx={{
                    color: colors.textPrimary,
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  No saved tattoos yet
                </Typography>
                <Typography
                  sx={{
                    color: colors.textSecondary,
                    fontSize: '0.95rem',
                    mb: 3,
                    maxWidth: 400,
                    mx: 'auto',
                  }}
                >
                  Browse tattoos and tap the bookmark icon to save them for inspiration
                </Typography>
                <Button
                  component={Link}
                  href="/tattoos"
                  sx={{
                    bgcolor: colors.accent,
                    color: colors.background,
                    textTransform: 'none',
                    px: 4,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': { bgcolor: colors.accentHover },
                  }}
                >
                  Browse Tattoos
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: 'repeat(4, 1fr)',
                    lg: 'repeat(5, 1fr)',
                  },
                  gap: '1rem',
                }}
              >
                {savedTattoos.map((tattoo) => (
                  <Box
                    key={tattoo.id}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.3)`,
                      },
                    }}
                    onClick={() => handleTattooClick(tattoo.id.toString())}
                  >
                    <Box sx={{ position: 'relative', aspectRatio: '1', bgcolor: colors.background }}>
                      {(tattoo.primary_image?.uri || tattoo.image?.uri) ? (
                        <Image
                          src={tattoo.primary_image?.uri || tattoo.image?.uri}
                          alt={tattoo.title || 'Tattoo'}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textSecondary,
                          }}
                        >
                          No image
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Link
                        href={`/artists/${tattoo.artist_slug || tattoo.artist_id}`}
                        style={{ textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: colors.textPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            '&:hover': { color: colors.accent },
                          }}
                        >
                          {tattoo.artist_name || 'Unknown Artist'}
                        </Typography>
                      </Link>
                      {tattoo.primary_style && (
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: colors.accent,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tattoo.primary_style}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnsaveTattoo(tattoo.id);
                      }}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: colors.accent,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                      }}
                      title="Remove from saved"
                    >
                      <BookmarkIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>

      <TattooModal
        tattooId={selectedTattooId}
        artistName={getCurrentTattoo()?.artist_name || null}
        open={isTattooModalOpen}
        onClose={handleCloseTattooModal}
        onPrevious={handlePreviousTattoo}
        onNext={handleNextTattoo}
        hasPrevious={getCurrentTattooIndex() > 0}
        hasNext={getCurrentTattooIndex() < savedTattoos.length - 1}
        tattooFavorite={getTattooFavoriteStatus()}
      />
    </Layout>
  );
}
