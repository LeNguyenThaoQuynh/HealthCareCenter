import React, { useEffect, useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

import { useBookingFlow } from "../../../../controllers/patient/bookingController";
import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  SHADOWS,
} from "../../../../theme/theme";
import { supabase } from "../../../../api/supabase";

export default function SelectTimeSlot() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date, specialization, price = 180000 } = route.params || {};

  const { doctorsWithSlots, loadingSlots, loadSlots } = useBookingFlow();
  const [doctorsWithRating, setDoctorsWithRating] = useState([]);

  /* ================= LOAD DATA ================= */

  useFocusEffect(
    useCallback(() => {
      if (date && specialization) {
        loadSlots(date, specialization);
      }
    }, [date, specialization, loadSlots])
  );

  useEffect(() => {
    const fetchRatings = async () => {
      if (!doctorsWithSlots?.length) {
        setDoctorsWithRating([]);
        return;
      }

      const enriched = await Promise.all(
        doctorsWithSlots.map(async (item) => {
          const { data } = await supabase
            .from("doctor_ratings")
            .select("rating")
            .eq("doctor_id", item.doctor.id);

          let avg = 0;
          let total = 0;

          if (data?.length) {
            total = data.length;
            avg =
              Math.round(
                (data.reduce((a, b) => a + b.rating, 0) / total) * 10
              ) / 10;
          }

          return { ...item, averageRating: avg, totalRatings: total };
        })
      );

      setDoctorsWithRating(enriched);
    };

    fetchRatings();
  }, [doctorsWithSlots]);

  /* ================= HELPERS ================= */

  const headerDate = useMemo(
    () =>
      new Date(date).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [date]
  );

  const handleSlotPress = (slot, doctor) => {
    navigation.navigate("ConfirmBooking", {
      date,
      specialization,
      price,
      doctor,
      slot,
    });
  };

  /* ================= SLOT ITEM ================= */

  const renderSlotItem = (doctor) => ({ item }) => {
    const low = item.available <= 2;
    const critical = item.available === 1;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleSlotPress(item, doctor)}
        style={[
          styles.slot,
          low && styles.slotLow,
          critical && styles.slotCritical,
        ]}
      >
        <Ionicons name="time-outline" size={18} color="#065F46" />
        <Text style={styles.slotTime}>{item.display}</Text>
        <Text
          style={[
            styles.slotAvailable,
            critical && styles.criticalText,
          ]}
        >
          Còn {item.available} chỗ
        </Text>
      </TouchableOpacity>
    );
  };

  /* ================= DOCTOR CARD ================= */

  const renderDoctor = ({ item }) => {
    const { doctor, slots, averageRating, totalRatings } = item;

    return (
      <View style={styles.doctorCard}>
        {/* ===== HEADER ===== */}
        <View style={styles.doctorHeader}>
          <LinearGradient
            colors={["#22C55E", "#16A34A"]}
            style={styles.avatarRing}
          >
            {doctor.avatar_url ? (
              <Image
                source={{ uri: doctor.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {doctor.name?.charAt(0)?.toUpperCase() || "B"}
                </Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>BS. {doctor.name}</Text>
            <Text style={styles.specialization}>
              {doctor.specializationText}
            </Text>

            {averageRating > 0 ? (
              <View style={styles.ratingBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={16}
                  color="#047857"
                />
                <Text style={styles.ratingNumber}>{averageRating}</Text>
                <Text style={styles.ratingLabel}>Đánh giá cao</Text>
                <Text style={styles.ratingCountText}>
                  ({totalRatings})
                </Text>
              </View>
            ) : (
              <Text style={styles.noRatingText}>Chưa có đánh giá</Text>
            )}
          </View>
        </View>

        <Text style={styles.slotLabel}>Chọn khung giờ</Text>

        {/* ===== SLOT GRID – LUÔN 2 CỘT ===== */}
        <FlatList
          data={slots.filter((s) => s.available > 0)}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.slotRow}
          renderItem={renderSlotItem(doctor)}
        />
      </View>
    );
  };

  const onRefresh = useCallback(
    () => loadSlots(date, specialization),
    [date, specialization, loadSlots]
  );

  if (loadingSlots) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải khung giờ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chọn khung giờ</Text>
          <Text style={styles.headerSubtitle}>{specialization}</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* ===== INFO ===== */}
      <View style={styles.infoCard}>
        <View>
          <Text style={styles.infoLabel}>Ngày khám</Text>
          <Text style={styles.infoValue}>{headerDate}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Phí khám</Text>
          <Text style={styles.priceValue}>
            {price.toLocaleString("vi-VN")}đ
          </Text>
        </View>
      </View>

      {/* ===== LIST ===== */}
      <FlatList
        data={doctorsWithRating}
        keyExtractor={(item) => item.doctor.id.toString()}
        renderItem={renderDoctor}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingSlots} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

/* ======================= STYLES ======================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#FFF" },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: "#E0F2FE",
    fontWeight: "600",
  },

  infoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },

  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONT_SIZE.base, fontWeight: "700", marginTop: 4 },

  priceContainer: { alignItems: "flex-end" },
  priceLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  priceValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.primary,
  },

  doctorCard: {
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.lg,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...SHADOWS.card,
  },

  doctorHeader: { flexDirection: "row", marginBottom: SPACING.lg },

  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    marginRight: SPACING.lg,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 26, fontWeight: "800", color: "#FFF" },

  doctorInfo: { flex: 1 },

  slotLabel: {
    marginBottom: SPACING.md,
    fontWeight: "700",
  },

  /* ===== SLOT – KHÔNG WIDTH ===== */
  slotRow: {
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },

  slot: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#86EFAC",
  },

  slotLow: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FED7AA",
  },

  slotCritical: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  slotTime: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: "#065F46",
  },
  slotAvailable: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  criticalText: { color: "#B91C1C" },

  list: { paddingBottom: 120 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: SPACING.lg },
});
