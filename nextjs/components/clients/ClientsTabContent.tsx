import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { colors } from '@/styles/colors';
import { clientInsightsService } from '@/services/clientInsightsService';
import type { ClientListItem } from '@/services/clientInsightsService';
import ClientInsightsPanel from './ClientInsightsPanel';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ClientsTabContent() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const response = await clientInsightsService.getClients(search);
      setClients(response.clients);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchClients(value.trim() || undefined);
    }, 300);
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 280px)', minHeight: 400 }}>
      {/* Client List */}
      <Box sx={{
        width: selectedClientId ? 340 : '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: selectedClientId ? `2px solid ${colors.border}` : 'none',
        transition: 'width 0.2s',
      }}>
        {/* Search */}
        <Box sx={{ px: 2, py: 1.5, maxWidth: 360 }}>
          <TextField
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search clients..."
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: colors.surface,
                color: colors.textPrimary,
                fontSize: '0.85rem',
                '& fieldset': { borderColor: colors.border },
                '&:hover fieldset': { borderColor: colors.borderLight },
                '&.Mui-focused fieldset': { borderColor: colors.accent },
              },
            }}
          />
        </Box>

        {/* Client List */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: colors.accent }} />
            </Box>
          ) : clients.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 3 }}>
              <PeopleOutlineIcon sx={{ fontSize: 48, color: colors.textMuted, mb: 1.5 }} />
              <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem', textAlign: 'center' }}>
                {searchQuery ? 'No clients match your search' : 'No clients yet'}
              </Typography>
              {!searchQuery && (
                <Typography sx={{ color: colors.textMuted, fontSize: '0.8rem', mt: 0.5, textAlign: 'center' }}>
                  Clients appear here after booking appointments
                </Typography>
              )}
            </Box>
          ) : (
            clients.map((client, index) => (
              <Box
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  bgcolor: selectedClientId === client.id ? colors.surface : 'transparent',
                  borderBottom: index < clients.length - 1 ? `1px solid ${colors.border}` : 'none',
                  borderLeft: selectedClientId === client.id ? `2px solid ${colors.accent}` : '2px solid transparent',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: colors.surface },
                }}
              >
                <Avatar sx={{
                  width: 40,
                  height: 40,
                  bgcolor: `${colors.accent}20`,
                  color: colors.accent,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  {getInitials(client.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontWeight: 500,
                    color: colors.textPrimary,
                    fontSize: '0.9rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {client.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                      {client.sessions} session{client.sessions !== 1 ? 's' : ''}
                    </Typography>
                    {client.next_appointment && (
                      <Typography sx={{ color: colors.tagPersonality, fontSize: '0.75rem' }}>
                        Next: {formatDate(client.next_appointment)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {client.tag_count > 0 && (
                  <Typography sx={{
                    color: colors.textMuted,
                    fontSize: '0.7rem',
                    bgcolor: colors.surface,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: '4px',
                  }}>
                    {client.tag_count} tag{client.tag_count !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Client Detail Panel */}
      {selectedClientId && (
        <Box sx={{ flex: 1, minWidth: 300, overflowY: 'auto' }}>
          <ClientInsightsPanel
            clientId={selectedClientId}
            onClose={() => setSelectedClientId(null)}
          />
        </Box>
      )}
    </Box>
  );
}
