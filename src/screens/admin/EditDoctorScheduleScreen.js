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
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation, useRoute } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS } = theme;
const { width } = Dimensions.get("window");

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải lịch làm việc...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* StatusBar riêng biệt */}
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* HEADER - ĐÃ FIX KHÔNG CÒN TRỐNG */}
      <LinearGradient 
        colors={["#4f46e5", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.titleContainer}>
              <Ionicons name="calendar" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Chỉnh Sửa Lịch Làm</Text>
            </View>
            <Text style={styles.headerSubtitle}>{doctorName || "Bác sĩ"}</Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={["#e0e7ff", "#c7d2fe"]}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryContent}>
              <Ionicons name="time" size={28} color="#4f46e5" />
              <View style={styles.summaryTexts}>
                <Text style={styles.summaryTitle}>Tổng quan lịch làm việc</Text>
                <Text style={styles.summaryStats}>
                  {Object.values(schedules).flat().length} ca • {Object.keys(schedules).length}/7 ngày
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Khung giờ làm việc cố định</Text>

        {WEEKDAYS.map((day, index) => (
          <View key={day} style={styles.dayCard}>
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              style={styles.dayCardGradient}
            >
              {/* DAY HEADER */}
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <View style={[
                    styles.dayIconContainer,
                    { backgroundColor: (schedules[day] || []).length > 0 ? "#dcfce7" : "#f1f5f9" }
                  ]}>
                    <Ionicons 
                      name={(schedules[day] || []).length > 0 ? "checkmark-circle" : "calendar-outline"} 
                      size={20} 
                      color={(schedules[day] || []).length > 0 ? "#10b981" : "#94a3b8"} 
                    />
                  </View>
                  <View>
                    <Text style={styles.dayText}>{day}</Text>
                    <Text style={styles.daySubtext}>
                      {(schedules[day] || []).length > 0 
                        ? `${(schedules[day] || []).length} ca làm việc` 
                        : "Nghỉ cả ngày"}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addSlot(day)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#4f46e5", "#7c3aed"]}
                    style={styles.addButtonGradient}
                  >
                    <Ionicons name="add" size={18} color="#FFF" />
                    <Text style={styles.addButtonText}>Thêm ca</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* TIME SLOTS */}
              <View style={styles.slotsContainer}>
                {(schedules[day] || []).length > 0 ? (
                  schedules[day].map((slot, i) => (
                    <View key={i} style={styles.slotCard}>
                      <LinearGradient
                        colors={["#f0f9ff", "#e0f2fe"]}
                        style={styles.slotGradient}
                      >
                        <View style={styles.slotContent}>
                          <View style={styles.timeInputs}>
                            <View style={styles.timeInputContainer}>
                              <Ionicons name="play" size={16} color="#0ea5e9" style={{ marginRight: 6 }} />
                              <TextInput
                                style={styles.timeInput}
                                value={slot.start}
                                onChangeText={(t) => updateTime(day, i, "start", t)}
                                placeholder="08:00"
                                keyboardType="numeric"
                                placeholderTextColor="#94a3b8"
                                selectionColor="#4f46e5"
                              />
                              <Text style={styles.timeLabel}>Bắt đầu</Text>
                            </View>

                            <Ionicons
                              name="arrow-forward"
                              size={20}
                              color="#cbd5e1"
                              style={{ marginHorizontal: 16 }}
                            />

                            <View style={styles.timeInputContainer}>
                              <Ionicons name="stop" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                              <TextInput
                                style={styles.timeInput}
                                value={slot.end}
                                onChangeText={(t) => updateTime(day, i, "end", t)}
                                placeholder="12:00"
                                keyboardType="numeric"
                                placeholderTextColor="#94a3b8"
                                selectionColor="#4f46e5"
                              />
                              <Text style={styles.timeLabel}>Kết thúc</Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            onPress={() => removeSlot(day, i)}
                            style={styles.deleteButton}
                            activeOpacity={0.7}
                          >
                            <LinearGradient
                              colors={["#fee2e2", "#fecaca"]}
                              style={styles.deleteButtonGradient}
                            >
                              <Ionicons name="trash" size={16} color="#ef4444" />
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptySlot}>
                    <Ionicons name="time-outline" size={32} color="#cbd5e1" />
                    <Text style={styles.emptySlotText}>Chưa có khung giờ làm việc</Text>
                    <Text style={styles.emptySlotHint}>Nhấn "Thêm ca" để bắt đầu</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
        ))}

        {/* SAVE BUTTON */}
        <TouchableOpacity
          disabled={loading}
          onPress={handleSave}
          style={styles.saveContainer}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="save" size={24} color="#FFF" />
                <Text style={styles.saveText}>LƯU THAY ĐỔI LỊCH LÀM VIỆC</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* NOTE */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color="#64748b" />
          <Text style={styles.noteText}>
            Lịch làm việc sẽ được áp dụng cho tất cả các tuần
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  // ✅ HEADER ĐÃ FIX - SÁT TOP + CONTENT PADDING TOP 60
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 4 : 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  headerRight: {
    width: 44,
  },
  content: {
    paddingTop: 60, // ✅ CONTENT CÓ PADDING TOP 60
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryGradient: {
    padding: 24,
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryTexts: {
    marginLeft: 16,
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  summaryStats: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 20,
    marginLeft: 4,
  },
  dayCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  dayCardGradient: {
    padding: 20,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  dayIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
  },
  daySubtext: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  slotsContainer: {
    marginTop: 4,
  },
  slotCard: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  slotGradient: {
    padding: 16,
  },
  slotContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInputs: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timeInputContainer: {
    alignItems: "center",
  },
  timeInput: {
    width: 88,
    height: 52,
    backgroundColor: "#FFF",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
  },
  timeLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 6,
    fontWeight: "500",
  },
  deleteButton: {
    marginLeft: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  deleteButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySlot: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  emptySlotText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 12,
  },
  emptySlotHint: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  saveContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 32,
    marginBottom: 20,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  saveGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  saveText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100, 116, 139, 0.05)",
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.1)",
    gap: 8,
  },
  noteText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
};