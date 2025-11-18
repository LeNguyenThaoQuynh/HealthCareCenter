import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation, useRoute } from "@react-navigation/native";
import theme from "../../theme/theme";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOWS,
} = theme;

const WEEKDAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

export default function CreateDoctorScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorInfo } = route.params;

  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);

  const formatTime = (text = "") => {
    const digits = text.replace(/[^0-9]/g, "");
    if (!digits) return "";
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`.slice(0, 5);
  };

  const isValidTime = (t) => /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(t);
  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const hasOverlap = (slots) => {
    const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < sorted.length - 1; i++) {
      if (toMinutes(sorted[i].end) > toMinutes(sorted[i + 1].start)) return true;
    }
    return false;
  };

  const addSlot = (day) => {
    const slots = schedules[day] || [];
    let start = "08:00";
    let end = "09:00";

    if (slots.length > 0) {
      const last = slots[slots.length - 1];
      let [h] = last.end.split(":").map(Number);
      h += h >= 12 ? 1 : 1;
      if (h === 12) h = 13;
      start = `${String(h).padStart(2, "0")}:00`;
      end = `${String(h + 1).padStart(2, "0")}:00`;
    }

    setSchedules((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { start, end }],
    }));
  };

  const removeSlot = (day, idx) => {
    setSchedules((prev) => {
      const updated = prev[day].filter((_, i) => i !== idx);
      if (updated.length === 0) {
        const { [day]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [day]: updated };
    });
  };

  const updateTime = (day, idx, field, value) => {
    const formatted = formatTime(value);
    setSchedules((prev) => {
      const updated = [...(prev[day] || [])];
      updated[idx] = { ...updated[idx], [field]: formatted };
      return { ...prev, [day]: updated };
    });
  };

  const handleCreate = async () => {
    const allSlots = Object.values(schedules).flat();
    if (allSlots.length === 0) {
      Alert.alert("Thiếu lịch", "Vui lòng thêm ít nhất 1 khung giờ làm việc");
      return;
    }

    for (const [day, slots] of Object.entries(schedules)) {
      if (hasOverlap(slots)) {
        Alert.alert("Trùng giờ", `${day}: Có khung giờ bị chồng chéo`);
        return;
      }
      for (const slot of slots) {
        if (!isValidTime(slot.start) || !isValidTime(slot.end)) {
          Alert.alert("Sai định dạng", `${day}: Giờ phải có dạng HH:MM (ví dụ: 08:00)`);
          return;
        }
        if (toMinutes(slot.start) >= toMinutes(slot.end)) {
          Alert.alert("Lỗi giờ", `${day}: Giờ kết thúc phải sau giờ bắt đầu`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: doctorInfo.email,
        password: doctorInfo.password,
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          Alert.alert("Email đã tồn tại", "Vui lòng dùng email khác");
        } else throw authError;
        return;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error("Không lấy được ID người dùng");

      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          role_id: 2,
          full_name: doctorInfo.fullName,
          email: doctorInfo.email,
        });

      if (profileError) throw profileError;

      // 3. Tạo bác sĩ
      const { error: doctorError } = await supabase.from("doctors").insert({
        id: userId,
        name: doctorInfo.fullName,
        department_id: doctorInfo.departmentId,
        specialization: doctorInfo.specialization || null,
        experience_years: doctorInfo.experienceYears || null,
        room_number: doctorInfo.roomNumber || null,
        max_patients_per_slot: doctorInfo.maxPatients,
        bio: doctorInfo.bio || null,
      });

      if (doctorError) throw doctorError;

      const scheduleData = Object.entries(schedules).flatMap(([day, slots]) =>
        slots.map((s) => ({
          doctor_id: userId,
          day_of_week: day,
          start_time: `${s.start}:00`,
          end_time: `${s.end}:00`,
          max_patients_per_slot: doctorInfo.maxPatients,
        }))
      );

      const { error: scheduleError } = await supabase
        .from("doctor_schedule_template")
        .insert(scheduleData);

      if (scheduleError) throw scheduleError;

      Alert.alert("Thành công!", `Đã tạo bác sĩ: ${doctorInfo.fullName}`, [
        { text: "OK", onPress: () => navigation.navigate("Bác sĩ") },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", err.message || "Tạo bác sĩ thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Lịch làm việc</Text>
          <Text style={styles.subtitle}>Bước 2/2 • Thiết lập khung giờ</Text>
        </View>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.doctorCard}>
          <Text style={styles.doctorLabel}>Bác sĩ</Text>
          <Text style={styles.doctorName}>{doctorInfo.fullName}</Text>
          <Text style={styles.doctorEmail}>{doctorInfo.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Khung giờ làm việc</Text>

        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayText}>{day}</Text>
              <TouchableOpacity onPress={() => addSlot(day)} style={styles.addBtn}>
                <Ionicons name="add-circle" size={22} color={COLORS.primary} />
                <Text style={styles.addBtnText}>Thêm ca</Text>
              </TouchableOpacity>
            </View>

            {schedules[day]?.length > 0 ? (
              schedules[day].map((slot, i) => (
                <View key={i} style={styles.slotRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={slot.start}
                    onChangeText={(t) => updateTime(day, i, "start", t)}
                    placeholder="08:00"
                    maxLength={5}
                    keyboardType="numeric"
                  />
                  <Ionicons name="arrow-forward" size={20} color="#64748B" style={{ marginHorizontal: 12 }} />
                  <TextInput
                    style={styles.timeInput}
                    value={slot.end}
                    onChangeText={(t) => updateTime(day, i, "end", t)}
                    placeholder="12:00"
                    maxLength={5}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={() => removeSlot(day, i)} style={styles.deleteBtn}>
                    <Ionicons name="trash-bin" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyDay}>Chưa có khung giờ</Text>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={[styles.createBtn, loading && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          <LinearGradient colors={GRADIENTS.primaryButton} style={styles.createBtnGradient}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={24} color="#FFF" />
                <Text style={styles.createBtnText}>Hoàn tất tạo bác sĩ</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const styles = {
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: FONT_WEIGHT.bold, color: "#FFF" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },

  content: { padding: SPACING.xl },

  doctorCard: {
    backgroundColor: "#FFFFFF",
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  doctorLabel: { fontSize: 14, color: COLORS.textSecondary },
  doctorName: { fontSize: 20, fontWeight: "bold", color: COLORS.textPrimary, marginTop: 4 },
  doctorEmail: { fontSize: 15, color: COLORS.primary, marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },

  dayBlock: { marginBottom: SPACING.xl },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  dayText: { fontSize: 17, fontWeight: "600", color: COLORS.textPrimary },
  addBtn: { flexDirection: "row", alignItems: "center" },
  addBtnText: { marginLeft: 6, fontSize: 15, color: COLORS.primary, fontWeight: "600" },

  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.sm,
    ...SHADOWS.card,
  },
  timeInput: {
    width: 90,
    height: 48,
    backgroundColor: "#F1F5F9",
    borderRadius: BORDER_RADIUS.lg,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  deleteBtn: { marginLeft: "auto", padding: 8 },

  emptyDay: { fontSize: 15, color: COLORS.textSecondary, fontStyle: "italic", textAlign: "center", marginTop: 12 },

  createBtn: { marginTop: SPACING.xxl, borderRadius: BORDER_RADIUS.xl, overflow: "hidden", ...SHADOWS.large },
  createBtnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16 },
  createBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF", marginLeft: 10 },
};