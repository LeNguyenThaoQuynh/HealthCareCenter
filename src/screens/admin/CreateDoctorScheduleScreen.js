// src/screens/admin/CreateDoctorScheduleScreen.js
import React, { useState, useRef } from "react";
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

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS } = theme;
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
    if (digits.length === 3) return `${digits.slice(0, 2)}:${digits[2]}`;
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
      const lastEnd = toMinutes(last.end);
      const nextStart = lastEnd + 60;
      if (nextStart < 24 * 60) {
        const h = Math.floor(nextStart / 60);
        const m = nextStart % 60;
        start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        end = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }

    setSchedules(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { start, end }]
    }));
  };

  const removeSlot = (day, idx) => {
    setSchedules(prev => {
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
    setSchedules(prev => {
      const updated = [...(prev[day] || [])];
      updated[idx] = { ...updated[idx], [field]: formatted };
      return { ...prev, [day]: updated };
    });
  };

  const handleCreate = async () => {
    const allSlots = Object.values(schedules).flat();
    if (allSlots.length === 0) {
      return Alert.alert("Thiếu lịch", "Vui lòng thêm ít nhất 1 khung giờ làm việc");
    }

    for (const [day, slots] of Object.entries(schedules)) {
      if (hasOverlap(slots)) {
        return Alert.alert("Lỗi", `${day}: Có khung giờ bị chồng chéo`);
      }
      for (const slot of slots) {
        if (!isValidTime(slot.start) || !isValidTime(slot.end)) {
          return Alert.alert("Sai định dạng", `${day}: Giờ phải có dạng HH:MM (ví dụ: 08:00)`);
        }
        if (toMinutes(slot.start) >= toMinutes(slot.end)) {
          return Alert.alert("Lỗi giờ", `${day}: Giờ kết thúc phải sau giờ bắt đầu`);
        }
      }
    }

    setLoading(true);
    Alert.alert("Đang tạo bác sĩ", "Vui lòng chờ một chút...", [], { cancelable: false });

    try {
      // 1. Tạo user bằng Admin API (để tránh xác minh email)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: doctorInfo.email,
        password: doctorInfo.password,
        email_confirm: true, // tự động confirm email
        user_metadata: { full_name: doctorInfo.fullName }
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Không tạo được user");

      const userId = authData.user.id;

const { error: profileError } = await supabase
  .from("user_profiles")
  .insert({  // dùng insert thay vì upsert để tránh lỗi trùng
    id: userId,
    full_name: doctorInfo.fullName,
    email: doctorInfo.email,
    role_id: 2,                    // ĐÚNG YÊU CẦU CỦA BẠN
    created_at: new Date().toISOString(),
  });

      if (profileError) throw profileError;

      // 3. Insert vào bảng doctors
      const { error: doctorError } = await supabase
        .from("doctors")
        .insert({
          id: userId,
          name: doctorInfo.fullName,
          service_id: doctorInfo.service_id || null,
          specialization: doctorInfo.specialization, // chuỗi "Tim mạch, Răng hàm mặt"
          experience_years: doctorInfo.experience_years,
          room_number: doctorInfo.room_number,
          max_patients_per_slot: doctorInfo.max_patients_per_slot,
          bio: doctorInfo.bio,
          department_name: doctorInfo.department_name,
        });

      if (doctorError) {
        if (doctorError.code === "23505") throw new Error("Bác sĩ đã tồn tại");
        throw doctorError;
      }

      // 4. Gán phòng khám
      const { error: roomError } = await supabase
        .from("clinic_rooms")
        .update({ doctor_id: userId })
        .eq("room_number", doctorInfo.room_number);

      if (roomError) console.warn("Cảnh báo gán phòng:", roomError);

      // 5. Tạo lịch làm việc
      const scheduleInserts = Object.entries(schedules).flatMap(([day, slots]) =>
        slots.map(slot => ({
          doctor_id: userId,
          day_of_week: day,
          start_time: `${slot.start}:00`,
          end_time: `${slot.end}:00`,
          max_patients_per_slot: doctorInfo.max_patients_per_slot || 10,
        }))
      );

      if (scheduleInserts.length > 0) {
        const { error: scheduleError } = await supabase
          .from("doctor_schedule_template")
          .insert(scheduleInserts);

        if (scheduleError) throw scheduleError;
      }

      // THÀNH CÔNG
      Alert.alert(
        "HOÀN TẤT!",
        `Đã tạo thành công bác sĩ:\n${doctorInfo.fullName}\nPhòng: ${doctorInfo.room_number}`,
        [{
          text: "OK",
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: "ManageDoctors" }],
          })
        }]
      );

    } catch (err) {
      console.error("Lỗi tạo bác sĩ:", err);
      let message = "Không thể tạo bác sĩ. Vui lòng thử lại!";
      if (err.message?.includes("duplicate") || err.message?.includes("already")) {
        message = "Email hoặc phòng khám đã được sử dụng!";
      }
      Alert.alert("Lỗi", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Thiết lập lịch làm việc</Text>
          <Text style={styles.subtitle}>Bước 2/2 • {doctorInfo.fullName}</Text>
        </View>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.doctorCard}>
          <Text style={styles.doctorName}>{doctorInfo.fullName}</Text>
          <Text style={styles.doctorEmail}>{doctorInfo.email}</Text>
          <Text style={styles.doctorRoom}>Phòng: {doctorInfo.room_number}</Text>
          <Text style={styles.doctorDept}>Khoa: {doctorInfo.department_name}</Text>
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

            {(schedules[day] || []).length > 0 ? (
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
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={28} color="#FFF" />
                <Text style={styles.createBtnText}>HOÀN TẤT TẠO BÁC SĨ</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = {
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
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  subtitle: { fontSize: 15, color: "#E0F2FE", marginTop: 4 },
  content: { padding: SPACING.xl, paddingBottom: 100 },
  doctorCard: {
    backgroundColor: "#FFF",
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  doctorName: { fontSize: 20, fontWeight: "bold", color: COLORS.textPrimary },
  doctorEmail: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  doctorRoom: { fontSize: 15, color: COLORS.success, marginTop: 4, fontWeight: "600" },
  doctorDept: { fontSize: 15, color: COLORS.primary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: SPACING.lg },
  dayBlock: { marginBottom: SPACING.xl },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  dayText: { fontSize: 17, fontWeight: "600", color: COLORS.textPrimary },
  addBtn: { flexDirection: "row", alignItems: "center" },
  addBtnText: { marginLeft: 6, fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
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
  createBtnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18 },
  createBtnText: { fontSize: 18, fontWeight: "700", color: "#FFF", marginLeft: 12 },
};