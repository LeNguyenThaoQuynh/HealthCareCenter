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
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: () => "#1E293B",
  propsForDots: { r: "6", strokeWidth: "3", stroke: "#2563EB" },
};

export default function BloodPressureScreen({ navigation }) {
  const [tab, setTab] = useState("chart");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [pulse, setPulse] = useState("");

  const fetchData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("health_records")
      .select("id, systolic_bp, diastolic_bp, heart_rate, recorded_at")
      .eq("user_id", user.id)
      .not("systolic_bp", "is", null)
      .order("recorded_at", { ascending: true });

    console.log("FETCH RESULT:", data);

    if (!error) setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveRecord = async () => {
    if (!sys || !dia) {
      return Alert.alert("Thiếu dữ liệu", "Vui lòng nhập đủ Tâm thu & Tâm trương");
    }

    const sysNum = Number(sys);
    const diaNum = Number(dia);
    const pulseNum = pulse ? Number(pulse) : null;

    if (sysNum < 50 || sysNum > 300)
      return Alert.alert("Lỗi", "Tâm thu phải từ 50 đến 300 mmHg");

    if (diaNum < 30 || diaNum > 150)
      return Alert.alert("Lỗi", "Tâm trương phải từ 30 đến 150 mmHg");

    if (diaNum >= sysNum)
      return Alert.alert("Lỗi", "Tâm trương phải nhỏ hơn Tâm thu");

    if (pulse && (pulseNum < 40 || pulseNum > 200))
      return Alert.alert("Lỗi", "Nhịp tim phải từ 40 đến 200");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert("Lỗi", "Bạn chưa đăng nhập");

    const payload = {
      user_id: user.id,
      systolic_bp: sysNum,
      diastolic_bp: diaNum,
      heart_rate: pulseNum,
      recorded_at: new Date(),
    };

    console.log("INSERT PAYLOAD:", payload);

    const { error } = await supabase.from("health_records").insert([payload]);

    if (error) {
      console.log("INSERT ERROR:", error);
      Alert.alert("Lỗi Supabase", error.message);
      return;
    }

    setModalVisible(false);
    setSys("");
    setDia("");
    setPulse("");
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
        data: recentData.map((r) => r.systolic_bp || 0),
        color: () => "#2563EB",
        strokeWidth: 3,
      },
      {
        data: recentData.map((r) => r.diastolic_bp || 0),
        color: () => "#EF4444",
        strokeWidth: 3,
      },
    ],
    legend: ["Tâm thu", "Tâm trương"],
  };

  const sysValues = records.map((r) => r.systolic_bp).filter(Boolean);
  const diaValues = records.map((r) => r.diastolic_bp).filter(Boolean);

  const minSys = sysValues.length ? Math.min(...sysValues) : "-";
  const maxSys = sysValues.length ? Math.max(...sysValues) : "-";
  const minDia = diaValues.length ? Math.min(...diaValues) : "-";
  const maxDia = diaValues.length ? Math.max(...diaValues) : "-";

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", marginRight: 28 }}>
          <Text style={styles.title}>SỐ ĐO HUYẾT ÁP</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === "chart" && styles.activeTab]}
          onPress={() => setTab("chart")}
        >
          <Text
            style={[styles.tabText, tab === "chart" && styles.activeTabText]}
          >
            Biểu đồ sức khỏe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === "history" && styles.activeTab]}
          onPress={() => setTab("history")}
        >
          <Text
            style={[styles.tabText, tab === "history" && styles.activeTabText]}
          >
            Lịch sử đo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} />
        }
      >
        {tab === "chart" ? (
          <>
            <View style={styles.statSection}>
              <Text style={styles.sectionTitle}>TÂM THU</Text>
              <View style={styles.statRow}>
                <Text style={styles.minMaxLabel}>Thấp nhất</Text>
                <Text style={styles.minMaxValue}>{minSys}</Text>
                <Text style={styles.minMaxLabel}>Cao nhất</Text>
                <Text style={styles.minMaxValue}>{maxSys}</Text>
              </View>
            </View>

            <View style={styles.statSection}>
              <Text style={styles.sectionTitle}>TÂM TRƯƠNG</Text>
              <View style={styles.statRow}>
                <Text style={styles.minMaxLabel}>Thấp nhất</Text>
                <Text style={styles.minMaxValue}>{minDia}</Text>
                <Text style={styles.minMaxLabel}>Cao nhất</Text>
                <Text style={styles.minMaxValue}>{maxDia}</Text>
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
                />
              </View>
            ) : (
              <Text style={styles.noData}>Chưa có dữ liệu</Text>
            )}
          </>
        ) : (
          <View style={styles.historyList}>
            {records.length === 0 ? (
              <Text style={styles.noData}>Chưa có dữ liệu</Text>
            ) : (
              records.map((r) => (
                <View key={r.id} style={styles.historyItem}>
                  <Text style={styles.historyDate}>
                    {format(new Date(r.recorded_at), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </Text>
                  <Text style={styles.historyValue}>
                    {r.systolic_bp}/{r.diastolic_bp} mmHg
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalWrapper}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nhập số đo huyết áp</Text>

            <TextInput
              placeholder="Tâm thu (mmHg)"
              style={styles.input}
              keyboardType="numeric"
              value={sys}
              onChangeText={setSys}
            />

            <TextInput
              placeholder="Tâm trương (mmHg)"
              style={styles.input}
              keyboardType="numeric"
              value={dia}
              onChangeText={setDia}
            />

            <TextInput
              placeholder="Mạch (tuỳ chọn)"
              style={styles.input}
              keyboardType="numeric"
              value={pulse}
              onChangeText={setPulse}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveRecord}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#E0E7FF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  activeTab: { backgroundColor: "#2563EB" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#FFF" },

  statSection: { marginHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  statRow: {
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  minMaxLabel: { color: "#64748B", fontSize: 14 },
  minMaxValue: { fontSize: 28, fontWeight: "800", color: "#2563EB" },

  chartWrapper: { alignItems: "center", marginVertical: 20 },
  chart: { borderRadius: 16 },
  noData: { textAlign: "center", fontSize: 16, color: "#94A3B8", marginTop: 40 },

  historyList: { padding: 20 },
  historyItem: {
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyDate: { fontSize: 14, color: "#64748B" },
  historyValue: { fontSize: 18, fontWeight: "800", color: "#2563EB" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#2563EB",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  modalWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
    color: "#1E293B",
  },
  input: {
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  cancelBtn: { marginTop: 14, alignItems: "center" },
  cancelBtnText: { color: "#64748B", fontSize: 16 },
});
