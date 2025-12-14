import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import LogoText from './LogoText';
import { colors } from '@/styles/colors';
import { useArtists } from '@/hooks/useArtists';

const LandingPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch featured artists (limit to 4)
  const { artists, loading } = useArtists({ limit: 4 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tattoos?searchString=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/tattoos');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          px: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* Hero Content */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                  fontWeight: 500,
                  lineHeight: 1.1,
                  mb: 3,
                  color: colors.textPrimary,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  letterSpacing: '-0.02em',
                }}
              >
                Find your{' '}
                <Box
                  component="span"
                  sx={{
                    color: colors.accent,
                    fontStyle: 'italic',
                  }}
                >
                  perfect
                </Box>{' '}
                tattoo artist
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  color: colors.textSecondary,
                  mb: 4,
                  maxWidth: 480,
                  lineHeight: 1.6,
                }}
              >
                Connect with world-class tattoo artists. Browse portfolios, book
                consultations, and collaborate on custom designs—all in one place.
              </Typography>

              {/* Search Box */}
              <Box
                component="form"
                onSubmit={handleSearch}
                sx={{
                  display: 'flex',
                  bgcolor: colors.surface,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                  mb: 4,
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Search by style, artist, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: colors.textSecondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      '& fieldset': { border: 'none' },
                      color: colors.textPrimary,
                      '& input::placeholder': {
                        color: colors.textSecondary,
                        opacity: 1,
                      },
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'transparent',
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    px: 4,
                    borderRadius: 0,
                    bgcolor: colors.accent,
                    color: colors.background,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: colors.accentHover,
                    },
                  }}
                >
                  Search
                </Button>
              </Box>

              {/* Stats */}
              <Stack
                direction="row"
                spacing={{ xs: 3, md: 5 }}
                sx={{
                  pt: 3,
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: { xs: '1.75rem', md: '2.5rem' },
                      fontWeight: 500,
                      color: colors.accent,
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                    }}
                  >
                    2,400+
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      color: colors.textSecondary,
                    }}
                  >
                    Verified Artists
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: { xs: '1.75rem', md: '2.5rem' },
                      fontWeight: 500,
                      color: colors.accent,
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                    }}
                  >
                    18k+
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      color: colors.textSecondary,
                    }}
                  >
                    Designs Created
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: { xs: '1.75rem', md: '2.5rem' },
                      fontWeight: 500,
                      color: colors.accent,
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                    }}
                  >
                    4.9
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      color: colors.textSecondary,
                    }}
                  >
                    Average Rating
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Hero Visual */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 300, md: 500 },
                  bgcolor: colors.surface,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(135deg, ${colors.accent}1A 0%, transparent 50%)`,
                    pointerEvents: 'none',
                  },
                }}
              >
                {/* Placeholder for featured image */}
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                  [Featured Artist Work]
                </Typography>

                {/* Artist Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 24,
                    left: 24,
                    bgcolor: `${colors.background}E6`,
                    backdropFilter: 'blur(10px)',
                    p: 2,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    border: `1px solid ${colors.accent}33`,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: colors.surface,
                      color: colors.accent,
                      fontWeight: 600,
                    }}
                  >
                    MR
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: colors.textPrimary,
                      }}
                    >
                      Maya Rodriguez
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        color: colors.textSecondary,
                      }}
                    >
                      Featured Artist • Auckland
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Featured Artists Section */}
      <Box sx={{ py: { xs: 5, md: 8 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg">
          {/* Section Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              mb: 4,
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 500,
                color: colors.textPrimary,
                fontFamily: '"Cormorant Garamond", Georgia, serif',
              }}
            >
              Featured Artists
            </Typography>
            <Link href="/artists" passHref style={{ textDecoration: 'none' }}>
              <Typography
                sx={{
                  color: colors.accent,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                View all artists <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
              </Typography>
            </Link>
          </Box>

          {/* Artists Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: colors.accent }} />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {Array.isArray(artists) && artists.slice(0, 4).map((artist) => (
                <Grid item xs={12} sm={6} md={3} key={artist.id}>
                  <Link
                    href={`/artists/${artist.slug || artist.id}`}
                    passHref
                    style={{ textDecoration: 'none' }}
                  >
                    <Card
                      sx={{
                        bgcolor: colors.surface,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${colors.border}`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: `${colors.accent}4D`,
                          transform: 'translateY(-4px)',
                        },
                      }}
                    >
                      {/* Artist Image */}
                      <Box
                        sx={{
                          height: 220,
                          bgcolor: colors.background,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {artist.primary_image?.uri ? (
                          <CardMedia
                            component="img"
                            image={artist.primary_image.uri}
                            alt={artist.name || 'Artist'}
                            sx={{
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Avatar
                            sx={{
                              width: 80,
                              height: 80,
                              bgcolor: colors.accent,
                              color: colors.background,
                              fontSize: '2rem',
                            }}
                          >
                            {artist.name?.charAt(0) || 'A'}
                          </Avatar>
                        )}
                      </Box>

                      <CardContent sx={{ p: 2 }}>
                        <Typography
                          sx={{
                            fontSize: '1.05rem',
                            fontWeight: 500,
                            color: colors.textPrimary,
                            mb: 0.5,
                          }}
                        >
                          {artist.name}
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 1,
                          }}
                        >
                          {artist.location && (
                            <Typography
                              sx={{
                                fontSize: '0.85rem',
                                color: colors.textSecondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <LocationOnIcon sx={{ fontSize: '1rem' }} />
                              {artist.location}
                            </Typography>
                          )}
                          <Typography
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: colors.accent,
                              fontSize: '0.85rem',
                              fontWeight: 500,
                            }}
                          >
                            <StarIcon sx={{ fontSize: '1rem' }} /> 4.9
                          </Typography>
                        </Box>

                        {/* Style Tags */}
                        {artist.styles && artist.styles.length > 0 && (
                          <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                            {artist.styles.slice(0, 2).map((style: any, index: number) => (
                              <Chip
                                key={index}
                                label={typeof style === 'string' ? style : style.name}
                                size="small"
                                sx={{
                                  bgcolor: `${colors.accent}1A`,
                                  color: colors.accent,
                                  fontSize: '0.75rem',
                                  height: 24,
                                  borderRadius: '100px',
                                }}
                              />
                            ))}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </Grid>
              ))}
            </Grid>
          )}

          {/* CTA Button */}
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              component={Link}
              href="/artists"
              variant="outlined"
              size="large"
              sx={{
                color: colors.accent,
                borderColor: colors.accent,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': {
                  borderColor: colors.accentHover,
                  bgcolor: `${colors.accent}1A`,
                },
              }}
            >
              Browse All Artists
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
