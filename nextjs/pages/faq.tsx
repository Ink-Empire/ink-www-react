import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import StyleIcon from '@mui/icons-material/Style';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import BrushIcon from '@mui/icons-material/Brush';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmailIcon from '@mui/icons-material/Email';
import Layout from '@/components/Layout';
import ContactForm from '@/components/ContactForm';
import { colors } from '@/styles/colors';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <SearchIcon />,
    description: 'New to InkedIn? Start here.',
    items: [
      {
        question: 'What is InkedIn?',
        answer: (
          <>
            <Typography paragraph>
              InkedIn is a platform that connects tattoo enthusiasts with talented tattoo artists.
              You can browse portfolios, discover new styles, find artists near you, and book appointments.
            </Typography>
            <Typography>
              Whether you're looking for your first tattoo or your fiftieth, InkedIn helps you find
              the perfect artist for your vision.
            </Typography>
          </>
        ),
      },
      {
        question: 'Do I need an account to browse?',
        answer: (
          <>
            <Typography paragraph>
              No! You can browse all tattoos and artist profiles without creating an account.
            </Typography>
            <Typography>
              However, creating a free account lets you save favorite artists, bookmark tattoos
              for inspiration, and set your preferred styles for personalized recommendations.
            </Typography>
          </>
        ),
      },
      {
        question: 'What does "Preview Mode" mean?',
        answer: (
          <>
            <Typography paragraph>
              Since we're a new platform, we offer Preview Mode to showcase what InkedIn will look
              like with a full roster of artists. Preview Mode displays sample artist profiles and
              tattoo portfolios.
            </Typography>
            <Typography>
              You can toggle between Preview Mode and the Live Site using the banner at the top of
              the browse pages. The Live Site shows real artists who have joined our platform.
            </Typography>
          </>
        ),
      },
    ],
  },
  {
    id: 'search-discovery',
    title: 'Search & Discovery',
    icon: <SearchIcon />,
    description: 'How to find the perfect tattoo or artist.',
    items: [
      {
        question: 'How do I search for tattoos or artists?',
        answer: (
          <>
            <Typography paragraph>
              Use the search bar and filters in the sidebar to find what you're looking for:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Text Search"
                  secondary="Enter keywords like 'dragon', 'floral', or an artist's name"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Style Filters"
                  secondary="Select tattoo styles like Japanese, Realism, or Minimalist"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Tag Filters"
                  secondary="Filter by subject matter like animals, flowers, or geometric patterns"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Location"
                  secondary="Find artists near you or in a specific city"
                />
              </ListItem>
            </List>
          </>
        ),
      },
      {
        question: 'What\'s the difference between Styles and Tags?',
        answer: (
          <>
            <Typography paragraph sx={{ fontWeight: 500 }}>
              Styles = Artistic Technique
            </Typography>
            <Typography paragraph>
              Styles describe the artistic approach or technique used to create a tattoo. Examples include:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label="Japanese" size="small" />
              <Chip label="Traditional" size="small" />
              <Chip label="Realism" size="small" />
              <Chip label="Watercolor" size="small" />
              <Chip label="Blackwork" size="small" />
              <Chip label="Minimalist" size="small" />
            </Box>
            <Typography paragraph sx={{ fontWeight: 500 }}>
              Tags = Subject Matter
            </Typography>
            <Typography paragraph>
              Tags describe what the tattoo depicts or its theme. Examples include:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label="Dragon" size="small" variant="outlined" />
              <Chip label="Flowers" size="small" variant="outlined" />
              <Chip label="Portrait" size="small" variant="outlined" />
              <Chip label="Geometric" size="small" variant="outlined" />
              <Chip label="Animals" size="small" variant="outlined" />
              <Chip label="Quote" size="small" variant="outlined" />
            </Box>
            <Typography>
              A single tattoo might be tagged as "Dragon" (subject) in "Japanese" style (technique).
            </Typography>
          </>
        ),
      },
      {
        question: 'How does the "Popular Tags" section work?',
        answer: (
          <>
            <Typography paragraph>
              The Popular Tags section shows the 10 most commonly used tags across all tattoos on the platform.
              These are ranked by how many tattoos have been tagged with each label.
            </Typography>
            <Typography>
              Clicking a popular tag instantly filters the results to show only tattoos with that subject matter.
              You can select multiple tags to narrow down your search further.
            </Typography>
          </>
        ),
      },
      {
        question: 'Can I combine multiple filters?',
        answer: (
          <>
            <Typography paragraph>
              Yes! All filters work together to refine your search. For example, you could search for:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: colors.surface, mb: 2 }}>
              <Typography sx={{ fontStyle: 'italic', color: colors.textSecondary }}>
                "Japanese style tattoos with dragon imagery within 50 miles of Los Angeles"
              </Typography>
            </Paper>
            <Typography>
              Active filters appear as badges below the search header. Click the X on any badge to remove that filter.
            </Typography>
          </>
        ),
      },
    ],
  },
  {
    id: 'location',
    title: 'Location-Based Search',
    icon: <LocationOnIcon />,
    description: 'Finding artists near you.',
    items: [
      {
        question: 'How does location search work?',
        answer: (
          <>
            <Typography paragraph>
              InkedIn offers three location options:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><LocationOnIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Anywhere"
                  secondary="No location restrictions - see artists from all locations"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LocationOnIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Near Me"
                  secondary="Uses your saved profile location"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LocationOnIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Custom Location"
                  secondary="Enter any city or address to search that area"
                />
              </ListItem>
            </List>
          </>
        ),
      },
      {
        question: 'What does the distance slider do?',
        answer: (
          <>
            <Typography paragraph>
              When searching by location (Near Me or Custom Location), the distance slider lets you
              control how far from that point to search. The range is 5 to 200 miles.
            </Typography>
            <Typography>
              Artists within your specified distance will be shown, with results typically sorted by
              proximity (closest first) when using location-based search.
            </Typography>
          </>
        ),
      },
      {
        question: 'Why am I being asked to share my location?',
        answer: (
          <>
            <Typography paragraph>
              When you select "Near Me", your browser may ask permission to access your location.
              This is used only to find artists near you and is never stored or shared.
            </Typography>
            <Typography>
              If you prefer not to share your location, you can:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Use 'Anywhere' to see all artists" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Enter a custom location (city name)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Save a location in your profile settings" />
              </ListItem>
            </List>
          </>
        ),
      },
    ],
  },
  {
    id: 'saving-favorites',
    title: 'Saving & Favorites',
    icon: <BookmarkIcon />,
    description: 'Keep track of artists and tattoos you love.',
    items: [
      {
        question: 'How do I save a tattoo or artist?',
        answer: (
          <>
            <Typography paragraph>
              Click the bookmark icon on any tattoo card or artist profile to save it to your favorites.
              You'll need to be logged in to save items.
            </Typography>
            <Typography>
              Saved items can be accessed from your profile page at any time.
            </Typography>
          </>
        ),
      },
      {
        question: 'What does "Apply Saved Styles" do?',
        answer: (
          <>
            <Typography paragraph>
              If you've saved your favorite tattoo styles in your profile, the "Apply Saved Styles"
              toggle automatically includes those styles in your search filters.
            </Typography>
            <Typography>
              This is a quick way to personalize your browsing experience based on your preferences.
            </Typography>
          </>
        ),
      },
    ],
  },
  {
    id: 'for-artists',
    title: 'For Artists',
    icon: <BrushIcon />,
    description: 'Information for tattoo artists.',
    items: [
      {
        question: 'How do I join InkedIn as an artist?',
        answer: (
          <>
            <Typography paragraph>
              Click "Join as an Artist" on the homepage or navigation bar. You'll create an account
              and set up your artist profile with:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText primary="Profile photo and bio" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText primary="Studio location and contact info" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText primary="Your specialization styles" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText primary="Portfolio of your work" />
              </ListItem>
            </List>
          </>
        ),
      },
      {
        question: 'What does "Books Open" mean?',
        answer: (
          <>
            <Typography paragraph>
              "Books Open" indicates that an artist is currently accepting new clients and bookings.
              When enabled, a green badge appears on your profile.
            </Typography>
            <Typography>
              You can toggle this setting in your artist dashboard. Turn it off when you're booked
              up or taking a break from new clients.
            </Typography>
          </>
        ),
      },
      {
        question: 'How do I upload my portfolio?',
        answer: (
          <>
            <Typography paragraph>
              From your artist dashboard, you can upload tattoo images one at a time or use our
              Bulk Upload feature to add multiple images at once.
            </Typography>
            <Typography paragraph>
              For each tattoo, you can add:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Style classification (Japanese, Realism, etc.)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Tags describing the subject matter. New tags not in our system will be queued for approval." />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Description and any notes" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Placement on body (arm, back, etc.)" />
              </ListItem>
            </List>
            <Typography>
              We automatically suggest tags based on the image content, but you do not have to use these suggestions.
            </Typography>
          </>
        ),
      },
      {
        question: 'How do clients find me?',
        answer: (
          <>
            <Typography paragraph>
              Clients can discover your work through:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><SearchIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Search & Filters"
                  secondary="When clients search for your styles or nearby artists"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><StyleIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Style Browsing"
                  secondary="When browsing specific tattoo styles you specialize in"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LocalOfferIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Tag Discovery"
                  secondary="When your tattoos match popular tag searches"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LocationOnIcon sx={{ color: colors.accent }} /></ListItemIcon>
                <ListItemText
                  primary="Location Search"
                  secondary="When clients search for artists in your area"
                />
              </ListItem>
            </List>
            <Typography sx={{ mt: 1 }}>
              Tip: The more tattoos you upload with accurate styles and tags, the more discoverable
              you become!
            </Typography>
          </>
        ),
      },
      {
        question: 'What are the benefits of being a founding artist?',
        answer: (
          <>
            <Typography paragraph>
              As an early member of InkedIn, founding artists receive:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.warning }} /></ListItemIcon>
                <ListItemText
                  primary="Premium Visibility"
                  secondary="Featured placement in search results during our growth phase"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.warning }} /></ListItemIcon>
                <ListItemText
                  primary="Founding Member Badge"
                  secondary="Recognition as an early supporter of the platform"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.warning }} /></ListItemIcon>
                <ListItemText
                  primary="Early Access"
                  secondary="First access to new features as we build them"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleOutlineIcon sx={{ color: colors.warning }} /></ListItemIcon>
                <ListItemText
                  primary="Direct Input"
                  secondary="Help shape the platform with your feedback"
                />
              </ListItem>
            </List>
          </>
        ),
      },
    ],
  },
  {
    id: 'coming-soon',
    title: 'Coming Soon',
    icon: <EventAvailableIcon />,
    description: 'Features we\'re building next.',
    items: [
      {
        question: 'Will InkedIn have booking and appointment scheduling?',
        answer: (
          <>
            <Typography paragraph>
              Yes! Integrated booking and appointment scheduling is on our roadmap. Soon you'll be able to:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Request consultations directly through the platform" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Book appointments with available artists" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Submit deposits to secure your spot" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Manage your appointments in one place" />
              </ListItem>
            </List>
          </>
        ),
      },
      {
        question: 'What about travel tattoo assignments?',
        answer: (
          <>
            <Typography paragraph>
              We're planning a Travel Tattoo feature that will allow:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Artists to announce guest spots and travel dates" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Clients to find visiting artists in their area" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Convention and event scheduling integration" />
              </ListItem>
            </List>
            <Typography>
              Stay tuned for updates on this feature!
            </Typography>
          </>
        ),
      },
      {
        question: 'How can I stay updated on new features?',
        answer: (
          <>
            <Typography paragraph>
              As a founding member or early user, you'll be among the first to know about new features:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Follow us on social media for announcements" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Check back on this FAQ page for updates" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Founding artists receive early access to beta features" />
              </ListItem>
            </List>
            <Typography>
              We're actively building and would love your feedback on what features matter most to you!
            </Typography>
          </>
        ),
      },
    ],
  },
];

export default function FAQPage() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Layout>
      <Head>
        <title>FAQ | InkedIn</title>
        <meta name="description" content="Frequently asked questions about InkedIn - find answers about searching, styles, tags, and more." />
        <link rel="icon" href="/assets/img/logo.png" />
      </Head>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              color: colors.textPrimary,
              fontWeight: 700,
              mb: 2,
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: '1.1rem',
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Everything you need to know about finding tattoos, discovering artists,
            and using InkedIn.
          </Typography>
        </Box>

        {/* Quick Navigation */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Typography
            sx={{
              color: colors.textPrimary,
              fontWeight: 600,
              mb: 2,
            }}
          >
            Jump to a topic:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {faqSections.map((section) => (
              <Chip
                key={section.id}
                icon={section.icon as React.ReactElement}
                label={section.title}
                component="a"
                href={`#${section.id}`}
                clickable
                sx={{
                  bgcolor: `${colors.accent}1A`,
                  color: colors.accent,
                  '&:hover': {
                    bgcolor: `${colors.accent}33`,
                  },
                  '& .MuiChip-icon': {
                    color: colors.accent,
                  },
                }}
              />
            ))}
            <Chip
              icon={<EmailIcon />}
              label="Contact Us"
              component="a"
              href="#contact"
              clickable
              sx={{
                bgcolor: `${colors.warning}1A`,
                color: colors.warning,
                '&:hover': {
                  bgcolor: `${colors.warning}33`,
                },
                '& .MuiChip-icon': {
                  color: colors.warning,
                },
              }}
            />
          </Box>
        </Paper>

        {/* FAQ Sections */}
        {faqSections.map((section) => (
          <Box key={section.id} id={section.id} sx={{ mb: 4, scrollMarginTop: '100px' }}>
            {/* Section Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: `${colors.accent}1A`,
                  color: colors.accent,
                  display: 'flex',
                }}
              >
                {section.icon}
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    color: colors.textPrimary,
                    fontWeight: 600,
                  }}
                >
                  {section.title}
                </Typography>
                <Typography
                  sx={{
                    color: colors.textSecondary,
                    fontSize: '0.9rem',
                  }}
                >
                  {section.description}
                </Typography>
              </Box>
            </Box>

            {/* Questions */}
            {section.items.map((item, index) => {
              const panelId = `${section.id}-${index}`;
              return (
                <Accordion
                  key={panelId}
                  expanded={expanded === panelId}
                  onChange={handleChange(panelId)}
                  sx={{
                    bgcolor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    '&:before': { display: 'none' },
                    mb: 1,
                    '&.Mui-expanded': {
                      margin: '0 0 8px 0',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary }} />}
                    sx={{
                      '&:hover': {
                        bgcolor: `${colors.accent}0D`,
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        color: colors.textPrimary,
                        fontWeight: 500,
                      }}
                    >
                      {item.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      borderTop: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                    }}
                  >
                    {item.answer}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        ))}

        {/* Contact Form Accordion */}
        <Accordion
          id="contact"
          sx={{
            bgcolor: colors.surface,
            border: `2px solid ${colors.accent}`,
            borderRadius: '8px !important',
            scrollMarginTop: '100px',
            '&:before': { display: 'none' },
            '&.Mui-expanded': {
              margin: 0,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: colors.textOnLight }} />}
            sx={{
              bgcolor: colors.accent,
              borderRadius: '6px',
              '&.Mui-expanded': {
                borderRadius: '6px 6px 0 0',
              },
              '&:hover': {
                bgcolor: colors.accentHover,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EmailIcon sx={{ color: colors.textOnLight }} />
              <Typography
                variant="h6"
                sx={{
                  color: colors.textOnLight,
                  fontWeight: 600,
                }}
              >
                Still have questions? Contact us!
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <Typography
              sx={{
                color: colors.textSecondary,
                mb: 3,
              }}
            >
              We're here to help! Send us a message and we'll get back to you.
            </Typography>
            <ContactForm />
          </AccordionDetails>
        </Accordion>
      </Container>
    </Layout>
  );
}
