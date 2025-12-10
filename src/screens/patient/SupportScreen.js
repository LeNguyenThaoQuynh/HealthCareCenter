import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../theme/theme";

const { SPACING, BORDER_RADIUS, SHADOWS } = theme;

export default function SupportScreen({ navigation }) {
  const supportOptions = [
    {
      title: "Gọi Hotline",
      subtitle: "0854 776 885 (24/7)",
      icon: "call-outline",
      color: "#10B981",
      action: () => Linking.openURL("tel:0854776885"),
    },
    {
      title: "Chat Zalo",
      subtitle: "Nhắn tin ngay với nhân viên hỗ trợ",
      icon: "chatbubbles-outline",
      color: "#0D6EFD",
      action: () => Linking.openURL("https://zalo.me/0977502553"),
    },
    {
      title: "Gửi Email",
      subtitle: "phuocanh554@gmail.com",
      icon: "mail-outline",
      color: "#F59E0B",
      action: () => Linking.openURL("mailto:phuocanh554@gmail.com"),
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.hero}>
          <Image
            source={require("../../../assets/images/support-illustration.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Chúng tôi luôn ở đây để giúp bạn</Text>
          <Text style={styles.heroDesc}>
            Liên hệ ngay khi cần hỗ trợ – 24/7
          </Text>
        </View>

        <View style={styles.list}>
          {supportOptions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={item.action}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Ionicons name={item.icon} size={32} color={item.color} />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={26} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Trụ sở chính</Text>
          <Text style={styles.footerText}>
            1358/28/41 phường 14 Quang Trung, Gò Vấp, TP.HCM
          </Text>
          <Text style={styles.footerText}>Email: phuocanh554@gmail.com</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFF" },

  hero: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },
  heroImage: { width: 200, height: 160, marginBottom: SPACING.lg },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
  },
  heroDesc: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },

  list: { paddingHorizontal: SPACING.xl },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { flex: 1, marginLeft: SPACING.lg },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B" },
  cardSubtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },

  footer: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
  },
  footerTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  footerText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
});
