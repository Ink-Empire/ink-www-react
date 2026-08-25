import React from 'react';
import { Box, Typography, TextField, Button, Avatar, Switch, CircularProgress, IconButton } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhoneIcon from '@mui/icons-material/Phone';
import ComingSoonBadge from '../ui/ComingSoonBadge';
import PushPinIcon from '@mui/icons-material/PushPin';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import { colors } from '@/styles/colors';
import Card from './Card';
import CardLink from './CardLink';
import type { StudioDashboard } from '@/hooks/useStudioDashboard';

interface StudioSideColumnProps {
  studio: StudioDashboard;
  studioSlug?: string;
  currentUserId?: number;
  currentUserName?: string;
  userAvatarUrl?: string;
  userInitials: string;
  onAddArtist: () => void;
  onManageHours: () => void;
  onManageSpotlight: () => void;
  onEditStudio: () => void;
  onChangePassword: () => void;
}

/**
 * The studio side column: contact details, hours, spotlight, announcements
 * and security. The markup is unchanged from the dashboard page it came from;
 * the state it reads now lives in useStudioDashboard.
 */
const StudioSideColumn: React.FC<StudioSideColumnProps> = ({
  studio,
  studioSlug,
  currentUserId,
  currentUserName,
  userAvatarUrl,
  userInitials,
  onAddArtist,
  onManageHours,
  onManageSpotlight,
  onEditStudio,
  onChangePassword,
}) => {
  const {
    studioData,
    studioArtists,
    announcements,
    seekingGuests,
    guestSpotDetails,
    setGuestSpotDetails,
    isSavingGuestDetails,
    studioWorkingHours,
    isEditingContact,
    setIsEditingContact,
    contactForm,
    setContactForm,
    isSavingContact,
    spotlights,
    newAnnouncement,
    setNewAnnouncement,
    isAddingAnnouncement,
    handleToggleSeekingGuests,
    handleSaveGuestSpotDetails,
    handleSaveContactInfo,
    handleCancelContactEdit,
    handleRemoveArtist,
    handleVerifyArtist,
    handleUnverifyArtist,
    handleAddAnnouncement,
    handleDeleteAnnouncement,
  } = studio;


  return (
              <>
                {/* Your Studio Page - everything that changes what visitors see */}
                <Card title="Your Studio Page">
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 2 }}>
                      This is the page people find when they look you up.
                    </Typography>

                    <Button
                      onClick={() => onEditStudio()}
                      startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                      fullWidth
                      sx={{
                        bgcolor: colors.accent,
                        color: colors.background,
                        textTransform: 'none',
                        fontSize: '1rem',
                        py: 1.25,
                        mb: 1,
                        '&:hover': { bgcolor: colors.accent, opacity: 0.9 },
                      }}
                    >
                      Edit Studio Page
                    </Button>

                    <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: 1.5 }}>
                      Change your name, photo, banner and description.
                    </Typography>

                    {studioSlug && (
                      <Button
                        component="a"
                        href={`/studios/${studioSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<OpenInNewIcon sx={{ fontSize: 18 }} />}
                        fullWidth
                        variant="outlined"
                        sx={{
                          color: colors.textPrimary,
                          borderColor: colors.border,
                          textTransform: 'none',
                        }}
                      >
                        See how your page looks
                      </Button>
                    )}
                  </Box>
                </Card>
                {/* Spotlight */}
                <Card title="Spotlight">
                  <Box sx={{ p: 2 }}>
                    {spotlights.length > 0 ? (
                      <>
                        <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 1.5 }}>
                          These show at the top of your page right now.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          {spotlights.map((spotlight: any) => {
                            const item = spotlight.item;
                            if (!item) return null;
                            const isArtist = spotlight.type === 'artist';
                            const uri = isArtist ? item.image?.uri : item.primary_image?.uri;
                            const label = isArtist ? item.name : (item.title || 'Untitled');

                            return (
                              <Box key={spotlight.id} sx={{ width: 64, textAlign: 'center' }}>
                                <Box sx={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: '8px',
                                  bgcolor: colors.background,
                                  border: `1px solid ${colors.border}`,
                                  backgroundImage: uri ? `url(${uri})` : 'none',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }} />
                                <Typography noWrap sx={{ fontSize: '0.7rem', color: colors.textSecondary, mt: 0.5 }}>
                                  {label}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </>
                    ) : (
                      <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 2 }}>
                        Nothing in your Spotlight yet. Pick a few artists or tattoos
                        and they will show at the top of your page.
                      </Typography>
                    )}

                    <Button
                      onClick={() => onManageSpotlight()}
                      startIcon={<PushPinIcon sx={{ fontSize: 18 }} />}
                      fullWidth
                      variant="outlined"
                      sx={{
                        color: colors.textPrimary,
                        borderColor: colors.border,
                        textTransform: 'none',
                        py: 1,
                      }}
                    >
                      {spotlights.length > 0 ? 'Change your Spotlight' : 'Choose your Spotlight'}
                    </Button>
                  </Box>
                </Card>
                {/* Announcements */}
                <Card title="Announcements">
                  <Box>
                    {/* Add new announcement form */}
                    <Box sx={{ p: 2, borderBottom: announcements.length > 0 ? `1px solid ${colors.border}` : 'none' }}>
                      <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 1.5 }}>
                        Tell visitors what is happening. Flash days, open books,
                        guest artists. These show on your page until you delete them.
                      </Typography>
                      <TextField
                        label="Title"
                        placeholder="Books open March 1"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        fullWidth
                        size="small"
                        sx={{
                          mb: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: colors.background,
                            color: colors.textPrimary,
                            '& fieldset': { borderColor: colors.border },
                            '&:hover fieldset': { borderColor: colors.borderLight },
                            '&.Mui-focused fieldset': { borderColor: colors.accent },
                          },
                        }}
                      />
                      <TextField
                        label="Details"
                        placeholder="Add the detail people need, like dates or how to book."
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        sx={{
                          mb: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: colors.background,
                            color: colors.textPrimary,
                            '& fieldset': { borderColor: colors.border },
                            '&:hover fieldset': { borderColor: colors.borderLight },
                            '&.Mui-focused fieldset': { borderColor: colors.accent },
                          },
                        }}
                      />
                      <Button
                        onClick={handleAddAnnouncement}
                        disabled={isAddingAnnouncement || !newAnnouncement.title || !newAnnouncement.content}
                        sx={{
                          px: 2,
                          py: 0.75,
                          bgcolor: colors.accent,
                          color: colors.background,
                          borderRadius: '6px',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          '&:hover': { bgcolor: colors.accentHover },
                          '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                        }}
                        startIcon={isAddingAnnouncement ? <CircularProgress size={16} sx={{ color: colors.textMuted }} /> : <CampaignIcon sx={{ fontSize: 18 }} />}
                      >
                        Post Announcement
                      </Button>
                    </Box>

                    {/* Existing announcements */}
                    {announcements.map((announcement, index) => (
                      <Box key={announcement.id} sx={{
                        p: 2,
                        borderBottom: index === announcements.length - 1 ? 'none' : `1px solid ${colors.border}`,
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                            {announcement.title}
                          </Typography>
                          <IconButton
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            sx={{
                              color: colors.textMuted,
                              p: 0.5,
                              '&:hover': { color: colors.error }
                            }}
                            size="small"
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                        <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 0.5 }}>
                          {announcement.content}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}

                    {announcements.length === 0 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
                          No announcements yet. Create one to display on your studio page.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
                {/* Contact Information Card - Inline Editing */}
                <Card
                  title="Contact Information"
                  action={
                    !isEditingContact ? (
                      <Button
                        onClick={() => setIsEditingContact(true)}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          color: colors.accent,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          textTransform: 'none',
                          '&:hover': { bgcolor: `${colors.accent}15` }
                        }}
                        startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                      >
                        Edit
                      </Button>
                    ) : null
                  }
                >
                  <Box sx={{ p: 2 }}>
                    {isEditingContact ? (
                      // Editing Mode
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="Street Address"
                          value={contactForm.address}
                          onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                          fullWidth
                          size="small"
                          placeholder="123 Main Street"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: colors.background,
                              color: colors.textPrimary,
                              '& fieldset': { borderColor: colors.border },
                              '&:hover fieldset': { borderColor: colors.borderLight },
                              '&.Mui-focused fieldset': { borderColor: colors.accent },
                            },
                            '& .MuiInputLabel-root': { color: colors.textSecondary },
                            '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                          }}
                        />
                        <TextField
                          label="Address Line 2 (optional)"
                          value={contactForm.address2}
                          onChange={(e) => setContactForm(prev => ({ ...prev, address2: e.target.value }))}
                          fullWidth
                          size="small"
                          placeholder="Suite 100"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: colors.background,
                              color: colors.textPrimary,
                              '& fieldset': { borderColor: colors.border },
                              '&:hover fieldset': { borderColor: colors.borderLight },
                              '&.Mui-focused fieldset': { borderColor: colors.accent },
                            },
                            '& .MuiInputLabel-root': { color: colors.textSecondary },
                            '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            label="City"
                            value={contactForm.city}
                            onChange={(e) => setContactForm(prev => ({ ...prev, city: e.target.value }))}
                            fullWidth
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: colors.background,
                                color: colors.textPrimary,
                                '& fieldset': { borderColor: colors.border },
                                '&:hover fieldset': { borderColor: colors.borderLight },
                                '&.Mui-focused fieldset': { borderColor: colors.accent },
                              },
                              '& .MuiInputLabel-root': { color: colors.textSecondary },
                              '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                            }}
                          />
                          <TextField
                            label="State"
                            value={contactForm.state}
                            onChange={(e) => setContactForm(prev => ({ ...prev, state: e.target.value }))}
                            size="small"
                            placeholder="TX"
                            sx={{
                              width: { xs: 70, sm: 100 },
                              '& .MuiOutlinedInput-root': {
                                bgcolor: colors.background,
                                color: colors.textPrimary,
                                '& fieldset': { borderColor: colors.border },
                                '&:hover fieldset': { borderColor: colors.borderLight },
                                '&.Mui-focused fieldset': { borderColor: colors.accent },
                              },
                              '& .MuiInputLabel-root': { color: colors.textSecondary },
                              '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                            }}
                          />
                          <TextField
                            label="ZIP"
                            value={contactForm.postal_code}
                            onChange={(e) => setContactForm(prev => ({ ...prev, postal_code: e.target.value }))}
                            size="small"
                            sx={{
                              width: { xs: 80, sm: 100 },
                              '& .MuiOutlinedInput-root': {
                                bgcolor: colors.background,
                                color: colors.textPrimary,
                                '& fieldset': { borderColor: colors.border },
                                '&:hover fieldset': { borderColor: colors.borderLight },
                                '&.Mui-focused fieldset': { borderColor: colors.accent },
                              },
                              '& .MuiInputLabel-root': { color: colors.textSecondary },
                              '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                            }}
                          />
                        </Box>
                        <TextField
                          label="Phone"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                          fullWidth
                          size="small"
                          placeholder="(555) 555-5555"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: colors.background,
                              color: colors.textPrimary,
                              '& fieldset': { borderColor: colors.border },
                              '&:hover fieldset': { borderColor: colors.borderLight },
                              '&.Mui-focused fieldset': { borderColor: colors.accent },
                            },
                            '& .MuiInputLabel-root': { color: colors.textSecondary },
                            '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            onClick={handleCancelContactEdit}
                            sx={{
                              px: 2,
                              py: 0.75,
                              color: colors.textPrimary,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              '&:hover': { borderColor: colors.accent, color: colors.accent }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveContactInfo}
                            disabled={isSavingContact}
                            sx={{
                              px: 2,
                              py: 0.75,
                              bgcolor: colors.accent,
                              color: colors.background,
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              '&:hover': { bgcolor: colors.accentHover },
                              '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                            }}
                            startIcon={isSavingContact ? <CircularProgress size={16} sx={{ color: colors.textMuted }} /> : null}
                          >
                            {isSavingContact ? 'Saving...' : 'Save'}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      // Display Mode
                      <>
                        {/* Address */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                          <LocationOnIcon sx={{ color: colors.accent, fontSize: 20, mt: 0.25 }} />
                          <Box>
                            <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.9rem', mb: 0.25 }}>
                              Address
                            </Typography>
                            {(studioData?.address || studioData?.city) ? (
                              <>
                                {studioData?.address && (
                                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                    {studioData.address}
                                  </Typography>
                                )}
                                {studioData?.address2 && (
                                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                    {studioData.address2}
                                  </Typography>
                                )}
                                {(studioData?.city || studioData?.state || studioData?.postal_code) && (
                                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                    {[studioData?.city, studioData?.state].filter(Boolean).join(', ')} {studioData?.postal_code}
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography sx={{ color: colors.textMuted, fontSize: '0.85rem', fontStyle: 'italic' }}>
                                No address set — click Edit to add
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Phone */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <PhoneIcon sx={{ color: colors.accent, fontSize: 20, mt: 0.25 }} />
                          <Box>
                            <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.9rem', mb: 0.25 }}>
                              Phone
                            </Typography>
                            {studioData?.phone ? (
                              <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                {studioData.phone}
                              </Typography>
                            ) : (
                              <Typography sx={{ color: colors.textMuted, fontSize: '0.85rem', fontStyle: 'italic' }}>
                                No phone number set — click Edit to add
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                </Card>

                {/* Business Hours Card */}
                <Card
                  title="Business Hours"
                  action={
                    <Button
                      onClick={() => onManageHours()}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        color: colors.accent,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        '&:hover': { bgcolor: `${colors.accent}15` }
                      }}
                      startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                    >
                      Edit
                    </Button>
                  }
                >
                  <Box sx={{ p: 2 }}>
                    {studioWorkingHours && studioWorkingHours.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dayIndex) => {
                          const dayHours = studioWorkingHours.find(h => h.day_of_week === dayIndex);
                          const isClosed = !dayHours || dayHours.is_day_off;
                          const formatTime = (time: string) => {
                            const [hours, minutes] = time.split(':');
                            const h = parseInt(hours);
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            const displayHour = h % 12 || 12;
                            return `${displayHour}:${minutes} ${ampm}`;
                          };
                          const hoursDisplay = isClosed ? 'Closed' : `${formatTime(dayHours.start_time)} - ${formatTime(dayHours.end_time)}`;
                          return (
                            <Box key={dayName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem', minWidth: 100 }}>
                                {dayName}
                              </Typography>
                              <Typography sx={{
                                color: isClosed ? colors.textMuted : colors.textPrimary,
                                fontSize: '0.85rem',
                                fontWeight: isClosed ? 400 : 500,
                              }}>
                                {hoursDisplay}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography sx={{ color: colors.textMuted, fontSize: '0.85rem', fontStyle: 'italic' }}>
                        No hours set — click Edit to add your business hours
                      </Typography>
                    )}
                  </Box>
                </Card>

                {/* Guest Spot Seeking Toggle */}
                <Card title="Guest Spot Settings" badge={<ComingSoonBadge size="small" />}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: seekingGuests ? `1px solid ${colors.border}` : 'none',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FlightTakeoffIcon sx={{ color: seekingGuests ? colors.success : colors.textMuted }} />
                      <Box>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                          Seeking Guest Artists
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          Show on your profile that you're looking for guest artists
                        </Typography>
                      </Box>
                    </Box>
                    <Switch
                      checked={seekingGuests}
                      onChange={handleToggleSeekingGuests}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: colors.success },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colors.success },
                      }}
                    />
                  </Box>

                  {/* Guest Spot Details - only show when seeking */}
                  {seekingGuests && (
                    <Box sx={{ p: 2 }}>
                      <Typography sx={{
                        fontWeight: 500,
                        color: colors.textPrimary,
                        fontSize: '0.9rem',
                        mb: 1
                      }}>
                        Message for Guest Artists
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.8rem',
                        color: colors.textMuted,
                        mb: 1.5
                      }}>
                        Add details about availability, styles you're looking for, or requirements
                      </Typography>
                      <TextField
                        placeholder="e.g., Looking for artists for January residency."
                        value={guestSpotDetails}
                        onChange={(e) => setGuestSpotDetails(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        sx={{
                          mb: 1.5,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: colors.background,
                            color: colors.textPrimary,
                            fontSize: '0.9rem',
                            '& fieldset': { borderColor: colors.border },
                            '&:hover fieldset': { borderColor: colors.borderLight },
                            '&.Mui-focused fieldset': { borderColor: colors.accent },
                          },
                        }}
                      />
                      <Button
                        onClick={handleSaveGuestSpotDetails}
                        disabled={isSavingGuestDetails}
                        sx={{
                          px: 2,
                          py: 0.75,
                          bgcolor: colors.accent,
                          color: colors.background,
                          borderRadius: '6px',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          '&:hover': { bgcolor: colors.accentHover },
                          '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                        }}
                        startIcon={isSavingGuestDetails ? (
                          <CircularProgress size={16} sx={{ color: colors.textMuted }} />
                        ) : null}
                      >
                        {isSavingGuestDetails ? 'Saving...' : 'Save Details'}
                      </Button>
                    </Box>
                  )}
                </Card>


                {/* Studio Artists */}
                <Card
                  title="Studio Artists"
                  action={
                    <Button
                      onClick={() => onAddArtist()}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: `${colors.accent}26`,
                        border: `1px solid ${colors.accent}4D`,
                        borderRadius: '6px',
                        color: colors.accent,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        '&:hover': { bgcolor: colors.accent, color: colors.background }
                      }}
                      startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                    >
                      Add Artist
                    </Button>
                  }
                >
                  <Box>
                    {/* Owner (current user) */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      borderBottom: studioArtists.length > 0 ? `1px solid ${colors.border}` : 'none',
                    }}>
                      <Avatar
                        src={userAvatarUrl}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: colors.accent,
                          color: colors.background,
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                      >
                        {userInitials}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                          {currentUserName || 'You'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          Owner
                        </Typography>
                      </Box>
                    </Box>

                    {/* Other studio artists */}
                    {studioArtists.filter(a => a.id !== currentUserId).map((artist, index, arr) => {
                      const artistInitials = artist.name
                        ? artist.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : artist.username?.slice(0, 2).toUpperCase() || 'AR';
                      const isVerified = artist.is_verified;
                      return (
                        <Box key={artist.id} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 2,
                          borderBottom: index === arr.length - 1 ? 'none' : `1px solid ${colors.border}`,
                          bgcolor: !isVerified ? `${colors.accent}08` : 'transparent',
                        }}>
                          <Avatar
                            src={artist.image?.uri}
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: colors.background,
                              color: colors.textSecondary,
                              fontSize: '0.9rem',
                              fontWeight: 600
                            }}
                          >
                            {artistInitials}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                                {artist.name || artist.username}
                              </Typography>
                              {isVerified && (
                                <CheckCircleIcon sx={{ fontSize: 16, color: colors.success }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                                @{artist.username}
                              </Typography>
                              {!isVerified && (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 0.75,
                                  py: 0.25,
                                  bgcolor: `${colors.accent}20`,
                                  borderRadius: '4px',
                                }}>
                                  <HourglassEmptyIcon sx={{ fontSize: 12, color: colors.accent }} />
                                  <Typography sx={{ fontSize: '0.7rem', color: colors.accent, fontWeight: 500 }}>
                                    Pending
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                          {/* Verify/Unverify button - only show Verify if artist requested to join (not studio invite) */}
                          {!isVerified && artist.initiated_by !== 'studio' && (
                            <Button
                              onClick={() => handleVerifyArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: colors.success,
                                color: colors.background,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { bgcolor: colors.success, opacity: 0.9 }
                              }}
                            >
                              Verify
                            </Button>
                          )}
                          {isVerified && (
                            <Button
                              onClick={() => handleUnverifyArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'transparent',
                                border: `1px solid ${colors.border}`,
                                color: colors.textMuted,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { borderColor: colors.textMuted }
                              }}
                            >
                              Unverify
                            </Button>
                          )}
                          <IconButton
                            onClick={() => handleRemoveArtist(artist.id)}
                            sx={{
                              color: colors.textMuted,
                              '&:hover': { color: colors.error, bgcolor: `${colors.error}15` }
                            }}
                            size="small"
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      );
                    })}

                    {studioArtists.filter(a => a.id !== currentUserId).length === 0 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
                          No other artists yet. Add artists by their username.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>



                {/* Security Settings */}
                <Card title="Security Settings">
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LockIcon sx={{ color: colors.textMuted }} />
                      <Box>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                          Password
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          Keep your account secure
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      onClick={() => onChangePassword()}
                      sx={{
                        px: 2,
                        py: 0.75,
                        color: colors.textPrimary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        '&:hover': { borderColor: colors.accent, color: colors.accent }
                      }}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Card>
              </>
  );
};

export default StudioSideColumn;
