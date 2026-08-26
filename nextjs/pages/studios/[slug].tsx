import React, { useState, useMemo, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Box, Button, Avatar, Typography, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import InstagramIcon from '@mui/icons-material/Instagram';
import NavigationIcon from '@mui/icons-material/Navigation';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CampaignIcon from '@mui/icons-material/Campaign';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import TextField from '@mui/material/TextField';
import { useStudio, useStudioArtists, useStudioGallery, useStudioHours } from '../../hooks/useStudios';
import { useAuth } from '../../contexts/AuthContext';
import TattooModal from '@/components/TattooModal';
import { studioService } from '@/services/studioService';
import { colors } from '@/styles/colors';
import { studioSeoTitle, studioSeoDescription } from '@/utils/seo';
import { RECENTLY_EDITED_COOKIE } from '@/utils/studioEditing';
import {
  StudioBanner,
  StudioHeader,
  StudioSpotlight,
  StudioPortfolioGrid,
  StudioFilterCard,
  StudioArtistsCard,
  StudioAnnouncements,
  StudioInfoCard,
  StudioQuickActions,
  StudioLocationHours,
  StudioHoursCard,
  StudioContactCard,
  StudioGuides,
} from '@/components/studio';
import SectionBand from '@/components/studio/SectionBand';
import StudioTabBar from '@/components/studio/StudioTabBar';
import {
  Lane,
  SectionKey,
  bandOf,
  laneMembers,
  resolveArrangement,
} from '@inkedin/shared/utils/studioSections';

interface StudioDetailProps {
    initialStudio?: any;
    initialSpotlights?: any[];
    initialGuides?: any[];
}

export default function StudioDetail({
    initialStudio,
    initialSpotlights = [],
    initialGuides = [],
}: StudioDetailProps) {
  const router = useRouter();
  const { slug } = router.query;
  const { studio, loading: studioLoading, error: studioError } = useStudio(slug as string, initialStudio);
  const { artists: allArtists } = useStudioArtists(slug as string);
  const artists = useMemo(() => (allArtists || []).filter((a: any) => a.is_verified), [allArtists]);
  const { gallery } = useStudioGallery(slug as string);
  const { hours: workingHours } = useStudioHours(slug as string);
  const { user, isAuthenticated } = useAuth();

  // Spotlights come from getServerSideProps so they render in the initial HTML.
  const spotlights = initialSpotlights;

  // Which of the hand-built layouts this studio chose. Everything below the
  // tabs is shared; the templates differ in what the page leads with.
  const template = studio?.template || 'portfolio';

  // The editor sends the owner here with ?published=1 after a successful
  // publish, so they land on the real page with confirmation. Derived from the
  // query rather than mirrored into state, so it cannot miss the first render.
  const [publishedDismissed, setPublishedDismissed] = useState(false);
  const showPublished = !publishedDismissed && router.query.published === '1';

  const dismissPublished = () => {
    setPublishedDismissed(true);
    const { published, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  };

  const [activeTab, setActiveTab] = useState(0);
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('all');
  const [selectedTattooId, setSelectedTattooId] = useState<string | null>(null);
  const [isTattooModalOpen, setIsTattooModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Check if studio is verified/claimed or if the current user owns it
  const isOwner = isAuthenticated && user && studio?.owner_id === user.id;
  const isClaimed = studio?.is_claimed || isOwner;
  const isVerified = studio?.is_verified || studio?.verified || isClaimed || false;
  const canContact = !!studio?.owner_id;

  // Get unique styles from studio or gallery
  const studioStyles = useMemo(() => {
    if (!gallery || gallery.length === 0) return [];
    const styles = new Set<string>();
    gallery.forEach((tattoo: any) => {
      const tattooStyles = tattoo.styles || [];
      tattooStyles.forEach((s: any) => {
        const styleName = typeof s === 'string' ? s : s.name;
        if (styleName) styles.add(styleName);
      });
    });
    return Array.from(styles);
  }, [gallery]);

  // Filter portfolio by selected style
  const filteredPortfolio = useMemo(() => {
    if (!gallery) return [];
    if (selectedStyleFilter === 'all') return gallery;
    return gallery.filter((tattoo: any) => {
      const tattooStyles = tattoo.styles || [];
      return tattooStyles.some((s: any) => {
        const styleName = typeof s === 'string' ? s : s.name;
        return styleName?.toLowerCase() === selectedStyleFilter.toLowerCase();
      });
    });
  }, [gallery, selectedStyleFilter]);

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTattooClick = (tattooId: string) => {
    setSelectedTattooId(tattooId);
    setIsTattooModalOpen(true);
  };

  const handleCloseTattooModal = () => {
    setIsTattooModalOpen(false);
    setSelectedTattooId(null);
  };

  const getCurrentTattooIndex = () => {
    if (!selectedTattooId) return -1;
    return filteredPortfolio.findIndex((t: any) => t.id.toString() === selectedTattooId);
  };

  const handlePreviousTattoo = () => {
    const currentIndex = getCurrentTattooIndex();
    if (currentIndex > 0) {
      setSelectedTattooId(filteredPortfolio[currentIndex - 1].id.toString());
    }
  };

  const handleNextTattoo = () => {
    const currentIndex = getCurrentTattooIndex();
    if (currentIndex < filteredPortfolio.length - 1) {
      setSelectedTattooId(filteredPortfolio[currentIndex + 1].id.toString());
    }
  };

  const handleContactStudio = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (studio?.owner_id) {
      router.push(`/inbox?artistId=${studio.owner_id}`);
    }
  };

  const handleSaveStudio = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsSaved(!isSaved);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !studio) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setInviteLoading(true);
    setInviteError('');
    try {
      await studioService.inviteStudioOwner(studio.id, inviteEmail);
      setInviteSent(true);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Get studio hours for today
  const getTodayHours = () => {
    if (!studio?.hours) return null;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return studio.hours.find((h: any) => h.day === today);
  };

  const todayHours = getTodayHours();

  if (studioLoading && !studio) {
    return (
      <Layout>
        <Head>
          <title>Studio | InkedIn</title>
        </Head>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography sx={{ color: colors.textSecondary }}>Loading studio details...</Typography>
        </Box>
      </Layout>
    );
  }

  if (studioError) {
    return (
      <Layout>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: colors.error }}>Error: {studioError.message}</Typography>
        </Box>
      </Layout>
    );
  }

  if (!studio) {
    return (
      <Layout>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: colors.textSecondary }}>Studio not found</Typography>
        </Box>
      </Layout>
    );
  }

  // Unclaimed/Stub Studio View
  if (!isVerified) {
    const seoTitle = `${studio.name}${studio.city ? ` - ${studio.city}, ${studio.state}` : ''} | Tattoo Studio | InkedIn`;
    const seoDescription = studio.about?.substring(0, 160)
      || `${studio.name} is a tattoo studio${studio.city ? ` in ${studio.city}, ${studio.state}` : ''}. View their portfolio, hours, and contact info on InkedIn.`;
    const studioUrl = `https://getinked.in/studios/${slug}`;
    const studioImage = studio.image?.uri || studio.primary_image?.uri || null;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TattooParlor',
      name: studio.name,
      ...(studioImage && { image: studioImage }),
      url: studioUrl,
      ...(studio.phone && { telephone: studio.phone }),
      ...(studio.email && { email: studio.email }),
      ...(studio.website && { sameAs: [studio.website] }),
      ...(studio.address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: studio.address,
          addressLocality: studio.city,
          addressRegion: studio.state,
          postalCode: studio.postal_code,
        },
      }),
      ...(studio.location_lat_long && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: studio.location_lat_long.split(',')[0],
          longitude: studio.location_lat_long.split(',')[1],
        },
      }),
    };

    return (
      <Layout>
        <Head>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDescription} />
          <link rel="canonical" href={studioUrl} />
          <meta property="og:type" content="business.business" />
          <meta property="og:title" content={seoTitle} />
          <meta property="og:description" content={seoDescription} />
          <meta property="og:url" content={studioUrl} />
          {studioImage && <meta property="og:image" content={studioImage} />}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seoTitle} />
          <meta name="twitter:description" content={seoDescription} />
          {studioImage && <meta name="twitter:image" content={studioImage} />}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </Head>

        <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
          {/* Studio Header - Unclaimed */}
          <Box sx={{
            display: 'flex',
            gap: 3,
            mb: 4,
            pb: 3,
            borderBottom: `1px solid ${colors.border}`,
            flexWrap: { xs: 'wrap', md: 'nowrap' }
          }}>
            {/* Avatar */}
            {(studio.image?.uri || studio.primary_image?.uri) ? (
              <Box sx={{
                width: 120,
                height: 120,
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                border: `2px solid ${colors.border}`
              }}>
                <Image
                  src={studio.image?.uri || studio.primary_image?.uri}
                  alt={studio.name || 'Studio'}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            ) : (
              <Box sx={{
                width: 120,
                height: 120,
                bgcolor: colors.surface,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${colors.border}`,
                flexShrink: 0
              }}>
                <StorefrontIcon sx={{ fontSize: 48, color: colors.textMuted }} />
              </Box>
            )}

            {/* Studio Details */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '2.5rem',
                fontWeight: 500,
                color: colors.textPrimary,
                mb: 0.25,
                lineHeight: 1.2
              }}>
                {studio.name}
              </Typography>

              {studio.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.textSecondary, mb: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                  {studio.location}
                </Box>
              )}

              {/* Unclaimed badge */}
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                bgcolor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '100px',
                fontSize: '0.85rem',
                color: colors.textSecondary
              }}>
                <StorefrontIcon sx={{ fontSize: 16 }} />
                Unclaimed Profile
              </Box>
            </Box>
          </Box>

          {/* Claim Banner */}
          <Box sx={{
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            p: 4,
            textAlign: 'center',
            mb: 3
          }}>
            <Box sx={{
              width: 64,
              height: 64,
              bgcolor: `${colors.accent}1A`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}>
              <StorefrontIcon sx={{ fontSize: 32, color: colors.accent }} />
            </Box>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '1.75rem',
              fontWeight: 500,
              color: colors.textPrimary,
              mb: 1
            }}>
              Is this your studio?
            </Typography>
            <Typography sx={{
              color: colors.textSecondary,
              mb: 3,
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.6
            }}>
              Claim this profile to manage your studio's presence on InkedIn. Add photos, update hours, respond to reviews, and connect with clients.
            </Typography>
            <Button
              href={`/register?userType=studio&studioSlug=${slug}`}
              sx={{
                px: 4,
                py: 1.25,
                bgcolor: colors.accent,
                color: colors.background,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                '&:hover': { bgcolor: colors.accentHover }
              }}
            >
              Claim This Studio
            </Button>
          </Box>

          {/* Info Grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mb: 3
          }}>
            {/* Location Card */}
            <Box sx={{
              bgcolor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              p: 3
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <LocationOnIcon sx={{ color: colors.accent }} />
                Location
              </Typography>
              <Typography sx={{ color: colors.textSecondary, mb: 2, lineHeight: 1.6 }}>
                {studio.address && <>{studio.address}<br /></>}
                {studio.city && studio.state && `${studio.city}, ${studio.state}`} {studio.postal_code}
              </Typography>
              {studio.address && (
                <Box
                  component="a"
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${studio.address}, ${studio.city}, ${studio.state}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: colors.accent,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <NavigationIcon sx={{ fontSize: 16 }} />
                  Get Directions
                </Box>
              )}
            </Box>

            {/* Hours Card */}
            <Box sx={{
              bgcolor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              p: 3
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <AccessTimeIcon sx={{ color: colors.accent }} />
                Hours
              </Typography>
              {workingHours && workingHours.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dayIndex) => {
                    const dayHours = workingHours.find((h: any) => h.day_of_week === dayIndex);
                    const isClosed = !dayHours || dayHours.is_day_off;
                    const isToday = new Date().getDay() === dayIndex;
                    const formatTime = (time: string) => {
                      const [hours, minutes] = time.split(':');
                      const h = parseInt(hours);
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const displayHour = h % 12 || 12;
                      return `${displayHour}:${minutes} ${ampm}`;
                    };
                    const hoursDisplay = isClosed ? 'Closed' : `${formatTime(dayHours.start_time)} - ${formatTime(dayHours.end_time)}`;
                    return (
                      <Box key={dayName} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <Typography sx={{
                          color: isToday ? colors.accent : colors.textSecondary,
                          fontWeight: isToday ? 500 : 400
                        }}>
                          {dayName}
                        </Typography>
                        <Typography sx={{
                          color: isToday ? colors.accent : (isClosed ? colors.textMuted : colors.textPrimary),
                          fontWeight: isToday ? 500 : 400
                        }}>
                          {hoursDisplay}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                  Hours not available
                </Typography>
              )}
            </Box>
          </Box>

          {/* Know Someone Section */}
          <Box sx={{
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            p: 4,
            textAlign: 'center'
          }}>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: colors.textPrimary,
              mb: 1
            }}>
              Know someone who works here?
            </Typography>
            <Typography sx={{
              color: colors.textSecondary,
              mb: 3,
              maxWidth: 400,
              mx: 'auto'
            }}>
              Share this page with the studio owner so they can claim their profile.
            </Typography>
            <Button
              onClick={handleShare}
              sx={{
                px: 3,
                py: 1,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                textTransform: 'none',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                mb: 3,
                '&:hover': { borderColor: colors.accent, color: colors.accent }
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 18 }} />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>

            <Box sx={{ borderTop: `1px solid ${colors.border}`, pt: 3 }}>
              <Typography sx={{ color: colors.textSecondary, mb: 2, fontSize: '0.9rem' }}>
                Or send them an email invite to claim this studio
              </Typography>
              {inviteSent ? (
                <Typography sx={{ color: colors.accent, fontWeight: 500 }}>
                  Invitation sent successfully!
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, maxWidth: 400, mx: 'auto' }}>
                  <TextField
                    size="small"
                    placeholder="owner@email.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        color: colors.textPrimary,
                        '& fieldset': { borderColor: colors.border },
                        '&:hover fieldset': { borderColor: colors.accent },
                        '&.Mui-focused fieldset': { borderColor: colors.accent },
                      },
                      '& .MuiInputBase-input::placeholder': { color: colors.textMuted },
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite(); }}
                  />
                  <Button
                    onClick={handleSendInvite}
                    disabled={inviteLoading || !inviteEmail}
                    sx={{
                      px: 3,
                      bgcolor: colors.accent,
                      color: colors.background,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: colors.accentHover || colors.accent },
                      '&.Mui-disabled': { bgcolor: colors.border, color: colors.textMuted },
                    }}
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                  </Button>
                </Box>
              )}
              {inviteError && (
                <Typography sx={{ color: colors.error, mt: 1, fontSize: '0.85rem' }}>
                  {inviteError}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Tattoo Gallery */}
          {gallery.length > 0 && (
            <Box sx={{
              bgcolor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              p: 3,
              mt: 3,
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.75rem',
                fontWeight: 500,
                color: colors.textPrimary,
                mb: 0.5,
              }}>
                Portfolio
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 2 }}>
                <Box component="span" sx={{ color: colors.accent, fontWeight: 600 }}>{gallery.length}</Box> pieces from this studio
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 1.5,
              }}>
                {gallery.map((tattoo: any, index: number) => {
                  const tattooStyle = tattoo.styles?.[0];
                  const styleName = typeof tattooStyle === 'string' ? tattooStyle : tattooStyle?.name;

                  return (
                    <Box
                      key={tattoo.id}
                      onClick={() => handleTattooClick(tattoo.id.toString())}
                      sx={{
                        aspectRatio: '1',
                        bgcolor: colors.background,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          zIndex: 2,
                          '& img': { transform: 'scale(1.05)' },
                          '& .overlay': { opacity: 1 },
                        },
                      }}
                    >
                      {tattoo.primary_image?.uri ? (
                        <Image
                          src={tattoo.primary_image.uri}
                          alt={tattoo.title || 'Tattoo work'}
                          fill
                          style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        />
                      ) : (
                        <Box sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.textSecondary,
                          fontSize: '0.8rem',
                          background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)`,
                        }}>
                          No Image
                        </Box>
                      )}
                      <Box
                        className="overlay"
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(15, 15, 15, 0.9) 0%, transparent 50%)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          display: 'flex',
                          alignItems: 'flex-end',
                          p: 1.5,
                        }}
                      >
                        <Box>
                          {styleName && (
                            <Typography sx={{
                              fontSize: '0.7rem',
                              color: colors.accent,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              mb: 0.25,
                            }}>
                              {styleName}
                            </Typography>
                          )}
                          <Typography sx={{
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: colors.textPrimary,
                          }}>
                            {tattoo.title || 'Untitled'}
                          </Typography>
                          {tattoo.artist_name && (
                            <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                              by {tattoo.artist_name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>

        {/* Tattoo Modal */}
        <TattooModal
          tattooId={selectedTattooId}
          open={isTattooModalOpen}
          onClose={() => { setIsTattooModalOpen(false); setSelectedTattooId(null); }}
          onPrevious={gallery.length > 1 ? () => {
            const idx = gallery.findIndex((t: any) => t.id.toString() === selectedTattooId);
            if (idx > 0) setSelectedTattooId(gallery[idx - 1].id.toString());
          } : undefined}
          onNext={gallery.length > 1 ? () => {
            const idx = gallery.findIndex((t: any) => t.id.toString() === selectedTattooId);
            if (idx < gallery.length - 1) setSelectedTattooId(gallery[idx + 1].id.toString());
          } : undefined}
          hasPrevious={gallery.findIndex((t: any) => t.id.toString() === selectedTattooId) > 0}
          hasNext={gallery.findIndex((t: any) => t.id.toString() === selectedTattooId) < gallery.length - 1}
        />
      </Layout>
    );
  }

  // Every movable section, built once so the two bands below can place them in
  // whatever order the studio saved. Which band a section belongs to is still
  // the layout's decision; the order within a band is the studio's.
  const arrangement = resolveArrangement(studio);

  // Everything can be lifted out of the Info tab, and when it has been there
  // is nothing behind the tab to click through to.
  const hasInfoBand = laneMembers('info', template, arrangement.bands).length > 0;

  const sectionNodes: Record<SectionKey, React.ReactNode> = {
    artists: (
      <StudioArtistsCard
        artists={artists}
        slug={slug}
      />
    ),
    location: (
      <StudioLocationHours
        studio={studio}
      />
    ),
    hours: (
      <StudioHoursCard
        studio={studio}
        workingHours={workingHours}
      />
    ),
    guides: (
      <StudioGuides
        guides={initialGuides}
        studioSlug={studio.slug}
      />
    ),
    contact: (
      <StudioContactCard
        studio={studio}
        canContact={canContact}
        handleContactStudio={handleContactStudio}
      />
    ),
    spotlight: (
      <StudioSpotlight
        artists={artists}
        handleTattooClick={handleTattooClick}
        slug={slug}
        spotlights={spotlights}
        studio={studio}
        router={router}
      />
    ),
  };

  /**
   * Whether a section will actually put something on the page.
   *
   * A cell is allocated per section, so a section that renders nothing still
   * took up a cell and pushed everything after it sideways - a studio with no
   * guides ended up with Contact in the right column and a hole beside it.
   * Mirrors each component's own guard; Location and Hours have none, so they
   * always draw a card.
   */
  const sectionPresent: Record<SectionKey, boolean> = {
    spotlight: spotlights.length > 0,
    artists: Boolean(artists && artists.length > 0),
    location: true,
    hours: true,
    guides: initialGuides.length > 0,
    contact: Boolean(canContact || studio.phone || studio.website),
  };

  const renderLane = (lane: Lane) => (
    <SectionBand
      lane={lane}
      arrangement={arrangement}
      nodes={sectionNodes}
      present={(key) => sectionPresent[key]}
    />
  );

  // Verified Studio View
  return (
    <Layout>
      <Head>
        <title>{studioSeoTitle(studio)}</title>
        <meta name="description" content={studioSeoDescription(studio)} />
        <link rel="canonical" href={`https://getinked.in/studios/${slug}`} />
        <meta property="og:type" content="business.business" />
        <meta property="og:title" content={studioSeoTitle(studio)} />
        <meta property="og:description" content={studioSeoDescription(studio)} />
        <meta property="og:url" content={`https://getinked.in/studios/${slug}`} />
        {(studio.image?.uri || studio.primary_image?.uri) && <meta property="og:image" content={studio.image?.uri || studio.primary_image?.uri} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={studioSeoTitle(studio)} />
        <meta name="twitter:description" content={studioSeoDescription(studio)} />
        {(studio.image?.uri || studio.primary_image?.uri) && <meta name="twitter:image" content={studio.image?.uri || studio.primary_image?.uri} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'TattooParlor',
          name: studio.name,
          ...(studio.about && { description: studio.about }),
          ...((studio.image?.uri || studio.primary_image?.uri) && { image: studio.image?.uri || studio.primary_image?.uri }),
          url: `https://getinked.in/studios/${slug}`,
          ...(studio.phone && { telephone: studio.phone }),
          ...(studio.email && { email: studio.email }),
          ...(studio.website && { sameAs: [studio.website] }),
          ...(studio.address && {
            address: {
              '@type': 'PostalAddress',
              streetAddress: studio.address,
              addressLocality: studio.city,
              addressRegion: studio.state,
              postalCode: studio.postal_code,
            },
          }),
          ...(studio.location_lat_long && {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: studio.location_lat_long.split(',')[0],
              longitude: studio.location_lat_long.split(',')[1],
            },
          }),
          ...(gallery.length > 0 && { hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Tattoo Portfolio',
            numberOfItems: gallery.length,
          }}),
        }) }} />
      </Head>

      <Snackbar
        open={showPublished}
        autoHideDuration={5000}
        onClose={dismissPublished}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={dismissPublished}
          severity="success"
          variant="filled"
          sx={{ bgcolor: colors.accent, color: colors.background }}
        >
          Your page is live. This is what visitors see.
        </Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
        <StudioBanner
          studio={studio}
        />

        <StudioAnnouncements
          studio={studio}
        />

        <StudioHeader
          artists={artists}
          canContact={canContact}
          handleContactStudio={handleContactStudio}
          handleSaveStudio={handleSaveStudio}
          isSaved={isSaved}
          studio={studio}
          studioStyles={studioStyles}
        />

        {/* The layout decides what leads: team the people, storefront whether
            you are open. The studio decides the order among them. */}
        {renderLane('feature')}

        {/* Page Tabs */}
        {hasInfoBand && <StudioTabBar activeTab={activeTab} onChange={handleTabChange} />}

        {/* Tab Content */}
        {(activeTab === 0 || !hasInfoBand) ? (
          /* Portfolio Tab */
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 3 }}>
            {/* Main Content */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 3,
              border: `1px solid ${colors.border}`
            }}>
              {/* Content Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography sx={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: '1.75rem',
                    fontWeight: 500,
                    color: colors.textPrimary
                  }}>
                    Portfolio
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                    <Box component="span" sx={{ color: colors.accent, fontWeight: 600 }}>{filteredPortfolio.length}</Box> pieces · Showing <Box component="span" sx={{ color: colors.accent, fontWeight: 600 }}>{selectedStyleFilter === 'all' ? 'all styles' : selectedStyleFilter}</Box>
                  </Typography>
                </Box>
              </Box>

              <StudioPortfolioGrid
                filteredPortfolio={filteredPortfolio}
                handleTattooClick={handleTattooClick}
              />
            </Box>

            {/* Sidebar */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <StudioFilterCard
                selectedStyleFilter={selectedStyleFilter}
                setSelectedStyleFilter={setSelectedStyleFilter}
                studioStyles={studioStyles}
              />

              {bandOf('artists', template, arrangement.bands) === null && (
                <StudioArtistsCard
                  artists={artists}
                  slug={slug}
                />
              )}

              <StudioInfoCard
                studio={studio}
                todayHours={todayHours}
              />

              <StudioQuickActions
                canContact={canContact}
                copied={copied}
                handleContactStudio={handleContactStudio}
                handleSaveStudio={handleSaveStudio}
                handleShare={handleShare}
                isSaved={isSaved}
                studio={studio}
              />
            </Box>
          </Box>
        ) : (
          /* Info Tab */
          renderLane('info')
        )}
      </Box>

      {/* Tattoo Detail Modal */}
      <TattooModal
        tattooId={selectedTattooId}
        artistName={null}
        open={isTattooModalOpen}
        onClose={handleCloseTattooModal}
        onPrevious={handlePreviousTattoo}
        onNext={handleNextTattoo}
        hasPrevious={getCurrentTattooIndex() > 0}
        hasNext={getCurrentTattooIndex() < filteredPortfolio.length - 1}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { slug } = context.params || {};
    if (!slug || typeof slug !== 'string') {
        return { notFound: true };
    }

    // An owner who has just published gets an uncached render, so they never
    // see their own page as it was before the edit. The cookie is set by the
    // editor on publish and expires on its own.
    const recentlyEdited = context.req.cookies?.[RECENTLY_EDITED_COOKIE];

    if (recentlyEdited === slug) {
        context.res.setHeader('Cache-Control', 'private, no-store');
    } else {
        // Everyone else gets a short shared cache. The previous policy also
        // carried stale-while-revalidate=300, which meant a visitor could be
        // served a page up to six minutes old rather than the intended one.
        context.res.setHeader('Cache-Control', 'public, s-maxage=30');
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    const appToken = process.env.NEXT_PUBLIC_API_APP_TOKEN || '';

    try {
        const response = await fetch(`${apiUrl}/api/studios/${slug}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...(appToken ? { 'X-App-Token': appToken } : {}),
            },
        });

        if (!response.ok) {
            return { notFound: true };
        }

        const data = await response.json();
        const studio = data?.studio || null;

        if (!studio) {
            return { notFound: true };
        }

        // Spotlights render above the fold, so they are fetched server-side
        // rather than after hydration. A failure here leaves the strip hidden
        // rather than failing the page.
        let initialGuides: any[] = [];
        try {
            const res = await fetch(`${apiUrl}/api/studios/${slug}/guides`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...(appToken ? { 'X-App-Token': appToken } : {}),
                },
            });

            if (res.ok) {
                initialGuides = (await res.json())?.guides || [];
            }
        } catch {
            // Leave the list empty
        }

        let initialSpotlights: any[] = [];
        try {
            const spotlightResponse = await fetch(`${apiUrl}/api/studios/${slug}/spotlights`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...(appToken ? { 'X-App-Token': appToken } : {}),
                },
            });

            if (spotlightResponse.ok) {
                const spotlightData = await spotlightResponse.json();
                initialSpotlights = spotlightData?.spotlights || [];
            }
        } catch {
            // Leave the strip empty
        }

        return {
            props: {
                initialStudio: studio,
                initialSpotlights,
                initialGuides,
            },
        };
    } catch {
        // If server-side fetch fails, fall back to client-side rendering
        return { props: {} };
    }
};
