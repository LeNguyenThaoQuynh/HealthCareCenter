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
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
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
                <Ionicons name={item.icon} size={28} color="#FFF" />
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
                <Ionicons name="chevron-forward" size={26} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
          <Text style={styles.noteText}>
            Thông tin của bạn được bảo mật 100% theo tiêu chuẩn HIPAA
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
    borderBottomRightRadius: BORDER_RADIUS.xxxl,
    ...SHADOWS.medium,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14.5,
    color: "rgba(255,255,255,0.95)",
    marginTop: 6,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl + 20,
  },
  card: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    minHeight: 96,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  textWrapper: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    marginTop: 4,
    lineHeight: 20,
  },
  rightSide: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    minWidth: 72,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#7C3AED",
    letterSpacing: 0.8,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.xxl,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    ...SHADOWS.small,
  },
  noteText: {
    marginLeft: SPACING.lg,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    flex: 1,
    lineHeight: 22,
  },
});
