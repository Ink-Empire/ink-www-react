import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../../lib/colors';
import InboxScreen from '../screens/InboxScreen';
import ConversationScreen from '../screens/ConversationScreen';
import type { InboxStackParamList } from './types';

const Stack = createStackNavigator<InboxStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary },
};

export default function InboxStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: 'Messages' }} />
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={({ route }) => ({ title: route.params?.participantName || 'Chat' })}
      />
    </Stack.Navigator>
  );
}
