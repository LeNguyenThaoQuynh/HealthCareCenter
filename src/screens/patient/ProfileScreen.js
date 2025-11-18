import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";
import { useUserStore } from "../../store/useUserStore";
import { formatDate, formatGender } from "../../utils/formatters";
import theme from "../../theme/theme";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
} = theme;

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { clearUser } = useUserStore();
  const navigation = useNavigation();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy người dùng.");
      const data = await getUserProfile(user.id);
      setProfile(data);
    } catch (err) {
      Alert.alert("Lỗi", err.message || "Không thể tải hồ sơ.", [
        { text: "Thử lại", onPress: fetchProfile },
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { fetchProfile(); }, []));

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy" },
      { text: "Đăng xuất", style: "destructive", onPress: performLogout },
    ]);
  };

  const performLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      clearUser();
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      }); // ĐÃ SỬA: thêm dấu ] và đóng ngoặc đúng
    } catch (err) {
      Alert.alert("Lỗi", err.message || "Không thể đăng xuất.");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Không tìm thấy hồ sơ.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <LinearGradient colors={GRADIENTS.primaryButton} style={styles.retryGradient}>
            <Text style={styles.retryText}>Thử lại</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Hồ sơ cá nhân</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <Animated.View entering={ZoomIn.duration(600)}>
            <View style={styles.avatarWrapper}>
              <LinearGradient colors={["#E0E7FF", "#C7D2FE"]} style={styles.avatarBg}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.initials}>
                    <Text style={styles.initialsText}>{getInitials(profile.name)}</Text>
                  </View>
                )}
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(300)} style={styles.name}>
            {profile.name}
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInUp.delay(500)} style={styles.card}>
          <InfoRow icon="mail-outline" label="Email" value={profile.email} />
          {profile.phone && <InfoRow icon="call-outline" label="Điện thoại" value={profile.phone} />}
          <InfoRow icon="person-outline" label="Giới tính" value={formatGender(profile.gender)} />
          <InfoRow icon="calendar-outline" label="Ngày sinh" value={formatDate(profile.date_of_birth)} />

          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditProfile")}>
            <LinearGradient colors={GRADIENTS.primaryButton} style={styles.editGradient}>
              <Ionicons name="create-outline" size={22} color="#FFF" />
              <Text style={styles.editText}>Chỉnh sửa hồ sơ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
          <LinearGradient colors={["#DC2626", "#EF4444"]} style={styles.logoutGradient}>
            {loggingOut ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={24} color="#FFF" />
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={26} color={COLORS.primary} />
    <View style={styles.infoText}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 24,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: FONT_WEIGHT.bold, color: "#FFF" },

  scroll: { padding: SPACING.xl, paddingTop: SPACING.xl },

  avatarSection: { alignItems: "center", marginBottom: SPACING.xxxl },
  avatarWrapper: { position: "relative" },
  avatarBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FFF",
    ...SHADOWS.card,
  },
  avatar: { width: 120, height: 120 },
  initials: { width: 120, height: 120, justifyContent: "center", alignItems: "center" },
  initialsText: { fontSize: 44, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },

  name: { fontSize: 26, fontWeight: FONT_WEIGHT.black, color: COLORS.textPrimary, marginTop: SPACING.lg },

  card: {
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.lg },
  infoText: { marginLeft: SPACING.xl, flex: 1 },
  label: { fontSize: 15, color: COLORS.textSecondary },
  value: { fontSize: 18, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary, marginTop: 4 },

  editBtn: { marginTop: SPACING.xl },
  editGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: BORDER_RADIUS.lg,
    gap: 10,
  },
  editText: { fontSize: 17, fontWeight: FONT_WEIGHT.semibold, color: "#FFF" },

  logoutBtn: { marginTop: SPACING.xxl },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    gap: 12,
  },
  logoutText: { fontSize: 18, fontWeight: FONT_WEIGHT.semibold, color: "#FFF" },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: FONT_SIZE.lg, color: COLORS.textPrimary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  error: { fontSize: 18, color: COLORS.danger, marginBottom: SPACING.xl },
  retryBtn: { borderRadius: BORDER_RADIUS.lg, overflow: "hidden" },
  retryGradient: { paddingVertical: 14, paddingHorizontal: 40 },
  retryText: { fontSize: 17, fontWeight: FONT_WEIGHT.semibold, color: "#FFF" },
});