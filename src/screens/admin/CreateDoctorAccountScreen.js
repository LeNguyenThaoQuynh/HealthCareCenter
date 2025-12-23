import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, SHADOWS } = theme;
const { width } = Dimensions.get("window");

// InputField component di chuyển ra ngoài để tránh re-render
const InputField = ({ label, icon, required, ...props }) => (
  <View style={styles.fieldContainer}>
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {required && <Text style={styles.requiredDot}>•</Text>}
    </View>
    <View style={styles.inputContainer}>
      <View style={[styles.inputIconContainer, { backgroundColor: "rgba(79, 70, 229, 0.1)" }]}>
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

export default function CreateDoctorAccountScreen() {
  const navigation = useNavigation();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [serviceId, setServiceId] = useState(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [maxPatients, setMaxPatients] = useState("10");
  const [bio, setBio] = useState("");

  // Data
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  // Modal
  const [deptModal, setDeptModal] = useState(false);
  const [specModal, setSpecModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [searchDept, setSearchDept] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [searchRoom, setSearchRoom] = useState("");
  const modalAnim = useRef(new Animated.Value(0)).current;

  // 1. LẤY TẤT CẢ KHOA (department) TỪ services
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("department")
        .not("department", "is", null)
        .eq("is_active", true)
        .order("department");

      if (error) {
        console.error("Lỗi lấy khoa:", error);
        return;
      }

      const uniqueDepts = [
        ...new Set(data?.map((item) => item.department.trim()).filter(Boolean)),
      ];
      setDepartments(uniqueDepts.sort());
    };
    fetchDepartments();
  }, []);

  // 2. KHI CHỌN KHOA → LẤY TẤT CẢ CHUYÊN MÔN (name) CỦA KHOA ĐÓ
  useEffect(() => {
    const fetchSpecializations = async () => {
      if (!department) {
        setSpecializations([]);
        setSpecialization("");
        setServiceId(null);
        return;
      }

      const cleanDept = department.trim();

      const { data, error } = await supabase
        .from("services")
        .select("id, name, price")
        .eq("is_active", true)
        .or(`department.eq.${cleanDept},department.ilike.%${cleanDept}%`)
        .order("name");

      if (error || !data || data.length === 0) {
        console.log("Không tìm thấy chuyên môn cho khoa:", cleanDept);
        setSpecializations([]);
        return;
      }

      setSpecializations(data);
    };

    fetchSpecializations();
  }, [department]);

  // 3. LẤY PHÒNG TRỐNG
  useEffect(() => {
    const fetchRooms = async () => {
      if (!department) {
        setAvailableRooms([]);
        setRoomNumber("");
        return;
      }

      const { data } = await supabase
        .from("clinic_rooms")
        .select("room_number")
        .or(`department.eq.${department},department.is.null`)
        .is("doctor_id", null)
        .eq("is_active", true)
        .order("room_number");

      const rooms = data?.map((r) => r.room_number) || [];
      setAvailableRooms(rooms);

      if (roomNumber && !rooms.includes(roomNumber)) {
        setRoomNumber("");
        Alert.alert("Thông báo", "Phòng này đã được bác sĩ khác chọn!");
      }
    };
    fetchRooms();
  }, [department]);

  // Filter
  const filteredDepts = departments.filter((d) =>
    d.toLowerCase().includes(searchDept.toLowerCase())
  );
  const filteredSpecs = specializations.filter((s) =>
    s.name.toLowerCase().includes(searchSpec.toLowerCase())
  );
  const filteredRooms = availableRooms.filter((r) =>
    r.toLowerCase().includes(searchRoom.toLowerCase())
  );

  const getFloor = (room) => {
    const num = parseInt(room, 10);
    return isNaN(num) ? "" : `Tầng ${Math.floor(num / 100)}`;
  };

  const validate = () => {
    if (!fullName.trim())
      return Alert.alert("Lỗi", "Vui lòng nhập họ tên bác sĩ");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Alert.alert("Lỗi", "Email không hợp lệ");
    if (password.length < 6)
      return Alert.alert("Lỗi", "Mật khẩu ít nhất 6 ký tự");
    if (!department) return Alert.alert("Lỗi", "Vui lòng chọn khoa");
    if (!specialization) return Alert.alert("Lỗi", "Vui lòng chọn chuyên môn");
    if (!roomNumber) return Alert.alert("Lỗi", "Vui lòng chọn phòng khám");
    if (
      !experienceYears ||
      isNaN(experienceYears) ||
      Number(experienceYears) < 0
    )
      return Alert.alert("Lỗi", "Số năm kinh nghiệm không hợp lệ");
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;

    navigation.navigate("CreateDoctorSchedule", {
      doctorInfo: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        service_id: serviceId,
        department_name: department,
        specialization: specialization,
        experience_years: Number(experienceYears),
        room_number: roomNumber,
        max_patients_per_slot: Number(maxPatients || 10),
        bio: bio.trim() || null,
      },
    });
  };

  const openModal = (type) => {
    if (type === "dept") setDeptModal(true);
    if (type === "spec") setSpecModal(true);
    if (type === "room") setRoomModal(true);

    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setDeptModal(false);
      setSpecModal(false);
      setRoomModal(false);
      setSearchDept("");
      setSearchSpec("");
      setSearchRoom("");
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* StatusBar riêng biệt - KHÔNG có SafeAreaView để bỏ khoảng trống */}
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* HEADER - Bỏ paddingTop, sát mép màn hình */}
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
              <Ionicons name="person-add" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Tạo Tài Khoản Bác Sĩ</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Bước 1 • Thông tin & Phòng khám
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
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* THÔNG TIN CƠ BẢN */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={22} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Thông tin đăng nhập</Text>
            </View>
            
            <InputField
              label="Họ và tên"
              icon="person"
              value={fullName}
              onChangeText={setFullName}
              placeholder="BS. Nguyễn Văn A"
              required
            />
            
            <InputField
              label="Email"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="doctor@phongkham.com"
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />
            
            <InputField
              label="Mật khẩu"
              icon="lock-closed"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              required
            />
          </View>

          {/* THÔNG TIN CHUYÊN MÔN */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={22} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Thông tin chuyên môn</Text>
            </View>

            {/* KHOA LÀM VIỆC */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Khoa làm việc</Text>
                <Text style={styles.requiredDot}>•</Text>
              </View>
              <TouchableOpacity
                style={[styles.selectCard, department && styles.selectCardActive]}
                onPress={() => openModal("dept")}
                activeOpacity={0.7}
              >
                <View style={styles.selectCardLeft}>
                  <View style={[styles.selectIconContainer, { backgroundColor: "rgba(79, 70, 229, 0.1)" }]}>
                    <Ionicons
                      name="business"
                      size={20}
                      color={department ? "#4f46e5" : "#94a3b8"}
                    />
                  </View>
                  <View style={styles.selectTextContainer}>
                    <Text style={styles.selectLabel}>
                      {department || "Chọn khoa"}
                    </Text>
                    <Text style={styles.selectHint}>
                      Ví dụ: Tim mạch, Da liễu, Nội khoa
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* CHUYÊN MÔN CHÍNH */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Chuyên môn chính</Text>
                <Text style={styles.requiredDot}>•</Text>
              </View>
              <TouchableOpacity
                style={[styles.selectCard, specialization && styles.selectCardActive]}
                onPress={() => openModal("spec")}
                disabled={!department}
                activeOpacity={0.7}
              >
                <View style={styles.selectCardLeft}>
                  <View style={[styles.selectIconContainer, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
                    <Ionicons
                      name="medkit"
                      size={20}
                      color={specialization ? "#16a34a" : "#94a3b8"}
                    />
                  </View>
                  <View style={styles.selectTextContainer}>
                    <Text style={styles.selectLabel}>
                      {specialization || "Chọn chuyên môn"}
                    </Text>
                    <Text style={styles.selectHint}>
                      {department ? "Chọn từ danh sách" : "Chọn khoa trước"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* PHÒNG KHÁM */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Phòng khám</Text>
                <Text style={styles.requiredDot}>•</Text>
              </View>
              <TouchableOpacity
                style={[styles.selectCard, roomNumber && styles.selectCardActive]}
                onPress={() => openModal("room")}
                disabled={!department}
                activeOpacity={0.7}
              >
                <View style={styles.selectCardLeft}>
                  <View style={[styles.selectIconContainer, { backgroundColor: "rgba(249, 115, 22, 0.1)" }]}>
                    <Ionicons
                      name="home"
                      size={20}
                      color={roomNumber ? "#f97316" : "#94a3b8"}
                    />
                  </View>
                  <View style={styles.selectTextContainer}>
                    <Text style={styles.selectLabel}>
                      {roomNumber || (department ? "Chọn phòng trống" : "Chọn khoa trước")}
                    </Text>
                    {roomNumber && (
                      <Text style={styles.selectHint}>{getFloor(roomNumber)}</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* THÔNG TIN BỔ SUNG */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="options" size={22} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Thông tin bổ sung</Text>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <InputField
                  label="Số năm kinh nghiệm"
                  icon="briefcase"
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  placeholder="15"
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={styles.halfField}>
                <InputField
                  label="Bệnh nhân/ca"
                  icon="people"
                  value={maxPatients}
                  onChangeText={setMaxPatients}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Giới thiệu ngắn gọn</Text>
              <View style={styles.textAreaContainer}>
                <Ionicons
                  name="document-text"
                  size={22}
                  color="#4f46e5"
                  style={{ marginTop: 4 }}
                />
                <TextInput
                  style={styles.textAreaInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Chuyên gia Tim mạch hơn 15 năm kinh nghiệm..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          {/* NEXT BUTTON */}
          <TouchableOpacity 
            style={styles.nextButtonContainer} 
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                Tiếp tục • Thiết lập lịch làm việc
              </Text>
              <Ionicons name="arrow-forward-circle" size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* NOTE */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text style={styles.noteText}>
              Các trường có dấu <Text style={{ color: "#ef4444" }}>•</Text> là bắt buộc
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL */}
      <Modal
        visible={deptModal || specModal || roomModal}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient 
            colors={["#4f46e5", "#7c3aed"]}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <Ionicons 
                name={
                  deptModal ? "business" : 
                  specModal ? "medkit" : 
                  "home"
                } 
                size={24} 
                color="#FFF" 
              />
              <Text style={styles.modalTitle}>
                {deptModal
                  ? "Chọn khoa làm việc"
                  : specModal
                  ? "Chọn chuyên môn"
                  : "Chọn phòng khám"}
              </Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748b" style={{ marginRight: 10 }} />
            <TextInput
              placeholder={
                deptModal
                  ? "Tìm khoa..."
                  : specModal
                  ? "Tìm chuyên môn..."
                  : "Tìm phòng..."
              }
              value={
                deptModal ? searchDept : specModal ? searchSpec : searchRoom
              }
              onChangeText={
                deptModal
                  ? setSearchDept
                  : specModal
                  ? setSearchSpec
                  : setSearchRoom
              }
              style={styles.searchInput}
              placeholderTextColor="#94a3b8"
              selectionColor="#4f46e5"
            />
          </View>

          <FlatList
            data={
              deptModal
                ? filteredDepts
                : specModal
                ? filteredSpecs
                : filteredRooms
            }
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => {
              const displayText = deptModal
                ? item
                : specModal
                ? item.name
                : `${item} (${getFloor(item)})`;

              const isSelected = deptModal
                ? department === item
                : specModal
                ? specialization === item.name
                : roomNumber === item;

              return (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (deptModal) {
                      setDepartment(item);
                      setSpecialization("");
                      setServiceId(null);
                    } else if (specModal) {
                      setSpecialization(item.name);
                      setServiceId(item.id);
                    } else {
                      setRoomNumber(item);
                    }
                    if (!specModal) closeModal();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemContent}>
                    <View style={[
                      styles.modalItemIconContainer,
                      { 
                        backgroundColor: isSelected ? 
                          (deptModal ? "rgba(79, 70, 229, 0.1)" : 
                           specModal ? "rgba(34, 197, 94, 0.1)" : 
                           "rgba(249, 115, 22, 0.1)") 
                          : "#f8fafc" 
                      }
                    ]}>
                      <Ionicons 
                        name={
                          deptModal ? "business-outline" : 
                          specModal ? "medkit-outline" : 
                          "home-outline"
                        } 
                        size={18} 
                        color={isSelected ? 
                          (deptModal ? "#4f46e5" : 
                           specModal ? "#16a34a" : 
                           "#f97316") 
                          : "#64748b"} 
                      />
                    </View>
                    <Text style={styles.modalItemText}>{displayText}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.modalCheckContainer}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={
                          deptModal ? "#4f46e5" : 
                          specModal ? "#16a34a" : 
                          "#f97316"
                        }
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.modalList}
          />
        </Animated.View>
      </Modal>
    </View>
  );
}

/* ================= STYLES - HEADER FIXED ================= */
const styles = {
  // ✅ HEADER SÁT MÉP MÀN HÌNH - KHÔNG CÓ KHOẢNG TRỐNG
  header: {
    paddingTop: 60, // ✅ Bỏ paddingTop hoàn toàn
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
    paddingTop: Platform.OS === "ios" ? 8 : 12, // ✅ Chỉ padding nhỏ cho nội dung
    paddingBottom: 8,
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
    gap: 8,
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
    padding: 20,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
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
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  inputIconContainer: {
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
  selectCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  selectCardActive: {
    borderColor: "#4f46e5",
    backgroundColor: "rgba(79, 70, 229, 0.03)",
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
  rowFields: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  textAreaContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  textAreaInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 24,
    textAlignVertical: "top",
  },
  nextButtonContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  nextButtonGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
    flex: 1,
    marginRight: 12,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100, 116, 139, 0.05)",
    marginTop: 20,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    margin: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 4,
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
  modalItemIconContainer: {
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
  modalCheckContainer: {
    marginLeft: 12,
  },
};