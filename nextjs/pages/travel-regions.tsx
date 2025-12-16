import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import { withAuth } from '@/components/WithAuth';
import { colors } from '@/styles/colors';

// Types
interface Destination {
  id: string;
  city: string;
  country: string;
  region: string;
  flag: string;
  studios: number;
  demand: 'Low' | 'Medium' | 'High' | 'Very High';
  image?: string;
  styleMatch?: number;
}

// Sample data
const popularDestinations: Destination[] = [
  { id: '1', city: 'Tokyo', country: 'Japan', region: 'Asia Pacific', flag: '🇯🇵', studios: 156, demand: 'High', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop' },
  { id: '2', city: 'London', country: 'United Kingdom', region: 'Europe', flag: '🇬🇧', studios: 203, demand: 'High', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=200&fit=crop' },
  { id: '3', city: 'Los Angeles', country: 'USA', region: 'North America', flag: '🇺🇸', studios: 189, demand: 'Very High', image: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&h=200&fit=crop' },
  { id: '4', city: 'Berlin', country: 'Germany', region: 'Europe', flag: '🇩🇪', studios: 89, demand: 'High', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=200&fit=crop' },
  { id: '5', city: 'Paris', country: 'France', region: 'Europe', flag: '🇫🇷', studios: 67, demand: 'Medium', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop' },
  { id: '6', city: 'Sydney', country: 'Australia', region: 'Asia Pacific', flag: '🇦🇺', studios: 94, demand: 'High', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=200&fit=crop' },
];

const styleMatchSuggestions: Destination[] = [
  { id: 's1', city: 'Osaka', country: 'Japan', region: 'Asia Pacific', flag: '🇯🇵', studios: 78, demand: 'High', styleMatch: 95 },
  { id: 's2', city: 'Seoul', country: 'South Korea', region: 'Asia Pacific', flag: '🇰🇷', studios: 112, demand: 'High', styleMatch: 88 },
  { id: 's3', city: 'Singapore', country: 'Singapore', region: 'Asia Pacific', flag: '🇸🇬', studios: 45, demand: 'Medium', styleMatch: 82 },
  { id: 's4', city: 'Taipei', country: 'Taiwan', region: 'Asia Pacific', flag: '🇹🇼', studios: 56, demand: 'Medium', styleMatch: 79 },
];

const regionCountries: Record<string, Destination[]> = {
  'North America': [
    { id: 'na1', city: 'United States', country: 'United States', region: 'North America', flag: '🇺🇸', studios: 423, demand: 'Very High' },
    { id: 'na2', city: 'Canada', country: 'Canada', region: 'North America', flag: '🇨🇦', studios: 156, demand: 'High' },
    { id: 'na3', city: 'Mexico', country: 'Mexico', region: 'North America', flag: '🇲🇽', studios: 89, demand: 'Medium' },
    { id: 'na4', city: 'Puerto Rico', country: 'Puerto Rico', region: 'North America', flag: '🇵🇷', studios: 34, demand: 'Medium' },
  ],
  'Europe': [
    { id: 'eu1', city: 'United Kingdom', country: 'United Kingdom', region: 'Europe', flag: '🇬🇧', studios: 312, demand: 'Very High' },
    { id: 'eu2', city: 'Germany', country: 'Germany', region: 'Europe', flag: '🇩🇪', studios: 198, demand: 'High' },
    { id: 'eu3', city: 'France', country: 'France', region: 'Europe', flag: '🇫🇷', studios: 145, demand: 'High' },
    { id: 'eu4', city: 'Spain', country: 'Spain', region: 'Europe', flag: '🇪🇸', studios: 112, demand: 'Medium' },
  ],
  'Asia Pacific': [
    { id: 'ap1', city: 'Japan', country: 'Japan', region: 'Asia Pacific', flag: '🇯🇵', studios: 234, demand: 'Very High' },
    { id: 'ap2', city: 'Australia', country: 'Australia', region: 'Asia Pacific', flag: '🇦🇺', studios: 178, demand: 'High' },
    { id: 'ap3', city: 'South Korea', country: 'South Korea', region: 'Asia Pacific', flag: '🇰🇷', studios: 156, demand: 'High' },
    { id: 'ap4', city: 'Singapore', country: 'Singapore', region: 'Asia Pacific', flag: '🇸🇬', studios: 45, demand: 'Medium' },
  ],
  'South America': [
    { id: 'sa1', city: 'Brazil', country: 'Brazil', region: 'South America', flag: '🇧🇷', studios: 187, demand: 'High' },
    { id: 'sa2', city: 'Argentina', country: 'Argentina', region: 'South America', flag: '🇦🇷', studios: 89, demand: 'Medium' },
    { id: 'sa3', city: 'Colombia', country: 'Colombia', region: 'South America', flag: '🇨🇴', studios: 56, demand: 'Medium' },
    { id: 'sa4', city: 'Chile', country: 'Chile', region: 'South America', flag: '🇨🇱', studios: 34, demand: 'Low' },
  ],
};

const regions = ['North America', 'Europe', 'Asia Pacific', 'South America'];

const TravelRegionsPage: React.FC = () => {
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['1', '2', '3']);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('North America');

  const toggleDestination = (id: string) => {
    setSelectedDestinations(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const removeDestination = (id: string) => {
    setSelectedDestinations(prev => prev.filter(d => d !== id));
  };

  const getSelectedDestinationDetails = () => {
    const all = [...popularDestinations, ...styleMatchSuggestions, ...Object.values(regionCountries).flat()];
    return selectedDestinations.map(id => all.find(d => d.id === id)).filter(Boolean) as Destination[];
  };

  return (
    <Layout>
      <Head>
        <title>Travel Destinations | InkedIn</title>
      </Head>

      <Box sx={{ maxWidth: 900, mx: 'auto', py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: colors.textMuted,
              fontSize: '0.85rem',
              mb: 1.5,
              transition: 'color 0.15s',
              '&:hover': { color: colors.accent }
            }}>
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Back to Settings
            </Box>
          </Link>
          <Typography sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '2rem',
            fontWeight: 600,
            color: colors.textPrimary,
            mb: 0.5
          }}>
            Travel Destinations
          </Typography>
          <Typography sx={{ color: colors.textSecondary, fontSize: '1rem', maxWidth: 600 }}>
            Select regions where you'd like to work as a guest artist. Studios in these areas will be notified when you're looking for guest spots.
          </Typography>
        </Box>

        {/* Selected Destinations */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mb: 1
          }}>
            Your Destinations ({selectedDestinations.length})
          </Typography>
          {selectedDestinations.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {getSelectedDestinationDetails().map(dest => (
                <Box key={dest.id} sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.75,
                  bgcolor: `${colors.accent}1A`,
                  border: `1px solid ${colors.accent}4D`,
                  borderRadius: '100px',
                  fontSize: '0.85rem',
                  color: colors.textPrimary
                }}>
                  <span style={{ fontSize: '1rem' }}>{dest.flag}</span>
                  {dest.city}, {dest.country}
                  <Box
                    component="button"
                    onClick={() => removeDestination(dest.id)}
                    sx={{
                      width: 18,
                      height: 18,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '50%',
                      color: colors.textSecondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: colors.error, color: 'white' }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{
              p: 2,
              bgcolor: colors.surface,
              border: `1px dashed ${colors.border}`,
              borderRadius: '8px',
              textAlign: 'center',
              color: colors.textMuted,
              fontSize: '0.9rem'
            }}>
              No destinations selected. Browse below to add regions.
            </Box>
          )}
        </Box>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search cities, regions, or countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.textMuted }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: colors.surface,
                '& fieldset': { borderColor: colors.border },
                '&:hover fieldset': { borderColor: colors.borderLight },
                '&.Mui-focused fieldset': { borderColor: colors.accent }
              },
              '& .MuiInputBase-input': {
                color: colors.textPrimary,
                '&::placeholder': { color: colors.textMuted, opacity: 1 }
              }
            }}
          />
        </Box>

        {/* Style Match Suggestions */}
        <Box sx={{
          mb: 3,
          p: 2,
          background: `linear-gradient(135deg, ${colors.success}26 0%, ${colors.success}0D 100%)`,
          border: `1px solid ${colors.success}4D`,
          borderRadius: '12px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              bgcolor: colors.success,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <StarIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.1rem', fontWeight: 600 }}>
                Recommended for Your Style
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                High demand for your styles in these regions
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {styleMatchSuggestions.map(dest => (
              <Box
                key={dest.id}
                onClick={() => toggleDestination(dest.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.875,
                  bgcolor: selectedDestinations.includes(dest.id) ? `${colors.success}26` : colors.surface,
                  border: `1px solid ${selectedDestinations.includes(dest.id) ? colors.success : colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: colors.success }
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{dest.flag}</span>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{dest.city}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.success }}>{dest.styleMatch}% style match</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Popular Destinations */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.25rem', fontWeight: 600 }}>
              Popular Destinations
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
              Top cities for guest artists worldwide
            </Typography>
          </Box>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2
          }}>
            {popularDestinations.map(dest => (
              <Box
                key={dest.id}
                onClick={() => toggleDestination(dest.id)}
                sx={{
                  bgcolor: selectedDestinations.includes(dest.id) ? `${colors.accent}1A` : colors.surface,
                  border: `1px solid ${selectedDestinations.includes(dest.id) ? colors.accent : colors.border}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: colors.accent, transform: 'translateY(-2px)' }
                }}
              >
                <Box sx={{ height: 100, position: 'relative', bgcolor: colors.surfaceElevated }}>
                  {dest.image && (
                    <Image src={dest.image} alt={dest.city} fill style={{ objectFit: 'cover', opacity: 0.8 }} />
                  )}
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(15,15,15,0.8) 100%)' }} />
                  <Box sx={{ position: 'absolute', top: 12, left: 12, fontSize: '1.5rem', zIndex: 1 }}>{dest.flag}</Box>
                  {selectedDestinations.includes(dest.id) && (
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 24,
                      height: 24,
                      bgcolor: colors.accent,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}>
                      <CheckIcon sx={{ fontSize: 14, color: colors.background }} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ p: 1.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.25 }}>{dest.city}</Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 0.5 }}>{dest.country}</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      <Box component="strong" sx={{ color: colors.accent }}>{dest.studios}</Box> studios
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      <Box component="strong" sx={{ color: colors.accent }}>{dest.demand}</Box> demand
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Browse by Region */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.25rem', fontWeight: 600 }}>
              Browse by Region
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
              Explore all available destinations
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
            {regions.map(region => (
              <Box
                key={region}
                component="button"
                onClick={() => setActiveRegion(region)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  bgcolor: activeRegion === region ? colors.accent : colors.surface,
                  border: `1px solid ${activeRegion === region ? colors.accent : colors.border}`,
                  borderRadius: '100px',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  color: activeRegion === region ? colors.background : colors.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: activeRegion === region ? colors.accent : colors.textSecondary }
                }}
              >
                {region}
              </Box>
            ))}
          </Box>

          <Box sx={{
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            p: 2
          }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 1
            }}>
              {regionCountries[activeRegion]?.map(country => (
                <Box
                  key={country.id}
                  onClick={() => toggleDestination(country.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.25,
                    bgcolor: selectedDestinations.includes(country.id) ? `${colors.accent}1A` : colors.background,
                    border: `1px solid ${selectedDestinations.includes(country.id) ? colors.accent : colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': { borderColor: colors.accent }
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{country.flag}</span>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>{country.country}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>{country.studios} studios</Typography>
                  </Box>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    border: `2px solid ${selectedDestinations.includes(country.id) ? colors.accent : colors.border}`,
                    bgcolor: selectedDestinations.includes(country.id) ? colors.accent : 'transparent',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedDestinations.includes(country.id) && (
                      <CheckIcon sx={{ fontSize: 12, color: colors.background }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          pt: 2,
          borderTop: `1px solid ${colors.border}`
        }}>
          <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
            <Box component="strong" sx={{ color: colors.accent }}>{selectedDestinations.length} destinations</Box> selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Link href="/profile" style={{ textDecoration: 'none', flex: 1 }}>
              <Box
                component="button"
                sx={{
                  width: '100%',
                  px: 2,
                  py: 1,
                  bgcolor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: colors.accent, color: colors.accent }
                }}
              >
                Cancel
              </Box>
            </Link>
            <Box
              component="button"
              sx={{
                flex: 1,
                px: 2,
                py: 1,
                bgcolor: colors.accent,
                border: `1px solid ${colors.accent}`,
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: colors.background,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: colors.accentHover, borderColor: colors.accentHover }
              }}
            >
              Save
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default withAuth(TravelRegionsPage);
