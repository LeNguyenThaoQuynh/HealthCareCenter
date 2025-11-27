import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
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

export default function AdminHomeScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({ doctors: 0, patients: 0, users: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);

  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(Array.from({ length: 12 }, () => new Animated.Value(0.9))).current;

  const fetchStats = async () => {
    try {
      const [
        { count: doctors },
        { count: patients },
        { count: users },
        { count: appointments },
      ] = await Promise.all([
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("user_profiles").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).neq("status", "cancelled"),
      ]);

      setStats({ doctors: doctors || 0, patients: patients || 0, users: users || 0, appointments: appointments || 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      Animated.stagger(
        80,
        scaleAnims.map(anim =>
          Animated.spring(anim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true })
        )
      ).start();
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const menuItems = [
    { title: "Quản lý bác sĩ",     icon: "medkit-outline",     screen: "ManageDoctors",       colors: ["#3B82F6", "#1D4ED8"] },
    { title: "Tạo bác sĩ",         icon: "person-add-outline", screen: "CreateDoctorAccount",   colors: ["#10B981", "#059669"] },
        { title: "thống kê doanh thu ",         icon: "area-chart", screen: "",   colors: ["#10B981", "#059669"] },
        { title: "thống kê số lượng bệnh nhân",         icon: "person-add-outline", screen: "",   colors: ["#10B981", "#059669"] },
        { title: "bác sĩ ưa thích ",         icon: "person-add-outline", screen: "",   colors: ["#10B981", "#059669"] },
        { title: "tạo khoa ",         icon: "person-add-outline", screen: "",   colors: ["#10B981", "#059669"] },
        { title: "thống kê doanh thu ",         icon: "person-add-outline", screen: "",   colors: ["#10B981", "#059669"] },

    
  ];

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER NHỎ GỌN */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Xin chào, Admin!</Text>
            <Text style={styles.subtitle}>Hôm nay bạn muốn làm gì?</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        opacity={fadeAnim}
      >
        {/* THỐNG KÊ NHỎ GỌN */}
        <View style={styles.statsRow}>
          {[
            { label: "Bác sĩ", value: stats.doctors, icon: "medkit-outline", color: "#3B82F6" },
            { label: "Bệnh nhân", value: stats.patients, icon: "people-outline", color: "#EC4899" },
            { label: "Lịch khám", value: stats.appointments, icon: "calendar-outline", color: "#10B981" },
          ].map((item, i) => (
            <Animated.View key={i} style={[styles.statBox, { transform: [{ scale: scaleAnims[i] }] }]}>
              <View style={styles.statInner}>
                <Ionicons name={item.icon} size={24} color={item.color} />
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* MENU CHÍNH */}
        <Text style={styles.sectionTitle}>Chức năng chính</Text>
        <View style={styles.grid}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuBtn}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.9}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnims[i + 3] }] }}>
                <LinearGradient colors={item.colors} style={styles.menuGradient}>
                  <Ionicons name={item.icon} size={32} color="#FFF" />
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

// STYLE NHỎ GỌN – ĐẸP – HOÀN HẢO CHO ĐIỆN THOẠI
const styles = {
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 24, fontWeight: "bold", color: "#FFF" },
  subtitle: { fontSize: 15, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "900", color: "#FFF" },

  content: { padding: SPACING.xl },

  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.xl },
  statBox: { flex: 1, marginHorizontal: 6 },
  statInner: {
    backgroundColor: "#FFFFFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    ...SHADOWS.card,
  },
  statValue: { fontSize: 24, fontWeight: "bold", color: COLORS.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

  sectionTitle: { fontSize: 19, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: SPACING.lg },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  menuBtn: { width: "45%", marginBottom: SPACING.lg },
  menuGradient: {
    borderRadius: BORDER_RADIUS.xl,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.large,
  },
  menuText: { marginTop: 12, fontSize: 14, fontWeight: "400", color: "#FFF", textAlign: "center" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
};