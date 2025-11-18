import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOWS,
} = theme;

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function AdminHomeScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    users: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const menuScales = useRef(Array.from({ length: 12 }, () => new Animated.Value(0.8))).current;

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        { count: doctorCount },
        { count: patientCount },
        { count: userCount },
        { count: appointmentCount },
      ] = await Promise.all([
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("user_profiles").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).neq("status", "cancelled"),
      ]);

      setStats({
        doctors: doctorCount || 0,
        patients: patientCount || 0,
        users: userCount || 0,
        appointments: appointmentCount || 0,
      });
    } catch (error) {
      console.error("Lỗi tải dữ liệu admin:", error);
    } finally {
      setLoading(false);
      animateEntrance();
    }
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ...menuScales.map((anim, i) =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 9,
          tension: 50,
          delay: i * 70,
          useNativeDriver: true,
        })
      ),
    ]).start();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // FIX: DÙNG MẢNG GRADIENT TRỰC TIẾP TRONG FILE (tránh lỗi undefined)
  const menuItems = [
    { title: "Quản lý bác sĩ",       icon: "medkit-outline",       screen: "Bác sĩ",         gradient: ["#3B82F6", "#1D4ED8"] },
    { title: "Quản lý bệnh nhân",    icon: "heart-outline",        screen: "Bệnh nhân",      gradient: ["#EC4899", "#BE185D"] },
    { title: "Quản lý người dùng",   icon: "people-outline",       screen: "Người dùng",     gradient: ["#8B5CF6", "#6D28D9"] },
    { title: "Tạo tài khoản",        icon: "person-add-outline",   screen: "Tạo tài khoản",  gradient: ["#F59E0B", "#D97706"] },
    { title: "Tạo bác sĩ",           icon: "briefcase-outline",    screen: "Tạo bác sĩ",     gradient: ["#10B981", "#059669"] },
    { title: "Lịch làm việc",        icon: "calendar-outline",     screen: "Lịch làm việc",  gradient: ["#6366F1", "#4F46E5"] },
    { title: "Báo cáo",              icon: "bar-chart-outline",    screen: "Báo cáo",        gradient: ["#F97316", "#EA580C"] },
    { title: "Quản trị hệ thống",    icon: "settings-outline",     screen: "Quản trị",       gradient: ["#64748B", "#475569"] },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu quản trị...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào, Admin</Text>
            <Text style={styles.subtitle}>Quản lý hệ thống y tế</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
            <LinearGradient colors={["#60A5FA", COLORS.primary]} style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        opacity={fadeAnim}
      >
        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          {[
            { label: "Bác sĩ",     value: stats.doctors,      icon: "medkit-outline",     color: COLORS.primary },
            { label: "Bệnh nhân",  value: stats.patients,     icon: "heart-outline",      color: "#EC4899" },
            { label: "Người dùng", value: stats.users,        icon: "people-outline",     color: "#8B5CF6" },
            { label: "Lịch khám",  value: stats.appointments, icon: "calendar-outline",   color: "#10B981" },
          ].map((item, i) => (
            <Animated.View
              key={i}
              style={[styles.statCardWrapper, { transform: [{ scale: menuScales[i] }] }]}
            >
              <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.statCard}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name={item.icon} size={36} color={item.color} />
                </View>
                <Text style={styles.statValue}>{item.value.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>

        {/* MENU GRID */}
        <Text style={styles.sectionTitle}>Chức năng quản lý</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.85}
            >
              <Animated.View style={{ transform: [{ scale: menuScales[i + 4] }] }}>
                <LinearGradient
                  colors={item.gradient}           // Dùng mảng trực tiếp → không lỗi
                  style={styles.menuGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.menuIconWrapper}>
                    <Ionicons name={item.icon} size={38} color="#FFFFFF" />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 28, fontWeight: FONT_WEIGHT.black, color: "#FFFFFF" },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: "#FFFFFF" },
  avatarText: { fontSize: 36, fontWeight: "900", color: "#FFFFFF" },

  scrollContent: { padding: SPACING.xl, paddingTop: SPACING.lg },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: SPACING.xxl },
  statCardWrapper: { width: isTablet ? "48%" : "48%", marginBottom: SPACING.lg },
  statCard: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: "center", ...SHADOWS.card },
  statIconWrapper: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.8)", justifyContent: "center", alignItems: "center", marginBottom: SPACING.md },
  statValue: { fontSize: 32, fontWeight: FONT_WEIGHT.black, color: COLORS.textPrimary },
  statLabel: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },

  sectionTitle: { fontSize: 22, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xl },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  menuItem: { width: isTablet ? "31%" : "48%", marginBottom: SPACING.xl },
  menuGradient: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: "center", height: 140, justifyContent: "center", ...SHADOWS.large },
  menuIconWrapper: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", marginBottom: SPACING.md },
  menuText: { fontSize: 15, fontWeight: FONT_WEIGHT.semibold, color: "#FFFFFF", textAlign: "center", lineHeight: 20 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
};