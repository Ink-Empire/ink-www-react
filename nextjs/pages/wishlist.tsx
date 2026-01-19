import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  IconButton,
  Button,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LockIcon from '@mui/icons-material/Lock';
import Layout from '../components/Layout';
import { useWishlist } from '@/hooks/useClientDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/colors';

export default function WishlistPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { wishlist, loading, error, removeFromWishlist } = useWishlist();

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
        <title>Saved Artists | InkedIn</title>
        <meta name="description" content="Your saved tattoo artists" />
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
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 600,
              color: colors.textPrimary,
              mb: '0.5rem',
            }}
          >
            Saved Artists
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: colors.textSecondary }}>
            {wishlist.length > 0 ? (
              <>
                <Box component="span" sx={{ color: colors.accent, fontWeight: 600 }}>
                  {wishlist.length}
                </Box>
                {' '}artist{wishlist.length !== 1 ? 's' : ''} saved
              </>
            ) : (
              'Artists you save will appear here'
            )}
          </Typography>
        </Box>

        {/* Content */}
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
              <Box
                key={artist.id}
                sx={{
                  bgcolor: colors.surface,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.3)`,
                  },
                }}
              >
                {/* Card Header with Avatar */}
                <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }}>
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
                      {artist.studio && (
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
                      )}
                    </Box>
                  </Box>
                </Link>

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
                    onClick={() => handleRemove(artist.id)}
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
            ))}
          </Box>
        )}
      </Box>
    </Layout>
  );
}
