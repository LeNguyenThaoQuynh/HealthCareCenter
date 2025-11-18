import React, { useState, useEffect } from "react";
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
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getAllDoctorsService, deleteDoctorService } from "../../services/doctor/doctorService";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOWS,
} = theme;

export default function ManageDoctorsScreen() {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getAllDoctorsService();
      setDoctors(data || []);
      setFilteredDoctors(data || []);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách bác sĩ");
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredDoctors(doctors);
      return;
    }
    const filtered = doctors.filter(doc =>
      (doc.user_profiles?.full_name?.toLowerCase() || "").includes(q) ||
      (doc.departments?.name?.toLowerCase() || "").includes(q) ||
      (doc.specialization?.toLowerCase() || "").includes(q)
    );
    setFilteredDoctors(filtered);
  }, [searchQuery, doctors]);

  const handleDelete = (id, name) => {
    Alert.alert("Xóa bác sĩ", `Xóa bác sĩ "${name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa", style: "destructive",
        onPress: async () => {
          setLoading(true);
          const res = await deleteDoctorService(id);
          Alert.alert(res.success ? "Thành công" : "Lỗi", res.message, [
            { text: "OK", onPress: fetchDoctors }
          ]);
          setLoading(false);
        }
      },
    ]);
  };

  const renderDoctorItem = ({ item }) => {
    const name = item.user_profiles?.full_name || "Bác sĩ";
    const dept = item.departments?.name || "Chưa xác định";
    const avatarLetter = name.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("Chi tiết bác sĩ", { doctorId: item.id })}
      >
        {/* CARD ĐẸP – NHỎ GỌN – MÀU TRẮNG SẠCH */}
        <View style={styles.card}>
          {/* Avatar nhỏ gọn */}
          <View style={styles.avatarWrapper}>
            {item.user_profiles?.avatar_url ? (
              <Image source={{ uri: item.user_profiles.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={GRADIENTS.primaryButton} style={styles.avatar}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </LinearGradient>
            )}
          </View>

          <View style={styles.content}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.specialist}>{item.specialization || "Bác sĩ đa khoa"}</Text>
            <View style={styles.deptRow}>
              <Ionicons name="business-outline" size={13} color={COLORS.primary} />
              <Text style={styles.deptText}>{dept}</Text>
            </View>
          </View>

          {/* Nút hành động nhỏ gọn, đẹp */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={(e) => { e.stopPropagation(); navigation.navigate("Sửa bác sĩ", { doctorId: item.id }); }}
            >
              <Ionicons name="pencil" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={(e) => { e.stopPropagation(); handleDelete(item.id, name); }}
            >
              <Ionicons name="trash" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER NHỎ GỌN */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý bác sĩ</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AdminHome")} style={styles.homeBtn}>
          <Ionicons name="home" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* SEARCH BAR NHỎ GỌN */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          placeholder="Tìm bác sĩ..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={22} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDoctorItem}
        contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDoctors(true); }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="medkit-outline" size={70} color="#CBD5E1" />
            <Text style={styles.emptyText}>Chưa có bác sĩ nào</Text>
          </View>
        }
      />
    </View>
  );
}

// STYLE NHỎ GỌN – SẠCH – ĐẸP – KHÔNG MỜ NỮA!
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
  backBtn: { padding: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 22 },
  homeBtn: { padding: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 22 },
  headerTitle: { fontSize: 22, fontWeight: FONT_WEIGHT.bold, color: "#FFF" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    height: 50,
    ...SHADOWS.card,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.textPrimary },

  cardWrapper: { marginBottom: SPACING.md },

  // CARD TRẮNG SẠCH, NHỎ GỌN, KHÔNG MỜ
  card: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },

  avatarWrapper: { marginRight: SPACING.lg },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 24, fontWeight: "900", color: "#FFF" },

  content: { flex: 1 },
  name: { fontSize: 17, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  specialist: { fontSize: 14, color: COLORS.primary, marginTop: 2, fontWeight: "600" },
  deptRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  deptText: { marginLeft: 6, fontSize: 13.5, color: "#64748B" },

  actions: { flexDirection: "row", gap: 12 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.danger + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  empty: { alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 18, color: COLORS.textSecondary, marginTop: 16 },

  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
};