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
// Import các hàm tiện ích nếu cần (như formatters), nhưng giữ lại logic Doctor
// Ví dụ: import { formatGender, formatDate } from "../../utils/formatters"; 

// --- Theme Imports ---
const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  FONT_SIZE,
  FONT_WEIGHT,
} = theme;

// Hàm kiểm tra và lấy hồ sơ bác sĩ
const fetchDoctorProfile = async (userId) => {
  const { data, error } = await supabase
    .from("doctors")
    .select(
      `
      *,
      departments!department_id (name) 
      `
    )
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState("Đang tải...");
  const navigation = useNavigation();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Không tìm thấy người dùng.");
      }

      // Lấy profile từ bảng doctors
      const data = await fetchDoctorProfile(user.id);
      
      setProfile(data);
      setDepartmentName(data.departments?.name || "Chưa xác định");

      // LOG: KIỂM TRA DỮ LIỆU VÀ URL AVATAR
      console.log("--- DỮ LIỆU PROFILE DOCTOR ĐƯỢC TẢI ---");
      console.log("Profile Data:", data);
      const avatarUrl = data.avatar_url;
      console.log("Avatar URL (Kiểm tra thủ công):", avatarUrl || "Không có URL ảnh");

    } catch (err) {
      console.log("Lỗi tải hồ sơ:", err);
      Alert.alert("Lỗi", err.message || "Không thể tải hồ sơ bác sĩ.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
      // Thêm dependency nếu fetchProfile phụ thuộc vào bất cứ state/prop nào khác
    }, [])
  );
  
  // --- UI Loading/Error State ---
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.center}>
        <Text style={{ color: COLORS.textPrimary }}>Không tìm thấy hồ sơ bác sĩ.</Text>
        <TouchableOpacity style={s.retryBtn} onPress={fetchProfile}>
          <Text style={s.editText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- UI Profile Content ---
  const avatarUri = profile.avatar_url;
  
  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient 
        colors={GRADIENTS.header} 
        style={{ paddingTop: Platform.OS === 'android' ? 80 : 60, paddingBottom: SPACING.xl }}
      >
        <View style={{ alignItems: "center" }}>
          {/* Avatar Section */}
          <View style={s.avatarContainer}>
            {avatarUri ? (
              <Image 
                source={{ uri: avatarUri }} 
                style={s.avatar} 
                // LOG: BẮT LỖI KHI REACT NATIVE KHÔNG TẢI ĐƯỢC ẢNH
                onError={(e) => {
                    console.log("--- LỖI TẢI ẢNH (Image Component Error) ---");
                    console.log("URL:", avatarUri);
                    console.log("Lỗi chi tiết:", e.nativeEvent.error);
                }}
              />
            ) : (
              <View style={s.defaultAvatar}>
                <Ionicons name="person" size={56} color="#fff" />
              </View>
            )}
          </View>

          <Text style={s.nameHeader}>
            BS. {profile.name || "Bác sĩ"}
          </Text>
          <Text style={s.specializationHeader}>
            {profile.specialization || "Chuyên khoa chưa cập nhật"}
          </Text>
        </View>
      </LinearGradient>

      <View style={s.contentContainer}>
        {/* Thông tin chuyên môn Card */}
        <View style={s.card}>
          <Text style={s.title}>Thông tin chuyên môn</Text>

          <InfoRow icon="business-outline" label="Khoa" value={departmentName} />
          <InfoRow icon="medkit-outline" label="Chuyên môn" value={profile.specialization} />
          <InfoRow icon="time-outline" label="Kinh nghiệm" value={profile.experience_years ? `${profile.experience_years} năm` : null} />
          <InfoRow icon="home-outline" label="Phòng khám" value={profile.room_number} />
        </View>
        
        {/* Thông tin liên hệ cơ bản (Dựa trên Patient Profile) */}
        <View style={s.card}>
            <Text style={s.title}>Thông tin liên hệ</Text>
            <InfoRow icon="mail-outline" label="Email" value={profile.email} /> 
            {/* Giả định cột 'email' và 'phone' tồn tại hoặc được join vào Doctors */}
            {profile.phone && <InfoRow icon="call-outline" label="Điện thoại" value={profile.phone} />}
        </View>


        {/* Nút chỉnh sửa */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditDoctorProfile')} 
          style={s.editBtn}
        >
            <LinearGradient colors={GRADIENTS.primaryButton} style={s.editGradient}>
                <Ionicons name="create-outline" size={22} color="#FFF" />
                <Text style={s.editText}>Chỉnh sửa hồ sơ</Text>
            </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={s.logoutBtn} onPress={() => Alert.alert("Chưa cài đặt", "Chức năng đăng xuất chưa được thêm vào phiên bản này.")}>
          <LinearGradient colors={["#DC2626", "#EF4444"]} style={s.logoutGradient}>
            <Ionicons name="log-out-outline" size={24} color="#FFF" />
            <Text style={s.logoutText}>Đăng xuất</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxxl }} />
      </View>
    </ScrollView>
  );
}

// --- Component InfoRow Tương tự Patient Profile ---
const InfoRow = ({ icon, label, value }) => (
  <View style={s.infoRow}>
    <Ionicons name={icon} size={26} color={COLORS.primary} />
    <View style={s.infoText}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || "—"}</Text>
    </View>
  </View>
);

// --- Stylesheet ---
const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    padding: 4,
    ...SHADOWS.medium,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 51 },
  defaultAvatar: { 
    flex: 1, 
    backgroundColor: COLORS.primary + '60', 
    borderRadius: 51, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  nameHeader: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: '800', 
    color: '#fff', 
    marginTop: 16 
  },
  specializationHeader: { 
    fontSize: FONT_SIZE.lg, 
    color: '#fff', 
    opacity: 0.9, 
    marginTop: 4 
  },
  contentContainer: { marginTop: -30, paddingHorizontal: SPACING.xl },
  card: { 
    backgroundColor: COLORS.surface, 
    borderRadius: BORDER_RADIUS.xl, 
    padding: SPACING.xl, 
    marginBottom: SPACING.xl, 
    ...SHADOWS.card 
  },
  title: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: '800', 
    color: COLORS.textPrimary, 
    marginBottom: SPACING.md 
  },
  infoRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: SPACING.sm 
  },
  infoText: { 
    marginLeft: SPACING.xl, 
    flex: 1 
  },
  label: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textLight 
  },
  value: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: '600', 
    color: COLORS.textPrimary, 
    marginTop: 4 
  },
  editBtn: { 
    marginTop: SPACING.lg 
  },
  editGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    gap: 10,
  },
  editText: { 
    fontSize: 17, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: "#FFF" 
  },
  logoutBtn: { 
    marginTop: SPACING.xl 
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    gap: 12,
  },
  logoutText: { 
    fontSize: 18, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: "#FFF" 
  },
  // Các styles bổ sung
  retryBtn: { 
    marginTop: SPACING.md, 
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    backgroundColor: COLORS.surface, 
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary
  }
});