import { Platform } from "react-native";

export const COLORS = {
  primary: "#0066CC",
  primaryLight: "#5AB4FF",
  primarySoft: "#E6F3FF",
  primaryDark: "#004C99",
  accentBlue: "#3B82F6",
  accentCyan: "#00C4D6",
  accentPink: "#FF6BA6",
  accentOrange: "#FF9E45",
  success: "#2ECC71",
  warning: "#F1C40F",
  danger: "#E63946",
  info: "#3B82F6",
  background: "#F1F7FF",
  surface: "#FFFFFF",
  surfaceSoft: "#F7FAFF",
  border: "#E4E9F2",
  textPrimary: "#1B1D21",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  textOnPrimary: "#FFFFFF",
};

export const GRADIENTS = {
  header: ["#4A90E2", "#6EC6FF"],
  primaryButton: ["#007AFF", "#5AC8FA"],
  card1: ["#A1C4FD", "#C2E9FB"],
  card2: ["#FBC2EB", "#A6C1EE"],
  card3: ["#D4FC79", "#96E6A1"],
  card4: ["#84FAB0", "#8FD3F4"],
  card5: ["#FCCF31", "#F55555"],
  health: ["#00C4B4", "#32D74B"],
  appointment: ["#007AFF", "#5AC8FA"],
};

const CARD_GRADIENT_LIST = Object.values(GRADIENTS).filter(
  g => Array.isArray(g) && g.length === 2
);

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  huge: 40,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 9999,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 13,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 22,
  header: 28,
};

export const FONT_WEIGHT = {
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
};

export const SHADOWS = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  floating: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
};

export const getCardGradient = index =>
  CARD_GRADIENT_LIST[index % CARD_GRADIENT_LIST.length];

export const getRandomGradient = () =>
  CARD_GRADIENT_LIST[Math.floor(Math.random() * CARD_GRADIENT_LIST.length)];

const theme = {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
  getCardGradient,
  getRandomGradient,
  headerHeight: Platform.OS === "ios" ? 140 : 120,
  bottomTabHeight: Platform.OS === "ios" ? 90 : 72,
  statusBarHeight: Platform.OS === "ios" ? 48 : 28,
};

export default theme;
