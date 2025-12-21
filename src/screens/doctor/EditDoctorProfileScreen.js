import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOWS,
} = theme;
const uploadImageToSupabase = async (uri, userId) => {
  try {
    console.log("Starting upload for URI:", uri);

    const fileExt = uri.split(".").pop()?.split(/[\?\#]/)[0]?.toLowerCase() || "jpg";
    const fileName = `doctor_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `doctors/${fileName}`;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("Base64 length:", base64.length);

    const fileBody = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, fileBody, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error && !error.message.includes("Duplicate")) {
      throw error;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    console.log("Upload success, URL:", data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error("Upload avatar failed:", err);
    throw err;
  }
};

const EditDoctorProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không xác thực được người dùng.");

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setDoctorInfo(data);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Lỗi tải hồ sơ:", error);
      Alert.alert("Lỗi", "Không thể tải hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền truy cập", "Cần cấp quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploading(true);

    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy người dùng");

      const publicUrl = await uploadImageToSupabase(manipResult.uri, user.id);

      await Promise.all([
        supabase.from("doctors").update({ avatar_url: publicUrl }).eq("id", user.id),
        supabase.from("user_profiles").upsert({ id: user.id, avatar_url: publicUrl }),
      ]);

      setAvatarUrl(`${publicUrl}?updated=${Date.now()}`);
      Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error("Pick/upload error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải ảnh lên");
    } finally {
      setUploading(false);
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Ảnh đại diện</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* CHỈ CHO PHÉP THAY ẢNH */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAndUploadImage} disabled={uploading}>
            <View style={styles.avatarWrapper}>
              <LinearGradient colors={["#E0E7FF", "#C7D2FE"]} style={styles.avatarBg}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.initials}>
                    <Text style={styles.initialsText}>
                      {doctorInfo?.name ? doctorInfo.name[0].toUpperCase() : "BS"}
                    </Text>
                  </View>
                )}
              </LinearGradient>

              <View style={styles.cameraIcon}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="camera" size={26} color="#FFF" />
                )}
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.hintText}>
            Nhấn vào ảnh để thay đổi ảnh đại diện
          </Text>
          <Text style={styles.subHint}>
            Các thông tin khác không thể chỉnh sửa
          </Text>
        </View>

        {/* HIỂN THỊ THÔNG TIN CHỈ ĐỂ XEM */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Thông tin bác sĩ</Text>

          <InfoRow icon="person-outline" label="Họ và tên" value={doctorInfo?.name || "—"} />
          <InfoRow icon="mail-outline" label="Email" value={doctorInfo?.email || "—"} />
          <InfoRow icon="medkit-outline" label="Chuyên môn" value={doctorInfo?.specialization || "—"} />
          <InfoRow icon="time-outline" label="Kinh nghiệm" value={doctorInfo?.experience_years ? `${doctorInfo.experience_years} năm` : "—"} />
          <InfoRow icon="home-outline" label="Phòng khám" value={doctorInfo?.room_number || "—"} />
          {doctorInfo?.bio ? (
            <View style={styles.bioRow}>
              <Ionicons name="document-text-outline" size={26} color={COLORS.primary} />
              <View style={styles.bioText}>
                <Text style={styles.bioLabel}>Giới thiệu</Text>
                <Text style={styles.bioValue}>{doctorInfo.bio}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* NÚT HOÀN TẤT */}
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <LinearGradient colors={GRADIENTS.primaryButton} style={styles.doneGradient}>
            <Ionicons name="checkmark-done" size={28} color="#FFF" />
            <Text style={styles.doneText}>Hoàn tất</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={26} color={COLORS.primary} />
    <View style={styles.rowText}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFF" },

  scroll: { padding: SPACING.xl, paddingBottom: 100 },

  avatarSection: { alignItems: "center", marginBottom: 40 },
  avatarWrapper: { position: "relative" },
  avatarBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 6,
    borderColor: "#FFF",
    ...SHADOWS.large,
  },
  avatarImage: { width: "100%", height: "100%" },
  initials: { width: 140, height: 140, justifyContent: "center", alignItems: "center" },
  initialsText: { fontSize: 60, fontWeight: "900", color: COLORS.primary },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#FFF",
  },
  hintText: { marginTop: 20, fontSize: 18, fontWeight: "600", color: COLORS.textPrimary },
  subHint: { marginTop: 8, fontSize: 15, color: COLORS.textSecondary, textAlign: "center" },

  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.card,
    elevation: 10,
  },
  infoTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 20, textAlign: "center" },

  row: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  rowText: { marginLeft: SPACING.xl, flex: 1 },
  label: { fontSize: 15, color: COLORS.textLight },
  value: { fontSize: 18, color: COLORS.textPrimary, marginTop: 4, fontWeight: "500" },

  bioRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 10 },
  bioText: { marginLeft: SPACING.xl, flex: 1 },
  bioLabel: { fontSize: 15, color: COLORS.textLight },
  bioValue: { fontSize: 17, color: COLORS.textPrimary, marginTop: 6, lineHeight: 24 },

  doneBtn: { marginTop: 40, borderRadius: BORDER_RADIUS.lg, overflow: "hidden" },
  doneGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  doneText: { fontSize: 19, fontWeight: "bold", color: "#FFF" },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 18, color: COLORS.textPrimary },
});

export default EditDoctorProfileScreen;