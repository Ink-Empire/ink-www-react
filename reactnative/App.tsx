/**
 * Inkedin App - React Native version
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, SafeAreaView } from 'react-native';

// Import screens
import HomeScreen from './app/screens/HomeScreen';
import SearchScreen from './app/screens/SearchScreen';
import ArtistListScreen from './app/screens/ArtistListScreen';
import ArtistDetailScreen from './app/screens/ArtistDetailScreen';

// Create the navigator
const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Inked Out' }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Search' }}
        />
        <Stack.Screen 
          name="ArtistList" 
          component={ArtistListScreen} 
          options={{ title: 'Artists' }}
        />
        <Stack.Screen 
          name="ArtistDetail" 
          component={ArtistDetailScreen} 
          options={({ route }: any) => ({ 
            title: route.params?.name || 'Artist Details' 
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
