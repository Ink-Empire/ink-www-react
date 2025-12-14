import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Box, Typography, Button, Avatar } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '@/styles/colors';

// Placeholder data - will be replaced with API calls
const mockStats = {
  upcomingAppointments: 8,
  appointmentsTrend: '+2',
  profileViews: 1247,
  viewsTrend: '+18%',
  savesThisWeek: 89,
  savesTrend: '+24',
  unreadMessages: 5
};

const mockSchedule = [
  {
    id: 1,
    day: 14,
    month: 'Dec',
    time: '10:00 AM – 2:00 PM',
    title: 'Neo-Traditional Wolf Sleeve (Session 2)',
    clientName: 'Mike Rodriguez',
    clientInitials: 'MR',
    type: 'appointment'
  },
  {
    id: 2,
    day: 14,
    month: 'Dec',
    time: '4:30 PM – 5:00 PM',
    title: 'New Client Consultation',
    clientName: 'Emma Kim',
    clientInitials: 'EK',
    type: 'consultation'
  },
  {
    id: 3,
    day: 16,
    month: 'Dec',
    time: '11:00 AM – 4:00 PM',
    title: 'Japanese Koi Back Piece (Session 1)',
    clientName: 'David Lee',
    clientInitials: 'DL',
    type: 'appointment'
  },
  {
    id: 4,
    day: 17,
    month: 'Dec',
    time: '1:00 PM – 3:00 PM',
    title: 'Fine Line Botanical Forearm',
    clientName: 'Sarah Park',
    clientInitials: 'SP',
    type: 'appointment'
  }
];

const mockClients = [
  { id: 1, name: 'Alex Liu', initials: 'AL', hint: 'Saved 3 of your pieces', hintType: 'save' },
  { id: 2, name: 'Jordan Taylor', initials: 'JT', hint: 'Requested similar design', hintType: 'message' },
  { id: 3, name: 'Rachel Nguyen', initials: 'RN', hint: 'Viewed profile 5 times', hintType: 'view' },
  { id: 4, name: 'Chris Martinez', initials: 'CM', hint: 'Liked your recent work', hintType: 'like' }
];

const mockActivity = [
  { id: 1, user: 'Alex Liu', action: 'saved', target: 'Neo-Trad Wolf', time: '2 hours ago', type: 'save' },
  { id: 2, user: 'Maria Santos', action: 'liked', target: 'Japanese Koi', time: '4 hours ago', type: 'like' },
  { id: 3, user: 'Jordan Taylor', action: 'sent you a message', target: '', time: '5 hours ago', type: 'message' },
  { id: 4, user: 'Ryan Chen', action: 'liked', target: 'Geometric Sleeve', time: 'Yesterday', type: 'like' }
];

const mockGuestSpots = [
  {
    region: 'Paris, France',
    flag: '🇫🇷',
    studioCount: 3,
    studios: [
      {
        id: 1,
        name: 'Tin-Tin Tatouages',
        initials: 'TN',
        location: 'Le Marais, Paris',
        viewedAgo: '2 days ago',
        rating: 4.9,
        reviews: 127,
        styles: ['Traditional', 'Neo-Trad', 'Japanese'],
        seeking: true
      },
      {
        id: 2,
        name: 'Art & Encre',
        initials: 'AE',
        location: 'Bastille, Paris',
        viewedAgo: '5 days ago',
        rating: 4.7,
        reviews: 89,
        styles: ['Fine Line', 'Blackwork'],
        seeking: false
      }
    ]
  },
  {
    region: 'Tokyo, Japan',
    flag: '🇯🇵',
    studioCount: 1,
    studios: [
      {
        id: 3,
        name: 'Three Tides Tattoo',
        initials: '三',
        location: 'Shibuya, Tokyo',
        viewedAgo: '3 days ago',
        rating: 5.0,
        reviews: 312,
        styles: ['Japanese', 'Irezumi', 'Traditional'],
        seeking: true
      }
    ]
  }
];

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const userName = user?.name?.split(' ')[0] || user?.username || 'Artist';

  return (
    <Layout>
      <Head>
        <title>Dashboard | InkedIn</title>
        <meta name="description" content="Your artist dashboard" />
      </Head>

      <Box sx={{ maxWidth: 1400, mx: 'auto', py: 3, px: { xs: 2, md: 3 } }}>
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
              Welcome back, {userName}
            </Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
              Here's what's happening this week
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
            <Button
              component={Link}
              href={user?.slug ? `/artists/${user.slug}` : '#'}
              sx={{
                flex: { xs: 1, md: 'none' },
                px: 2,
                py: 1,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                '&:hover': { borderColor: colors.accent, color: colors.accent }
              }}
              startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
            >
              View Public Profile
            </Button>
            <Button
              sx={{
                flex: { xs: 1, md: 'none' },
                px: 2,
                py: 1,
                bgcolor: colors.accent,
                color: colors.background,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                '&:hover': { bgcolor: colors.accentHover }
              }}
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            >
              Upload Tattoo
            </Button>
          </Box>
        </Box>

        {/* Stats Row */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3
        }}>
          <StatCard
            icon={<CalendarMonthIcon />}
            value={mockStats.upcomingAppointments}
            label="Upcoming Appointments"
            trend={mockStats.appointmentsTrend}
            trendUp
          />
          <StatCard
            icon={<VisibilityIcon />}
            value={mockStats.profileViews.toLocaleString()}
            label="Profile Views This Month"
            trend={mockStats.viewsTrend}
            trendUp
          />
          <StatCard
            icon={<FavoriteIcon />}
            value={mockStats.savesThisWeek}
            label="Saves This Week"
            trend={mockStats.savesTrend}
            trendUp
          />
          <StatCard
            icon={<ChatBubbleOutlineIcon />}
            value={mockStats.unreadMessages}
            label="Unread Messages"
            trend="New"
          />
        </Box>

        {/* Main Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
          gap: 2
        }}>
          {/* Main Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Upcoming Schedule */}
            <Card
              title="Upcoming Schedule"
              action={<CardLink href="/calendar">View Calendar →</CardLink>}
            >
              <Box>
                {mockSchedule.map((item, index) => (
                  <ScheduleItem key={item.id} item={item} isLast={index === mockSchedule.length - 1} />
                ))}
              </Box>
            </Card>
          </Box>

          {/* Side Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Clients to Reach Out To */}
            <Card title="Clients to Reach Out To">
              <Box>
                {mockClients.map((client, index) => (
                  <ClientItem key={client.id} client={client} isLast={index === mockClients.length - 1} />
                ))}
              </Box>
            </Card>

            {/* Recent Activity */}
            <Card
              title="Recent Activity"
              action={<CardLink href="/activity">View All →</CardLink>}
            >
              <Box>
                {mockActivity.map((activity, index) => (
                  <ActivityItem key={activity.id} activity={activity} isLast={index === mockActivity.length - 1} />
                ))}
              </Box>
            </Card>
          </Box>
        </Box>

        {/* Guest Spot Opportunities */}
        <Box sx={{ mt: 3 }}>
          <Card
            title="Guest Spot Opportunities"
            subtitle="Studios in your saved travel regions that viewed your profile"
            action={<CardLink href="/travel-regions">Manage Travel Regions →</CardLink>}
          >
            <Box>
              {mockGuestSpots.map((region, index) => (
                <RegionGroup key={region.region} region={region} isLast={index === mockGuestSpots.length - 1} />
              ))}

              {/* Add Region CTA */}
              <Box sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                p: 2,
                bgcolor: colors.background,
                borderTop: `1px solid ${colors.border}`
              }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `2px solid ${colors.accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.accent,
                  flexShrink: 0
                }}>
                  <AddIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: colors.textPrimary }}>
                    Add more travel destinations
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                    Get notified when studios in your target regions view your profile
                  </Typography>
                </Box>
                <Button sx={{
                  px: 2,
                  py: 0.75,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': { borderColor: colors.accent, color: colors.accent }
                }}>
                  Add Regions
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
}

// Stat Card Component
function StatCard({ icon, value, label, trend, trendUp }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Box sx={{
      bgcolor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      p: 2,
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: colors.borderLight }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{
          width: 40,
          height: 40,
          bgcolor: `${colors.accent}26`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.accent
        }}>
          {icon}
        </Box>
        {trend && (
          <Typography sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: trendUp ? colors.success : colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25
          }}>
            {trendUp && <TrendingUpIcon sx={{ fontSize: 14 }} />}
            {trend}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 600, color: colors.textPrimary, mb: 0.25 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
        {label}
      </Typography>
    </Box>
  );
}

// Card Component
function Card({ title, subtitle, action, children }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{
      bgcolor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      overflow: 'hidden'
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
        '&:hover': { textDecoration: 'underline' }
      }}>
        {children}
      </Typography>
    </Link>
  );
}

// Schedule Item Component
function ScheduleItem({ item, isLast }: { item: typeof mockSchedule[0]; isLast: boolean }) {
  return (
    <Box sx={{
      display: 'flex',
      gap: 2,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
      transition: 'background 0.15s',
      '&:hover': { bgcolor: colors.background }
    }}>
      <Box sx={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>
          {item.day}
        </Typography>
        <Typography sx={{
          fontSize: '0.75rem',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {item.month}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8rem', color: colors.accent, fontWeight: 500, mb: 0.25 }}>
          {item.time}
        </Typography>
        <Typography sx={{
          fontWeight: 500,
          color: colors.textPrimary,
          mb: 0.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {item.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Avatar sx={{
            width: 20,
            height: 20,
            bgcolor: colors.background,
            fontSize: '0.6rem',
            color: colors.textMuted
          }}>
            {item.clientInitials}
          </Avatar>
          <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
            {item.clientName}
          </Typography>
        </Box>
      </Box>
      <Box sx={{
        px: 1,
        py: 0.5,
        borderRadius: '100px',
        fontSize: '0.7rem',
        fontWeight: 500,
        flexShrink: 0,
        alignSelf: 'flex-start',
        bgcolor: item.type === 'appointment' ? `${colors.accent}26` : `${colors.success}26`,
        color: item.type === 'appointment' ? colors.accent : colors.success
      }}>
        {item.type === 'appointment' ? 'Appointment' : 'Consultation'}
      </Box>
    </Box>
  );
}

// Client Item Component
function ClientItem({ client, isLast }: { client: typeof mockClients[0]; isLast: boolean }) {
  const hintIcons: Record<string, React.ReactNode> = {
    save: <BookmarkIcon sx={{ fontSize: 14, color: colors.accent }} />,
    message: <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: colors.accent }} />,
    view: <AccessTimeIcon sx={{ fontSize: 14, color: colors.accent }} />,
    like: <FavoriteIcon sx={{ fontSize: 14, color: colors.accent }} />
  };

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
      <Avatar sx={{
        width: 44,
        height: 44,
        bgcolor: colors.background,
        color: colors.textSecondary,
        fontSize: '0.9rem',
        fontWeight: 600
      }}>
        {client.initials}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500, color: colors.textPrimary, mb: 0.15 }}>
          {client.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {hintIcons[client.hintType]}
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {client.hint}
          </Typography>
        </Box>
      </Box>
      <Button sx={{
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
      }}>
        Message
      </Button>
    </Box>
  );
}

// Activity Item Component
function ActivityItem({ activity, isLast }: { activity: typeof mockActivity[0]; isLast: boolean }) {
  const activityIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    save: { icon: <BookmarkIcon sx={{ fontSize: 16 }} />, color: colors.accent },
    like: { icon: <FavoriteIcon sx={{ fontSize: 16 }} />, color: colors.error },
    message: { icon: <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />, color: colors.success }
  };

  const { icon, color } = activityIcons[activity.type] || activityIcons.like;

  return (
    <Box sx={{
      display: 'flex',
      gap: 1.5,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`
    }}>
      <Box sx={{
        width: 32,
        height: 32,
        bgcolor: colors.background,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary, mb: 0.15 }}>
          <Box component="span" sx={{ fontWeight: 600 }}>{activity.user}</Box>
          {' '}{activity.action}{activity.target ? ` "${activity.target}"` : ''}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
          {activity.time}
        </Typography>
      </Box>
    </Box>
  );
}

// Region Group Component
function RegionGroup({ region, isLast }: { region: typeof mockGuestSpots[0]; isLast: boolean }) {
  return (
    <Box sx={{
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontSize: '1.5rem' }}>{region.flag}</Typography>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: colors.textPrimary }}>
            {region.region}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {region.studioCount} studio{region.studioCount !== 1 ? 's' : ''} viewed your profile
          </Typography>
        </Box>
      </Box>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fill, minmax(300px, 1fr))' },
        gap: 2
      }}>
        {region.studios.map(studio => (
          <StudioCard key={studio.id} studio={studio} />
        ))}
      </Box>
    </Box>
  );
}

// Studio Card Component
function StudioCard({ studio }: { studio: typeof mockGuestSpots[0]['studios'][0] }) {
  return (
    <Box sx={{
      bgcolor: colors.background,
      border: `1px solid ${colors.borderLight}`,
      borderRadius: '8px',
      p: 2,
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: colors.accent }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Avatar sx={{
          width: 44,
          height: 44,
          bgcolor: colors.surface,
          color: colors.textSecondary,
          fontWeight: 600,
          borderRadius: '6px'
        }}>
          {studio.initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: colors.textPrimary }}>
            {studio.name}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {studio.location}
          </Typography>
        </Box>
        {studio.seeking && (
          <Box sx={{
            px: 1,
            py: 0.5,
            borderRadius: '100px',
            fontSize: '0.7rem',
            fontWeight: 500,
            bgcolor: `${colors.success}26`,
            color: colors.success
          }}>
            Seeking Guests
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: colors.textSecondary }}>
          <VisibilityIcon sx={{ fontSize: 14, color: colors.textMuted }} />
          Viewed {studio.viewedAgo}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: colors.textSecondary }}>
          <StarIcon sx={{ fontSize: 14, color: colors.textMuted }} />
          {studio.rating} ({studio.reviews} reviews)
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        {studio.styles.map(style => (
          <Box key={style} sx={{
            px: 1,
            py: 0.5,
            bgcolor: colors.surface,
            borderRadius: '100px',
            fontSize: '0.7rem',
            color: colors.textSecondary
          }}>
            {style}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button sx={{
          flex: 1,
          py: 0.75,
          color: colors.textPrimary,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': { borderColor: colors.accent, color: colors.accent }
        }}>
          View Studio
        </Button>
        <Button sx={{
          flex: 2,
          py: 0.75,
          bgcolor: colors.accent,
          color: colors.background,
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': { bgcolor: colors.accentHover }
        }}>
          Inquire About Guest Spot
        </Button>
      </Box>
    </Box>
  );
}
