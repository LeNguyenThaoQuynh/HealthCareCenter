import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, SPACING, BORDER_RADIUS, SHADOWS } = theme;

export default function CreateServiceScreen() {
  const navigation = useNavigation();

  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    department: "",
    newDepartment: "",
    name: "",
    description: "",
    price: "",
    duration: "15",
    service_type: "consultation",
    code: "",
    preparation_notes: "",
  });
  const [loading, setLoading] = useState(false);

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("department", { distinct: true })
        .not("department", "is", null)
        .order("department", { ascending: true });

      if (error) throw error;

      const uniqueDepartments = [...new Set(data.map((d) => d.department))].filter(
        (d) => d && d.trim() !== ""
      );

      setDepartments(uniqueDepartments);
    } catch (err) {
      console.log("Error load departments:", err);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreate = async () => {
    let deptName = form.department || form.newDepartment;
    if (!deptName || !form.name) {
      return alert("Vui lòng chọn hoặc nhập khoa và nhập tên dịch vụ.");
    }

    setLoading(true);

    try {
      const serviceCode =
        form.code || `${deptName.slice(0, 3).toUpperCase()}-${Date.now()}`;

      await supabase.from("services").insert([
        {
          department: deptName,
          department_code: deptName.slice(0, 3).toUpperCase(),
          name: form.name,
          description: form.description,
          price: Number(form.price || 0),
          duration_minutes: Number(form.duration),
          service_type: form.service_type || "consultation",
          code: serviceCode,
          preparation_notes: form.preparation_notes || "",
          is_active: true,
        },
      ]);

      alert("Tạo dịch vụ thành công!");
      setForm({
        department: "",
        newDepartment: "",
        name: "",
        description: "",
        price: "",
        duration: "15",
        service_type: "consultation",
        code: "",
        preparation_notes: "",
      });

      loadDepartments();
    } catch (err) {
      console.log("Error creating service:", err);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={{
          height: 120,
          paddingTop: Platform.OS === "ios" ? 65 : 45,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          justifyContent: "center",
          paddingHorizontal: SPACING.lg,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("AdminHome")}
          style={{
            position: "absolute",
            left: SPACING.lg,
            top: Platform.OS === "ios" ? 65 : 45,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <Text
          style={{
            color: "#FFF",
            fontSize: 22,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          Tạo dịch vụ mới
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, padding: SPACING.lg }}
        showsVerticalScrollIndicator={false}
      >
        {!form.newDepartment && (
          <>
            <Text style={styles.label}>Chọn Khoa có sẵn</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: BORDER_RADIUS.md,
                marginTop: 6,
                backgroundColor: "#FFF",
              }}
            >
              <Picker
                selectedValue={form.department}
                onValueChange={(value) =>
                  setForm({ ...form, department: value, newDepartment: "" })
                }
              >
                <Picker.Item label="-- Chọn khoa --" value="" />
                {departments.map((dept, index) => (
                  <Picker.Item key={`${dept}-${index}`} label={dept} value={dept} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {!form.department && (
          <>
            <Text style={[styles.label, { marginTop: SPACING.md }]}>
              Hoặc nhập Khoa mới
            </Text>
            <TextInput
              value={form.newDepartment}
              onChangeText={(v) =>
                setForm({ ...form, newDepartment: v, department: "" })
              }
              placeholder="Nhập tên khoa mới"
              style={styles.input}
            />
          </>
        )}

        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 20,
            padding: SPACING.lg,
            marginTop: SPACING.lg,
            ...SHADOWS.card,
          }}
        >
          <Text style={styles.label}>Tên dịch vụ *</Text>
          <TextInput
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="Nhập tên dịch vụ"
            style={styles.input}
          />

          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder="Mô tả chi tiết"
            style={[styles.input, { height: 100 }]}
            multiline
          />

          <Text style={styles.label}>Giá (VNĐ)</Text>
          <TextInput
            value={form.price}
            onChangeText={(v) => setForm({ ...form, price: v })}
            placeholder="VD: 150000"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Thời gian (phút)</Text>
          <TextInput
            value={form.duration}
            onChangeText={(v) => setForm({ ...form, duration: v })}
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading}
            style={{
              marginTop: SPACING.lg,
              borderRadius: BORDER_RADIUS.lg,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={{
                paddingVertical: 14,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
                  Tạo dịch vụ
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  label: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  input: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
};
