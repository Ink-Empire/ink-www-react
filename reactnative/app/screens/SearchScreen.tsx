import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  FlatList
} from 'react-native';
import { SearchForm } from '../models/searchform.interface';

const SearchScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchForm, setSearchForm] = useState<SearchForm>({
    styles: [],
    near_me: false,
    distance: '25'
  });
  
  const handleSearch = () => {
    // In a real app, this would search the API
    navigation.navigate('ArtistList');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Tattoos & Artists</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by style, subject, or artist"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categories}>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => navigation.navigate('ArtistList')}
            >
              <Text style={styles.categoryText}>Artists</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => {/* Navigate to Tattoos */}}
            >
              <Text style={styles.categoryText}>Tattoos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => {/* Navigate to Studios */}}
            >
              <Text style={styles.categoryText}>Studios</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Styles</Text>
          <View style={styles.styles}>
            <TouchableOpacity style={styles.styleTag}>
              <Text style={styles.styleText}>Traditional</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.styleTag}>
              <Text style={styles.styleText}>Neo-Traditional</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.styleTag}>
              <Text style={styles.styleText}>Japanese</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.styleTag}>
              <Text style={styles.styleText}>Realism</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.styleTag}>
              <Text style={styles.styleText}>Blackwork</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.styleTag}>
              <Text style={styles.styleText}>New School</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryText: {
    fontWeight: 'bold',
    color: '#333',
  },
  styles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  styleTag: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  styleText: {
    color: '#666',
  },
});

export default SearchScreen;