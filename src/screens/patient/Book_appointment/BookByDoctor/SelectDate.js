// screens/SelectDate.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { supabase } from "../../../../api/supabase";

const Colors = {
  primary: "#1D4ED8",
  primaryLight: "#DBEAFE",
  primarySoft: "#EEF2FF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  availableBg: "#E0E7FF",
  availableBorder: "#6366F1",
  availableText: "#312E81",
  todayBg: "#DBEAFE",
  todayText: "#1D4ED8",
  disabledText: "#94A3B8",
};

// MAP NGÀY TIẾNG VIỆT → INDEX (0 = Thứ 2, 6 = Chủ nhật)
const DAY_MAP = {
  "Thứ 2": 0, "Thu 2": 0, "T2": 0, "Thứ hai": 0,
  "Thứ 3": 1, "Thu 3": 1, "T3": 1, "Thứ ba": 1,
  "Thứ 4": 2, "Thu 4": 2, "T4": 2, "Thứ tư": 2,
  "Thứ 5": 3, "Thu 5": 3, "T5": 3, "Thứ năm": 3,
  "Thứ 6": 4, "Thu 6": 4, "T6": 4, "Thứ sáu": 4,
  "Thứ 7": 5, "Thu 7": 5, "T7": 5, "Thứ bảy": 5,
  "Chủ nhật": 6, "CN": 6,
};

const normalizeDay = (day) => {
  if (!day) return null;
  const cleaned = day.trim();
  return DAY_MAP[cleaned] ?? null;
};

// HÀM FIX MÚI GIỜ VIỆT NAM (UTC+7) – QUAN TRỌNG NHẤT!
const getVietnamToday = () => {
  const now = new Date();
  const offset = 7 * 60; // UTC+7 (phút)
  const localTime = now.getTime();
  const localOffset = now.getTimezoneOffset(); // phút của thiết bị
  const vietnamTime = localTime + (offset + localOffset) * 60 * 1000;
  const vietnamDate = new Date(vietnamTime);
  vietnamDate.setHours(0, 0, 0, 0);
  return vietnamDate;
};

export default function SelectDate() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedDate: preselectedDate } = route.params || {};

  const [schedule, setSchedule] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // ĐÃ FIX MÚI GIỜ – HÔM NAY LUÔN ĐÚNG!
  const today = getVietnamToday();

  React.useEffect(() => {
    if (!doctor?.id) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin bác sĩ.");
      navigation.goBack();
      return;
    }
    loadSchedule();
  }, [doctor?.id]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctor_schedule_template")
        .select("day_of_week, start_time, end_time")
        .eq("doctor_id", doctor.id);

      if (error) throw error;
      setSchedule(data || []);
    } catch (err) {
      console.error("Lỗi tải lịch:", err);
      Alert.alert("Lỗi", "Không thể tải lịch bác sĩ.");
    } finally {
      setLoading(false);
    }
  };

  // Danh sách ngày có lịch trong 6 tháng tới
  const availableDates = React.useMemo(() => {
    if (!schedule.length) return [];

    const dates = new Set();
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 6);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0=Chủ nhật, 1=Thứ 2...
      const vnIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const hasShift = schedule.some(s => normalizeDay(s.day_of_week) === vnIndex);
      if (hasShift) {
        // Dùng getVietnamDate để đảm bảo đúng ngày VN
        const vnDate = new Date(d.getTime() + 7 * 3600000);
        dates.add(vnDate.toISOString().split("T")[0]);
      }
    }
    return Array.from(dates);
  }, [schedule]);

  const handleSelect = (dateStr) => {
    navigation.navigate("SelectTimeSlotDoctor", {
      doctor,
      selectedDate: dateStr,
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      const limit = new Date(today);
      limit.setMonth(limit.getMonth() + 5);
      return next > limit ? prev : next;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const p = new Date(prev);
      p.setMonth(prev.getMonth() - 1);
      const min = new Date(today.getFullYear(), today.getMonth(), 1);
      return p < min ? prev : p;
    });
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOffset = ((new Date(year, month, 1).getDay() + 6) % 7); // Thứ 2 là đầu tuần
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const renderDay = (index) => {
    const day = index - firstDayOffset + 1;
    if (day < 1 || day > daysInMonth) {
      return <View key={`empty-${index}`} style={styles.dayContainer} />;
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(dateStr);
    dateObj.setHours(0, 0, 0, 0);

    const isToday = dateObj.getTime() === today.getTime();
    const isPast = dateObj < today;
    const isAvailable = availableDates.includes(dateStr);
    const isSelected = preselectedDate === dateStr;

    return (
      <TouchableOpacity
        key={dateStr}
        disabled={!isAvailable || isPast}
        onPress={() => handleSelect(dateStr)}
        style={[
          styles.dayContainer,
          isAvailable && !isPast && styles.dayAvailable,
          isToday && styles.dayToday,
          isSelected && styles.daySelected,
        ]}
      >
        <Text style={[
          styles.dayText,
          isAvailable && !isPast && styles.dayAvailableText,
          isToday && styles.dayTodayText,
          (!isAvailable || isPast) && styles.dayDisabledText,
          isSelected && { color: "#FFFFFF" },
        ]}>
          {day}
        </Text>
        {isToday && <Text style={styles.todayTag}>Hôm nay</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER ĐẸP + ẢNH BÁC SĨ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.doctorName} numberOfLines={1}>
            BS. {doctor?.name || "Bác sĩ"}
          </Text>
          <Text style={styles.doctorSpec}>
            {Array.isArray(doctor?.specializations)
              ? doctor.specializations.join(" • ")
              : doctor?.department_name || "Chưa cập nhật"}
          </Text>
        </View>

        {doctor?.avatar_url ? (
          <Image source={{ uri: doctor.avatar_url }} style={styles.doctorAvatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>
              {doctor?.name?.[0]?.toUpperCase() || "B"}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tải lịch bác sĩ...</Text>
          </View>
        ) : schedule.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={72} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Bác sĩ chưa có lịch khám</Text>
            <Text style={styles.emptySubtitle}>Vui lòng quay lại sau</Text>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.calendarCard}>
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={prevMonth} disabled={isCurrentMonth}>
                  <Ionicons
                    name="chevron-back"
                    size={26}
                    color={isCurrentMonth ? Colors.disabledText : Colors.textPrimary}
                  />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>Tháng {month + 1}, {year}</Text>
                <TouchableOpacity onPress={nextMonth}>
                  <Ionicons name="chevron-forward" size={26} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdays}>
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
                  <Text key={d} style={styles.weekday}>{d}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {Array.from({ length: 42 }, (_, i) => renderDay(i))}
              </View>
            </Animated.View>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.noteText}>
                Chỉ hiển thị ngày bác sĩ có lịch khám theo mẫu. Chọn ngày để xem khung giờ.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  doctorName: { color: "white", fontSize: 18, fontWeight: "bold" },
  doctorSpec: { color: "#DBEAFE", fontSize: 13, marginTop: 4 },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "white" },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: "white", fontSize: 20, fontWeight: "bold" },

  loading: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.textSecondary },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 120 },
  emptyTitle: { fontSize: 19, fontWeight: "bold", color: Colors.textPrimary, marginTop: 20 },
  emptySubtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8 },

  calendarCard: {
    backgroundColor: Colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  monthHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  monthLabel: { fontSize: 19, fontWeight: "800", color: Colors.textPrimary },
  weekdays: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  weekday: { width: `${100 / 7}%`, textAlign: "center", fontWeight: "600", color: Colors.textSecondary, fontSize: 13 },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayContainer: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
    borderRadius: 16,
  },
  dayText: { fontSize: 16, fontWeight: "600" },
  dayAvailable: { backgroundColor: Colors.availableBg, borderWidth: 2, borderColor: Colors.availableBorder },
  dayAvailableText: { color: Colors.availableText, fontWeight: "700" },
  dayToday: { backgroundColor: Colors.todayBg, borderWidth: 2, borderColor: Colors.primary },
  dayTodayText: { color: Colors.todayText, fontWeight: "800" },
  daySelected: { backgroundColor: Colors.primary },
  dayDisabledText: { color: Colors.disabledText },
  todayTag: { fontSize: 9, marginTop: 4, color: Colors.primary, fontWeight: "bold" },
  noteBox: {
    marginHorizontal: 20,
    marginVertical: 16,
    flexDirection: "row",
    backgroundColor: Colors.primarySoft,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary,
  },
  noteText: { flex: 1, marginLeft: 12, fontSize: 14.5, color: Colors.textPrimary, lineHeight: 20 },
});