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
  ScrollView,
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
        activeOpacity={0.7}
        style={styles.card}
        onPress={() => navigation.navigate("SelectDate", { doctor: item })}
      >
        <View style={styles.cardInner}>
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {item.name[0]?.toUpperCase() || "B"}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.avatarBadge}>
              <View style={styles.onlineDot} />
              <LinearGradient
                colors={["#FFD700", "#FFB84D"]}
                style={styles.ratingBadge}
              >
                <Ionicons name="star" size={10} color="#FFF" />
                <Text style={styles.ratingBadgeText}>{item.averageRating}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              {item.department_name && (
                <View style={styles.departmentTag}>
                  <Text style={styles.departmentText}>
                    {item.department_name}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.specialtyRow}>
              <Ionicons
                name="medical-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.specialty} numberOfLines={2}>
                {item.specializations.join(" • ")}
              </Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="medkit-outline" size={14} color="#8B5CF6" />
                <Text style={styles.statLabel}>Phòng</Text>
                <Text style={styles.statValue}>{item.room_number}</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={14} color="#10B981" />
                <Text style={styles.statLabel}>Lịch</Text>
                <View style={styles.daysContainer}>
                  {item.daysAvailable.slice(0, 3).map((day, i) => (
                    <View key={i} style={styles.dayPill}>
                      <Text style={styles.dayPillText}>{day}</Text>
                    </View>
                  ))}
                  {item.daysAvailable.length > 3 && (
                    <Text style={styles.moreDays}>
                      +{item.daysAvailable.length - 3}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Rating Section */}
            {item.averageRating > 0 ? (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingStars}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < Math.floor(item.averageRating) ? "star" : "star-outline"}
                      size={14}
                      color="#FFB84D"
                    />
                  ))}
                </View>
                <Text style={styles.ratingCount}>
                  {item.averageRating} ({item.totalRatings} đánh giá)
                </Text>
              </View>
            ) : (
              <View style={styles.noRatingContainer}>
                <Text style={styles.noRatingText}>Chưa có đánh giá</Text>
              </View>
            )}

            {/* Book Button */}
            <TouchableOpacity
              style={styles.bookButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("SelectDate", { doctor: item })}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.bookButtonGradient}
              >
                <Text style={styles.bookButtonText}>Đặt lịch ngay</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chọn Bác Sĩ</Text>
          <Text style={styles.headerSubtitle}>Đặt lịch khám dễ dàng</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("HomeScreen")}
        >
          <Ionicons name="home-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <LinearGradient
          colors={["#FFF", "#F8FAFC"]}
          style={styles.searchCard}
        >
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8B5CF6" />
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

          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                selectedSpecialization && styles.filterPillActive,
              ]}
              onPress={() => setSpecModal(true)}
            >
              <Ionicons
                name="medical-outline"
                size={16}
                color={selectedSpecialization ? "#FFF" : "#8B5CF6"}
              />
              <Text
                style={[
                  styles.filterPillText,
                  selectedSpecialization && styles.filterPillTextActive,
                ]}
              >
                {selectedSpecialization || "Chuyên môn"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                selectedDay && styles.filterPillActive,
              ]}
              onPress={() => setDayModal(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={selectedDay ? "#FFF" : "#10B981"}
              />
              <Text
                style={[
                  styles.filterPillText,
                  selectedDay && styles.filterPillTextActive,
                ]}
              >
                {selectedDay || "Thứ"}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Results Section */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["#F1F5F9", "#E2E8F0"]}
            style={styles.emptyIllustration}
          >
            <Ionicons name="people-outline" size={80} color="#94A3B8" />
          </LinearGradient>
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

      {/* Modals */}
      <Modal visible={specModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#FFF", "#F8FAFC"]}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn chuyên môn</Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setSpecModal(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {allSpecializations.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.modalItem,
                      (selectedSpecialization || "Tất cả chuyên môn") ===
                        item && styles.modalItemActive,
                    ]}
                    onPress={() => {
                      setSelectedSpecialization(
                        item === "Tất cả chuyên môn" ? null : item
                      );
                      setSpecModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        (selectedSpecialization || "Tất cả chuyên môn") ===
                          item && styles.modalItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {(selectedSpecialization || "Tất cả chuyên môn") ===
                      item && (
                      <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <Modal visible={dayModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#FFF", "#F8FAFC"]}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn thứ khám</Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setDayModal(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.modalItem,
                    selectedDay === day && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedDay((prev) => (prev === day ? null : day));
                    setDayModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedDay === day && styles.modalItemTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                  {selectedDay === day && (
                    <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  searchCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: "#1E293B",
    fontWeight: "500",
  },
  filtersContainer: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    flex: 1,
    gap: 8,
  },
  filterPillActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  filterPillText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    flex: 1,
  },
  filterPillTextActive: {
    color: "#FFF",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardInner: {
    flexDirection: "row",
    padding: 15,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    flexDirection: "column",
    gap: 5,
  },
  onlineDot: {
    width: 12,
    height: 12,
    backgroundColor: "#10B981",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFF",
    alignSelf: "flex-end",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFF",
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  departmentTag: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  departmentText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4F46E5",
  },
  specialtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  specialty: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginRight: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dayPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  moreDays: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8B5CF6",
    marginLeft: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
  },
  ratingCount: {
    fontSize: 12,
    color: "#64748B",
  },
  noRatingContainer: {
    paddingVertical: 6,
    marginBottom: 12,
  },
  noRatingText: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  bookButton: {
    borderRadius: 15,
    overflow: "hidden",
  },
  bookButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
  },
  bookButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxHeight: "70%",
  },
  modalContent: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  modalClose: {
    padding: 4,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemActive: {
    backgroundColor: "#F8FAFC",
  },
  modalItemText: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
  },
  modalItemTextActive: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
});