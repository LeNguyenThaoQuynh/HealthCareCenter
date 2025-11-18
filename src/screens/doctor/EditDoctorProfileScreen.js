import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";  // ← FIX: DÙNG LEGACY CHO BASE64 ỔN ĐỊNH
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

// ==================== UPLOAD ẢNH ĐÃ FIX LEGACY ENCODING (SDK 51+) ====================
const uploadImageToSupabase = async (uri, userId) => {
  try {
    console.log("Starting upload for URI:", uri);  // Debug log

    const fileExt = uri.split(".").pop()?.split(/[\?\#]/)[0]?.toLowerCase() || "jpg";
    const fileName = `doctor_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `doctors/${fileName}`;

    // FIX: Legacy API với EncodingType.Base64 (enum đúng)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,  // ← EncodingType (KHÔNG PHẢI Types)
    });
    console.log("Base64 length:", base64.length);  // Debug: Phải >0 nếu OK

    // Chuyển base64 → Uint8Array cho Supabase v2+
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
    console.log("Upload success, URL:", data.publicUrl);  // Debug
    return data.publicUrl;
  } catch (err) {
    console.error("Upload avatar failed:", err);
    throw err;
  }
};
// ========================================================================

const EditDoctorProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    experience_years: "",
    room_number: "",
    bio: "",
  });

  const [email, setEmail] = useState("");

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  // ==================== LẤY THÔNG TIN BÁC SĨ ====================
  const fetchDoctorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không xác thực được người dùng.");

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setFormData({
          name: data.name || "",
          specialization: data.specialization || "",
          experience_years: data.experience_years?.toString() || "",
          room_number: data.room_number || "",
          bio: data.bio || "",
        });
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Lỗi tải hồ sơ bác sĩ:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== CHỌN & NÉN & UPLOAD ẢNH (VỚI LEGACY + COPY TO CACHE) ====================
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
      copyToCacheDirectory: true,  // ← GIỮ ĐỂ TRÁNH LỖI READABLE TRÊN BUILD
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    console.log("Selected image URI:", result.assets[0].uri);  // Debug

    setUploading(true);

    try {
      // Nén ảnh (vẫn dùng ImageManipulator)
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy người dùng");

      const publicUrl = await uploadImageToSupabase(manipResult.uri, user.id);

      // Cập nhật cả 2 bảng
      await Promise.all([
        supabase.from("doctors").update({ avatar_url: publicUrl }).eq("id", user.id),
        supabase
          .from("user_profiles")
          .upsert({ id: user.id, avatar_url: publicUrl }),
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

  // ==================== LƯU HỒ SƠ ====================
  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updates = {
        id: user.id,
        name: formData.name.trim(),
        specialization: formData.specialization.trim() || null,
        experience_years: formData.experience_years
          ? parseInt(formData.experience_years, 10)
          : null,
        room_number: formData.room_number.trim() || null,
        bio: formData.bio.trim() || null,
      };

      const { error } = await supabase.from("doctors").upsert(updates);
      if (error) throw error;

      await supabase
        .from("user_profiles")
        .update({ name: formData.name.trim() })
        .eq("id", user.id);

      Alert.alert("Thành công", "Cập nhật hồ sơ thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Lỗi lưu hồ sơ:", error);
      Alert.alert("Lỗi", error.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  // ==================== MAIN UI ====================
  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Chỉnh sửa hồ sơ Bác sĩ</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={pickAndUploadImage}
            disabled={uploading}
            style={styles.avatarWrapper}
          >
            <LinearGradient colors={["#E0E7FF", "#C7D2FE"]} style={styles.avatarBg}>
              {avatarUrl ? (
                <Image
                  key={avatarUrl}
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>
                    {formData.name ? formData.name[0].toUpperCase() : "BS"}
                  </Text>
                </View>
              )}
            </LinearGradient>

            <View style={styles.cameraIcon}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="camera" size={22} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{formData.name || "Bác sĩ"}</Text>
        </View>

        <View style={styles.card}>
          <InfoInput
            icon="person-outline"
            label="Họ và tên *"
            value={formData.name}
            onChangeText={(t) => setFormData({ ...formData, name: t })}
            placeholder="Nhập họ và tên bác sĩ"
          />

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={26} color={COLORS.primary} />
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.readonly}>{email || "—"}</Text>
            </View>
          </View>

          <InfoInput
            icon="medkit-outline"
            label="Chuyên môn"
            value={formData.specialization}
            onChangeText={(t) => setFormData({ ...formData, specialization: t })}
            placeholder="VD: Tim mạch, Nhi khoa"
          />

          <InfoInput
            icon="time-outline"
            label="Kinh nghiệm (năm)"
            value={formData.experience_years}
            onChangeText={(t) =>
              setFormData({ ...formData, experience_years: t.replace(/[^0-9]/g, "") })
            }
            placeholder="VD: 12"
            keyboardType="numeric"
          />

          <InfoInput
            icon="home-outline"
            label="Phòng khám"
            value={formData.room_number}
            onChangeText={(t) => setFormData({ ...formData, room_number: t })}
            placeholder="VD: Phòng 301"
          />

          <View style={styles.rowBio}>
            <Ionicons name="document-text-outline" size={26} color={COLORS.primary} />
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Giới thiệu bản thân</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={formData.bio}
                onChangeText={(t) => setFormData({ ...formData, bio: t })}
                multiline
                numberOfLines={4}
                placeholder="Mô tả ngắn gọn về kinh nghiệm, phương châm làm việc..."
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          <View style={styles.btns}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleUpdate}
              disabled={saving}
            >
              <LinearGradient colors={GRADIENTS.primaryButton} style={styles.saveGradient}>
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.saveText}>Lưu thay đổi</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ==================== COMPONENT NHỎ ====================
const InfoInput = ({ icon, label, value, onChangeText, placeholder, keyboardType }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={26} color={COLORS.primary} />
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        keyboardType={keyboardType || "default"}
        autoCapitalize="words"
      />
    </View>
  </View>
);

// ==================== STYLES ====================
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: FONT_WEIGHT.bold, color: "#FFF" },

  scroll: { padding: SPACING.xl },

  avatarSection: { alignItems: "center", marginBottom: SPACING.xxxl },
  avatarWrapper: { position: "relative" },
  avatarBg: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 5,
    borderColor: "#FFF",
    ...SHADOWS.card,
  },
  avatarImage: { width: "100%", height: "100%" },
  initials: { width: 130, height: 130, justifyContent: "center", alignItems: "center" },
  initialsText: { fontSize: 52, fontWeight: FONT_WEIGHT.black, color: COLORS.primary },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  name: { fontSize: 26, fontWeight: FONT_WEIGHT.black, color: COLORS.textPrimary, marginTop: SPACING.lg },

  card: {
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xl },
  rowBio: { flexDirection: "row", alignItems: "flex-start", marginBottom: SPACING.xl },
  inputWrapper: { marginLeft: SPACING.xl, flex: 1 },
  label: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    fontSize: 18,
    color: COLORS.textPrimary,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  readonly: { fontSize: 18, color: COLORS.textSecondary, paddingVertical: 8 },
  bioInput: { minHeight: 100, textAlignVertical: "top", paddingTop: 8 },

  btns: { marginTop: SPACING.xxl, gap: 12 },
  saveBtn: { borderRadius: BORDER_RADIUS.lg, overflow: "hidden" },
  saveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  saveText: { fontSize: 18, fontWeight: FONT_WEIGHT.semibold, color: "#FFF" },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 18, color: COLORS.textPrimary },
});

export default EditDoctorProfileScreen;