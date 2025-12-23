import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS } = theme;
const { width } = Dimensions.get("window");

export default function ManageDoctorsScreen() {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const { data, error } = await supabase
        .from("doctors")
        .select(
          `
          id,
          name,
          room_number,
          experience_years,
          bio,
          specialization,
          department_name
        `
        )
        .order("name", { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((doc) => ({
        id: doc.id,
        full_name: doc.name?.trim() || "Bác sĩ",
        room_number: doc.room_number || null,
        experience_years: doc.experience_years,
        bio: doc.bio || null,
        department_name: doc.department_name || "Chưa phân khoa",
        specializations: doc.specialization
          ? doc.specialization
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          : [],
      }));

      setDoctors(formatted);
    } catch (err) {
      console.error("Lỗi tải bác sĩ:", err);
      Alert.alert("Lỗi", "Không thể tải danh sách bác sĩ");
      setDoctors([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDoctors();
    }, [])
  );

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return doctors;

    return doctors.filter((doc) => {
      const name = doc.full_name.toLowerCase();
      const specs = doc.specializations.join(" ").toLowerCase();
      const room = doc.room_number ? String(doc.room_number) : "";
      const dept = doc.department_name.toLowerCase();
      return (
        name.includes(q) ||
        specs.includes(q) ||
        room.includes(q) ||
        dept.includes(q)
      );
    });
  }, [doctors, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoctors(true);
  }, []);

  const getAvatarColor = (name) => {
    const colors = [
      ["#4f46e5", "#7c3aed"],
      ["#0ea5e9", "#3b82f6"],
      ["#10b981", "#059669"],
      ["#f59e0b", "#d97706"],
      ["#ef4444", "#dc2626"],
      ["#8b5cf6", "#7c3aed"],
      ["#ec4899", "#db2777"],
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderDoctorItem = ({ item, index }) => {
  const avatarLetter = item.full_name.charAt(0).toUpperCase();
  const avatarColors = getAvatarColor(item.full_name);
  const specsText =
    item.specializations.length > 0
      ? item.specializations.join(" • ")
      : "Chưa có chuyên môn";
  
  const roomText = item.room_number
    ? `Phòng ${item.room_number}`
    : "Chưa phân phòng";
  
  const hasExperience = item.experience_years && item.experience_years > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.cardWrapper} // XÓA phần opacity có index
      onPress={() =>
        navigation.navigate("DoctorDetail", { doctorId: item.id })
      }
    >
        <LinearGradient
          colors={["#ffffff", "#f8fafc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            <LinearGradient
              colors={avatarColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              {item.room_number && (
                <View style={styles.roomBadge}>
                  <Text style={styles.roomBadgeText}>P{item.room_number}</Text>
                </View>
              )}
            </LinearGradient>

            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.full_name}
                </Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate("EditDoctor", { doctorId: item.id });
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#e0e7ff", "#c7d2fe"]}
                    style={styles.editButtonGradient}
                  >
                    <Ionicons name="pencil" size={16} color="#4f46e5" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {item.specializations.length > 0 && (
                <View style={styles.specializationsContainer}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.specializationsText} numberOfLines={1}>
                    {specsText}
                  </Text>
                </View>
              )}

              <View style={styles.detailsRow}>
                {hasExperience && (
                  <View style={styles.detailBadge}>
                    <Ionicons name="time" size={12} color="#64748b" />
                    <Text style={styles.detailText}>
                      {item.experience_years} năm KN
                    </Text>
                  </View>
                )}
                
                <View style={[styles.detailBadge, { 
                  backgroundColor: item.room_number ? "#e0f2fe" : "#f1f5f9" 
                }]}>
                  <Ionicons 
                    name="home" 
                    size={12} 
                    color={item.room_number ? "#0ea5e9" : "#94a3b8"} 
                  />
                  <Text style={[
                    styles.detailText,
                    { color: item.room_number ? "#0ea5e9" : "#94a3b8" }
                  ]}>
                    {roomText}
                  </Text>
                </View>
              </View>

              {item.department_name !== "Chưa phân khoa" && (
                <View style={styles.departmentContainer}>
                  <LinearGradient
                    colors={["#f0f9ff", "#e0f2fe"]}
                    style={styles.departmentBadge}
                  >
                    <Ionicons name="business" size={12} color="#0ea5e9" />
                    <Text style={styles.departmentText}>
                      {item.department_name}
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* StatusBar riêng biệt */}
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* HEADER - ĐÃ FIX KHÔNG CÒN TRỐNG */}
      <LinearGradient 
        colors={["#4f46e5", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AdminHome")}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.titleContainer}>
              <Ionicons name="people" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Quản Lý Bác Sĩ</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {doctors.length} bác sĩ trong hệ thống
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={fetchDoctors}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchCard}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color="#64748b" />
          </View>
          <TextInput
            placeholder="Tìm kiếm bác sĩ, chuyên môn, khoa..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* DOCTORS LIST */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctorItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4f46e5"]}
            tintColor="#4f46e5"
            progressBackgroundColor="#f8fafc"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <LinearGradient
              colors={["#e0e7ff", "#c7d2fe"]}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="person-remove" size={64} color="#4f46e5" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Không tìm thấy bác sĩ" : "Chưa có bác sĩ nào"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? "Thử tìm kiếm với từ khóa khác"
                : "Nhấn nút (+) để thêm bác sĩ mới"
              }
            </Text>
          </View>
        }
      />

      {/* FAB BUTTON */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => navigation.navigate("CreateDoctorAccount")}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#4f46e5", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </LinearGradient>
        <Text style={styles.fabText}>Thêm mới</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  // ✅ HEADER ĐÃ FIX - SÁT TOP + CONTENT CÓ PADDING TOP 60
  header: {
    paddingTop: 60, // Cực nhỏ, StatusBar đã xử lý riêng
    paddingBottom: 20,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 4 : 2, // Padding nhỏ bên trong
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingTop: 60, // ✅ THÊM PADDING TOP 60 CHO CONTENT
    paddingHorizontal: 20,
    paddingBottom: 120, // Tăng thêm để FAB không che nội dung
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
  },
  roomBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#f8fafc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roomBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4f46e5",
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  editButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  specializationsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  specializationsText: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "600",
    marginLeft: 6,
    flex: 1,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  detailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  departmentContainer: {
    marginTop: 4,
  },
  departmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 6,
  },
  departmentText: {
    fontSize: 12,
    color: "#0ea5e9",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    alignItems: "center",
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  fabText: {
    marginTop: 6,
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "700",
  },
};