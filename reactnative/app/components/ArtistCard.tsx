import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ArtistType } from '../models/artist.interface';

interface ArtistCardProps {
  artist: ArtistType;
  onPress: (artist: ArtistType) => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(artist)}
    >
      <Image
        source={{ uri: artist.image?.uri.replace('/assets', 'file:///android_asset') }} 
        style={styles.image} 
      />
      <View style={styles.info}>
        <Text style={styles.name}>{artist.name}</Text>
        <Text style={styles.shop}>{artist.shop}</Text>
        <Text style={styles.location}>{artist.location}</Text>
        {artist.styles && artist.styles.length > 0 && (
          <View style={styles.stylesContainer}>
            {artist.styles.map((style, index) => (
              <View key={index} style={styles.styleTag}>
                <Text style={styles.styleText}>{style}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  info: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shop: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  stylesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  styleTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  styleText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ArtistCard;