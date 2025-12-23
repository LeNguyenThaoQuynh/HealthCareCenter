import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Switch,
  Animated,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback, 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function EditServiceScreen() {
  const navigation = useNavigation();
  const { serviceId } = useRoute().params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showNameModal, setNameModal] = useState(false);

  const [form, setForm] = useState({
    department: "",
    name: "",
    price: "",
    is_active: true,
  });

  const [originalDept, setOriginalDept] = useState("");
  const [serviceCode, setServiceCode] = useState("");
  const [departments, setDepartments] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    loadService();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 500, 
          useNativeDriver: true,
          delay: 100 
        }),
        Animated.timing(slideAnim, { 
          toValue: 0, 
          duration: 500, 
          useNativeDriver: true,
          delay: 100 
        }),
      ]).start();
    }
  }, [loading]);

  const loadService = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .single();

    if (error || !data) {
      Alert.alert("Lỗi", "Không tìm thấy dịch vụ");
      navigation.goBack();
      return;
    }

    setForm({
      department: data.department || "",
      name: data.name || "",
      price: String(data.price || ""),
      is_active: data.is_active ?? true,
    });

    setOriginalDept(data.department || "");
    setServiceCode(data.code || "N/A");
    setLoading(false);
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("department")
        .not("department", "is", null)
        .order("department", { ascending: true });

      if (error) throw error;
      const uniqueDepts = [...new Set(data.map(item => item.department))].filter(Boolean);
      setDepartments(uniqueDepts);
    } catch (err) {
      console.error("Error loading departments:", err);
    }
  };

  const formatPrice = (value) => {
    if (!value) return "";
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const validateForm = () => {
    if (!form.department.trim()) {
      Alert.alert("Lỗi", "Vui lòng chọn khoa");
      return false;
    }
    if (!form.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên dịch vụ");
      return false;
    }
    if (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const deptName = form.department.trim();
    const serviceName = form.name.trim();
    const priceValue = form.price.replace(/\./g, "");

    setSaving(true);

    try {
      const { data: existing, error: checkError } = await supabase
        .from("services")
        .select("id")
        .eq("department", deptName)
        .ilike("name", serviceName)
        .neq("id", serviceId);

      if (checkError) throw checkError;

      if (existing?.length > 0) {
        Alert.alert("Trùng tên", `"${serviceName}" đã tồn tại trong khoa "${deptName}"`);
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("services")
        .update({
          department: deptName,
          name: serviceName,
          price: Number(priceValue),
          is_active: form.is_active,
        })
        .eq("id", serviceId);

      if (updateError) throw updateError;

      Alert.alert("Thành công", "Đã cập nhật dịch vụ", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Lỗi", "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

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
              <Ionicons name="create" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Chỉnh Sửa Dịch Vụ</Text>
            </View>
            <Text style={styles.headerSubtitle}>Cập nhật thông tin dịch vụ</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={saving}
            style={styles.saveButton}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.saveText}>Lưu</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* MÃ DỊCH VỤ */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={["#e0f2fe", "#f0f9ff"]}
              style={styles.infoGradient}
            >
              <View style={styles.infoIconContainer}>
                <Ionicons name="qr-code" size={28} color="#0ea5e9" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mã dịch vụ</Text>
                <Text style={styles.infoValue}>{serviceCode}</Text>
              </View>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>MÃ</Text>
              </View>
            </LinearGradient>
          </View>

          {/* KHOA LÀM VIỆC */}
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={22} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Khoa làm việc</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.selectCard}
            onPress={() => setShowDeptModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectCardLeft}>
              <View style={[styles.selectIconContainer, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
                <Ionicons name="medical" size={20} color="#16a34a" />
              </View>
              <View style={styles.selectTextContainer}>
                <Text style={styles.selectLabel}>
                  {form.department || "Chọn khoa"}
                </Text>
                <Text style={styles.selectHint}>
                  Chọn khoa từ danh sách
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* TÊN DỊCH VỤ */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Ionicons name="medkit" size={22} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Tên dịch vụ</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.selectCard}
            onPress={() => setNameModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectCardLeft}>
              <View style={[styles.selectIconContainer, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
                <Ionicons name="document-text" size={20} color="#3b82f6" />
              </View>
              <View style={styles.selectTextContainer}>
                <Text style={styles.selectLabel}>
                  {form.name || "Nhập tên dịch vụ"}
                </Text>
                <Text style={styles.selectHint}>
                  Ví dụ: Khám nội tổng quát
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* GIÁ DỊCH VỤ */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Ionicons name="cash" size={22} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Giá dịch vụ</Text>
          </View>
          
          <View style={styles.priceCard}>
            <View style={[styles.priceIconContainer, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
              <Ionicons name="cash" size={22} color="#f59e0b" />
            </View>
            <View style={styles.priceContent}>
              <Text style={styles.priceLabel}>Giá (VNĐ)</Text>
              <TextInput
                value={formatPrice(form.price)}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, "");
                  setForm({ ...form, price: cleaned });
                }}
                placeholder="Nhập giá dịch vụ"
                style={styles.priceInput}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                selectionColor="#f59e0b"
              />
              {form.price && (
                <Text style={styles.pricePreview}>
                  {Number(form.price).toLocaleString()} VNĐ
                </Text>
              )}
            </View>
          </View>

          {/* TRẠNG THÁI */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Ionicons name="toggle" size={22} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Trạng thái</Text>
          </View>
          
          <View style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <View style={[
                styles.statusIconContainer,
                { backgroundColor: form.is_active ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)" }
              ]}>
                <Ionicons 
                  name={form.is_active ? "checkmark-circle" : "close-circle"} 
                  size={22} 
                  color={form.is_active ? "#16a34a" : "#ef4444"} 
                />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>
                  {form.is_active ? "Đang hoạt động" : "Tạm ngưng"}
                </Text>
                <Text style={styles.statusSubtext}>
                  {form.is_active ? "Dịch vụ đang được sử dụng" : "Dịch vụ tạm ngừng hoạt động"}
                </Text>
              </View>
            </View>
            <Switch
              value={form.is_active}
              onValueChange={(value) => setForm({ ...form, is_active: value })}
              trackColor={{ false: "#fecaca", true: "#bbf7d0" }}
              thumbColor={form.is_active ? "#16a34a" : "#ef4444"}
              ios_backgroundColor="#e5e7eb"
              style={{ transform: [{ scale: 1.1 }] }}
            />
          </View>

          {/* NOTE */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text style={styles.noteText}>
              Cập nhật thông tin và nhấn Lưu để lưu thay đổi
            </Text>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL CHỌN KHOA */}
      <Modal
        visible={showDeptModal}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setShowDeptModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <LinearGradient 
            colors={["#4f46e5", "#7c3aed"]}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <Ionicons name="business" size={24} color="#FFF" />
              <Text style={styles.modalTitle}>Chọn Khoa</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowDeptModal(false)} 
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <FlatList
            data={departments}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setForm({ ...form, department: item });
                  setShowDeptModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.modalItemContent}>
                  <View style={[styles.modalItemIcon, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
                    <Ionicons name="business-outline" size={18} color="#16a34a" />
                  </View>
                  <Text style={styles.modalItemText}>{item}</Text>
                </View>
                {form.department === item && (
                  <Ionicons name="checkmark-circle" size={24} color="#4f46e5" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </Modal>

      {/* MODAL NHẬP TÊN DỊCH VỤ */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setNameModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <LinearGradient 
            colors={["#3b82f6", "#2563eb"]}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <Ionicons name="document-text" size={24} color="#FFF" />
              <Text style={styles.modalTitle}>Nhập Tên Dịch Vụ</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setNameModal(false)} 
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalInputContainer}>
            <View style={styles.modalInputWrapper}>
              <Ionicons name="create" size={20} color="#64748b" style={{ marginRight: 12 }} />
              <TextInput
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                placeholder="Nhập tên dịch vụ..."
                style={styles.modalInput}
                placeholderTextColor="#94a3b8"
                autoFocus
                selectionColor="#3b82f6"
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.modalConfirmButton,
                !form.name.trim() && { opacity: 0.6 }
              ]}
              disabled={!form.name.trim()}
              onPress={() => setNameModal(false)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.modalConfirmGradient}
              >
                <Ionicons name="checkmark" size={22} color="#FFF" />
                <Text style={styles.modalConfirmText}>Xác nhận</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f8fafc"
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
    gap: 10,
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
  saveButton: {
    width: 80,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    gap: 6,
  },
  saveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  content: {
    paddingTop: 60, // ✅ CONTENT CÓ PADDING TOP 60
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  infoCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  infoGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0ea5e9",
    letterSpacing: 1,
  },
  codeBadge: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  codeBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 10,
  },
  selectCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  selectTextContainer: {
    flex: 1,
  },
  selectLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  selectHint: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  priceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  priceContent: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  priceInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f59e0b",
    marginTop: 2,
  },
  pricePreview: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginTop: 4,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  statusSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100, 116, 139, 0.05)",
    marginTop: 24,
    marginBottom: 40,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.1)",
    gap: 8,
  },
  noteText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalList: {
    paddingBottom: 30,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  modalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
    flex: 1,
  },
  modalInputContainer: {
    padding: 24,
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  modalConfirmButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalConfirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
};