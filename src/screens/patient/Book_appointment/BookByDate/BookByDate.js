import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";

import { useBookingFlow } from "../../../../controllers/patient/bookingController";
import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
} from "../../../../theme/theme";

export default function BookByDate() {
  const navigation = useNavigation();

  const {
    selectedDate,
    availableDates,
    loadingDates,
    setSelectedDate,
    loadAvailableDates,
  } = useBookingFlow();

  // Load ngày có lịch khi vào màn hình (chỉ gọi 1 lần/ngày)
  useEffect(() => {
    loadAvailableDates();
  }, [loadAvailableDates]);

  // Tạo marked dates cho Calendar
  const markedDates = {};
  availableDates.forEach((date) => {
    markedDates[date] = {
      marked: true,
      dotColor: COLORS.primary,
    };
  });

  // Highlight ngày đã chọn
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: COLORS.primary,
      selectedTextColor: "#FFFFFF",
    };
  }

  const handleDayPress = (day) => {
    const dateString = day.dateString;

    if (!availableDates.includes(dateString)) {
      // Optional: rung nhẹ hoặc toast "Ngày không có lịch"
      return;
    }

    setSelectedDate(dateString);
    navigation.navigate("SelectSpecialization", { date: dateString });
  };

  const today = new Date().toISOString().split("T")[0];

  // "2025-12-11"

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chọn ngày khám</Text>

        <TouchableOpacity onPress={() => navigation.replace("HomeScreen")}>
          <Ionicons name="home-outline" size={26} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* LOADING OVERLAY */}
      {loadingDates && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
        </View>
      )}

      <View style={styles.calendarContainer}>
        <Calendar
          current={today}
          minDate={today}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#b6c1cd",
            selectedDayBackgroundColor: COLORS.primary,
            selectedDayTextColor: "#ffffff",
            todayTextColor: COLORS.primary,
            todayBackgroundColor: COLORS.primary + "20",
            dayTextColor: "#2d4150",
            textDisabledColor: "#d9e1e8",
            dotColor: COLORS.primary,
            selectedDotColor: "#ffffff",
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.primary,
            indicatorColor: COLORS.primary,
            textDayFontWeight: "600",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "600",
            textDayFontSize: 16,
            textMonthFontSize: 20,
          }}
          hideExtraDays={true}
          firstDay={1} // Thứ 2 là đầu tuần
          enableSwipeMonths={true}
          disableArrowLeft={false}
          disableArrowRight={false}
        />
      </View>

      {/* LEGEND */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Có lịch khám</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#94A3B8" }]} />
          <Text style={styles.legendText}>Ngày nghỉ</Text>
        </View>
      </View>

      <Text style={styles.note}>Chỉ chọn ngày có chấm xanh để đặt lịch</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
  },
  calendarContainer: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
    gap: 40,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  note: {
    textAlign: "center",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxxl,
    fontSize: FONT_SIZE.base,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
