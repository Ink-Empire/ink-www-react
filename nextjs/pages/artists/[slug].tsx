import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Box, Button, Modal, Paper, IconButton, Typography, Avatar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import { useArtist } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import TattooUpload from '@/components/TattooUpload';
import ArtistProfileCalendar from '@/components/ArtistProfileCalendar';
import BookingModal from '@/components/BookingModal';
import { colors } from '@/styles/colors';

export default function ArtistDetail() {
    const router = useRouter();
    const { slug } = router.query;
    const { artist, loading: artistLoading, error: artistError } = useArtist(slug as string);
    const { user, isAuthenticated } = useAuth();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedWorkingHours, setSelectedWorkingHours] = useState<any>(null);
    const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('all');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    const isOwner = isAuthenticated && user && (user.slug === slug || user.id === artist?.id);
    const portfolio = artist?.tattoos || [];

    // Get unique styles from artist
    const artistStyles = useMemo(() => {
        if (!artist?.styles) return [];
        return artist.styles.map((style: any) =>
            typeof style === 'string' ? style : style.name
        );
    }, [artist?.styles]);

    // Filter portfolio by selected style
    const filteredPortfolio = useMemo(() => {
        if (selectedStyleFilter === 'all') return portfolio;
        return portfolio.filter((tattoo: any) => {
            const tattooStyles = tattoo.styles || [];
            return tattooStyles.some((s: any) => {
                const styleName = typeof s === 'string' ? s : s.name;
                return styleName?.toLowerCase() === selectedStyleFilter.toLowerCase();
            });
        });
    }, [portfolio, selectedStyleFilter]);

    const handleTabChange = (newValue: number) => {
        setActiveTab(newValue);
    };

    const handleOpenUploadModal = () => {
        setUploadModalOpen(true);
    };

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
    };

    const handleUploadSuccess = (tattooId: number) => {
        router.replace(router.asPath);
    };

    const handleDateSelected = (date: Date, workingHoursData: any, bookingType: 'consultation' | 'appointment') => {
        setSelectedDate(date);
        setSelectedWorkingHours(workingHoursData);
        setBookingModalOpen(true);
    };

    const handleCloseBookingModal = () => {
        setBookingModalOpen(false);
        setSelectedDate(null);
    };

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const navigateLightbox = (direction: number) => {
        let newIndex = lightboxIndex + direction;
        if (newIndex < 0) newIndex = filteredPortfolio.length - 1;
        if (newIndex >= filteredPortfolio.length) newIndex = 0;
        setLightboxIndex(newIndex);
    };

    const handleMessageArtist = () => {
        if (!isAuthenticated) {
            setLoginModalOpen(true);
            return;
        }
        router.push(`/inbox?artistId=${artist?.id}`);
    };

    const handleSaveArtist = () => {
        if (!isAuthenticated) {
            setLoginModalOpen(true);
            return;
        }
        // TODO: Implement save artist functionality
    };

    const currentTattoo = filteredPortfolio[lightboxIndex];

    if (artistLoading) {
        return (
            <Layout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Typography sx={{ color: colors.textSecondary }}>Loading artist details...</Typography>
                </Box>
            </Layout>
        );
    }

    if (artistError) {
        return (
            <Layout>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: colors.error }}>Error: {artistError.message}</Typography>
                </Box>
            </Layout>
        );
    }

    if (!artist) {
        return (
            <Layout>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: colors.textSecondary }}>Artist not found</Typography>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Head>
                <title>{artist.name} | InkedIn</title>
                <meta name="description" content={`Learn more about ${artist.name} and their tattoo work`} />
                <link rel="icon" href="/assets/img/logo.png" />
            </Head>

            <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
                {/* Artist Header */}
                <Box sx={{
                    display: 'flex',
                    gap: 3,
                    mb: 4,
                    pb: 3,
                    borderBottom: `1px solid ${colors.border}`,
                    flexWrap: { xs: 'wrap', md: 'nowrap' }
                }}>
                    {/* Avatar */}
                    {artist.primary_image?.uri ? (
                        <Box sx={{
                            width: 120,
                            height: 120,
                            position: 'relative',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: `2px solid ${colors.accent}4D`
                        }}>
                            <Image
                                src={artist.primary_image.uri}
                                alt={artist.name || 'Artist'}
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
                            border: `2px solid ${colors.accent}4D`
                        }}>
                            {artist.name?.charAt(0) || 'A'}
                        </Avatar>
                    )}

                    {/* Artist Details */}
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{
                            fontFamily: '"Cormorant Garamond", Georgia, serif',
                            fontSize: '2.5rem',
                            fontWeight: 500,
                            color: colors.textPrimary,
                            mb: 0.25,
                            lineHeight: 1.2
                        }}>
                            {artist.name}
                        </Typography>

                        {artist.studio_name && (
                            <Typography sx={{
                                color: colors.accent,
                                fontSize: '1rem',
                                fontWeight: 500,
                                mb: 0.25
                            }}>
                                {artist.studio_name}
                            </Typography>
                        )}

                        {artist.location && (
                            <Typography sx={{
                                color: colors.textSecondary,
                                fontSize: '0.95rem',
                                mb: 0.75
                            }}>
                                {artist.location}
                            </Typography>
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
                            <Typography sx={{ fontWeight: 500 }}>4.9</Typography>
                            <Typography sx={{ color: colors.textSecondary, fontWeight: 400 }}>(127 reviews)</Typography>
                        </Box>

                        {/* About */}
                        {artist.about && (
                            <Typography sx={{
                                color: colors.textSecondary,
                                fontSize: '0.95rem',
                                lineHeight: 1.7,
                                maxWidth: 500,
                                mb: 1
                            }}>
                                {artist.about}
                            </Typography>
                        )}

                        {/* Style Tags */}
                        {artistStyles.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                {artistStyles.map((styleName: string, index: number) => (
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

                    {/* Artist Actions */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        alignItems: { xs: 'stretch', md: 'flex-end' },
                        justifyContent: 'center',
                        width: { xs: '100%', md: 'auto' }
                    }}>
                        <Button
                            onClick={() => handleTabChange(1)}
                            sx={{
                                minWidth: 180,
                                py: 1,
                                bgcolor: colors.accent,
                                color: colors.background,
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': { bgcolor: colors.accentHover }
                            }}
                        >
                            Book Consultation
                        </Button>
                        <Button
                            onClick={handleMessageArtist}
                            sx={{
                                minWidth: 180,
                                py: 1,
                                color: colors.textPrimary,
                                border: `1px solid ${colors.border}`,
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': { borderColor: colors.accent, color: colors.accent }
                            }}
                        >
                            Message Artist
                        </Button>
                        {isOwner && (
                            <Button
                                onClick={handleOpenUploadModal}
                                sx={{
                                    minWidth: 180,
                                    py: 1,
                                    color: colors.accent,
                                    border: `1px solid ${colors.accent}`,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    '&:hover': { bgcolor: `${colors.accent}1A` }
                                }}
                            >
                                Upload New
                            </Button>
                        )}
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
                        { icon: <CalendarMonthIcon sx={{ fontSize: 18, opacity: 0.7 }} />, label: 'Calendar' }
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
                                                onClick={() => openLightbox(index)}
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
                                                    </Box>
                                                </Box>

                                                {/* Edit Button for Owner */}
                                                {isOwner && (
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/tattoos/update?id=${tattoo.id}`);
                                                        }}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8,
                                                            bgcolor: 'rgba(0,0,0,0.7)',
                                                            color: 'white',
                                                            '&:hover': { bgcolor: colors.accent, color: colors.background }
                                                        }}
                                                        size="small"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                )}
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
                                    {artistStyles.map((style: string, index: number) => (
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

                            {/* Info Card */}
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
                                    Booking Info
                                </Typography>
                                {[
                                    { label: 'Consultation', value: 'Free', accent: true },
                                    { label: 'Hourly Rate', value: artist.settings?.hourly_rate ? `$${artist.settings.hourly_rate}` : '$200 USD' },
                                    { label: 'Min. Session', value: '2 hours' },
                                    { label: 'Deposit', value: artist.settings?.deposit ? `$${artist.settings.deposit}` : '$150 USD' },
                                    { label: 'Response Time', value: '~24 hours' }
                                ].map((item, idx) => (
                                    <Box key={item.label} sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        py: 1,
                                        borderBottom: idx < 4 ? `1px solid ${colors.border}` : 'none',
                                        fontSize: '0.9rem'
                                    }}>
                                        <Typography sx={{ color: colors.textSecondary }}>{item.label}</Typography>
                                        <Typography sx={{
                                            color: item.accent ? colors.accent : colors.textPrimary,
                                            fontWeight: 500
                                        }}>
                                            {item.value}
                                        </Typography>
                                    </Box>
                                ))}
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
                                    { icon: <EventAvailableIcon sx={{ fontSize: '1.25rem' }} />, label: 'View Availability', onClick: () => handleTabChange(1) },
                                    { icon: <ChatBubbleOutlineIcon sx={{ fontSize: '1.25rem' }} />, label: 'Send Message', onClick: handleMessageArtist },
                                    { icon: <BookmarkBorderIcon sx={{ fontSize: '1.25rem' }} />, label: 'Save Artist', onClick: handleSaveArtist },
                                    { icon: <ShareIcon sx={{ fontSize: '1.25rem' }} />, label: 'Share Profile', onClick: () => navigator.clipboard.writeText(window.location.href) }
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
                                            textDecoration: 'none',
                                            mb: idx < 3 ? 1 : 0,
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
                    /* Calendar Tab */
                    <ArtistProfileCalendar
                        artistIdOrSlug={slug as string}
                        artistName={artist.name}
                        onDateSelected={handleDateSelected}
                    />
                )}
            </Box>

            {/* Lightbox Modal */}
            <Modal
                open={lightboxOpen}
                onClose={closeLightbox}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Box sx={{
                    position: 'relative',
                    maxWidth: 900,
                    maxHeight: '90vh',
                    display: 'flex',
                    gap: 3,
                    p: 2,
                    outline: 'none'
                }}>
                    {/* Close Button */}
                    <IconButton
                        onClick={closeLightbox}
                        sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            bgcolor: colors.surface,
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                            '&:hover': { bgcolor: colors.background, borderColor: colors.accent, color: colors.accent }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    {/* Nav Buttons */}
                    <IconButton
                        onClick={() => navigateLightbox(-1)}
                        sx={{
                            position: 'absolute',
                            left: -60,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: colors.surface,
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                            '&:hover': { bgcolor: colors.background, borderColor: colors.accent, color: colors.accent }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => navigateLightbox(1)}
                        sx={{
                            position: 'absolute',
                            right: -60,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: colors.surface,
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                            '&:hover': { bgcolor: colors.background, borderColor: colors.accent, color: colors.accent }
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>

                    {/* Image */}
                    <Box sx={{
                        flex: 1,
                        maxWidth: 600,
                        bgcolor: colors.surface,
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}>
                        {currentTattoo?.primary_image?.uri ? (
                            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                                <Image
                                    src={currentTattoo.primary_image.uri}
                                    alt={currentTattoo.title || 'Tattoo'}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </Box>
                        ) : (
                            <Box sx={{
                                width: '100%',
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: colors.background,
                                color: colors.textSecondary
                            }}>
                                No Image
                            </Box>
                        )}
                    </Box>

                    {/* Info Panel */}
                    <Box sx={{
                        width: 280,
                        bgcolor: colors.surface,
                        borderRadius: '12px',
                        p: 2
                    }}>
                        {currentTattoo?.styles?.[0] && (
                            <Box sx={{
                                display: 'inline-block',
                                px: 1.25,
                                py: 0.5,
                                bgcolor: `${colors.accent}1A`,
                                borderRadius: '100px',
                                fontSize: '0.8rem',
                                color: colors.accent,
                                fontWeight: 500,
                                mb: 1
                            }}>
                                {typeof currentTattoo.styles[0] === 'string' ? currentTattoo.styles[0] : currentTattoo.styles[0].name}
                            </Box>
                        )}
                        <Typography sx={{
                            fontFamily: '"Cormorant Garamond", Georgia, serif',
                            fontSize: '1.5rem',
                            fontWeight: 500,
                            color: colors.textPrimary,
                            mb: 1
                        }}>
                            {currentTattoo?.title || 'Untitled'}
                        </Typography>
                        <Typography sx={{
                            color: colors.textSecondary,
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            mb: 2
                        }}>
                            {currentTattoo?.description || 'No description available.'}
                        </Typography>

                        <Box sx={{ borderTop: `1px solid ${colors.border}`, pt: 1.5 }}>
                            {[
                                { label: 'Placement', value: currentTattoo?.placement || 'Not specified' },
                                { label: 'Artist', value: artist.name }
                            ].map((item, idx) => (
                                <Box key={idx} sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    py: 0.75,
                                    fontSize: '0.85rem'
                                }}>
                                    <Typography sx={{ color: colors.textSecondary }}>{item.label}</Typography>
                                    <Typography sx={{ color: colors.textPrimary, fontWeight: 500 }}>{item.value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Modal>

            {/* TattooUpload Modal */}
            <Modal
                open={uploadModalOpen}
                onClose={handleCloseUploadModal}
                aria-labelledby="tattoo-upload-modal"
            >
                <Paper
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        maxWidth: '90%',
                        maxHeight: '90%',
                        overflow: 'auto',
                        bgcolor: colors.surface,
                        boxShadow: 24,
                        borderRadius: 2
                    }}
                >
                    <TattooUpload
                        onClose={handleCloseUploadModal}
                        onSuccess={handleUploadSuccess}
                    />
                </Paper>
            </Modal>

            <BookingModal
                open={bookingModalOpen}
                onClose={handleCloseBookingModal}
                selectedDate={selectedDate}
                selectedWorkingHours={selectedWorkingHours}
                artistId={artist?.id}
                settings={artist?.settings}
            />

            {/* Login Required Modal */}
            <Modal
                open={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                aria-labelledby="login-required-modal"
            >
                <Paper sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    maxWidth: '90%',
                    bgcolor: colors.surface,
                    boxShadow: 24,
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center'
                }}>
                    <IconButton
                        onClick={() => setLoginModalOpen(false)}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: colors.textSecondary
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <Typography sx={{
                        fontFamily: '"Cormorant Garamond", Georgia, serif',
                        fontSize: '1.5rem',
                        fontWeight: 500,
                        color: colors.textPrimary,
                        mb: 1
                    }}>
                        Login Required
                    </Typography>

                    <Typography sx={{
                        color: colors.textSecondary,
                        mb: 3,
                        lineHeight: 1.6
                    }}>
                        Please log in or create an account to message artists and save your favorites.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            component={Link}
                            href="/login"
                            variant="outlined"
                            sx={{
                                color: colors.textPrimary,
                                borderColor: colors.border,
                                textTransform: 'none',
                                px: 3,
                                '&:hover': { borderColor: colors.accent, color: colors.accent }
                            }}
                        >
                            Log In
                        </Button>
                        <Button
                            component={Link}
                            href="/register"
                            sx={{
                                bgcolor: colors.accent,
                                color: colors.background,
                                textTransform: 'none',
                                px: 3,
                                '&:hover': { bgcolor: colors.accentHover }
                            }}
                        >
                            Sign Up
                        </Button>
                    </Box>
                </Paper>
            </Modal>
        </Layout>
    );
}
