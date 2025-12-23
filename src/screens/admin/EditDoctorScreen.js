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
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation, useRoute } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, SHADOWS } = theme;
const { width } = Dimensions.get("window");

const EditDoctorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorId } = route.params || {};

  // Form state
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [serviceId, setServiceId] = useState(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [maxPatients, setMaxPatients] = useState("5");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Original values
  const [originalDepartment, setOriginalDepartment] = useState("");
  const [originalRoomNumber, setOriginalRoomNumber] = useState("");

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

  // Load doctor data
  useEffect(() => {
    if (doctorId) fetchDoctor();
  }, [doctorId]);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select(`
          name,
          specialization,
          experience_years,
          room_number,
          department_name,
          max_patients_per_slot,
          bio,
          user_profiles!inner(full_name)
        `)
        .eq("id", doctorId)
        .single();

      if (error) throw error;

      setFullName(data.user_profiles?.full_name || data.name || "");
      setDepartment(data.department_name || "");
      setOriginalDepartment(data.department_name || "");
      setSpecialization(data.specialization || "");
      setRoomNumber(data.room_number || "");
      setOriginalRoomNumber(data.room_number || "");
      setExperienceYears(String(data.experience_years || ""));
      setMaxPatients(String(data.max_patients_per_slot || 5));
      setBio(data.bio || "");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải thông tin bác sĩ");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("department")
        .not("department", "is", null)
        .eq("is_active", true)
        .order("department");

      if (error) return;

      const unique = [...new Set(data.map(d => d.department.trim()))].sort();
      setDepartments(unique);
    };
    fetchDepartments();
  }, []);

  // Load specializations
  useEffect(() => {
    const fetchSpecializations = async () => {
      if (!department) {
        setSpecializations([]);
        return;
      }

      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .eq("is_active", true)
        .eq("department", department.trim())
        .order("name");

      if (error || !data) {
        setSpecializations([]);
        return;
      }

      setSpecializations(data);

      if (specialization && !data.some(s => s.name === specialization)) {
        setSpecialization("");
        setServiceId(null);
      }
    };

    fetchSpecializations();
  }, [department]);

  // Load available rooms (bao gồm phòng hiện tại của bác sĩ)
  useEffect(() => {
    const fetchRooms = async () => {
      if (!department) {
        setAvailableRooms([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("clinic_rooms")
          .select("room_number")
          .eq("is_active", true)
          .or(`department.eq.${department},department.is.null`)
          .or(`doctor_id.is.null,doctor_id.eq.${doctorId}`) // Giữ phòng của bác sĩ này
          .order("room_number");

        if (error) throw error;

        const rooms = data?.map(r => r.room_number) || [];
        setAvailableRooms(rooms);

        if (roomNumber && !rooms.includes(roomNumber)) {
          if (department !== originalDepartment) {
            Alert.alert(
              "Thông báo",
              "Phòng hiện tại không còn thuộc khoa mới. Vui lòng chọn phòng phù hợp."
            );
          }
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
      }
    };

    fetchRooms();
  }, [department, doctorId]);

  // Filter lists
  const filteredDepts = departments.filter(d =>
    d.toLowerCase().includes(searchDept.toLowerCase())
  );
  const filteredSpecs = specializations.filter(s =>
    s.name.toLowerCase().includes(searchSpec.toLowerCase())
  );
  const filteredRooms = availableRooms.filter(r =>
    r.toLowerCase().includes(searchRoom.toLowerCase())
  );

  const getFloor = (room) => {
    const num = parseInt(room.replace(/\D/g, ""), 10);
    return isNaN(num) ? "" : `Tầng ${Math.floor(num / 100)}`;
  };

  const validate = () => {
    if (!fullName.trim()) return Alert.alert("Lỗi", "Vui lòng nhập họ tên");
    if (!department) return Alert.alert("Lỗi", "Vui lòng chọn khoa");
    if (!specialization) return Alert.alert("Lỗi", "Vui lòng chọn chuyên môn");
    if (!roomNumber) return Alert.alert("Lỗi", "Vui lòng chọn phòng khám");
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const updates = {
        name: fullName.trim(),
        specialization,
        department_name: department,
        room_number: roomNumber,
        experience_years: experienceYears ? parseInt(experienceYears) : null,
        max_patients_per_slot: parseInt(maxPatients) || 5,
        bio: bio.trim() || null,
      };

      const { error: docError } = await supabase
        .from("doctors")
        .update(updates)
        .eq("id", doctorId);

      if (docError) throw docError;

      // Update user_profiles full_name if exists
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", doctorId)
        .maybeSingle();

      if (profile) {
        await supabase
          .from("user_profiles")
          .update({ full_name: fullName.trim() })
          .eq("id", doctorId);
      }

      // Update clinic_rooms doctor_id if room changed
      if (roomNumber !== originalRoomNumber) {
        if (originalRoomNumber) {
          await supabase
            .from("clinic_rooms")
            .update({ doctor_id: null })
            .eq("room_number", originalRoomNumber);
        }

        await supabase
          .from("clinic_rooms")
          .update({ doctor_id: doctorId })
          .eq("room_number", roomNumber);
      }

      Alert.alert("Thành công", "Cập nhật thông tin bác sĩ thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải thông tin bác sĩ...</Text>
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
              <Ionicons name="person-circle" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Chỉnh Sửa Bác Sĩ</Text>
            </View>
            <Text style={styles.headerSubtitle}>Cập nhật thông tin chuyên môn</Text>
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
              <View style={styles.saveButtonContent}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Lưu</Text>
              </View>
            )}
          </TouchableOpacity>
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
              <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            </View>
            
            <InputField
              label="Họ và tên"
              icon="person"
              value={fullName}
              onChangeText={setFullName}
              placeholder="BS. Nguyễn Văn A"
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
                    {department && (
                      <Text style={styles.selectHint}>Khoa hiện tại</Text>
                    )}
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
                  onChangeText={(t) => setExperienceYears(t.replace(/[^0-9]/g, ""))}
                  placeholder="15"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <InputField
                  label="Bệnh nhân/ca"
                  icon="people"
                  value={maxPatients}
                  onChangeText={(t) => setMaxPatients(t.replace(/[^0-9]/g, "") || "5")}
                  placeholder="5"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Giới thiệu</Text>
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
                  placeholder="Mô tả kinh nghiệm, chuyên môn của bác sĩ..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          {/* GHI CHÚ */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={18} color="#64748b" />
            <Text style={styles.noteText}>
              Các trường có dấu <Text style={{ color: "#ef4444" }}>•</Text> là bắt buộc
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL CHUNG */}
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
                ? filteredSpecs.map(s => s.name)
                : filteredRooms
            }
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => {
              const displayText = deptModal
                ? item
                : specModal
                ? item
                : `${item} (${getFloor(item)})`;

              const isSelected = deptModal
                ? department === item
                : specModal
                ? specialization === item
                : roomNumber === item;

              return (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (deptModal) setDepartment(item);
                    else if (specModal) {
                      const selectedSpec = specializations.find(s => s.name === item);
                      setSpecialization(item);
                      setServiceId(selectedSpec?.id);
                    } else setRoomNumber(item);
                    closeModal();
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
};

// InputField component
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

/* ================= STYLES ================= */
const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
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
  saveButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    paddingTop: 60, // ✅ CONTENT CÓ PADDING TOP 60
    paddingHorizontal: 20,
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
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100, 116, 139, 0.05)",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.1)",
    gap: 8,
  },
  noteText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginLeft: 8,
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

export default EditDoctorScreen;