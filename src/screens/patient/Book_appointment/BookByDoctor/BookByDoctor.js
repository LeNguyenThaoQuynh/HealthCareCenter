import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../../api/supabase";
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZE,
  SHADOWS,
} from "../../../../theme/theme";

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

export default function BookByDoctor() {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [specModal, setSpecModal] = useState(false);
  const [dayModal, setDayModal] = useState(false);
  const [allSpecializations, setAllSpecializations] = useState([
    "Tất cả chuyên môn",
  ]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("doctors")
          .select("specialization")
          .not("specialization", "is", null);
        if (data?.length) {
          const unique = [
            ...new Set(
              data
                .flatMap((d) => d.specialization?.split("•") || [])
                .map((s) => s.trim())
                .filter(Boolean)
            ),
          ].sort();
          setAllSpecializations(["Tất cả chuyên môn", ...unique]);
        }
      } catch (err) {}
    })();
  }, []);

  const searchDoctors = useCallback(async () => {
    const hasFilter = query.trim() || selectedSpecialization || selectedDay;
    setLoading(true);
    try {
      let q = supabase
        .from("doctors")
        .select(
          `
          id, name, avatar_url, specialization, room_number, department_name,
          doctor_schedule_template(day_of_week, start_time, end_time)
        `
        )
        .limit(hasFilter ? 500 : 20)
        .order("name");
      if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);
      const { data: rawDoctors, error } = await q;
      if (error) throw error;
      if (!rawDoctors?.length) {
        setDoctors([]);
        setLoading(false);
        return;
      }

      const doctorIds = rawDoctors.map((d) => d.id);
      const { data: ratingsData } = await supabase
        .from("doctor_ratings")
        .select("doctor_id, rating")
        .in("doctor_id", doctorIds);

      const ratingMap = {};
      ratingsData?.forEach((r) => {
        if (!ratingMap[r.doctor_id])
          ratingMap[r.doctor_id] = { sum: 0, count: 0 };
        ratingMap[r.doctor_id].sum += r.rating;
        ratingMap[r.doctor_id].count += 1;
      });

      const result = rawDoctors
        .map((doc) => {
          const specializations = doc.specialization
            ? doc.specialization
                .split("•")
                .map((s) => s.trim())
                .filter(Boolean)
            : ["Chưa cập nhật"];
          if (
            selectedSpecialization &&
            selectedSpecialization !== "Tất cả chuyên môn" &&
            !specializations.includes(selectedSpecialization)
          )
            return null;

          const templates = Array.isArray(doc.doctor_schedule_template)
            ? doc.doctor_schedule_template
            : doc.doctor_schedule_template
            ? [doc.doctor_schedule_template]
            : [];
          const daysAvailable = [
            ...new Set(templates.map((t) => t.day_of_week).filter(Boolean)),
          ];
          if (selectedDay && !daysAvailable.includes(selectedDay)) return null;

          const ratingInfo = ratingMap[doc.id] || { sum: 0, count: 0 };
          const averageRating =
            ratingInfo.count > 0
              ? Math.round((ratingInfo.sum / ratingInfo.count) * 10) / 10
              : 0;
          const totalRatings = ratingInfo.count;

          return {
            id: doc.id,
            name: doc.name || "Bác sĩ",
            avatar_url: doc.avatar_url,
            room_number: doc.room_number || "Chưa xác định",
            department_name: doc.department_name,
            specializations,
            daysAvailable:
              daysAvailable.length > 0 ? daysAvailable : ["Chưa có lịch"],
            averageRating,
            totalRatings,
          };
        })
        .filter(Boolean);

      result.sort((a, b) => b.averageRating - a.averageRating);
      setDoctors(result);
    } catch (err) {
      console.error(err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSpecialization, selectedDay]);

  useEffect(() => {
    searchDoctors();
  }, [searchDoctors]);

  const renderDoctor = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => navigation.navigate("SelectDate", { doctor: item })}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F5FBFF"]}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <View style={styles.avatarWrapper}>
                {item.avatar_url ? (
                  <Image
                    source={{ uri: item.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <LinearGradient
                    colors={[COLORS.primary, "#3B82F6"]}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {item.name[0]?.toUpperCase() || "B"}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.onlineDot} />
              </View>

              <View style={styles.infoWrapper}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.department_name && (
                  <Text style={styles.department}>{item.department_name}</Text>
                )}
                <Text style={styles.specialty} numberOfLines={1}>
                  {item.specializations.join(" • ")}
                </Text>

                {item.averageRating > 0 ? (
                  <View style={styles.ratingRow}>
                    <LinearGradient
                      colors={["#FFD700", "#FFB84D"]}
                      style={styles.ratingPill}
                    >
                      <Ionicons name="star" size={14} color="#FFF" />
                      <Text style={styles.ratingText}>
                        {item.averageRating}
                      </Text>
                    </LinearGradient>
                    <Text style={styles.ratingCount}>
                      ({item.totalRatings})
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noRating}>Chưa có đánh giá</Text>
                )}
              </View>

              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="medkit-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.infoLabel}>Phòng</Text>
                <Text style={styles.infoValue}>{item.room_number}</Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="#14B8A6" />
                <Text style={styles.infoLabel}>Lịch khám</Text>
                <View style={styles.daysTags}>
                  {item.daysAvailable.length > 0 ? (
                    item.daysAvailable.slice(0, 4).map((day, i) => (
                      <View key={i} style={styles.dayTag}>
                        <Text style={styles.dayTagText}>{day}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noSchedule}>Chưa có</Text>
                  )}
                  {item.daysAvailable.length > 4 && (
                    <Text style={styles.moreDays}>
                      +{item.daysAvailable.length - 4}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <LinearGradient
            colors={[COLORS.primary, "#2563EB"]}
            style={styles.bookButton}
          >
            <Text style={styles.bookText}>Đặt lịch ngay</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </LinearGradient>
        </LinearGradient>
      </TouchableOpacity>
    ),
    [navigation]
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn bác sĩ</Text>
        <TouchableOpacity onPress={() => navigation.navigate("HomeScreen")}>
          <Ionicons name="home" size={26} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          placeholder="Tìm bác sĩ theo tên..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholderTextColor="#94A3B8"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedSpecialization && styles.filterButtonActive,
          ]}
          onPress={() => setSpecModal(true)}
        >
          <Text style={styles.filterText}>
            {selectedSpecialization || "Chuyên môn"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedDay && styles.filterButtonActive,
          ]}
          onPress={() => setDayModal(true)}
        >
          <Text style={styles.filterText}>{selectedDay || "Thứ"}</Text>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Không tìm thấy bác sĩ</Text>
          <Text style={styles.emptySubtitle}>
            Thử thay đổi bộ lọc hoặc tìm tên khác
          </Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDoctor}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal Chuyên môn */}
      <Modal visible={specModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn chuyên môn</Text>
              <TouchableOpacity onPress={() => setSpecModal(false)}>
                <Ionicons name="close" size={26} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allSpecializations}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedSpecialization(
                      item === "Tất cả chuyên môn" ? null : item
                    );
                    setSpecModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {(selectedSpecialization || "Tất cả chuyên môn") === item && (
                    <Ionicons
                      name="checkmark"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Thứ */}
      <Modal visible={dayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn thứ</Text>
              <TouchableOpacity onPress={() => setDayModal(false)}>
                <Ionicons name="close" size={26} color="#1E293B" />
              </TouchableOpacity>
            </View>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedDay((prev) => (prev === d ? null : d));
                  setDayModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{d}</Text>
                {selectedDay === d && (
                  <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBFF" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#FFF" },

  // Search bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 24,
    height: 52,
    borderWidth: 2,
    borderColor: "#C7D2FE",
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    marginLeft: 10,
    color: "#1E293B",
  },

  // Filters
  filtersRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E0E7FF",
    ...SHADOWS.small,
  },
  filterButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#EBF4FF",
  },
  filterText: { fontSize: FONT_SIZE.md, fontWeight: "700", color: "#1E293B" },

  listContainer: { padding: SPACING.lg, paddingBottom: 100 },

  // Doctor Card
  card: {
    marginBottom: SPACING.lg,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#C7D2FE",
    ...SHADOWS.medium,
  },
  cardGradient: {},
  cardContent: { padding: SPACING.lg },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  avatarWrapper: { position: "relative", marginRight: SPACING.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#FFF" },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 20,
    height: 20,
    backgroundColor: "#10B981",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#FFF",
  },

  infoWrapper: { flex: 1 },
  name: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: "#1E293B" },
  department: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: "600",
  },
  specialty: { fontSize: FONT_SIZE.sm, color: "#64748B", marginTop: 4 },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  ratingText: { fontSize: FONT_SIZE.md, fontWeight: "800", color: "#FFF" },
  ratingCount: { fontSize: FONT_SIZE.sm, color: "#64748B" },
  noRating: {
    fontSize: FONT_SIZE.sm,
    color: "#94A3B8",
    marginTop: 8,
    fontStyle: "italic",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: SPACING.md,
    borderTopWidth: 1.5,
    borderTopColor: "#C7D2FE",
  },
  infoItem: { flex: 1, alignItems: "flex-start" },
  infoLabel: { fontSize: FONT_SIZE.xs, color: "#64748B", marginTop: 4 },
  infoValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },
  daysTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  dayTag: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dayTagText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "700",
  },
  noSchedule: { fontSize: FONT_SIZE.xs, color: "#94A3B8", fontStyle: "italic" },
  moreDays: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "bold",
    marginTop: 6,
  },

  bookButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
    marginTop: SPACING.lg,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  bookText: { color: "#FFF", fontSize: FONT_SIZE.lg, fontWeight: "800" },

  // Loading & Empty
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    color: "#64748B",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.xl,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "800",
    color: "#1E293B",
  },
  emptySubtitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: "#64748B",
    textAlign: "center",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#C7D2FE",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.xl,
    borderBottomWidth: 2,
    borderBottomColor: "#C7D2FE",
  },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "800", color: "#1E293B" },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalItemText: {
    fontSize: FONT_SIZE.md,
    color: "#1E293B",
    fontWeight: "600",
  },
});
