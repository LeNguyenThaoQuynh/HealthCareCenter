// src/theme/theme.js

import { Platform } from 'react-native';

const COLORS = {
  primary: '#007AFF',
  primaryDark: '#0051D4',
  primaryLight: '#5AC8FA',

  accentPurple: '#8E44AD',
  accentTeal: '#00D2B8',
  accentOrange: '#FF9500',
  accentPink: '#FF3B7F',
  accentIndigo: '#5856D6',

  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#007AFF',

  background: '#F7F9FC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  disabled: '#9CA3AF',

  textPrimary: '#1C1C1E',
  textSecondary: '#666666',
  textLight: '#888888',
  textOnPrimary: '#FFFFFF',
  textOnSurface: '#1F2937',
};

const GRADIENTS = {
  header: ['#007AFF', '#5AC8FA'],
  primaryButton: ['#007AFF', '#5AC8FA'],

  card1: ['#667eea', '#764ba2'],
  card2: ['#f093fb', '#f5576c'],
  card3: ['#4facfe', '#00f2fe'],
  card4: ['#43e97b', '#38f9d7'],
  card5: ['#fa709a', '#fee140'],
  card6: ['#a8edea', '#fed6e3'],
  card7: ['#ff9a9e', '#fad0c4'],
  card8: ['#cfd9df', '#e2ebf0'],

  doctorCard: ['#7C3AED', '#A78BFA'],
  dateCard: ['#2563EB', '#3B82F6'],
};

const CARD_GRADIENT_LIST = [
  GRADIENTS.card1,
  GRADIENTS.card2,
  GRADIENTS.card3,
  GRADIENTS.card4,
  GRADIENTS.card5,
  GRADIENTS.card6,
  GRADIENTS.card7,
  GRADIENTS.card8,
];

export const theme = {
  COLORS,
  GRADIENTS,

  getCardGradient: (index = 0) => CARD_GRADIENT_LIST[index % CARD_GRADIENT_LIST.length],
  getRandomGradient: () => CARD_GRADIENT_LIST[Math.floor(Math.random() * CARD_GRADIENT_LIST.length)],

  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 48,
  },

  BORDER_RADIUS: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 36,
    full: 9999,
  },

  FONT_SIZE: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 20,
    title: 24,
    header: 32,
    giant: 40,
  },

  FONT_WEIGHT: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },

  SHADOWS: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 12,
    },
    header: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 16,
    },
  },

  headerPaddingTop: Platform.OS === 'ios' ? 60 : 40,
  bottomTabHeight: Platform.OS === 'ios' ? 83 : 70,
};

export default theme;