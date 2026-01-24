import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Box, Button, Modal, Paper, IconButton, Typography, Avatar, TextField, InputAdornment, CircularProgress, Switch } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import { useArtist } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import TattooCreateWizard from '@/components/TattooCreateWizard';
import TattooModal from '@/components/TattooModal';
import ArtistProfileCalendar from '@/components/ArtistProfileCalendar';
import BookingModal from '@/components/BookingModal';
import { colors } from '@/styles/colors';

export default function ArtistDetail() {
    const router = useRouter();
    const { slug } = router.query;
    const slugString = typeof slug === 'string' ? slug : null;
    const { artist, loading: artistLoading, error: artistError, refetch } = useArtist(slugString);
    const { user, isAuthenticated } = useAuth();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedWorkingHours, setSelectedWorkingHours] = useState<any>(null);
    const [selectedBookingType, setSelectedBookingType] = useState<'consultation' | 'appointment' | null>(null);
    const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('all');
    const [selectedTattooId, setSelectedTattooId] = useState<string | null>(null);
    const [isTattooModalOpen, setIsTattooModalOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // Booking info edit state
    const [isEditingBookingInfo, setIsEditingBookingInfo] = useState(false);
    const [bookingInfoSaving, setBookingInfoSaving] = useState(false);
    const [bookingInfoError, setBookingInfoError] = useState('');
    const [bookingInfoForm, setBookingInfoForm] = useState({
        consultation_fee: '',
        hourly_rate: '',
        minimum_session: '',
        deposit_amount: '',
        accepts_consultations: false,
    });

    // Initialize booking info form when artist loads
    useEffect(() => {
        if (artist?.settings) {
            setBookingInfoForm({
                consultation_fee: String(artist.settings.consultation_fee || ''),
                hourly_rate: String(artist.settings.hourly_rate || ''),
                minimum_session: String(artist.settings.minimum_session || ''),
                deposit_amount: String(artist.settings.deposit_amount || artist.settings.deposit || ''),
                accepts_consultations: artist.settings.accepts_consultations || false,
            });
        }
    }, [artist?.settings]);

    // Record profile view when artist loads
    useEffect(() => {
        if (artist?.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.id}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('auth_token') && {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    })
                },
            }).catch(err => console.error('Failed to record profile view:', err));
        }
    }, [artist?.id]);

    const handleStartEditBookingInfo = () => {
        if (artist?.settings) {
            setBookingInfoForm({
                consultation_fee: String(artist.settings.consultation_fee || ''),
                hourly_rate: String(artist.settings.hourly_rate || ''),
                minimum_session: String(artist.settings.minimum_session || ''),
                deposit_amount: String(artist.settings.deposit_amount || artist.settings.deposit || ''),
                accepts_consultations: artist.settings.accepts_consultations || false,
            });
        }
        setIsEditingBookingInfo(true);
    };

    const handleCancelEditBookingInfo = () => {
        setIsEditingBookingInfo(false);
        setBookingInfoError('');
        // Reset form to current artist settings
        if (artist?.settings) {
            setBookingInfoForm({
                consultation_fee: String(artist.settings.consultation_fee || ''),
                hourly_rate: String(artist.settings.hourly_rate || ''),
                minimum_session: String(artist.settings.minimum_session || ''),
                deposit_amount: String(artist.settings.deposit_amount || artist.settings.deposit || ''),
                accepts_consultations: artist.settings.accepts_consultations || false,
            });
        }
    };

    const handleSaveBookingInfo = async () => {
        // Validate all fields are valid numbers
        const fields = [
            { name: 'Consultation Fee', value: bookingInfoForm.consultation_fee },
            { name: 'Hourly Rate', value: bookingInfoForm.hourly_rate },
            { name: 'Minimum Session', value: bookingInfoForm.minimum_session },
            { name: 'Deposit Amount', value: bookingInfoForm.deposit_amount },
        ];

        for (const field of fields) {
            if (field.value !== '' && (isNaN(Number(field.value)) || Number(field.value) < 0)) {
                setBookingInfoError(`${field.name} must be a valid positive number`);
                return;
            }
        }

        setBookingInfoError('');
        setBookingInfoSaving(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist?.id}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({
                    consultation_fee: Number(bookingInfoForm.consultation_fee) || 0,
                    hourly_rate: Number(bookingInfoForm.hourly_rate) || 0,
                    minimum_session: Number(bookingInfoForm.minimum_session) || 0,
                    deposit_amount: Number(bookingInfoForm.deposit_amount) || 0,
                    accepts_consultations: bookingInfoForm.accepts_consultations,
                }),
            });

            if (response.ok) {
                setIsEditingBookingInfo(false);
                refetch(); // Refresh artist data
            } else {
                setBookingInfoError('Failed to save. Please try again.');
            }
        } catch (error) {
            console.error('Error saving booking info:', error);
            setBookingInfoError('Failed to save. Please try again.');
        } finally {
            setBookingInfoSaving(false);
        }
    };

    const isOwner = isAuthenticated && user && (user.slug === slug || user.id === artist?.id);
    const portfolio = artist?.tattoos || [];

    // Get unique styles from artist or their tattoos
    const artistStyles = useMemo(() => {
        const styles = new Set<string>();

        // First try artist's declared styles
        if (artist?.styles && artist.styles.length > 0) {
            artist.styles.forEach((style: any) => {
                const name = typeof style === 'string' ? style : style.name;
                if (name) styles.add(name);
            });
        }

        // Also collect styles from their tattoos
        if (portfolio && portfolio.length > 0) {
            portfolio.forEach((tattoo: any) => {
                // Check primary_style
                if (tattoo.primary_style) {
                    const name = typeof tattoo.primary_style === 'string'
                        ? tattoo.primary_style
                        : tattoo.primary_style.name;
                    if (name) styles.add(name);
                }
                // Check styles array
                if (tattoo.styles && Array.isArray(tattoo.styles)) {
                    tattoo.styles.forEach((style: any) => {
                        const name = typeof style === 'string' ? style : style.name;
                        if (name) styles.add(name);
                    });
                }
            });
        }

        return Array.from(styles);
    }, [artist?.styles, portfolio]);

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
        // Refetch portfolio from tattoos index to get the new tattoo
        fetchPortfolio();
        setUploadModalOpen(false);
    };

    const handleDateSelected = (date: Date, workingHoursData: any, bookingType: 'consultation' | 'appointment') => {
        setSelectedDate(date);
        setSelectedWorkingHours(workingHoursData);
        setSelectedBookingType(bookingType);
        setBookingModalOpen(true);
    };

    const handleCloseBookingModal = () => {
        setBookingModalOpen(false);
        setSelectedDate(null);
        setSelectedBookingType(null);
    };

    // Tattoo modal handlers
    const handleTattooClick = (tattooId: string) => {
        setSelectedTattooId(tattooId);
        setIsTattooModalOpen(true);
    };

    const handleCloseTattooModal = () => {
        setIsTattooModalOpen(false);
        setSelectedTattooId(null);
    };

    // Get current tattoo index for navigation
    const getCurrentTattooIndex = () => {
        if (!selectedTattooId) return -1;
        return filteredPortfolio.findIndex((t: any) => t.id.toString() === selectedTattooId);
    };

    // Navigation handlers
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

    const handleShareProfile = async () => {
        const shareUrl = window.location.href;
        const shareTitle = `${artist?.name} on InkedIn`;
        const shareText = `Check out ${artist?.name}'s tattoo portfolio on InkedIn`;

        // Try native Web Share API first (works on mobile and some desktop browsers)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fall back to modal
                if ((err as Error).name !== 'AbortError') {
                    setShareModalOpen(true);
                }
            }
        } else {
            // No native share, show modal
            setShareModalOpen(true);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleShareViaEmail = () => {
        const subject = encodeURIComponent(`Check out ${artist?.name} on InkedIn`);
        const body = encodeURIComponent(`I thought you might like this tattoo artist:\n\n${artist?.name}\n${window.location.href}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const handleShareViaSMS = () => {
        const text = encodeURIComponent(`Check out ${artist?.name}'s tattoo portfolio: ${window.location.href}`);
        window.open(`sms:?body=${text}`);
    };

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
                {/* Back Button */}
                <Box
                    onClick={() => router.back()}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: colors.textSecondary,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        mb: 2,
                        transition: 'color 0.2s',
                        '&:hover': { color: colors.accent }
                    }}
                >
                    <ArrowBackIcon sx={{ fontSize: '1rem' }} />
                    Back to results
                </Box>

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
                    {(artist.image?.uri || artist.primary_image?.uri) ? (
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
                                src={artist.image?.uri || artist.primary_image?.uri}
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                    <Typography sx={{
                                        fontFamily: '"Cormorant Garamond", Georgia, serif',
                                        fontSize: '1.25rem',
                                        fontWeight: 500,
                                        color: colors.textPrimary
                                    }}>
                                        Booking Info
                                    </Typography>
                                    {isOwner && !isEditingBookingInfo && (
                                        <IconButton
                                            onClick={handleStartEditBookingInfo}
                                            size="small"
                                            sx={{
                                                color: colors.textSecondary,
                                                '&:hover': { color: colors.accent }
                                            }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>

                                {isEditingBookingInfo ? (
                                    /* Edit Mode */
                                    <Box>
                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem', mb: 0.5 }}>
                                                Consultation Fee
                                            </Typography>
                                            <TextField
                                                size="small"
                                                value={bookingInfoForm.consultation_fee}
                                                onChange={(e) => setBookingInfoForm({ ...bookingInfoForm, consultation_fee: e.target.value })}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                }}
                                                sx={{
                                                    width: '100%',
                                                    '& .MuiOutlinedInput-root': {
                                                        bgcolor: colors.background,
                                                        '& fieldset': { borderColor: colors.border },
                                                        '&:hover fieldset': { borderColor: colors.textSecondary },
                                                        '&.Mui-focused fieldset': { borderColor: colors.accent },
                                                    },
                                                    '& .MuiInputBase-input': { color: colors.textPrimary },
                                                    '& .MuiInputAdornment-root': { color: colors.textSecondary },
                                                }}
                                                placeholder="0 for free"
                                            />
                                        </Box>

                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem', mb: 0.5 }}>
                                                Hourly Rate
                                            </Typography>
                                            <TextField
                                                size="small"
                                                value={bookingInfoForm.hourly_rate}
                                                onChange={(e) => setBookingInfoForm({ ...bookingInfoForm, hourly_rate: e.target.value })}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                }}
                                                sx={{
                                                    width: '100%',
                                                    '& .MuiOutlinedInput-root': {
                                                        bgcolor: colors.background,
                                                        '& fieldset': { borderColor: colors.border },
                                                        '&:hover fieldset': { borderColor: colors.textSecondary },
                                                        '&.Mui-focused fieldset': { borderColor: colors.accent },
                                                    },
                                                    '& .MuiInputBase-input': { color: colors.textPrimary },
                                                    '& .MuiInputAdornment-root': { color: colors.textSecondary },
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem', mb: 0.5 }}>
                                                Minimum Session (hours)
                                            </Typography>
                                            <TextField
                                                size="small"
                                                value={bookingInfoForm.minimum_session}
                                                onChange={(e) => setBookingInfoForm({ ...bookingInfoForm, minimum_session: e.target.value })}
                                                sx={{
                                                    width: '100%',
                                                    '& .MuiOutlinedInput-root': {
                                                        bgcolor: colors.background,
                                                        '& fieldset': { borderColor: colors.border },
                                                        '&:hover fieldset': { borderColor: colors.textSecondary },
                                                        '&.Mui-focused fieldset': { borderColor: colors.accent },
                                                    },
                                                    '& .MuiInputBase-input': { color: colors.textPrimary },
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem', mb: 0.5 }}>
                                                Deposit Amount
                                            </Typography>
                                            <TextField
                                                size="small"
                                                value={bookingInfoForm.deposit_amount}
                                                onChange={(e) => setBookingInfoForm({ ...bookingInfoForm, deposit_amount: e.target.value })}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                }}
                                                sx={{
                                                    width: '100%',
                                                    '& .MuiOutlinedInput-root': {
                                                        bgcolor: colors.background,
                                                        '& fieldset': { borderColor: colors.border },
                                                        '&:hover fieldset': { borderColor: colors.textSecondary },
                                                        '&.Mui-focused fieldset': { borderColor: colors.accent },
                                                    },
                                                    '& .MuiInputBase-input': { color: colors.textPrimary },
                                                    '& .MuiInputAdornment-root': { color: colors.textSecondary },
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 1.5,
                                            py: 1,
                                            borderTop: `1px solid ${colors.border}`,
                                            mt: 1
                                        }}>
                                            <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                                Accepts Consultations
                                            </Typography>
                                            <Switch
                                                checked={bookingInfoForm.accepts_consultations}
                                                onChange={(e) => setBookingInfoForm({ ...bookingInfoForm, accepts_consultations: e.target.checked })}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: colors.accent,
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                        backgroundColor: colors.accent,
                                                    },
                                                }}
                                            />
                                        </Box>

                                        {bookingInfoError && (
                                            <Typography sx={{ color: colors.error, fontSize: '0.8rem', mb: 1 }}>
                                                {bookingInfoError}
                                            </Typography>
                                        )}

                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Button
                                                onClick={handleCancelEditBookingInfo}
                                                disabled={bookingInfoSaving}
                                                sx={{
                                                    flex: 1,
                                                    color: colors.textSecondary,
                                                    border: `1px solid ${colors.border}`,
                                                    textTransform: 'none',
                                                    '&:hover': { borderColor: colors.textSecondary }
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSaveBookingInfo}
                                                disabled={bookingInfoSaving}
                                                sx={{
                                                    flex: 1,
                                                    bgcolor: colors.accent,
                                                    color: colors.background,
                                                    textTransform: 'none',
                                                    '&:hover': { bgcolor: colors.accentHover },
                                                    '&.Mui-disabled': { bgcolor: `${colors.accent}80` }
                                                }}
                                            >
                                                {bookingInfoSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    /* Display Mode */
                                    <>
                                        {[
                                            ...(bookingInfoForm.accepts_consultations ? [{
                                                label: 'Consultation',
                                                value: Number(bookingInfoForm.consultation_fee) > 0 ? `$${bookingInfoForm.consultation_fee}` : 'Free',
                                                accent: !bookingInfoForm.consultation_fee || Number(bookingInfoForm.consultation_fee) === 0
                                            }] : []),
                                            { label: 'Hourly Rate', value: Number(bookingInfoForm.hourly_rate) > 0 ? `$${bookingInfoForm.hourly_rate} USD` : 'Not set' },
                                            { label: 'Min. Session', value: Number(bookingInfoForm.minimum_session) > 0 ? `${bookingInfoForm.minimum_session} hours` : 'Not set' },
                                            { label: 'Deposit', value: Number(bookingInfoForm.deposit_amount) > 0 ? `$${bookingInfoForm.deposit_amount} USD` : 'Not set' }
                                        ].map((item, idx, arr) => (
                                            <Box key={item.label} sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                py: 1,
                                                borderBottom: idx < arr.length - 1 ? `1px solid ${colors.border}` : 'none',
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
                                    </>
                                )}
                            </Box>

                            {/* Quick Actions - only show for non-owners */}
                            {!isOwner && (
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
                                        { icon: <ShareIcon sx={{ fontSize: '1.25rem' }} />, label: 'Share Profile', onClick: handleShareProfile }
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
                            )}
                        </Box>
                    </Box>
                ) : (
                    /* Calendar Tab */
                    <ArtistProfileCalendar
                        artistIdOrSlug={slug as string}
                        artistId={artist.id}
                        artistName={artist.name}
                        onDateSelected={handleDateSelected}
                    />
                )}
            </Box>

            {/* Tattoo Detail Modal */}
            <TattooModal
                tattooId={selectedTattooId}
                artistName={artist.name}
                open={isTattooModalOpen}
                onClose={handleCloseTattooModal}
                onPrevious={handlePreviousTattoo}
                onNext={handleNextTattoo}
                hasPrevious={getCurrentTattooIndex() > 0}
                hasNext={getCurrentTattooIndex() < filteredPortfolio.length - 1}
            />

            {/* Tattoo Create Wizard */}
            <TattooCreateWizard
                open={uploadModalOpen}
                onClose={handleCloseUploadModal}
                onSuccess={() => {
                    handleCloseUploadModal();
                    refetch();
                }}
            />

            <BookingModal
                open={bookingModalOpen}
                onClose={handleCloseBookingModal}
                selectedDate={selectedDate}
                selectedWorkingHours={selectedWorkingHours}
                artistId={artist?.id}
                artistTimezone={artist?.timezone}
                settings={artist?.settings}
                bookingType={selectedBookingType}
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

            {/* Share Profile Modal */}
            <Modal
                open={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                aria-labelledby="share-profile-modal"
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
                    p: 4
                }}>
                    <IconButton
                        onClick={() => setShareModalOpen(false)}
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
                        mb: 3,
                        textAlign: 'center'
                    }}>
                        Share Profile
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                            onClick={handleCopyLink}
                            startIcon={linkCopied ? <CheckIcon /> : <ContentCopyIcon />}
                            sx={{
                                justifyContent: 'flex-start',
                                color: linkCopied ? colors.accent : colors.textPrimary,
                                border: `1px solid ${linkCopied ? colors.accent : colors.border}`,
                                textTransform: 'none',
                                py: 1.5,
                                px: 2,
                                '&:hover': { borderColor: colors.accent, bgcolor: `${colors.accent}1A` }
                            }}
                        >
                            {linkCopied ? 'Link Copied!' : 'Copy Link'}
                        </Button>

                        <Button
                            onClick={handleShareViaEmail}
                            startIcon={<EmailIcon />}
                            sx={{
                                justifyContent: 'flex-start',
                                color: colors.textPrimary,
                                border: `1px solid ${colors.border}`,
                                textTransform: 'none',
                                py: 1.5,
                                px: 2,
                                '&:hover': { borderColor: colors.accent, bgcolor: `${colors.accent}1A` }
                            }}
                        >
                            Share via Email
                        </Button>

                        <Button
                            onClick={handleShareViaSMS}
                            startIcon={<SmsIcon />}
                            sx={{
                                justifyContent: 'flex-start',
                                color: colors.textPrimary,
                                border: `1px solid ${colors.border}`,
                                textTransform: 'none',
                                py: 1.5,
                                px: 2,
                                '&:hover': { borderColor: colors.accent, bgcolor: `${colors.accent}1A` }
                            }}
                        >
                            Share via Text
                        </Button>
                    </Box>
                </Paper>
            </Modal>
        </Layout>
    );
}
