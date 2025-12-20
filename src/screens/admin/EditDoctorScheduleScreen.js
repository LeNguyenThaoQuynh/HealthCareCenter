import React, { useState, useEffect } from "react";
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

const WEEKDAYS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

export default function EditDoctorScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorId, doctorName } = route.params;

  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Load lịch hiện tại khi vào màn hình
  useEffect(() => {
    fetchCurrentSchedule();
  }, [doctorId]);

  const fetchCurrentSchedule = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("doctor_schedule_template")
        .select("day_of_week, start_time, end_time")
        .eq("doctor_id", doctorId)
        .order("day_of_week", { ascending: true })
        .order("start_time");

      if (error) throw error;

      const grouped = {};
      data.forEach((item) => {
        const day = item.day_of_week.trim();
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({
          start: item.start_time.slice(0, 5),
          end: item.end_time.slice(0, 5),
        });
      });

      setSchedules(grouped);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải lịch làm việc hiện tại");
    } finally {
      setFetching(false);
    }
  };

  // ===== LOGIC GIỮ NGUYÊN TỪ CREATE (rất hay) =====
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
      if (toMinutes(sorted[i].end) > toMinutes(sorted[i + 1].start))
        return true;
    }
    return false;
  };

  const addSlot = (day) => {
    const slots = schedules[day] || [];
    let start = "08:00";
    let end = "09:00";

    if (slots.length > 0) {
      const last = slots[slots.length - 1];
      const nextStart = toMinutes(last.end) + 60;
      if (nextStart < 1440) {
        const h = Math.floor(nextStart / 60);
        const m = nextStart % 60;
        start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        end = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
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

  // ===== LƯU THAY ĐỔI =====
  const handleSave = async () => {
    const allSlots = Object.values(schedules).flat();
    if (allSlots.length === 0) {
      return Alert.alert(
        "Thiếu lịch",
        "Vui lòng thêm ít nhất 1 khung giờ làm việc"
      );
    }

    // Validate từng ngày
    for (const [day, slots] of Object.entries(schedules)) {
      if (hasOverlap(slots)) {
        return Alert.alert("Lỗi", `${day}: Có khung giờ bị chồng chéo`);
      }
      for (const slot of slots) {
        if (!isValidTime(slot.start) || !isValidTime(slot.end)) {
          return Alert.alert(
            "Sai định dạng",
            `${day}: Giờ phải có dạng HH:MM (ví dụ 08:00)`
          );
        }
        if (toMinutes(slot.start) >= toMinutes(slot.end)) {
          return Alert.alert(
            "Lỗi giờ",
            `${day}: Giờ kết thúc phải sau giờ bắt đầu`
          );
        }
      }
    }

    setLoading(true);
    try {
      // Bước 1: Xóa hết lịch cũ
      const { error: deleteError } = await supabase
        .from("doctor_schedule_template")
        .delete()
        .eq("doctor_id", doctorId);

      if (deleteError) throw deleteError;

      // Bước 2: Insert lịch mới
      if (allSlots.length > 0) {
        const inserts = Object.entries(schedules).flatMap(([day, slots]) =>
          slots.map((slot) => ({
            doctor_id: doctorId,
            day_of_week: day,
            start_time: `${slot.start}:00`,
            end_time: `${slot.end}:00`,
            max_patients_per_slot: 10, // hoặc lấy từ doctor info nếu cần
          }))
        );

        const { error: insertError } = await supabase
          .from("doctor_schedule_template")
          .insert(inserts);

        if (insertError) throw insertError;
      }

      Alert.alert("Thành công", "Đã cập nhật lịch làm việc thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể cập nhật lịch làm việc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={{ marginTop: 16, fontSize: 16, color: COLORS.textSecondary }}
        >
          Đang tải lịch làm việc...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Sửa lịch làm việc</Text>
          <Text style={styles.subtitle}>{doctorName || "Bác sĩ"}</Text>
        </View>

        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Khung giờ làm việc cố định</Text>

        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayText}>{day}</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => addSlot(day)}
              >
                <Ionicons name="add" size={18} color="#FFF" />
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
                    keyboardType="numeric"
                  />
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#64748B"
                    style={{ marginHorizontal: 12 }}
                  />

                  <TextInput
                    style={styles.timeInput}
                    value={slot.end}
                    onChangeText={(t) => updateTime(day, i, "end", t)}
                    placeholder="12:00"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => removeSlot(day, i)}
                    style={{
                      marginLeft: "auto",
                      backgroundColor: "#FEE2E2",
                      padding: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Ionicons name="trash" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyDay}>
                Chưa có khung giờ • Nghỉ cả ngày
              </Text>
            )}
          </View>
        ))}

        <TouchableOpacity
          disabled={loading}
          onPress={handleSave}
          style={styles.saveBtn}
        >
          <LinearGradient
            colors={GRADIENTS.primaryButton}
            style={styles.saveBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="save" size={26} color="#FFF" />
                <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Styles giống hệt CreateDoctorScheduleScreen
const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 64 : 44,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
    borderBottomRightRadius: BORDER_RADIUS.xxxl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: "#E0F2FE",
    marginTop: 4,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: SPACING.lg,
    color: COLORS.textPrimary,
  },
  dayBlock: {
    backgroundColor: "#F1F5F9",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#FFF",
    fontWeight: "700",
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.card,
  },
  timeInput: {
    width: 88,
    height: 46,
    backgroundColor: "#F8FAFC",
    borderRadius: BORDER_RADIUS.lg,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  emptyDay: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  saveBtn: {
    marginTop: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.large,
  },
  saveBtnGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
    marginLeft: 12,
    letterSpacing: 0.6,
  },
};
