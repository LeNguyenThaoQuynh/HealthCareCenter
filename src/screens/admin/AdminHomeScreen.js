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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, SPACING, BORDER_RADIUS, SHADOWS } = theme;

export default function AdminHomeScreen() {
  const navigation = useNavigation();

  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.9))
  ).current;

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({
            index: 0,
            routes: [{ name: "Auth" }],
          });
        },
      },
    ]);
  };

  /* ================= STATS ================= */
  const fetchStats = async () => {
    try {
      const [{ count: doctors }, { count: patients }, { count: appointments }] =
        await Promise.all([
          supabase.from("doctors").select("*", { count: "exact", head: true }),
          supabase.from("patients").select("*", { count: "exact", head: true }),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .neq("status", "cancelled"),
        ]);

      setStats({
        doctors: doctors || 0,
        patients: patients || 0,
        appointments: appointments || 0,
      });
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);

      Animated.stagger(
        80,
        scaleAnims.map((a) =>
          Animated.spring(a, {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          })
        )
      ).start();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  /* ================= MENU GROUPS ================= */
  const menuGroups = [
    {
      title: "Quản lý",
      data: [
        {
          title: "Quản lý bác sĩ",
          icon: "medkit-outline",
          screen: "ManageDoctors",
          colors: ["#3B82F6", "#1D4ED8"],
        },
        {
          title: "Quản lý dịch vụ",
          icon: "file-tray-full-outline",
          screen: "ManageServices",
          colors: ["#06B6D4", "#0E7490"],
        },
        {
          title: "Quản lý phòng khám",
          icon: "business-outline",
          screen: "ManageRoom",
          colors: ["#8B5CF6", "#7C3AED"],
        },
        {
          title: "Quản lý thuốc",
          icon: "flask-outline",
          screen: "Medicines",
          colors: ["#EF4444", "#B91C1C"],
        },
      ],
    },
    {
      title: "Tạo mới",
      data: [
        {
          title: "Tạo bác sĩ",
          icon: "person-add-outline",
          screen: "CreateDoctorAccount",
          colors: ["#10B981", "#059669"],
        },
        {
          title: "Tạo khoa",
          icon: "folder-open-outline",
          screen: "CreateService",
          colors: ["#06B6D4", "#0891B2"],
        },
        {
          title: "hỗ trợ khách hàng",
          icon: "help-circle-outline",
          screen: "AdminSupport",
          colors: ["#EF4444", "#B91C1C"],
        },
      ],
    },
    {
      title: "Thống kê",
      data: [
        {
          title: "Thống kê doanh thu",
          icon: "bar-chart-outline",
          screen: "RevenueStats",
          colors: ["#F59E0B", "#D97706"],
        },
        {
          title: "Bác sĩ nổi bật",
          icon: "star-outline",
          screen: "OutstandingDoctor",
          colors: ["#EC4899", "#DB2777"],
        },
      ],
    },
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

      {/* ===== HEADER ===== */}
      <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.header}>
        <Text style={styles.greeting}>Xin chào, Admin!</Text>
        <Text style={styles.subtitle}>Hôm nay bạn muốn làm gì?</Text>
      </LinearGradient>

      {/* ===== BODY ===== */}
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== STATS ===== */}
        <View style={styles.statsRow}>
          {[
            {
              label: "Bác sĩ",
              value: stats.doctors,
              icon: "medkit-outline",
              color: "#3B82F6",
            },
            {
              label: "Bệnh nhân",
              value: stats.patients,
              icon: "people-outline",
              color: "#EC4899",
            },
            {
              label: "Lịch khám",
              value: stats.appointments,
              icon: "calendar-outline",
              color: "#10B981",
            },
          ].map((item, i) => (
            <Animated.View
              key={i}
              style={[
                styles.statBox,
                { transform: [{ scale: scaleAnims[i] }] },
              ]}
            >
              <View style={styles.statInner}>
                <Ionicons name={item.icon} size={22} color={item.color} />
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* ===== MENU GROUPS ===== */}
        {menuGroups.map((group, gi) => (
          <View key={gi} style={{ marginBottom: SPACING.xl }}>
            <Text style={styles.sectionTitle}>{group.title}</Text>

            <View style={styles.grid}>
              {group.data.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuBtn}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: scaleAnims[i + gi * 4 + 3] }],
                    }}
                  >
                    <LinearGradient
                      colors={item.colors}
                      style={styles.menuGradient}
                    >
                      <Ionicons name={item.icon} size={28} color="#FFF" />
                      <Text style={styles.menuText}>{item.title}</Text>
                    </LinearGradient>
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ===== LOGOUT (OUTSIDE) ===== */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/* ====================== STYLES ====================== */
const styles = {
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  greeting: { fontSize: 24, fontWeight: "700", color: "#FFF" },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  content: { padding: SPACING.xl },

  /* STATS */
  statsRow: { flexDirection: "row", marginBottom: SPACING.xl },
  statBox: { flex: 1, marginHorizontal: 6 },
  statInner: {
    backgroundColor: "#FFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    ...SHADOWS.card,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
    color: COLORS.textPrimary,
  },
  statLabel: { fontSize: 13, color: COLORS.textSecondary },

  /* MENU */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: SPACING.lg,
    color: COLORS.textPrimary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuBtn: { width: "47%", marginBottom: SPACING.lg },
  menuGradient: {
    height: 100,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.floating,
  },
  menuText: {
    marginTop: 8,
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    textAlign: "center",
  },

  /* LOGOUT */
  logoutContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
};
