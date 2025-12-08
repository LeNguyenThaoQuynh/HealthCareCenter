import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOWS } =
  theme;

export default function BookingOptionsScreen() {
  const navigation = useNavigation();

  const options = [
    {
      title: "Theo Bác sĩ",
      subtitle: "Chọn bác sĩ bạn muốn khám",
      icon: "person-outline",
      screen: "BookByDoctor",
      gradient: ["#7C3AED", "#A78BFA"],
      badge: "PHỔ BIẾN",
    },
    {
      title: "Theo Ngày",
      subtitle: "Chọn ngày và khung giờ phù hợp",
      icon: "calendar-outline",
      screen: "BookByDate",
      gradient: GRADIENTS.primaryButton,
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("HomeScreen")}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Đặt lịch khám</Text>
          <Text style={styles.headerSubtitle}>
            Chọn cách đặt lịch phù hợp với bạn
          </Text>
        </View>

        <View style={{ width: 48 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => navigation.navigate(item.screen)}
          >
            <LinearGradient
              colors={item.gradient}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name={item.icon} size={26} color="#FFF" />
              </View>

              <View style={styles.textWrapper}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.rightSide}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Note bảo mật */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
          <Text style={styles.noteText}>
            Thông tin của bạn được bảo mật 100%
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // === HEADER ===
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
    marginLeft: -44, // cân bằng với backBtn
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: FONT_WEIGHT.bold,
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  // === NỘI DUNG ===
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },

  card: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: 88,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  textWrapper: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17.5,
    fontWeight: FONT_WEIGHT.semibold,
    color: "#FFF",
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.9)",
    marginTop: 3,
  },
  rightSide: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#7C3AED",
  },

  // === NOTE ===
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  noteText: {
    marginLeft: SPACING.md,
    fontSize: 14.5,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
    flex: 1,
  },
});
