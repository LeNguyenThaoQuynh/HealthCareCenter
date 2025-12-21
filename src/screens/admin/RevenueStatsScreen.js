import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, SPACING } = theme;
const screenWidth = Dimensions.get("window").width;
const OFFSET_MS = -7 * 60 * 60 * 1000; // -7 giờ (như bạn yêu cầu)

const KPI = ({ title, value, icon, color, loading }) => (
  <View style={[styles.kpiCard, { shadowColor: color }]}>
    <View style={[styles.kpiIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={32} color={color} />
    </View>
    <Text style={styles.kpiTitle}>{title}</Text>
    {loading ? (
      <View style={styles.skeletonValue} />
    ) : (
      <Text style={[styles.kpiValue, { color }]}>{value.toLocaleString("vi-VN")}đ</Text>
    )}
  </View>
);

const BillItem = ({ item }) => {
  const dateAdjusted = new Date(new Date(item.issued_at).getTime() + OFFSET_MS);
  return (
    <View style={styles.billCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.billCode}>{item.invoice_number}</Text>
        <Text style={styles.billDate}>
          {dateAdjusted.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.billAmount}>
          {Number(item.total_amount).toLocaleString("vi-VN")}đ
        </Text>
        <Text
          style={[
            styles.billStatus,
            {
              color: item.status === "paid" ? COLORS.success : COLORS.warning,
              backgroundColor:
                item.status === "paid" ? `${COLORS.success}20` : `${COLORS.warning}20`,
            },
          ]}
        >
          {item.status === "paid" ? "Đã thu" : "Chưa thu"}
        </Text>
      </View>
    </View>
  );
};

export default function RevenueStatsScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("day");
  const [activeTab, setActiveTab] = useState("chart");

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [pickerType, setPickerType] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [chartData, setChartData] = useState({
    labels: [],
    total: [],
    paid: [],
  });

  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
  });

  const [bills, setBills] = useState([]);

  const loadRevenue = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .order("issued_at", { ascending: false });

      if (filterMode === "day") {
        const fromAdjusted = new Date(fromDate.getTime() - OFFSET_MS);
        const toAdjusted = new Date(toDate.getTime() - OFFSET_MS + 24 * 60 * 60 * 1000 - 1);

        query = query
          .gte("issued_at", fromAdjusted.toISOString())
          .lt("issued_at", toAdjusted.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setBills(data || []);

      const grouped = {};
      let total = 0;
      let paid = 0;
      let pending = 0;

      data.forEach((inv) => {
        const date = new Date(new Date(inv.issued_at).getTime() + OFFSET_MS);
        let key = "";
        let sortKey = 0;

        if (filterMode === "day") {
          key = date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          sortKey = date.getTime();
        } else if (filterMode === "month") {
          key = `${date.getMonth() + 1}/${date.getFullYear()}`;
          sortKey = date.getFullYear() * 100 + (date.getMonth() + 1);
        } else {
          key = `${date.getFullYear()}`;
          sortKey = date.getFullYear();
        }

        if (!grouped[key]) {
          grouped[key] = { total: 0, paid: 0, sortKey };
        }

        grouped[key].total += Number(inv.total_amount);
        total += Number(inv.total_amount);

        if (inv.status === "paid") {
          grouped[key].paid += Number(inv.total_amount);
          paid += Number(inv.total_amount);
        } else {
          pending += Number(inv.total_amount);
        }
      });

      const sortedEntries = Object.entries(grouped).sort(
        (a, b) => a[1].sortKey - b[1].sortKey
      );

      const labels = sortedEntries.map(([key]) => key);
      const totalData = sortedEntries.map(([_, val]) => val.total);
      const paidData = sortedEntries.map(([_, val]) => val.paid);

      setChartData({
        labels,
        total: totalData,
        paid: paidData,
      });

      setSummary({ total, paid, pending });
    } catch (e) {
      console.log("Lỗi tải doanh thu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, [filterMode, fromDate, toDate]);

  const openDatePicker = (type) => {
    setPickerType(type);
    setTempDate(type === "from" ? fromDate : toDate);
    setShowPicker(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* HEADER */}
      <LinearGradient
        colors={["#1E40AF", "#2563EB", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thống kê doanh thu</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
      >
        {/* FILTER */}
        <View style={styles.filterRow}>
          {["day", "month", "year"].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setFilterMode(m)}
              style={[
                styles.filterBtn,
                filterMode === m && styles.filterActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: filterMode === m ? "#FFF" : "#1E40AF",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                {m === "day" ? "Ngày" : m === "month" ? "Tháng" : "Năm"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CHỌN NGÀY */}
        {filterMode === "day" && (
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBox}
              onPress={() => openDatePicker("from")}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
              <View>
                <Text style={styles.dateLabel}>Từ ngày</Text>
                <Text style={styles.dateText}>
                  {fromDate.toLocaleDateString("vi-VN")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateBox}
              onPress={() => openDatePicker("to")}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
              <View>
                <Text style={styles.dateLabel}>Đến ngày</Text>
                <Text style={styles.dateText}>
                  {toDate.toLocaleDateString("vi-VN")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI */}
        <View style={styles.kpiRow}>
          <KPI
            title="Tổng doanh thu"
            value={summary.total}
            icon="cash-outline"
            color={COLORS.primary}
            loading={loading}
          />
          <KPI
            title="Đã thu"
            value={summary.paid}
            icon="checkmark-circle"
            color={COLORS.success}
            loading={loading}
          />
          <KPI
            title="Chưa thu"
            value={summary.pending}
            icon="time"
            color={COLORS.warning}
            loading={loading}
          />
        </View>

        {/* NỘI DUNG */}
        {loading ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 16, color: "#64748B" }}>
              Đang tải dữ liệu...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === "chart" ? (
              chartData.labels.length > 0 ? (
                <LineChart
                  data={{
                    labels: chartData.labels,
                    datasets: [
                      {
                        data: chartData.total,
                        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                        strokeWidth: 3,
                      },
                      {
                        data: chartData.paid,
                        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                        strokeWidth: 3,
                      },
                    ],
                    legend: ["Tổng", "Đã thu"],
                  }}
                  width={screenWidth - SPACING.lg * 2}
                  height={280}
                  chartConfig={{
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: () => "#334155",
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: "#fff",
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="bar-chart-outline" size={60} color="#CBD5E1" />
                  <Text style={styles.noDataText}>Không có dữ liệu</Text>
                </View>
              )
            ) : (
              <FlatList
                data={bills}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => <BillItem item={item} />}
                scrollEnabled={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* BOTTOM TAB */}
      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "chart" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("chart")}
        >
          <Ionicons
            name="trending-up-outline"
            size={26}
            color={activeTab === "chart" ? "#FFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "chart" && { color: "#FFF" },
            ]}
          >
            Biểu đồ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "bill" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("bill")}
        >
          <Ionicons
            name="document-text-outline"
            size={26}
            color={activeTab === "bill" ? "#FFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "bill" && { color: "#FFF" },
            ]}
          >
            Hóa đơn
          </Text>
        </TouchableOpacity>
      </View>

      {/* DATE PICKER */}
      {showPicker && pickerType && (
        <>
          {Platform.OS === "ios" ? (
            <Modal
              visible={showPicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => {
                setShowPicker(false);
                setPickerType(null);
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowPicker(false);
                        setPickerType(null);
                      }}
                    >
                      <Text style={styles.cancelText}>Hủy</Text>
                    </TouchableOpacity>

                    <Text style={styles.pickerTitle}>
                      {pickerType === "from" ? "Từ ngày" : "Đến ngày"}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        if (pickerType === "from") {
                          setFromDate(tempDate);
                        } else {
                          setToDate(tempDate);
                        }
                        setShowPicker(false);
                        setPickerType(null);
                      }}
                    >
                      <Text style={styles.doneText}>Xong</Text>
                    </TouchableOpacity>
                  </View>

                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setTempDate(selectedDate);
                      }
                    }}
                    style={{ width: "100%", height: 216 }}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={pickerType === "from" ? fromDate : toDate}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setShowPicker(false);
                if (d) {
                  if (pickerType === "from") {
                    setFromDate(d);
                  } else {
                    setToDate(d);
                  }
                }
                setPickerType(null);
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  header: {
    height: 140,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    justifyContent: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  backBtn: {
    position: "absolute",
    left: 20,
    top: Platform.OS === "ios" ? 60 : 40,
    zIndex: 10,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  filterRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  filterActive: {
    backgroundColor: COLORS.primary,
  },

  dateRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  dateBox: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dateLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E40AF",
  },

  kpiRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  kpiIcon: {
    width: 30,
    height: 30,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  kpiTitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  skeletonValue: {
    width: 100,
    height: 28,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    marginTop: 4,
  },

  billCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  billCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
  },
  billDate: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  billStatus: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
  },

  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },

  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    marginHorizontal: 16,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 30,
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  cancelText: {
    color: "#3B82F6",
    fontSize: 17,
    fontWeight: "500",
  },
  doneText: {
    color: "#3B82F6",
    fontSize: 17,
    fontWeight: "600",
  },
};