import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useStudioPost } from '@inkedin/shared/hooks';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorView from '../components/common/ErrorView';

/**
 * A studio's guide or announcement at its own address.
 *
 * One screen for both because they are one thing on the server - a
 * `studio_post` with a publishing envelope - and differ only in which route
 * they answer on. Two near-identical screens would also mean two registrations
 * in each of the five navigation stacks.
 */
export default function StudioPostScreen({ navigation, route }: any) {
  const { studioSlug, postSlug, kind } = route.params;
  const { post, loading, error } = useStudioPost(api, studioSlug, kind, postSlug);

  if (loading) return <LoadingScreen />;

  // A post that has no public page resolves to nothing rather than an error,
  // so both cases land here.
  if (error || !post) {
    return <ErrorView message={error?.message || 'That page is not available.'} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {!!post.type_label && <Text style={styles.kind}>{post.type_label}</Text>}

      <Text style={styles.title}>{post.title}</Text>

      {!!post.excerpt && <Text style={styles.excerpt}>{post.excerpt}</Text>}

      <Text style={styles.body}>{post.content}</Text>

      <TouchableOpacity
        style={styles.back}
        onPress={() => navigation.navigate('StudioDetail', { slug: studioSlug })}
      >
        <MaterialIcons name="arrow-back" size={18} color={colors.accent} />
        <Text style={styles.backText}>Back to the studio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  kind: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  excerpt: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
  },
  backText: {
    fontSize: 14,
    color: colors.accent,
  },
});
