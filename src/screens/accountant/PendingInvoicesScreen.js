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
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
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
        .select(
          `
          id, invoice_number, total_amount, issued_at, appointment_id,
          appointments!appointment_id (
            date, user_id, patient_name, patient_phone,
            user_profiles:user_profiles!user_id (full_name, phone)
          )
        `
        )
        .eq("status", "pending")
        .order("issued_at", { ascending: false });

      if (error) throw error;

      const formatted = data.map((inv) => {
        const appt = inv.appointments || {};
        const name =
          appt.user_profiles?.full_name || appt.patient_name || "Khách lẻ";
        const phone = appt.user_profiles?.phone || appt.patient_phone || "";

        return {
          id: inv.id.toString(),
          invoice_number: inv.invoice_number || "Chưa có số",
          total: inv.total_amount || 0,
          date: inv.issued_at
            ? new Date(inv.issued_at).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "short",
              })
            : "",
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

    if (paymentMethod === "cash" && tendered < total) {
      Alert.alert(
        "Thiếu tiền",
        `Còn thiếu ${(total - tendered).toLocaleString("vi-VN")} ₫`
      );
      return;
    }

    const change = Math.max(0, tendered - total);

    Alert.alert(
      "XÁC NHẬN THANH TOÁN",
      `Bệnh nhân: ${selectedInvoice.patientName}\nHóa đơn: ${
        selectedInvoice.invoice_number
      }\nTổng: ${total.toLocaleString("vi-VN")} ₫\n` +
        (paymentMethod === "cash"
          ? `Khách đưa: ${tendered.toLocaleString(
              "vi-VN"
            )} ₫\nThối lại: ${change.toLocaleString("vi-VN")} ₫\n`
          : "") +
        `Phương thức: ${getMethodText(paymentMethod)}`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "ĐÃ NHẬN TIỀN",
          onPress: async () => {
            setModalVisible(false);
            const {
              data: { user },
            } = await supabase.auth.getUser();

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
    { key: "cash", icon: "attach-money", label: "Tiền mặt", color: "#10b981" },
    {
      key: "bank_transfer",
      icon: "account-balance",
      label: "CK",
      color: "#3b82f6",
    },
    { key: "card", icon: "credit-card", label: "Thẻ", color: "#06b6d4" },
    { key: "momo", icon: "phone-iphone", label: "MoMo", color: "#ec4899" },
    { key: "zalo_pay", icon: "chat", label: "ZaloPay", color: "#0ea5e9" },
    { key: "insurance", icon: "local-hospital", label: "BH", color: "#f59e0b" },
    { key: "free", icon: "card-giftcard", label: "Miễn phí", color: "#f97316" },
  ];

  if (loading && !refreshing) {
    return (
      <LinearGradient
        colors={["#1e293b", "#0f172a"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#60a5fa" />
      </LinearGradient>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      <LinearGradient
        colors={["#1e293b", "#334155"]}
        style={{ paddingTop: 50, paddingBottom: 16 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
            Thu Ngân
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <Text style={{ fontSize: 36, fontWeight: "900", color: "#60a5fa" }}>
            {invoices.length}
          </Text>
          <Text style={{ fontSize: 14, color: "#cbd5e1", marginTop: 4 }}>
            Hóa đơn đang chờ
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPendingInvoices();
            }}
          />
        }
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <Animated.View entering={ZoomIn.duration(600)}>
              <MaterialIcons name="check-circle" size={80} color="#10b981" />
            </Animated.View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1e293b",
                marginTop: 16,
              }}
            >
              Không còn hóa đơn nào
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60)}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openPaymentModal(item)}
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderLeftWidth: 4,
                borderLeftColor: "#f59e0b",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#1e293b" }}
                >
                  {item.patientName}
                </Text>
                <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  {item.invoice_number} • {item.date} {item.time}
                </Text>
              </View>
              <Text
                style={{ fontSize: 20, fontWeight: "900", color: "#dc2626" }}
              >
                {item.total.toLocaleString("vi-VN")}₫
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.8)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 40,
                maxHeight: "88%",
              }}
            >
              <View style={{ alignItems: "flex-end", marginBottom: -10 }}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={32} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {selectedInvoice && (
                <>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      textAlign: "center",
                      color: "#1e293b",
                    }}
                  >
                    Thanh toán hóa đơn
                  </Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "900",
                      textAlign: "center",
                      color: "#dc2626",
                      marginVertical: 8,
                    }}
                  >
                    {selectedInvoice.total.toLocaleString("vi-VN")} ₫
                  </Text>
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: 14,
                      marginBottom: 12,
                    }}
                  >
                    {selectedInvoice.patientName} •{" "}
                    {selectedInvoice.invoice_number}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 8,
                      marginVertical: 8,
                    }}
                  >
                    {paymentMethods.map((m) => (
                      <TouchableOpacity
                        key={m.key}
                        onPress={() => {
                          setPaymentMethod(m.key);
                          if (m.key !== "cash")
                            setAmountTendered(selectedInvoice.total.toString());
                        }}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          backgroundColor:
                            paymentMethod === m.key ? m.color : "#f1f5f9",
                          width: 64,
                          alignItems: "center",
                        }}
                      >
                        <MaterialIcons
                          name={m.icon}
                          size={22}
                          color={paymentMethod === m.key ? "white" : "#475569"}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            marginTop: 3,
                            fontWeight: "600",
                            color:
                              paymentMethod === m.key ? "white" : "#475569",
                          }}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {paymentMethod === "cash" && (
                    <View style={{ marginTop: 12 }}>
                      <TextInput
                        style={{
                          backgroundColor: "#f0fdf4",
                          borderRadius: 14,
                          padding: 16,
                          fontSize: 32,
                          fontWeight: "900",
                          textAlign: "center",
                          color: "#166534",
                          borderWidth: 2,
                          borderColor: "#86efac",
                        }}
                        keyboardType="number-pad"
                        placeholder="0"
                        value={
                          amountTendered
                            ? parseInt(amountTendered).toLocaleString("vi-VN")
                            : ""
                        }
                        onChangeText={(text) => {
                          const num = text.replace(/[^0-9]/g, "");
                          setAmountTendered(num);
                        }}
                        autoFocus
                      />

                      {amountTendered !== "" && (
                        <View
                          style={{
                            marginTop: 12,
                            padding: 14,
                            backgroundColor:
                              parseInt(amountTendered) < selectedInvoice.total
                                ? "#fee2e2"
                                : "#ecfdf5",
                            borderRadius: 12,
                            alignItems: "center",
                            borderWidth: 2,
                            borderColor:
                              parseInt(amountTendered) < selectedInvoice.total
                                ? "#fca5a5"
                                : "#86efac",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: "#1f2937",
                            }}
                          >
                            {parseInt(amountTendered) < selectedInvoice.total
                              ? "Còn thiếu"
                              : "Tiền thối"}
                          </Text>
                          <Text
                            style={{
                              fontSize: 28,
                              fontWeight: "900",
                              color:
                                parseInt(amountTendered) < selectedInvoice.total
                                  ? "#dc2626"
                                  : "#16a34a",
                            }}
                          >
                            {Math.abs(
                              selectedInvoice.total -
                                parseInt(amountTendered || 0)
                            ).toLocaleString("vi-VN")}{" "}
                            ₫
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <TextInput
                    style={{
                      marginTop: 16,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 14,
                      backgroundColor: "#f8fafc",
                      maxHeight: 80,
                    }}
                    placeholder="Ghi chú (tùy chọn)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />

                  <TouchableOpacity
                    onPress={confirmPayment}
                    disabled={
                      paymentMethod === "cash" &&
                      amountTendered !== "" &&
                      parseInt(amountTendered) < selectedInvoice.total
                    }
                    style={{
                      marginTop: 20,
                      backgroundColor:
                        paymentMethod === "cash" &&
                        amountTendered !== "" &&
                        parseInt(amountTendered) < selectedInvoice.total
                          ? "#94a3b8"
                          : "#10b981",
                      paddingVertical: 16,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        color: "white",
                        fontSize: 17,
                        fontWeight: "bold",
                      }}
                    >
                      ĐÃ NHẬN TIỀN
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
