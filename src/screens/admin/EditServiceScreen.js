import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";
import { useNavigation, useRoute } from "@react-navigation/native";

const { COLORS, SPACING, BORDER_RADIUS, GRADIENTS, FONT_SIZE, FONT_WEIGHT } =
  theme;

export default function EditServiceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { serviceId: rawServiceId } = route.params || {};

  if (!rawServiceId) {
    Alert.alert("Lỗi", "Không tìm thấy thông tin dịch vụ");
    navigation.goBack();
    return null;
  }

  const id = Number(rawServiceId);
  if (isNaN(id) || id <= 0) {
    Alert.alert("Lỗi", "ID dịch vụ không hợp lệ");
    navigation.goBack();
    return null;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    department: "",
    code: "",
    price: "",
    is_active: true,
  });

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) {
        Alert.alert("Lỗi", "Dịch vụ không tồn tại");
        navigation.goBack();
        return;
      }

      setForm({
        name: data.name || "",
        department: data.department || "",
        code: data.code || "",
        price: data.price ? String(data.price) : "",
        is_active: data.is_active ?? true,
      });
    } catch {
      Alert.alert("Lỗi", "Không thể tải thông tin dịch vụ");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên dịch vụ");
      return;
    }
    if (!form.price.trim() || isNaN(form.price) || Number(form.price) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ (lớn hơn 0)");
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: form.name.trim(),
        department: form.department.trim() || "Chưa xác định",
        code: form.code.trim() || null,
        price: Number(form.price),
        is_active: form.is_active,
      };

      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;

      Alert.alert("Thành công", "Đã cập nhật dịch vụ thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Lỗi", `Cập nhật thất bại: ${err.message}`);
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
          Đang tải thông tin dịch vụ...
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
          paddingBottom: SPACING.xxl,
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
            <Ionicons name="arrow-back" size={30} color="#FFF" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: FONT_SIZE.header,
              fontWeight: FONT_WEIGHT.bold,
              color: "#FFF",
            }}
          >
            Sửa dịch vụ
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="checkmark" size={32} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: SPACING.xl }}>
          <View style={{ marginBottom: SPACING.xl }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Tên dịch vụ *
            </Text>
            <TextInput
              style={{
                backgroundColor: "#FFF",
                borderRadius: BORDER_RADIUS.lg,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.lg,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
              placeholder="VD: Khám nội tổng quát"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={{ marginBottom: SPACING.xl }}>
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
                backgroundColor: "#FFF",
                borderRadius: BORDER_RADIUS.lg,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.lg,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              value={form.department}
              onChangeText={(t) => setForm({ ...form, department: t })}
              placeholder="VD: Khoa Nội"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={{ marginBottom: SPACING.xl }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Mã dịch vụ
            </Text>
            <TextInput
              style={{
                backgroundColor: "#FFF",
                borderRadius: BORDER_RADIUS.lg,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.lg,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              value={form.code}
              onChangeText={(t) => setForm({ ...form, code: t.toUpperCase() })}
              placeholder="VD: DV001"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={{ marginBottom: SPACING.xl }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Giá tiền (VNĐ) *
            </Text>
            <TextInput
              style={{
                backgroundColor: "#FFF",
                borderRadius: BORDER_RADIUS.lg,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.lg,
                fontSize: FONT_SIZE.lg,
                color: COLORS.textPrimary,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              value={form.price}
              onChangeText={(t) =>
                setForm({ ...form, price: t.replace(/[^0-9]/g, "") })
              }
              keyboardType="numeric"
              placeholder="200000"
              placeholderTextColor={COLORS.textLight}
            />
            {form.price ? (
              <Text
                style={{
                  marginTop: SPACING.sm,
                  fontSize: FONT_SIZE.xl,
                  color: COLORS.primary,
                  fontWeight: "700",
                }}
              >
                {Number(form.price).toLocaleString("vi-VN")} ₫
              </Text>
            ) : null}
          </View>

          <View style={{ marginBottom: SPACING.xxl }}>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.semibold,
                color: COLORS.textPrimary,
                marginBottom: SPACING.md,
              }}
            >
              Trạng thái
            </Text>
            <TouchableOpacity
              onPress={() => setForm({ ...form, is_active: !form.is_active })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: SPACING.lg,
                backgroundColor: form.is_active
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(239,68,68,0.1)",
                borderRadius: BORDER_RADIUS.lg,
                borderWidth: 1,
                borderColor: form.is_active ? COLORS.success : COLORS.danger,
              }}
            >
              <Ionicons
                name={form.is_active ? "checkmark-circle" : "close-circle"}
                size={28}
                color={form.is_active ? COLORS.success : COLORS.danger}
              />
              <Text
                style={{
                  marginLeft: SPACING.md,
                  fontSize: FONT_SIZE.lg,
                  fontWeight: "600",
                  color: form.is_active ? COLORS.success : COLORS.danger,
                }}
              >
                {form.is_active ? "Đang hoạt động" : "Tạm dừng"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
