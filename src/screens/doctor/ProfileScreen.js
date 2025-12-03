import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS } = theme;
const fetchDoctorProfile = async (userId) => {
  const { data: doctorData, error: doctorError } = await supabase
    .from("doctors")
    .select(`
      id,
      name,
      avatar_url,
      specialization,
      experience_years,
      room_number,
      department_name,
      service_id,
      services:service_id (
        id,
        name,
        department,
        price,
        duration_minutes,
        service_type
      )
    `)
    .eq("id", userId)
    .single();

  if (doctorError) throw doctorError;

  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email || "Chưa có email";
  const phone = user?.user_metadata?.phone || "Chưa có số điện thoại";

  return {
    ...doctorData,
    email,
    phone,
  };
};

/* ============================================================
   PROFILE SCREEN
============================================================ */
export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy người dùng");

      const data = await fetchDoctorProfile(user.id);
      setProfile(data);

    } catch (err) {
      Alert.alert("Lỗi", err.message || "Không thể tải hồ sơ bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Đang tải hồ sơ bác sĩ...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.center}>
        <Ionicons name="person-outline" size={80} color={COLORS.textLight} />
        <Text style={s.errorText}>Không tìm thấy hồ sơ bác sĩ</Text>
      </View>
    );
  }

  const avatarUri = profile.avatar_url;
  const service = profile.services;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      
      {/* HEADER */}
      <LinearGradient
        colors={GRADIENTS.header}
        style={{
          paddingTop: Platform.OS === "android" ? 80 : 60,
          paddingBottom: SPACING.xxl,
        }}
      >
        {/* NÚT BACK */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            position: "absolute",
            top: Platform.OS === "android" ? 40 : 60,
            left: 20,
            zIndex: 50,
            backgroundColor: "rgba(255,255,255,0.2)",
            padding: 10,
            borderRadius: 50,
          }}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>

          {/* Avatar */}
          <View style={s.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatar} resizeMode="cover" />
            ) : (
              <View style={s.defaultAvatar}>
                <Ionicons name="person" size={60} color="#fff" />
              </View>
            )}
          </View>

          <Text style={s.doctorName}>BS. {profile.name}</Text>
          <Text style={s.specialization}>{profile.specialization || "Chưa cập nhật"}</Text>

          {profile.department_name && (
            <Text style={s.department}>{profile.department_name}</Text>
          )}
        </View>
      </LinearGradient>

      {/* BODY */}
      <View style={s.content}>

        {/* CHUYÊN MÔN */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Thông tin chuyên môn</Text>

          <InfoRow icon="medkit" label="Chuyên khoa" value={profile.specialization} />
          <InfoRow icon="briefcase" label="Kinh nghiệm" value={`${profile.experience_years || 0} năm`} />
          <InfoRow icon="business" label="Phòng khám" value={profile.room_number || "Chưa có phòng"} />

          {/* SERVICE NAME */}
          <InfoRow icon="apps" label="Dịch vụ" value={service?.name || "Chưa có dịch vụ"} />
          <InfoRow icon="pricetag" label="Giá dịch vụ" value={service?.price ? `${service.price} VND` : "Không có"} />

          {profile.bio && (
            <View style={s.bioContainer}>
              <Text style={s.bioLabel}>Giới thiệu</Text>
              <Text style={s.bio}>{profile.bio}</Text>
            </View>
          )}
        </View>

        {/* LIÊN HỆ */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Thông tin liên hệ</Text>
          <InfoRow icon="mail" label="Email" value={profile.email} />
          <InfoRow icon="call" label="Điện thoại" value={profile.phone} />
        </View>

        {/* EDIT */}
        <TouchableOpacity
          onPress={() => navigation.navigate("EditDoctorProfile")}
          style={s.editBtn}
        >
          <LinearGradient colors={GRADIENTS.primaryButton} style={s.editGradient}>
            <Ionicons name="create" size={24} color="#FFF" />
            <Text style={s.editText}>Chỉnh sửa hồ sơ</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => {
            Alert.alert("Đăng xuất", "Bạn chắc chắn muốn đăng xuất?", [
              { text: "Hủy", style: "cancel" },
              {
                text: "Đăng xuất",
                style: "destructive",
                onPress: async () => {
                  await supabase.auth.signOut();
                  navigation.replace("Login");
                },
              },
            ]);
          }}
        >
          <LinearGradient colors={["#DC2626", "#EF4444"]} style={s.logoutGradient}>
            <Ionicons name="log-out" size={26} color="#FFF" />
            <Text style={s.logoutText}>Đăng xuất</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </View>
    </ScrollView>
  );
}

/* ============================================================
   COMPONENT: ROW ITEM
============================================================ */
const InfoRow = ({ icon, label, value }) => (
  <View style={s.infoRow}>
    <Ionicons name={icon} size={28} color={COLORS.primary} />
    <View style={s.infoText}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  </View>
);

/* ============================================================
   STYLE
============================================================ */
const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  loadingText: { marginTop: 16, fontSize: 17, color: COLORS.textSecondary },
  errorText: { marginTop: 16, fontSize: 18, color: COLORS.textPrimary },

  avatarContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#fff",
    padding: 6,
    ...SHADOWS.large,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 59 },
  defaultAvatar: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 59,
    justifyContent: "center",
    alignItems: "center",
  },

  doctorName: { fontSize: 32, fontWeight: "900", color: "#fff", marginTop: 20 },
  specialization: { fontSize: 20, color: "#fff", marginTop: 6, fontWeight: "600" },
  department: { fontSize: 17, color: "#fff", marginTop: 4 },

  content: { marginTop: -40, paddingHorizontal: SPACING.xl },
  card: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },

  cardTitle: { fontSize: 20, fontWeight: "800", marginBottom: SPACING.lg },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  infoText: { marginLeft: SPACING.xl, flex: 1 },
  label: { fontSize: 15, color: COLORS.textLight },
  value: { fontSize: 17, fontWeight: "600", color: COLORS.textPrimary },

  bioContainer: { marginTop: SPACING.lg, paddingTop: SPACING.lg, borderTopWidth: 1, borderColor: "#F1F5F9" },
  bioLabel: { fontSize: 15, color: COLORS.textLight },
  bio: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 24 },

  editBtn: { marginTop: SPACING.xl },
  editGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.xl,
  },
  editText: { fontSize: 18, fontWeight: "bold", color: "#FFF" },

  logoutBtn: { marginTop: SPACING.lg },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.xl,
  },
  logoutText: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
});
