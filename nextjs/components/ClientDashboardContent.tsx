import React, { useState } from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Avatar, Skeleton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ChangePasswordModal from './ChangePasswordModal';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import { colors } from '@/styles/colors';
import { useClientDashboard, useWishlist, DashboardAppointment, SuggestedArtist, WishlistArtist } from '@/hooks/useClientDashboard';
import { ApiConversation } from '@/hooks/useConversations';

interface ClientDashboardContentProps {
  userName: string;
  userId: number;
}

export default function ClientDashboardContent({ userName, userId }: ClientDashboardContentProps) {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const {
    appointments,
    conversations,
    suggestedArtists,
    loading: dashboardLoading,
    refresh: refreshDashboard,
  } = useClientDashboard();

  const {
    wishlist,
    loading: wishlistLoading,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  const handleAddToWishlist = async (artistId: number) => {
    await addToWishlist(artistId);
    refreshDashboard();
  };

  const handleRemoveFromWishlist = async (artistId: number) => {
    await removeFromWishlist(artistId);
    refreshDashboard();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3
      }}>
        <Box>
          <Typography sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 600,
            color: colors.textPrimary,
            mb: 0.25
          }}>
            Welcome back, {userName}!
          </Typography>
          <Typography sx={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
            Your tattoo journey at a glance
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/inbox"
          sx={{
            px: 2.5,
            py: 1,
            bgcolor: colors.accent,
            color: colors.background,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            '&:hover': { bgcolor: colors.accentHover }
          }}
          startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />}
        >
          View Messages
        </Button>
      </Box>

      {/* Upcoming Appointments */}
      <Card
        title="Upcoming Appointments"
        action={
          <CardLink href="/appointments">
            View All <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
          </CardLink>
        }
      >
        {dashboardLoading ? (
          <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" width={200} height={120} sx={{ bgcolor: colors.background }} />
            ))}
          </Box>
        ) : appointments.length > 0 ? (
          <Box sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {appointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </Box>
        ) : (
          <EmptyState
            icon={<CalendarMonthIcon sx={{ fontSize: 32, color: colors.textMuted }} />}
            message="No upcoming appointments"
            action={
              <Button
                component={Link}
                href="/artists"
                sx={{
                  mt: 1,
                  px: 2,
                  py: 0.75,
                  bgcolor: colors.accent,
                  color: colors.background,
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  '&:hover': { bgcolor: colors.accentHover }
                }}
              >
                Browse Artists
              </Button>
            }
          />
        )}
      </Card>

      {/* Artists You Might Like */}
      <Card
        title="Artists You Might Like"
        subtitle="Based on your favorite styles and saved tattoos"
        action={
          <CardLink href="/artists">
            See All <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
          </CardLink>
        }
        sx={{ mt: 3 }}
      >
        {dashboardLoading ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 2,
            p: 2,
          }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="rounded" height={180} sx={{ bgcolor: colors.background }} />
            ))}
          </Box>
        ) : suggestedArtists.length > 0 ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 2,
            p: 2,
          }}>
            {suggestedArtists.map((artist) => (
              <SuggestedArtistCard
                key={artist.id}
                artist={artist}
                onAddToWishlist={handleAddToWishlist}
                isOnWishlist={wishlist.some((w) => w.id === artist.id)}
              />
            ))}
          </Box>
        ) : (
          <EmptyState
            icon={<PersonAddIcon sx={{ fontSize: 32, color: colors.textMuted }} />}
            message="No suggestions yet"
            subMessage="Save some styles or tattoos to get personalized recommendations"
          />
        )}
      </Card>

      {/* Two Column Layout */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 3,
        mt: 3,
      }}>
        {/* Wishlist */}
        <Card
          title={`My Wishlist (${wishlistLoading ? '...' : wishlist.length})`}
          subtitle="Artists you want to book when they open"
          action={
            <CardLink href="/wishlist">
              Manage <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
            </CardLink>
          }
        >
          {wishlistLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={60} sx={{ bgcolor: colors.background, mb: 1 }} />
              ))}
            </Box>
          ) : wishlist.length > 0 ? (
            <Box>
              {wishlist.slice(0, 5).map((artist, index) => (
                <WishlistRow
                  key={artist.id}
                  artist={artist}
                  onRemove={handleRemoveFromWishlist}
                  isLast={index === Math.min(wishlist.length, 5) - 1}
                />
              ))}
            </Box>
          ) : (
            <EmptyState
              icon={<BookmarkIcon sx={{ fontSize: 32, color: colors.textMuted }} />}
              message="Your wishlist is empty"
              subMessage="Add artists to get notified when their books open"
            />
          )}
        </Card>

        {/* Recent Messages */}
        <Card
          title="Recent Messages"
          action={
            <CardLink href="/inbox">
              View All <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
            </CardLink>
          }
        >
          {dashboardLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={60} sx={{ bgcolor: colors.background, mb: 1 }} />
              ))}
            </Box>
          ) : conversations.length > 0 ? (
            <Box>
              {conversations.map((conv, index) => (
                <MessageRow
                  key={conv.id}
                  conversation={conv}
                  userId={userId}
                  isLast={index === conversations.length - 1}
                />
              ))}
            </Box>
          ) : (
            <EmptyState
              icon={<ChatBubbleOutlineIcon sx={{ fontSize: 32, color: colors.textMuted }} />}
              message="No messages yet"
              subMessage="Start a conversation with an artist"
            />
          )}
        </Card>
      </Box>

      {/* Security Settings */}
      <Card title="Security Settings" sx={{ mt: 3 }}>
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
            onClick={() => setChangePasswordOpen(true)}
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

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Box>
  );
}

// Card Component
function Card({ title, subtitle, action, children, sx = {} }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <Box sx={{
      bgcolor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      ...sx,
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        p: 2,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

// Card Link Component
function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Typography sx={{
        fontSize: '0.85rem',
        color: colors.accent,
        display: 'flex',
        alignItems: 'center',
        '&:hover': { textDecoration: 'underline' }
      }}>
        {children}
      </Typography>
    </Link>
  );
}

// Empty State Component
function EmptyState({ icon, message, subMessage, action }: {
  icon: React.ReactNode;
  message: string;
  subMessage?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      px: 2,
    }}>
      {icon}
      <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mt: 1 }}>
        {message}
      </Typography>
      {subMessage && (
        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted, mt: 0.5, textAlign: 'center' }}>
          {subMessage}
        </Typography>
      )}
      {action}
    </Box>
  );
}

// Appointment Card Component
function AppointmentCard({ appointment }: { appointment: DashboardAppointment }) {
  const date = new Date(appointment.date);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const time = formatTime(appointment.start_time);

  const artistInitials = appointment.artist.name
    ? appointment.artist.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : appointment.artist.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Link href={`/appointments/${appointment.id}`} style={{ textDecoration: 'none' }}>
      <Box sx={{
        minWidth: 180,
        p: 2,
        bgcolor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': {
          borderColor: colors.accent,
          transform: 'translateY(-2px)',
        }
      }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>
              {day}
            </Typography>
            <Typography sx={{
              fontSize: '0.7rem',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {month}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.8rem', color: colors.accent, fontWeight: 500 }}>
              {time}
            </Typography>
            <Typography sx={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: colors.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {appointment.title || (appointment.type === 'consultation' ? 'Consultation' : 'Tattoo Session')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={appointment.artist.image?.uri}
            sx={{
              width: 24,
              height: 24,
              bgcolor: colors.accent,
              color: colors.background,
              fontSize: '0.6rem',
              fontWeight: 600,
            }}
          >
            {artistInitials}
          </Avatar>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
            @{appointment.artist.username}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}

// Suggested Artist Card Component
function SuggestedArtistCard({ artist, onAddToWishlist, isOnWishlist }: {
  artist: SuggestedArtist;
  onAddToWishlist: (id: number) => void;
  isOnWishlist: boolean;
}) {
  const artistInitials = artist.name
    ? artist.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : artist.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 2,
      bgcolor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: colors.borderLight }
    }}>
      <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }}>
        <Avatar
          src={artist.image?.uri}
          sx={{
            width: 56,
            height: 56,
            bgcolor: colors.accent,
            color: colors.background,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            mb: 1,
          }}
        >
          {artistInitials}
        </Avatar>
      </Link>
      <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }}>
        <Typography sx={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: colors.textPrimary,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': { color: colors.accent }
        }}>
          {artist.name || artist.username}
        </Typography>
      </Link>
      <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, flex: 1 }}>
        @{artist.username}
      </Typography>
      {artist.books_open ? (
        <Button
          component={Link}
          href={`/artists/${artist.username}`}
          sx={{
            width: '100%',
            py: 0.5,
            bgcolor: colors.success,
            color: colors.background,
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.75rem',
            '&:hover': { bgcolor: '#34c759' }
          }}
        >
          Book Now
        </Button>
      ) : (
        <Button
          onClick={() => !isOnWishlist && onAddToWishlist(artist.id)}
          disabled={isOnWishlist}
          sx={{
            width: '100%',
            py: 0.5,
            bgcolor: isOnWishlist ? colors.surface : `${colors.accent}15`,
            color: isOnWishlist ? colors.textMuted : colors.accent,
            border: `1px solid ${isOnWishlist ? colors.border : colors.accent}40`,
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.75rem',
            '&:hover': isOnWishlist ? {} : { bgcolor: colors.accent, color: colors.background },
            '&:disabled': { opacity: 0.7 }
          }}
          startIcon={isOnWishlist ? <NotificationsActiveIcon sx={{ fontSize: 14 }} /> : <NotificationsOffIcon sx={{ fontSize: 14 }} />}
        >
          {isOnWishlist ? 'On Wishlist' : 'Notify Me'}
        </Button>
      )}
    </Box>
  );
}

// Wishlist Row Component
function WishlistRow({ artist, onRemove, isLast }: {
  artist: WishlistArtist;
  onRemove: (id: number) => void;
  isLast: boolean;
}) {
  const artistInitials = artist.name
    ? artist.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : artist.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
      transition: 'background 0.15s',
      '&:hover': { bgcolor: colors.background }
    }}>
      <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }}>
        <Avatar
          src={artist.image?.uri}
          sx={{
            width: 40,
            height: 40,
            bgcolor: colors.accent,
            color: colors.background,
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {artistInitials}
        </Avatar>
      </Link>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }}>
          <Typography sx={{
            fontWeight: 500,
            color: colors.textPrimary,
            fontSize: '0.9rem',
            cursor: 'pointer',
            '&:hover': { color: colors.accent }
          }}>
            @{artist.username}
          </Typography>
        </Link>
        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
          {artist.studio?.name || 'Independent'}
        </Typography>
      </Box>
      {artist.books_open ? (
        <Button
          component={Link}
          href={`/artists/${artist.username}`}
          sx={{
            px: 1.5,
            py: 0.5,
            bgcolor: colors.success,
            color: colors.background,
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.75rem',
            '&:hover': { bgcolor: '#34c759' }
          }}
        >
          Now Booking!
        </Button>
      ) : (
        <Typography sx={{
          px: 1.5,
          py: 0.5,
          bgcolor: colors.background,
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: colors.textMuted,
        }}>
          Books Closed
        </Typography>
      )}
      <Button
        onClick={() => onRemove(artist.id)}
        sx={{
          minWidth: 0,
          p: 0.75,
          color: colors.textMuted,
          '&:hover': { color: colors.error, bgcolor: `${colors.error}15` }
        }}
      >
        <DeleteIcon sx={{ fontSize: 18 }} />
      </Button>
    </Box>
  );
}

// Message Row Component
function MessageRow({ conversation, userId, isLast }: {
  conversation: ApiConversation;
  userId: number;
  isLast: boolean;
}) {
  const participant = conversation.participant;
  const lastMessage = conversation.last_message;
  const isUnread = conversation.unread_count > 0;

  const initials = participant?.name
    ? participant.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : participant?.username?.slice(0, 2).toUpperCase() || '??';

  const messagePreview = lastMessage?.content
    ? lastMessage.content.length > 40
      ? lastMessage.content.slice(0, 40) + '...'
      : lastMessage.content
    : 'No messages yet';

  const timeAgo = lastMessage?.created_at ? getTimeAgo(lastMessage.created_at) : '';

  return (
    <Link href={`/inbox?conversation=${conversation.id}`} style={{ textDecoration: 'none' }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
        transition: 'background 0.15s',
        cursor: 'pointer',
        bgcolor: isUnread ? `${colors.accent}08` : 'transparent',
        '&:hover': { bgcolor: colors.background }
      }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={participant?.image?.uri}
            sx={{
              width: 40,
              height: 40,
              bgcolor: colors.accent,
              color: colors.background,
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {initials}
          </Avatar>
          {isUnread && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 10,
              height: 10,
              bgcolor: colors.accent,
              borderRadius: '50%',
              border: `2px solid ${colors.surface}`,
            }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
            <Typography sx={{
              fontWeight: isUnread ? 600 : 500,
              color: colors.textPrimary,
              fontSize: '0.9rem',
            }}>
              {participant?.name || `@${participant?.username}`}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted }}>
              {timeAgo}
            </Typography>
          </Box>
          <Typography sx={{
            fontSize: '0.8rem',
            color: isUnread ? colors.textSecondary : colors.textMuted,
            fontWeight: isUnread ? 500 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {messagePreview}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}

// Helper functions
function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
