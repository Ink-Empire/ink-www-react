import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Box, Button, Avatar, Typography, IconButton } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
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
import { useStudio, useStudioArtists, useStudioGallery } from '../../hooks/useStudios';
import { useAuth } from '../../contexts/AuthContext';
import TattooModal from '@/components/TattooModal';
import { colors } from '@/styles/colors';

export default function StudioDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { studio, loading: studioLoading, error: studioError } = useStudio(slug as string);
  const { artists } = useStudioArtists(slug as string);
  const { gallery } = useStudioGallery(slug as string);
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('all');
  const [selectedTattooId, setSelectedTattooId] = useState<string | null>(null);
  const [isTattooModalOpen, setIsTattooModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if studio is verified/claimed
  const isVerified = studio?.is_verified || studio?.verified || false;

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
    // TODO: Implement contact functionality
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

  // Get studio hours for today
  const getTodayHours = () => {
    if (!studio?.hours) return null;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return studio.hours.find((h: any) => h.day === today);
  };

  if (studioLoading) {
    return (
      <Layout>
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
    return (
      <Layout>
        <Head>
          <title>{studio.name} | InkedIn</title>
          <meta name="description" content={`${studio.name} tattoo studio`} />
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
            {studio.primary_image?.uri ? (
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
                  src={studio.primary_image.uri}
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
              href="/claim-studio"
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
              {studio.hours && studio.hours.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {studio.hours.map((item: any) => {
                    const isToday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()] === item.day;
                    return (
                      <Box key={item.day} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <Typography sx={{
                          color: isToday ? colors.accent : colors.textSecondary,
                          fontWeight: isToday ? 500 : 400
                        }}>
                          {item.day}
                        </Typography>
                        <Typography sx={{
                          color: isToday ? colors.accent : colors.textPrimary,
                          fontWeight: isToday ? 500 : 400
                        }}>
                          {item.hours || 'Closed'}
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
                '&:hover': { borderColor: colors.accent, color: colors.accent }
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 18 }} />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </Box>
        </Box>
      </Layout>
    );
  }

  // Verified Studio View
  return (
    <Layout>
      <Head>
        <title>{studio.name} | InkedIn</title>
        <meta name="description" content={studio.about?.substring(0, 160) || `${studio.name} tattoo studio`} />
      </Head>

      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
        {/* Studio Header */}
        <Box sx={{
          display: 'flex',
          gap: 3,
          mb: 4,
          pb: 3,
          borderBottom: `1px solid ${colors.border}`,
          flexWrap: { xs: 'wrap', md: 'nowrap' }
        }}>
          {/* Avatar */}
          {studio.primary_image?.uri ? (
            <Box sx={{
              width: 120,
              height: 120,
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              flexShrink: 0,
              border: `2px solid ${colors.accent}4D`
            }}>
              <Image
                src={studio.primary_image.uri}
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
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '2.5rem',
              fontWeight: 600,
              color: colors.accent,
              border: `2px solid ${colors.accent}4D`,
              flexShrink: 0
            }}>
              {studio.name?.substring(0, 2).toUpperCase() || 'ST'}
            </Box>
          )}

          {/* Studio Details */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '2.5rem',
                fontWeight: 500,
                color: colors.textPrimary,
                lineHeight: 1.2
              }}>
                {studio.name}
              </Typography>
              <VerifiedIcon sx={{ fontSize: 24, color: '#6495ED' }} />
            </Box>

            {studio.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.textSecondary, mb: 0.75 }}>
                <LocationOnIcon sx={{ fontSize: 18, color: colors.accent }} />
                {studio.location}
              </Box>
            )}

            {/* Rating */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: colors.accent,
              fontWeight: 500,
              mb: 1
            }}>
              <StarIcon sx={{ fontSize: '1rem' }} />
              <Typography sx={{ fontWeight: 500 }}>{studio.rating || '4.9'}</Typography>
              <Typography sx={{ color: colors.textSecondary, fontWeight: 400 }}>({studio.review_count || 0} reviews)</Typography>
              {artists && artists.length > 0 && (
                <>
                  <Box sx={{ mx: 1, color: colors.textMuted }}>·</Box>
                  <Typography sx={{ color: colors.textSecondary }}>{artists.length} Artists</Typography>
                </>
              )}
            </Box>

            {/* About */}
            {studio.about && (
              <Typography sx={{
                color: colors.textSecondary,
                fontSize: '0.95rem',
                lineHeight: 1.7,
                maxWidth: 500,
                mb: 1
              }}>
                {studio.about}
              </Typography>
            )}

            {/* Style Tags */}
            {studioStyles.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {studioStyles.slice(0, 5).map((styleName: string, index: number) => (
                  <Box key={index} sx={{
                    px: 1.25,
                    py: 0.5,
                    bgcolor: `${colors.accent}1A`,
                    borderRadius: '100px',
                    fontSize: '0.8rem',
                    color: colors.accent,
                    fontWeight: 500
                  }}>
                    {styleName}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Studio Actions */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: { xs: 'stretch', md: 'flex-end' },
            justifyContent: 'center',
            width: { xs: '100%', md: 'auto' }
          }}>
            <Button
              onClick={handleContactStudio}
              sx={{
                minWidth: 180,
                py: 1,
                bgcolor: colors.accent,
                color: colors.background,
                textTransform: 'none',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                '&:hover': { bgcolor: colors.accentHover }
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
              Contact Studio
            </Button>
            <Button
              onClick={handleSaveStudio}
              sx={{
                minWidth: 180,
                py: 1,
                color: isSaved ? colors.accent : colors.textPrimary,
                border: `1px solid ${isSaved ? colors.accent : colors.border}`,
                textTransform: 'none',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                '&:hover': { borderColor: colors.accent, color: colors.accent }
              }}
            >
              <BookmarkBorderIcon sx={{ fontSize: 18 }} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </Box>
        </Box>

        {/* Page Tabs */}
        <Box sx={{
          display: 'flex',
          gap: 0,
          mb: 3,
          borderBottom: `1px solid ${colors.border}`
        }}>
          {[
            { icon: <ImageIcon sx={{ fontSize: 18, opacity: 0.7 }} />, label: 'Portfolio' },
            { icon: <InfoIcon sx={{ fontSize: 18, opacity: 0.7 }} />, label: 'Info' }
          ].map((tab, index) => (
            <Box
              key={index}
              onClick={() => handleTabChange(index)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                color: activeTab === index ? colors.accent : colors.textSecondary,
                fontWeight: 500,
                fontSize: '0.95rem',
                position: 'relative',
                transition: 'color 0.2s',
                '&:hover': { color: colors.textPrimary },
                '&::after': activeTab === index ? {
                  content: '""',
                  position: 'absolute',
                  bottom: -1,
                  left: 0,
                  right: 0,
                  height: 2,
                  bgcolor: colors.accent
                } : {}
              }}
            >
              {tab.icon}
              {tab.label}
            </Box>
          ))}
        </Box>

        {/* Tab Content */}
        {activeTab === 0 ? (
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

              {/* Portfolio Grid */}
              {filteredPortfolio.length > 0 ? (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                  gap: 1.5
                }}>
                  {filteredPortfolio.map((tattoo: any, index: number) => {
                    const isFeatured = index === 0;
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
                          ...(isFeatured && {
                            gridColumn: { xs: 'span 2', sm: 'span 2' },
                            gridRow: { xs: 'span 1', sm: 'span 2' }
                          }),
                          '&:hover': {
                            transform: 'scale(1.02)',
                            zIndex: 2,
                            '& img': { transform: 'scale(1.05)' },
                            '& .overlay': { opacity: 1 }
                          }
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
                            background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)`
                          }}>
                            No Image
                          </Box>
                        )}

                        {/* Overlay */}
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
                            p: 1.5
                          }}
                        >
                          <Box>
                            {styleName && (
                              <Typography sx={{
                                fontSize: '0.7rem',
                                color: colors.accent,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                mb: 0.25
                              }}>
                                {styleName}
                              </Typography>
                            )}
                            <Typography sx={{
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              color: colors.textPrimary
                            }}>
                              {tattoo.title || 'Untitled'}
                            </Typography>
                            {tattoo.artist?.name && (
                              <Typography sx={{
                                fontSize: '0.8rem',
                                color: colors.textSecondary
                              }}>
                                by {tattoo.artist.name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography sx={{ color: colors.textSecondary }}>No portfolio items found.</Typography>
                </Box>
              )}
            </Box>

            {/* Sidebar */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Filter Card */}
              <Box sx={{
                bgcolor: colors.surface,
                borderRadius: '12px',
                p: 2,
                border: `1px solid ${colors.border}`
              }}>
                <Box sx={{
                  bgcolor: `${colors.accent}1A`,
                  border: `1px solid ${colors.accent}4D`,
                  borderRadius: '8px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1.5
                }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: colors.accent, borderRadius: '50%' }} />
                  <Typography sx={{ fontSize: '0.85rem', color: colors.textPrimary }}>
                    Showing <Box component="strong" sx={{ color: colors.accent }}>{selectedStyleFilter === 'all' ? 'all' : selectedStyleFilter}</Box> work
                  </Typography>
                </Box>

                <Typography sx={{
                  fontSize: '0.8rem',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  mb: 1
                }}>
                  Filter by style
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  <Box
                    onClick={() => setSelectedStyleFilter('all')}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '100px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ...(selectedStyleFilter === 'all' ? {
                        bgcolor: colors.accent,
                        color: colors.background,
                        border: `1px solid ${colors.accent}`
                      } : {
                        bgcolor: colors.background,
                        color: colors.textSecondary,
                        border: `1px solid ${colors.border}`,
                        '&:hover': { borderColor: colors.textSecondary, color: colors.textPrimary }
                      })
                    }}
                  >
                    All
                  </Box>
                  {studioStyles.map((style: string, index: number) => (
                    <Box
                      key={index}
                      onClick={() => setSelectedStyleFilter(style)}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        borderRadius: '100px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        ...(selectedStyleFilter === style ? {
                          bgcolor: colors.accent,
                          color: colors.background,
                          border: `1px solid ${colors.accent}`
                        } : {
                          bgcolor: colors.background,
                          color: colors.textSecondary,
                          border: `1px solid ${colors.border}`,
                          '&:hover': { borderColor: colors.textSecondary, color: colors.textPrimary }
                        })
                      }}
                    >
                      {style}
                    </Box>
                  ))}
                </Box>
              </Box>

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
                          {artist.primary_image?.uri ? (
                            <Box sx={{
                              width: 40,
                              height: 40,
                              position: 'relative',
                              borderRadius: '50%',
                              overflow: 'hidden'
                            }}>
                              <Image
                                src={artist.primary_image.uri}
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
                          <Box sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: '100px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            bgcolor: artist.books_open ? `${colors.success}26` : `${colors.accent}26`,
                            color: artist.books_open ? colors.success : colors.accent
                          }}>
                            {artist.books_open ? 'Open' : 'Booked'}
                          </Box>
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

              {/* Studio Info Card */}
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
                  Studio Info
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {studio.phone && (
                    <Box
                      component="a"
                      href={`tel:${studio.phone}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      {studio.phone}
                    </Box>
                  )}
                  {studio.email && (
                    <Box
                      component="a"
                      href={`mailto:${studio.email}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <EmailIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      {studio.email}
                    </Box>
                  )}
                  {studio.website && (
                    <Box
                      component="a"
                      href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <LanguageIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      {studio.website.replace(/^https?:\/\//, '')}
                    </Box>
                  )}
                  {studio.instagram && (
                    <Box
                      component="a"
                      href={`https://instagram.com/${studio.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <InstagramIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      @{studio.instagram}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Quick Actions */}
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
                  Quick Actions
                </Typography>
                {[
                  { icon: <ChatBubbleOutlineIcon sx={{ fontSize: '1.25rem' }} />, label: 'Contact Studio', onClick: handleContactStudio },
                  { icon: <BookmarkBorderIcon sx={{ fontSize: '1.25rem' }} />, label: isSaved ? 'Saved' : 'Save Studio', onClick: handleSaveStudio },
                  { icon: <ShareIcon sx={{ fontSize: '1.25rem' }} />, label: copied ? 'Copied!' : 'Share Profile', onClick: handleShare }
                ].map((action, idx) => (
                  <Box
                    key={idx}
                    onClick={action.onClick}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.25,
                      bgcolor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.textPrimary,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      mb: idx < 2 ? 1 : 0,
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: colors.accent, color: colors.accent }
                    }}
                  >
                    <Box sx={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>{action.icon}</Box>
                    {action.label}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          /* Info Tab */
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Location & Hours */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 3,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.5rem',
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

            {/* Hours */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 3,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 500,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <AccessTimeIcon sx={{ color: colors.accent }} />
                Hours
              </Typography>
              {studio.hours && studio.hours.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {studio.hours.map((item: any) => {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const isToday = days[new Date().getDay()] === item.day;
                    return (
                      <Box key={item.day} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <Typography sx={{
                          color: isToday ? colors.accent : colors.textSecondary,
                          fontWeight: isToday ? 500 : 400
                        }}>
                          {item.day}
                        </Typography>
                        <Typography sx={{
                          color: isToday ? colors.accent : colors.textPrimary,
                          fontWeight: isToday ? 500 : 400
                        }}>
                          {item.hours || 'Closed'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                  Hours not available. Contact the studio for availability.
                </Typography>
              )}
            </Box>

            {/* About */}
            {studio.about && (
              <Box sx={{
                bgcolor: colors.surface,
                borderRadius: '12px',
                p: 3,
                border: `1px solid ${colors.border}`,
                gridColumn: { xs: '1', md: '1 / -1' }
              }}>
                <Typography sx={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  mb: 2
                }}>
                  About
                </Typography>
                <Typography sx={{ color: colors.textSecondary, lineHeight: 1.8 }}>
                  {studio.about}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Tattoo Detail Modal */}
      <TattooModal
        tattooId={selectedTattooId}
        artistName={studio.name}
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
