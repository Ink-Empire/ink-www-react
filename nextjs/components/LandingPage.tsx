import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LogoText from './LogoText';
import { colors } from '@/styles/colors';
import { useArtists } from '@/hooks/useArtists';
import { useStyles } from '@/contexts/StyleContext';
import { useTags } from '@/contexts/TagContext';

const LandingPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const { artists, loading } = useArtists({ limit: 4 });
  const { styles } = useStyles();
  const { tags } = useTags();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tattoos?searchString=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/tattoos');
    }
  };

  // Featured styles for the styles section
  const featuredStyles = styles?.slice(0, 12) || [
    { id: 1, name: 'Traditional' },
    { id: 2, name: 'Neo-Traditional' },
    { id: 3, name: 'Japanese' },
    { id: 4, name: 'Blackwork' },
    { id: 5, name: 'Fine Line' },
    { id: 6, name: 'Realism' },
    { id: 7, name: 'Watercolor' },
    { id: 8, name: 'Geometric' },
    { id: 9, name: 'Tribal' },
    { id: 10, name: 'Dotwork' },
    { id: 11, name: 'Minimalist' },
    { id: 12, name: 'Illustrative' },
  ];

  // Featured tags for the tags section
  const featuredTags = tags?.slice(0, 15) || [
    { id: 1, name: 'skull', slug: 'skull' },
    { id: 2, name: 'rose', slug: 'rose' },
    { id: 3, name: 'dragon', slug: 'dragon' },
    { id: 4, name: 'snake', slug: 'snake' },
    { id: 5, name: 'butterfly', slug: 'butterfly' },
    { id: 6, name: 'lion', slug: 'lion' },
    { id: 7, name: 'wolf', slug: 'wolf' },
    { id: 8, name: 'eagle', slug: 'eagle' },
    { id: 9, name: 'tiger', slug: 'tiger' },
    { id: 10, name: 'phoenix', slug: 'phoenix' },
    { id: 11, name: 'lotus', slug: 'lotus' },
    { id: 12, name: 'mandala', slug: 'mandala' },
    { id: 13, name: 'koi', slug: 'koi' },
    { id: 14, name: 'anchor', slug: 'anchor' },
    { id: 15, name: 'compass', slug: 'compass' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background, mx: { xs: -2, sm: -3 }, mt: { xs: -2, sm: -4 } }}>
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          px: { xs: 1.5, md: 2 },
          maxWidth: 800,
          mx: 'auto',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
            fontWeight: 500,
            lineHeight: 1.1,
            mb: { xs: 1.5, md: 2 },
            color: colors.textPrimary,
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            letterSpacing: '-0.01em',
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
            mb: { xs: 2.5, md: 3 },
            maxWidth: 540,
            mx: 'auto',
            lineHeight: 1.6,
            px: { xs: 1, md: 0 },
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
            alignItems: 'center',
            bgcolor: colors.surface,
            borderRadius: '8px',
            border: `1px solid ${colors.borderLight}`,
            maxWidth: 480,
            mx: 'auto',
            transition: 'border-color 0.2s ease',
            '&:focus-within': {
              borderColor: colors.accent,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1.5, color: colors.textMuted }}>
            <SearchIcon sx={{ fontSize: 20 }} />
          </Box>
          <TextField
            fullWidth
            placeholder="Search by style, artist, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              sx: {
                '& fieldset': { border: 'none' },
                color: colors.textPrimary,
                fontSize: '0.95rem',
                '& input::placeholder': {
                  color: colors.textMuted,
                  opacity: 1,
                },
              },
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'transparent',
                py: 0.25,
              },
            }}
          />
          <Button
            type="submit"
            sx={{
              width: 40,
              minWidth: 40,
              height: 40,
              m: 0.5,
              bgcolor: colors.accent,
              borderRadius: '6px',
              color: colors.background,
              '&:hover': {
                bgcolor: colors.accentHover,
              },
            }}
          >
            <ArrowForwardIcon sx={{ fontSize: 18 }} />
          </Button>
        </Box>

        {/* Stats */}
        <Stack
          direction="row"
          spacing={{ xs: 2, sm: 4, md: 6 }}
          sx={{
            mt: { xs: 4, md: 5 },
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 500,
                color: colors.accent,
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                lineHeight: 1,
              }}
            >
              2,400+
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mt: 0.5 }}>
              Verified Artists
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 500,
                color: colors.accent,
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                lineHeight: 1,
              }}
            >
              18k+
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mt: 0.5 }}>
              Designs Created
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 500,
                color: colors.accent,
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                lineHeight: 1,
              }}
            >
              4.9
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mt: 0.5 }}>
              Average Rating
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Browse by Style Section */}
      <Box sx={{ py: { xs: 4, md: 6 }, px: { xs: 1.5, md: 2 }, maxWidth: 1200, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
            mb: { xs: 2, md: 3 },
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 500,
              color: colors.textPrimary,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
            }}
          >
            Browse by Style
          </Typography>
          <Link href="/tattoos" style={{ textDecoration: 'none' }}>
            <Typography
              sx={{
                color: colors.accent,
                fontSize: '0.9rem',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View all styles →
            </Typography>
          </Link>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.75, md: 1 } }}>
          {featuredStyles.map((style: any) => (
            <Link
              key={style.id}
              href={`/tattoos?styleSearch=${encodeURIComponent(style.name)}`}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  px: { xs: 1.25, md: 1.5 },
                  py: { xs: 0.75, md: 1 },
                  bgcolor: colors.surface,
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: '100px',
                  color: colors.textSecondary,
                  fontSize: { xs: '0.85rem', md: '0.9rem' },
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.accent,
                    color: colors.accent,
                    bgcolor: `${colors.accent}1A`,
                  },
                }}
              >
                {style.name}
              </Box>
            </Link>
          ))}
        </Box>
      </Box>

      {/* Browse by Tags Section */}
      <Box sx={{ py: { xs: 4, md: 6 }, px: { xs: 1.5, md: 2 }, maxWidth: 1200, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
            mb: { xs: 2, md: 3 },
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 500,
              color: colors.textPrimary,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
            }}
          >
            Browse by Subject
          </Typography>
          <Link href="/tattoos" style={{ textDecoration: 'none' }}>
            <Typography
              sx={{
                color: colors.accent,
                fontSize: '0.9rem',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View all subjects →
            </Typography>
          </Link>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.75, md: 1 } }}>
          {featuredTags.map((tag: any) => (
            <Link
              key={tag.id}
              href={`/tattoos?tag=${encodeURIComponent(tag.slug || tag.name)}`}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  px: { xs: 1.25, md: 1.5 },
                  py: { xs: 0.75, md: 1 },
                  bgcolor: colors.surface,
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: '100px',
                  color: colors.textSecondary,
                  fontSize: { xs: '0.85rem', md: '0.9rem' },
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.accent,
                    color: colors.accent,
                    bgcolor: `${colors.accent}1A`,
                  },
                }}
              >
                {tag.name}
              </Box>
            </Link>
          ))}
        </Box>
      </Box>

      {/* Featured Artists Section */}
      <Box sx={{ py: { xs: 4, md: 6 }, px: { xs: 1.5, md: 2 }, maxWidth: 1200, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
            mb: { xs: 2, md: 3 },
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 500,
              color: colors.textPrimary,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
            }}
          >
            Featured Artists
          </Typography>
          <Link href="/artists" style={{ textDecoration: 'none' }}>
            <Typography
              sx={{
                color: colors.accent,
                fontSize: '0.9rem',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View all artists →
            </Typography>
          </Link>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: colors.accent }} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: { xs: 1.25, md: 2 },
            }}
          >
            {Array.isArray(artists) &&
              artists.slice(0, 4).map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.slug || artist.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Box
                    sx={{
                      bgcolor: colors.surface,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: `1px solid ${colors.border}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: colors.accent,
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4)',
                      },
                    }}
                  >
                    {/* Artist Image */}
                    <Box
                      sx={{
                        aspectRatio: '1',
                        bgcolor: colors.background,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {(artist.image?.uri || artist.primary_image?.uri) ? (
                        <Image
                          src={artist.image?.uri || artist.primary_image?.uri}
                          alt={artist.name || 'Artist'}
                          fill
                          style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
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
                        </Box>
                      )}
                    </Box>

                    {/* Card Body */}
                    <Box sx={{ p: { xs: 1.25, md: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: `${colors.accent}26`,
                            color: colors.accent,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {artist.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'A'}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: colors.textPrimary }}>
                            {artist.name}
                          </Typography>
                          {artist.location && (
                            <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                              {artist.location}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {artist.styles && artist.styles.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {artist.styles.slice(0, 2).map((style: any, index: number) => (
                            <Box
                              key={index}
                              sx={{
                                fontSize: '0.7rem',
                                px: 0.75,
                                py: 0.35,
                                bgcolor: colors.background,
                                borderRadius: '100px',
                                color: colors.textSecondary,
                              }}
                            >
                              {typeof style === 'string' ? style : style.name}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Link>
              ))}
          </Box>
        )}
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: { xs: 4, md: 6 }, px: { xs: 1.5, md: 2 }, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Typography
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 500,
              color: colors.textPrimary,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
            }}
          >
            How It Works
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 2, md: 3 },
          }}
        >
          {/* Step 1 */}
          <Box sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: `${colors.accent}26`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <SearchIcon sx={{ fontSize: 28, color: colors.accent }} />
            </Box>
            <Typography
              sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: colors.textPrimary,
                mb: 0.75,
              }}
            >
              Discover Artists
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: 1.6 }}>
              Browse portfolios by style, location, or availability. Find the perfect artist for your vision.
            </Typography>
          </Box>

          {/* Step 2 */}
          <Box sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: `${colors.accent}26`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 28, color: colors.accent }} />
            </Box>
            <Typography
              sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: colors.textPrimary,
                mb: 0.75,
              }}
            >
              Connect & Collaborate
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: 1.6 }}>
              Share your ideas, get quotes, and work together to create your perfect design.
            </Typography>
          </Box>

          {/* Step 3 */}
          <Box sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: `${colors.accent}26`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <CalendarMonthIcon sx={{ fontSize: 28, color: colors.accent }} />
            </Box>
            <Typography
              sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: colors.textPrimary,
                mb: 0.75,
              }}
            >
              Book Your Session
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: 1.6 }}>
              Schedule your appointment, pay securely, and get the tattoo you've always wanted.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: colors.surface,
          borderTop: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
          py: { xs: 4, md: 6 },
          px: { xs: 1.5, md: 2 },
          textAlign: 'center',
        }}
      >
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography
            sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              fontWeight: 500,
              color: colors.textPrimary,
              mb: 1.5,
            }}
          >
            Ready to get started?
          </Typography>
          <Typography sx={{ color: colors.textSecondary, fontSize: '1.1rem', mb: 3 }}>
            Join thousands of artists and collectors already connecting on InkedIn.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
          >
            <Button
              component={Link}
              href="/artists"
              sx={{
                px: 3,
                py: 1.25,
                bgcolor: colors.accent,
                color: colors.background,
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': { bgcolor: colors.accentHover },
              }}
            >
              Find an Artist
            </Button>
            <Button
              component={Link}
              href="/register"
              sx={{
                px: 3,
                py: 1.25,
                bgcolor: colors.surface,
                color: colors.textPrimary,
                border: `1px solid ${colors.borderLight}`,
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': { borderColor: colors.accent, color: colors.accent },
              }}
            >
              Join as an Artist
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ py: { xs: 4, md: 6 }, px: { xs: 1.5, md: 2 }, maxWidth: 1200, mx: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '2fr repeat(3, 1fr)' },
            gap: { xs: 3, md: 4 },
            pb: 4,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {/* Brand */}
          <Box>
            <LogoText fontSize="1.5rem" />
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mt: 1.5, maxWidth: 280 }}>
              The premier marketplace connecting tattoo artists with collectors worldwide.
            </Typography>
          </Box>

          {/* For Clients */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.textMuted,
                mb: 1.5,
              }}
            >
              For Clients
            </Typography>
            <Stack spacing={0.75}>
              <Link href="/artists" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', '&:hover': { color: colors.accent } }}>
                  Find Artists
                </Typography>
              </Link>
              <Link href="/tattoos" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', '&:hover': { color: colors.accent } }}>
                  Browse Styles
                </Typography>
              </Link>
              <Link href="/how-it-works" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', '&:hover': { color: colors.accent } }}>
                  How It Works
                </Typography>
              </Link>
            </Stack>
          </Box>

          {/* For Artists */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.textMuted,
                mb: 1.5,
              }}
            >
              For Artists
            </Typography>
            <Stack spacing={0.75}>
              <Link href="/register" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', '&:hover': { color: colors.accent } }}>
                  Join InkedIn
                </Typography>
              </Link>
              <Link href="/for-artists" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', '&:hover': { color: colors.accent } }}>
                  Artist Resources
                </Typography>
              </Link>
            </Stack>
          </Box>

          {/* Company */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.textMuted,
                mb: 1.5,
              }}
            >
              Company
            </Typography>
            <Stack spacing={0.75}>
              <Link href="/about" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', '&:hover': { color: colors.accent } }}>
                  About Us
                </Typography>
              </Link>
              <Link href="/contact" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', '&:hover': { color: colors.accent } }}>
                  Contact
                </Typography>
              </Link>
              <Link href="/privacy" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', '&:hover': { color: colors.accent } }}>
                  Privacy
                </Typography>
              </Link>
            </Stack>
          </Box>
        </Box>

        {/* Footer Bottom */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            pt: 3,
          }}
        >
          <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
            © {new Date().getFullYear()} InkedIn. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <IconButton
              component="a"
              href="#"
              sx={{ color: colors.textMuted, '&:hover': { color: colors.accent } }}
            >
              <InstagramIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              component="a"
              href="#"
              sx={{ color: colors.textMuted, '&:hover': { color: colors.accent } }}
            >
              <TwitterIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              component="a"
              href="#"
              sx={{ color: colors.textMuted, '&:hover': { color: colors.accent } }}
            >
              <FacebookIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
