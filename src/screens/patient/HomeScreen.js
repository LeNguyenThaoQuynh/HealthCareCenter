import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";
import theme from "../../theme/theme";

const { SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } = theme;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("Bạn");

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        setDisplayName(profile?.full_name || profile?.name || user.email.split("@")[0]);
      }
    };
    fetch();
  }, []);

  const menu = [
    { title: "Đặt khám",       icon: "calendar-outline",    screen: "BookingOptionsScreen" },
    { title: "Lịch sử khám",   icon: "time-outline",        screen: "HistoryScreen" },
    { title: "Bệnh án",        icon: "document-text-outline", screen: "MedicalRecordScreen" },
    { title: "Hồ sơ",          icon: "person-outline",      screen: "ProfileScreen" },
    { title: "Theo dõi",       icon: "heart-outline",       screen: null },
    { title: "Hỗ trợ",         icon: "chatbubble-outline",  screen: null },
  ];

  const scales = useRef(menu.map(() => new Animated.Value(1))).current;

  const animatePress = (index) => {
    Animated.sequence([
      Animated.timing(scales[index], { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scales[index], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header xanh dương sạch */}
      <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
        <Text style={styles.greeting}>Xin chào,</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>Chăm sóc sức khỏe của bạn hôm nay</Text>
      </LinearGradient>

      {/* Info box nhẹ nhàng */}
      <TouchableOpacity style={styles.infoBox} onPress={() => navigation.navigate("HistoryScreen")}>
        <Ionicons name="notifications-outline" size={22} color="#2563EB" />
        <Text style={styles.infoText}>Bạn có lịch khám sắp tới</Text>
        <Ionicons name="chevron-forward" size={22} color="#2563EB" />
      </TouchableOpacity>

      {/* Grid menu – nhỏ gọn, chỉ 1 màu icon + nền trắng */}
      <View style={styles.grid}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuItem}
            onPress={() => {
              animatePress(i);
              item.screen && navigation.navigate(item.screen);
            }}
            disabled={!item.screen}
            activeOpacity={0.85}
          >
            <Animated.View style={[styles.itemInner, { transform: [{ scale: scales[i] }] }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={28} color="#2563EB" />
              </View>
              <Text style={styles.itemText}>{item.title}</Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tin tức – đơn giản, sạch */}
      <View style={styles.newsSection}>
        <Text style={styles.newsTitle}>Tin tức sức khỏe</Text>
        <TouchableOpacity style={styles.newsCard}>
          <Ionicons name="heart" size={26} color="#EF4444" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.newsHeadline}>10 mẹo giữ sức khỏe mùa đông</Text>
            <Text style={styles.newsDate}>18/11/2025</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    paddingTop: theme.headerPaddingTop || 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: { fontSize: 17, color: "#FFFFFFCC", fontWeight: "600" },
  name: { fontSize: 32, color: "#FFFFFF", fontWeight: "800", marginTop: 4 },
  subtitle: { fontSize: 15, color: "#FFFFFFE6", marginTop: 6 },

  infoBox: {
    marginHorizontal: SPACING.xl,
    marginTop: -28,
    backgroundColor: "#FFFFFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: "600", color: "#1E293B" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
  },
  menuItem: {
    width: "30%",
    marginBottom: SPACING.xl,
  },
  itemInner: {
    backgroundColor: "#FFFFFF",
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  itemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },

  newsSection: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl },
  newsTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: SPACING.md },
  newsCard: {
    backgroundColor: "#FFFFFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.card,
  },
  newsHeadline: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  newsDate: { fontSize: 13, color: "#64748B", marginTop: 4 },
});