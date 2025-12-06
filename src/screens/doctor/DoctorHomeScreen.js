import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOWS,
  GRADIENTS,
} from "../../theme/theme";

export default function DoctorHomeScreen() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("Bác sĩ");

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        setDisplayName(
          profile?.full_name ||
            profile?.name ||
            user.email.split("@")[0] ||
            "Bác sĩ"
        );
      }
    };
    fetchProfile();
  }, []);

  const menu = [
    {
      title: "Lịch làm việc",
      icon: "calendar-outline",
      screen: "DoctorAppointments",
      subtitle: "Xem lịch hôm nay",
    },
    {
      title: "Hồ sơ cá nhân",
      icon: "person-outline",
      screen: "DoctorProfile",
      subtitle: "Thông tin & chứng chỉ",
    },
    {
      title: "Bệnh nhân",
      icon: "people-outline",
      screen: "PatientList",
      subtitle: "Quản lý hồ sơ",
    },
    {
      title: "Thống kê",
      icon: "bar-chart-outline",
      screen: "PatientStatistics",
      subtitle: "Doanh thu & hiệu suất",
    },
  ];

  const scales = useRef(menu.map(() => new Animated.Value(1))).current;

  const animatePress = (index) => {
    Animated.sequence([
      Animated.timing(scales[index], {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scales[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER – ĐẸP, KHÔNG BỊ ĐÈ */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.subtitle}>
            Chúc bạn một ngày làm việc hiệu quả!
          </Text>
        </View>
        <Ionicons
          name="heart-outline"
          size={110}
          color="#ffffff20"
          style={styles.decorIcon}
        />
      </LinearGradient>

      {/* MENU GRID – NHỎ LẠI + KHÔNG ĐÈ LÊN HEADER */}
      <View style={styles.menuGrid}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={1}
            onPress={() => {
              animatePress(i);
              navigation.navigate(item.screen);
            }}
            style={styles.menuButton}
          >
            <Animated.View
              style={[styles.menuCard, { transform: [{ scale: scales[i] }] }]}
            >
              <LinearGradient
                colors={i % 2 === 0 ? GRADIENTS.appointment : GRADIENTS.health}
                style={styles.iconCircle}
              >
                <Ionicons
                  name={item.icon}
                  size={30}
                  color={COLORS.textOnPrimary}
                />
              </LinearGradient>

              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {/* THÔNG BÁO NHẸ NHÀNG */}
      <View style={styles.notificationCard}>
        <Ionicons
          name="notifications-outline"
          size={20}
          color={COLORS.accentTeal}
        />
        <Text style={styles.notificationText}>
          Bạn có 3 bệnh nhân đang chờ khám
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header không bị đè
  header: {
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl, // giảm bớt để không tràn quá
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
    overflow: "hidden",
  },

  headerContent: { zIndex: 2 },

  greeting: {
    fontSize: FONT_SIZE.lg,
    color: "#ffffffd0",
    fontWeight: FONT_WEIGHT.medium,
  },

  name: {
    fontSize: 34,
    color: COLORS.textOnPrimary,
    fontWeight: "800",
    marginTop: 4,
  },

  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: "#ffffffc0",
    marginTop: 8,
    fontWeight: FONT_WEIGHT.medium,
  },

  decorIcon: {
    position: "absolute",
    right: -20,
    top: 60,
    opacity: 0.2,
  },

  // ĐÃ SỬA: KHÔNG DÙNG marginTop âm → KHÔNG ĐÈ HEADER NỮA
  menuGrid: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl, // CHỈ DÙNG marginTop dương
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  menuButton: {
    width: "48%",
    marginBottom: SPACING.lg,
  },

  // CARD NHỎ LẠI, GỌN GÀNG HƠN
  menuCard: {
    backgroundColor: COLORS.surface,
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#e5e7eb15",
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },

  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: "#ECFEFF",
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accentCyan,
  },

  notificationText: {
    marginLeft: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.accentCyan,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
