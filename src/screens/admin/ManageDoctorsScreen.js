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
import { supabase } from "../../api/supabase";
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

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredDoctors(doctors);
      return;
    }
    const filtered = doctors.filter((doc) => {
      const fullName = doc.user_profiles?.full_name?.toLowerCase() || "";
      const deptName = doc.departments?.name?.toLowerCase() || "";
      const specialization = doc.specialization?.toLowerCase() || "";
      return fullName.includes(query) || deptName.includes(query) || specialization.includes(query);
    });
    setFilteredDoctors(filtered);
  }, [searchQuery, doctors]);

  const handleDelete = (doctorId, doctorName) => {
    Alert.alert(
      "Xác nhận xóa",
      `Xóa bác sĩ "${doctorName}"?\nHành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteDoctorService(doctorId);
              if (result.success) {
                Alert.alert("Thành công", result.message, [
                  { text: "OK", onPress: () => fetchDoctors() },
                ]);
              } else {
                Alert.alert("Lỗi", result.message);
              }
            } catch (error) {
              Alert.alert("Lỗi", "Xóa thất bại");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderDoctorItem = ({ item }) => {
    const fullName = item.user_profiles?.full_name || "Không tên";
    const deptName = item.departments?.name || "Chưa có khoa";
    const avatarLetter = fullName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.doctorCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("Chi tiết bác sĩ", { doctorId: item.id })}
      >
        <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.cardGradient}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {item.user_profiles?.avatar_url ? (
              <Image source={{ uri: item.user_profiles.avatar_url }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={GRADIENTS.primaryButton} style={styles.avatarGradient}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoWrapper}>
            <Text style={styles.doctorName}>{fullName}</Text>
            <Text style={styles.doctorDept}>{deptName}</Text>
            <View style={styles.row}>
              <Ionicons name="medkit-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{item.specialization || "Chưa cập nhật"}</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>Phòng {item.room_number || "Chưa có"}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate("Sửa bác sĩ", { doctorId: item.id });
              }}
            >
              <Ionicons name="pencil" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.id, fullName);
              }}
            >
              <Ionicons name="trash" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý bác sĩ</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AdminHome")} style={styles.homeBtn}>
          <Ionicons name="home" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          placeholder="Tìm tên, khoa, chuyên môn..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor={COLORS.textLight}
          autoCorrect={false}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* LIST */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDoctorItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDoctors(true); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={80} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Chưa có bác sĩ nào</Text>
            <Text style={styles.emptySubtitle}>Danh sách sẽ xuất hiện tại đây</Text>
          </View>
        }
      />
    </View>
  );
}

// STYLES ĐÃ ĐƯỢC CHUYỂN DÙNG THEME MỚI – ĐẸP, SẠCH, ĐỒNG NHẤT
const styles = {
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: FONT_WEIGHT.bold,
    color: "#FFFFFF",
  },
  homeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    height: 52,
    ...SHADOWS.card,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  clearBtn: { padding: 4 },

  listContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.md,
  },

  doctorCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.xl,
    minHeight: 110,
  },
  avatarWrapper: {
    marginRight: SPACING.lg,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  infoWrapper: { flex: 1 },
  doctorName: {
    fontSize: 18,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  doctorDept: {
    fontSize: 15,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: FONT_WEIGHT.semibold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.danger + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
};