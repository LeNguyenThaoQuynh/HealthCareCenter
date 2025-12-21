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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBookingFlow } from "../../../../controllers/patient/bookingController";
import { supabase } from "../../../../api/supabase";
import { LinearGradient } from "expo-linear-gradient";

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
      .eq("doctor_id", doctor.id) // ✅ CHỈ CHẶN CÙNG BÁC SĨ
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
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Xác nhận đặt lịch</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ===== APPOINTMENT INFO ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết lịch khám</Text>
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
        </View>

        {/* ===== PATIENT INFO ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin bệnh nhân</Text>
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
        </View>

        {/* ===== PRICE ===== */}
        <View style={styles.priceCardContainer}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={styles.priceCard}
          >
            <Text style={styles.priceLabel}>Phí khám dự kiến</Text>
            <Text style={styles.priceValue}>{servicePrice}</Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* ===== FOOTER ===== */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleBooking}
          disabled={bookingLoading}
        >
          <LinearGradient
            colors={
              bookingLoading
                ? ["#9CA3AF", "#9CA3AF"]
                : ["#3B82F6", "#1E40AF"]
            }
            style={styles.gradientButton}
          >
            {bookingLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmText}>Đặt lịch ngay</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= COMPONENTS ================= */

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color="#4B5563" />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const InputGroup = ({ icon, placeholder, value, onChangeText, ...props }) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={20} color="#6B7280" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 120 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: "#fff",
    elevation: 6,
  },
  backButton: { padding: 8, marginRight: 8 },
  title: { fontSize: 23, fontWeight: "800", color: "#1F2937" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 18,
    padding: 22,
    borderRadius: 20,
    elevation: 10,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 14,
  },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  infoLabel: {
    flex: 1,
    marginLeft: 16,
    color: "#4B5563",
    fontSize: 15.5,
    fontWeight: "600",
  },
  infoValue: { fontWeight: "700", color: "#1F2937", fontSize: 15.5 },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#1F2937", paddingVertical: 14 },

  priceCardContainer: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 20,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 12,
  },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 22,
  },
  priceLabel: { fontSize: 17, color: "#fff", fontWeight: "700" },
  priceValue: { fontSize: 26, fontWeight: "900", color: "#fff" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 18,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    elevation: 15,
  },
  confirmButton: { borderRadius: 18, overflow: "hidden", elevation: 12 },
  gradientButton: { padding: 18, alignItems: "center" },
  confirmText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
