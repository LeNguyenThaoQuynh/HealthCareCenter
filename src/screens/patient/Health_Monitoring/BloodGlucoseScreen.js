import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "../../../api/supabase";

const { width } = Dimensions.get("window");

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
  labelColor: () => "#1E293B",
  style: { borderRadius: 16 },
  propsForDots: { r: "6", strokeWidth: "3", stroke: "#8B5CF6" },
};

export default function BloodGlucoseScreen({ navigation }) {
  const [tab, setTab] = useState("chart");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("health_records")
      .select("blood_glucose_mgdl, recorded_at")
      .eq("user_id", user.id)
      .not("blood_glucose_mgdl", "is", null)
      .order("recorded_at", { ascending: true });

    if (!error) {
      setRecords(data || []);
    } else {
      Alert.alert("Lỗi", "Không thể tải dữ liệu đường huyết");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addGlucoseRecord = async () => {
    const value = parseInt(glucoseValue);

    if (!value || value < 30 || value > 600) {
      Alert.alert("Lỗi", "Giá trị đường huyết phải từ 30 - 600 mg/dL");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("health_records").insert({
      user_id: user.id,
      blood_glucose_mgdl: value,
    });

    if (error) {
      Alert.alert("Lỗi", "Không thể thêm số đo");
      return;
    }

    setModalVisible(false);
    setGlucoseValue("");
    fetchData();
  };

  const recentData = records.slice(-30);

  const chartData = {
    labels:
      recentData.length > 0
        ? recentData.map((r) => format(new Date(r.recorded_at), "dd/MM"))
        : ["--"],
    datasets: [
      {
        data: recentData.map((r) => r.blood_glucose_mgdl || 0),
        color: () => "#8B5CF6",
        strokeWidth: 3,
      },
    ],
    legend: ["Đường huyết (mg/dL)"],
  };

  const values = records.map((r) => r.blood_glucose_mgdl).filter(Boolean);
  const minValue = values.length ? Math.min(...values) : "-";
  const maxValue = values.length ? Math.max(...values) : "-";

  const getStatus = (value) => {
    if (value < 70) return { text: "Hạ đường huyết", color: "#F59E0B" };
    if (value <= 99) return { text: "Bình thường", color: "#10B981" };
    if (value <= 125) return { text: "Tiền tiểu đường", color: "#F59E0B" };
    return { text: "Tiểu đường", color: "#EF4444" };
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#8B5CF6", "#A78BFA"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", marginRight: 28 }}>
          <Text style={styles.title}>ĐƯỜNG HUYẾT</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === "chart" && styles.activeTab]}
          onPress={() => setTab("chart")}
        >
          <Text style={[styles.tabText, tab === "chart" && styles.activeTabText]}>
            Biểu đồ sức khỏe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === "history" && styles.activeTab]}
          onPress={() => setTab("history")}
        >
          <Text style={[styles.tabText, tab === "history" && styles.activeTabText]}>
            Lịch sử đo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateFilter}>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Từ ngày</Text>
            <Text style={styles.dateValue}>06/11/2025</Text>
            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Đến ngày</Text>
            <Text style={styles.dateValue}>06/12/2025</Text>
            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
          </View>
        </View>

        {tab === "chart" ? (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statSection}>
                <Text style={styles.sectionTitle}>Đường huyết (mg/dL)</Text>
                <View style={styles.statRow}>
                  <Text style={styles.minMaxLabel}>Thấp nhất</Text>
                  <Text style={[styles.minMaxValue, { color: "#8B5CF6" }]}>
                    {minValue}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.minMaxLabel}>Cao nhất</Text>
                  <Text style={[styles.minMaxValue, { color: "#8B5CF6" }]}>
                    {maxValue}
                  </Text>
                </View>
              </View>
            </View>

            {recentData.length > 0 ? (
              <View style={styles.chartWrapper}>
                <LineChart
                  data={chartData}
                  width={width - 40}
                  height={300}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withHorizontalLines={true}
                  withVerticalLines={false}
                />
              </View>
            ) : (
              <Text style={styles.noData}>Chưa có dữ liệu đường huyết</Text>
            )}

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: "#8B5CF6" }]} />
                <Text style={styles.legendText}>Đường huyết</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.historyList}>
            {records.length === 0 ? (
              <Text style={styles.noData}>Chưa có dữ liệu</Text>
            ) : (
              records.map((r, i) => {
                const status = getStatus(r.blood_glucose_mgdl);
                return (
                  <View key={i} style={styles.historyItem}>
                    <View>
                      <Text style={styles.historyDate}>
                        {format(
                          new Date(r.recorded_at),
                          "dd 'tháng' MM, yyyy 'lúc' HH:mm",
                          { locale: vi }
                        )}
                      </Text>
                      <Text style={[styles.historyStatus, { color: status.color }]}>
                        {status.text}
                      </Text>
                    </View>
                    <Text style={styles.historyValue}>
                      {r.blood_glucose_mgdl} mg/dL
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#FFF" />
        <Text style={styles.fabText}>Thêm số đo</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nhập đường huyết (mg/dL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 110"
              keyboardType="numeric"
              value={glucoseValue}
              onChangeText={setGlucoseValue}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={addGlucoseRecord}>
                <Text style={styles.saveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F3FF" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: "center",
    flexDirection: "row",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#FFF" },
  subtitle: { fontSize: 14, color: "#E0E7FF", marginTop: 4 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#E0E7FF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  activeTab: { backgroundColor: "#8B5CF6" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#FFF" },
  dateFilter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
  },
  dateBox: {
    backgroundColor: "#E0E7FF",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "48%",
  },
  dateLabel: { fontSize: 13, color: "#64748B" },
  dateValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginVertical: 4,
  },
  statsContainer: { marginHorizontal: 20, marginTop: 20 },
  statSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 10 },
  statRow: {
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  minMaxLabel: { color: "#64748B", fontSize: 14 },
  minMaxValue: { fontSize: 28, fontWeight: "800", color: "#8B5CF6" },
  chartWrapper: { alignItems: "center", marginVertical: 20 },
  chart: { borderRadius: 16 },
  noData: { textAlign: "center", color: "#94A3B8", fontSize: 16, marginTop: 40 },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  legendItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 14, color: "#1E293B" },
  historyList: { padding: 20 },
  historyItem: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: { color: "#64748B", fontSize: 14 },
  historyStatus: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  historyValue: { fontSize: 18, fontWeight: "800", color: "#8B5CF6" },
  fab: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 8,
  },
  fabText: { color: "#FFF", fontSize: 18, fontWeight: "700", marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14, textAlign: "center" },
  input: {
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  cancelText: { color: "#475569", fontWeight: "700", fontSize: 16 },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
  },
  saveText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
