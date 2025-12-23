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

export default function CreateDoctorScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorInfo } = route.params;

  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);

  // Format time HH:MM
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
      const lastEnd = toMinutes(last.end);
      const nextStart = lastEnd + 60;
      if (nextStart < 24 * 60) {
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

  const handleCreate = async () => {
    const allSlots = Object.values(schedules).flat();
    if (allSlots.length === 0) {
      return Alert.alert(
        "Thiếu lịch",
        "Vui lòng thêm ít nhất 1 khung giờ làm việc"
      );
    }

    for (const [day, slots] of Object.entries(schedules)) {
      if (hasOverlap(slots)) {
        return Alert.alert("Lỗi", `${day}: Có khung giờ bị chồng chéo`);
      }
      for (const slot of slots) {
        if (!isValidTime(slot.start) || !isValidTime(slot.end)) {
          return Alert.alert(
            "Sai định dạng",
            `${day}: Giờ phải có dạng HH:MM (ví dụ: 08:00)`
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
    Alert.alert("Đang tạo bác sĩ", "Vui lòng chờ một chút...", [], {
      cancelable: false,
    });

    try {
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: doctorInfo.email,
          password: doctorInfo.password,
          email_confirm: true,
          user_metadata: { full_name: doctorInfo.fullName },
        });

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Không tạo được user");

      const userId = authData.user.id;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          full_name: doctorInfo.fullName,
          email: doctorInfo.email,
          role_id: 2,
        });

      if (profileError) throw profileError;

      const { error: doctorError } = await supabase.from("doctors").insert({
        id: userId,
        name: doctorInfo.fullName,
        service_id: doctorInfo.service_id || null,
        specialization: doctorInfo.specialization,
        experience_years: doctorInfo.experience_years,
        room_number: doctorInfo.room_number,
        max_patients_per_slot: doctorInfo.max_patients_per_slot || 10,
        bio: doctorInfo.bio,
        department_name: doctorInfo.department_name,
      });

      if (doctorError) throw doctorError;

      const { error: roomError } = await supabase
        .from("clinic_rooms")
        .update({
          doctor_id: userId,
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("room_number", doctorInfo.room_number);

      if (roomError) {
        console.warn("Cảnh báo gán phòng:", roomError);
      } else {
        console.log("Phòng đã được gán thành công:", doctorInfo.room_number);
      }

      const scheduleInserts = Object.entries(schedules).flatMap(
        ([day, slots]) =>
          slots.map((slot) => ({
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

      Alert.alert(
        "🎉 HOÀN TẤT!",
        `Đã tạo thành công bác sĩ:\n\n👨‍⚕️ ${doctorInfo.fullName}\n📧 ${doctorInfo.email}\n🏥 Phòng: ${doctorInfo.room_number}\n🏨 Khoa: ${doctorInfo.department_name}\n🎯 Chuyên môn: ${doctorInfo.specialization}\n📅 ${allSlots.length} khung giờ làm việc`,
        [
          {
            text: "Xem danh sách",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "ManageDoctors" }],
              }),
          },
        ]
      );
    } catch (err) {
      console.error("Lỗi tạo bác sĩ:", err);
      let message = "Không thể tạo bác sĩ. Vui lòng thử lại!";
      if (
        err.message?.includes("duplicate") ||
        err.message?.includes("already")
      ) {
        message = "Email hoặc phòng khám đã được sử dụng!";
      }
      Alert.alert("❌ Lỗi", message);
    } finally {
      setLoading(false);
    }
  };

  const totalSlots = Object.values(schedules).flat().length;
  const workingDays = Object.keys(schedules).length;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* StatusBar riêng biệt */}
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* HEADER - SÁT MÉP TRÊN, KHÔNG CÒN KHOẢNG TRỐNG */}
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
              <Text style={styles.headerTitle}>Thiết Lập Lịch Làm Việc</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Bước 2/2 • {doctorInfo.fullName}
            </Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* DOCTOR INFO CARD */}
        <View style={styles.doctorCard}>
          <LinearGradient
            colors={["#e0e7ff", "#c7d2fe"]}
            style={styles.doctorCardGradient}
          >
            <View style={styles.doctorInfoHeader}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>
                  {doctorInfo.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.doctorMainInfo}>
                <Text style={styles.doctorName}>{doctorInfo.fullName}</Text>
                <Text style={styles.doctorEmail}>{doctorInfo.email}</Text>
              </View>
            </View>

            <View style={styles.doctorDetailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="home" size={16} color="#4f46e5" />
                <Text style={styles.detailText}>P{doctorInfo.room_number}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="business" size={16} color="#4f46e5" />
                <Text style={styles.detailText}>{doctorInfo.department_name}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="medkit" size={16} color="#4f46e5" />
                <Text style={styles.detailText}>{doctorInfo.specialization}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color="#4f46e5" />
                <Text style={styles.detailText}>{doctorInfo.experience_years} năm KN</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* SCHEDULE SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-number" size={24} color="#4f46e5" />
              <Text style={styles.summaryNumber}>{workingDays}</Text>
              <Text style={styles.summaryLabel}>Ngày làm</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="time" size={24} color="#4f46e5" />
              <Text style={styles.summaryNumber}>{totalSlots}</Text>
              <Text style={styles.summaryLabel}>Khung giờ</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="people" size={24} color="#4f46e5" />
              <Text style={styles.summaryNumber}>
                {doctorInfo.max_patients_per_slot || 10}
              </Text>
              <Text style={styles.summaryLabel}>BN/ca</Text>
            </View>
          </View>
        </View>

        {/* SCHEDULE TITLE */}
        <View style={styles.scheduleHeader}>
          <Ionicons name="alarm" size={24} color="#4f46e5" />
          <Text style={styles.scheduleTitle}>Khung giờ làm việc</Text>
        </View>

        {/* DAY SCHEDULES */}
        {WEEKDAYS.map((day, index) => (
          <View key={day} style={styles.dayCard}>
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              style={styles.dayCardGradient}
            >
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
                        : "Chưa có lịch"}
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
                              <Text style={styles.timeLabel}>Bắt đầu</Text>
                              <TextInput
                                style={styles.timeInput}
                                value={slot.start}
                                onChangeText={(t) => updateTime(day, i, "start", t)}
                                placeholder="08:00"
                                maxLength={5}
                                keyboardType="numeric"
                                placeholderTextColor="#94a3b8"
                                selectionColor="#4f46e5"
                              />
                            </View>

                            <Ionicons
                              name="arrow-forward"
                              size={20}
                              color="#cbd5e1"
                              style={{ marginHorizontal: 16 }}
                            />

                            <View style={styles.timeInputContainer}>
                              <Text style={styles.timeLabel}>Kết thúc</Text>
                              <TextInput
                                style={styles.timeInput}
                                value={slot.end}
                                onChangeText={(t) => updateTime(day, i, "end", t)}
                                placeholder="12:00"
                                maxLength={5}
                                keyboardType="numeric"
                                placeholderTextColor="#94a3b8"
                                selectionColor="#4f46e5"
                              />
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
                    <Text style={styles.emptySlotText}>Chưa có khung giờ</Text>
                    <Text style={styles.emptySlotHint}>Nhấn "Thêm ca" để bắt đầu</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
        ))}

        {/* CREATE BUTTON */}
        <TouchableOpacity
          style={styles.createContainer}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={28} color="#FFF" />
                <View style={styles.createTextContainer}>
                  <Text style={styles.createMainText}>HOÀN TẤT TẠO BÁC SĨ</Text>
                  <Text style={styles.createSubText}>
                    Tổng {totalSlots} khung giờ • {workingDays} ngày làm việc
                  </Text>
                </View>
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
  // ✅ HEADER SÁT MÉP TRÊN, KHÔNG CÒN KHOẢNG TRỐNG
  header: {
    paddingTop: 60, // Rất nhỏ để StatusBar không bị che
    paddingBottom: 20,
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
    paddingTop: Platform.OS === "ios" ? 8 : 4, // Padding nhẹ trong content
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

  // ✅ THÊM KHOẢNG CÁCH ~60px TỪ HEADER XUỐNG NỘI DUNG
  content: {
    padding: 20,
    paddingTop: 60, // ← Đây là phần bạn yêu cầu: thêm padding top 60
    paddingBottom: 100,
  },

  doctorCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  doctorCardGradient: {
    padding: 24,
  },
  doctorInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  doctorAvatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
  },
  doctorMainInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  doctorEmail: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },
  doctorDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#4f46e5",
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e2e8f0",
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
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
  timeLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 6,
    fontWeight: "500",
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
  createContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 32,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  createGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 16,
  },
  createTextContainer: {
    flex: 1,
  },
  createMainText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  createSubText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100, 116, 139, 0.05)",
    marginTop: 20,
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