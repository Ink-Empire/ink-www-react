import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box, Typography, Button, CircularProgress, Alert,
} from '@mui/material';
import { colors } from '@/styles/colors';
import { tattooService } from '@/services/tattooService';
import { useAuth } from '@/contexts/AuthContext';

export default function ClaimPage() {
  const router = useRouter();
  const { token } = router.query;
  const { user } = useAuth();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || typeof token !== 'string') return;

    const fetchInvitation = async () => {
      try {
        const response = await tattooService.getInvitation(token);
        setInvitation(response.invitation);
        if (response.invitation.claimed) {
          setClaimed(true);
        }
      } catch (err: any) {
        setError('This invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleClaim = async () => {
    if (!token || typeof token !== 'string') return;
    setClaiming(true);
    setError('');

    try {
      await tattooService.claimInvitation(token);
      setClaimed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to claim tattoos. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: colors.background }}>
        <CircularProgress sx={{ color: colors.accent }} />
      </Box>
    );
  }

  if (error && !invitation) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: colors.background, p: 3 }}>
        <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary, mb: 2 }}>
            Invalid Invitation
          </Typography>
          <Typography sx={{ color: colors.textMuted, mb: 3 }}>{error}</Typography>
          <Link href="/" passHref>
            <Button sx={{ bgcolor: colors.accent, color: colors.background, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 4, py: 1.25, '&:hover': { bgcolor: colors.accentHover } }}>
              Go to InkedIn
            </Button>
          </Link>
        </Box>
      </Box>
    );
  }

  if (claimed) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: colors.background, p: 3 }}>
        <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.accent, mb: 2 }}>
            Tattoos Claimed
          </Typography>
          <Typography sx={{ color: colors.textMuted, mb: 3 }}>
            These tattoos are now part of your portfolio on InkedIn.
          </Typography>
          <Link href="/dashboard" passHref>
            <Button sx={{ bgcolor: colors.accent, color: colors.background, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 4, py: 1.25, '&:hover': { bgcolor: colors.accentHover } }}>
              Go to Dashboard
            </Button>
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: colors.background, p: 3 }}>
      <Box sx={{ maxWidth: 560, width: '100%' }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.textPrimary, mb: 1, textAlign: 'center' }}>
          Claim Your Tattoo Work
        </Typography>
        <Typography sx={{ color: colors.textMuted, mb: 3, textAlign: 'center' }}>
          {invitation?.invited_by} shared your work on InkedIn.
          {invitation?.unclaimed_tattoo_count > 1
            ? ` You have ${invitation.unclaimed_tattoo_count} tattoos waiting to be claimed.`
            : ''}
        </Typography>

        {/* Tattoo previews */}
        {invitation?.tattoos?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {/* Primary image — centered */}
            {invitation.tattoos[0]?.primary_image && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: invitation.tattoos.length > 1 ? 1.5 : 0 }}>
                <Box sx={{ position: 'relative', width: 280, height: 280, borderRadius: '12px', overflow: 'hidden', bgcolor: colors.surface }}>
                  <Image
                    src={invitation.tattoos[0].primary_image}
                    alt={invitation.tattoos[0].title || 'Tattoo'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
              </Box>
            )}
            {/* Additional tattoos as thumbnails */}
            {invitation.tattoos.length > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                {invitation.tattoos.slice(1).map((tattoo: any) => (
                  <Box key={tattoo.id} sx={{ position: 'relative', width: 64, height: 64, borderRadius: '8px', overflow: 'hidden', bgcolor: colors.surface }}>
                    {tattoo.primary_image && (
                      <Image
                        src={tattoo.primary_image}
                        alt={tattoo.title || 'Tattoo'}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: `${colors.error}15`, color: colors.error }}>
            {error}
          </Alert>
        )}

        {user && user.email?.toLowerCase() === invitation?.email?.toLowerCase() ? (
          <Button
            onClick={handleClaim}
            disabled={claiming}
            fullWidth
            sx={{
              py: 1.5,
              bgcolor: colors.accent,
              color: colors.background,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: '10px',
              '&:hover': { bgcolor: colors.accentHover },
              '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
            }}
          >
            {claiming ? 'Claiming...' : 'Claim These Tattoos'}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {user && user.email?.toLowerCase() !== invitation?.email?.toLowerCase() && (
              <Alert severity="info" sx={{ mb: 1, bgcolor: `${colors.info}15`, color: colors.info }}>
                You're signed in as {user.email}. Please sign in with {invitation?.email} to claim these tattoos.
              </Alert>
            )}
            <Link href={`/register?redirect=/claim/${token}`} passHref>
              <Button
                fullWidth
                sx={{
                  py: 1.5,
                  bgcolor: colors.accent,
                  color: colors.background,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: '10px',
                  '&:hover': { bgcolor: colors.accentHover },
                }}
              >
                Sign Up to Claim Your Tattoos
              </Button>
            </Link>
            <Link href={`/login?redirect=/claim/${token}`} passHref>
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  py: 1.5,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  '&:hover': { borderColor: colors.accent, color: colors.accent },
                }}
              >
                Already have an account? Log in
              </Button>
            </Link>
          </Box>
        )}
      </Box>
    </Box>
  );
}
