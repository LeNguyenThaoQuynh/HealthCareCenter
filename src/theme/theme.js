// src/theme/theme.js
import { Platform } from "react-native";
// XÓA DÒNG LỖI NÀY:
// import { COLORS, SPACING, FONT_SIZE, SHADOWS, GRADIENTS } from "../theme/theme";

// ==================== MÀU SẮC ====================
export const COLORS = {
    primary: "#007AFF",
    primaryDark: "#0051D4",
    primaryLight: "#5AC8FA",

    accentTeal: "#00C4B4",
    accentGreen: "#32D74B",
    accentPurple: "#AF52DE",
    accentOrange: "#FF9F0A",
    accentPink: "#FF375F",

    success: "#32D74B",
    warning: "#FF9F0A",
    danger: "#FF453A",
    info: "#007AFF",

    background: "#F7F9FC",
    surface: "#FFFFFF",
    surfaceVariant: "#F2F4F8",
    border: "#E5E7EB",
    overlay: "rgba(0,0,0,0.4)",

    textPrimary: "#1C1C1E",
    textSecondary: "#666666",
    textLight: "#888888",
    textOnPrimary: "#FFFFFF",
    textDisabled: "#AEAEB2",
};


export const GRADIENTS = {
    header: ["#2563EB", "#3B82F6"],
    headerAlt: ["#2563EB", "#3B82F6"],
    primaryButton: ["#007AFF", "#5AC8FA"],
    successButton: ["#00C4B4", "#32D74B"],
    card1: ["#667eea", "#764ba2"],
    card2: ["#f093fb", "#f5576c"],
    card3: ["#4facfe", "#00f2fe"],
    card4: ["#43e97b", "#38f9d7"],
    card5: ["#fa709a", "#fee140"],
    card6: ["#a8edea", "#fed6e3"],
    doctorCard: ["#7C3AED", "#A78BFA"],
    appointmentCard: ["#007AFF", "#5AC8FA"],
    healthTip: ["#00C4B4", "#32D74B"],
};

const CARD_GRADIENT_LIST = Object.values(GRADIENTS).filter(
    g => Array.isArray(g) && g.length === 2
);

// ==================== CÁC HẰNG SỐ KHÁC ====================
export const SPACING = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, xxxxl: 48, huge: 64,
};

export const BORDER_RADIUS = {
    sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36, full: 9999,
};

export const FONT_SIZE = {
    xs: 12, sm: 13, base: 14, md: 15, lg: 16, xl: 18, xxl: 20,
    title: 22, header: 28, giant: 36, huge: 44,
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
    small: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    card: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
    },
    floating: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 20,
    },
};

// ==================== HELPER ====================
export const getCardGradient = (index = 0) =>
    CARD_GRADIENT_LIST[index % CARD_GRADIENT_LIST.length];

export const getRandomGradient = () =>
    CARD_GRADIENT_LIST[Math.floor(Math.random() * CARD_GRADIENT_LIST.length)];

// ==================== OBJECT THEME (để dùng kiểu cũ nếu cần) ====================
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
    bottomTabHeight: Platform.OS === "ios" ? 90 : 70,
    statusBarHeight: Platform.OS === "ios" ? 50 : 30,
};

// CHỈ XUẤT DEFAULT MỘT LẦN DUY NHẤT – ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT!!!
export default theme;