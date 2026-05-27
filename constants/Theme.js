const shared = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  roundness: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export const LightTheme = {
  ...shared,
  dark: false,
  colors: {
    primary: '#5D1296',
    primaryLight: '#7B2CBF',
    primaryDark: '#3C096C',
    accent: '#FFC107',
    accentLight: '#FFD60A',
    surface: '#FFFFFF',
    background: '#F8F9FA',
    surfaceSubtle: '#F3F0F7',
    text: '#1A1A1A',
    textMuted: '#6B7280',
    textLight: '#9CA3AF',
    white: '#FFFFFF',
    error: '#EF4444',
    success: '#10B981',
    border: '#E5E7EB',
  }
};

export const DarkTheme = {
  ...shared,
  dark: true,
  colors: {
    primary: '#C4B5FD', // Lighter purple for better contrast
    primaryLight: '#DDD6FE',
    primaryDark: '#5D1296',
    accent: '#FBBF24',
    accentLight: '#FCD34D',
    surface: '#1E1E1E',
    background: '#0F172A', // Deep slate for premium feel
    surfaceSubtle: '#334155',
    text: '#F8F9FA',
    textMuted: '#94A3B8',
    textLight: '#64748B',
    white: '#FFFFFF',
    error: '#F87171',
    success: '#34D399',
    border: '#334155',
  }
};

// Default export for backward compatibility during transition
export const Theme = LightTheme;
