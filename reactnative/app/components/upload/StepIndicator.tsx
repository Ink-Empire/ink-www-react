import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

const STEPS = ['Images', 'Details', 'Tags', 'Review'];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {STEPS.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isFuture = index > currentStep;

        return (
          <React.Fragment key={label}>
            {index > 0 && (
              <View
                style={[
                  styles.line,
                  isCompleted || isCurrent ? styles.lineActive : styles.lineInactive,
                ]}
              />
            )}
            <View style={styles.step}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                  isFuture && styles.circleFuture,
                ]}
              >
                {isCompleted ? (
                  <MaterialIcons name="check" size={14} color={colors.background} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isCurrent && styles.circleTextCurrent,
                      isFuture && styles.circleTextFuture,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isCurrent && styles.labelCurrent,
                  isFuture && styles.labelFuture,
                ]}
              >
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  step: {
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    backgroundColor: colors.accent,
  },
  circleCurrent: {
    backgroundColor: colors.accent,
  },
  circleFuture: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  circleTextCurrent: {
    color: colors.background,
  },
  circleTextFuture: {
    color: colors.textMuted,
  },
  label: {
    color: colors.accent,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  labelCurrent: {
    color: colors.accent,
  },
  labelFuture: {
    color: colors.textMuted,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 18,
  },
  lineActive: {
    backgroundColor: colors.accent,
  },
  lineInactive: {
    backgroundColor: colors.border,
  },
});
