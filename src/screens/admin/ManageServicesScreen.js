import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const { COLORS } = theme;
const { width } = Dimensions.get("window");

export default function ManageServicesScreen() {
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const loadServices = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    if (isRefresh) setRefreshing(true);

    try {
      const { data } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      setServices(data || []);
      
      if (!isRefresh) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error("Error loading services:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách dịch vụ");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadServices();
    }, [])
  );

  const filtered = services.filter((s) =>
    [s.name, s.department, s.code].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const toggle = async (id, active) => {
    try {
      await supabase
        .from("services")
        .update({ is_active: !active })
        .eq("id", id);
      loadServices();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
    }
  };

  const remove = (id, name) => {
    Alert.alert(
      "Xóa dịch vụ",
      `Bạn có chắc chắn muốn xóa dịch vụ\n"${name}"?\n\nHành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.from("services").delete().eq("id", id);
              loadServices();
              Alert.alert("Thành công", "Đã xóa dịch vụ");
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa dịch vụ");
            }
          },
        },
      ]
    );
  };

  const ServiceCard = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { scale: scaleAnim },
          { 
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("EditService", { serviceId: item.id })}
        style={styles.serviceCard}
      >
        <LinearGradient
          colors={item.is_active ? ["#ffffff", "#f8fafc"] : ["#f8fafc", "#f1f5f9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.serviceCardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.is_active ? "rgba(34, 197, 94, 0.1)" : "rgba(100, 116, 139, 0.1)" }
              ]}>
                <Ionicons 
                  name={item.is_active ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color={item.is_active ? "#16a34a" : "#64748b"} 
                />
                <Text style={[
                  styles.statusText,
                  { color: item.is_active ? "#16a34a" : "#64748b" }
                ]}>
                  {item.is_active ? "Đang hoạt động" : "Tạm ngưng"}
                </Text>
              </View>
              
              <Text style={styles.serviceName} numberOfLines={2}>
                {item.name}
              </Text>
              
              <View style={styles.departmentContainer}>
                <Ionicons name="business" size={14} color="#64748b" />
                <Text style={styles.departmentText}>
                  {item.department || "Chưa phân khoa"}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardRight}>
              <View style={styles.codeContainer}>
                <LinearGradient
                  colors={["#4f46e5", "#7c3aed"]}
                  style={styles.codeBadge}
                >
                  <Text style={styles.codeText}>{item.code || "N/A"}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.priceContainer}>
              <Ionicons name="cash" size={20} color="#f59e0b" />
              <Text style={styles.priceText}>
                {Number(item.price).toLocaleString("vi-VN")}đ
              </Text>
            </View>
            
            <View style={styles.durationContainer}>
              <Ionicons name="time" size={16} color="#64748b" />
              <Text style={styles.durationText}>
                {item.duration_minutes || 15} phút
              </Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => navigation.navigate("EditService", { serviceId: item.id })}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#e0e7ff", "#c7d2fe"]}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={18} color="#4f46e5" />
                <Text style={styles.actionButtonText}>Sửa</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => toggle(item.id, item.is_active)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={item.is_active ? ["#fef3c7", "#fde68a"] : ["#e0e7ff", "#c7d2fe"]}
                style={styles.toggleButton}
              >
                <Ionicons
                  name={item.is_active ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color={item.is_active ? "#f59e0b" : "#4f46e5"}
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: item.is_active ? "#f59e0b" : "#4f46e5" }
                ]}>
                  {item.is_active ? "Ẩn" : "Hiện"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => remove(item.id, item.name)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#fee2e2", "#fecaca"]}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={[styles.actionButtonText, { color: "#ef4444" }]}>
                  Xóa
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

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
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.titleContainer}>
              <Ionicons name="medical" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Quản Lý Dịch Vụ</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {services.length} dịch vụ trong hệ thống
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateService")}
            style={styles.addButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </LinearGradient>
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
            placeholder="Tìm kiếm dịch vụ, khoa, mã số..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearch("")}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Đang tải danh sách dịch vụ...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={["#e0e7ff", "#c7d2fe"]}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="medical-outline" size={64} color="#4f46e5" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>
            {search ? "Không tìm thấy dịch vụ" : "Chưa có dịch vụ nào"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search 
              ? "Thử tìm kiếm với từ khóa khác"
              : "Nhấn nút (+) để thêm dịch vụ mới"
            }
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Ionicons name="list" size={20} color="#4f46e5" />
              <Text style={styles.statNumber}>{filtered.length}</Text>
              <Text style={styles.statLabel}>Tổng số</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4f46e5" />
              <Text style={styles.statNumber}>
                {services.filter(s => s.is_active).length}
              </Text>
              <Text style={styles.statLabel}>Đang hoạt động</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#4f46e5" />
              <Text style={styles.statNumber}>
                {services.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)}p
              </Text>
              <Text style={styles.statLabel}>Tổng thời gian</Text>
            </View>
          </View>
          
          {filtered.map((item, index) => (
            <ServiceCard key={item.id} item={item} index={index} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500"
  },
  // ✅ HEADER ĐÃ FIX - SÁT TOP + CONTENT PADDING TOP 60
  header: {
    paddingTop: 60, 
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
    paddingTop: Platform.OS === "ios" ? 4 : 2,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  addButtonGradient: {
    width: "100%",
    height: "100%",
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  scrollContent: {
    paddingTop: 60, // ✅ CONTENT CÓ PADDING TOP 60
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e2e8f0",
  },
  serviceCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  serviceCardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    lineHeight: 24,
  },
  departmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  departmentText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  cardRight: {
    alignItems: "flex-end",
  },
  codeContainer: {
    marginBottom: 12,
  },
  codeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: "center",
  },
  codeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f59e0b",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  durationText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
};