import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PanResponder,
} from 'react-native';
import { colors } from '../../../lib/colors';
import { usePushNotificationBanner } from '../../contexts/PushNotificationContext';
import { navigationRef } from '../../../App';

const SLIDE_DURATION = 300;
const TOP_INSET = Platform.OS === 'ios' ? 54 : 24;
const SWIPE_THRESHOLD = -30;

export default function PushNotificationBanner() {
  const { currentNotification, dismiss } = usePushNotificationBanner();
  const translateY = useRef(new Animated.Value(-120)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < SWIPE_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: -120,
            duration: 200,
            useNativeDriver: true,
          }).start(() => dismiss());
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (currentNotification) {
      translateY.setValue(-120);
      Animated.timing(translateY, {
        toValue: 0,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [currentNotification, translateY]);

  const handlePress = () => {
    if (!currentNotification) return;
    dismiss();

    const { data } = currentNotification;
    if (!data?.type || !navigationRef.isReady()) return;

    if (data.type === 'artist_tagged') {
      (navigationRef as any).navigate('ProfileStack', {
        screen: 'PendingApprovals',
      });
    }
  };

  if (!currentNotification) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.title} numberOfLines={1}>
          {currentNotification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {currentNotification.body}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: TOP_INSET,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(201, 169, 98, 0.95)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 9998,
  },
  touchable: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
