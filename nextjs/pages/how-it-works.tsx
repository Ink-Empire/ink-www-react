import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Container, Typography, Button, Stack, TextField, InputAdornment, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '../components/Layout';
import { useStyles } from '@/contexts/StyleContext';
import { useTags } from '@/contexts/TagContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/colors';

// Banner section with image background and text overlay
const BannerSection = ({
  title,
  description,
  imageSrc,
  imagePosition = 'left',
  ctaText,
  ctaHref,
  children,
}: {
  title: string;
  description: string;
  imageSrc: string;
  imagePosition?: 'left' | 'right';
  ctaText?: string;
  ctaHref?: string;
  children?: React.ReactNode;
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: {
        xs: 'column',
        md: imagePosition === 'left' ? 'row' : 'row-reverse'
      },
      minHeight: { xs: 'auto', md: '450px' },
    }}
  >
    {/* Image Side */}
    <Box
      sx={{
        flex: 1,
        minHeight: { xs: '300px', md: '450px' },
        backgroundImage: `url(${encodeURI(imageSrc)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
      }}
    />

    {/* Content Side */}
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: colors.surface,
        p: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 500 }}>
        <Typography
          variant="h2"
          sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            fontWeight: 500,
            color: colors.textPrimary,
            mb: 2,
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: colors.textSecondary,
            fontSize: { xs: '1rem', md: '1.1rem' },
            lineHeight: 1.7,
            mb: ctaText ? 3 : 0,
          }}
        >
          {description}
        </Typography>
        {ctaText && ctaHref && (
          <Button
            component={Link}
            href={ctaHref}
            sx={{
              color: colors.accent,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              p: 0,
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            {ctaText} →
          </Button>
        )}
        {children}
      </Box>
    </Box>
  </Box>
);

export default function HowItWorksPage() {
  const router = useRouter();
  const { styles } = useStyles();
  const { tags } = useTags();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Get top 5 styles (by popularity or just first 5)
  const topStyles = useMemo(() => {
    if (!styles || styles.length === 0) return [];
    return styles.slice(0, 5);
  }, [styles]);

  // Get top 5 tags (by tattoos_count or random)
  const topTags = useMemo(() => {
    if (!tags || tags.length === 0) return [];
    const sorted = [...tags].sort((a, b) => (b.tattoos_count || 0) - (a.tattoos_count || 0));
    return sorted.slice(0, 5);
  }, [tags]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tattoos?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleStyleClick = (styleId: number) => {
    router.push(`/tattoos?styles=${styleId}`);
  };

  const handleTagClick = (tagId: number) => {
    router.push(`/tattoos?tags=${tagId}`);
  };

  return (
    <Layout>
      <Head>
        <title>How It Works | InkedIn</title>
        <meta
          name="description"
          content="Discover how InkedIn connects tattoo enthusiasts with artists. Browse styles, save favorites, book consultations, and find your perfect artist."
        />
      </Head>

      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: colors.background,
          py: { xs: 6, md: 10 },
          textAlign: 'center',
          borderBottom: `1px solid ${colors.border}`
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h1"
            sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 500,
              color: colors.textPrimary,
              mb: 3
            }}
          >
            Tattoos can be <Box component="span" sx={{ color: colors.accent }}>painful</Box>.
            <br />
            Finding the <Box component="span" sx={{ color: colors.accent }}>right one</Box> shouldn't be.
          </Typography>
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: { xs: '1rem', md: '1.1rem' },
              lineHeight: 1.7,
              mb: 4,
              maxWidth: 550,
              mx: 'auto'
            }}
          >
            Connect with world-class tattoo artists. Browse portfolios, book
            consultations, and collaborate on custom designs—all in one place.
          </Typography>

          {/* Search Bar */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}
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
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      type="submit"
                      sx={{
                        minWidth: 40,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                        '&:hover': {
                          bgcolor: colors.accent,
                          borderColor: colors.accent,
                          color: colors.background,
                        },
                      }}
                    >
                      →
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.surface,
                  borderRadius: '50px',
                  pr: 1,
                  '& fieldset': {
                    borderColor: colors.border,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.accent,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.accent,
                  },
                },
                '& .MuiInputBase-input': {
                  color: colors.textPrimary,
                  py: 1.5,
                  '&::placeholder': {
                    color: colors.textSecondary,
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* Stats - Hidden until we have real data
          <Stack
            direction="row"
            spacing={{ xs: 3, md: 6 }}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  fontWeight: 500,
                  color: colors.accent,
                }}
              >
                2,400+
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                Verified Artists
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  fontWeight: 500,
                  color: colors.accent,
                }}
              >
                18k+
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                Designs Created
              </Typography>
            </Box>
          </Stack>
          */}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              component={Link}
              href="/tattoos"
              variant="contained"
              size="large"
              sx={{
                bgcolor: colors.accent,
                color: colors.background,
                textTransform: 'none',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': { bgcolor: colors.accentHover }
              }}
            >
              Browse Tattoos
            </Button>
            <Button
              component={Link}
              href="/artists"
              variant="outlined"
              size="large"
              sx={{
                borderColor: colors.accent,
                color: colors.accent,
                textTransform: 'none',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  borderColor: colors.accentHover,
                  bgcolor: `${colors.accent}1A`
                }
              }}
            >
              Find Artists
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Banner 1 - Explore & Discover */}
      <BannerSection
        imageSrc="/assets/img/how_it_works/tattoo-3268988_1280.jpg"
        imagePosition="left"
        title="Explore styles that speak to you"
        description="Browse thousands of tattoos by style, subject, or location. Whether you're drawn to bold traditional work, delicate fine line, or something totally unique—filter by what inspires you and discover artists who specialize in exactly what you're looking for."
        ctaText="Start exploring"
        ctaHref="/tattoos"
      >
        {topStyles.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography
              sx={{
                fontSize: '0.9rem',
                color: colors.textSecondary,
                mb: 1.5
              }}
            >
              or choose a style below
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {topStyles.map((style) => (
                <Chip
                  key={style.id}
                  label={style.name}
                  onClick={() => handleStyleClick(style.id)}
                  sx={{
                    bgcolor: 'transparent',
                    border: `1px solid ${colors.accent}`,
                    color: colors.accent,
                    borderRadius: '50px',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: `${colors.accent}1A`,
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </BannerSection>

      {/* Banner 2 - Save Favorites */}
      <BannerSection
        imageSrc="/assets/img/how_it_works/woman-7066869_1280.jpg"
        imagePosition="right"
        title="Save artists you love"
        description="Found an artist whose work gives you goosebumps? Add them to your wishlist. Build a collection of your favorites, compare styles, and keep track of the artists you want to work with—all in one place. Your future tattoo starts with inspiration."
        ctaText="Create your wishlist"
        ctaHref="/wishlist"
      />

      {/* Banner 3 - Stay Notified */}
      <BannerSection
        imageSrc="/assets/img/how_it_works/people-2590677_1280.jpg"
        imagePosition="left"
        title="Never miss an opening"
        description="The best artists book up fast. Get notified the moment your favorite artists open their books or announce flash availability. No more obsessively checking social media—we'll let you know when it's time to book."
      />

      {/* Banner 4 - Book Consultations */}
      <BannerSection
        imageSrc="/assets/img/how_it_works/pexels-pavel-danilyuk-6593341.jpg"
        imagePosition="right"
        title="From idea to appointment"
        description="Ready to make it real? Request consultations directly through InkedIn. Share your ideas, discuss sizing and placement, and start the conversation with artists who get your vision. Booking your dream tattoo has never been easier."
        ctaText="Find your artist"
        ctaHref="/artists"
      />

      {/* Banner 5 - For Artists */}
      <BannerSection
        imageSrc="/assets/img/how_it_works/pexels-kevinbidwell-2200913.jpg"
        imagePosition="left"
        title="Built for artists, too"
        description="InkedIn isn't just for collectors—it's where artists grow their practice. Showcase your portfolio, manage your calendar, control your availability, and get discovered by clients who are searching for exactly what you do. Less time on admin, more time creating."
        ctaText="Join as an artist"
        ctaHref="/register"
      />

      {/* Banner 6 - Community */}
      <BannerSection
        imageSrc="/assets/img/how_it_works/inkwells.jpg"
        imagePosition="right"
        title="A community that gets it"
        description="Connect with studios for guest spots. Find artists to collaborate with. Discover talent for your team. InkedIn is where the tattoo world comes together—whether you're building your career, your collection, or your next adventure."
        ctaText="Join the community"
        ctaHref="/register"
      />

      {/* Final CTA Section - Only show when not logged in */}
      {!isAuthenticated && (
        <Box
          sx={{
            bgcolor: colors.background,
            py: { xs: 6, md: 8 },
            textAlign: 'center',
          }}
        >
          <Container maxWidth="sm">
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 500,
                color: colors.textPrimary,
                mb: 2
              }}
            >
              Ready to get started?
            </Typography>
            <Typography
              sx={{
                color: colors.textSecondary,
                fontSize: '1.1rem',
                mb: 4,
              }}
            >
              Join thousands of artists and tattoo enthusiasts already using InkedIn.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                component={Link}
                href="/register"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: colors.accent,
                  color: colors.background,
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': { bgcolor: colors.accentHover }
                }}
              >
                Create Free Account
              </Button>
              <Button
                component={Link}
                href="/artists"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: colors.textSecondary,
                  color: colors.textPrimary,
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': {
                    borderColor: colors.textPrimary,
                    bgcolor: 'transparent'
                  }
                }}
              >
                Browse First
              </Button>
            </Stack>
          </Container>
        </Box>
      )}
    </Layout>
  );
}
