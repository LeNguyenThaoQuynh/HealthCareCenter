import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";
import { useNavigation, useRoute } from "@react-navigation/native";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  FONT_SIZE,
  FONT_WEIGHT,
} = theme;

const EditDoctorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    specialization: "",
    experience_years: "",
    room_number: "",
    department_name: "",
    max_patients_per_slot: "5",
    bio: "",
  });

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select(
          `
          name,
          specialization,
          experience_years,
          room_number,
          department_name,
          max_patients_per_slot,
          bio,
          user_profiles!inner(full_name)
        `
        )
        .eq("id", doctorId)
        .single();

      if (error) throw error;

      setForm({
        full_name: data.user_profiles?.full_name || data.name || "",
        specialization: data.specialization || "",
        experience_years: String(data.experience_years || ""),
        room_number: data.room_number || "",
        department_name: data.department_name || "",
        max_patients_per_slot: String(data.max_patients_per_slot || 5),
        bio: data.bio || "",
      });
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải thông tin bác sĩ");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên bác sĩ");
      return;
    }

    setSaving(true);

    try {
      const updates = {
        name: form.full_name.trim(),
        specialization: form.specialization.trim() || null,
        experience_years:
          form.experience_years.trim() === ""
            ? null
            : parseInt(form.experience_years),
        room_number: form.room_number.trim() || null,
        department_name: form.department_name.trim() || null,
        max_patients_per_slot: parseInt(form.max_patients_per_slot) || 5,
        bio: form.bio.trim() || null,
      };

      const { error: docError } = await supabase
        .from("doctors")
        .update(updates)
        .eq("id", doctorId);

      if (docError) throw docError;

      const { data: profileCheck } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", doctorId)
        .maybeSingle();

      if (profileCheck) {
        await supabase
          .from("user_profiles")
          .update({ full_name: form.full_name.trim() })
          .eq("id", doctorId);
      }

      Alert.alert("Thành công", "Đã cập nhật thông tin bác sĩ", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={{
            marginTop: SPACING.lg,
            fontSize: FONT_SIZE.lg,
            color: COLORS.textSecondary,
          }}
        >
          Đang tải thông tin...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={GRADIENTS.header}
        style={{
          paddingTop: Platform.OS === "ios" ? 60 : 40,
          paddingBottom: SPACING.xl,
          paddingHorizontal: SPACING.xl,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={28}
              color={COLORS.textOnPrimary}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: FONT_SIZE.header,
              fontWeight: FONT_WEIGHT.bold,
              color: COLORS.textOnPrimary,
            }}
          >
            Sửa bác sĩ
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.textOnPrimary} />
            ) : (
              <Ionicons
                name="checkmark"
                size={30}
                color={COLORS.textOnPrimary}
              />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SPACING.xl }}
        >
          <View style={{ marginBottom: SPACING.lg }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Họ và tên *
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: BORDER_RADIUS.md,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
              }}
              value={form.full_name}
              onChangeText={(t) => setForm({ ...form, full_name: t })}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="words"
            />
          </View>

          <View style={{ marginBottom: SPACING.lg }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Chuyên môn (cách nhau bằng dấu phẩy)
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: BORDER_RADIUS.md,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
              }}
              value={form.specialization}
              onChangeText={(t) => setForm({ ...form, specialization: t })}
              placeholder="Nhi khoa, Tim mạch, Thần kinh"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={{ marginBottom: SPACING.lg }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Số năm kinh nghiệm
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: BORDER_RADIUS.md,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
              }}
              value={form.experience_years}
              onChangeText={(t) =>
                setForm({ ...form, experience_years: t.replace(/[^0-9]/g, "") })
              }
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={{ marginBottom: SPACING.lg }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Số phòng khám
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: BORDER_RADIUS.md,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
              }}
              value={form.room_number}
              onChangeText={(t) => setForm({ ...form, room_number: t })}
              placeholder="101"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={{ marginBottom: SPACING.lg }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Khoa / Phòng ban
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: BORDER_RADIUS.md,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
              }}
              value={form.department_name}
              onChangeText={(t) => setForm({ ...form, department_name: t })}
              placeholder="Khoa Nội tổng hợp"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="words"
            />
          </View>

          <View style={{ marginBottom: SPACING.lg }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Số bệnh nhân tối đa mỗi ca
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: BORDER_RADIUS.md,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
              }}
              value={form.max_patients_per_slot}
              onChangeText={(t) =>
                setForm({
                  ...form,
                  max_patients_per_slot: t.replace(/[^0-9]/g, "") || "5",
                })
              }
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={{ marginBottom: SPACING.xxl }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Tiểu sử / Giới thiệu
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: BORDER_RADIUS.md,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
                height: 120,
                textAlignVertical: "top",
              }}
              value={form.bio}
              onChangeText={(t) => setForm({ ...form, bio: t })}
              placeholder="Bác sĩ có hơn 15 năm kinh nghiệm..."
              placeholderTextColor={COLORS.textLight}
              multiline
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditDoctorScreen;
