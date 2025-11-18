// src/screens/patient/MedicalRecordScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import theme from "../../theme/theme";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOWS,
} = theme;

export default function MedicalRecordScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("records");
  const [records, setRecords] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatientData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const patientId = user.id;

      if (activeTab === "records") {
        const { data, error } = await supabase
          .from("medical_records")
          .select(`
            id,
            created_at,
            diagnosis,
            treatment,
            notes,
            doctor:doctors!doctor_id (
              name,
              user_profiles!id (full_name)
            ),
            prescriptions (
              medicine_name,
              dosage,
              duration
            ),
            appointments!appointment_id (date)
          `)
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map(record => ({
          ...record,
          doctor_name: record.doctor?.user_profiles?.full_name || record.doctor?.name || "Bác sĩ chưa xác định",
          prescriptions: record.prescriptions || []
        }));

        setRecords(formatted);
      } else {
        const { data, error } = await supabase
          .from("test_results")
          .select("*")
          .eq("patient_id", patientId)
          .order("performed_at", { ascending: false });

        if (error) throw error;
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
    fetchPatientData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatientData(true);
  };

  const openFile = async (url) => {
    if (!url) return;
    try {
      if (url.toLowerCase().includes(".pdf")) {
        Linking.openURL(url);
      } else {
        const filename = url.split("/").pop();
        const result = await FileSystem.downloadAsync(url, FileSystem.documentDirectory + filename);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
      }
    } catch (e) {
      console.log("Lỗi mở file:", e);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải bệnh án...</Text>
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
        <Text style={styles.title}>Bệnh án điện tử</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === "records" && styles.tabActive]} onPress={() => setActiveTab("records")}>
          <Ionicons name="document-text" size={20} color={activeTab === "records" ? "#FFF" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "records" && styles.tabTextActive]}>Bệnh án ({records.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "tests" && styles.tabActive]} onPress={() => setActiveTab("tests")}>
          <Ionicons name="flask" size={20} color={activeTab === "tests" ? "#FFF" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "tests" && styles.tabTextActive]}>Xét nghiệm ({tests.length})</Text>
        </TouchableOpacity>
      </View>

      {/* NỘI DUNG */}
      {activeTab === "records" ? (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="documents-outline" size={70} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có bệnh án</Text>
              <Text style={styles.emptySub}>Bác sĩ sẽ cập nhật sau mỗi lần khám</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString("vi-VN", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                  </Text>
                  <Ionicons name="person-circle" size={38} color={COLORS.primary} />
                </View>

                <Text style={styles.doctor}>BS. {item.doctor_name}</Text>

                {item.diagnosis && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Chẩn đoán</Text>
                    <Text style={styles.text}>{item.diagnosis}</Text>
                  </View>
                )}

                {item.treatment && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Điều trị</Text>
                    <Text style={styles.text}>{item.treatment}</Text>
                  </View>
                )}

                {/* ĐƠN THUỐC CHI TIẾT – SIÊU ĐẸP */}
                {item.prescriptions && item.prescriptions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Đơn thuốc ({item.prescriptions.length} thuốc)</Text>
                    {item.prescriptions.map((med, i) => (
                      <View key={i} style={styles.medicineItem}>
                        <Text style={styles.medicineName}>• {med.medicine_name}</Text>
                        <Text style={styles.medicineDetail}>
                          {med.dosage} • {med.duration}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {item.notes && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Ghi chú</Text>
                    <Text style={styles.text}>{item.notes}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        />
      ) : (
        // Tab Xét nghiệm giữ nguyên
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flask-outline" size={70} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có kết quả xét nghiệm</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
              <TouchableOpacity style={[styles.testCard, item.status === "abnormal" && styles.testWarning]} onPress={() => item.file_url && openFile(item.file_url)} activeOpacity={0.9}>
                <View style={styles.testHeader}>
                  <Text style={styles.testName}>{item.test_name}</Text>
                  {item.status === "abnormal" ? <Ionicons name="warning" size={28} color={COLORS.warning} /> : item.status === "critical" ? <Ionicons name="alert-circle" size={28} color={COLORS.danger} /> : <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />}
                </View>
                <Text style={styles.result}>
                  {item.result_value} {item.unit}
                  {item.reference_range && <Text style={styles.normalRange}> (Bình thường: {item.reference_range})</Text>}
                </Text>
                {item.file_url && (
                  <View style={styles.fileTag}>
                    <Ionicons name="document-attach" size={18} color={COLORS.primary} />
                    <Text style={styles.fileText}>Xem file PDF</Text>
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

// STYLE ĐÃ BỔ SUNG CHO ĐƠN THUỐC
const styles = {
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: Platform.OS === "ios" ? 60 : 40, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg, borderBottomLeftRadius: BORDER_RADIUS.xxxl },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  tabs: { flexDirection: "row", margin: SPACING.xl, marginBottom: SPACING.md, backgroundColor: "#FFF", borderRadius: BORDER_RADIUS.xl, overflow: "hidden", ...SHADOWS.card },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#FFF" },
  list: { padding: SPACING.xl, paddingTop: 0 },
  card: { backgroundColor: "#FFF", borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.card },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  date: { fontSize: 15, fontWeight: "600", color: COLORS.primary },
  doctor: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary, marginVertical: 8 },
  section: { marginTop: 16 },
  label: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  text: { fontSize: 16, color: COLORS.textPrimary, marginTop: 6, lineHeight: 23 },
  medicineItem: { marginTop: 10, padding: 12, backgroundColor: "#F0FDF4", borderRadius: BORDER_RADIUS.lg, borderLeftWidth: 4, borderLeftColor: COLORS.success },
  medicineName: { fontSize: 16, fontWeight: "bold", color: COLORS.textPrimary },
  medicineDetail: { fontSize: 15, color: "#16A34A", marginTop: 4 },
  testCard: { backgroundColor: "#FFF", borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.card },
  testWarning: { borderLeftWidth: 5, borderLeftColor: COLORS.warning },
  testHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  testName: { fontSize: 17, fontWeight: "bold", color: COLORS.textPrimary },
  result: { fontSize: 16, color: COLORS.textSecondary, marginTop: 6 },
  normalRange: { fontSize: 14, color: "#94A3B8" },
  fileTag: { flexDirection: "row", alignItems: "center", marginTop: 12, backgroundColor: COLORS.primary + "15", paddingHorizontal: 12, paddingVertical: 8, borderRadius: BORDER_RADIUS.lg, alignSelf: "flex-start" },
  fileText: { marginLeft: 6, color: COLORS.primary, fontWeight: "600" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  empty: { alignItems: "center", marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, textAlign: "center" },
};