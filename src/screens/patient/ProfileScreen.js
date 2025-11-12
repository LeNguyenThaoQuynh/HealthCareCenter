// src/screens/patient/ProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ImageBackground,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInUp,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

// API
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";
import { useUserStore } from "../../store/useUserStore";

// Utils
import { formatDate, formatGender, formatRole } from "../../utils/formatters";

// === MÀU CHỦ ĐẠO TỪ HomeScreen ===
const Colors = {
  primary: "#1D4ED8",
  secondary: "#38BDF8",
  cardBg: "#FFFFFF",
  iconBgStart: "#E0F2FE",
  iconBgEnd: "#BFDBFE",
  textPrimary: "#1E293B",
  textSecondary: "#4B5563",
  border: "#F1F5F9",
  shadow: "#000",
  danger: "#f55d5dff",
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Không tìm thấy người dùng.");

      const profileData = await getUserProfile(user.id);
      setProfile({ ...profileData, email: user.email });
    } catch (error) {
      console.error("Lỗi khi tải hồ sơ:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải hồ sơ.", [
        { text: "Thử lại", onPress: fetchProfile },
        { text: "OK", style: "cancel" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };
  const performLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearUser();
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      Alert.alert("Lỗi", error.message || "Không thể đăng xuất.");
    } finally {
      setLoggingOut(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  // NÚT BACK VỀ HOME
  const goBackHome = () => {
    navigation.navigate("HomeScreen");
  };

  if (loading) {
    return (
      <View style={styles.loadingBg}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy hồ sơ.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.retryGradient}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../../assets/images/profile bg-pattern.png")}
      style={styles.background}
      blurRadius={8}
    >
      <LinearGradient
        colors={[Colors.primary + "CC", Colors.secondary + "B3"]}
        style={styles.overlay}
      >
        {/* NÚT BACK + HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBackHome}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Hồ sơ cá nhân</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* AVATAR + TÊN */}
          <Animated.View
            entering={FadeInDown.duration(800)}
            style={styles.header}
          >
            <Animated.View
              entering={ZoomIn.duration(600)}
              style={styles.avatarContainer}
            >
              <LinearGradient
                colors={[Colors.iconBgStart, Colors.iconBgEnd]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>
                    {getInitials(profile.name)}
                  </Text>
                </View>
              </LinearGradient>
              <View style={styles.avatarRing} />
            </Animated.View>

            <Animated.Text
              entering={FadeInUp.delay(300).duration(600)}
              style={styles.name}
            >
              {profile.name}
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(400).duration(600)}
              style={styles.role}
            >
              {formatRole(profile.role)}
            </Animated.Text>
          </Animated.View>

          {/* CARD THÔNG TIN */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(800)}
            style={styles.card}
          >
            <View style={styles.cardInner}>
              <View style={styles.infoContainer}>
                <InfoItem
                  icon="email"
                  label="Email"
                  value={profile.email}
                  delay={100}
                />
                {profile.phone && (
                  <InfoItem
                    icon="phone"
                    label="Số điện thoại"
                    value={profile.phone}
                    delay={200}
                  />
                )}
                <InfoItem
                  icon="human-male-female"
                  label="Giới tính"
                  value={formatGender(profile.gender)}
                  delay={300}
                />
                <InfoItem
                  icon="cake"
                  label="Ngày sinh"
                  value={formatDate(profile.date_of_birth)}
                  delay={400}
                />
                <InfoItem
                  icon="shield-account"
                  label="Vai trò"
                  value={formatRole(profile.role)}
                  delay={500}
                />
              </View>

              {/* NÚT CHỈNH SỬA */}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditProfile")}
                activeOpacity={0.8}
                disabled={loggingOut}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.editButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={22}
                    color="#FFF"
                  />
                  <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* NÚT ĐĂNG XUẤT */}
          <Animated.View
            entering={FadeInUp.delay(800).duration(800)}
            style={styles.logoutContainer}
          >
            <TouchableOpacity
              style={styles.logoutButtonMain}
              onPress={handleLogout}
              activeOpacity={0.8}
              disabled={loggingOut}
            >
              <LinearGradient
                colors={["#DC2626", "#EF4444"]}
                style={styles.logoutButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="logout"
                      size={22}
                      color="#FFF"
                    />
                    <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

// === INFO ITEM ===
const InfoItem = ({ icon, label, value, delay }) => (
  <Animated.View
    entering={FadeInUp.delay(delay).duration(500)}
    style={styles.infoItem}
  >
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name={icon} size={26} color={Colors.primary} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  </Animated.View>
);

// === STYLES ===
const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, paddingTop: Platform.OS === "ios" ? 60 : 40 },

  // Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // SCROLL CONTAINER
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30, // Padding để scroll được thoải mái
  },
  // Loading - SỬA ĐỔI
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },

  // Header
  header: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  avatarContainer: { position: "relative", marginBottom: 20 },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  avatarText: { fontSize: 40, fontWeight: "900", color: Colors.primary },
  avatarRing: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 68,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  role: { fontSize: 17, color: "#E5E7EB", marginTop: 4, fontWeight: "600" },

  // Card
  card: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardInner: { backgroundColor: Colors.cardBg, padding: 24 },

  // Info
  infoContainer: { marginBottom: 24 },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.iconBgStart,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoText: { flex: 1 },
  label: { fontSize: 14, color: Colors.textSecondary, fontWeight: "600" },
  value: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: "700",
    marginTop: 4,
  },

  // Button
  editButton: {
    borderRadius: 18,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  editButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 10,
  },

  logoutContainer: {
    marginHorizontal: 24,
    marginTop: 20,
    alignItems: "center",
  },
  logoutButtonMain: {
    borderRadius: 18,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    width: "80%",
  },
  logoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 10,
  },
  // Retry
  retryButton: { borderRadius: 16, overflow: "hidden" },
  retryGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  retryButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
