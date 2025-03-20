import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import ArtistCard from '../components/ArtistCard';
import { ArtistType } from '../models/artist.interface';

// In a real app, this would come from an API
const loadArtists = async (): Promise<ArtistType[]> => {
  try {
    // In a React Native app, you would typically load this from your API
    // For this example, we're importing the JSON directly
    const artists = require('../../assets/data/artists.json');
    return artists;
  } catch (error) {
    console.error('Failed to load artists:', error);
    return [];
  }
};

const ArtistListScreen = ({ navigation }: any) => {
  const [artists, setArtists] = useState<ArtistType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      const data = await loadArtists();
      setArtists(data);
      setLoading(false);
    };

    fetchArtists();
  }, []);

  const handleArtistPress = (artist: ArtistType) => {
    navigation.navigate('ArtistDetail', { artistId: artist.id });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Artists</Text>
      </View>
      <FlatList
        data={artists}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <ArtistCard artist={item} onPress={handleArtistPress} />
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
});

export default ArtistListScreen;