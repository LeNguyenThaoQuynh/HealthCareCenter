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
  Alert,
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

const { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, SHADOWS } = theme;

export default function MedicalRecordScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("records");
  const [records, setRecords] = useState([]);
  const [testGroups, setTestGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnpaidInvoice, setHasUnpaidInvoice] = useState(false);

  // ĐÃ FIX 100% LỖI UUID "null"
  const checkUnpaidInvoice = async (patientId) => {
    try {
      const { data: pendingInvoices, error } = await supabase
        .from("invoices")
        .select("appointment_id")
        .eq("status", "pending")
        .not("appointment_id", "is", null); // Loại bỏ null ngay từ đầu

      if (error) {
        console.error("Lỗi query invoices:", error);
        return false;
      }
      if (!pendingInvoices || pendingInvoices.length === 0) return false;

      // Lọc chỉ lấy UUID hợp lệ (chuỗi 36 ký tự)
      const validIds = pendingInvoices
        .map((inv) => inv.appointment_id)
        .filter((id) => typeof id === "string" && id.length === 36);

      if (validIds.length === 0) return false;

      const { data: appointments } = await supabase
        .from("appointments")
        .select("id")
        .in("id", validIds)
        .eq("patient_id", patientId);

      return appointments && appointments.length > 0;
    } catch (err) {
      console.error("Lỗi kiểm tra hóa đơn:", err);
      return false;
    }
  };

  const fetchPatientData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        navigation.replace("Login");
        return;
      }

      const patientId = user.id;

      // KIỂM TRA HÓA ĐƠN CHƯA THANH TOÁN
      const unpaid = await checkUnpaidInvoice(patientId);
      setHasUnpaidInvoice(unpaid);

      if (unpaid) {
        setRecords([]);
        setTestGroups([]);
        setLoading(false);
        if (isRefresh) setRefreshing(false);
        return;
      }

      // CHO PHÉP XEM NẾU ĐÃ THANH TOÁN
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
            prescriptions (*),
            appointments!appointment_id (
              date,
              invoices!appointment_id (status)
            )
          `)
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const allowed = (data || []).filter((r) => {
          const status = r.appointments?.invoices?.[0]?.status;
          return status === "paid" || status === "refunded";
        });

        const formatted = allowed.map((r) => ({
          ...r,
          doctor_name: r.doctor?.user_profiles?.full_name || r.doctor?.name || "Bác sĩ",
          prescriptions: r.prescriptions || [],
        }));

        setRecords(formatted);
      } else {
        // TAB XÉT NGHIỆM
        const { data, error } = await supabase
          .from("test_results")
          .select(`
            id,
            test_name,
            result_value,
            unit,
            reference_range,
            note,
            status,
            performed_at,
            file_url,
            appointment_id,
            appointments!appointment_id (
              invoices!appointment_id (status)
            )
          `)
          .eq("patient_id", patientId)
          .not("performed_at", "is", null)
          .order("performed_at", { ascending: false });

        if (error) throw error;

        const filtered = data.filter((t) => {
          const status = t.appointments?.invoices?.[0]?.status;
          return status === "paid" || status === "refunded";
        });

        const grouped = filtered.reduce((acc, item) => {
          const key = item.performed_at
            ? new Date(item.performed_at).toLocaleDateString("vi-VN")
            : item.id;

          if (!acc[key]) {
            acc[key] = {
              date: item.performed_at
                ? new Date(item.performed_at).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Chưa xác định",
              rawDate: item.performed_at || new Date(),
              tests: [],
              hasFile: !!item.file_url,
              fileUrl: item.file_url,
            };
          }

          acc[key].tests.push({
            name: item.test_name,
            result: item.result_value,
            unit: item.unit,
            range: item.reference_range,
            note: item.note,
            status: item.status,
          });

          if (item.file_url) {
            acc[key].hasFile = true;
            acc[key].fileUrl = item.file_url;
          }

          return acc;
        }, {});

        const sortedGroups = Object.values(grouped).sort(
          (a, b) => new Date(b.rawDate) - new Date(a.rawDate)
        );
        setTestGroups(sortedGroups);
      }
    } catch (err) {
console.error("Lỗi tải dữ liệu:", err);
      Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
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
    if (!url) {
      Alert.alert("Thông báo", "Chưa có file kết quả");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }

      const filename = url.split("/").pop() || `ketqua_${Date.now()}.pdf`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(url, localUri);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Lỗi", "Thiết bị không hỗ trợ chia sẻ");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Kết quả xét nghiệm",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Lỗi mở file:", error);
      Alert.alert("Lỗi", "Không thể mở file");
    }
  };

  // MÀN HÌNH KHÓA KHI CHƯA THANH TOÁN
  if (hasUnpaidInvoice) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="lock-closed" size={90} color="#DC2626" />
        <Text style={{ fontSize: 26, fontWeight: "bold", color: "#1E293B", textAlign: "center", marginTop: 24 }}>
          Chưa thanh toán hóa đơn
        </Text>
        <Text style={{ fontSize: 17, color: "#64748B", textAlign: "center", marginTop: 16, lineHeight: 28 }}>
          Bạn cần hoàn tất thanh toán để xem bệnh án và kết quả xét nghiệm.
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 36,
            backgroundColor: "#0066FF",
            paddingHorizontal: 36,
            paddingVertical: 18,
            borderRadius: 18,
            elevation: 8,
          }}
          onPress={() => navigation.navigate("PaymentHistory")}
        >
          <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "bold" }}>
            Xem hóa đơn cần thanh toán
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // LOADING
  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color={COLORS.primary || "#0066FF"} />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#64748B" }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary || "#0066FF"} />

      {/* HEADER */}
      <LinearGradient
        colors={GRADIENTS?.header || ["#0066FF", "#0044CC"]}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: Platform.OS === "ios" ? 60 : 40,
          paddingHorizontal: SPACING?.xl || 20,
          paddingBottom: SPACING?.lg || 20,
          borderBottomLeftRadius: BORDER_RADIUS?.xxxl || 32,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(255,255,255,0.25)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#FFF" }}>Bệnh án điện tử</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      {/* TABS */}
      <View
        style={{
          flexDirection: "row",
          margin: SPACING?.xl || 20,
          marginBottom: SPACING?.md || 12,
          backgroundColor: "#FFF",
          borderRadius: BORDER_RADIUS?.xl || 20,
          overflow: "hidden",
          ...SHADOWS?.card,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            gap: 8,
            backgroundColor: activeTab === "records" ? (COLORS.primary || "#0066FF") : "transparent",
          }}
          onPress={() => setActiveTab("records")}
        >
          <Ionicons name="document-text" size={22} color={activeTab === "records" ? "#FFF" : "#64748B"} />
          <Text style={{ fontSize: 15, fontWeight: "600", color: activeTab === "records" ? "#FFF" : "#64748B" }}>
            Bệnh án ({records.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            gap: 8,
            backgroundColor: activeTab === "tests" ? (COLORS.primary || "#0066FF") : "transparent",
          }}
          onPress={() => setActiveTab("tests")}
        >
          <Ionicons name="flask" size={22} color={activeTab === "tests" ? "#FFF" : "#64748B"} />
          <Text style={{ fontSize: 15, fontWeight: "600", color: activeTab === "tests" ? "#FFF" : "#64748B" }}>
            Xét nghiệm ({testGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* NỘI DUNG CHÍNH */}
      {activeTab === "records" ? (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: SPACING?.xl || 20, paddingTop: 0 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 120 }}>
              <Ionicons name="documents-outline" size={80} color="#CBD5E1" />
              <Text style={{ fontSize: 19, fontWeight: "bold", color: "#1E293B", marginTop: 20 }}>Chưa có bệnh án</Text>
              <Text style={{ fontSize: 16, color: "#64748B", marginTop: 10, textAlign: "center" }}>
                Bác sĩ sẽ cập nhật sau mỗi lần khám
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
              <View
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: BORDER_RADIUS?.xl || 20,
                  padding: SPACING?.xl || 20,
                  marginBottom: SPACING?.lg || 16,
                  ...SHADOWS?.card,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.primary || "#0066FF" }}>
                    {new Date(item.created_at).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                  <Ionicons name="person-circle" size={40} color={COLORS.primary || "#0066FF"} />
                </View>

                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1E293B", marginVertical: 6 }}>
                  BS. {item.doctor_name}
                </Text>

                {item.diagnosis && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.primary || "#0066FF" }}>Chẩn đoán</Text>
                    <Text style={{ fontSize: 16, color: "#1E293B", marginTop: 8, lineHeight: 24 }}>{item.diagnosis}</Text>
                  </View>
                )}

                {item.prescriptions?.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.primary || "#0066FF" }}>
                      Đơn thuốc ({item.prescriptions.length})
                    </Text>
                    {item.prescriptions.map((med, i) => (
                      <View
                        key={i}
                        style={{
                          marginTop: 10,
                          padding: 14,
                          backgroundColor: "#F0FDF4",
                          borderRadius: 14,
                          borderLeftWidth: 4,
                          borderLeftColor: "#22C55E",
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1E293B" }}>• {med.medicine_name}</Text>
                        <Text style={{ fontSize: 15, color: "#16A34A", marginTop: 4 }}>
                          {med.dosage} • {med.duration}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {item.notes && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.primary || "#0066FF" }}>Ghi chú</Text>
                    <Text style={{ fontSize: 16, color: "#1E293B", marginTop: 8, lineHeight: 24 }}>{item.notes}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        />
      ) : (
        // TAB XÉT NGHIỆM
        <FlatList
          data={testGroups}
          keyExtractor={(_, i) => i.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: SPACING?.xl || 20, paddingTop: 0 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 120 }}>
              <Ionicons name="flask-outline" size={80} color="#CBD5E1" />
              <Text style={{ fontSize: 19, fontWeight: "bold", color: "#1E293B", marginTop: 20 }}>Chưa có kết quả xét nghiệm</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: BORDER_RADIUS?.xl || 20,
                  padding: SPACING?.xl || 20,
                  marginBottom: SPACING?.lg || 16,
                  ...SHADOWS?.card,
                  borderLeftWidth: 5,
                  borderLeftColor: (COLORS.primary || "#0066FF") + "40",
                }}
                onPress={() => item.hasFile && openFile(item.fileUrl)}
                activeOpacity={item.hasFile ? 0.8 : 1}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: "bold", color: "#1E293B" }}>{item.date}</Text>
                  {item.hasFile ? (
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: (COLORS.primary || "#0066FF") + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                      <Ionicons name="document-attach" size={20} color={COLORS.primary || "#0066FF"} />
                      <Text style={{ marginLeft: 6, color: COLORS.primary || "#0066FF", fontWeight: "600" }}>Có file PDF</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 15, color: "#64748B", fontWeight: "600" }}>{item.tests.length} kết quả</Text>
                  )}
                </View>

                {item.tests.slice(0, 3).map((t, i) => (
                  <Text key={i} style={{ fontSize: 15, color: "#64748B", marginVertical: 5 }}>
                    • {t.name}:{" "}
                    <Text style={{ fontWeight: "600", color: t.status === "abnormal" ? "#DC2626" : "#1E293B" }}>
                      {t.result} {t.unit}
                    </Text>
                  </Text>
                ))}

                {item.tests.length > 3 && (
                  <Text style={{ marginTop: 10, color: COLORS.primary || "#0066FF", fontWeight: "600", fontStyle: "italic" }}>
                    + {item.tests.length - 3} kết quả khác
                  </Text>
                )}

                {item.hasFile && (
                  <Text style={{ marginTop: 14, color: COLORS.primary || "#0066FF", fontSize: 15, textAlign: "center", fontWeight: "700" }}>
                    Nhấn để xem file PDF
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}