import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const Colors = {
  primary: "#2563EB",
  success: "#10B981",
  danger: "#EF4444",
  muted: "#94A3B8",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const AppointmentCard = React.memo(({ item, index, onCancel }) => {
  const slot = item.doctor_schedule_template || {};
  const doctor = item.doctor || {};

  const specializationText =
    item.specializationText ||
    (item.specializations?.length > 0
      ? item.specializations.join(" • ")
      : "Chưa có chuyên khoa");

  const timeStr =
    slot.start_time && slot.end_time
      ? `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
      : "Chưa xác định";

  const date = item.appointment_date ? new Date(item.appointment_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPast = date ? date < today : false;
  const isCancelled = ["cancelled", "patient_cancelled"].includes(item.status);
  const isDoctorCancelled = item.status === "doctor_cancelled";

  let statusConfig;
  if (isDoctorCancelled) {
    statusConfig = {
      colors: ["#F59E0B", "#FBBF24"],
      text: "Bác sĩ hủy",
      icon: "alert-circle-outline",
    };
  } else if (isCancelled) {
    statusConfig = {
      colors: ["#EF4444", "#DC2626"],
      text: "Đã hủy",
      icon: "close-circle-outline",
    };
  } else if (isPast) {
    statusConfig = {
      colors: ["#94A3B8", "#CBD5E1"],
      text: "Hoàn thành",
      icon: "checkmark-done-outline",
    };
  } else {
    statusConfig = {
      colors: ["#10B981", "#34D399"],
      text: "Đã xác nhận",
      icon: "checkmark-circle-outline",
    };
  }

  const dateStr = date
    ? date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "---";

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 60)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        disabled={isCancelled || isDoctorCancelled}
      >
        <View
          style={[
            styles.card,
            (isCancelled || isDoctorCancelled) && styles.cancelledCard,
          ]}
        >
          <View style={styles.inner}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  {doctor.name || "Bác sĩ chưa xác định"}
                </Text>

                <Text style={styles.specialization} numberOfLines={2}>
                  {specializationText}
                </Text>
              </View>

              <LinearGradient colors={statusConfig.colors} style={styles.badge}>
                <Ionicons name={statusConfig.icon} size={13} color="#FFF" />
                <Text style={styles.badgeText}>{statusConfig.text}</Text>
              </LinearGradient>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.infoText}>{dateStr}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{timeStr}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.infoText}>
                {doctor.room_number
                  ? `P. ${doctor.room_number}`
                  : "Chưa có phòng"}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Ionicons name="cash-outline" size={20} color={Colors.success} />
              <Text style={styles.priceText}>
                {item.price ? item.price.toLocaleString("vi-VN") + " đ" : "—"}
              </Text>
            </View>

            {onCancel && !isCancelled && !isDoctorCancelled && (
              <TouchableOpacity
                onPress={() => onCancel(item.id)}
                style={styles.cancelBtn}
              >
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  style={styles.cancelBtnInner}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#FFF"
                  />
                  <Text style={styles.cancelText}>Hủy lịch khám</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: { marginBottom: 18 },

  card: {
    borderRadius: 18,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cancelledCard: { opacity: 0.6 },

  inner: { padding: 18 },

  doctorName: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  specialization: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: "600",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  badge: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    gap: 5,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 11.5,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
    gap: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.success,
  },

  cancelBtn: { marginTop: 10, borderRadius: 14, overflow: "hidden" },
  cancelBtnInner: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  cancelText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default AppointmentCard;
