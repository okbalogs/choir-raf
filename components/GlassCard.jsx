import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../constants/Theme';

export const GlassCard = ({ 
  children, 
  style, 
  gradient = ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)'] 
}) => {
  return (
    <View style={[styles.outer, style]}>
      <LinearGradient
        colors={gradient}
        style={styles.inner}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    borderRadius: Theme.roundness.lg,
    backgroundColor: Theme.colors.white,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  inner: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.roundness.lg,
  },
});
