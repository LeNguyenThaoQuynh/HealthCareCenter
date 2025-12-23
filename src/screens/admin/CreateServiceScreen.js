import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, SPACING, BORDER_RADIUS, SHADOWS } = theme;
const { width } = Dimensions.get("window");

/* ================== UTILS ================== */
const getDepartmentCode = (name) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3);

const generateServiceCode = async (departmentName) => {
  const deptCode = getDepartmentCode(departmentName);

  const { data, error } = await supabase
    .from("services")
    .select("code")
    .ilike("code", `${deptCode}%`)
    .order("code", { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextNumber = 1;

  if (data && data.length > 0) {
    const lastCode = data[0].code;
    const lastNumber = parseInt(lastCode.replace(deptCode, ""), 10);
    if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
  }

  return `${deptCode}${String(nextNumber).padStart(3, "0")}`;
};

/* ================== SCREEN ================== */
export default function CreateServiceScreen() {
  const navigation = useNavigation();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const [form, setForm] = useState({
    department: "",
    newDepartment: "",
    name: "",
    description: "",
    price: "",
    duration: "30",
    preparation_notes: "",
  });

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("department")
        .not("department", "is", null)
        .order("department", { ascending: true });

      if (error) throw error;

      const uniqueDepartments = [
        ...new Set(data.map((d) => d.department)),
      ].filter((d) => d && d.trim() !== "");

      setDepartments(uniqueDepartments);
    } catch (err) {
      console.log("Load departments error:", err);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreate = async () => {
    const deptName = (form.department || form.newDepartment)?.trim();
    const serviceName = form.name?.trim();
    const priceValue = form.price?.trim();

    // Validation
    if (!deptName) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn hoặc nhập tên khoa.");
      return;
    }
    if (!serviceName) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên dịch vụ.");
      return;
    }
    if (!priceValue || isNaN(Number(priceValue)) || Number(priceValue) <= 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập giá dịch vụ hợp lệ (lớn hơn 0).");
      return;
    }

    setLoading(true);

    try {
      // Kiểm tra trùng tên dịch vụ trong cùng khoa
      const { data: existing, error: checkError } = await supabase
        .from("services")
        .select("id")
        .eq("department", deptName)
        .ilike("name", serviceName);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        Alert.alert(
          "Trùng tên dịch vụ",
          `"${serviceName}" đã tồn tại trong khoa "${deptName}". Vui lòng chọn tên khác.`
        );
        setLoading(false);
        return;
      }

      // Sinh mã code
      const departmentCode = getDepartmentCode(deptName);
      const serviceCode = await generateServiceCode(deptName);

      // Tạo dịch vụ mới
      const { error: insertError } = await supabase.from("services").insert([
        {
          department: deptName,
          department_code: departmentCode,
          name: serviceName,
          description: form.description?.trim() || null,
          price: Number(priceValue),
          duration_minutes: Number(form.duration) || 30,
          code: serviceCode,
          preparation_notes: form.preparation_notes?.trim() || null,
          is_active: true,
        },
      ]);

      if (insertError) throw insertError;

      Alert.alert(
        "🎉 Thành công", 
        `Tạo dịch vụ thành công!\n\n📋 ${serviceName}\n🏥 ${deptName}\n💰 ${Number(priceValue).toLocaleString()} VNĐ\n🔢 ${serviceCode}`,
        [
          {
            text: "Tiếp tục tạo",
            style: "cancel",
            onPress: () => {
              setForm(prev => ({
                ...prev,
                name: "",
                description: "",
                price: "",
                duration: "30",
              }));
            }
          },
          {
            text: "Xem danh sách",
            onPress: () => navigation.goBack()
          }
        ]
      );

      loadDepartments();
    } catch (err) {
      console.log("Create service error:", err);
      Alert.alert("❌ Lỗi", "Không thể tạo dịch vụ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "";
    const num = price.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (text) => {
    const cleaned = text.replace(/\D/g, "");
    setForm({ ...form, price: cleaned });
  };

  const InputField = ({ label, icon, required, ...props }) => (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.requiredDot}>•</Text>}
      </View>
      <View style={styles.inputWrapper}>
        <View style={[styles.iconContainer, { backgroundColor: "rgba(79, 70, 229, 0.1)" }]}>
          <Ionicons name={icon} size={20} color="#4f46e5" />
        </View>
        <TextInput
          style={styles.input}
          placeholderTextColor="#94a3b8"
          selectionColor="#4f46e5"
          {...props}
        />
      </View>
    </View>
  );

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
              <Ionicons name="add-circle" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Tạo Dịch Vụ Mới</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Thêm dịch vụ khám chữa bệnh vào hệ thống
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          {/* KHOA LÀM VIỆC */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business" size={22} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Khoa / Phòng Ban</Text>
            </View>

            {/* CHỌN KHOA CÓ SẴN */}
            {!form.newDepartment && (
              <>
                <View style={styles.fieldContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Chọn khoa có sẵn</Text>
                    <Text style={styles.requiredDot}>•</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.selectContainer}
                    onPress={() => setShowDeptModal(true)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
                      <Ionicons name="medical" size={20} color="#16a34a" />
                    </View>
                    <Text style={[styles.selectText, !form.department && styles.selectPlaceholder]}>
                      {form.department || "-- Chọn khoa --"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>hoặc</Text>
                  <View style={styles.divider} />
                </View>
              </>
            )}

            {/* NHẬP KHOA MỚI */}
            {!form.department && (
              <InputField
                label="Nhập khoa mới"
                icon="add-circle"
                required
                value={form.newDepartment}
                onChangeText={(v) => setForm({ ...form, newDepartment: v, department: "" })}
                placeholder="Ví dụ: Tim mạch, Da liễu, Nội khoa"
              />
            )}

            {/* HIỂN THỊ KHOA ĐÃ CHỌN */}
            {(form.department || form.newDepartment) && (
              <View style={styles.selectedDept}>
                <LinearGradient
                  colors={["#e0f2fe", "#f0f9ff"]}
                  style={styles.selectedDeptGradient}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#0ea5e9" />
                  <Text style={styles.selectedDeptText}>
                    Khoa đã chọn: <Text style={styles.selectedDeptName}>
                      {form.department || form.newDepartment}
                    </Text>
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* THÔNG TIN DỊCH VỤ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={22} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Thông Tin Dịch Vụ</Text>
            </View>

            <InputField
              label="Tên dịch vụ"
              icon="medical"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Khám nội tổng quát"
              required
            />

            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Giá dịch vụ (VNĐ)</Text>
                <Text style={styles.requiredDot}>•</Text>
              </View>
              <View style={styles.inputWrapper}>
                <View style={[styles.iconContainer, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
                  <Ionicons name="cash" size={20} color="#f59e0b" />
                </View>
                <TextInput
                  value={formatPrice(form.price)}
                  onChangeText={handlePriceChange}
                  placeholder="Nhập giá dịch vụ"
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
                {form.price && (
                  <Text style={styles.pricePreview}>
                    {Number(form.price).toLocaleString()} VNĐ
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Thời gian (phút)</Text>
                  <View style={styles.inputWrapper}>
                    <View style={[styles.iconContainer, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
                      <Ionicons name="time" size={20} color="#3b82f6" />
                    </View>
                    <TextInput
                      value={form.duration}
                      onChangeText={(v) => setForm({ ...form, duration: v.replace(/\D/g, "") })}
                      placeholder="30"
                      style={styles.input}
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                    />
                    <Text style={styles.unitText}>phút</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Mô tả dịch vụ</Text>
              <View style={styles.textAreaWrapper}>
                <View style={[styles.iconContainer, { backgroundColor: "rgba(236, 72, 153, 0.1)", marginTop: 4 }]}>
                  <Ionicons name="document-text" size={20} color="#ec4899" />
                </View>
                <TextInput
                  value={form.description}
                  onChangeText={(v) => setForm({ ...form, description: v })}
                  style={styles.textArea}
                  placeholder="Mô tả chi tiết về dịch vụ, quy trình thực hiện..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* NÚT TẠO DỊCH VỤ */}
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  <Text style={styles.createButtonText}>
                    Tạo Dịch Vụ Mới
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* LƯU Ý */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text style={styles.noteText}>
              Các trường có dấu <Text style={styles.requiredDot}>•</Text> là bắt buộc
            </Text>
          </View>
        </ScrollView>
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
                  setForm({ ...form, department: item, newDepartment: "" });
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
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  // ✅ HEADER ĐÃ FIX - SÁT TOP + CONTENT PADDING TOP 60
  header: {
    paddingTop: 60, // Cực nhỏ, StatusBar xử lý riêng
    paddingBottom: 20,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 4 : 2, // Padding nhỏ trong header
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
    elevation: 3,
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
  headerRight: {
    width: 44,
  },
  container: {
    paddingTop: 60, // ✅ ĐÚNG YÊU CẦU: CONTENT CÓ PADDING TOP 60
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 10,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  requiredDot: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  selectPlaceholder: {
    color: "#94a3b8",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
  },
  selectedDept: {
    marginTop: 8,
  },
  selectedDeptGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  selectedDeptText: {
    fontSize: 14,
    color: "#0ea5e9",
    fontWeight: "500",
  },
  selectedDeptName: {
    fontWeight: "700",
    color: "#0369a1",
  },
  pricePreview: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 8,
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  unitText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    marginLeft: 8,
  },
  textAreaWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  textArea: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 24,
    textAlignVertical: "top",
  },
  createButton: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  createButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100, 116, 139, 0.05)",
    marginTop: 20,
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
    maxHeight: "80%",
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
};