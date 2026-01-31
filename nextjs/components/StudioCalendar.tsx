import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Box, Typography, Avatar, Switch, CircularProgress } from '@mui/material';
import { appointmentService } from '@/services/appointmentService';
import { colors } from '@/styles/colors';

interface Artist {
  id: number;
  name: string;
  slug?: string;
  image?: { uri?: string };
}

interface Appointment {
  id: number;
  artist_id: number;
  client_name?: string;
  title?: string;
  description?: string;
  start: string;
  end: string;
  status?: string;
}

interface StudioCalendarProps {
  studioId: number;
  artists: Artist[];
}

// Color palette for different artists
const artistColors = [
  { bg: '#C9A86C', border: '#B8954F' }, // Gold
  { bg: '#6B8E6B', border: '#5A7D5A' }, // Sage green
  { bg: '#8B7B8B', border: '#7A6A7A' }, // Mauve
  { bg: '#7B8FA1', border: '#6A7E90' }, // Steel blue
  { bg: '#A17B6B', border: '#907A5A' }, // Terracotta
  { bg: '#6B8B8B', border: '#5A7A7A' }, // Teal
];

const StudioCalendar: React.FC<StudioCalendarProps> = ({ studioId, artists }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleArtists, setVisibleArtists] = useState<Set<number>>(new Set());

  // Initialize all artists as visible
  useEffect(() => {
    if (artists.length > 0) {
      setVisibleArtists(new Set(artists.map(a => a.id)));
    }
  }, [artists]);

  // Fetch appointments for all artists
  useEffect(() => {
    const fetchAllAppointments = async () => {
      if (!artists.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const allAppointments: Appointment[] = [];

        // Fetch appointments for each artist
        for (const artist of artists) {
          try {
            const slug = artist.slug || artist.id.toString();
            const artistAppointments = await appointmentService.getByArtist(slug);

            // Add artist_id to each appointment if not present
            const appointmentsWithArtist = artistAppointments.map((apt: any) => ({
              ...apt,
              artist_id: artist.id,
            }));

            allAppointments.push(...appointmentsWithArtist);
          } catch (err) {
            console.error(`Failed to fetch appointments for artist ${artist.id}:`, err);
          }
        }

        setAppointments(allAppointments);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAppointments();
  }, [artists]);

  // Get color for an artist based on their index
  const getArtistColor = (artistId: number) => {
    const index = artists.findIndex(a => a.id === artistId);
    return artistColors[index % artistColors.length];
  };

  // Get artist name by ID
  const getArtistName = (artistId: number) => {
    const artist = artists.find(a => a.id === artistId);
    return artist?.name || 'Unknown';
  };

  // Toggle artist visibility
  const toggleArtist = (artistId: number) => {
    setVisibleArtists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artistId)) {
        newSet.delete(artistId);
      } else {
        newSet.add(artistId);
      }
      return newSet;
    });
  };

  // Convert appointments to calendar events
  const events = useMemo(() => {
    return appointments
      .filter(apt => visibleArtists.has(apt.artist_id))
      .map(apt => {
        const color = getArtistColor(apt.artist_id);
        const artistName = getArtistName(apt.artist_id);

        return {
          id: apt.id.toString(),
          title: apt.client_name || apt.title || 'Appointment',
          start: apt.start,
          end: apt.end,
          backgroundColor: color.bg,
          borderColor: color.border,
          textColor: '#fff',
          extendedProps: {
            artistId: apt.artist_id,
            artistName,
            status: apt.status,
            description: apt.description,
          },
        };
      });
  }, [appointments, visibleArtists, artists]);

  // Get artist initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Artist Filter Sidebar */}
      <Box sx={{
        width: { xs: '100%', md: 220 },
        flexShrink: 0,
        order: { xs: 1, md: 0 }
      }}>
        <Box sx={{
          bgcolor: colors.background,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          p: 2,
        }}>
          <Typography sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: colors.textPrimary,
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Show Artists
          </Typography>

          {artists.length === 0 ? (
            <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
              No artists at this studio
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {artists.map((artist, index) => {
                const color = artistColors[index % artistColors.length];
                const isVisible = visibleArtists.has(artist.id);

                return (
                  <Box
                    key={artist.id}
                    onClick={() => toggleArtist(artist.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      bgcolor: isVisible ? `${color.bg}15` : 'transparent',
                      border: `1px solid ${isVisible ? color.bg : colors.border}`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: `${color.bg}25`,
                      }
                    }}
                  >
                    <Box sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '3px',
                      bgcolor: isVisible ? color.bg : colors.border,
                      transition: 'background-color 0.2s',
                    }} />
                    <Avatar
                      src={artist.image?.uri}
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: color.bg,
                        color: '#fff',
                        opacity: isVisible ? 1 : 0.5,
                      }}
                    >
                      {getInitials(artist.name)}
                    </Avatar>
                    <Typography sx={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: isVisible ? colors.textPrimary : colors.textMuted,
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {artist.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Quick Actions */}
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.border}` }}>
            <Box
              onClick={() => setVisibleArtists(new Set(artists.map(a => a.id)))}
              sx={{
                fontSize: '0.8rem',
                color: colors.accent,
                cursor: 'pointer',
                mb: 0.5,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Show all
            </Box>
            <Box
              onClick={() => setVisibleArtists(new Set())}
              sx={{
                fontSize: '0.8rem',
                color: colors.textMuted,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Hide all
            </Box>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{
          bgcolor: colors.background,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          p: 2,
          mt: 2
        }}>
          <Typography sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: colors.textPrimary,
            mb: 1.5,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Legend
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: colors.accent, borderRadius: '2px' }} />
              <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>Confirmed</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: colors.textMuted, borderRadius: '2px' }} />
              <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pending</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Calendar */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={32} sx={{ color: colors.accent }} />
          </Box>
        ) : (
          <Box sx={{
            '& .fc': {
              fontFamily: 'inherit',
            },
            '& .fc-theme-standard td, & .fc-theme-standard th': {
              borderColor: colors.border,
            },
            '& .fc-theme-standard .fc-scrollgrid': {
              borderColor: colors.border,
            },
            '& .fc-col-header-cell': {
              bgcolor: colors.background,
              py: 1,
            },
            '& .fc-col-header-cell-cushion': {
              color: colors.textSecondary,
              fontWeight: 500,
              fontSize: '0.85rem',
            },
            '& .fc-daygrid-day-number': {
              color: colors.textPrimary,
              fontSize: '0.9rem',
              padding: '8px',
            },
            '& .fc-daygrid-day.fc-day-today': {
              bgcolor: `${colors.accent}10`,
            },
            '& .fc-daygrid-day.fc-day-today .fc-daygrid-day-number': {
              bgcolor: colors.accent,
              color: colors.background,
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            '& .fc-event': {
              borderRadius: '4px',
              fontSize: '0.75rem',
              padding: '2px 4px',
              cursor: 'pointer',
            },
            '& .fc-toolbar-title': {
              fontSize: '1.25rem',
              fontWeight: 600,
              color: colors.textPrimary,
            },
            '& .fc-button': {
              bgcolor: `${colors.surface} !important`,
              border: `1px solid ${colors.border} !important`,
              color: `${colors.textPrimary} !important`,
              textTransform: 'capitalize',
              fontWeight: 500,
              '&:hover': {
                bgcolor: `${colors.background} !important`,
                borderColor: `${colors.accent} !important`,
              },
              '&:focus': {
                boxShadow: 'none !important',
              },
            },
            '& .fc-button-active': {
              bgcolor: `${colors.accent} !important`,
              borderColor: `${colors.accent} !important`,
              color: `${colors.background} !important`,
            },
          }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              events={events}
              eventContent={(eventInfo) => (
                <Box sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.75rem',
                }}>
                  <Box component="span" sx={{ fontWeight: 500 }}>
                    {eventInfo.event.extendedProps.artistName}:
                  </Box>{' '}
                  {eventInfo.event.title}
                </Box>
              )}
              height="auto"
              dayMaxEvents={3}
              moreLinkContent={(args) => `+${args.num} more`}
            />
          </Box>
        )}

        {!loading && appointments.length === 0 && (
          <Box sx={{
            textAlign: 'center',
            py: 4,
            bgcolor: colors.background,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
            mt: 2
          }}>
            <Typography sx={{ color: colors.textMuted }}>
              No appointments scheduled yet
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StudioCalendar;
