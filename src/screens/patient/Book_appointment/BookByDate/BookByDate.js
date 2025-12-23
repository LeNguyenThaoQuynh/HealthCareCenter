import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

import { useBookingFlow } from "../../../../controllers/patient/bookingController";
import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
} from "../../../../theme/theme";

const { width } = Dimensions.get('window');

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
      activeOpacity: 0.7,
    };
  });

  // Highlight ngày đã chọn
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: COLORS.primary,
      selectedTextColor: "#FFFFFF",
      customStyles: {
        container: {
          borderRadius: 12,
          elevation: 5,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        },
        text: {
          fontWeight: '800',
        }
      }
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

  // Custom theme cho calendar
  const calendarTheme = {
    backgroundColor: "#FFFFFF",
    calendarBackground: "#FFFFFF",
    textSectionTitleColor: "#64748B",
    selectedDayBackgroundColor: COLORS.primary,
    selectedDayTextColor: "#FFFFFF",
    todayTextColor: COLORS.primary,
    todayBackgroundColor: "rgba(99, 102, 241, 0.1)",
    dayTextColor: "#1E293B",
    textDisabledColor: "#CBD5E1",
    dotColor: COLORS.primary,
    selectedDotColor: "#FFFFFF",
    arrowColor: COLORS.primary,
    monthTextColor: COLORS.primary,
    indicatorColor: COLORS.primary,
    textDayFontFamily: "System",
    textMonthFontFamily: "System",
    textDayHeaderFontFamily: "System",
    textDayFontWeight: "600",
    textMonthFontWeight: "800",
    textDayHeaderFontWeight: "700",
    textDayFontSize: 16,
    textMonthFontSize: 22,
    textDayHeaderFontSize: 14,
    "stylesheet.calendar.header": {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        marginTop: 10,
        marginBottom: 20,
      },
      monthText: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.primary,
      },
      arrow: {
        padding: 10,
      }
    },
    "stylesheet.calendar.main": {
      container: {
        padding: 16,
      },
    },
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient 
        colors={[COLORS.primary, "#4F46E5"]}
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
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Animated.Text 
              entering={FadeInDown.duration(500)}
              style={styles.headerTitle}
            >
              Chọn Ngày Khám
            </Animated.Text>
            <Animated.Text 
              entering={FadeInDown.delay(100).duration(500)}
              style={styles.headerSubtitle}
            >
              Lịch khám có sẵn trong 30 ngày tới
            </Animated.Text>
          </View>

          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.replace("HomeScreen")}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* LOADING OVERLAY */}
      {loadingDates && (
        <Animated.View 
          entering={ZoomIn}
          style={styles.loadingOverlay}
        >
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
            <Text style={styles.loadingSubtext}>Vui lòng chờ trong giây lát</Text>
          </View>
        </Animated.View>
      )}

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.calendarWrapper}
        >
          <LinearGradient
            colors={["#FFFFFF", "#F8FAFC"]}
            style={styles.calendarContainer}
          >
            <Calendar
              current={today}
              minDate={today}
              maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={calendarTheme}
              hideExtraDays={true}
              firstDay={1}
              enableSwipeMonths={true}
              disableArrowLeft={false}
              disableArrowRight={false}
              style={styles.calendar}
              markingType={'custom'}
            />
          </LinearGradient>
        </Animated.View>

        {/* INFO SECTION */}
        <Animated.View 
          entering={FadeInUp.delay(400)}
          style={styles.infoSection}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
              <Text style={styles.infoTitle}>Hướng dẫn đặt lịch</Text>
            </View>
            
            <View style={styles.legend}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.dotAvailable]} />
                  <View style={styles.legendContent}>
                    <Text style={styles.legendTitle}>Ngày có lịch</Text>
                    <Text style={styles.legendDesc}>Có bác sĩ khám trực</Text>
                  </View>
                </View>
                
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.dotUnavailable]} />
                  <View style={styles.legendContent}>
                    <Text style={styles.legendTitle}>Ngày nghỉ</Text>
                    <Text style={styles.legendDesc}>Không có lịch khám</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.dotSelected]} />
                <View style={styles.legendContent}>
                  <Text style={styles.legendTitle}>Ngày đã chọn</Text>
                  <Text style={styles.legendDesc}>Ngày bạn đã chọn</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.noteBox}>
              <Ionicons name="warning-outline" size={18} color="#F59E0B" />
              <Text style={styles.note}>
                Chỉ chọn ngày có dấu chấm xanh để tiếp tục đặt lịch
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    textAlign: "center",
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 28,
    alignItems: "center",
    width: width * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarWrapper: {
    marginTop: 20,
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  calendar: {
    borderRadius: 28,
  },
  infoSection: {
    marginTop: 24,
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  legend: {
    gap: 20,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  legendDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  dotAvailable: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  dotUnavailable: {
    backgroundColor: "rgba(203, 213, 225, 0.3)",
  },
  dotSelected: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  legendContent: {
    flex: 1,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  legendDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  note: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#92400E",
    lineHeight: 20,
  },
});