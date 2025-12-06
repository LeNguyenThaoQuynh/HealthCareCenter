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
  TextInput,
  Modal,
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
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: () => "#1E293B",
  style: { borderRadius: 16 },
  propsForDots: { r: "6", strokeWidth: "3", stroke: "#2563EB" },
  propsForBackgroundLines: { strokeDasharray: "" },
};

export default function WeightBMIScreen({ navigation }) {
  const [tab, setTab] = useState("chart");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const bmi = weight && height ? (weight / (height / 100) ** 2).toFixed(1) : "";

  // Load data
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("health_records")
      .select("weight_kg, height_cm, bmi, recorded_at")
      .eq("user_id", user.id)
      .not("weight_kg", "is", null)
      .order("recorded_at", { ascending: true });

    if (!error) setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addRecord = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!weight || !height) {
      Alert.alert("Thiếu dữ liệu", "Vui lòng nhập đầy đủ cân nặng và chiều cao");
      return;
    }

    const newBMI = (weight / (height / 100) ** 2).toFixed(1);

    const { error } = await supabase.from("health_records").insert([
  {
    user_id: user.id,
    weight_kg: parseFloat(weight),
    height_cm: parseFloat(height),
    recorded_at: new Date().toISOString(),
  },
]);


if (error) {
  console.log("INSERT ERROR:", error); // <-- thêm dòng này
  Alert.alert("Lỗi", "Không thể lưu số đo");
  return;
}


    setShowModal(false);
    setWeight("");
    setHeight("");
    fetchData();
  };

  const recentData = records.slice(-30);

  const chartData = {
    labels:
      recentData.length > 0
        ? recentData.map((r) => format(new Date(r.recorded_at), "dd/MM"))
        : ["--"],
    datasets: [
      { data: recentData.map((r) => r.weight_kg || 0), color: () => "#3B82F6", strokeWidth: 3 },
      { data: recentData.map((r) => r.height_cm || 0), color: () => "#8B5CF6", strokeWidth: 3 },
      { data: recentData.map((r) => r.bmi || 0), color: () => "#EF4444", strokeWidth: 3 },
    ],
    legend: ["Cân nặng", "Chiều cao", "BMI"],
  };

  const minWeight = records.length ? Math.min(...records.map((r) => r.weight_kg)).toFixed(1) : "-";
  const maxWeight = records.length ? Math.max(...records.map((r) => r.weight_kg)).toFixed(1) : "-";

  const minHeight = records.length ? Math.min(...records.map((r) => r.height_cm)).toFixed(0) : "-";
  const maxHeight = records.length ? Math.max(...records.map((r) => r.height_cm)).toFixed(0) : "-";

  const minBMI = records.length ? Math.min(...records.map((r) => r.bmi)).toFixed(1) : "-";
  const maxBMI = records.length ? Math.max(...records.map((r) => r.bmi)).toFixed(1) : "-";

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", marginRight: 28 }}>
          <Text style={styles.title}>SỐ ĐO CÂN NẶNG</Text>
        </View>
      </LinearGradient>

      {/* Tab */}
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
        {/* Tab Chart */}
        {tab === "chart" ? (
          <>
            <View style={styles.statsContainer}>
              {/* Weight */}
              <View style={styles.statSection}>
                <Text style={styles.sectionTitle}>Cân nặng (kg)</Text>
                <View style={styles.statRow}>
                  <Text style={styles.minMaxLabel}>Thấp</Text>
                  <Text style={styles.minMaxValue}>{minWeight}</Text>
                  <Text style={styles.minMaxLabel}>Cao</Text>
                  <Text style={styles.minMaxValue}>{maxWeight}</Text>
                </View>
              </View>

              {/* Height */}
              <View style={styles.statSection}>
                <Text style={styles.sectionTitle}>Chiều cao (cm)</Text>
                <View style={styles.statRow}>
                  <Text style={styles.minMaxLabel}>Thấp</Text>
                  <Text style={styles.minMaxValue}>{minHeight}</Text>
                  <Text style={styles.minMaxLabel}>Cao</Text>
                  <Text style={styles.minMaxValue}>{maxHeight}</Text>
                </View>
              </View>

              {/* BMI */}
              <View style={styles.statSection}>
                <Text style={styles.sectionTitle}>BMI</Text>
                <View style={styles.statRow}>
                  <Text style={styles.minMaxLabel}>Thấp</Text>
                  <Text style={[styles.minMaxValue, { color: "#EF4444" }]}>{minBMI}</Text>
                  <Text style={styles.minMaxLabel}>Cao</Text>
                  <Text style={[styles.minMaxValue, { color: "#EF4444" }]}>{maxBMI}</Text>
                </View>
              </View>
            </View>

            {/* Chart */}
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
              <Text style={styles.noData}>Chưa có dữ liệu để hiển thị biểu đồ</Text>
            )}
          </>
        ) : (
          // Tab History
          <View style={styles.historyList}>
            {records.length === 0 ? (
              <Text style={styles.noData}>Chưa có dữ liệu</Text>
            ) : (
              records.map((r, i) => (
                <View key={i} style={styles.historyItem}>
                  <Text style={styles.historyDate}>
                    {format(new Date(r.recorded_at), "dd 'tháng' MM, yyyy 'lúc' HH:mm", {
                      locale: vi,
                    })}
                  </Text>
                  <Text style={styles.historyValue}>
                    {r.weight_kg} kg • {r.height_cm} cm • BMI {r.bmi}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={32} color="#FFF" />
        <Text style={styles.fabText}>Thêm số đo</Text>
      </TouchableOpacity>

      {/* Modal Form */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm số đo mới</Text>

            <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="VD: 65"
            />

            <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="VD: 170"
            />

            <Text style={styles.bmiPreview}>BMI: {bmi || "--"}</Text>

            <TouchableOpacity style={styles.saveBtn} onPress={addRecord}>
              <Text style={styles.saveBtnText}>Lưu số đo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

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
  activeTab: { backgroundColor: "#2563EB" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#FFF" },

  statsContainer: { marginHorizontal: 20, marginTop: 20 },
  statSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 10 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
  },
  minMaxLabel: { color: "#64748B", fontSize: 14 },
  minMaxValue: { fontSize: 24, fontWeight: "800", color: "#2563EB" },

  chartWrapper: { alignItems: "center", marginVertical: 20 },
  noData: { textAlign: "center", color: "#94A3B8", fontSize: 16, marginTop: 40 },

  historyList: { padding: 20 },
  historyItem: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyDate: { color: "#64748B", fontSize: 14 },
  historyValue: { fontWeight: "600", fontSize: 15 },

  fab: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 8,
  },
  fabText: { color: "#FFF", fontSize: 18, fontWeight: "700", marginLeft: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16, textAlign: "center" },

  inputLabel: { fontSize: 14, fontWeight: "600", color: "#475569", marginTop: 12 },
  input: {
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
    fontSize: 16,
  },

  bmiPreview: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#EF4444",
    marginVertical: 14,
  },

  saveBtn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  saveBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700", textAlign: "center" },

  cancelBtn: {
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: "#E2E8F0",
  },
  cancelBtnText: { textAlign: "center", fontWeight: "700", fontSize: 16, color: "#334155" },
});
