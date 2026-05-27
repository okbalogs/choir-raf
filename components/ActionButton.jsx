import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';

export const ActionButton = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  style, 
  textStyle,
  disabled = false,
  icon
}) => {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: { backgroundColor: Theme.colors.primary },
          text: { color: Theme.colors.white },
        };
      case 'accent':
        return {
          button: { backgroundColor: Theme.colors.accent },
          text: { color: Theme.colors.primaryDark },
        };
      case 'outline':
        return {
          button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E5E7EB' },
          text: { color: Theme.colors.primaryDark },
        };
      default:
        return {
          button: { backgroundColor: Theme.colors.primary },
          text: { color: Theme.colors.white },
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.8}
      disabled={disabled}
      style={[styles.button, vStyles.button, style, disabled && styles.disabled]}
    >
      <View style={styles.content}>
        {icon && <Ionicons name={icon} size={20} color={vStyles.text.color} style={styles.icon} />}
        <Text style={[styles.text, vStyles.text, textStyle]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Theme.roundness.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.6,
  }
});
