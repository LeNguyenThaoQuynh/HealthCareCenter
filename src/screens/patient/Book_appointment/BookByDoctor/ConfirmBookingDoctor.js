import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../../../../api/supabase";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const Colors = {
  primary: "#0066FF",
  gradient: ["#0066FF", "#00D4FF"],
  success: "#00D778",
  accent: "#00B074",
  text: "#1E293B",
  textLight: "#64748B",
  bg: "#F8FAFF",
  white: "#FFFFFF",
  card: "#FFFFFF",
  lightBlue: "#EBF8FF",
  border: "#E2E8F0",
};

export default function ConfirmBookingDoctor() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedDate, timeSlot } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(true);
  const [servicePrice, setServicePrice] = useState(150000); // fallback mặc định

  useEffect(() => {
    const fetchServicePrice = async () => {
      if (!doctor?.department_name) {
        console.log("⚠️ Không có department_name → dùng giá mặc định");
        setFetchingPrice(false);
        return;
      }

      try {
        setFetchingPrice(true);
        console.log(
          `🔎 Query services cho department: "${doctor.department_name}"`
        );

        let query = supabase
          .from("services")
          .select("id, name, price, service_type")
          .eq("department", doctor.department_name)
          .eq("is_active", true);

        if (doctor.specializations && doctor.specializations.length > 0) {
          const mainSpec = doctor.specializations[0];
          query = query.ilike("name", `%${mainSpec}%`);
          console.log(`🔍 Tìm theo specialization: "${mainSpec}"`);
        }

        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log("📊 Kết quả services:", data, error);

        if (data?.price) {
          const newPrice = Math.round(Number(data.price));
          console.log(
            `✅ Giá tìm thấy: ${newPrice}đ cho "${data.name}" (type: ${data.service_type})`
          );
          setServicePrice(newPrice);
        }
         else {
          console.warn("⚠️ Không tìm thấy dịch vụ phù hợp → fallback 150.000đ");
        }
      } catch (err) {
        console.error("💥 Lỗi fetch giá:", err);
      } finally {
        setFetchingPrice(false);
      }
    };

    fetchServicePrice();
  }, [doctor?.department_name, doctor?.specializations]);

  // Kiểm tra dữ liệu đầu vào
  useEffect(() => {
    if (!doctor?.id || !selectedDate || !timeSlot?.slot_id) {
      Alert.alert("Lỗi dữ liệu", "Thiếu thông tin đặt lịch");
      navigation.goBack();
    }
  }, [doctor, selectedDate, timeSlot, navigation]);

  const handleConfirm = async () => {
  if (loading) return;
  setLoading(true);

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Vui lòng đăng nhập lại");

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error(
        "Không tìm thấy thông tin cá nhân. Vui lòng cập nhật hồ sơ."
      );
    }

    const vietnamDate = new Date(
      `${selectedDate}T${timeSlot.start}:00+07:00`
    );
    const appointmentDateTime = vietnamDate.toISOString().slice(0, 19);

    const appointmentData = {
      user_id: user.id,
      doctor_id: doctor.id,
      appointment_date: appointmentDateTime,
      date: selectedDate,
      slot_id: timeSlot.slot_id,
      department_id: doctor.department_id || null,
      status: "pending",
      patient_name: profile.full_name?.trim() || "Bệnh nhân",
      patient_phone: profile.phone?.replace(/\D/g, "") || "",
      price: servicePrice,
    };

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

if (error) {
  // ✅ Trùng slot → chỉ báo cho user
  if (error.code === "23505") {
    Alert.alert(
      "Khung giờ đã được đặt",
      "Bác sĩ đã có lịch trong khung giờ này.\nVui lòng chọn khung giờ khác.",
      [
        {
          text: "Chọn giờ khác",
          onPress: () => navigation.goBack(),
        },
        {
          text: "Về trang chủ",
          style: "cancel",
          onPress: () => navigation.replace("HomeScreen"),
        },
      ]
    );
    return; // ⛔ KẾT THÚC Ở ĐÂY
  }

  // ❌ Lỗi thật sự mới throw
  throw error;
}

    const dateDisplay = new Date(selectedDate).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const timeDisplay = timeSlot.display.replace("-", "to").trim();

    Alert.alert(
  "Đặt lịch thành công 🎉",
  `Bạn đã đặt lịch với BS. ${doctor.name}

🕒 ${timeSlot.display}
📅 ${dateDisplay}
💰 Phí dịch vụ: ${formatPrice(servicePrice)}

Bạn có muốn xem lịch hẹn của mình không?`,
  [
    {
      text: "Màn hình chính",
      style: "cancel",
      onPress: () => navigation.replace("HomeScreen"),
    },
    {
      text: "Xem lịch hẹn",
      onPress: () => navigation.replace("HistoryScreen"),
    },
  ]
);

  } catch (err) {
    console.error("Lỗi đặt lịch:", err);

    // ✅ TRÙNG SLOT – DB CHẶN
    if (err.code === "23505") {
      Alert.alert(
        "Khung giờ đã được đặt",
        "Bác sĩ đã có lịch trong khung giờ này.\nVui lòng chọn khung giờ khác.",
        [
          {
            text: "Chọn giờ khác",
            onPress: () => navigation.goBack(),
          },
          {
            text: "Về trang chủ",
            style: "cancel",
            onPress: () => navigation.replace("HomeScreen"),
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Đặt lịch thất bại",
      err.message || "Đã có lỗi xảy ra, vui lòng thử lại"
    );
  } finally {
    setLoading(false);
  }
};


  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (display) => display.replace("-", " to ");

  const formatPrice = (price) => {
    return `${(price / 1000).toLocaleString("vi-VN")}.000đ`;
  };

  const renderSpecializations = () => {
    if (!doctor.specializations)
      return doctor.department_name || "Bác sĩ đa khoa";
    if (Array.isArray(doctor.specializations)) {
      return doctor.specializations.join(" • ");
    }
    return doctor.specializations || doctor.department_name || "Bác sĩ đa khoa";
  };

  if (!doctor || !selectedDate || !timeSlot) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradient} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận đặt lịch</Text>
        <TouchableOpacity onPress={() => navigation.navigate("HomeScreen")}>
          <Ionicons name="home" size={28} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.mainCard}>
          <View style={styles.doctorSection}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {doctor.name?.[0]?.toUpperCase() || "B"}
              </Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.specialty}>{renderSpecializations()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="medkit-outline" size={24} color={Colors.primary} />
            <Text style={styles.detailLabel}>Dịch vụ/Chuyên khoa</Text>
            <Text style={styles.detailValue}>{renderSpecializations()}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="location-outline"
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.detailLabel}>Phòng khám</Text>
            <Text style={styles.detailValue}>
              Phòng {doctor.room_number || "Chưa xác định"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <Text style={styles.detailLabel}>Ngày khám</Text>
            <Text style={styles.detailValue}>{formatDate(selectedDate)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <Text style={styles.detailLabel}>Giờ khám</Text>
            <Text style={styles.timeValue}>{formatTime(timeSlot.display)}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.priceCard}>
          <Text style={styles.priceLabel}>Phí dịch vụ dự kiến</Text>
          {fetchingPrice ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.price}>{formatPrice(servicePrice)}</Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.noteCard}>
          <Ionicons
            name="information-circle"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.noteText}>
            • Vui lòng đến trước <Text style={styles.bold}>15 phút</Text> để làm
            thủ tục{"\n"}• Hủy lịch trước <Text style={styles.bold}>2 giờ</Text>{" "}
            nếu không thể đến{"\n"}• Mang theo giấy tờ tùy thân và bảo hiểm y tế
            (nếu có)
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(500)} style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelBtn, loading && styles.disabled]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Hủy bỏ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.disabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          <LinearGradient
            colors={["#00D778", "#00B060"]}
            style={styles.confirmGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={26} color="#FFF" />
                <Text style={styles.confirmText}>XÁC NHẬN ĐẶT LỊCH</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  scroll: { flex: 1 },
  mainCard: {
    margin: 20,
    marginTop: 10,
    backgroundColor: Colors.card,
    borderRadius: 32,
    padding: 24,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 25,
  },
  doctorSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 36, fontWeight: "bold", color: "#FFF" },
  doctorInfo: { marginLeft: 20, flex: 1 },
  doctorName: { fontSize: 24, fontWeight: "900", color: Colors.text },
  specialty: {
    fontSize: 16,
    color: "#0066FF",
    marginTop: 6,
    fontWeight: "700",
  },
  divider: { height: 1.5, backgroundColor: "#E2E8F0", marginVertical: 20 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  detailLabel: {
    width: 120,
    fontSize: 15.5,
    color: Colors.textLight,
    fontWeight: "600",
  },
  detailValue: {
    flex: 1,
    fontSize: 16.5,
    color: Colors.text,
    fontWeight: "600",
  },
  timeValue: {
    flex: 1,
    fontSize: 19,
    color: Colors.primary,
    fontWeight: "900",
  },
  priceCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.lightBlue,
    padding: 24,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0066FF",
  },
  priceLabel: { fontSize: 17, color: Colors.primary, fontWeight: "700" },
  price: { fontSize: 28, fontWeight: "900", color: Colors.primary },
  noteCard: {
    margin: 20,
    marginTop: 10,
    backgroundColor: "#EBF8FF",
    padding: 20,
    borderRadius: 28,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#0066FF",
  },
  noteText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 15.5,
    color: Colors.text,
    lineHeight: 24,
  },
  bold: { fontWeight: "900", color: Colors.primary },
  footer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: Colors.white,
    elevation: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { fontSize: 17, fontWeight: "700", color: Colors.textLight },
  confirmBtn: { flex: 2, borderRadius: 20, overflow: "hidden" },
  confirmGradient: {
    flexDirection: "row",
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  confirmText: { fontSize: 18, fontWeight: "900", color: "#FFF" },
  disabled: { opacity: 0.6 },
});
