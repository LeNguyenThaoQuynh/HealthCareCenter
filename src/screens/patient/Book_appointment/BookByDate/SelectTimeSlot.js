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
  Dimensions,
  StatusBar,
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
  SPACING,
} from "../../../../theme/theme";
import { supabase } from "../../../../api/supabase";

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40); // 20 padding mỗi bên
const SLOT_WIDTH = (CARD_WIDTH - 48) / 2; // 16 padding + 16 gap

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
            avg = Math.round((data.reduce((a, b) => a + b.rating, 0) / total) * 10) / 10;
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

  const getTimeOfDay = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return { label: "Buổi sáng", color: "#F59E0B", icon: "sunny-outline" };
    if (hour < 17) return { label: "Buổi chiều", color: "#EC4899", icon: "partly-sunny-outline" };
    return { label: "Buổi tối", color: "#8B5CF6", icon: "moon-outline" };
  };

  /* ================= SLOT ITEM ================= */
  const renderSlotItem = (doctor) => ({ item, index }) => {
    const low = item.available <= 2;
    const critical = item.available === 1;
    const timeInfo = getTimeOfDay(item.start_time || "08:00");

    return (
      <View style={styles.slotWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSlotPress(item, doctor)}
          style={[
            styles.slot,
            low && styles.slotLow,
            critical && styles.slotCritical,
          ]}
        >
          <View style={styles.slotTimeContainer}>
            <LinearGradient
              colors={[timeInfo.color, `${timeInfo.color}DD`]}
              style={styles.timeBadge}
            >
              <Ionicons name={timeInfo.icon} size={14} color="#FFF" />
              <Text style={styles.timeBadgeText} numberOfLines={1}>
                {timeInfo.label}
              </Text>
            </LinearGradient>
            <Text style={styles.slotTime} numberOfLines={1}>
              {item.display}
            </Text>
          </View>

          <View style={styles.slotStatus}>
            <View style={styles.availabilityBadge}>
              <Ionicons 
                name={critical ? "warning" : low ? "alert-circle" : "checkmark-circle"} 
                size={12} 
                color={critical ? "#DC2626" : low ? "#D97706" : "#059669"} 
              />
              <Text style={[
                styles.slotAvailable,
                critical && styles.criticalText,
                low && styles.lowText,
              ]} numberOfLines={1}>
                 {item.available} chỗ
              </Text>
            </View>
            
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.selectButton}
            >
              <Text style={styles.selectButtonText}>Chọn</Text>
            </LinearGradient>
          </View>

          {critical && (
            <View style={styles.criticalIndicator}>
              <Ionicons name="flash" size={10} color="#DC2626" />
              <Text style={styles.criticalIndicatorText}>Sắp kín</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  /* ================= DOCTOR CARD ================= */
  const renderDoctor = ({ item }) => {
    const { doctor, slots, averageRating, totalRatings } = item;
    const availableSlots = slots.filter(s => s.available > 0);

    return (
      <View style={styles.doctorCardWrapper}>
        <View style={styles.doctorCard}>
          {/* ===== DOCTOR HEADER ===== */}
          <View style={styles.doctorHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#667EEA", "#764BA2"]}
                style={styles.avatarGradient}
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
              <View style={styles.onlineIndicator} />
            </View>

            <View style={styles.doctorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  BS. {doctor.name}
                </Text>
                <View style={styles.experienceBadge}>
                  <Text style={styles.experienceText}>Chuyên gia</Text>
                </View>
              </View>
              
              <Text style={styles.specialization} numberOfLines={2}>
                {doctor.specializationText}
              </Text>

              {averageRating > 0 ? (
                <View style={styles.ratingContainer}>
                  <LinearGradient
                    colors={["#FBBF24", "#F59E0B"]}
                    style={styles.ratingBadge}
                  >
                    <Ionicons name="star" size={12} color="#FFF" />
                    <Text style={styles.ratingNumber}>{averageRating}</Text>
                  </LinearGradient>
                  <Text style={styles.ratingLabel} numberOfLines={1}>Đánh giá cao</Text>
                  <Text style={styles.ratingCountText} numberOfLines={1}>({totalRatings})</Text>
                </View>
              ) : (
                <View style={styles.noRatingContainer}>
                  <Text style={styles.noRatingText}>Chưa có đánh giá</Text>
                </View>
              )}
            </View>
          </View>

          {/* ===== SLOTS HEADER ===== */}
          {availableSlots.length > 0 && (
            <View style={styles.slotsHeader}>
              <View style={styles.slotsTitleContainer}>
                <Ionicons name="time-outline" size={18} color="#667EEA" />
                <Text style={styles.slotsTitle}>Khung giờ có sẵn</Text>
              </View>
              <Text style={styles.slotsCount}>{availableSlots.length} khung giờ</Text>
            </View>
          )}

          {/* ===== SLOT GRID - CANH ĐỀU CHUẨN ===== */}
          {availableSlots.length > 0 ? (
            <View style={styles.slotsGrid}>
              <FlatList
                data={availableSlots}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.slotRow}
                renderItem={renderSlotItem(doctor)}
                contentContainerStyle={styles.slotsGridContent}
              />
            </View>
          ) : (
            <View style={styles.noSlotsContainer}>
              <Ionicons name="time-outline" size={36} color="#CBD5E1" />
              <Text style={styles.noSlotsText}>Đã hết chỗ trống</Text>
              <Text style={styles.noSlotsSubtext}>Vui lòng chọn bác sĩ khác</Text>
            </View>
          )}
        </View>
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
        <ActivityIndicator size="large" color="#667EEA" />
        <Text style={styles.loadingText}>Đang tải khung giờ...</Text>
        <Text style={styles.loadingSubtext}>Vui lòng chờ trong giây lát</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667EEA" />
      
      {/* ===== HEADER - CANH ĐỀU CHUẨN ===== */}
      <LinearGradient 
        colors={["#667EEA", "#764BA2"]}
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
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Chọn Khung Giờ
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {specialization}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate("HomeScreen")}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ===== INFO CARD - CANH ĐỀU CHUẨN ===== */}
      <View style={styles.infoCard}>
        <View style={styles.infoContent}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={18} color="#667EEA" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel} numberOfLines={1}>Ngày khám</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{headerDate}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="cash-outline" size={18} color="#10B981" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel} numberOfLines={1}>Phí khám</Text>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.priceGradient}
              >
                <Text style={styles.priceValue} numberOfLines={1}>
                  {price.toLocaleString("vi-VN")}đ
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </View>

      {/* ===== AVAILABILITY LEGEND - CANH ĐỀU CHUẨN ===== */}
      {doctorsWithRating.length > 0 && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendNormal]} />
            <Text style={styles.legendText} numberOfLines={1}>Nhiều chỗ</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendLow]} />
            <Text style={styles.legendText} numberOfLines={1}>Ít chỗ</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendCritical]} />
            <Text style={styles.legendText} numberOfLines={1}>Sắp kín</Text>
          </View>
        </View>
      )}

      {/* ===== DOCTORS LIST - CANH ĐỀU CHUẨN ===== */}
      {doctorsWithRating.length > 0 ? (
        <FlatList
          data={doctorsWithRating}
          keyExtractor={(item) => item.doctor.id.toString()}
          renderItem={renderDoctor}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={loadingSlots} 
              onRefresh={onRefresh}
              colors={["#667EEA"]}
              tintColor="#667EEA"
            />
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle} numberOfLines={1}>
                Có {doctorsWithRating.length} bác sĩ có lịch
              </Text>
              <Text style={styles.listHeaderSubtitle} numberOfLines={1}>
                Chọn bác sĩ và khung giờ phù hợp
              </Text>
            </View>
          }
        />
      ) : !loadingSlots ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Ionicons name="people-outline" size={70} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle} numberOfLines={2}>
            Không có bác sĩ có lịch
          </Text>
          <Text style={styles.emptySubtitle} numberOfLines={3}>
            Hiện không có bác sĩ nào có lịch vào ngày này. Vui lòng chọn ngày khác.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={["#667EEA", "#764BA2"]}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="calendar-outline" size={18} color="#FFF" />
              <Text style={styles.emptyButtonText}>Chọn ngày khác</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

/* ======================= STYLES - CANH ĐỀU CHUẨN ======================= */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  
  // HEADER - CANH ĐỀU
  header: {
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44, // Cố định chiều cao
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#FFF",
    textAlign: "center",
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 2,
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // INFO CARD - CANH ĐỀU
  infoCard: {
    marginHorizontal: 20,
    marginTop: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minHeight: 60, // Cố định chiều cao
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: { 
    fontSize: 13, 
    color: "#64748B",
    lineHeight: 18,
  },
  infoValue: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#1E293B",
    lineHeight: 20,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  priceGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
  },
  
  // LEGEND - CANH ĐỀU
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendNormal: {
    backgroundColor: "#10B981",
  },
  legendLow: {
    backgroundColor: "#F59E0B",
  },
  legendCritical: {
    backgroundColor: "#EF4444",
  },
  legendText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    lineHeight: 16,
  },
  
  // LIST HEADER - CANH ĐỀU
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  listHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 24,
  },
  listHeaderSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginTop: 2,
  },
  
  // DOCTOR CARD - CANH ĐỀU
  doctorCardWrapper: {
    marginBottom: 16,
  },
  doctorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    width: CARD_WIDTH,
    alignSelf: 'center',
  },
  doctorHeader: {
    flexDirection: "row",
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    backgroundColor: "#667EEA",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { 
    fontSize: 24, 
    fontWeight: "700", 
    color: "#FFF",
    lineHeight: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  doctorInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    lineHeight: 22,
  },
  experienceBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginLeft: 10,
  },
  experienceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
    lineHeight: 14,
  },
  specialization: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 10,
    gap: 4,
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 16,
  },
  ratingLabel: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "600",
    marginRight: 6,
    lineHeight: 16,
  },
  ratingCountText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 16,
  },
  noRatingContainer: {
    paddingVertical: 4,
  },
  noRatingText: { 
    fontSize: 13, 
    color: "#94A3B8",
    fontStyle: "italic",
    lineHeight: 16,
  },
  
  // SLOTS HEADER - CANH ĐỀU
  slotsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: "#F1F5F9",
  },
  slotsTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 20,
  },
  slotsCount: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 16,
  },
  
  // SLOTS GRID - CANH ĐỀU CHUẨN
  slotsGrid: {
    width: '100%',
  },
  slotsGridContent: {
    paddingBottom: 4,
  },
  slotRow: {
    justifyContent: "space-between",
    marginBottom: 12,
    width: '100%',
  },
  slotWrapper: {
    width: SLOT_WIDTH,
  },
  slot: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    position: 'relative',
    width: '100%',
    minHeight: 110, // Cố định chiều cao
  },
  slotLow: {
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
  },
  slotCritical: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  slotTimeContainer: {
    marginBottom: 12,
    alignItems: "center",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    gap: 4,
    alignSelf: 'center',
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 14,
  },
  slotTime: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: 'center',
    lineHeight: 22,
  },
  slotStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  slotAvailable: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
    lineHeight: 16,
  },
  lowText: {
    color: "#D97706",
  },
  criticalText: { 
    color: "#DC2626",
    fontWeight: "700",
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 60,
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 16,
  },
  criticalIndicator: {
    position: 'absolute',
    top: -6,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  criticalIndicatorText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#DC2626",
    lineHeight: 12,
  },
  
  // NO SLOTS
  noSlotsContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 20,
  },
  noSlotsSubtext: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  
  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 20,
  },
  loadingSubtext: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    lineHeight: 16,
  },
  
  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 24,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 280,
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 10,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 18,
  },
});