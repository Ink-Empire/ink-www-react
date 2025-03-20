import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { ArtistType } from '../models/artist.interface';

const loadArtist = async (id: number): Promise<ArtistType | null> => {
  try {
    const artists = require('../../assets/data/artists.json');
    return artists.find((artist: ArtistType) => artist.id === id) || null;
  } catch (error) {
    console.error('Failed to load artist:', error);
    return null;
  }
};

const ArtistDetailScreen = ({ route, navigation }: any) => {
  const { artistId } = route.params;
  const [artist, setArtist] = useState<ArtistType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtist = async () => {
      const data = await loadArtist(artistId);
      setArtist(data);
      setLoading(false);
    };

    fetchArtist();
  }, [artistId]);

  if (loading || !artist) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleEmailPress = () => {
    if (artist.email) {
      Linking.openURL(`mailto:${artist.email}`);
    }
  };

  const handlePhonePress = () => {
    if (artist.phone) {
      Linking.openURL(`tel:${artist.phone}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image
          source={{ uri: artist.image?.uri.replace('/assets', 'file:///android_asset') }}
          style={styles.coverImage}
        />
        
        <View style={styles.content}>
          <Text style={styles.name}>{artist.name}</Text>
          <Text style={styles.shop}>{artist.shop}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.about}>{artist.about}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.location}>{artist.location}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Styles</Text>
            <View style={styles.stylesContainer}>
              {artist.styles?.map((style, index) => (
                <View key={index} style={styles.styleTag}>
                  <Text style={styles.styleText}>{style}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <TouchableOpacity onPress={handleEmailPress}>
              <Text style={styles.contactLink}>{artist.email}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePhonePress}>
              <Text style={styles.contactLink}>{artist.phone}</Text>
            </TouchableOpacity>
          </View>

          {artist.tattoos && artist.tattoos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {artist.tattoos.map((tattoo, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => navigation.navigate('TattooDetail', { tattooId: tattoo.id })}
                  >
                    <Image
                      source={{ uri: tattoo.image.uri.replace('/assets', 'file:///android_asset') }}
                      style={styles.portfolioImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shop: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  about: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  location: {
    fontSize: 16,
    color: '#444',
  },
  stylesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  styleTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  styleText: {
    fontSize: 14,
    color: '#666',
  },
  contactLink: {
    fontSize: 16,
    color: '#0066cc',
    marginBottom: 8,
  },
  portfolioImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
});

export default ArtistDetailScreen;