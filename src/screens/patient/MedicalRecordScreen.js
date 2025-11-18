import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import theme from "../../theme/theme";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
} = theme;

export default function MedicalRecordScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("records"); // 'records' | 'tests'
  const [records, setRecords] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (activeTab === "records") {
        const { data } = await supabase
          .from("medical_records")
          .select(`
            *,
            doctor:user_profiles(full_name),
            appointments!appointment_id(date)
          `)
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false });
        setRecords(data || []);
      } else {
        const { data } = await supabase
          .from("test_results")
          .select("*")
          .eq("patient_id", user.id)
          .order("performed_at", { ascending: false, nullsLast: true });
        setTests(data || []);
      }
    } catch (err) {
      console.error("Lỗi tải bệnh án:", err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const openFile = async (url, filename = "ket_qua.pdf") => {
    if (!url) return;
    try {
      if (url.toLowerCase().includes(".pdf")) {
        Linking.openURL(url);
      } else {
        const result = await FileSystem.downloadAsync(url, FileSystem.documentDirectory + filename);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri);
        }
      }
    } catch (e) {
      console.log("Lỗi mở file:", e);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải bệnh án...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bệnh án điện tử</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "records" && styles.tabActive]}
          onPress={() => setActiveTab("records")}
        >
          <Ionicons name="document-text-outline" size={22} color={activeTab === "records" ? "#FFF" : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === "records" && styles.tabTextActive]}>
            Bệnh án ({records.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tests" && styles.tabActive]}
          onPress={() => setActiveTab("tests")}
        >
          <Ionicons name="flask-outline" size={22} color={activeTab === "tests" ? "#FFF" : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === "tests" && styles.tabTextActive]}>
            Cận lâm sàng ({tests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {activeTab === "records" ? (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={80} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>Chưa có bệnh án</Text>
              <Text style={styles.emptySubtitle}>Các bệnh án sẽ xuất hiện tại đây</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
              <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>
                    {new Date(item.created_at).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                  <Ionicons name="person-circle" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.doctorName}>BS. {item.doctor?.full_name || "Không xác định"}</Text>
                {item.diagnosis && (
                  <>
                    <Text style={styles.label}>Chẩn đoán</Text>
                    <Text style={styles.value}>{item.diagnosis}</Text>
                  </>
                )}
                {item.prescription && (
                  <>
                    <Text style={styles.label}>Đơn thuốc</Text>
                    <Text style={styles.value}>{item.prescription}</Text>
                  </>
                )}
                {item.notes && (
                  <>
                    <Text style={styles.label}>Ghi chú</Text>
                    <Text style={styles.value}>{item.notes}</Text>
                  </>
                )}
              </View>
            </Animated.View>
          )}
        />
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="flask-outline" size={80} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>Chưa có kết quả xét nghiệm</Text>
              <Text style={styles.emptySubtitle}>Kết quả sẽ được cập nhật sau khi có</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
              <TouchableOpacity
                style={[styles.testCard, item.status === "abnormal" && styles.testCardWarning]}
                onPress={() => item.file_url && openFile(item.file_url, `${item.test_name.replace(/\s/g, "_")}.pdf`)}
                activeOpacity={0.8}
              >
                <View style={styles.testHeader}>
                  <Text style={styles.testName}>{item.test_name}</Text>
                  {item.status === "abnormal" ? (
                    <Ionicons name="warning" size={32} color={COLORS.warning} />
                  ) : item.status === "critical" ? (
                    <Ionicons name="alert-circle" size={32} color={COLORS.danger} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                  )}
                </View>
                <Text style={styles.testValue}>
                  {item.result_value} {item.unit}
                  {item.reference_range && (
                    <Text style={styles.refRange}> (Bình thường: {item.reference_range})</Text>
                  )}
                </Text>
                {item.file_url && (
                  <View style={styles.fileBadge}>
                    <Ionicons name="document-attach" size={20} color={COLORS.primary} />
                    <Text style={styles.fileText}>Xem file kết quả</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 24,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: FONT_WEIGHT.bold, color: "#FFF" },

  tabContainer: {
    flexDirection: "row",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS.xxl,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 16, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textSecondary },
  tabTextActive: { color: "#FFF" },

  list: { padding: SPACING.xl, paddingTop: 0 },

  recordCard: {
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  recordDate: { fontSize: 16, fontWeight: FONT_WEIGHT.semibold, color: COLORS.warning },
  doctorName: { fontSize: 20, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  label: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.lg, fontWeight: FONT_WEIGHT.semibold },
  value: { fontSize: 17, color: COLORS.textPrimary, marginTop: 6, lineHeight: 24 },

  testCard: {
    backgroundColor: "#FFF",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  testCardWarning: { borderLeftWidth: 6, borderLeftColor: COLORS.warning },
  testHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  testName: { fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  testValue: { fontSize: 17, color: COLORS.textSecondary, marginTop: 8 },
  refRange: { fontSize: 15, color: COLORS.textLight },
  fileBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    alignSelf: "flex-start",
  },
  fileText: { marginLeft: 8, color: COLORS.primary, fontSize: 15, fontWeight: FONT_WEIGHT.semibold },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: FONT_SIZE.lg, color: COLORS.textPrimary },

  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginTop: 20 },
  emptySubtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8 },
});