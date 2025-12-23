import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBookingFlow } from "../../../../controllers/patient/bookingController";
import { supabase } from "../../../../api/supabase";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

const { width } = Dimensions.get('window');

/* ================= HELPERS ================= */

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "Chưa chọn ngày";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/* ================= MAIN ================= */

export default function ConfirmBooking() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    date,
    specialization: specParam,
    slot,
    doctor,
    price: initialPrice = 180000,
  } = route.params || {};

  const { bookAppointment, bookingLoading } = useBookingFlow();

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [servicePrice, setServicePrice] = useState("180.000đ");

  /* ===== specialization & price ===== */

  const specialization =
    typeof specParam === "string"
      ? specParam
      : specParam?.name || "Không xác định";

  const finalPrice =
    typeof specParam === "object"
      ? specParam.price || initialPrice
      : initialPrice;

  /* ================= VALIDATE PARAMS ================= */

  useEffect(() => {
    if (!date || !specialization || !slot || !doctor) {
      Alert.alert("Lỗi", "Thiếu thông tin đặt lịch. Vui lòng thử lại.");
      navigation.goBack();
      return;
    }
    setServicePrice(finalPrice.toLocaleString("vi-VN") + "đ");
  }, [date, specialization, slot, doctor, finalPrice, navigation]);

  /* ================= AUTO FILL PATIENT ================= */

  useEffect(() => {
    const fetchPatientInfo = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single();

        if (profile) {
          setPatientName(profile.full_name || "");
          setPatientPhone(profile.phone || "");
        }
      } catch (err) {
        console.warn("Không lấy được thông tin bệnh nhân:", err);
      }
    };
    fetchPatientInfo();
  }, []);

  /* ================= CHECK TRÙNG CÙNG BÁC SĨ / NGÀY ================= */

  const checkAlreadyBookedSameDoctorSameDay = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("doctor_id", doctor.id)
      .eq("date", date)
      .in("status", ["pending", "confirmed", "paid"]);

    if (error) {
      console.error("Check booking error:", error);
      return false;
    }

    return data && data.length > 0;
  };

  /* ================= HANDLE BOOKING ================= */

  const handleBooking = async () => {
    if (!patientName.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập họ tên");

    if (!patientPhone.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");

    const cleanPhone = patientPhone.replace(/\D/g, "");
    if (!/^\d{10,11}$/.test(cleanPhone))
      return Alert.alert("Lỗi", "Số điện thoại không hợp lệ (10–11 số)");

    // 🔒 CHECK TRÙNG CÙNG BÁC SĨ + NGÀY
    const alreadyBooked =
      await checkAlreadyBookedSameDoctorSameDay();

    if (alreadyBooked) {
      return Alert.alert(
        "Không thể đặt lịch",
        "Bạn đã có lịch khám với bác sĩ này trong ngày. Vui lòng chọn giờ khác hoặc bác sĩ khác."
      );
    }

    const startTime =
      slot?.start_time || slot?.display?.split(" - ")[0] || "08:00";

    const result = await bookAppointment({
      doctorId: doctor.id,
      date,
      slotId: slot.id,
      startTime: startTime.trim(),
      patientName: patientName.trim(),
      patientPhone: cleanPhone,
      price: finalPrice,
      specialization,
    });

    if (result.success) {
      const appointment = result.data;

      const dateDisplay = formatDisplayDate(date);
      const timeDisplay =
        slot.display ||
        `${slot.start_time} - ${slot.end_time || "Kết thúc"}`;

      Alert.alert(
        "Đặt lịch thành công",
        `Bạn có muốn xem lịch hẹn của mình ngay không?\n\nMã phiếu khám: #${String(
          appointment.id
        ).padStart(6, "0")}`,
        [
          {
            text: "Quay về trang chủ",
            style: "cancel",
            onPress: () => navigation.replace("HomeScreen"),
          },
          {
            text: "Xem lịch hẹn",
            onPress: () => navigation.replace("HistoryScreen"),
          },
        ]
      );
    } else {
      const msg =
        result.error?.includes("duplicate") ||
        result.error?.includes("constraint")
          ? "Khung giờ này đã được đặt bởi người khác. Vui lòng chọn lại!"
          : result.error || "Có lỗi xảy ra, vui lòng thử lại";

      Alert.alert("Đặt lịch thất bại", msg);
    }
  };

  /* ================= DISPLAY ================= */

  const timeDisplay = slot
    ? `${slot.start_time} - ${slot.end_time || "..."}`
    : "—";

  const dateDisplay = formatDisplayDate(date);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667EEA" />
      
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.title} numberOfLines={1}>
                Xác Nhận Đặt Lịch
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                Kiểm tra thông tin cuối cùng
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => navigation.navigate("HomeScreen")}
              activeOpacity={0.8}
            >
              <Ionicons name="home-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ===== APPOINTMENT INFO CARD ===== */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={["#667EEA", "#764BA2"]}
              style={styles.cardIcon}
            >
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.cardTitle}>Chi tiết lịch khám</Text>
          </View>
          <View style={styles.divider} />

          <InfoRow
            icon="calendar-outline"
            label="Ngày khám"
            value={dateDisplay}
          />
          <InfoRow
            icon="time-outline"
            label="Giờ khám"
            value={timeDisplay}
          />
          <InfoRow
            icon="medical-outline"
            label="Chuyên khoa"
            value={specialization}
          />
          <InfoRow
            icon="person-outline"
            label="Bác sĩ"
            value={`BS. ${doctor?.name || "—"}`}
          />
          {doctor?.room_number && (
            <InfoRow
              icon="location-outline"
              label="Phòng khám"
              value={`P. ${doctor.room_number}`}
            />
          )}
        </Animated.View>

        {/* ===== PATIENT INFO CARD ===== */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.cardIcon}
            >
              <Ionicons name="person-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.cardTitle}>Thông tin bệnh nhân</Text>
          </View>
          <View style={styles.divider} />

          <InputGroup
            icon="person-outline"
            placeholder="Họ và tên"
            value={patientName}
            onChangeText={setPatientName}
            autoCapitalize="words"
          />
          <InputGroup
            icon="call-outline"
            placeholder="Số điện thoại"
            value={patientPhone}
            onChangeText={setPatientPhone}
            keyboardType="phone-pad"
            maxLength={11}
          />
          
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#64748B" />
            <Text style={styles.noteText}>
              Thông tin này sẽ được sử dụng để liên hệ xác nhận lịch hẹn
            </Text>
          </View>
        </Animated.View>

        {/* ===== PRICE CARD ===== */}
        <Animated.View entering={ZoomIn.delay(400)} style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <Text style={styles.priceLabel}>Phí dịch vụ khám</Text>
            <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
          </View>
          
          <View style={styles.priceValueContainer}>
            <Text style={styles.priceCurrency}>VNĐ</Text>
            <LinearGradient
              colors={["#FFFFFF", "rgba(255,255,255,0.9)"]}
              style={styles.priceGradient}
            >
              <Text style={styles.priceValue}>{servicePrice}</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.priceNote}>* Giá đã bao gồm tất cả phí dịch vụ</Text>
        </Animated.View>

        {/* ===== TERMS AND CONDITIONS ===== */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.termsCard}>
          <View style={styles.termsHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#667EEA" />
            <Text style={styles.termsTitle}>Điều khoản & Lưu ý</Text>
          </View>
          
          <View style={styles.termsList}>
            <View style={styles.termItem}>
              <View style={styles.termDot} />
              <Text style={styles.termText}>
                Vui lòng đến trước 15 phút để làm thủ tục
              </Text>
            </View>
            <View style={styles.termItem}>
              <View style={styles.termDot} />
              <Text style={styles.termText}>
                Hủy lịch trước 2 giờ nếu không thể đến
              </Text>
            </View>
            <View style={styles.termItem}>
              <View style={styles.termDot} />
              <Text style={styles.termText}>
                Mang theo giấy tờ tùy thân khi đến khám
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ===== FOOTER BUTTONS ===== */}
      <Animated.View entering={FadeInUp.delay(600)} style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelButton, bookingLoading && styles.disabledButton]}
          onPress={() => navigation.goBack()}
          disabled={bookingLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={20} color="#64748B" />
          <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, bookingLoading && styles.disabledButton]}
          onPress={handleBooking}
          disabled={bookingLoading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={bookingLoading ? ["#9CA3AF", "#9CA3AF"] : ["#10B981", "#059669"]}
            style={styles.confirmButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {bookingLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>ĐẶT LỊCH NGAY</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

/* ================= COMPONENTS ================= */

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconContainer}>
      <Ionicons name={icon} size={18} color="#667EEA" />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const InputGroup = ({ icon, placeholder, value, onChangeText, ...props }) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputIconContainer}>
      <Ionicons name={icon} size={18} color="#64748B" />
    </View>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" 
  },
  scrollContent: { 
    paddingBottom: 140 
  },
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 16,
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  divider: { 
    height: 1.5, 
    backgroundColor: "#F1F5F9", 
    marginBottom: 20 
  },
  infoRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 18 
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  infoValue: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#1E293B" 
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: "#1E293B", 
    paddingVertical: 16,
    fontWeight: "500",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
    marginLeft: 10,
    lineHeight: 18,
  },
  priceCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#667EEA",
    borderRadius: 28,
    padding: 28,
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  priceValueContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  priceCurrency: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
    fontWeight: "600",
  },
  priceGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    minWidth: 200,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#667EEA",
    textAlign: "center",
    letterSpacing: 1,
  },
  priceNote: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontStyle: "italic",
  },
  termsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  termsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 12,
  },
  termsList: {
    gap: 14,
  },
  termItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  termDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#667EEA",
    marginTop: 8,
    marginRight: 12,
  },
  termText: {
    flex: 1,
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1.5,
    borderTopColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 15,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  confirmButton: {
    flex: 2,
    borderRadius: 18,
    overflow: "hidden",
  },
  confirmButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
});