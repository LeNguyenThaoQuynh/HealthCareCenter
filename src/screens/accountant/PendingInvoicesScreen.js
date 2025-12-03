import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,TouchableWithoutFeedback,Keyboard
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

export default function PendingInvoicesScreen() {
  const navigation = useNavigation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [notes, setNotes] = useState("");

  const fetchPendingInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id, invoice_number, total_amount, exam_fee, test_fee, medicine_fee, issued_at, appointment_id,
          appointments!appointment_id (
            date, user_id, patient_name, patient_phone,
            user_profiles:user_profiles!user_id (full_name, phone)
          )
        `)
        .eq("status", "pending")
        .order("issued_at", { ascending: false });

      if (error) throw error;

      const formatted = data.map((inv) => {
        const appt = inv.appointments || {};
        const name = appt.user_profiles?.full_name || appt.patient_name || "Khách lẻ";
        const phone = appt.user_profiles?.phone || appt.patient_phone || "";

        return {
          id: inv.id.toString(),
          invoice_number: inv.invoice_number || "Chưa có số",
          total: inv.total_amount || 0,
          date: inv.issued_at
            ? new Date(inv.issued_at).toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })
            : "Chưa xác định",
          time: inv.issued_at
            ? new Date(inv.issued_at).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          patientName: name,
          phone,
        };
      });

      setInvoices(formatted);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingInvoices();
  }, []);

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setAmountTendered("");
    setPaymentMethod("cash");
    setNotes("");
    setModalVisible(true);
  };

  const getMethodText = (m) => {
    const map = {
      cash: "Tiền mặt",
      bank_transfer: "Chuyển khoản",
      card: "Thẻ",
      insurance: "Bảo hiểm",
      momo: "MoMo",
      zalo_pay: "ZaloPay",
      free: "Miễn phí",
    };
    return map[m] || "Tiền mặt";
  };

  const confirmPayment = async () => {
    if (!selectedInvoice) return;

    const total = selectedInvoice.total;
    const tendered = parseInt(amountTendered || "0", 10);
    const change = Math.max(0, tendered - total);

    if (paymentMethod === "cash" && tendered < total) {
      Alert.alert("Thiếu tiền", `Còn thiếu ${(total - tendered).toLocaleString("vi-VN")} ₫`);
      return;
    }

    Alert.alert(
      "XÁC NHẬN THANH TOÁN",
      `Bệnh nhân: ${selectedInvoice.patientName}\n` +
        `Hóa đơn: ${selectedInvoice.invoice_number}\n` +
        `Tổng tiền: ${total.toLocaleString("vi-VN")} ₫\n` +
        (paymentMethod === "cash"
          ? `Khách đưa: ${tendered.toLocaleString("vi-VN")} ₫\nThối lại: ${change.toLocaleString("vi-VN")} ₫\n`
          : "") +
        `Phương thức: ${getMethodText(paymentMethod)}`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "ĐÃ NHẬN TIỀN",
          onPress: async () => {
            setModalVisible(false);
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
              .from("invoices")
              .update({
                status: "paid",
                payment_method: paymentMethod,
                actual_amount: total,
                amount_tendered: paymentMethod === "cash" ? tendered : total,
                change_given: paymentMethod === "cash" ? change : 0,
                paid_at: new Date().toISOString(),
                paid_by: user?.id || null,
                notes: notes.trim() || null,
              })
              .eq("id", selectedInvoice.id);

            if (error) {
              Alert.alert("Lỗi", "Thanh toán thất bại");
            } else {
              Alert.alert("THÀNH CÔNG!", "Đã nhận tiền!", [
                { text: "OK", onPress: fetchPendingInvoices },
              ]);
            }
          },
        },
      ]
    );
  };

  const paymentMethods = [
    { key: "cash", icon: "cash", label: "Tiền mặt", color: "#10b981" },
    { key: "bank_transfer", icon: "account-balance", label: "Chuyển khoản", color: "#3b82f6" },
    { key: "card", icon: "credit-card", label: "Thẻ", color: "#8b5cf6" },
    { key: "momo", icon: "phone-iphone", label: "MoMo", color: "#ec4899" },
    { key: "zalo_pay", icon: "chat", label: "ZaloPay", color: "#06b6d4" },
    { key: "insurance", icon: "local-hospital", label: "Bảo hiểm", color: "#f59e0b" },
    { key: "free", icon: "card-giftcard", label: "Miễn phí", color: "#f97316" },
  ];

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFF" />
      </LinearGradient>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      <LinearGradient
        colors={["#6366f1", "#8b5cf6"]}
        style={{ paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center", marginRight: 28 }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: "#FFF" }}>Thu Ngân</Text>
          </View>
        </View>
        <View style={{ alignItems: "center", marginTop: 16 }}>
          <Text style={{ fontSize: 38, fontWeight: "900", color: "#FFF" }}>{invoices.length}</Text>
          <Text style={{ fontSize: 17, color: "#E0E7FF" }}>Hóa đơn chờ thanh toán</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPendingInvoices(); }} />
        }
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 100 }}>
            <Animated.View entering={ZoomIn.duration(600)}>
              <MaterialIcons name="check-circle" size={100} color="#10b981" />
            </Animated.View>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1e293b", marginTop: 20 }}>Không còn hóa đơn nào</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 100)}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => openPaymentModal(item)}
              style={{
                backgroundColor: "#FFF",
                borderRadius: 24,
                padding: 22,
                marginBottom: 16,
                elevation: 16,
                borderLeftWidth: 6,
                borderLeftColor: "#f59e0b",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#1e293b" }}>{item.patientName}</Text>
                  {item.phone ? (
                    <Text style={{ fontSize: 15, color: "#64748b", marginTop: 4 }}>ĐT: {item.phone}</Text>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                    <Ionicons name="document-text" size={18} color="#6366f1" />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#6366f1", marginLeft: 6 }}>
                      {item.invoice_number}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>{item.date} • {item.time}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 26, fontWeight: "900", color: "#dc2626" }}>
                    {item.total.toLocaleString("vi-VN")}₫
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      />

      {/* MODAL */}
    {/* MODAL */}
<Modal
  visible={modalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setModalVisible(false)}
>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
      <TouchableWithoutFeedback>
        <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30 }}>
          {selectedInvoice && (() => {

            const total = selectedInvoice.total;
            const tendered = parseInt(amountTendered || "0", 10);
            const isInsufficient = paymentMethod === "cash" && tendered < total;
            const change = tendered - total;

            return (
              <>
                <Text style={{ fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 10 }}>
                  Thanh toán hóa đơn
                </Text>

                <LinearGradient colors={["#fef3c7", "#fde68a"]} style={{ padding: 20, borderRadius: 20 }}>
                  <Text style={{ fontSize: 28, fontWeight: "900", color: "#dc2626" }}>
                    {total.toLocaleString("vi-VN")} ₫
                  </Text>
                </LinearGradient>

                {/* PAYMENT METHOD */}
                <Text style={{ marginTop: 24, fontSize: 17, fontWeight: "700" }}>Phương thức</Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 12 }}>
                  {paymentMethods.map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => {
                        setPaymentMethod(m.key);
                        if (m.key !== "cash") {
                          setAmountTendered(total.toString());
                          Keyboard.dismiss();
                        }
                      }}
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        backgroundColor: paymentMethod === m.key ? m.color : "#f1f5f9",
                        minWidth: 100,
                        alignItems: "center",
                      }}
                    >
                      <MaterialIcons name={m.icon} size={28} color={paymentMethod === m.key ? "#FFF" : "#475569"} />
                      <Text style={{ marginTop: 6, fontWeight: "600", color: paymentMethod === m.key ? "#FFF" : "#475569" }}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* CASH INPUT */}
                {paymentMethod === "cash" && (
                  <>
                    <Text style={{ marginTop: 24, fontSize: 17, fontWeight: "700" }}>Số tiền khách đưa</Text>
                    <TextInput
                      style={{
                        marginTop: 10,
                        backgroundColor: "#f0fdf4",
                        borderRadius: 16,
                        padding: 20,
                        fontSize: 28,
                        fontWeight: "900",
                        textAlign: "center",
                      }}
                      keyboardType="number-pad"
                      value={amountTendered}
                      onChangeText={(t) => setAmountTendered(t.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={Keyboard.dismiss}
                    />

                    {amountTendered !== "" && (
                      <View
                        style={{
                          marginTop: 20,
                          padding: 20,
                          backgroundColor: isInsufficient ? "#fee2e2" : "#f0fdf4",
                          borderRadius: 16,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, fontWeight: "700" }}>
                          {isInsufficient ? "Còn thiếu" : "Tiền thối lại"}
                        </Text>
                        <Text style={{ fontSize: 36, fontWeight: "900" }}>
                          {Math.abs(change).toLocaleString("vi-VN")} ₫
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* NOTES */}
                <Text style={{ marginTop: 24, fontSize: 17, fontWeight: "700" }}>Ghi chú</Text>
                <TextInput
                  style={{
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                  }}
                  placeholder="VD: Giảm giá khách quen..."
                  value={notes}
                  onChangeText={setNotes}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />

                {/* CONFIRM */}
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss(); // 👉 bắt buộc phải có ở đây
                    confirmPayment();
                  }}
                  disabled={isInsufficient}
                  style={{
                    marginTop: 28,
                    backgroundColor: isInsufficient ? "#94a3b8" : "#10b981",
                    paddingVertical: 20,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 20, fontWeight: "800", color: "#FFF" }}>
                    XÁC NHẬN ĐÃ NHẬN TIỀN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setModalVisible(false); }} style={{ marginTop: 12 }}>
                  <Text style={{ textAlign: "center", color: "#64748b", fontWeight: "600" }}>Hủy</Text>
                </TouchableOpacity>
              </>
            );
          })()}
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>

    </View>
  );
}
