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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import { useUserStore } from "../../store/useUserStore";
import { getProfile, updateProfile } from "../../controllers/patient/profileController";
import { supabase } from "../../api/supabase";
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

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await getProfile();
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
      });
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile.dateOfBirth) setSelectedDate(new Date(profile.dateOfBirth));
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);

  const handleDateConfirm = (date) => {
    const formatted = date.toISOString().split("T")[0];
    setFormData({ ...formData, dateOfBirth: formatted });
    setSelectedDate(date);
    hideDatePicker();
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Chọn ngày sinh";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri) => {
    try {
      setUploading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error("Không xác thực được người dùng");

      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${authUser.id}-${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

      const formData = new FormData();
      formData.append("file", {
        uri,
        name: fileName,
        type: `image/${ext}`,
      });

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, formData, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", authUser.id);

      setAvatarUrl(publicUrl + `?t=${Date.now()}`);
      Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(formData);
      setUser({ ...user, name: formData.fullName.trim() });
      Alert.alert("Thành công", "Cập nhật hồ sơ thành công", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
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
        <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.avatarWrapper}>
            <LinearGradient colors={["#E0E7FF", "#C7D2FE"]} style={styles.avatarBg}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>
                    {formData.fullName ? formData.fullName[0].toUpperCase() : "U"}
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
          <Text style={styles.name}>{formData.fullName || "Người dùng"}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Họ tên */}
          <View style={styles.row}>
            <Ionicons name="person-outline" size={26} color={COLORS.primary} />
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                placeholder="Nhập họ và tên"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={26} color={COLORS.primary} />
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.readonly}>{user?.email || "—"}</Text>
            </View>
          </View>

          {/* Phone */}
          <View style={styles.row}>
            <Ionicons name="call-outline" size={26} color={COLORS.primary} />
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          {/* Ngày sinh */}
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={26} color={COLORS.primary} />
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Ngày sinh</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={showDatePicker}>
                <Text style={[styles.dateText, !formData.dateOfBirth && styles.placeholder]}>
                  {formatDisplayDate(formData.dateOfBirth)}
                </Text>
                <Ionicons name="chevron-down" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Giới tính */}
          <View style={styles.row}>
            <Ionicons name="male-female-outline" size={26} color={COLORS.primary} />
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Giới tính</Text>
              <View style={styles.genderRow}>
                {["Nam", "Nữ", "Khác"].map((label, i) => {
                  const value = ["male", "female", "other"][i];
                  const isActive = formData.gender === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.genderBtn, isActive && styles.genderBtnActive]}
                      onPress={() => setFormData({ ...formData, gender: value })}
                    >
                      <Text style={[styles.genderText, isActive && styles.genderTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.btns}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
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

            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={selectedDate}
        maximumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
      />
    </View>
  );
};

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
  avatarImage: { width: 130, height: 130 },
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

  card: { backgroundColor: "#FFF", borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, ...SHADOWS.card },
  row: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xl },
  inputWrapper: { marginLeft: SPACING.xl, flex: 1 },
  label: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 6 },
  input: { fontSize: 18, color: COLORS.textPrimary, paddingVertical: 8, borderBottomWidth: 1, borderColor: "#E5E7EB" },
  readonly: { fontSize: 18, color: COLORS.textSecondary, paddingVertical: 8 },
  dateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#E5E7EB" },
  dateText: { fontSize: 18, color: COLORS.textPrimary },
  placeholder: { color: COLORS.textLight },

  genderRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  genderBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg, backgroundColor: "#F3F4F6" },
  genderBtnActive: { backgroundColor: COLORS.primary },
  genderText: { fontSize: 16, fontWeight: FONT_WEIGHT.medium, color: COLORS.textSecondary },
  genderTextActive: { color: "#FFF" },

  btns: { marginTop: SPACING.xxl, gap: 12 },
  saveBtn: { borderRadius: BORDER_RADIUS.lg, overflow: "hidden" },
  saveGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 10 },
  saveText: { fontSize: 18, fontWeight: FONT_WEIGHT.semibold, color: "#FFF" },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: FONT_SIZE.lg, color: COLORS.textPrimary },
});

export default EditProfileScreen;