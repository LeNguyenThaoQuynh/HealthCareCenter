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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../../api/supabase";

const { width } = Dimensions.get('window');

const Colors = {
  primary: "#6366F1",
  primaryLight: "#C7D2FE",
  primarySoft: "#EEF2FF",
  secondary: "#8B5CF6",
  accent: "#10B981",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  availableBg: "#E0E7FF",
  availableBorder: "#818CF8",
  availableText: "#3730A3",
  todayBg: "#DBEAFE",
  todayText: "#1D4ED8",
  disabledText: "#CBD5E1",
  success: "#10B981",
  gradientStart: "#667EEA",
  gradientEnd: "#764BA2",
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

  const getMonthName = (month) => {
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];
    return months[month];
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOffset = ((new Date(year, month, 1).getDay() + 6) % 7);
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
        activeOpacity={0.7}
        style={[
          styles.dayContainer,
          isAvailable && !isPast && styles.dayAvailable,
          isToday && styles.dayToday,
          isSelected && styles.daySelected,
        ]}
      >
        <Animated.View 
          style={[
            styles.dayInner,
            isSelected && { backgroundColor: Colors.primary }
          ]}
        >
          <Text style={[
            styles.dayText,
            isAvailable && !isPast && styles.dayAvailableText,
            isToday && styles.dayTodayText,
            (!isAvailable || isPast) && styles.dayDisabledText,
            isSelected && styles.daySelectedText,
          ]}>
            {day}
          </Text>
          
          {isToday && !isSelected && (
            <View style={styles.todayIndicator}>
              <View style={styles.todayDot} />
            </View>
          )}
          
          {isAvailable && !isPast && !isToday && !isSelected && (
            <View style={styles.availableDot} />
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER GRADIENT */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName} numberOfLines={1}>
              BS. {doctor?.name || "Bác sĩ"}
            </Text>
            <Text style={styles.doctorSpec} numberOfLines={1}>
              {Array.isArray(doctor?.specializations)
                ? doctor.specializations.join(" • ")
                : doctor?.department_name || "Chưa cập nhật"}
            </Text>
          </View>

          {doctor?.avatar_url ? (
            <Image 
              source={{ uri: doctor.avatar_url }} 
              style={styles.doctorAvatar} 
            />
          ) : (
            <LinearGradient
              colors={["#FFFFFF", "#F3F4F6"]}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarLetter}>
                {doctor?.name?.[0]?.toUpperCase() || "B"}
              </Text>
            </LinearGradient>
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <Animated.View entering={FadeInUp} style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
          </Animated.View>
        ) : schedule.length === 0 ? (
          <Animated.View entering={FadeInUp} style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={80} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Bác sĩ chưa có lịch khám</Text>
            <Text style={styles.emptySubtitle}>Vui lòng quay lại sau hoặc chọn bác sĩ khác</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.emptyButtonText}>Quay lại danh sách</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            <Animated.View 
              entering={FadeInDown.delay(100).duration(500)} 
              style={styles.calendarCard}
            >
              <View style={styles.calendarHeader}>
                <LinearGradient
                  colors={["#FFFFFF", "#F8FAFC"]}
                  style={styles.monthSelector}
                >
                  <TouchableOpacity 
                    onPress={prevMonth} 
                    disabled={isCurrentMonth}
                    style={styles.monthButton}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={22}
                      color={isCurrentMonth ? Colors.disabledText : Colors.primary}
                    />
                  </TouchableOpacity>
                  
                  <View style={styles.monthDisplay}>
                    <Text style={styles.monthName}>{getMonthName(month)}</Text>
                    <Text style={styles.monthYear}>{year}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={nextMonth}
                    style={styles.monthButton}
                  >
                    <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
                  </TouchableOpacity>
                </LinearGradient>

                {/* DAYS OF WEEK */}
                <View style={styles.weekdaysContainer}>
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, index) => (
                    <View key={day} style={styles.weekdayItem}>
                      <Text style={styles.weekdayText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* DAYS GRID */}
                <View style={styles.daysGrid}>
                  {Array.from({ length: 42 }, (_, i) => renderDay(i))}
                </View>
              </View>
            </Animated.View>

            <Animated.View 
              entering={ZoomIn.delay(300)} 
              style={styles.legendContainer}
            >
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendToday]} />
                <Text style={styles.legendText}>Hôm nay</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendAvailable]} />
                <Text style={styles.legendText}>Có lịch</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDisabled]} />
                <Text style={styles.legendText}>Không khám</Text>
              </View>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400)}
              style={styles.infoCard}
            >
              <View style={styles.infoIcon}>
                <Ionicons name="information-circle" size={24} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Thông tin lịch khám</Text>
                <Text style={styles.infoText}>
                  Chỉ hiển thị những ngày bác sĩ có lịch khám theo mẫu đã cập nhật. 
                  Chọn ngày có sẵn để xem khung giờ chi tiết.
                </Text>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.bg 
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: { 
    color: "white", 
    fontSize: 20, 
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  doctorSpec: { 
    color: "rgba(255, 255, 255, 0.9)", 
    fontSize: 14, 
    marginTop: 4,
    fontWeight: "500",
  },
  doctorAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    borderWidth: 3, 
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarLetter: { 
    color: Colors.primary, 
    fontSize: 22, 
    fontWeight: "bold" 
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loading: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingTop: 100,
    minHeight: 400,
  },
  loadingText: { 
    marginTop: 20, 
    fontSize: 16, 
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  empty: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingTop: 100,
    minHeight: 400,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: Colors.textPrimary, 
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: { 
    fontSize: 16, 
    color: Colors.textSecondary, 
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 25,
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  calendarCard: {
    backgroundColor: Colors.card,
    margin: 20,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  calendarHeader: {
    padding: 20,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  monthDisplay: {
    alignItems: "center",
  },
  monthName: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  monthYear: { 
    fontSize: 16, 
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  weekdaysContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  weekdayItem: {
    width: `${100 / 7}%`,
    alignItems: "center",
  },
  weekdayText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: Colors.textSecondary,
  },
  daysGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap",
  },
  dayContainer: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  dayInner: {
    width: "85%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    position: "relative",
  },
  dayText: { 
    fontSize: 16, 
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  dayAvailable: {},
  dayAvailableText: { 
    color: Colors.availableText, 
    fontWeight: "700",
  },
  dayToday: {},
  dayTodayText: { 
    color: Colors.todayText, 
    fontWeight: "800",
  },
  daySelected: {},
  daySelectedText: { 
    color: "white", 
    fontWeight: "700",
  },
  dayDisabledText: { 
    color: Colors.disabledText,
  },
  todayDot: {
    position: "absolute",
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.todayText,
  },
  availableDot: {
    position: "absolute",
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.availableBorder,
  },
  todayIndicator: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendToday: {
    backgroundColor: Colors.todayText,
    borderWidth: 2,
    borderColor: Colors.todayText,
  },
  legendAvailable: {
    backgroundColor: Colors.availableBorder,
  },
  legendDisabled: {
    backgroundColor: Colors.disabledText,
  },
  legendText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});