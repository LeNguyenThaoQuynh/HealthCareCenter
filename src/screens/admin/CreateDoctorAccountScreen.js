import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOWS,
} = theme;

export default function CreateDoctorAccountScreen() {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [maxPatients, setMaxPatients] = useState("5");
  const [bio, setBio] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [searchDept, setSearchDept] = useState("");

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from("departments").select("id, name").order("name");
      if (error) Alert.alert("Lỗi", "Không thể tải danh sách khoa");
      else {
        setDepartments(data || []);
      }
    };
    fetchDepartments();
  }, []);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchDept.toLowerCase())
  );

  const selectedDeptName = departments.find((d) => d.id === Number(departmentId))?.name || "Chọn khoa";

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isValidPassword = (p) => p.length >= 6;

  const handleNext = () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !departmentId) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Email không hợp lệ", "Vui lòng nhập đúng định dạng email");
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    navigation.navigate("Lịch làm việc", {
      doctorInfo: {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        specialization: specialization.trim(),
        experienceYears: experienceYears ? Number(experienceYears) : 0,
        roomNumber: roomNumber.trim(),
        maxPatients: maxPatients ? Number(maxPatients) : 5,
        bio: bio.trim(),
        departmentId: Number(departmentId),
      },
    });
  };

  const openModal = () => {
    setDeptModalVisible(true);
    Animated.spring(modalAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.spring(modalAnim, { toValue: 300, friction: 8, useNativeDriver: true }).start(() =>
      setDeptModalVisible(false)
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" />

      {/* HEADER SIÊU ĐẸP */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Tạo tài khoản bác sĩ</Text>
          <Text style={styles.headerSubtitle}>Bước 1/2 • Thông tin cơ bản</Text>
        </View>
        <View style={{ width: 50 }} />
      </LinearGradient>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        opacity={fadeAnim}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {/* INPUTS */}
          <InputField label="Họ và tên *" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Nguyễn Văn A" />
          <InputField label="Email *" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="doctor@example.com" keyboardType="email-address" autoCapitalize="none" />
          <InputField label="Mật khẩu *" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          {/* KHOA */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Khoa *</Text>
            <TouchableOpacity style={styles.dropdown} onPress={openModal}>
              <Ionicons name="business-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.dropdownText, departmentId ? { color: COLORS.textPrimary } : {}]}>
                {selectedDeptName}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <InputField label="Chuyên môn" icon="medkit-outline" value={specialization} onChangeText={setSpecialization} placeholder="Tim mạch, Nội khoa..." />
          <InputField label="Số năm kinh nghiệm" icon="time-outline" value={experienceYears} onChangeText={setExperienceYears} placeholder="5" keyboardType="numeric" />
          <InputField label="Số phòng" icon="home-outline" value={roomNumber} onChangeText={setRoomNumber} placeholder="202" />
          <InputField label="Số bệnh nhân tối đa/ca" icon="people-outline" value={maxPatients} onChangeText={setMaxPatients} placeholder="5" keyboardType="numeric" />

          {/* BIO */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiểu sử (giới thiệu)</Text>
            <View style={styles.textArea}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.primary} style={{ marginTop: 12 }} />
              <TextInput
                style={styles.textAreaInput}
                placeholder="Giới thiệu ngắn gọn về bác sĩ..."
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* NÚT TIẾP TỤC */}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
            <LinearGradient colors={GRADIENTS.primaryButton} style={styles.nextBtnGradient}>
              <Text style={styles.nextBtnText}>Tiếp tục → Chọn lịch làm việc</Text>
              <Ionicons name="arrow-forward" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>

      {/* MODAL CHỌN KHOA */}
      <Modal visible={deptModalVisible} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.modal, { transform: [{ translateY: modalAnim }] }]}>
          <LinearGradient colors={GRADIENTS.header} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn khoa</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalSearch}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              placeholder="Tìm khoa..."
              value={searchDept}
              onChangeText={setSearchDept}
              style={styles.modalSearchInput}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            {filteredDepts.length === 0 ? (
              <Text style={styles.noResult}>Không tìm thấy khoa</Text>
            ) : (
              filteredDepts.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setDepartmentId(String(dept.id));
                    setSearchDept("");
                    closeModal();
                  }}
                >
                  <Text style={styles.modalItemText}>{dept.name}</Text>
                  {departmentId === String(dept.id) && (
                    <Ionicons name="checkmark" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// INPUT COMPONENT ĐẸP + NHỎ GỌN
const InputField = ({ label, icon, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <TextInput style={styles.input} placeholderTextColor={COLORS.textLight} {...props} />
    </View>
  </View>
);

// STYLE ĐẸP – NHỎ GỌN – ĐỒNG NHẤT
const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: FONT_WEIGHT.bold, color: "#FFF" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },

  scrollContent: { padding: SPACING.xl, paddingTop: SPACING.lg },

  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: 15, fontWeight: FONT_WEIGHT.medium, color: COLORS.textPrimary, marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 54,
    ...SHADOWS.card,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.textPrimary },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 54,
    ...SHADOWS.card,
  },
  dropdownText: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.textSecondary },

  textArea: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    minHeight: 100,
    ...SHADOWS.card,
  },
  textAreaInput: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.textPrimary },

  nextBtn: { marginTop: SPACING.xl, borderRadius: BORDER_RADIUS.xl, overflow: "hidden", ...SHADOWS.large },
  nextBtnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16 },
  nextBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF", marginRight: 8 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    maxHeight: "80%",
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },

  modalSearch: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
    backgroundColor: "#F8FAFC",
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  modalSearchInput: { flex: 1, marginLeft: 12, fontSize: 16 },

  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    marginHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemText: { fontSize: 16, color: COLORS.textPrimary },
  noResult: { textAlign: "center", padding: 20, color: COLORS.textSecondary, fontSize: 16 },
};