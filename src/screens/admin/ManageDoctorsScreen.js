// src/screens/admin/ManageDoctorsScreen.js
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS } = theme;

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
        .select(`
          id,
          name,
          room_number,
          experience_years,
          bio,
          specialization,
          department_name
        `)
        .order("name", { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map(doc => ({
        id: doc.id,
        full_name: doc.name?.trim() || "Bác sĩ",
        room_number: doc.room_number || null,
        experience_years: doc.experience_years,
        bio: doc.bio || null,
        department_name: doc.department_name || "Chưa phân khoa",
        // Tách chuỗi specialization thành mảng để hiển thị đẹp
        specializations: doc.specialization
          ? doc.specialization
              .split(",")
              .map(s => s.trim())
              .filter(s => s.length > 0)
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

  // Tự động reload khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      fetchDoctors();
    }, [])
  );

  // Tìm kiếm siêu nhanh
  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return doctors;

    return doctors.filter(doc => {
      const name = doc.full_name.toLowerCase();
      const specs = doc.specializations.join(" ").toLowerCase();
      const room = doc.room_number ? String(doc.room_number) : "";
      const dept = doc.department_name.toLowerCase();
      return name.includes(q) || specs.includes(q) || room.includes(q) || dept.includes(q);
    });
  }, [doctors, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoctors(true);
  }, []);

  const renderDoctorItem = ({ item }) => {
    const avatarLetter = item.full_name.charAt(0).toUpperCase();
    const specsText =
      item.specializations.length > 0
        ? item.specializations.join(" • ")
        : "Chưa có chuyên môn";
    const roomText = item.room_number ? `Phòng ${item.room_number}` : "Chưa phân phòng";

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.cardWrapper}
        onPress={() => navigation.navigate("DoctorDetail", { doctorId: item.id })}
      >
        <View style={styles.card}>
          <View style={styles.avatarWrapper}>
            <LinearGradient colors={GRADIENTS.primaryButton} style={styles.avatar}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </LinearGradient>
          </View>

          <View style={styles.content}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.specialist} numberOfLines={2}>{specsText}</Text>
            <Text style={styles.roomInfo}>{roomText}</Text>
            {item.department_name && item.department_name !== "Chưa phân khoa" && (
              <Text style={styles.department}>Khoa: {item.department_name}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate("EditDoctor", { doctorId: item.id });
            }}
          >
            <Ionicons name="pencil" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý bác sĩ</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AdminHome")} style={styles.homeBtn}>
          <Ionicons name="home" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          placeholder="Tìm tên, chuyên môn, phòng, khoa..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#94A3B8"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={22} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={item => item.id}
        renderItem={renderDoctorItem}
        contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.md, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="medkit-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyText}>Chưa có bác sĩ nào</Text>
            <Text style={styles.emptySub}>Nhấn nút (+) để thêm bác sĩ mới</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateDoctorAccount")}
        activeOpacity={0.9}
      >
        <LinearGradient colors={GRADIENTS.primaryButton} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  backBtn: { padding: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 25 },
  homeBtn: { padding: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 25 },
  headerTitle: { fontSize: 23, fontWeight: "bold", color: "#FFF" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    height: 52,
    ...SHADOWS.card,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.textPrimary },
  cardWrapper: { marginBottom: SPACING.md },
  card: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },
  avatarWrapper: { marginRight: SPACING.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 26, fontWeight: "900", color: "#FFF" },
  content: { flex: 1 },
  name: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  specialist: { fontSize: 14, color: "#555", marginTop: 6 },
  roomInfo: { fontSize: 13.5, color: COLORS.success, marginTop: 6, fontWeight: "500" },
  department: { fontSize: 13, color: COLORS.primary, marginTop: 4, fontStyle: "italic" },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...SHADOWS.large,
    elevation: 12,
  },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", marginTop: 100, paddingHorizontal: 40 },
  emptyText: { fontSize: 20, fontWeight: "600", color: COLORS.textSecondary, marginTop: 20 },
  emptySub: { fontSize: 15, color: "#94A3B8", marginTop: 8, textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
};