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
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, SPACING, BORDER_RADIUS, SHADOWS } = theme;
const { width } = Dimensions.get("window");

export default function AdminHomeScreen() {
  const navigation = useNavigation();

  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
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

      Animated.parallel([
        Animated.stagger(
          100,
          scaleAnims.map((a) =>
            Animated.spring(a, {
              toValue: 1,
              friction: 8,
              tension: 100,
              useNativeDriver: true,
            })
          )
        ),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
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
          colors: ["#4F46E5", "#7C3AED"],
        },
        {
          title: "Quản lý dịch vụ",
          icon: "file-tray-full-outline",
          screen: "ManageServices",
          colors: ["#06B6D4", "#0EA5E9"],
        },
        {
          title: "Quản lý phòng khám",
          icon: "business-outline",
          screen: "ManageRoom",
          colors: ["#8B5CF6", "#A855F7"],
        },
        {
          title: "Quản lý thuốc",
          icon: "flask-outline",
          screen: "Medicines",
          colors: ["#EF4444", "#F87171"],
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
          colors: ["#10B981", "#34D399"],
        },
        {
          title: "Tạo khoa",
          icon: "folder-open-outline",
          screen: "CreateService",
          colors: ["#06B6D4", "#22D3EE"],
        },
        {
          title: "Hỗ trợ khách hàng",
          icon: "help-circle-outline",
          screen: "AdminSupport",
          colors: ["#F59E0B", "#FBBF24"],
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
          colors: ["#EC4899", "#F472B6"],
        },
        {
          title: "Bác sĩ nổi bật",
          icon: "star-outline",
          screen: "OutstandingDoctor",
          colors: ["#F59E0B", "#FCD34D"],
        },
      ],
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* ===== HEADER ===== */}
      <LinearGradient
        colors={["#4F46E5", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <View style={styles.avatarContainer}>
              <Ionicons name="shield-checkmark" size={28} color="#FFF" />
            </View>
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>Xin chào, Admin!</Text>
              <Text style={styles.subtitle}>Trung tâm điều khiển quản trị</Text>
            </View>
          </View>
         
        </View>
      </LinearGradient>

      {/* ===== BODY ===== */}
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }] 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== STATS ===== */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Tổng quan hệ thống</Text>
          <View style={styles.statsRow}>
            {[
              {
                label: "Bác sĩ",
                value: stats.doctors,
                icon: "medkit",
                color: "#4F46E5",
              },
              {
                label: "Bệnh nhân",
                value: stats.patients,
                icon: "people",
                color: "#EC4899",
              },
              {
                label: "Lịch khám",
                value: stats.appointments,
                icon: "calendar",
                color: "#10B981",
              },
            ].map((item, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.statBox,
                  { 
                    transform: [{ scale: scaleAnims[i] }],
                    opacity: fadeAnim 
                  },
                ]}
              >
                <LinearGradient
                  colors={[item.color + "20", item.color + "10"]}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.statIconContainer, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ===== MENU GROUPS ===== */}
        <View style={styles.menuContainer}>
          {menuGroups.map((group, gi) => (
            <View key={gi} style={styles.menuGroup}>
              <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                  <Ionicons 
                    name={gi === 0 ? "build" : gi === 1 ? "add-circle" : "stats-chart"} 
                    size={20} 
                    color="#4F46E5" 
                  />
                </View>
                <Text style={styles.sectionTitle}>{group.title}</Text>
              </View>

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
                        opacity: fadeAnim,
                      }}
                    >
                      <LinearGradient
                        colors={item.colors}
                        style={styles.menuGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.menuIconContainer}>
                          <Ionicons name={item.icon} size={28} color="#FFF" />
                        </View>
                        <Text style={styles.menuText} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* ===== LOGOUT ===== */}
        <Animated.View 
          style={[
            styles.logoutContainer,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnims[18] }] 
            }
          ]}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#FEE2E2", "#FECACA"]}
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.logoutIconContainer}>
                <Ionicons name="log-out" size={20} color="#DC2626" />
              </View>
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ===== FOOTER ===== */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Phiên bản 1.0.0</Text>
          <Text style={styles.footerCopyright}>© 2024 HealthCare System</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/* ====================== STYLES ====================== */
const styles = {
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" 
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  greetingText: {
    gap: 2,
  },
  greeting: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#FFF" 
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  content: { 
    padding: 24,
    paddingBottom: 40,
  },

  statsContainer: {
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 20,
  },
  statsRow: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  statBox: { 
    width: (width - 72) / 3,
  },
  statGradient: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.5)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  statLabel: { 
    fontSize: 13, 
    color: "#64748B",
    fontWeight: "600",
  },

  menuContainer: {
    marginBottom: 32,
  },
  menuGroup: {
    marginBottom: 32,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuBtn: { 
    width: "48%", 
    marginBottom: 16 
  },
  menuGradient: {
    height: 120,
    borderRadius: 24,
    padding: 20,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 15,
    color: "#FFF",
    fontWeight: "700",
    lineHeight: 20,
  },

  logoutContainer: {
    marginBottom: 24,
  },
  logoutButton: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#DC2626",
  },

  footer: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.5)",
  },
  footerText: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 12,
    color: "#CBD5E1",
  },
};