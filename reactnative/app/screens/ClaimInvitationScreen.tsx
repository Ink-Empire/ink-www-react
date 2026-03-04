import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { colors } from '../../lib/colors';
import { tattooService } from '../../lib/services';
import { useSnackbar } from '../contexts/SnackbarContext';

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 56) / 3;

export default function ClaimInvitationScreen({ route, navigation }: any) {
  const { token } = route.params;
  const { showSnackbar } = useSnackbar();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await tattooService.getInvitation(token);
        setInvitation(response.invitation);
        if (response.invitation.claimed) {
          setClaimed(true);
        }
      } catch {
        setError('This invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await tattooService.claimInvitation(token);
      setClaimed(true);
      showSnackbar('Tattoos claimed successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to claim tattoos.');
      showSnackbar('Failed to claim tattoos. Please try again.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !invitation) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Text style={s.title}>Invalid Invitation</Text>
          <Text style={s.subtitle}>{error}</Text>
          <TouchableOpacity style={s.button} onPress={() => navigation.goBack()}>
            <Text style={s.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (claimed) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Text style={[s.title, { color: colors.accent }]}>Tattoos Claimed</Text>
          <Text style={s.subtitle}>These tattoos are now part of your portfolio.</Text>
          <TouchableOpacity style={s.button} onPress={() => navigation.navigate('HomeTab')}>
            <Text style={s.buttonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Claim Your Tattoo Work</Text>
        <Text style={s.subtitle}>
          {invitation?.invited_by} shared your work on InkedIn.
          {invitation?.unclaimed_tattoo_count > 1
            ? ` You have ${invitation.unclaimed_tattoo_count} tattoos waiting to be claimed.`
            : ''}
        </Text>

        {invitation?.tattoos?.length > 0 && (
          <View style={s.grid}>
            {invitation.tattoos.map((tattoo: any) => (
              <View key={tattoo.id} style={s.imageWrap}>
                {tattoo.primary_image && (
                  <Image source={{ uri: tattoo.primary_image }} style={s.image} />
                )}
              </View>
            ))}
          </View>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.button, claiming && s.buttonDisabled]}
          onPress={handleClaim}
          disabled={claiming}
        >
          {claiming ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={s.buttonText}>Claim These Tattoos</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, justifyContent: 'center' },
  imageWrap: {
    width: imageSize, height: imageSize, borderRadius: 8,
    overflow: 'hidden', backgroundColor: colors.surface,
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  error: { color: colors.error, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  button: {
    backgroundColor: colors.accent, paddingVertical: 16, paddingHorizontal: 40,
    borderRadius: 10, alignItems: 'center', width: '100%',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '700' },
});
